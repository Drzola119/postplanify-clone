/**
 * video-gen/whiteboard/clip-matrix.ts
 * Pure resolution helpers for the Whiteboard workflow.
 * Decides (a) which concrete provider to use given an "auto" or explicit
 * provider + a quality preference, and (b) how many clips of what
 * per-clip duration to generate for a target total duration.
 *
 * No I/O. No async. Safe to import on both client and server.
 */

import type { VideoProviderId, VideoProviderIdOrAuto } from "../types";

export interface ClipSpec {
  provider: VideoProviderId;
  clipDurationSec: number;
  clipCount: number;
  actualTotalSec: number;
}

/**
 * Max clip duration per provider (seconds). The whiteboard workflow
 * generates `clipCount` clips of `clipDurationSec` each, then concatenates
 * them in M3 via FFmpeg concat.
 *
 * Source: provider model limits as of 2026-07-30. Re-verify before
 * bumping any of these — exceeding the provider's max clip length
 * causes the API to reject the request.
 */
const PROVIDER_MAX_CLIP_SEC: Record<VideoProviderId, number> = {
  "seedance-2-fast": 5,
  "seedance-2": 8,
  "gemini-omni-flash": 8,
  "veo-3.1-lite": 8,
  "veo-3.1": 10,
  "higgsfield": 5,
};

/**
 * Resolve "auto" to a concrete provider. An explicit provider is returned
 * unchanged (the `quality` preference is ignored in that case — it only
 * disambiguates the "auto" value).
 *
 *   auto + budget  → seedance-2-fast (cheapest, fastest)
 *   auto + quality → veo-3.1       (highest fidelity)
 *   explicit       → unchanged
 */
export function resolveProvider(
  provider: VideoProviderIdOrAuto,
  quality: "budget" | "quality"
): VideoProviderId {
  if (provider !== "auto") return provider;
  return quality === "quality" ? "veo-3.1" : "seedance-2-fast";
}

/**
 * Compute how many clips of what duration to generate for a target total.
 * Always rounds UP so the actual rendered video is `>=` the requested
 * duration (a 30s request with 5s clips = 6 clips = 30s exactly; a 30s
 * request with 8s clips = 4 clips = 32s).
 */
export function resolveClipSpec(
  provider: VideoProviderId,
  targetTotalSec: 30 | 60
): ClipSpec {
  const clipDurationSec = PROVIDER_MAX_CLIP_SEC[provider];
  const clipCount = Math.ceil(targetTotalSec / clipDurationSec);
  const actualTotalSec = clipCount * clipDurationSec;
  return { provider, clipDurationSec, clipCount, actualTotalSec };
}
