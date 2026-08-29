import "server-only";
import { toIso } from "@/lib/db/date-utils";
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
  /** First media URL (if any) — used by the table to render a thumbnail. */
  firstMediaUrl?: string;
  /** First media kind: "image" | "video". Empty when there are no media. */
  firstMediaType?: "image" | "video";
  updatedAt: string;
  createdAt: string;
}

export async function listDrafts(workspaceId: string, authorUid?: string): Promise<DraftListItem[]> {
  try {
    if (!adminDb) return [];
    const drafts = collection(workspaceId);
    const query = authorUid ? drafts.where("authorUid", "==", authorUid) : drafts;
    const snap = await query.get();
    return snap.docs
      .map((d) => ({ id: d.id, data: d.data() as DraftDoc }))
      .map(({ id, data }) => serialize(workspaceId, id, data))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 100);
  } catch (err) {
    console.warn("[listDrafts warning]", err);
    return [];
  }
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
  const items = data.mediaItems ?? [];
  const first = items[0];
  return {
    id,
    workspaceId,
    caption: data.caption ?? "",
    platforms: data.platforms ?? [],
    mediaCount: items.length,
    firstMediaUrl: first?.url || undefined,
    firstMediaType: first?.type,
    updatedAt: toIso(data.updatedAt),
    createdAt: toIso(data.createdAt),
  };
}
