import "server-only";
import { adminDb } from "@/lib/db";
import type { DestinationDoc, PlatformId } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/destinations`);
}

export interface DestinationItem {
  id: string;
  platform: PlatformId | "custom";
  type: "webhook" | "zapier" | "custom";
  url: string;
  events: string[];
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

/** Internal: returns the secret for signing deliveries. Never expose to clients. */
export async function getDestinationSecret(workspaceId: string, id: string): Promise<string | null> {
  const snap = await collection(workspaceId).doc(id).get();
  if (!snap.exists) return null;
  return (snap.data() as DestinationDoc).secret ?? null;
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
    events: data.events ?? [],
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

export async function markDestinationDelivered(workspaceId: string, id: string): Promise<void> {
  await collection(workspaceId).doc(id).update({ lastDeliveryAt: SERVER_TIMESTAMP });
}

function serialize(id: string, data: DestinationDoc): DestinationItem {
  return {
    id,
    platform: data.platform ?? "custom",
    type: data.type ?? "webhook",
    url: data.url ?? "",
    events: data.events ?? [],
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
