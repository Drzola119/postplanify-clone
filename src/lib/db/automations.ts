import "server-only";
import { adminDb } from "@/lib/db";
import type { PlatformId } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

export type AutoDmStatus = "active" | "paused";

export type AutoDmTrigger =
  | { kind: "comment-keyword"; keyword: string; match?: "contains" | "exact" | "starts-with" }
  | { kind: "first-comment"; postId?: string }
  | { kind: "follow"; postId?: string };

export interface AutoDmCampaignDoc {
  name: string;
  status: AutoDmStatus;
  trigger: AutoDmTrigger;
  platforms: PlatformId[];
  template: string;
  /** Cap sends per author per 24h to avoid spamming. */
  perAuthorPerDayCap?: number;
  stats: { triggered: number; sent: number; lastTriggeredAt?: Date };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoDmCampaignItem {
  id: string;
  workspaceId: string;
  name: string;
  status: AutoDmStatus;
  trigger: AutoDmTrigger;
  platforms: PlatformId[];
  template: string;
  perAuthorPerDayCap?: number;
  triggered: number;
  sent: number;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListAutoDmFilters {
  status?: AutoDmStatus;
  pageSize?: number;
  cursor?: string;
}

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/autoDmCampaigns`);
}

export async function listAutoDmCampaigns(
  workspaceId: string,
  filters: ListAutoDmFilters = {}
): Promise<{ items: AutoDmCampaignItem[]; nextCursor: string | null }> {
  const coll = collection(workspaceId);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);
  let q: any = coll.orderBy("createdAt", "desc").limit(pageSize);
  if (filters.status) q = q.where("status", "==", filters.status);

  const snap = await q.get();
  const items = snap.docs.map((d: { id: string; data: () => unknown }) =>
    serialize(workspaceId, d.id, d.data() as AutoDmCampaignDoc),
  );
  const nextCursor = items.length === pageSize ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

export async function getAutoDmCampaign(
  workspaceId: string,
  campaignId: string
): Promise<AutoDmCampaignItem | null> {
  const ref = collection(workspaceId).doc(campaignId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return serialize(workspaceId, snap.id, snap.data() as AutoDmCampaignDoc);
}

export async function createAutoDmCampaign(
  workspaceId: string,
  authorUid: string,
  data: Partial<AutoDmCampaignDoc>
): Promise<string> {
  const ref = collection(workspaceId).doc();
  const now = SERVER_TIMESTAMP;
  const payload: Record<string, unknown> = {
    name: data.name ?? "Untitled campaign",
    status: data.status ?? "active",
    trigger: data.trigger ?? { kind: "comment-keyword", keyword: "", match: "contains" },
    platforms: data.platforms ?? [],
    template: data.template ?? "",
    perAuthorPerDayCap: data.perAuthorPerDayCap,
    stats: { triggered: 0, sent: 0 },
    createdBy: authorUid,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(payload);
  return ref.id;
}

export async function updateAutoDmCampaign(
  workspaceId: string,
  campaignId: string,
  patch: Partial<AutoDmCampaignDoc>
): Promise<void> {
  const ref = collection(workspaceId).doc(campaignId);
  await ref.update({ ...patch, updatedAt: SERVER_TIMESTAMP });
}

export async function deleteAutoDmCampaign(
  workspaceId: string,
  campaignId: string
): Promise<void> {
  const ref = collection(workspaceId).doc(campaignId);
  await ref.delete();
}

export async function recordAutoDmTrigger(
  workspaceId: string,
  campaignId: string,
  sent: boolean
): Promise<void> {
  const ref = collection(workspaceId).doc(campaignId);
  await adminDb!.runTransaction(async (tx: any) => {
    const t = tx as { get: (r: unknown) => Promise<{ data: () => unknown }>; update: (r: unknown, d: Record<string, unknown>) => void };
    const snap = await t.get(ref);
    const cur = (snap.data() as AutoDmCampaignDoc | undefined)?.stats ?? { triggered: 0, sent: 0 };
    const next = {
      triggered: (cur.triggered ?? 0) + 1,
      sent: (cur.sent ?? 0) + (sent ? 1 : 0),
      lastTriggeredAt: new Date(),
    };
    t.update(ref, { stats: next, updatedAt: SERVER_TIMESTAMP });
  });
}

function serialize(workspaceId: string, id: string, data: AutoDmCampaignDoc): AutoDmCampaignItem {
  const stats = data.stats ?? { triggered: 0, sent: 0 };
  return {
    id,
    workspaceId,
    name: data.name ?? "",
    status: data.status ?? "paused",
    trigger: data.trigger,
    platforms: data.platforms ?? [],
    template: data.template ?? "",
    perAuthorPerDayCap: data.perAuthorPerDayCap,
    triggered: stats.triggered ?? 0,
    sent: stats.sent ?? 0,
    lastTriggeredAt: stats.lastTriggeredAt ? toIso(stats.lastTriggeredAt) : undefined,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

function toIso(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && v && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof v === "object" && v && "seconds" in v) {
    return new Date((v as { seconds: number }).seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}
