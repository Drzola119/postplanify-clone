import "server-only";
import type { AspectRatioKey, ProviderId } from "./types";
import { ASPECT_RATIOS, getAspectRatio } from "./types";

/**
 * Central resolution / token-ceiling enforcement for the image-gen router.
 *
 * Policy:
 *   - Three of the four providers (Gemini Flash Lite Image, Gemini 2.5
 *     Flash Image, GPT Image 2) are HARD-CAPPED at 1K-class output: no
 *     edge longer than `MAX_NON_IDEOGRAM_EDGE_PX = 1024`.
 *   - Ideogram 4 is the sole provider allowed to render up to 2K — its
 *     native hosted baseline. We do NOT artificially downscale it.
 *
 * This module is the single source of truth for the long-edge cap, so a
 * provider adapter can't accidentally request a 2K or 4K render and burn
 * 200s + dollars on a giant image.
 */

export const MAX_NON_IDEOGRAM_EDGE_PX = 1024;
export const MAX_IDEOGRAM_EDGE_PX = 2048;

/** Token ceiling sent as `max_tokens` on chat-completions image requests. */
export const MAX_OUTPUT_TOKENS_IMAGE = 2500;

/**
 * Aspect ratios we allow through. All 14 of our existing keys are valid;
 * the router caps them via `enforceResolutionCap` before dispatch.
 */
export const ALLOWED_ASPECT_RATIOS: AspectRatioKey[] = ASPECT_RATIOS.map((a) => a.key);

export class ImageGenResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageGenResolutionError";
  }
}

/**
 * The maximum long edge, in pixels, that the given provider is allowed
 * to render at. Ideogram gets 2K; everyone else is capped at 1K.
 */
export function maxEdgeForProvider(providerId: ProviderId): number {
  return providerId === "ideogram-4" ? MAX_IDEOGRAM_EDGE_PX : MAX_NON_IDEOGRAM_EDGE_PX;
}

/**
 * Throw if the requested aspect ratio's pixel dimensions exceed the
 * provider's allowed long edge. Call this from each adapter immediately
 * before dispatching the request, so an oversized config fails loudly
 * rather than silently billing the user.
 */
export function enforceResolutionCap(
  providerId: ProviderId,
  aspectRatio: AspectRatioKey
): void {
  const ratio = getAspectRatio(aspectRatio);
  const cap = maxEdgeForProvider(providerId);
  if (ratio.width > cap || ratio.height > cap) {
    throw new ImageGenResolutionError(
      `${providerId}: aspect ratio ${aspectRatio} resolves to ${ratio.width}x${ratio.height}, ` +
        `which exceeds the ${cap}px long-edge cap. Pick a smaller aspect ratio.`
    );
  }
}

/**
 * Resolve the platform-shared API key for a given provider. Always
 * reads from the server environment — there is no per-user override.
 *
 * Throws `ImageGenResolutionError` if the key is missing, so the router
 * can fail fast with an actionable message instead of trying to call a
 * provider without auth.
 */
export function platformApiKey(providerId: ProviderId): string {
  const envName = PLATFORM_KEY_ENV[providerId];
  const value = process.env[envName]?.trim();
  if (!value) {
    throw new ImageGenResolutionError(
      `${providerId}: missing platform env var ${envName}. ` +
        `Set it in the deployment environment before serving traffic.`
    );
  }
  return value;
}

const PLATFORM_KEY_ENV: Record<ProviderId, string> = {
  "gemini-flash-lite-image": "OPENROUTER_API_KEY",
  "gemini-flash-image": "OPENROUTER_API_KEY",
  "gpt-image-2": "OPENAI_API_KEY",
  "ideogram-4": "IDEOGRAM_API_KEY",
};