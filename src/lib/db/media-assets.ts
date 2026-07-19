import "server-only";
import { toIso } from "@/lib/db/date-utils";
import { adminDb } from "@/lib/db";
import type { MediaAssetDoc } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/mediaAssets`);
}

export interface ListAssetsFilters {
  folder?: "posts" | "brands" | "avatars" | "assets";
  mime?: string;
  pageSize?: number;
  cursor?: string;
}

export interface MediaAssetItem {
  id: string;
  workspaceId: string;
  url: string;
  storedPath: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
  folder: "posts" | "brands" | "avatars" | "assets";
}

export async function listAssets(
  workspaceId: string,
  filters: ListAssetsFilters = {}
): Promise<{ items: MediaAssetItem[]; nextCursor: string | null }> {
  const coll = collection(workspaceId);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);

  let q: { where: (f: string, op: string, v: unknown) => typeof q; orderBy: (f: string, d?: string) => typeof q; limit: (n: number) => { get: () => Promise<{ docs: Array<{ id: string; data: () => unknown }> }> }; get: () => Promise<{ docs: Array<{ id: string; data: () => unknown }> }> } = coll
    .orderBy("uploadedAt", "desc")
    .limit(pageSize) as unknown as typeof q;
  if (filters.folder) q = q.where("folder", "==", filters.folder);
  if (filters.mime) q = q.where("mime", "==", filters.mime);

  const snap = await q.get();
  const items = snap.docs.map((d) => serialize(workspaceId, d.id, d.data() as MediaAssetDoc));
  const nextCursor = items.length === pageSize ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

export async function getAsset(workspaceId: string, assetId: string): Promise<MediaAssetItem | null> {
  const ref = collection(workspaceId).doc(assetId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return serialize(workspaceId, snap.id, snap.data() as MediaAssetDoc);
}

export async function createAsset(
  workspaceId: string,
  uploadedBy: string,
  data: Partial<MediaAssetDoc>
): Promise<string> {
  const ref = collection(workspaceId).doc();
  await ref.set({
    workspaceId,
    url: data.url ?? "",
    storedPath: data.storedPath ?? "",
    mime: data.mime ?? "application/octet-stream",
    size: data.size ?? 0,
    width: data.width,
    height: data.height,
    duration: data.duration,
    uploadedBy,
    uploadedAt: SERVER_TIMESTAMP,
    tags: data.tags ?? [],
    folder: data.folder ?? "assets",
  });
  return ref.id;
}

export async function softDeleteAsset(workspaceId: string, assetId: string): Promise<void> {
  const ref = collection(workspaceId).doc(assetId);
  await ref.update({ deletedAt: SERVER_TIMESTAMP });
}

export async function countReferencesToAsset(workspaceId: string, assetUrl: string): Promise<number> {
  if (!adminDb) return 0;
  const posts = await adminDb
    .collection(`workspaces/${workspaceId}/posts`)
    .where("mediaUrls", "array-contains", assetUrl)
    .get();
  return posts.size;
}

function serialize(workspaceId: string, id: string, data: MediaAssetDoc): MediaAssetItem {
  return {
    id,
    workspaceId,
    url: data.url ?? "",
    storedPath: data.storedPath ?? "",
    mime: data.mime ?? "application/octet-stream",
    size: data.size ?? 0,
    width: data.width,
    height: data.height,
    duration: data.duration,
    uploadedBy: data.uploadedBy ?? "",
    uploadedAt: toIso(data.uploadedAt),
    tags: data.tags ?? [],
    folder: data.folder ?? "assets",
  };
}


