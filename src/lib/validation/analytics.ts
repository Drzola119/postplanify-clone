import "server-only";
import { z } from "zod";
import { platformIdSchema } from "./posts";
import { isoDate } from "./helpers";

/** Date range query — both required; from < to; window clamped to 18 months. */
export const dateRangeSchema = z
  .object({
    from: isoDate,
    to: isoDate,
  })
  .refine(
    (r) => {
      const f = Date.parse(r.from);
      const t = Date.parse(r.to);
      if (Number.isNaN(f) || Number.isNaN(t)) return false;
      if (t <= f) return false;
      return t - f <= 1000 * 60 * 60 * 24 * 31 * 18;
    },
    { message: "Invalid date range (from < to, max 18 months)", path: ["to"] }
  );

export const analyticsOverviewQuerySchema = dateRangeSchema;

export const analyticsPlatformQuerySchema = z.object({
  from: isoDate,
  to: isoDate,
});

export const analyticsPostQuerySchema = z.object({
  postId: z.string().min(1).max(128),
});

export const analyticsIngestSchema = z.object({
  date: isoDate,
  platform: platformIdSchema,
  followers: z.number().int().min(0).optional(),
  engagementRate: z.number().min(0).max(100).optional(),
  impressions: z.number().int().min(0).optional(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
});

export type DateRange = z.infer<typeof dateRangeSchema>;
export type AnalyticsIngestInput = z.infer<typeof analyticsIngestSchema>;
