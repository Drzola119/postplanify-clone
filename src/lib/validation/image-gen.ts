import "server-only";
import { z } from "zod";
import { SUPPORTED_ASPECT_RATIOS } from "@/lib/image-gen/resolution";
import type { AspectRatio } from "@/lib/image-gen/types";

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

export const imageGenRequestSchema = z.object({
  provider: z.enum(["auto", ...imageGenProviderIdSchema.options]),
  prompt: z.string().min(8).max(20_000).optional(),
  structuredPrompt: z.record(z.unknown()).optional(),
  aspectRatio: imageGenAspectRatioSchema,
  colorScheme: z.enum(["light", "dark", "brand"]).optional(),
  context: z
    .object({
      tool: z.enum(["instant", "ads"]).optional(),
      styleId: z.string().max(64).optional(),
      campaignId: z.string().max(128).optional(),
      abBucket: z.string().max(64).optional(),
    })
    .optional(),
});

export const imageGenAdsRequestSchema = imageGenRequestSchema.extend({
  tool: z.literal("ads"),
  offerTitle: z.string().min(2).max(200),
  offerCopy: z.string().min(0).max(60_000),
  offerUrl: z.string().url().max(2048).optional(),
});

export const imageGenInstantRequestSchema = imageGenRequestSchema.extend({
  tool: z.literal("instant"),
  topic: z.string().min(3).max(500),
});