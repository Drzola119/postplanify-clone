import "server-only";
import type { AspectRatio, ProviderId } from "./types";
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
 *   - Aspect ratios are restricted to the 8 native Gemini ImageConfig
 *     values ("1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9").
 *     Anything else 400s the moment we dispatch to a Gemini model, so we
 *     reject it centrally before the request goes out.
 *
 * This module is the single source of truth for the long-edge cap AND
 * the supported aspect-ratio vocabulary, so a provider adapter can't
 * accidentally request a 2K or 4K render or pass an unsupported ratio
 * and burn 200s + dollars on a broken request.
 */

export const MAX_NON_IDEOGRAM_EDGE_PX = 1024;
export const MAX_IDEOGRAM_EDGE_PX = 2048;

/** Token ceiling sent as `max_tokens` on chat-completions image requests. */
export const MAX_OUTPUT_TOKENS_IMAGE = 2500;

/**
 * The eight aspect ratios Google's Gemini ImageConfig accepts verbatim.
 * These are the only values the image-gen pipeline may pass through. The
 * wizard UI, validation schema, prompt builder, and all four provider
 * adapters derive their input vocabulary from this set.
 */
export const SUPPORTED_ASPECT_RATIOS = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
  "21:9",
] as const;

/**
 * Ideogram v3's `aspect_ratio` field accepts the "WxH" string form
 * (e.g. "16x9"). Since the `AspectRatio` type already constrains input
 * to the 8 supported values, every entry is present.
 */
export const IDEOGRAM_ASPECT_RATIOS: Record<AspectRatio, string> = {
  "1:1": "1x1",
  "2:3": "2x3",
  "3:2": "3x2",
  "3:4": "3x4",
  "4:3": "4x3",
  "9:16": "9x16",
  "16:9": "16x9",
  "21:9": "21x9",
};

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
 * Throw if `ratio` isn't one of the 8 supported Gemini ImageConfig
 * values. Centralised so a single call from each adapter guarantees we
 * never send an exotic string to the provider.
 */
export function enforceSupportedAspectRatio(
  ratio: string
): asserts ratio is AspectRatio {
  if (!(SUPPORTED_ASPECT_RATIOS as readonly string[]).includes(ratio)) {
    throw new ImageGenResolutionError(
      `Unsupported aspect ratio "${ratio}". ` +
        `Must be one of: ${SUPPORTED_ASPECT_RATIOS.join(", ")}.`
    );
  }
}

/**
 * Throw if the requested aspect ratio's pixel dimensions exceed the
 * provider's allowed long edge. Call this from each adapter immediately
 * before dispatching the request, so an oversized config fails loudly
 * rather than silently billing the user.
 *
 * Implicitly validates that `aspectRatio` is a supported value — same
 * 8-vocabulary check as `enforceSupportedAspectRatio`.
 */
export function enforceResolutionCap(
  providerId: ProviderId,
  aspectRatio: AspectRatio
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
 * Compute pixel dimensions for an aspect ratio at the given long-edge
 * cap. The long edge snaps to `maxEdge`; the short edge is rounded to
 * the nearest 16 to satisfy OpenAI's gpt-image-2 constraint (and to
 * keep Ideogram's upscale behaviour deterministic).
 *
 * Used by `aspectRatioToOpenAiSize` (1K cap) and `aspectRatioToIdeogram`
 * callers that need the actual pixel pair for output reporting.
 */
export function aspectDimensions(
  ratio: AspectRatio,
  maxEdge: number
): { width: number; height: number } {
  const [w, h] = ratio.split(":").map(Number);
  if (w >= h) {
    const width = maxEdge;
    const height = Math.max(16, Math.round((maxEdge * h) / w / 16) * 16);
    return { width, height };
  }
  const height = maxEdge;
  const width = Math.max(16, Math.round((maxEdge * w) / h / 16) * 16);
  return { width, height };
}

/**
 * Gemini's image_config.aspect_ratio accepts the ratio string verbatim
 * in "W:H" form. No conversion needed beyond passing the value through.
 */
export function aspectRatioToGemini(ratio: AspectRatio): string {
  return ratio;
}

/**
 * OpenAI's `/v1/images/generations` expects a "WIDTHxHEIGHT" pixel-pair
 * string for the `size` field. gpt-image-2 imposes an additional
 * constraint that both dimensions must be multiples of 16, so we round
 * the short edge to the nearest 16.
 */
export function aspectRatioToOpenAiSize(
  ratio: AspectRatio,
  maxEdge: number = MAX_NON_IDEOGRAM_EDGE_PX
): string {
  const { width, height } = aspectDimensions(ratio, maxEdge);
  return `${width}x${height}`;
}

/**
 * Ideogram v3's `aspect_ratio` field accepts the "WxH" string form
 * (e.g. "16x9"). We pass the canonical lookup in `IDEOGRAM_ASPECT_RATIOS`
 * — fall-through is impossible because the type already constrains the
 * input to the 8 supported values.
 */
export function aspectRatioToIdeogram(ratio: AspectRatio): string {
  return IDEOGRAM_ASPECT_RATIOS[ratio];
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

/**
 * Re-export the canonical AspectRatio vocabulary from `./types` so
 * callers can `import { SUPPORTED_ASPECT_RATIOS, AspectRatio } from
 * "@/lib/image-gen/resolution"` and get both in one place.
 */
export { ASPECT_RATIOS };
export type { AspectRatio };
