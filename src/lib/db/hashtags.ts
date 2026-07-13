import "server-only";
import { adminDb } from "@/lib/db";
import type { HashtagSetDoc, PlatformId } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function setsCollection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/hashtagSets`);
}

function trendingCollection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/hashtagsTrending`);
}

export interface HashtagSetItem {
  id: string;
  name: string;
  hashtags: string[];
  platform?: PlatformId;
  createdAt: string;
}

export interface TrendingHashtagItem {
  id: string;
  tag: string;
  platform: PlatformId;
  score: number;
  capturedAt: string;
}

export async function listSets(workspaceId: string): Promise<HashtagSetItem[]> {
  const snap = await setsCollection(workspaceId).orderBy("name", "asc").get();
  return snap.docs.map((d) => {
    const data = d.data() as HashtagSetDoc;
    return {
      id: d.id,
      name: data.name,
      hashtags: data.hashtags ?? [],
      platform: data.platform,
      createdAt: toIso(data.createdAt),
    };
  });
}

export async function createSet(
  workspaceId: string,
  input: { name: string; hashtags: string[]; platform?: PlatformId }
): Promise<string> {
  const ref = setsCollection(workspaceId).doc();
  await ref.set({
    name: input.name,
    hashtags: input.hashtags,
    platform: input.platform,
    createdAt: SERVER_TIMESTAMP,
  });
  return ref.id;
}

export async function updateSet(
  workspaceId: string,
  id: string,
  patch: { name?: string; hashtags?: string[]; platform?: PlatformId }
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.hashtags !== undefined) data.hashtags = patch.hashtags;
  if (patch.platform !== undefined) data.platform = patch.platform;
  if (Object.keys(data).length === 0) return;
  await setsCollection(workspaceId).doc(id).update(data);
}

export async function deleteSet(workspaceId: string, id: string): Promise<void> {
  await setsCollection(workspaceId).doc(id).delete();
}

export async function getTrending(
  workspaceId: string,
  platform?: PlatformId
): Promise<TrendingHashtagItem[]> {
  let q = trendingCollection(workspaceId).orderBy("score", "desc").limit(20) as unknown as {
    where: (f: string, op: string, v: unknown) => typeof q;
    get: () => Promise<{ docs: Array<{ id: string; data: () => unknown }> }>;
  };
  if (platform) q = q.where("platform", "==", platform);
  const snap = await q.get();
  return snap.docs.map((d) => {
    const data = d.data() as { tag: string; platform: PlatformId; score: number; capturedAt: Date | string };
    return {
      id: d.id,
      tag: data.tag,
      platform: data.platform,
      score: data.score ?? 0,
      capturedAt: toIso(data.capturedAt),
    };
  });
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
