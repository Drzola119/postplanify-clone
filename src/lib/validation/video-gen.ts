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

// Placeholder schemas for later milestones — validated for structure only in M1
const realEstateRequestSchema = baseVideoRequestSchema.extend({
  workflow: z.literal("real-estate"),
  headline: z.string().min(1).max(200),
  priceText: z.string().max(50).optional(),
  features: z.array(z.string().max(100)).max(5).optional(),
  photoAssetIds: z.array(z.string()).min(1).max(12),
  voiceoverMode: z.enum(["none", "auto", "custom"]).default("none"),
  musicTrackId: z.string().optional(),
  brandOverlay: z.boolean().default(true),
  /** Hard cap: 90s total — ~12 clips × 7s each */
  totalDurationSec: z.number().max(90).optional(),
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

export const videoGenerateRequestSchema = z.discriminatedUnion("workflow", [
  cartoonRequestSchema,
  realEstateRequestSchema,
  whiteboardRequestSchema,
  viralRequestSchema,
]);

export type VideoGenerateRequest = z.infer<typeof videoGenerateRequestSchema>;
export type CartoonRequest = z.infer<typeof cartoonRequestSchema>;
export type RealEstateRequest = z.infer<typeof realEstateRequestSchema>;
export type WhiteboardRequest = z.infer<typeof whiteboardRequestSchema>;
export type ViralRequest = z.infer<typeof viralRequestSchema>;
