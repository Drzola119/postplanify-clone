import "server-only";
import { z } from "zod";
import { platformIdSchema } from "./posts";

const triggerSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("comment-keyword"),
    keyword: z.string().min(1).max(64),
    match: z.enum(["contains", "exact", "starts-with"]).default("contains"),
  }),
  z.object({
    kind: z.literal("first-comment"),
    postId: z.string().max(128).optional(),
  }),
  z.object({
    kind: z.literal("follow"),
    postId: z.string().max(128).optional(),
  }),
]);

export const createAutoDmSchema = z.object({
  name: z.string().min(1).max(80),
  status: z.enum(["active", "paused"]).default("paused"),
  trigger: triggerSchema,
  platforms: z.array(platformIdSchema).min(1).max(9),
  template: z.string().min(1).max(4000),
  perAuthorPerDayCap: z.number().int().min(1).max(10).optional(),
});

export const updateAutoDmSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  status: z.enum(["active", "paused"]).optional(),
  trigger: triggerSchema.optional(),
  platforms: z.array(platformIdSchema).min(1).max(9).optional(),
  template: z.string().min(1).max(4000).optional(),
  perAuthorPerDayCap: z.number().int().min(1).max(10).optional(),
});

export type CreateAutoDmInput = z.infer<typeof createAutoDmSchema>;
export type UpdateAutoDmInput = z.infer<typeof updateAutoDmSchema>;
