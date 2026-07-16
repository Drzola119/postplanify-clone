import "server-only";
import { z } from "zod";

/**
 * Validation schemas for the image-gen router surface.
 *
 * Per-provider keys live in workspaces/{workspaceId}/imageGenKeys with
 * one document per provider. The `provider` field is the doc id, and
 * the encrypted token plus last-4 hint are stored alongside.
 */

export const imageGenProviderSchema = z.enum([
  "gemini-flash-lite-image",
  "gpt-image-2",
  "ideogram-4",
  "gemini-flash-image",
]);

export const saveImageGenKeySchema = z.object({
  provider: imageGenProviderSchema,
  apiKey: z.string().min(8).max(512),
});

export const imageGenRequestSchema = z.object({
  provider: z.enum(["auto", ...imageGenProviderSchema.options]),
  prompt: z.string().min(8).max(20_000).optional(),
  structuredPrompt: z.record(z.unknown()).optional(),
  aspectRatio: z.enum([
    "1x1",
    "4x5",
    "3x4",
    "2x3",
    "9x16",
    "16x9",
    "3x2",
    "21x9",
    "5x4",
    "4x3",
    "7x5",
    "10x16",
    "16x21",
    "1x2",
  ]),
  /** Optional client-side BYOK override. Server strips it before logging. */
  apiKeyOverride: z.string().min(8).max(512).optional(),
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
  /** Optional pre-scraped URL source (server may fill in offerCopy). */
  offerUrl: z.string().url().max(2048).optional(),
});

export const imageGenInstantRequestSchema = imageGenRequestSchema.extend({
  tool: z.literal("instant"),
  topic: z.string().min(3).max(500),
});