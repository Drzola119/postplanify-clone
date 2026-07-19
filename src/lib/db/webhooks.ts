import "server-only";
import { toIso } from "@/lib/db/date-utils";
import { adminDb } from "@/lib/db";
import type { WebhookDoc } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/webhooks`);
}

export interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastDeliveryAt?: string;
  createdAt: string;
}

export async function listWebhooks(workspaceId: string): Promise<WebhookItem[]> {
  const snap = await collection(workspaceId).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => serialize(d.id, d.data() as WebhookDoc));
}

export async function getWebhook(workspaceId: string, id: string): Promise<WebhookItem | null> {
  const snap = await collection(workspaceId).doc(id).get();
  if (!snap.exists) return null;
  return serialize(snap.id, snap.data() as WebhookDoc);
}

/** Internal: returns the secret for signing deliveries. Never expose to clients. */
export async function getWebhookSecret(workspaceId: string, id: string): Promise<string | null> {
  const snap = await collection(workspaceId).doc(id).get();
  if (!snap.exists) return null;
  return (snap.data() as WebhookDoc).secret ?? null;
}

export async function createWebhook(workspaceId: string, data: Partial<WebhookDoc>): Promise<string> {
  const ref = collection(workspaceId).doc();
  await ref.set({
    url: data.url ?? "",
    events: data.events ?? [],
    secret: data.secret ?? "",
    active: data.active ?? true,
    createdAt: SERVER_TIMESTAMP,
  });
  return ref.id;
}

export async function updateWebhook(workspaceId: string, id: string, patch: Partial<WebhookDoc>): Promise<void> {
  await collection(workspaceId).doc(id).update(patch);
}

export async function deleteWebhook(workspaceId: string, id: string): Promise<void> {
  await collection(workspaceId).doc(id).delete();
}

export async function markDelivered(workspaceId: string, id: string): Promise<void> {
  await collection(workspaceId).doc(id).update({ lastDeliveryAt: SERVER_TIMESTAMP });
}

function serialize(id: string, data: WebhookDoc): WebhookItem {
  return {
    id,
    url: data.url ?? "",
    events: data.events ?? [],
    active: data.active ?? true,
    lastDeliveryAt: data.lastDeliveryAt ? toIso(data.lastDeliveryAt) : undefined,
    createdAt: toIso(data.createdAt),
  };
}


