import "server-only";
import type { OutputLanguage } from "../i18n/types";

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

/**
 * The single source of truth for the aspect-ratio vocabulary. Only the
 * eight ratios Google's Gemini ImageConfig accepts verbatim are valid —
 * `resolution.ts → SUPPORTED_ASPECT_RATIOS` is the runtime list, this
 * type is the compile-time check. Keep both in sync.
 */
export type AspectRatio =
  | "1:1"
  | "2:3"
  | "3:2"
  | "3:4"
  | "4:3"
  | "9:16"
  | "16:9"
  | "21:9";

/** A single requested aspect ratio in width×height pixels at 1K output. */
export interface AspectRatioSpec {
  ratio: AspectRatio;
  width: number;
  height: number;
}

/**
 * Reference pixel dimensions for each supported ratio at 1K (long edge
 * 1024). Actual per-provider sizes are computed in `resolution.ts` from
 * these inputs and the relevant cap.
 */
export const ASPECT_RATIOS: AspectRatioSpec[] = [
  { ratio: "1:1",  width: 1024, height: 1024 },
  { ratio: "2:3",  width:  683, height: 1024 },
  { ratio: "3:2",  width: 1024, height:  683 },
  { ratio: "3:4",  width:  768, height: 1024 },
  { ratio: "4:3",  width: 1024, height:  768 },
  { ratio: "9:16", width:  576, height: 1024 },
  { ratio: "16:9", width: 1024, height:  576 },
  { ratio: "21:9", width: 1024, height:  439 },
];

export function getAspectRatio(ratio: AspectRatio): AspectRatioSpec {
  const found = ASPECT_RATIOS.find((a) => a.ratio === ratio);
  if (!found) throw new Error(`Unknown aspect ratio: ${ratio}`);
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
  aspectRatio: AspectRatio;
  /**
   * Language the AI must render ON-IMAGE text in. Independent of the UI
   * locale. Controls the [LANGUAGE_DIRECTIVE] appended to the prompt.
   */
  outputLanguage?: OutputLanguage;
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