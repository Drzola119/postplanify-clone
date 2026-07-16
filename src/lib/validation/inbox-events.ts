import "server-only";
import { z } from "zod";

/**
 * Validation schemas for /api/inbox/events (n8n ingestion).
 *
 * The events endpoint accepts both comments and DMs from external systems
 * (n8n, Upload-Post, native platform integrations). It uses its own
 * platformId enum that matches the full schema.ts PlatformId union (12
 * platforms) instead of the 9-platform createPostSchema enum, so Inbox
 * can ingest Discord/Telegram/Google Business messages too.
 */

const inboxPlatformIdSchema = z.enum([
  "bluesky",
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "twitter",
  "linkedin",
  "threads",
  "facebook",
  "discord",
  "telegram",
  "google_business",
]);

export const inboxEventSchema = z.object({
  workspaceId: z.string().min(1).max(64),
  platform: inboxPlatformIdSchema,
  type: z.enum(["comment", "message"]),
  postId: z.string().min(1).max(256).optional(),
  conversationId: z.string().min(1).max(128).optional(),
  externalId: z.string().min(1).max(256),
  authorHandle: z.string().min(1).max(64),
  authorName: z.string().max(128).optional(),
  body: z.string().min(1).max(8000),
  sentAt: z.string().datetime({ offset: true }),
  inReplyToId: z.string().max(256).optional(),
  direction: z.enum(["in", "out"]).default("in"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type InboxEventInput = z.infer<typeof inboxEventSchema>;
export type InboxEventType = z.infer<typeof inboxEventSchema>["type"];