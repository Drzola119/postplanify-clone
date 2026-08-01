/**
 * video-gen/providers/seedance-2-fal.ts
 * Seedance 2.0 via fal.ai queue API — both standard and fast tiers.
 */
import "server-only";
import { createLogger } from "../../log";
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

function getFalModelSlug(fast: boolean, mode: VideoGenerateInput["mode"]): string {
  const tier = fast ? "t2v-fast" : "standard";
  // Both image-to-video and keyframe-to-video go through the i2v tiers —
  // keyframe mode is a first-and-last-frame extension of the same endpoint.
  if (mode === "image-to-video" || mode === "keyframe-to-video") {
    return fast ? "fal-ai/seedance-2.0-i2v-fast" : "fal-ai/seedance-2.0-i2v";
  }
  return fast ? `fal-ai/seedance-2.0-${tier}` : "fal-ai/seedance-2.0";
}

function getFalApiKey(): string {
  const key = process.env.FAL_API_KEY?.trim();
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

      // Keyframe-to-keyframe: send both the first and last frame so the
      // model can interpolate the camera motion between them. fal.ai's
      // Seedance i2v endpoint accepts `end_image_url` natively for this.
      if (input.mode === "keyframe-to-video") {
        if (!input.sourceImageUrl || !input.endImageUrl) {
          throw new Error(
            "keyframe-to-video requires both sourceImageUrl and endImageUrl"
          );
        }
        body.image_url = input.sourceImageUrl;
        body.end_image_url = input.endImageUrl;
      }

      // Native audio generation. The narration instruction is embedded in
      // `prompt` by the caller (see real-estate/motion-prompt.ts); this
      // flag tells the model to actually synthesise the audio. When
      // false or unset, the model generates silent video (default).
      if (input.generateAudio) {
        body.generate_audio = true;
      }

      logger.info("fal.ai submit", { modelSlug, aspectRatio, mode: input.mode });

      const { request_id } = await falQueuePost(modelSlug, body);

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
      return "pending";
    },

    async fetchResult(providerJobId: string) {
      const modelSlug = jobModelMap.get(providerJobId);
      if (!modelSlug) throw new Error(`No model slug for job ${providerJobId}`);

      const data = await falQueueResult(modelSlug, providerJobId);

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
