/**
 * video-gen/providers/seedance-2-fal.ts
 * Seedance 2.0 via fal.ai queue API — both standard and fast tiers.
 *
 * fal.ai async queue pattern:
 *   POST /queue/fal-ai/seedance-2.0-{variant}/requests -> { request_id }
 *   GET  /queue/fal-ai/seedance-2.0-{variant}/requests/{id}/status
 *   GET  /queue/fal-ai/seedance-2.0-{variant}/requests/{id}
 *
 * Docs: https://fal.ai/models/fal-ai/seedance-2.0-api
 * IMPORTANT: Verify exact model slugs + API shape against live fal.ai docs at build time.
 */
import "server-only";
import { createLogger } from "../../logging";
import { getServerConfig } from "../../security/server-config";
import type { VideoGenProvider } from "./base";
import type { VideoGenerateInput, VideoAspectRatio } from "../types";
import { estimateVideoCostUsd } from "../cost";

const logger = createLogger("video-gen:seedance-2-fal");

/** Map our aspect ratio strings to the fal.ai parameter format */
const ASPECT_RATIO_MAP: Record<VideoAspectRatio, string> = {
  "9:16": "9:16",
  "1:1": "1:1",
  "16:9": "16:9",
  "4:3": "4:3",
  "3:4": "3:4",
  "21:9": "21:9",
};

/**
 * Returns the fal.ai model slug for the given variant.
 * Verify these slugs at https://fal.ai/models before deploying.
 */
function getFalModelSlug(fast: boolean, mode: VideoGenerateInput["mode"]): string {
  const tier = fast ? "t2v-fast" : "standard";
  if (mode === "image-to-video") {
    // Seedance image-to-video endpoint (verify slug against fal docs)
    return fast ? "fal-ai/seedance-2.0-i2v-fast" : "fal-ai/seedance-2.0-i2v";
  }
  // Text-to-video
  return fast ? `fal-ai/seedance-2.0-${tier}` : "fal-ai/seedance-2.0";
}

function getFalApiKey(): string {
  const config = getServerConfig();
  const key = config.FAL_API_KEY;
  if (!key) throw new Error("FAL_API_KEY is not configured");
  return key;
}

async function falQueuePost(
  modelSlug: string,
  body: Record<string, unknown>
): Promise<{ request_id: string }> {
  const key = getFalApiKey();
  const res = await fetch(`https://queue.fal.run/${modelSlug}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal.ai queue POST failed ${res.status}: ${text}`);
  }

  return res.json();
}

async function falQueueStatus(
  modelSlug: string,
  requestId: string
): Promise<{ status: string; logs?: unknown[] }> {
  const key = getFalApiKey();
  const res = await fetch(
    `https://queue.fal.run/${modelSlug}/requests/${requestId}/status`,
    {
      headers: { Authorization: `Key ${key}` },
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal.ai status check failed ${res.status}: ${text}`);
  }

  return res.json();
}

async function falQueueResult(
  modelSlug: string,
  requestId: string
): Promise<Record<string, unknown>> {
  const key = getFalApiKey();
  const res = await fetch(
    `https://queue.fal.run/${modelSlug}/requests/${requestId}`,
    {
      headers: { Authorization: `Key ${key}` },
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal.ai result fetch failed ${res.status}: ${text}`);
  }

  return res.json();
}

/** Internal state: maps requestId -> modelSlug so pollStatus/fetchResult can use it */
const jobModelMap = new Map<string, string>();

function makeSeedanceProvider(fast: boolean): VideoGenProvider {
  const id = fast ? ("seedance-2-fast" as const) : ("seedance-2" as const);

  return {
    id,
    displayName: fast ? "Seedance 2 Fast" : "Seedance 2 Standard",

    async submit(input: VideoGenerateInput): Promise<string> {
      const modelSlug = getFalModelSlug(fast, input.mode);
      const aspectRatio = ASPECT_RATIO_MAP[input.aspectRatios[0]] ?? "16:9";

      const body: Record<string, unknown> = {
        prompt: input.prompt,
        duration: input.durationSec,
        aspect_ratio: aspectRatio,
      };

      if (input.mode === "image-to-video" && input.sourceImageUrl) {
        body.image_url = input.sourceImageUrl;
      }

      logger.info("fal.ai submit", { modelSlug, aspectRatio, mode: input.mode });

      const { request_id } = await falQueuePost(modelSlug, body);

      // Store so we can look it up during poll/fetch
      jobModelMap.set(request_id, modelSlug);

      return request_id;
    },

    async pollStatus(
      providerJobId: string
    ): Promise<"pending" | "complete" | "failed"> {
      const modelSlug = jobModelMap.get(providerJobId);
      if (!modelSlug) {
        logger.warn("No model slug found for job — treating as failed", {
          providerJobId,
        });
        return "failed";
      }

      const result = await falQueueStatus(modelSlug, providerJobId);
      const status = result.status as string;

      if (status === "COMPLETED") return "complete";
      if (status === "FAILED" || status === "CANCELLED") return "failed";
      return "pending"; // IN_QUEUE, IN_PROGRESS
    },

    async fetchResult(providerJobId: string) {
      const modelSlug = jobModelMap.get(providerJobId);
      if (!modelSlug) throw new Error(`No model slug for job ${providerJobId}`);

      const data = await falQueueResult(modelSlug, providerJobId);

      // fal.ai Seedance response shape (verify against live API):
      // { video: { url, duration, width, height }, ... }
      const video = data.video as {
        url: string;
        duration?: number;
        width?: number;
        height?: number;
      };

      if (!video?.url) {
        throw new Error("fal.ai result missing video.url");
      }

      return {
        videoUrl: video.url,
        durationSec: video.duration ?? 5,
        width: video.width ?? 1280,
        height: video.height ?? 720,
        model: modelSlug,
      };
    },

    estimateCostUsd(durationSec: number, aspectRatio: VideoAspectRatio): number {
      return estimateVideoCostUsd(id, durationSec, aspectRatio);
    },
  };
}

export const seedance2FastProvider = makeSeedanceProvider(true);
export const seedance2Provider = makeSeedanceProvider(false);
