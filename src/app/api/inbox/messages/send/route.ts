import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canWrite } from "@/lib/auth/workspace-role";
import { adminDb } from "@/lib/db";
import { getOrCreateOp, claimOp, finalizeOp } from "@/lib/db/inbox-ops";
import { dmWindowEligibility } from "@/lib/inbox/capabilities";
import { resolvers, MissingServerSecretError } from "@/lib/security/server-config";
import { readProfile } from "@/lib/db/upload-post-profiles";
import { sendInstagramDm, UploadPostInboxError } from "@/lib/uploadpost/inbox";
import type { ConversationDoc } from "@/lib/db/schema";
import { conversationMessageSchema } from "@/lib/validation/inbox";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";

const log = createLogger("api/inbox-dm-send");

/**
 * Durable DM-send endpoint (spec §7, §11).
 * Recipient must be a scoped provider id from conversation participants or a
 * comment author id — never a free-typed username. Eligibility is computed
 * from the last INBOUND provider timestamp; our own sends never extend it.
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canWrite(role)) return jsonError(403, "Requires an editor role or higher");

  const parsed = await parseBody(request, conversationMessageSchema);
  if (!parsed.ok) return jsonError(400, "Invalid message", parsed.error.issues);
  const { conversationId, body } = parsed.data;

  if (!adminDb) return jsonError(503, "Database not configured");
  const convRef = adminDb.doc(`workspaces/${session.workspaceId}/conversations/${conversationId}`);
  const convSnap = await convRef.get();
  if (!convSnap.exists) return jsonError(404, "Conversation not found");
  const conv = convSnap.data() as ConversationDoc;

  if (conv.platform !== "instagram") {
    return jsonError(400, "DMs are supported for Instagram in V1", { code: "UNSUPPORTED_OPERATION" });
  }

  // Scoped recipient: explicit body value must match a known participant id;
  // otherwise use the first known participant external id.
  const knownIds = conv.participantExternalIds ?? [];
  let recipientId = parsed.data.recipientId;
  if (recipientId && knownIds.length > 0 && !knownIds.includes(recipientId)) {
    return jsonError(400, "Unknown recipient — pick a participant from this conversation", { code: "UNKNOWN_RECIPIENT" });
  }
  recipientId ??= knownIds[0];
  if (!recipientId) {
    return jsonError(
      422,
      "No provider recipient id for this conversation yet — sync before sending",
      { code: "NOT_SYNCED" }
    );
  }

  const elig = dmWindowEligibility(conv.lastInboundAt instanceof Date ? conv.lastInboundAt : null);
  if (elig === "unsupported") {
    return jsonError(
      400,
      "The 24-hour messaging window has expired — the recipient must message first",
      { code: "WINDOW_EXPIRED" }
    );
  }

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) return jsonError(503, "Social provider not configured");
    throw err;
  }
  const profile = await readProfile(session.workspaceId).catch(() => null);
  const accountKey = parsed.data.accountKey ?? conv.accountKey ?? profile?.username ?? session.workspaceId;

  const { id: opId, op, created } = await getOrCreateOp(session.workspaceId, {
    kind: "dm-send",
    platform: "instagram",
    accountKey,
    targetId: conversationId,
    providerTargetId: recipientId,
    body,
    origin: "manual",
    createdBy: session.uid,
  });
  if (!created && op.status !== "pending") {
    return jsonOk({ opId, status: op.status, providerMessageId: op.providerMessageId ?? null, duplicate: true }, op.status === "sent" ? 201 : 200);
  }
  const claimed = await claimOp(session.workspaceId, opId);
  if (!claimed) {
    return jsonOk({ opId, status: "processing", duplicate: true }, 200);
  }

  // Draft preservation: persist a pending local message first so a failure
  // never loses the user's text (spec §10). Delivery state lives on the op.
  const msgRef = convRef.collection("messages").doc();
  await msgRef.set({
    body,
    fromHandle: "you",
    sentAt: new Date(),
    direction: "out",
    deliveryStatus: "pending",
    idempotencyKey: op.idempotencyKey,
    origin: "manual",
  });

  try {
    const confirmation = await sendInstagramDm(apiKey, accountKey, { recipientId, message: body });
    await finalizeOp(session.workspaceId, opId, {
      status: "sent",
      providerMessageId: confirmation.messageId,
      providerRecipientId: confirmation.recipientId,
    });
    try {
      await msgRef.update({
        deliveryStatus: "sent",
        externalId: confirmation.messageId,
      });
      await convRef.update({ lastMessageAt: new Date(), unreadCount: 0 });
    } catch (err) {
      log.error("DM sent but local update failed", { opId, err: String(err) });
      return jsonOk({ opId, status: "sent", providerMessageId: confirmation.messageId, reconcileNeeded: true }, 201);
    }
    return jsonOk({ opId, status: "sent", providerMessageId: confirmation.messageId, draftId: msgRef.id }, 201);
  } catch (err) {
    if (err instanceof UploadPostInboxError) {
      if (err.code === "timeout") {
        await finalizeOp(session.workspaceId, opId, {
          status: "delivery-unknown",
          error: { code: err.code, message: "Request timed out — delivery is uncertain. Check the provider before retrying.", retryable: false },
        });
        await msgRef.update({ deliveryStatus: "delivery-unknown" }).catch(() => undefined);
        return jsonError(202, "DM timed out — delivery is uncertain. Your draft is preserved.", { code: "DELIVERY_UNKNOWN" });
      }
      await finalizeOp(session.workspaceId, opId, {
        status: "failed",
        error: { code: err.code, message: err.message, retryable: err.retryable },
      });
      await msgRef.update({ deliveryStatus: "failed", error: { code: err.code, message: err.message } }).catch(() => undefined);
      return jsonError(err.code === "rate-limited" ? 429 : 502, err.message, { code: err.code.toUpperCase() });
    }
    await finalizeOp(session.workspaceId, opId, {
      status: "failed",
      error: { code: "internal", message: "Unexpected error", retryable: false },
    });
    await msgRef.update({ deliveryStatus: "failed" }).catch(() => undefined);
    throw err;
  }
}
