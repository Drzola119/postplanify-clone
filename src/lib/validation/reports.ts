import "server-only";
import { z } from "zod";

const platformIdSchema = z.enum([
  "bluesky", "instagram", "tiktok", "youtube", "pinterest", "twitter", "linkedin",
  "threads", "facebook", "discord", "telegram", "google_business", "reddit",
]);

export const reportTemplateSchema = z.enum([
  "performance",
  "engagement",
  "audience",
  "competitor",
  "custom",
]);

export const reportFormatSchema = z.enum(["csv", "json", "pdf"]).default("csv");
export const reportComparisonSchema = z.enum(["none", "previous_period", "previous_year", "week_over_week", "custom_range"]);

export const dateRangeSchema = z
  .object({
    from: z.string(),
    to: z.string(),
  })
  .refine(
    (v) => {
      const a = new Date(v.from).getTime();
      const b = new Date(v.to).getTime();
      return Number.isFinite(a) && Number.isFinite(b) && a <= b;
    },
    { message: "from must be on or before to" }
  );

export const createReportSchema = z.object({
  name: z.string().min(1).max(120),
  template: reportTemplateSchema,
  dateRange: dateRangeSchema,
  format: reportFormatSchema.optional(),
  accountCount: z.number().int().min(0).max(100).optional(),
  comparison: reportComparisonSchema.optional(),
  platforms: z.array(platformIdSchema).max(13).optional(),
  branding: z.object({
    accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    footerText: z.string().max(200).optional(),
  }).optional(),
});

export const reportScheduleSchema = z.object({
  name: z.string().min(1).max(120),
  cron: z.string().min(1).max(80),
  recipients: z.array(z.string().email()).min(1).max(20),
  reportId: z.string().min(1).max(120).optional(),
  paused: z.boolean().optional().default(false),
});

export const updateReportScheduleSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  cron: z.string().min(1).max(80).optional(),
  recipients: z.array(z.string().email()).min(1).max(20).optional(),
  paused: z.boolean().optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ReportScheduleInput = z.infer<typeof reportScheduleSchema>;
export type UpdateReportScheduleInput = z.infer<typeof updateReportScheduleSchema>;
