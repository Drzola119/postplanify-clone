/**
 * video-gen/providers/index.ts
 * Provider registry — mirrors the pattern implied by image-gen/providers.
 * Add new providers here; one import + one registry entry is all it takes.
 */
import { seedance2FastProvider, seedance2Provider } from "./seedance-2-fal";
import { higgsfieldProvider } from "./higgsfield";
import type { VideoGenProvider } from "./base";
import type { VideoProviderId } from "../types";

const PROVIDERS: Record<VideoProviderId, VideoGenProvider | null> = {
  "seedance-2-fast": seedance2FastProvider,
  "seedance-2": seedance2Provider,
  // Stubs — will be wired in M2
  "veo-3.1-lite": null,
  "veo-3.1": null,
  "gemini-omni-flash": null,
  // Higgsfield (image-to-video only) — wired but NOT in the default
  // fallback chain because it requires a sourceImageUrl; callers must
  // pick it explicitly via the `provider` field.
  "higgsfield": higgsfieldProvider,
};

export function getProviderInstance(
  id: VideoProviderId
): VideoGenProvider | null {
  return PROVIDERS[id] ?? null;
}

export function getAvailableProviders(): VideoProviderId[] {
  return (Object.keys(PROVIDERS) as VideoProviderId[]).filter(
    (id) => PROVIDERS[id] !== null
  );
}
