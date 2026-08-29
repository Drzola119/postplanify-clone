import "server-only";
import { toIso } from "@/lib/db/date-utils";
import { adminDb } from "@/lib/db";
import type { PostDoc, PostStatus, PlatformId } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/posts`);
}

export interface ListPostsFilters {
  status?: PostStatus | PostStatus[];
  platform?: PlatformId;
  pageSize?: number;
  cursor?: string;
  /** Earliest publishedAt / scheduledAt / createdAt to include. */
  sinceDate?: Date;
  /** Latest publishedAt / scheduledAt / createdAt to include. */
  untilDate?: Date;
}

export interface PostListItem {
  id: string;
  workspaceId: string;
  status: PostStatus;
  caption: string;
  platforms: PlatformId[];
  mediaUrls: string[];
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  hashtags: string[];
  labels: string[];
  firstComment?: string;
  community?: string;
  quoteTweetUrl?: string;
  threadRootId?: string;
  postIn?: "feed" | "story";
  youtubeTitle?: string;
  youtubeTags?: string;
  pinterestBoard?: string;
  autoAddMusic?: boolean;
  profile?: string;
  failureReason?: string;
  uploadPostRequestId?: string;
  uploadPostJobId?: string;
}

export async function listPosts(workspaceId: string, filters: ListPostsFilters = {}): Promise<{ items: PostListItem[]; nextCursor: string | null }> {
  try {
    if (!adminDb) return { items: [], nextCursor: null };
    const coll = collection(workspaceId);
    const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);

    let snap;
    try {
      let q = coll.orderBy("createdAt", "desc").limit(500);
      if (filters.cursor) {
        try {
          const cursorSnap = await coll.doc(filters.cursor).get();
          if (cursorSnap.exists) q = q.startAfter(cursorSnap);
        } catch {
          // bad cursor — fall back to first page
        }
      }
      snap = await q.get();
    } catch (orderErr) {
      console.warn("[listPosts orderBy fallback]", orderErr);
      snap = await coll.limit(500).get();
    }

    const wantedStatuses = filters.status
      ? new Set(Array.isArray(filters.status) ? filters.status : [filters.status])
      : null;
    const filtered = snap.docs.filter((d) => {
      const data = d.data() as PostDoc;
      if (data.deletedAt) return false;
      if (wantedStatuses && !wantedStatuses.has(data.status)) return false;
      if (filters.platform && !data.platforms?.includes(filters.platform)) return false;
      const createdMs = Date.parse(toIso(data.createdAt));
      if (filters.sinceDate && createdMs < filters.sinceDate.getTime()) return false;
      if (filters.untilDate && createdMs > filters.untilDate.getTime()) return false;
      return true;
    });
    const items = filtered.slice(0, pageSize).map((d) => serialize(workspaceId, d.id, d.data() as PostDoc));
    const nextCursor = filtered.length > pageSize ? items[items.length - 1]?.id ?? null : null;
    return { items, nextCursor };
  } catch (err) {
    console.error("[listPosts error]", err);
    return { items: [], nextCursor: null };
  }
}

export interface ListPostsHistoryFilters {
  platform?: PlatformId;
  status?: "published" | "failed";
  from?: Date;
  to?: Date;
  pageSize?: number;
}

export async function listPostsHistory(
  workspaceId: string,
  filters: ListPostsHistoryFilters = {}
): Promise<{ items: PostListItem[] }> {
  try {
    if (!adminDb) return { items: [] };
    const coll = collection(workspaceId);
    const pageSize = Math.min(Math.max(filters.pageSize ?? 50, 1), 100);

    const snap = await coll.orderBy("createdAt", "desc").limit(500).get();
    const items = snap.docs
      .filter((d) => {
        const data = d.data() as PostDoc;
        if (data.deletedAt) return false;
        if (filters.status ? data.status !== filters.status : !["published", "failed", "partially_published"].includes(data.status)) return false;
        if (filters.platform && !data.platforms?.includes(filters.platform)) return false;
        const eventMs = Date.parse(toIso(data.publishedAt || data.createdAt));
        if (filters.from && eventMs < filters.from.getTime()) return false;
        if (filters.to && eventMs > filters.to.getTime()) return false;
        return true;
      })
      .sort((a, b) => Date.parse(toIso((b.data() as PostDoc).publishedAt || (b.data() as PostDoc).createdAt)) - Date.parse(toIso((a.data() as PostDoc).publishedAt || (a.data() as PostDoc).createdAt)))
      .slice(0, pageSize)
      .map((d) => serialize(workspaceId, d.id, d.data() as PostDoc));
    return { items };
  } catch (err) {
    console.error("[listPostsHistory error]", err);
    return { items: [] };
  }
}

export async function getPost(workspaceId: string, postId: string): Promise<PostListItem | null> {
  try {
    if (!adminDb) return null;
    const ref = collection(workspaceId).doc(postId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    return serialize(workspaceId, snap.id, snap.data() as PostDoc);
  } catch (err) {
    console.error("[getPost error]", err);
    return null;
  }
}

export async function createPost(workspaceId: string, authorUid: string, data: Partial<PostDoc>): Promise<string> {
  const ref = collection(workspaceId).doc();
  const now = SERVER_TIMESTAMP;
  const payload: Record<string, unknown> = {
    authorUid,
    caption: data.caption ?? "",
    platforms: data.platforms ?? [],
    mediaUrls: data.mediaUrls ?? [],
    mediaType: data.mediaType,
    hashtags: data.hashtags ?? [],
    labels: data.labels ?? [],
    altText: data.altText ?? [],
    altTextByPlatform: data.altTextByPlatform,
    collaborators: data.collaborators ?? [],
    firstComment: data.firstComment,
    firstCommentByPlatform: data.firstCommentByPlatform,
    community: data.community,
    quoteTweetUrl: data.quoteTweetUrl,
    tagUsers: data.tagUsers,
    feedType: data.feedType,
    carouselItems: data.carouselItems,
    trialReel: data.trialReel,
    document: data.document,
    frameCoverUrl: data.frameCoverUrl,
    customCoverUrl: data.customCoverUrl,
    threadRootId: data.threadRootId,
    scheduledAt: data.scheduledAt,
    captionsByPlatform: data.captionsByPlatform,
    sameForAll: data.sameForAll,
    advancedByPlatform: data.advancedByPlatform,
    status: data.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await ref.set(payload);
  return ref.id;
}

export async function updatePost(workspaceId: string, postId: string, patch: Partial<PostDoc>): Promise<void> {
  const ref = collection(workspaceId).doc(postId);
  await ref.update({ ...patch, updatedAt: SERVER_TIMESTAMP });
}

export async function softDeletePost(workspaceId: string, postId: string): Promise<void> {
  const ref = collection(workspaceId).doc(postId);
  await ref.update({ deletedAt: SERVER_TIMESTAMP, updatedAt: SERVER_TIMESTAMP });
}

export async function bulkCreatePosts(
  workspaceId: string,
  authorUid: string,
  items: Array<Partial<PostDoc>>
): Promise<string[]> {
  const coll = collection(workspaceId);
  const batch = adminDb!.batch();
  const ids: string[] = [];
  const now = SERVER_TIMESTAMP;
  for (const item of items) {
    const ref = coll.doc();
    ids.push(ref.id);
    const payload: Record<string, unknown> = {
      authorUid,
      caption: item.caption ?? "",
      platforms: item.platforms ?? [],
      mediaUrls: item.mediaUrls ?? [],
      hashtags: item.hashtags ?? [],
      labels: item.labels ?? [],
      altText: item.altText ?? [],
      collaborators: item.collaborators ?? [],
      scheduledAt: item.scheduledAt,
      firstComment: item.firstComment,
      community: item.community,
      quoteTweetUrl: item.quoteTweetUrl,
      threadRootId: item.threadRootId,
      postIn: item.postIn,
      youtubeTitle: item.youtubeTitle,
      youtubeTags: item.youtubeTags,
      pinterestBoard: item.pinterestBoard,
      autoAddMusic: item.autoAddMusic,
      profile: item.profile,
      status: item.status ?? "scheduled",
      captionsByPlatform: item.captionsByPlatform,
      sameForAll: item.sameForAll,
      advancedByPlatform: item.advancedByPlatform,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    batch.set(ref, payload);
  }
  await batch.commit();
  return ids;
}

export async function listScheduledDue(workspaceId: string, now: Date): Promise<PostListItem[]> {
  try {
    if (!adminDb) return [];
    const coll = collection(workspaceId);
    const q = coll
      .where("scheduledAt", "<=", now)
      .limit(200);
    const snap = await q.get();
    return snap.docs
      .filter((d) => {
        const data = d.data() as PostDoc;
        return !data.deletedAt && !data.uploadPostJobId && ["queued", "scheduled"].includes(data.status);
      })
      .map((d) => serialize(workspaceId, d.id, d.data() as PostDoc));
  } catch (err) {
    console.error("[listScheduledDue error]", err);
    return [];
  }
}

export async function claimPost(workspaceId: string, postId: string, workerId: string): Promise<boolean> {
  const ref = collection(workspaceId).doc(postId);
  return adminDb!.runTransaction(async (tx: unknown) => {
    const t = tx as { get: (r: unknown) => Promise<{ exists: boolean; data: () => unknown }>; update: (r: unknown, d: Record<string, unknown>) => void };
    const snap = await t.get(ref);
    if (!snap.exists) return false;
    const data = snap.data() as PostDoc;
    if (data.status !== "queued" && data.status !== "scheduled") return false;
    t.update(ref, {
      status: "publishing",
      workerId,
      claimedAt: SERVER_TIMESTAMP,
      updatedAt: SERVER_TIMESTAMP,
    });
    return true;
  });
}

export async function markPublished(workspaceId: string, postId: string): Promise<void> {
  await updatePost(workspaceId, postId, {
    status: "published",
    publishedAt: new Date(),
  });
}

export async function markFailed(workspaceId: string, postId: string, reason: string): Promise<void> {
  await updatePost(workspaceId, postId, {
    status: "failed",
    failureReason: reason,
  });
}

export async function resetStuckClaims(workspaceId: string, olderThanMs: number): Promise<number> {
  try {
    if (!adminDb) return 0;
    const coll = collection(workspaceId);
    const threshold = new Date(Date.now() - olderThanMs);
    const q = coll
      .where("claimedAt", "<=", threshold);
    const snap = await q.get();
    const batch = adminDb!.batch();
    let count = 0;
    for (const d of snap.docs) {
      const data = d.data() as PostDoc;
      if (data.deletedAt || data.status !== "publishing") continue;
      batch.update(d.ref, {
        status: "queued",
        workerId: null,
        claimedAt: null,
        updatedAt: SERVER_TIMESTAMP,
      });
      count++;
    }
    if (count > 0) await batch.commit();
    return count;
  } catch (err) {
    console.error("[resetStuckClaims error]", err);
    return 0;
  }
}

function serialize(workspaceId: string, id: string, data: PostDoc): PostListItem {
  return {
    id,
    workspaceId,
    status: data.status ?? "draft",
    caption: data.caption ?? "",
    platforms: data.platforms ?? [],
    mediaUrls: data.mediaUrls ?? [],
    hashtags: data.hashtags ?? [],
    labels: data.labels ?? [],
    firstComment: data.firstComment,
    community: data.community,
    quoteTweetUrl: data.quoteTweetUrl,
    threadRootId: data.threadRootId,
    postIn: data.postIn,
    youtubeTitle: data.youtubeTitle,
    youtubeTags: data.youtubeTags,
    pinterestBoard: data.pinterestBoard,
    autoAddMusic: data.autoAddMusic,
    profile: data.profile,
    failureReason: data.failureReason,
    uploadPostRequestId: data.uploadPostRequestId,
    uploadPostJobId: data.uploadPostJobId,
    scheduledAt: data.scheduledAt ? toIso(data.scheduledAt) : undefined,
    publishedAt: data.publishedAt ? toIso(data.publishedAt) : undefined,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function countPublishedPosts(
  workspaceId: string,
  from: Date,
  to: Date,
  platform?: PlatformId,
): Promise<number> {
  if (!adminDb) return 0;
  try {
    const q = adminDb
      .collection(`workspaces/${workspaceId}/posts`)
      .where("publishedAt", ">=", from)
      .where("publishedAt", "<=", to);
    const snap = await q.get();
    return snap.docs.filter((d) => {
      const data = d.data() as PostDoc;
      return !data.deletedAt && data.status === "published" && (!platform || data.platforms?.includes(platform));
    }).length;
  } catch {
    return 0;
  }
}
