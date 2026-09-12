import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/session-context";
import { canManage, getWorkspaceRole } from "@/lib/auth/workspace-role";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";

const inputSchema = z.object({
  revisionId: z.string().min(1).max(160).optional(),
  variantIds: z.array(z.string().min(1).max(160)).min(1).max(6),
  approvers: z.array(z.object({ name: z.string().trim().min(1).max(100), email: z.string().email() })).min(1).max(12),
  expiresInDays: z.union([z.literal(1), z.literal(7), z.literal(14), z.literal(30)]).default(14),
});

function digest(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database unavailable");
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canManage(role)) return jsonError(403, "Only workspace owners and admins can start a client review");
  const parsed = await parseBody(request, inputSchema);
  if (!parsed.ok) return jsonError(parsed.error.status, parsed.error.message, parsed.error.issues);
  const { projectId } = await params;
  const projectRef = adminDb.doc(`workspaces/${session.workspaceId}/videoProjects/${projectId}`);
  const projectSnap = await projectRef.get();
  if (!projectSnap.exists) return jsonError(404, "Video project not found");
  const project = projectSnap.data()!;
  const revisionId = parsed.data.revisionId ?? project.currentRevisionId;
  if (typeof revisionId !== "string" || !revisionId) return jsonError(400, "Save a version before starting review");
  const revision = await projectRef.collection("revisions").doc(revisionId).get();
  if (!revision.exists) return jsonError(404, "Review revision not found");
  const revisionVariants = new Set((Array.isArray(revision.data()?.variants) ? revision.data()?.variants : []).map((v: { id?: string }) => v.id));
  if (parsed.data.variantIds.some((id) => !revisionVariants.has(id))) return jsonError(400, "Every review variant must belong to the selected revision");

  const expiresAt = Date.now() + (parsed.data.expiresInDays ?? 14) * 24 * 60 * 60 * 1000;
  const approvers = parsed.data.approvers.map((approver, index) => ({ id: `approver_${index + 1}`, ...approver, status: "pending" as const }));
  const links: Array<{ approverId: string; name: string; email: string; url: string }> = [];
  const batch = adminDb.batch();
  approvers.forEach((approver) => {
    const token = randomBytes(32).toString("hex");
    batch.set(adminDb!.collection("videoReviewLinks").doc(digest(token)), {
      workspaceId: session.workspaceId,
      projectId,
      revisionId,
      variantIds: parsed.data.variantIds,
      approverId: approver.id,
      approverName: approver.name,
      approverEmail: approver.email,
      expiresAt,
      revoked: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    links.push({ approverId: approver.id, name: approver.name, email: approver.email, url: `/review/video/${token}` });
  });
  batch.update(projectRef, {
    reviewStatus: "in_review",
    reviewRevisionId: revisionId,
    reviewVariantIds: parsed.data.variantIds,
    reviewApprovers: approvers,
    reviewExpiresAt: expiresAt,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return jsonOk({ revisionId, expiresAt, links }, 201);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database unavailable");
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canManage(role)) return jsonError(403, "Only workspace owners and admins can revoke a review");
  const { projectId } = await params;
  const ref = adminDb.doc(`workspaces/${session.workspaceId}/videoProjects/${projectId}`);
  if (!(await ref.get()).exists) return jsonError(404, "Video project not found");
  await ref.update({ reviewStatus: "none", reviewApprovers: [], reviewExpiresAt: null, updatedAt: FieldValue.serverTimestamp() });
  await adminDb.collection("videoReviewLinks").where("workspaceId", "==", session.workspaceId).where("projectId", "==", projectId).get().then((snap) => Promise.all(snap.docs.map((doc) => doc.ref.update({ revoked: true }))));
  return jsonOk({ projectId, revoked: true });
}
