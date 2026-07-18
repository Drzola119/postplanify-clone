import "server-only";
import { z } from "zod";
import { SUPPORTED_ASPECT_RATIOS } from "@/lib/image-gen/resolution";
import type { AspectRatio } from "@/lib/image-gen/types";
import { isProviderArabicCapable } from "@/lib/image-gen/language-support";

/**
 * Validation schemas for the image-gen router surface.
 *
 * All generations are billed to the platform — there is no per-user
 * (BYOK) override path. We charge clients through our own subscription
 * / credit system; see src/lib/image-gen/usage.ts.
 *
 * Aspect ratios are restricted to the eight Gemini ImageConfig values
 * (see `SUPPORTED_ASPECT_RATIOS`). Any other value 400s the moment we
 * dispatch to a Gemini model, so we reject it at the validation layer.
 */

export const imageGenProviderIdSchema = z.enum([
  "gemini-flash-lite-image",
  "gpt-image-2",
  "ideogram-4",
  "gemini-flash-image",
]);

/**
 * Aspect-ratio schema typed as `AspectRatio` so downstream consumers
 * (router, prompt builder) get the literal union, not `string`.
 */
export const imageGenAspectRatioSchema = z.enum(
  SUPPORTED_ASPECT_RATIOS as unknown as readonly [AspectRatio, ...AspectRatio[]]
);

const baseImageGenFields = {
  provider: z.enum(["auto", ...imageGenProviderIdSchema.options]),
  prompt: z.string().min(8).max(20_000).optional(),
  structuredPrompt: z.record(z.unknown()).optional(),
  aspectRatio: imageGenAspectRatioSchema,
  colorScheme: z.enum(["light", "dark", "brand"]).optional(),
  outputLanguage: z.enum(["en", "fr", "ar"]).optional().default("en"),
  context: z
    .object({
      tool: z.enum(["instant", "ads"]).optional(),
      styleId: z.string().max(64).optional(),
      campaignId: z.string().max(128).optional(),
      abBucket: z.string().max(64).optional(),
    })
    .optional(),
};

/**
 * Shared Arabic-output cross-field guard. Arabic is only allowed on
 * providers a human has verified render it legibly; when a specific
 * (non-auto) provider is chosen we reject the request unless that
 * provider is in ARABIC_CAPABLE_PROVIDERS.
 */
function refineArabicProvider<T extends { outputLanguage?: "en" | "fr" | "ar"; provider?: string }>(
  data: T,
  ctx: z.RefinementCtx
) {
  if (
    data.outputLanguage === "ar" &&
    data.provider !== "auto" &&
    !isProviderArabicCapable(data.provider as never)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["provider"],
      message:
        `Provider '${data.provider}' does not support Arabic output. ` +
        `Use 'auto' or select an Arabic-capable provider.`,
    });
  }
}

export const imageGenRequestSchema = z
  .object(baseImageGenFields)
  .superRefine(refineArabicProvider);

export const imageGenAdsRequestSchema = z
  .object({
    ...baseImageGenFields,
    tool: z.literal("ads"),
    offerTitle: z.string().min(2).max(200),
    offerCopy: z.string().min(0).max(60_000),
    offerUrl: z.string().url().max(2048).optional(),
  })
  .superRefine(refineArabicProvider);

export const imageGenInstantRequestSchema = z
  .object({
    ...baseImageGenFields,
    tool: z.literal("instant"),
    topic: z.string().min(3).max(500),
  })
  .superRefine(refineArabicProvider);