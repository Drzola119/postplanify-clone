/**
 * carousel-gen/validation.ts — request schemas for Carousel Studio.
 *
 * Mirrors the structure of `src/lib/validation/image-gen.ts` and
 * `src/lib/validation/video-gen.ts`. Zod schemas live in their own file
 * so the API routes stay slim.
 */

import "server-only";
import { z } from "zod";

export const carouselSlideTypeSchema = z.enum([
  "hook",
  "stakes",
  "value",
  "receipts",
  "cta",
]);

export const carouselOutputLanguageSchema = z.enum(["en", "fr", "ar"]);

/** Body for POST /api/carousels/preview — script-only generation. */
export const carouselPreviewRequestSchema = z.object({
  topic: z.string().min(3).max(500),
  niche: z.string().max(80).optional(),
  tone: z.string().max(80).optional(),
  ctaKeyword: z.string().min(1).max(40),
  outputLanguage: carouselOutputLanguageSchema.default("en"),
});

/** Body for POST /api/carousels/brand-analyze — fetches the URL (or
 * accepts an uploaded screenshot) and returns a brand analysis +
 * suggested CarouselStyle for the picker. M4 adds the screenshot
 * branch via the `imageDataUrl` field. Either `url` OR `imageDataUrl`
 * is required, never both. */
export const carouselBrandAnalyzeRequestSchema = z
  .object({
    url: z.string().url().max(2048).optional(),
    imageDataUrl: z
      .string()
      .max(4_500_000) // ~3.3MB after base64 overhead for a small PNG/JPEG
      .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/)
      .optional(),
  })
  .refine(
    (v) => Boolean(v.url) !== Boolean(v.imageDataUrl),
    "Provide exactly one of url or imageDataUrl"
  );

/** One slide the user is committing after preview + edits. */
const carouselScriptSlideSchema = z.object({
  index: z.number().int().min(0).max(4),
  type: carouselSlideTypeSchema,
  headline: z.string().min(1).max(200),
  body: z.string().max(200).optional(),
});

/**
 * Optional full CarouselStyle snapshot. M2 user-built styles are
 * constructed client-side from the palette builder — the server
 * validates the snapshot rather than maintaining a registry of
 * user-saved styles in Firestore.
 */
const carouselStyleSnapshotSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(80),
  colors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/),
    background: z.string().regex(/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/),
  }),
  fonts: z.object({
    display: z.string().min(1).max(60),
    body: z.string().min(1).max(60),
  }),
  layouts: z.object({
    hook: z.object({ id: z.string(), label: z.string(), description: z.string(), requiresSafeZone: z.boolean().optional() }),
    stakes: z.object({ id: z.string(), label: z.string(), description: z.string(), requiresSafeZone: z.boolean().optional() }),
    value: z.object({ id: z.string(), label: z.string(), description: z.string(), requiresSafeZone: z.boolean().optional() }),
    receipts: z.object({ id: z.string(), label: z.string(), description: z.string(), requiresSafeZone: z.boolean().optional() }),
    cta: z.object({ id: z.string(), label: z.string(), description: z.string(), requiresSafeZone: z.boolean().optional() }),
  }),
  source: z.enum(["manual", "brand-analyzed", "brand-kit"]),
});

/** Body for POST /api/carousels — commits a previewed script and triggers generation. */
export const carouselGenerateRequestSchema = z.object({
  topic: z.string().min(3).max(500),
  niche: z.string().max(80).optional(),
  tone: z.string().max(80).optional(),
  ctaKeyword: z.string().min(1).max(40),
  outputLanguage: carouselOutputLanguageSchema.default("en"),
  styleId: z.string().min(1).max(64),
  /** M2+: when the user builds a style client-side, send the snapshot.
   * Server prefers this over getCarouselStyle(styleId). */
  styleSnapshot: carouselStyleSnapshotSchema.optional(),
  slides: z.array(carouselScriptSlideSchema).length(5),
});
