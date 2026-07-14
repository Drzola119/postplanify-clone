import "server-only";
import { adminDb, FieldValue } from "@/lib/db";
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
}

export async function listPosts(workspaceId: string, filters: ListPostsFilters = {}): Promise<{ items: PostListItem[]; nextCursor: string | null }> {
  const coll = collection(workspaceId);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);

  let q = coll.orderBy("createdAt", "desc").limit(pageSize);
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      q = q.where("status", "in", filters.status);
    } else {
      q = q.where("status", "==", filters.status);
    }
  }
  if (filters.platform) q = q.where("platforms", "array-contains", filters.platform);

  const snap = await q.get();
  const items = snap.docs.map((d: { id: string; data: () => unknown }) => serialize(workspaceId, d.id, d.data() as PostDoc));
  const nextCursor = items.length === pageSize ? items[items.length - 1].id : null;
  return { items, nextCursor };
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
  const coll = collection(workspaceId);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 50, 1), 100);

  // Order by publishedAt (when present) descending. For failed posts that
  // never published, fall back to createdAt in the client filter below.
  let q = coll.orderBy("publishedAt", "desc").limit(pageSize);
  if (filters.status) {
    q = q.where("status", "==", filters.status);
  } else {
    q = q.where("status", "in", ["published", "failed"]);
  }
  if (filters.platform) q = q.where("platforms", "array-contains", filters.platform);
  if (filters.from) q = q.where("publishedAt", ">=", filters.from);

  const snap = await q.get();
  let items = snap.docs.map((d) => serialize(workspaceId, d.id, d.data() as PostDoc));
  if (filters.to) {
    const cutoff = filters.to.getTime();
    items = items.filter((it) => {
      const t = it.publishedAt ? Date.parse(it.publishedAt) : 0;
      return t > 0 && t <= cutoff;
    });
  }
  return { items };
}

export async function getPost(workspaceId: string, postId: string): Promise<PostListItem | null> {
  const ref = collection(workspaceId).doc(postId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return serialize(workspaceId, snap.id, snap.data() as PostDoc);
}

export async function createPost(workspaceId: string, authorUid: string, data: Partial<PostDoc>): Promise<string> {
  const ref = collection(workspaceId).doc();
  const now = SERVER_TIMESTAMP;
  const payload: Record<string, unknown> = {
    authorUid,
    caption: data.caption ?? "",
    platforms: data.platforms ?? [],
    mediaUrls: data.mediaUrls ?? [],
    hashtags: data.hashtags ?? [],
    labels: data.labels ?? [],
    altText: data.altText ?? [],
    collaborators: data.collaborators ?? [],
    firstComment: data.firstComment,
    community: data.community,
    quoteTweetUrl: data.quoteTweetUrl,
    threadRootId: data.threadRootId,
    scheduledAt: data.scheduledAt,
    status: data.status ?? "draft",
    createdAt: now,
    updatedAt: now,
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
      status: item.status ?? "scheduled",
      createdAt: now,
      updatedAt: now,
    };
    batch.set(ref, payload);
  }
  await batch.commit();
  return ids;
}

export async function listScheduledDue(workspaceId: string, now: Date): Promise<PostListItem[]> {
  const coll = collection(workspaceId);
  const q = coll
    .where("status", "in", ["queued", "scheduled"])
    .where("scheduledAt", "<=", now)
    .limit(50);
  const snap = await q.get();
  return snap.docs.map((d) => serialize(workspaceId, d.id, d.data() as PostDoc));
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
  const coll = collection(workspaceId);
  const threshold = new Date(Date.now() - olderThanMs);
  const q = coll.where("status", "==", "publishing").where("claimedAt", "<=", threshold);
  const snap = await q.get();
  const batch = adminDb!.batch();
  let count = 0;
  for (const d of snap.docs) {
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
    scheduledAt: data.scheduledAt ? toIso(data.scheduledAt) : undefined,
    publishedAt: data.publishedAt ? toIso(data.publishedAt) : undefined,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

function toIso(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && v && "_methodName" in v) return new Date().toISOString();
  if (typeof v === "object" && v && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof v === "object" && v && "seconds" in v) {
    const s = (v as { seconds: number }).seconds;
    return new Date(s * 1000).toISOString();
  }
  return new Date().toISOString();
}