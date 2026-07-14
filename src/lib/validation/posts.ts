import "server-only";
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
]);

export type PlatformIdSchema = z.infer<typeof platformIdSchema>;

export const postStatusSchema = z.enum([
  "draft",
  "queued",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "archived",
]);

export const postCollaboratorSchema = z.object({
  uid: z.string().min(1),
  handle: z.string().min(1).max(64),
  status: z.enum(["invited", "accepted", "declined"]).default("invited"),
});

export const createPostSchema = z.object({
  caption: nonEmptyString.max(22000),
  platforms: z.array(platformIdSchema).min(1).max(9),
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
  status: postStatusSchema.optional().default("draft"),
}).refine(
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
  caption: nonEmptyString.max(22000).optional(),
  platforms: z.array(platformIdSchema).min(1).max(9).optional(),
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