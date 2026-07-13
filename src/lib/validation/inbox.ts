import "server-only";
import { z } from "zod";
import { platformIdSchema } from "./posts";
import { url } from "./helpers";

export const inboxCommentFilterSchema = z.object({
  platform: platformIdSchema.optional(),
  cursor: z.string().optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  replied: z.coerce.boolean().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const inboxMessageFilterSchema = z.object({
  cursor: z.string().optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const inboxReplySchema = z.object({
  platform: platformIdSchema,
  commentId: z.string().min(1).max(128),
  body: z.string().min(1).max(4000),
});

export const inboxInboundSchema = z.object({
  platform: platformIdSchema,
  postId: z.string().max(128).optional(),
  authorHandle: z.string().min(1).max(64),
  body: z.string().min(1).max(8000),
  externalId: z.string().max(256).optional(),
  sentAt: z.string().datetime({ offset: true }).optional(),
});

export const conversationMessageSchema = z.object({
  conversationId: z.string().min(1).max(128),
  body: z.string().min(1).max(8000),
  direction: z.enum(["in", "out"]).default("out"),
});

export type InboxCommentFilter = z.infer<typeof inboxCommentFilterSchema>;
export type InboxReplyInput = z.infer<typeof inboxReplySchema>;
export type InboxInboundInput = z.infer<typeof inboxInboundSchema>;
export type ConversationMessageInput = z.infer<typeof conversationMessageSchema>;
