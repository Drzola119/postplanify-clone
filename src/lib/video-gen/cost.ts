/**
 * video-gen/cost.ts
 * Cost estimation for video generation — mirrors image-gen/cost.ts.
 * Tracks seconds + cost (not just a flat count) because duration varies.
 */
import { VIDEO_PROVIDER_PRICING } from "./types";
import type { VideoProviderId, VideoAspectRatio } from "./types";

export function estimateVideoCostUsd(
  provider: VideoProviderId,
  durationSec: number,
  _aspectRatio: VideoAspectRatio
): number {
  const pricing = VIDEO_PROVIDER_PRICING[provider];
  const computed = pricing.costPerSecUsd * durationSec;
  return Math.max(computed, pricing.flatMinCostUsd);
}

/**
 * Estimate total cost for a multi-aspect-ratio, multi-clip job before it starts.
 * Used by the wizard to surface estimated credit usage to the user.
 */
export function estimateJobCostUsd(
  provider: VideoProviderId,
  durationSec: number,
  aspectRatios: VideoAspectRatio[]
): { perClipUsd: number; totalUsd: number } {
  const perClipUsd = estimateVideoCostUsd(provider, durationSec, aspectRatios[0]);
  // For Cartoon M1: single clip, potentially multiple aspect ratio renders
  // Cost is per generation call — each aspect ratio is a separate provider call.
  const totalUsd = perClipUsd * aspectRatios.length;
  return { perClipUsd, totalUsd };
}
