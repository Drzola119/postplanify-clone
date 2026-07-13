import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/firebase/admin";
import { updateWorkspaceSchema } from "@/lib/validation/workspaces";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  if (id !== session.workspaceId) return jsonError(403, "Forbidden");
  if (!adminDb) return jsonError(503, "DB not configured");
  const parsed = await parseBody(request, updateWorkspaceSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  await adminDb.doc(`workspaces/${id}`).set(parsed.data, { merge: true });
  return jsonOk({ id });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  if (id !== session.workspaceId) return jsonError(403, "Forbidden");
  return jsonError(501, "Workspace deletion not supported in v1");
}
