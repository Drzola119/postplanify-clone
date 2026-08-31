import { z } from "zod";
import { urlArray, nonEmptyString, optionalString } from "./helpers";

export const platformIdSchema = z.enum([
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
  "reddit",
  "google_business",
]);

export type PlatformIdSchema = z.infer<typeof platformIdSchema>;

export const postStatusSchema = z.enum([
  "draft",
  "queued",
  "scheduled",
  "publishing",
  "published",
  "partially_published",
  "failed",
  "archived",
  "paused",
]);

export const postCollaboratorSchema = z.object({
  uid: z.string().min(1),
  handle: z.string().min(1).max(64),
  status: z.enum(["invited", "accepted", "declined"]).default("invited"),
});

export const createPostSchema = z
  .object({
    caption: z.string().max(70000).optional().default(""),
    platforms: z.array(platformIdSchema).min(1).max(13),
    mediaUrls: urlArray.optional().default([]),
    hashtags: z.array(z.string().min(1).max(64)).max(30).optional().default([]),
    labels: z.array(z.string().min(1).max(64)).max(20).optional().default([]),
    scheduledAt: optionalString,
    firstComment: optionalString,
    altText: z.array(z.string().max(1000)).max(10).optional().default([]),
    collaborators: z.array(postCollaboratorSchema).max(20).optional().default([]),
    community: optionalString,
    quoteTweetUrl: optionalString,
    threadRootId: optionalString,
    /** Feed vs Story placement hint (e.g. "story" for IG/FB stories). */
    postIn: z.enum(["feed", "story"]).optional(),
    /** YouTube-only — required when "youtube" is in platforms. */
    youtubeTitle: optionalString,
    youtubeTags: optionalString,
    /** Pinterest-only — required when "pinterest" is in platforms. */
    pinterestBoard: optionalString,
    autoAddMusic: z.boolean().optional(),
    profile: optionalString,
    status: postStatusSchema.optional().default("draft"),
    // ── Bulk parity — keep in sync with single-post publish payload ──
    advancedByPlatform: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
    captionsByPlatform: z.record(z.string(), z.string()).optional(),
    sameForAll: z.boolean().optional(),
    tagUsers: z.union([z.string(), z.array(z.string())]).optional(),
    firstCommentByPlatform: z.record(z.string(), z.string()).optional(),
    altTextByPlatform: z.record(z.string(), z.string()).optional(),
    // ── Async AI Caption Generation options ──
    captionGenerationMode: z.enum(["automatic", "manual"]).optional().default("manual"),
    captionFallback: z.enum(["hold", "publish_without_caption"]).optional(),
    captionTone: z.string().max(32).optional(),
    captionIncludeHashtags: z.boolean().optional(),
    captionUseEmojis: z.boolean().optional(),
    captionExtra: z.string().max(500).optional(),
    videoTitle: optionalString,
  })
  .passthrough()
  .refine(
    (p) => {
      const hasCaption = typeof p.caption === "string" && p.caption.trim().length > 0;
      if (!hasCaption) {
        return p.captionGenerationMode === "automatic";
      }
      return true;
    },
    { message: "Caption is required unless automatic caption generation is enabled", path: ["caption"] }
  )
  .refine(
    (p) => {
      if (p.status === "scheduled" || p.status === "queued") {
        if (!p.scheduledAt) return false;
        const t = Date.parse(p.scheduledAt);
        if (Number.isNaN(t)) return false;
        return t > Date.now() - 60_000;
      }
      return true;
    },
    { message: "scheduledAt must be a future ISO date when status is scheduled/queued", path: ["scheduledAt"] }
  );

export const updatePostSchema = z.object({
  caption: nonEmptyString.max(70000).optional(),
  platforms: z.array(platformIdSchema).min(1).max(13).optional(),
  mediaUrls: urlArray.optional(),
  hashtags: z.array(z.string().min(1).max(64)).max(30).optional(),
  labels: z.array(z.string().min(1).max(64)).max(20).optional(),
  scheduledAt: optionalString,
  firstComment: optionalString,
  altText: z.array(z.string().max(1000)).max(10).optional(),
  collaborators: z.array(postCollaboratorSchema).max(20).optional(),
  community: optionalString,
  quoteTweetUrl: optionalString,
  threadRootId: optionalString,
  status: postStatusSchema.optional(),
});

export const bulkScheduleSchema = z.object({
  items: z.array(createPostSchema).min(1).max(100),
});

export const postFiltersSchema = z.object({
  status: postStatusSchema.optional(),
  platform: platformIdSchema.optional(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const historyFiltersSchema = z.object({
  platform: platformIdSchema.optional(),
  status: z.enum(["published", "failed"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type HistoryFilters = z.infer<typeof historyFiltersSchema>;

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type BulkScheduleInput = z.infer<typeof bulkScheduleSchema>;
export type PostFilters = z.infer<typeof postFiltersSchema>;