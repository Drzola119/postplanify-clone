/**
 * validation/video-gen.ts
 * Zod schemas for video generation API requests.
 * Mirrors src/lib/validation/image-gen.ts structure.
 */
import { z } from "zod";

// ─── Atomic schemas ───────────────────────────────────────────────────────────

export const videoProviderIdSchema = z.enum([
  "seedance-2-fast",
  "seedance-2",
  "veo-3.1-lite",
  "veo-3.1",
  "gemini-omni-flash",
  "higgsfield",
  "auto",
]);

export const videoAspectRatioSchema = z.enum([
  "9:16",
  "1:1",
  "16:9",
  "4:3",
  "3:4",
  "21:9",
]);

const cartoonSubStyleSchema = z.enum([
  "pixar-3d",
  "flat-2d",
  "anime",
  "saturday-morning",
]);

// ─── Shared base fields ────────────────────────────────────────────────────

const baseVideoRequestSchema = z.object({
  provider: videoProviderIdSchema.default("auto"),
  styleId: z.string().min(1).max(64),
  /** Max 3 aspect ratios per job to cap provider spend */
  aspectRatios: videoAspectRatioSchema.array().min(1).max(3),
});

// ─── Per-workflow discriminated union ───────────────────────────────────────

const cartoonRequestSchema = baseVideoRequestSchema.extend({
  workflow: z.literal("cartoon"),
  topic: z.string().max(500).optional(),
  subStyle: cartoonSubStyleSchema,
  /** 5, 8, 10, or 15 seconds; hard-cap for cost control */
  durationSec: z.number().int().min(5).max(15),
  dialogueLine: z.string().max(200).optional(),
  sourceImageUrl: z.string().url().optional(),
});

// ─── Real Estate Video Studio (mode-discriminated) ────────────────────────────
//
// Two input modes converge on the same Stage 2 (keyframe-to-video clips):
//   - "ai-generated": property description + style preset → LLM produces
//     a shot plan, then Nano Banana reference-chains the photos.
//   - "my-photos":    user uploads their own listing photos; they ARE
//     the shot sequence (no image generation).
//
// Language defaults to French because this workflow targets Algeria
// (see spec §9): Darja isn't supported by any TTS vendor, MSA reads as
// formal/news-anchor, and French is the genuine language of business
// and upscale real-estate marketing there.

const realEstateLanguageSchema = z.enum(["fr", "en", "ar"]);
const realEstateVoiceoverSchema = z
  .object({
    enabled: z.boolean().default(false),
    voiceId: z.string().min(1).max(128).optional(),
    script: z.string().max(1200).optional(),
  })
  .default({ enabled: false });

const realEstateAiGeneratedSchema = baseVideoRequestSchema.extend({
  workflow: z.literal("real-estate"),
  mode: z.literal("ai-generated"),
  propertyDescription: z.string().min(10).max(600),
  styleId: z.string().min(1).max(64),
  shotCount: z.number().int().min(5).max(10).default(10),
  language: realEstateLanguageSchema.default("fr"),
  voiceover: realEstateVoiceoverSchema,
});

const realEstateMyPhotosSchema = baseVideoRequestSchema.extend({
  workflow: z.literal("real-estate"),
  mode: z.literal("my-photos"),
  photoAssetIds: z.array(z.string()).min(2).max(12),
  headline: z.string().max(200).optional(),
  language: realEstateLanguageSchema.default("fr"),
  voiceover: realEstateVoiceoverSchema,
});

const whiteboardRequestSchema = baseVideoRequestSchema.extend({
  workflow: z.literal("whiteboard"),
  topic: z.string().min(3).max(300),
  cta: z.string().max(100).optional(),
  mood: z.enum(["professional", "energetic", "funny", "aggressive", "calm", "inspiring"]),
  language: z.enum(["en", "fr", "es", "ar", "pt", "de"]),
  durationSec: z.union([z.literal(30), z.literal(60)]),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]),
  qualityPreference: z.enum(["budget", "quality"]).default("budget"),
});

const viralRequestSchema = baseVideoRequestSchema.extend({
  workflow: z.literal("viral"),
  hookLine: z.string().min(5).max(300),
  platformTarget: z.enum(["tiktok", "reels", "shorts"]).default("reels"),
  pacing: z.enum(["fast-cut", "single-take"]).default("fast-cut"),
  captionStyle: z.enum(["bold", "none"]).default("bold"),
  voiceoverMode: z.enum(["none", "auto"]).default("none"),
});

// ─── Main discriminated union ───────────────────────────────────────────────────
//
// Real Estate flattens its two modes directly into the outer union — Zod's
// `z.discriminatedUnion` requires each option to be a plain ZodObject, not
// a nested discriminated union. We keep `mode` as the secondary
// discriminator inside each real-estate option.

export const videoGenerateRequestSchema = z.discriminatedUnion("workflow", [
  cartoonRequestSchema,
  realEstateAiGeneratedSchema,
  realEstateMyPhotosSchema,
  whiteboardRequestSchema,
  viralRequestSchema,
]);

export type VideoGenerateRequest = z.infer<typeof videoGenerateRequestSchema>;
export type CartoonRequest = z.infer<typeof cartoonRequestSchema>;
export type RealEstateAiGeneratedRequest = z.infer<typeof realEstateAiGeneratedSchema>;
export type RealEstateMyPhotosRequest = z.infer<typeof realEstateMyPhotosSchema>;
export type RealEstateRequest = RealEstateAiGeneratedRequest | RealEstateMyPhotosRequest;
export type WhiteboardRequest = z.infer<typeof whiteboardRequestSchema>;
export type ViralRequest = z.infer<typeof viralRequestSchema>;
