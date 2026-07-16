import "server-only";

/**
 * Shared types for the image-gen router.
 *
 * The router sits at `src/lib/image-gen/router.ts` and dispatches calls to
 * one of four hosted-API providers behind a single `ImageGenProvider`
 * interface. Every provider returns the same shape:
 *
 *   { imageBytes, mime, costUsd, provider, model }
 *
 * Plus a JSON-serialisable log entry that gets written to Firestore.
 */

export type AspectRatioKey =
  | "1x1"
  | "4x5"
  | "3x4"
  | "2x3"
  | "9x16"
  | "16x9"
  | "3x2"
  | "21x9"
  | "5x4"
  | "4x3"
  | "7x5"
  | "10x16"
  | "16x21"
  | "1x2";

/** A single requested aspect ratio in width×height pixels at 1K output. */
export interface AspectRatioSpec {
  key: AspectRatioKey;
  width: number;
  height: number;
}

export const ASPECT_RATIOS: AspectRatioSpec[] = [
  { key: "1x1", width: 1024, height: 1024 },
  { key: "4x5", width: 1024, height: 1280 },
  { key: "3x4", width: 1024, height: 1365 },
  { key: "2x3", width: 1024, height: 1536 },
  { key: "9x16", width: 1024, height: 1820 },
  { key: "16x9", width: 1820, height: 1024 },
  { key: "3x2", width: 1536, height: 1024 },
  { key: "21x9", width: 2048, height: 880 },
  { key: "5x4", width: 1280, height: 1024 },
  { key: "4x3", width: 1365, height: 1024 },
  { key: "7x5", width: 1434, height: 1024 },
  { key: "10x16", width: 1024, height: 1638 },
  { key: "16x21", width: 1638, height: 1024 },
  { key: "1x2", width: 1024, height: 2048 },
];

export function getAspectRatio(key: AspectRatioKey): AspectRatioSpec {
  const found = ASPECT_RATIOS.find((a) => a.key === key);
  if (!found) throw new Error(`Unknown aspect ratio: ${key}`);
  return found;
}

export type ProviderId =
  | "gemini-flash-lite-image"
  | "gpt-image-2"
  | "ideogram-4"
  | "gemini-flash-image";

export const PROVIDER_IDS: ProviderId[] = [
  "gemini-flash-lite-image",
  "gpt-image-2",
  "ideogram-4",
  "gemini-flash-image",
];

/** Per-provider pricing assumptions (USD). Used to estimate cost. */
export interface ProviderPricing {
  /** Cost per 1M input tokens (USD). */
  inputPerMTokens: number;
  /** Cost per 1M output tokens (USD). */
  outputPerMTokens: number;
  /**
   * Flat per-image USD cost when the provider does not price by tokens
   * (e.g. Ideogram's hosted per-image pricing).
   */
  flatPerImage?: number;
}

export const PROVIDER_PRICING: Record<ProviderId, ProviderPricing> = {
  "gemini-flash-lite-image": {
    inputPerMTokens: 0.25,
    outputPerMTokens: 1.5,
  },
  "gpt-image-2": {
    // Public 2026 price snapshot; placeholder flat rate at low resolution.
    inputPerMTokens: 5,
    outputPerMTokens: 40,
  },
  "ideogram-4": {
    inputPerMTokens: 0,
    outputPerMTokens: 0,
    flatPerImage: 0.08,
  },
  "gemini-flash-image": {
    inputPerMTokens: 0.3,
    outputPerMTokens: 2.5,
  },
};

/**
 * Input the wizard and `/api/infographics/generate` route hand to the
 * router. `prompt` is the plain-text prompt used by every provider; if the
 * caller also passes `structuredPrompt` (the JSON object shape used by
 * Ideogram) the router hands that to providers that need it instead.
 *
 * All generations are billed to the platform — there is no per-user BYOK
 * override path. The router always reads `OPENROUTER_API_KEY`,
 * `OPENAI_API_KEY`, or `IDEOGRAM_API_KEY` from the server environment.
 */
export interface GenerateInput {
  /** Workspace id (for usage counter + cost logging). */
  workspaceId: string;
  /** Provider requested. Use "auto" to walk the fallback chain. */
  provider: ProviderId | "auto";
  /** Plain-text prompt for Gemini + GPT Image 2. */
  prompt: string;
  /** JSON-structured prompt (Ideogram only — ignored by other providers). */
  structuredPrompt?: Record<string, unknown>;
  /** Aspect ratio of the output image. */
  aspectRatio: AspectRatioKey;
  /**
   * Optional caller metadata propagated to the generation log so we can
   * attribute usage to specific tools, campaigns, or A/B buckets.
   */
  context?: {
    tool?: "instant" | "ads";
    styleId?: string;
    campaignId?: string;
    abBucket?: string;
  };
}

export interface GenerateOutput {
  /** Raw image bytes (PNG or JPEG). */
  imageBytes: Buffer;
  mime: "image/png" | "image/jpeg" | "image/webp";
  /** Estimated USD cost of this generation. */
  costUsd: number;
  /** Provider that successfully served the request. */
  provider: ProviderId;
  /** Concrete model id (sub-id of the provider). */
  model: string;
  /** Wall-clock ms the successful provider took. */
  durationMs: number;
  /** Public-facing URL of the saved media asset (Bunny CDN). */
  assetUrl: string;
  /** Firestore asset id (for the wizard's "Use in this post" CTA). */
  assetId: string;
  /** Width × height pixels of the returned image. */
  width: number;
  height: number;
  /**
   * If the call needed to fall back from the user's first choice, this is
   * the provider the user originally asked for. Useful for analytics.
   */
  fellBackFrom?: ProviderId;
}

export interface ProviderError extends Error {
  /** Numeric provider status code, or 0 if network/timeout. */
  status: number;
  /** Raw provider error body (truncated). */
  body?: unknown;
  /** Which provider raised the error. */
  providerId: ProviderId;
  /** Whether the caller should fall back to the next provider. */
  retryable: boolean;
}