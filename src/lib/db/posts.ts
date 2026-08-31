import "server-only";
import { toIso } from "@/lib/db/date-utils";
import { adminDb, FieldValue } from "@/lib/db";
import { calculateCaptionDeadlines, calculatePriorityScore } from "@/lib/ai/fair-scheduler";
import type { PostDoc, PostStatus, PlatformId } from "@/lib/db/schema";
import { createLogger } from "@/lib/log";

const log = createLogger("db:posts");

const SERVER_TIMESTAMP = FieldValue.serverTimestamp();

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/posts`);
}

/**
 * Firestore rejects `undefined` values. We strip them so callers can safely
 * pass optional fields without branching every call site.
 */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
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

    const wantedStatuses = filters.status
      ? new Set(Array.isArray(filters.status) ? filters.status : [filters.status])
      : null;

    // Try indexed query first when filters allow server-side narrowing.
    // Falls back to in-memory 1000-doc fetch on missing-index errors so the
    // UI never hard-fails while indexes deploy.
    const tryIndexed = Boolean(wantedStatuses || filters.platform);
    if (tryIndexed) {
      try {
        let q: unknown = coll as unknown;
        if (wantedStatuses) {
          const arr = [...wantedStatuses];
          if (arr.length === 1) q = (q as { where: Function }).where("status", "==", arr[0]);
          else q = (q as { where: Function }).where("status", "in", arr.slice(0, 10));
        }
        if (filters.platform) {
          q = (q as { where: Function }).where("platforms", "array-contains", filters.platform);
        }
        let ordered: unknown = (q as { orderBy: Function }).orderBy("createdAt", "desc");
        if (filters.cursor) {
          try {
            const cursorSnap = await coll.doc(filters.cursor).get();
            if (cursorSnap.exists) ordered = (ordered as { startAfter: Function }).startAfter(cursorSnap);
          } catch {}
        }
        const snap = await (ordered as { limit: Function }).limit(pageSize + 1).get() as { docs: Array<{ id: string; data: () => unknown; ref?: unknown }> };
        // filter soft-delete + date range in-memory (small)
        const docs = snap.docs.filter((d) => {
          const data = d.data() as unknown as PostDoc;
          if (data.deletedAt) return false;
          const createdMs = Date.parse(toIso(data.createdAt));
          if (filters.sinceDate && createdMs < filters.sinceDate.getTime()) return false;
          if (filters.untilDate && createdMs > filters.untilDate.getTime()) return false;
          return true;
        });
        const hasMore = docs.length > pageSize;
        const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;
        const items = pageDocs.map((d) => serialize(workspaceId, d.id, d.data() as unknown as PostDoc));
        const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;
        return { items, nextCursor };
      } catch (idxErr) {
        const msg = idxErr instanceof Error ? idxErr.message : String(idxErr);
        // Missing index → fall through to broad fetch. Other errors also fall through to avoid hard 500.
        if (!/requires an index|FAILED_PRECONDITION/i.test(msg)) {
          log.warn("listPosts indexed query fallback", { err: msg });
        }
      }
    }

    // Broad fetch fallback (in-memory filter) — up to 1000 most recent.
    let snap;
    try {
      let q = coll.orderBy("createdAt", "desc").limit(1000);
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
      log.warn("listPosts orderBy fallback", { err: String(orderErr) });
      snap = await coll.limit(1000).get();
    }

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
    log.error(err, { where: "listPosts" });
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
    log.error(err, { where: "listPostsHistory" });
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
    log.error(err, { where: "getPost" });
    return null;
  }
}

export async function createPost(workspaceId: string, authorUid: string, data: Partial<PostDoc>): Promise<string> {
  const ref = collection(workspaceId).doc();
  const now = SERVER_TIMESTAMP;
  const scheduledAtRaw = data.scheduledAt as unknown;
  const scheduledAt = typeof scheduledAtRaw === "string" ? new Date(scheduledAtRaw) : (scheduledAtRaw as Date | undefined);
  const scheduledAtValid = scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt : undefined;
  const raw: Record<string, unknown> = {
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
    scheduledAt: scheduledAtValid,
    captionsByPlatform: data.captionsByPlatform,
    sameForAll: data.sameForAll,
    advancedByPlatform: data.advancedByPlatform,
    status: data.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const payload = stripUndefined(raw);
  await ref.set(payload);
  return ref.id;
}

export async function updatePost(workspaceId: string, postId: string, patch: Partial<PostDoc>): Promise<void> {
  const ref = collection(workspaceId).doc(postId);
  const cleaned = stripUndefined(patch as Record<string, unknown>);
  await ref.update({ ...cleaned, updatedAt: SERVER_TIMESTAMP });

  // GAP-7: If scheduledAt changed, propagate recomputed deadlines to active captionJobs
  if (patch.scheduledAt && adminDb) {
    try {
      const jobsSnap = await adminDb
        .collection("captionJobs")
        .where("postId", "==", postId)
        .where("status", "in", ["pending", "ready_to_run", "retrying"])
        .get();

      if (!jobsSnap.empty) {
        const batch = adminDb.batch();
        const deadlines = calculateCaptionDeadlines(patch.scheduledAt);

        for (const doc of jobsSnap.docs) {
          const docData = doc.data();
          const priorityScore = calculatePriorityScore(
            patch.scheduledAt,
            docData.createdAt ? toIso(docData.createdAt) : new Date().toISOString(),
            docData.attempts || 0
          );

          batch.update(doc.ref, {
            scheduledAt: deadlines.scheduledAt.toISOString(),
            generationRecommendedAt: deadlines.generationRecommendedAt.toISOString(),
            generationDeadline: deadlines.generationDeadline.toISOString(),
            emergencyDeadline: deadlines.emergencyDeadline.toISOString(),
            priorityScore,
            updatedAt: SERVER_TIMESTAMP,
          });
        }

        await batch.commit();
      }
    } catch (err) {
      log.warn("updatePost captionJob deadline propagation error", { err: String(err) });
    }
  }
}

export async function softDeletePost(workspaceId: string, postId: string): Promise<void> {
  const ref = collection(workspaceId).doc(postId);
  await ref.update({ deletedAt: SERVER_TIMESTAMP, updatedAt: SERVER_TIMESTAMP });
}

export async function bulkCreatePosts(
  workspaceId: string,
  authorUid: string,
  items: Array<Partial<PostDoc> & {
    captionGenerationMode?: "automatic" | "manual";
    captionFallback?: "hold" | "publish_without_caption";
    captionTone?: string;
    captionIncludeHashtags?: boolean;
    captionUseEmojis?: boolean;
    captionExtra?: string;
    videoTitle?: string;
  }>
): Promise<string[]> {
  const coll = collection(workspaceId);
  const batch = adminDb!.batch();
  const ids: string[] = [];
  const now = SERVER_TIMESTAMP;
  const captionJobsToCreate: Array<{
    postId: string;
    scheduledAt: Date | string;
    inputSnapshot: {
      tone?: string;
      includeHashtags?: boolean;
      useEmojis?: boolean;
      extra?: string;
      videoTitle?: string;
      mediaUrls?: string[];
      imageUrl?: string | null;
      platforms?: Array<{ id: string; name: string; charLimit: number }>;
      multiPlatform?: boolean;
    };
  }> = [];

  for (const item of items) {
    const ref = coll.doc();
    const postId = ref.id;
    ids.push(postId);

    // Firestore queries (listScheduledDue) compare scheduledAt as Timestamp — coerce ISO strings to Date.
    const scheduledAtRaw = item.scheduledAt as unknown;
    const scheduledAt = typeof scheduledAtRaw === "string" ? new Date(scheduledAtRaw) : (scheduledAtRaw as Date | undefined);
    const scheduledAtValid = scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt : undefined;

    const isAutoCaption = item.captionGenerationMode === "automatic" || (!item.caption?.trim() && (item.status === "scheduled" || item.status === "queued"));

    if (isAutoCaption && scheduledAtValid) {
      captionJobsToCreate.push({
        postId,
        scheduledAt: scheduledAtValid,
        inputSnapshot: {
          tone: item.captionTone ?? "default",
          includeHashtags: item.captionIncludeHashtags ?? true,
          useEmojis: item.captionUseEmojis ?? true,
          extra: item.captionExtra,
          videoTitle: item.videoTitle || (item.youtubeTitle ?? undefined),
          mediaUrls: item.mediaUrls ?? [],
          imageUrl: item.mediaUrls?.[0] ?? null,
          platforms: (item.platforms ?? []).map((p) => ({ id: p, name: p, charLimit: 280 })),
          multiPlatform: true,
        },
      });
    }

    const raw: Record<string, unknown> = {
      authorUid,
      caption: item.caption ?? "",
      captionGenerationMode: isAutoCaption ? "automatic" : "manual",
      captionJobStatus: isAutoCaption ? "pending" : undefined,
      captionFallback: item.captionFallback ?? "hold",
      platforms: item.platforms ?? [],
      mediaUrls: item.mediaUrls ?? [],
      mediaType: (item as unknown as { mediaType?: string }).mediaType ?? (item.carouselItems ? "carousel" : item.trialReel ? "trial_reel" : item.document ? "document" : undefined),
      carouselItems: (item as unknown as { carouselItems?: unknown }).carouselItems,
      trialReel: (item as unknown as { trialReel?: unknown }).trialReel,
      document: (item as unknown as { document?: unknown }).document,
      hashtags: item.hashtags ?? [],
      labels: item.labels ?? [],
      altText: item.altText ?? [],
      collaborators: item.collaborators ?? [],
      scheduledAt: scheduledAtValid,
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
    batch.set(ref, stripUndefined(raw));
  }

  await batch.commit();

  // Create caption jobs non-blockingly for all auto-caption items
  if (captionJobsToCreate.length > 0) {
    const { createCaptionJob } = await import("@/lib/db/caption-jobs");
    await Promise.all(
      captionJobsToCreate.map((job) =>
        createCaptionJob({
          workspaceId,
          userId: authorUid,
          postId: job.postId,
          scheduledAt: job.scheduledAt,
          inputSnapshot: job.inputSnapshot,
        }).catch((err) => {
          console.warn(`[bulkCreatePosts] Failed to enqueue caption job for post ${job.postId}:`, err);
        })
      )
    );
  }

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
    log.error(err, { where: "listScheduledDue" });
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
    log.error(err, { where: "resetStuckClaims" });
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
