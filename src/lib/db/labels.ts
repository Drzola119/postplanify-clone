import "server-only";
import { toIso } from "@/lib/db/date-utils";
import { adminDb } from "@/lib/db";
import type { LabelDoc } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/labels`);
}

export interface LabelItem {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export async function listLabels(workspaceId: string): Promise<LabelItem[]> {
  const snap = await collection(workspaceId).orderBy("name", "asc").get();
  return snap.docs.map((d) => {
    const data = d.data() as LabelDoc;
    return { id: d.id, name: data.name, color: data.color ?? "#6366f1", createdAt: toIso(data.createdAt) };
  });
}

export async function createLabel(workspaceId: string, input: { name: string; color?: string }): Promise<string> {
  const ref = collection(workspaceId).doc();
  await ref.set({
    name: input.name,
    color: input.color ?? "#6366f1",
    createdAt: SERVER_TIMESTAMP,
  });
  return ref.id;
}

export async function updateLabel(
  workspaceId: string,
  id: string,
  patch: { name?: string; color?: string }
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.color !== undefined) data.color = patch.color;
  if (Object.keys(data).length === 0) return;
  await collection(workspaceId).doc(id).update(data);
}

export async function deleteLabel(workspaceId: string, id: string): Promise<void> {
  await collection(workspaceId).doc(id).delete();
}


