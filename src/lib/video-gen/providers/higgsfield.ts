/**
 * video-gen/providers/higgsfield.ts
 *
 * Higgsfield Cloud REST API adapter. Exposes one provider
 * (`higgsfield`) backed by the `higgsfield-ai/dop/turbo` image-to-video
 * model — the cheapest entry in the catalog (6.5 platform credits per 5s
 * clip) and the only one whose endpoints are documented in this account.
 *
 * As of 2026-07-30 every video model in the Higgsfield public catalog is
 * image-to-video; there is no text-to-video endpoint. Callers that pick
 * this provider must supply `sourceImageUrl` — submitting a text-to-video
 * request throws a clear error so the router falls back to the next
 * provider in the chain.
 *
 * API contract (verified 2026-07-30):
 *   - Base URL: https://platform.higgsfield.ai
 *   - Auth: `Authorization: Key {API_KEY_ID}:{API_KEY_SECRET}` (literal "Key" prefix, not Bearer)
 *   - Submit: POST {base}/{modelSlug}      body: { image_url, prompt, duration }
 *   - Poll:   GET  {base}/requests/{id}/status
 *   - Complete response includes `video.url` (the signed CDN URL).
 *
 * Cost tracking: pricing is set in types.ts. The flat minimum is conservative
 * — when the catalog says "2 credits" we charge a proportional USD floor so
 * we never bill under the actual provider cost.
 */
import "server-only";
import { createLogger } from "../../log";
import type { VideoGenProvider } from "./base";
import type { VideoGenerateInput, VideoAspectRatio } from "../types";
import { estimateVideoCostUsd } from "../cost";

const logger = createLogger("video-gen:higgsfield");

const BASE_URL = "https://platform.higgsfield.ai";
const MODEL_SLUG = "higgsfield-ai/dop/turbo";

/**
 * Aspect ratio strings are passed unchanged to Higgsfield — verified in
 * the `/models` listing that all five ratios we expose are accepted.
 */
const ASPECT_RATIO_MAP: Record<VideoAspectRatio, string> = {
  "9:16": "9:16",
  "1:1": "1:1",
  "16:9": "16:9",
  "4:3": "4:3",
  "3:4": "3:4",
  "21:9": "21:9",
};

function getHiggsfieldApiKey(): string {
  const key = process.env.HIGGSFIELD_API_KEY?.trim();
  if (!key) throw new Error("HIGGSFIELD_API_KEY is not configured");
  return key;
}

function authHeader(): string {
  return `Key ${getHiggsfieldApiKey()}`;
}

async function hfPost(
  body: Record<string, unknown>
): Promise<{ request_id: string }> {
  const res = await fetch(`${BASE_URL}/${MODEL_SLUG}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Higgsfield submit failed ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { request_id?: string };
  if (!data.request_id) {
    throw new Error(`Higgsfield submit missing request_id: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return { request_id: data.request_id };
}

interface HiggsfieldStatus {
  status: "queued" | "in_progress" | "completed" | "failed" | "nsfw";
  request_id: string;
  video?: { url: string };
  error?: string;
}

async function hfStatus(requestId: string): Promise<HiggsfieldStatus> {
  const res = await fetch(
    `${BASE_URL}/requests/${requestId}/status`,
    {
      headers: {
        Authorization: authHeader(),
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Higgsfield status failed ${res.status}: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as HiggsfieldStatus;
}

export const higgsfieldProvider: VideoGenProvider = {
  id: "higgsfield",
  displayName: "Higgsfield DoP Turbo",

  async submit(input: VideoGenerateInput): Promise<string> {
    if (!input.sourceImageUrl) {
      // Every video model in the Higgsfield catalog is image-to-video.
      // Throw so the router falls back to the next provider in the chain.
      throw new Error(
        "Higgsfield requires sourceImageUrl (image-to-video only). Set mode='image-to-video' and provide a style key image."
      );
    }

    const aspectRatio = ASPECT_RATIO_MAP[input.aspectRatios[0]] ?? "16:9";

    const body: Record<string, unknown> = {
      image_url: input.sourceImageUrl,
      prompt: input.prompt,
      duration: input.durationSec,
    };

    // Higgsfield accepts aspect_ratio as a hint but ultimately derives it
    // from the source image — we still pass it for forward compatibility.
    body.aspect_ratio = aspectRatio;

    logger.info("Higgsfield submit", {
      modelSlug: MODEL_SLUG,
      aspectRatio,
      durationSec: input.durationSec,
    });

    const { request_id } = await hfPost(body);
    return request_id;
  },

  async pollStatus(
    providerJobId: string
  ): Promise<"pending" | "complete" | "failed"> {
    const result = await hfStatus(providerJobId);
    if (result.status === "completed") return "complete";
    if (result.status === "failed" || result.status === "nsfw") return "failed";
    return "pending";
  },

  async fetchResult(providerJobId: string) {
    const result = await hfStatus(providerJobId);
    if (result.status !== "completed" || !result.video?.url) {
      throw new Error(
        `Higgsfield result not available (status=${result.status}): ${result.error ?? "unknown"}`
      );
    }

    // Higgsfield doesn't echo back resolution/duration in the status payload
    // — fall back to the platform's standard 5s/1280x720/16:9 defaults.
    return {
      videoUrl: result.video.url,
      durationSec: 5,
      width: 1280,
      height: 720,
      model: MODEL_SLUG,
    };
  },

  estimateCostUsd(durationSec: number, aspectRatio: VideoAspectRatio): number {
    return estimateVideoCostUsd("higgsfield", durationSec, aspectRatio);
  },
};
