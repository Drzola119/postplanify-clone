import "server-only";
import { z } from "zod";
import { platformIdSchema } from "./posts";
import { url } from "./helpers";

export const inboxCommentFilterSchema = z.object({
  platform: platformIdSchema.optional(),
  cursor: z.string().optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  replied: z.coerce.boolean().optional(),
  resolved: z.coerce.boolean().optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
  accountKey: z.string().max(128).optional(),
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
  /** public-reply (visible) vs private-reply (DM to commenter) — separate actions (grill decision). */
  kind: z.enum(["public-reply", "private-reply"]).default("public-reply"),
  /** Workspace-owned Upload-Post profile username. Never a client authorization proof on its own. */
  accountKey: z.string().min(1).max(128).optional(),
  /** Optional client idempotency key; server always derives a stable key regardless. */
  idempotencyKey: z.string().min(1).max(128).optional(),
  buttons: z
    .array(z.object({ title: z.string().min(1).max(20), url: url }))
    .max(3)
    .optional(),
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
  /** Scoped provider recipient id (from conversation participants / comment author id). Never a free-typed username. */
  recipientId: z.string().min(1).max(128).optional(),
  accountKey: z.string().min(1).max(128).optional(),
  idempotencyKey: z.string().min(1).max(128).optional(),
});

export const inboxSyncSchema = z.object({
  scope: z.string().min(1).max(256).optional(),
  accountKey: z.string().min(1).max(128).optional(),
  force: z.coerce.boolean().optional().default(false),
});

export const inboxDraftSchema = z.object({
  platform: platformIdSchema,
  kind: z.enum(["reply", "dm"]).default("reply"),
  authorHandle: z.string().min(1).max(64).optional().default("there"),
  body: z.string().min(1).max(4000),
  tone: z.enum(["friendly", "professional", "playful", "concise"]).default("friendly"),
  locale: z.string().max(16).optional(),
});

export const inboxAutodmSchema = z.object({
  postUrl: url,
  replyMessage: z.string().min(1).max(1000),
  profileUsername: z.string().min(1).max(128).optional(),
  buttons: z
    .array(z.object({ title: z.string().min(1).max(20), url: url }))
    .max(3)
    .optional(),
  monitoringInterval: z.coerce.number().int().min(15).max(1440).optional(),
  triggerKeywords: z.array(z.string().min(1).max(64)).max(20).optional(),
});

export type InboxCommentFilter = z.infer<typeof inboxCommentFilterSchema>;
export type InboxReplyInput = z.infer<typeof inboxReplySchema>;
export type InboxInboundInput = z.infer<typeof inboxInboundSchema>;
export type ConversationMessageInput = z.infer<typeof conversationMessageSchema>;
