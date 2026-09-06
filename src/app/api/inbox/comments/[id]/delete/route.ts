import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canWrite } from "@/lib/auth/workspace-role";
import { adminDb } from "@/lib/db";
import { getOrCreateOp, claimOp, finalizeOp } from "@/lib/db/inbox-ops";
import { resolvers, MissingServerSecretError } from "@/lib/security/server-config";
import { readProfile } from "@/lib/db/upload-post-profiles";
import { deleteInstagramComment, UploadPostInboxError } from "@/lib/uploadpost/inbox";
import type { CommentDoc } from "@/lib/db/schema";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

/**
 * Provider-confirmed delete of our own comment (spec §5).
 * Only verified moderation is exposed: Instagram own-comment delete.
 * Hide/like/pin are TikTok-only upstream and out of V1 scope — no buttons.
 */
export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canWrite(role)) return jsonError(403, "Requires an editor role or higher");
  if (!adminDb) return jsonError(503, "Database not configured");

  const { id } = await ctx.params;
  const ref = adminDb.doc(`workspaces/${session.workspaceId}/comments/${id}`);
  const snap = await ref.get();
  if (!snap.exists) return jsonError(404, "Comment not found");
  const comment = snap.data() as CommentDoc;
  if (comment.platform !== "instagram") {
    return jsonError(400, "Delete is supported for Instagram in V1", { code: "UNSUPPORTED_OPERATION" });
  }
  if (!comment.externalId) {
    return jsonError(422, "This comment has no provider id yet", { code: "NOT_SYNCED" });
  }

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(_request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) return jsonError(503, "Social provider not configured");
    throw err;
  }
  const profile = await readProfile(session.workspaceId).catch(() => null);
  const accountKey = comment.accountKey ?? profile?.username ?? session.workspaceId;

  const { id: opId, op, created } = await getOrCreateOp(session.workspaceId, {
    kind: "comment-delete",
    platform: "instagram",
    accountKey,
    targetId: id,
    providerTargetId: comment.externalId,
    origin: "manual",
    createdBy: session.uid,
  });
  if (!created && op.status !== "pending") {
    return jsonOk({ opId, status: op.status, duplicate: true });
  }
  if (!(await claimOp(session.workspaceId, opId))) {
    return jsonOk({ opId, status: "processing", duplicate: true });
  }

  try {
    await deleteInstagramComment(apiKey, accountKey, comment.externalId);
    await finalizeOp(session.workspaceId, opId, { status: "sent" });
    await ref.update({ archivedAt: new Date(), resolved: true }).catch(() => undefined);
    return jsonOk({ opId, status: "sent", id });
  } catch (err) {
    if (err instanceof UploadPostInboxError) {
      await finalizeOp(session.workspaceId, opId, {
        status: "failed",
        error: { code: err.code, message: err.message, retryable: err.retryable },
      });
      return jsonError(err.code === "rate-limited" ? 429 : 502, err.message, { code: err.code.toUpperCase() });
    }
    await finalizeOp(session.workspaceId, opId, {
      status: "failed",
      error: { code: "internal", message: "Unexpected error", retryable: false },
    });
    throw err;
  }
}
