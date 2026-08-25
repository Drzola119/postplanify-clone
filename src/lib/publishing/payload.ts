// Shared payload builder for immediate and scheduled publish paths.
// Ensures the n8n payload shape cannot drift between /api/posts/publish and the queue worker.

export interface PublishPayloadFields {
  jobId?: string;
  postId?: string;
  userId?: string;
  uploadPostUsername?: string;
  platforms: string[];
  caption: string;
  captionsByPlatform?: Record<string, string>;
  sameForAll?: boolean;
  mediaUrls: string[];
  scheduledAt?: string | null;
  advancedByPlatform?: Record<string, unknown>;
  firstComment?: string;
  firstCommentByPlatform?: Record<string, string>;
  altTextByPlatform?: Record<string, string>;
  feedType?: "feed" | "story";
  carouselItems?: Array<{ url: string }>;
  trialReel?: { url: string };
  document?: { url: string; title: string; mimeType: string };
  collaborators?: string[];
  frameCoverUrl?: string;
  customCoverUrl?: string;
  tagUsers?: string | string[];
  quoteTweetUrl?: string;
  community?: string;
  mediaType?: string;
  hashtags?: string;
}

/**
 * Build the canonical publish payload that is sent to n8n.
 * - Always includes `caption` (legacy fallback) for backward compat.
 * - Includes `captionsByPlatform` + `sameForAll` when present.
 * - Preserves empty mediaUrls for text-only posts.
 */
export function buildPublishPayload(fields: PublishPayloadFields): Record<string, unknown> {
  const out: Record<string, unknown> = {
    jobId: fields.jobId,
    postId: fields.postId,
    userId: fields.userId,
    uploadPostUsername: fields.uploadPostUsername,
    platforms: fields.platforms,
    caption: fields.caption,
    captionsByPlatform: fields.captionsByPlatform,
    sameForAll: fields.sameForAll,
    mediaUrls: fields.mediaUrls,
    scheduledAt: fields.scheduledAt ?? null,
    advancedByPlatform: fields.advancedByPlatform ?? {},
    firstComment: fields.firstComment,
    firstCommentByPlatform: fields.firstCommentByPlatform,
    altTextByPlatform: fields.altTextByPlatform,
    feedType: fields.feedType,
    carouselItems: fields.carouselItems,
    trialReel: fields.trialReel,
    document: fields.document,
    collaborators: fields.collaborators,
    frameCoverUrl: fields.frameCoverUrl,
    customCoverUrl: fields.customCoverUrl,
    tagUsers: fields.tagUsers,
    quoteTweetUrl: fields.quoteTweetUrl,
    community: fields.community,
    mediaType: fields.mediaType,
    hashtags: fields.hashtags,
  };
  // Remove undefined keys so JSON doesn't contain nullish noise
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k];
  }
  return out;
}

/**
 * Reconstruct captionsByPlatform on read, with legacy fallback.
 * If the persisted doc has no captionsByPlatform, synthesize it from data.caption
 * so scheduled posts still publish correctly.
 */
export function resolveCaptionsForPayload(data: {
  caption?: string;
  captionsByPlatform?: Record<string, string>;
  sameForAll?: boolean;
  platforms?: string[];
}): { caption: string; captionsByPlatform?: Record<string, string>; sameForAll?: boolean } {
  const fallbackCaption = data.caption ?? "";
  if (data.captionsByPlatform && Object.keys(data.captionsByPlatform).length > 0) {
    return {
      caption: fallbackCaption || (Object.values(data.captionsByPlatform)[0] ?? ""),
      captionsByPlatform: data.captionsByPlatform,
      sameForAll: data.sameForAll,
    };
  }
  // Legacy doc: build map from single caption for backward compat
  if (fallbackCaption && data.platforms && data.platforms.length > 0) {
    const map: Record<string, string> = {};
    for (const p of data.platforms) map[p] = fallbackCaption;
    return { caption: fallbackCaption, captionsByPlatform: map, sameForAll: true };
  }
  return { caption: fallbackCaption, captionsByPlatform: undefined, sameForAll: data.sameForAll };
}
