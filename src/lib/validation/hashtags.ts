import "server-only";
import { z } from "zod";
import { platformIdSchema } from "./posts";

export const createHashtagSetSchema = z.object({
  name: z.string().min(1).max(80),
  hashtags: z.array(z.string().min(1).max(120)).min(1).max(100),
  platform: platformIdSchema.optional(),
});

export const updateHashtagSetSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  hashtags: z.array(z.string().min(1).max(120)).min(1).max(100).optional(),
  platform: platformIdSchema.optional(),
});

export const trendingHashtagFilterSchema = z.object({
  platform: platformIdSchema.optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateHashtagSetInput = z.infer<typeof createHashtagSetSchema>;
export type UpdateHashtagSetInput = z.infer<typeof updateHashtagSetSchema>;
