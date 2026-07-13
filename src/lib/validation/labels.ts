import "server-only";
import { z } from "zod";

export const labelColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color must be a hex code");

export const createLabelSchema = z.object({
  name: z.string().min(1).max(60),
  color: labelColorSchema.optional().default("#6366f1"),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  color: labelColorSchema.optional(),
});

export const labelListFilterSchema = z.object({
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
