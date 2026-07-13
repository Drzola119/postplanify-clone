import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { inviteMemberSchema, updateMemberRoleSchema } from "@/lib/validation/workspaces";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  if (id !== session.workspaceId) return jsonError(403, "Forbidden");
  if (!adminAuth || !adminDb) return jsonError(503, "Auth/DB not configured");

  const parsed = await parseBody(request, inviteMemberSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  // Look up the user by email.
  let userRecord;
  try {
    userRecord = await adminAuth.getUserByEmail(parsed.data.email);
  } catch {
    return jsonError(404, "User not found");
  }

  await adminDb.doc(`workspaces/${id}/members/${userRecord.uid}`).set({
    role: parsed.data.role,
    email: parsed.data.email,
    joinedAt: { _methodName: "serverTimestamp" },
  });

  // Set the user's primary workspace if they don't have one.
  await adminDb.doc(`users/${userRecord.uid}`).set(
    { primaryWorkspaceId: id },
    { merge: true }
  );

  return jsonOk({ uid: userRecord.uid, role: parsed.data.role }, 201);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  if (id !== session.workspaceId) return jsonError(403, "Forbidden");
  if (!adminDb) return jsonError(503, "DB not configured");

  const url = new URL(request.url);
  const uid = url.searchParams.get("uid");
  if (!uid) return jsonError(400, "uid is required");

  const parsed = await parseBody(request, updateMemberRoleSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  await adminDb.doc(`workspaces/${id}/members/${uid}`).update({ role: parsed.data.role });
  return jsonOk({ uid, role: parsed.data.role });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;
  if (id !== session.workspaceId) return jsonError(403, "Forbidden");
  if (!adminDb) return jsonError(503, "DB not configured");

  const url = new URL(request.url);
  const uid = url.searchParams.get("uid");
  if (!uid) return jsonError(400, "uid is required");

  await adminDb.doc(`workspaces/${id}/members/${uid}`).delete();
  return jsonOk({ uid });
}
