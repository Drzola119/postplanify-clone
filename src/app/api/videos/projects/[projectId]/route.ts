import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canRead, canWrite, canManage } from "@/lib/auth/workspace-role";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  brandKitId: z.string().max(120).nullable().optional(),
  draft: z.record(z.unknown()).optional(),
  expectedDraftVersion: z.number().int().nonnegative().optional(),
  lastOpened: z.boolean().optional(),
  lifecycle: z.enum(["draft", "active", "archived"]).optional(),
});

function iso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof (value as { toDate?: unknown }).toDate === "function") return (value as { toDate: () => Date }).toDate().toISOString();
  return typeof value === "string" ? value : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database unavailable");
  const { projectId } = await params;
  if (!projectId || projectId.startsWith("legacy_")) return jsonError(400, "A saved project is required");
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canRead(role)) return jsonError(403, "You do not have permission to view this project");
  const ref = adminDb.doc(`workspaces/${session.workspaceId}/videoProjects/${projectId}`);
  const snap = await ref.get();
  if (!snap.exists) return jsonError(404, "Video project not found");
  const data = snap.data()!;
  return jsonOk({
    project: {
      id: snap.id,
      ...data,
      createdAt: iso(data.createdAt),
      updatedAt: iso(data.updatedAt),
      lastOpenedAt: iso(data.lastOpenedAt),
    },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database unavailable");
  const { projectId } = await params;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canWrite(role)) return jsonError(403, "You do not have permission to edit this project");
  const parsed = await parseBody(request, patchSchema);
  if (!parsed.ok) return jsonError(parsed.error.status, parsed.error.message, parsed.error.issues);

  const ref = adminDb.doc(`workspaces/${session.workspaceId}/videoProjects/${projectId}`);
  const snap = await ref.get();
  if (!snap.exists) return jsonError(404, "Video project not found");
  const current = snap.data()!;
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  for (const key of ["title", "description", "tags", "brandKitId", "lifecycle"] as const) {
    if (parsed.data[key] !== undefined) update[key] = parsed.data[key];
  }
  if (parsed.data.draft !== undefined) {
    const expected = parsed.data.expectedDraftVersion;
    const actual = Number(current.draftVersion ?? 0);
    if (expected !== undefined && expected !== actual) {
      return jsonError(409, "This project changed in another session", { expected, actual });
    }
    update.draft = parsed.data.draft;
    update.draftVersion = actual + 1;
    update.lifecycle = "active";
  }
  if (parsed.data.lastOpened) update.lastOpenedAt = FieldValue.serverTimestamp();
  await ref.update(update);
  return jsonOk({ projectId, draftVersion: update.draftVersion ?? current.draftVersion ?? 0 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database unavailable");
  const { projectId } = await params;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canManage(role)) return jsonError(403, "Only workspace owners and admins can archive video projects");
  const ref = adminDb.doc(`workspaces/${session.workspaceId}/videoProjects/${projectId}`);
  if (!(await ref.get()).exists) return jsonError(404, "Video project not found");
  await ref.update({ lifecycle: "archived", updatedAt: FieldValue.serverTimestamp() });
  return jsonOk({ projectId, lifecycle: "archived" });
}
