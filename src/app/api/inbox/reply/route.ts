import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canWrite } from "@/lib/auth/workspace-role";
import { adminDb } from "@/lib/db";
import { getOrCreateOp, claimOp, finalizeOp } from "@/lib/db/inbox-ops";
import { effectiveSupport, privateReplyEligibility } from "@/lib/inbox/capabilities";
import { resolvers, MissingServerSecretError } from "@/lib/security/server-config";
import { readProfile } from "@/lib/db/upload-post-profiles";
import {
  postInstagramPublicReply,
  postInstagramPrivateReply,
  UploadPostInboxError,
} from "@/lib/uploadpost/inbox";
import type { CommentDoc } from "@/lib/db/schema";
import { inboxReplySchema } from "@/lib/validation/inbox";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";

const log = createLogger("api/inbox-reply");

/**
 * Durable comment-reply endpoint (spec §7).
 * One authoritative outbound path: validate → get-or-create op by stable
 * idempotency key → claim → provider call → finalize → local update.
 * A local write is never presented as delivery; only provider confirmation is.
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canWrite(role)) return jsonError(403, "Requires an editor role or higher");

  const parsed = await parseBody(request, inboxReplySchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  const { platform, commentId, body, kind } = parsed.data;

  // V1 scope: Instagram-only. Other platforms get an honest status, not a silent local write.
  if (platform !== "instagram") {
    return jsonError(400, "Replies are supported for Instagram in V1", { code: "UNSUPPORTED_OPERATION" });
  }
  const support = effectiveSupport("instagram", { platform, reauthRequired: false }, kind === "private-reply" ? "reply-private" : "reply-public");
  if (support.status !== "supported") {
    return jsonError(400, support.reason, { code: "UNSUPPORTED_OPERATION" });
  }

  if (!adminDb) return jsonError(503, "Database not configured");
  const commentSnap = await adminDb.doc(`workspaces/${session.workspaceId}/comments/${commentId}`).get();
  if (!commentSnap.exists) return jsonError(404, "Comment not found");
  const comment = commentSnap.data() as CommentDoc;
  const providerCommentId = comment.externalId;
  if (!providerCommentId) {
    return jsonError(
      422,
      "This comment has no provider id yet — sync the post before replying",
      { code: "NOT_SYNCED" }
    );
  }
  if (kind === "private-reply" && comment.sentAt instanceof Date) {
    const elig = privateReplyEligibility(comment.sentAt);
    if (elig !== "supported") {
      return jsonError(400, "Private replies are only allowed on comments less than 7 days old", { code: "WINDOW_EXPIRED" });
    }
  }

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) return jsonError(503, "Social provider not configured");
    throw err;
  }
  const profile = await readProfile(session.workspaceId).catch(() => null);
  const accountKey = parsed.data.accountKey ?? profile?.username ?? session.workspaceId;

  const { id: opId, op, created } = await getOrCreateOp(session.workspaceId, {
    kind: kind === "private-reply" ? "private-reply" : "public-reply",
    platform: "instagram",
    accountKey,
    targetId: commentId,
    providerTargetId: providerCommentId,
    body,
    origin: "manual",
    createdBy: session.uid,
  });
  // Duplicate submit (double-click / reload): return the existing op state, never re-send.
  if (!created && op.status !== "pending") {
    return jsonOk({ opId, status: op.status, providerMessageId: op.providerMessageId ?? null, duplicate: true }, op.status === "sent" ? 201 : 200);
  }
  const claimed = await claimOp(session.workspaceId, opId);
  if (!claimed) {
    const current = await adminDb.doc(`workspaces/${session.workspaceId}/outboundOps/${opId}`).get();
    const state = (current.data() as { status?: string } | undefined)?.status ?? "processing";
    return jsonOk({ opId, status: state, duplicate: true }, 200);
  }

  try {
    let providerMessageId: string;
    let providerRecipientId: string | undefined;
    if (kind === "private-reply") {
      const confirmation = await postInstagramPrivateReply(apiKey, accountKey, {
        commentId: providerCommentId,
        message: body,
        buttons: parsed.data.buttons,
      });
      providerMessageId = confirmation.messageId;
      providerRecipientId = confirmation.recipientId;
    } else {
      const confirmation = await postInstagramPublicReply(apiKey, accountKey, {
        commentId: providerCommentId,
        message: body,
      });
      providerMessageId = confirmation.id;
    }
    await finalizeOp(session.workspaceId, opId, {
      status: "sent",
      providerMessageId,
      ...(providerRecipientId ? { providerRecipientId } : {}),
    });
    // Provider succeeded — now update local state best-effort. If this fails,
    // the op record stays `sent` and reconciliation can replay the local update.
    try {
      await adminDb.doc(`workspaces/${session.workspaceId}/comments/${commentId}`).update({
        replied: true,
        replyId: opId,
        origin: "manual",
      });
    } catch (err) {
      log.error("provider reply sent but local update failed", { opId, err: String(err) });
      return jsonOk({ opId, status: "sent", providerMessageId, reconcileNeeded: true }, 201);
    }
    return jsonOk({ opId, status: "sent", providerMessageId }, 201);
  } catch (err) {
    if (err instanceof UploadPostInboxError) {
      if (err.code === "timeout") {
        // Provider may have accepted — never blindly retry a write.
        await finalizeOp(session.workspaceId, opId, {
          status: "delivery-unknown",
          error: { code: err.code, message: "Request timed out — delivery is uncertain. Check the provider before retrying.", retryable: false },
        });
        return jsonError(202, "Reply timed out — delivery is uncertain. Review before retrying.", { code: "DELIVERY_UNKNOWN" });
      }
      await finalizeOp(session.workspaceId, opId, {
        status: "failed",
        error: { code: err.code, message: err.message, retryable: err.retryable },
      });
      const status = err.code === "rate-limited" ? 429 : 502;
      return jsonError(status, err.message, { code: err.code.toUpperCase() });
    }
    await finalizeOp(session.workspaceId, opId, {
      status: "failed",
      error: { code: "internal", message: "Unexpected error", retryable: false },
    });
    throw err;
  }
}
