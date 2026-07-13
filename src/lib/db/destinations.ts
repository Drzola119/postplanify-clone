import "server-only";
import { adminDb } from "@/lib/db";
import type { DestinationDoc } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/destinations`);
}

export interface DestinationItem {
  id: string;
  platform: "bluesky" | "instagram" | "tiktok" | "youtube" | "pinterest" | "twitter" | "linkedin" | "threads" | "facebook" | "custom";
  type: "webhook" | "zapier" | "custom";
  url: string;
  active: boolean;
  createdAt: string;
}

export async function listDestinations(workspaceId: string): Promise<DestinationItem[]> {
  const snap = await collection(workspaceId).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => serialize(d.id, d.data() as DestinationDoc));
}

export async function getDestination(workspaceId: string, id: string): Promise<DestinationItem | null> {
  const snap = await collection(workspaceId).doc(id).get();
  if (!snap.exists) return null;
  return serialize(snap.id, snap.data() as DestinationDoc);
}

export async function createDestination(
  workspaceId: string,
  data: Partial<DestinationDoc>
): Promise<string> {
  const ref = collection(workspaceId).doc();
  await ref.set({
    platform: data.platform ?? "custom",
    type: data.type ?? "webhook",
    url: data.url ?? "",
    secret: data.secret,
    active: data.active ?? true,
    createdAt: SERVER_TIMESTAMP,
  });
  return ref.id;
}

export async function updateDestination(
  workspaceId: string,
  id: string,
  patch: Partial<DestinationDoc>
): Promise<void> {
  const ref = collection(workspaceId).doc(id);
  await ref.update(patch);
}

export async function deleteDestination(workspaceId: string, id: string): Promise<void> {
  await collection(workspaceId).doc(id).delete();
}

function serialize(id: string, data: DestinationDoc): DestinationItem {
  return {
    id,
    platform: data.platform ?? "custom",
    type: data.type ?? "webhook",
    url: data.url ?? "",
    active: data.active ?? true,
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
