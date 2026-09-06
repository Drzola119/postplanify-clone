import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

/** Read the caller's role in a workspace via the Admin SDK (bypasses rules). */
export async function getWorkspaceRole(
  workspaceId: string,
  uid: string
): Promise<WorkspaceRole | null> {
  if (!adminDb) return null;
  const snap = await adminDb.doc(`workspaces/${workspaceId}/members/${uid}`).get().catch(() => null);
  if (!snap?.exists) return null;
  const role = (snap.data() as { role?: unknown })?.role;
  return role === "owner" || role === "admin" || role === "editor" || role === "viewer" ? role : null;
}

/** Viewer+ may read; editor+ may send/reply/sync; admin+ manages monitors/exports. */
export function canRead(role: WorkspaceRole | null): boolean {
  return role !== null;
}

export function canWrite(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}

export function canManage(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "admin";
}
