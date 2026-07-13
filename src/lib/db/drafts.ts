import "server-only";
import { adminDb } from "@/lib/db";
import type { DraftDoc, PlatformId } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/drafts`);
}

export interface DraftListItem {
  id: string;
  workspaceId: string;
  caption: string;
  platforms: PlatformId[];
  mediaCount: number;
  updatedAt: string;
  createdAt: string;
}

export async function listDrafts(workspaceId: string, authorUid?: string): Promise<DraftListItem[]> {
  let q: ReturnType<typeof collection> | unknown = collection(workspaceId).orderBy("updatedAt", "desc").limit(100);
  if (authorUid) q = (q as { where: (f: string, op: string, v: unknown) => unknown }).where("authorUid", "==", authorUid);
  const snap = await (q as { get: () => Promise<{ docs: Array<{ id: string; data: () => unknown }> }> }).get();
  return snap.docs.map((d) => serialize(workspaceId, d.id, d.data() as DraftDoc));
}

export async function getDraft(workspaceId: string, draftId: string): Promise<DraftListItem | null> {
  const ref = collection(workspaceId).doc(draftId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return serialize(workspaceId, snap.id, snap.data() as DraftDoc);
}

export async function saveDraft(workspaceId: string, authorUid: string, input: { id?: string } & Partial<DraftDoc>): Promise<string> {
  const coll = collection(workspaceId);
  const ref = input.id ? coll.doc(input.id) : coll.doc();
  const now = SERVER_TIMESTAMP;
  const payload: Record<string, unknown> = {
    caption: input.caption ?? "",
    platforms: input.platforms ?? [],
    mediaItems: input.mediaItems ?? [],
    sameForAll: input.sameForAll ?? true,
    selected: input.selected ?? {},
    collaborators: input.collaborators ?? [],
    tagUsers: input.tagUsers ?? [],
    customCoverUrl: input.customCoverUrl,
    frameCoverUrl: input.frameCoverUrl,
    activeMediaId: input.activeMediaId,
    firstComment: input.firstComment,
    quoteTweetUrl: input.quoteTweetUrl,
    community: input.community,
    authorUid,
    updatedAt: now,
    createdAt: now,
  };
  await ref.set(payload, { merge: true });
  return ref.id;
}

export async function deleteDraft(workspaceId: string, draftId: string): Promise<void> {
  await collection(workspaceId).doc(draftId).delete();
}

function serialize(workspaceId: string, id: string, data: DraftDoc): DraftListItem {
  return {
    id,
    workspaceId,
    caption: data.caption ?? "",
    platforms: data.platforms ?? [],
    mediaCount: (data.mediaItems ?? []).length,
    updatedAt: toIso(data.updatedAt),
    createdAt: toIso(data.createdAt),
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