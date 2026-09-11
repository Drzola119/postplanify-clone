import { z } from "zod";
export const documentId = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const color = z.string().regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i);
const asset = z
  .string()
  .url()
  .max(2048)
  .refine((url) => /^https?:\/\//.test(url), "Use an HTTP image URL");
export const slideSchema = z.object({
  id: documentId,
  index: z.number().int().min(0).max(29),
  type: z.enum([
    "hook",
    "stakes",
    "value",
    "receipts",
    "cta",
    "quote",
    "comparison",
    "stats",
    "step",
    "checklist",
  ]),
  layoutId: z.enum(["centered", "split", "bold-headline"]).optional(),
  headline: z.string().max(500),
  subheadline: z.string().max(500).optional(),
  body: z.string().max(4000).optional(),
  quoteAuthor: z.string().max(200).optional(),
  statsValue: z.string().max(80).optional(),
  statsLabel: z.string().max(300).optional(),
  comparisonItems: z
    .array(z.object({ left: z.string().max(500), right: z.string().max(500) }))
    .max(10)
    .optional(),
  bulletPoints: z.array(z.string().max(500)).max(15).optional(),
  backgroundImageUrl: z.union([asset, z.literal("")]).optional(),
  renderedImageUrl: asset.optional(),
  backgroundOpacity: z.number().min(0).max(100).optional(),
  backgroundPosition: z
    .enum(["center", "top", "bottom", "cover", "contain"])
    .optional(),
  backgroundColor: color.optional(),
  textColor: color.optional(),
  accentColor: color.optional(),
  displayFont: z.string().max(60).optional(),
  bodyFont: z.string().max(60).optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  fontSizeScale: z.number().min(0.5).max(2).optional(),
  fontWeight: z.union([z.literal(400), z.literal(700)]).optional(),
  lineHeight: z.number().min(1).max(2).optional(),
  letterSpacing: z.number().min(-2).max(8).optional(),
  isLocked: z.boolean().optional(),
  isLegacyFlat: z.boolean().optional(),
});
const layout = z.object({
  id: z.string().max(80),
  label: z.string().max(100),
  description: z.string().max(1000),
  requiresSafeZone: z.boolean().optional(),
});
export const styleSchema = z.object({
  id: documentId,
  label: z.string().max(100),
  colors: z.object({ primary: color, background: color, accent: color }),
  fonts: z.object({ display: z.string().max(60), body: z.string().max(60) }),
  layouts: z.object({
    hook: layout,
    stakes: layout,
    value: layout,
    receipts: layout,
    cta: layout,
  }),
  source: z.enum(["manual", "brand-analyzed", "brand-kit"]),
});
export const editableSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(["draft", "archived"]).optional(),
  aspectRatio: z.enum(["1:1", "3:4", "4:5", "9:16"]).optional(),
  brandKitId: documentId.nullable().optional(),
  campaignId: documentId.nullable().optional(),
  folderId: documentId.nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(30).optional(),
  slides: z
    .array(slideSchema)
    .min(1)
    .max(30)
    .refine(
      (slides) => new Set(slides.map((s) => s.id)).size === slides.length,
      "Slide IDs must be unique",
    )
    .optional(),
  style: styleSchema.optional(),
  caption: z.string().max(3000).optional(),
  showSlideNumbers: z.boolean().optional(),
  platformOverrides: z
    .record(z.object({ caption: z.string().max(3000).optional() }))
    .optional(),
});

export const brandSnapshotSchema = z.object({
  id: documentId,
  workspaceId: z.string(),
  name: z.string().max(100),
  colors: z.object({
    primary: color,
    secondary: color,
    accent: color,
    background: color,
    text: color,
    cardBg: color.optional(),
  }),
  fonts: z.object({ display: z.string().max(60), body: z.string().max(60) }),
  logoUrl: asset.optional(),
  logoDarkUrl: asset.optional(),
  socialHandle: z.string().max(80).optional(),
  websiteUrl: z.string().max(200).optional(),
  showWatermark: z.boolean().optional(),
  showSlideNumbers: z.boolean().optional(),
  showSwipeIndicator: z.boolean().optional(),
  contrastChecked: z.boolean().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
