import "server-only";
import { z } from "zod";
import { platformIdSchema } from "./posts";
import { url } from "./helpers";

export const destinationTypeSchema = z.enum(["webhook", "zapier", "custom"]);

export const destinationSchema = z.object({
  platform: z.union([platformIdSchema, z.literal("custom")]),
  type: destinationTypeSchema,
  url: url,
  secret: z.string().max(512).optional(),
  active: z.boolean().optional().default(true),
});

export const destinationUpdateSchema = destinationSchema.partial();

export const webhookEventSchema = z.enum([
  "post.published",
  "post.failed",
  "post.scheduled",
  "inbox.comment",
  "inbox.message",
]);

export const webhookSchema = z.object({
  url: url,
  events: z.array(webhookEventSchema).min(1).max(20),
  secret: z.string().min(8).max(256),
  active: z.boolean().optional().default(true),
});

export const webhookUpdateSchema = z.object({
  events: z.array(webhookEventSchema).min(1).max(20).optional(),
  active: z.boolean().optional(),
});

export type DestinationInput = z.infer<typeof destinationSchema>;
export type DestinationUpdateInput = z.infer<typeof destinationUpdateSchema>;
export type WebhookInput = z.infer<typeof webhookSchema>;
export type WebhookUpdateInput = z.infer<typeof webhookUpdateSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;
