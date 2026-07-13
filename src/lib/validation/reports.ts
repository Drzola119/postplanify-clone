import "server-only";
import { z } from "zod";

export const reportTemplateSchema = z.enum([
  "performance",
  "engagement",
  "audience",
  "competitor",
  "custom",
]);

export const reportFormatSchema = z.enum(["csv", "json", "pdf"]).default("csv");

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
