import "server-only";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

const actionSchema = z.object({
  token: z.string().length(64),
  action: z.enum(["add_comment", "approve", "request_changes"]),
  content: z.string().trim().min(1).max(2000).optional(),
  timestampMs: z.number().int().nonnegative().max(86_400_000).optional(),
  sceneId: z.string().max(160).nullable().optional(),
  variantId: z.string().max(160).nullable().optional(),
});

async function resolve(token: string) {
  if (!adminDb || !/^[a-f0-9]{64}$/.test(token)) throw new Error("Invalid review link");
  const ref = adminDb.collection("videoReviewLinks").doc(createHash("sha256").update(token).digest("hex"));
  const snap = await ref.get();
  const data = snap.data();
  if (!data || data.revoked || Number(data.expiresAt) < Date.now()) throw new Error("Review link has expired or was revoked");
  return { ref, data };
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token") || "";
    const { data } = await resolve(token);
    const projectRef = adminDb!.doc(`workspaces/${data.workspaceId}/videoProjects/${data.projectId}`);
    const projectSnap = await projectRef.get();
    if (!projectSnap.exists) throw new Error("Video project not found");
    const project = projectSnap.data()!;
    if (project.currentRevisionId !== data.revisionId && project.reviewRevisionId !== data.revisionId) throw new Error("This review revision is no longer active");
    const revision = await projectRef.collection("revisions").doc(data.revisionId).get();
    const comments = await projectRef.collection("comments").where("revisionId", "==", data.revisionId).limit(200).get();
    return jsonOk({
      project: { id: data.projectId, title: project.title, workflow: project.workflow, brandSnapshot: project.brandSnapshot ?? null, variants: revision.data()?.variants ?? project.variants ?? [], reviewVariantIds: data.variantIds },
      approver: { id: data.approverId, name: data.approverName, email: data.approverEmail },
      expiresAt: data.expiresAt,
      comments: comments.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) { return jsonError(400, error instanceof Error ? error.message : "Review unavailable"); }
}

export async function POST(request: Request) {
  if (!adminDb) return jsonError(503, "Database unavailable");
  try {
    const body = actionSchema.parse(await request.json());
    const { ref: linkRef, data: link } = await resolve(body.token);
    const projectRef = adminDb.doc(`workspaces/${link.workspaceId}/videoProjects/${link.projectId}`);
    const commentRef = projectRef.collection("comments").doc();
    await adminDb.runTransaction(async (tx) => {
      const currentLink = await tx.get(linkRef);
      if (currentLink.data()?.revoked || Number(currentLink.data()?.expiresAt) < Date.now()) throw new Error("Review link has expired or was revoked");
      const projectSnap = await tx.get(projectRef);
      if (!projectSnap.exists) throw new Error("Video project not found");
      const project = projectSnap.data()!;
      if (project.reviewRevisionId !== link.revisionId) throw new Error("This review revision is no longer active");
      if (body.action === "add_comment") {
        if (!body.content) throw new Error("A comment is required");
        tx.set(commentRef, { revisionId: link.revisionId, approverId: link.approverId, authorName: link.approverName, content: body.content, timestampMs: body.timestampMs ?? null, sceneId: body.sceneId ?? null, variantId: body.variantId ?? null, resolved: false, createdAt: FieldValue.serverTimestamp() });
        return;
      }
      if (body.action === "request_changes" && !body.content) throw new Error("A reason is required when requesting changes");
      const approvers = Array.isArray(project.reviewApprovers) ? project.reviewApprovers.map((approver: { id: string; status: string }) => approver.id === link.approverId ? { ...approver, status: body.action === "approve" ? "approved" : "changes_requested", decidedAt: Date.now() } : approver) : [];
      const nextStatus = body.action === "request_changes" ? "changes_requested" : approvers.length > 0 && approvers.every((approver: { status: string }) => approver.status === "approved") ? "approved" : "partially_approved";
      tx.update(projectRef, { reviewApprovers: approvers, reviewStatus: nextStatus, updatedAt: FieldValue.serverTimestamp() });
      tx.set(projectRef.collection("revisions").doc(link.revisionId), { reviewStatus: nextStatus }, { merge: true });
    });
    return jsonOk({ success: true });
  } catch (error) { return jsonError(400, error instanceof Error ? error.message : "Review action failed"); }
}
