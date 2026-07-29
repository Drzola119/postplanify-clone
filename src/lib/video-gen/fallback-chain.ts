/**
 * video-gen/fallback-chain.ts
 * Mirror of src/lib/image-gen/fallback-chain.ts for video providers.
 */
import type { VideoProviderId, VideoProviderIdOrAuto } from "./types";

/**
 * Default fallback chain — cheapest/fastest first, most capable last.
 * veo-3.1 (full premium) is excluded from "auto" to avoid surprise cost spikes;
 * users must explicitly select it.
 */
export const DEFAULT_VIDEO_FALLBACK_CHAIN: VideoProviderId[] = [
  "seedance-2-fast",
  "veo-3.1-lite",
  "seedance-2",
  // "veo-3.1" — gated behind explicit provider selection; not in auto chain
];

/**
 * Resolves the ordered list of providers to try for a given request.
 * "auto" expands to the default chain; explicit selection uses only that provider.
 */
export function resolveFallbackChain(
  requested: VideoProviderIdOrAuto
): VideoProviderId[] {
  if (requested === "auto") {
    return DEFAULT_VIDEO_FALLBACK_CHAIN;
  }
  return [requested];
}
