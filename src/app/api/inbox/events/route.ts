import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import { createLogger } from "@/lib/log";
import {
  upsertCommentFromEvent,
  appendMessageFromEvent,
} from "@/lib/db/inbox";
import { inboxEventSchema } from "@/lib/validation/inbox-events";
import { parseValue, jsonError, jsonOk } from "@/lib/validation/helpers";

/**
 * Public ingestion endpoint for inbound social events.
 *
 * Auth: workspace-level shared secret. Trusted external systems (n8n,
 * Upload-Post, native platform webhooks) send
 *   X-Workspace-Webhook-Key: <secret>
 * and we look up the workspace's webhook secret by trying each active
 * webhook in `workspaces/{ws}/webhooks` whose events contain
 * "inbox.event". The first matching secret wins.
 *
 * For now we accept a single shared workspace secret kept on the
 * workspace document (`webhookSecret`) as a fallback for self-hosted
 * n8n installs where the webhook id is unknown. n8n users can store
 * it manually or use the per-webhook secret from the dashboard.
 *
 * Always returns { ok: true, ... } on accepted events — n8n treats
 * any non-2xx as failure and would retry. Bad payloads get 400.
 */

const log = createLogger("inbox/events");

const MAX_BODY_BYTES = 64 * 1024; // 64 KB — events are tiny

export async function POST(request: NextRequest) {
  // Auth first — we never read or validate the body until the
  // workspace webhook key has been verified. This prevents unauth'd
  // callers from probing the request schema via 400s.
  const supplied = request.headers.get("x-workspace-webhook-key")?.trim()
    ?? request.headers.get("x-webhook-secret")?.trim();
  if (!supplied) {
    return jsonError(401, "Missing X-Workspace-Webhook-Key header");
  }

  const raw = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if (raw instanceof Response) return raw;

  const parsed = parseValue(raw, inboxEventSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(400, "Invalid event payload", parsed.error?.issues);
  }
  const evt = parsed.data;

  const secretOk = await verifyWorkspaceSecret(evt.workspaceId, supplied);
  if (!secretOk) {
    log.warn("webhook auth failed", { workspaceId: evt.workspaceId });
    return jsonError(401, "Invalid webhook secret");
  }

  // Workspace must exist (defense-in-depth — without this a typo in
  // workspaceId could create orphaned docs).
  if (!adminDb) {
    return jsonError(500, "adminDb not configured");
  }
  const wsSnap = await adminDb.doc(`workspaces/${evt.workspaceId}`).get();
  if (!wsSnap.exists) {
    return jsonError(404, "Workspace not found");
  }

  try {
    if (evt.type === "comment") {
      const { comment, created } = await upsertCommentFromEvent(evt.workspaceId, evt);
      log.info("comment upserted", {
        workspaceId: evt.workspaceId,
        platform: evt.platform,
        externalId: evt.externalId,
        created,
      });
      return jsonOk({ type: "comment", id: comment.id, created });
    }
    const { conversationId, messageId, created } = await appendMessageFromEvent(
      evt.workspaceId,
      evt,
    );
    log.info("message appended", {
      workspaceId: evt.workspaceId,
      platform: evt.platform,
      externalId: evt.externalId,
      conversationId,
      created,
    });
    return jsonOk({ type: "message", conversationId, messageId, created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    log.error("event ingestion failed", { err: msg, workspaceId: evt.workspaceId });
    return jsonError(500, "Ingestion failed");
  }
}

/**
 * Verify a supplied secret against any active webhook in the workspace
 * whose events include "inbox.event". Falls back to the workspace's
 * stored `webhookSecret` field for self-hosted integrations.
 */
async function verifyWorkspaceSecret(
  workspaceId: string,
  supplied: string,
): Promise<boolean> {
  if (!adminDb) return false;
  const coll = adminDb.collection(`workspaces/${workspaceId}/webhooks`);
  const snap = await coll.where("active", "==", true).get();
  for (const d of snap.docs) {
    const data = d.data() as { events?: string[]; secret?: string };
    if (!data?.events?.includes("inbox.event")) continue;
    const secret = data?.secret ?? "";
    if (secret && constantTimeEq(secret, supplied)) return true;
  }
  // Workspace-level fallback secret.
  const wsDoc = await adminDb.doc(`workspaces/${workspaceId}`).get();
  const wsSecret = (wsDoc.data() as { webhookSecret?: string } | undefined)?.webhookSecret;
  return typeof wsSecret === "string" && wsSecret.length > 0
    ? constantTimeEq(wsSecret, supplied)
    : false;
}

function constantTimeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

async function readBodyWithLimit(req: NextRequest, max: number): Promise<unknown | Response> {
  const len = req.headers.get("content-length");
  if (len && Number(len) > max) {
    return jsonError(413, `Payload too large (max ${max} bytes)`);
  }
  try {
    const text = await req.text();
    if (text.length > max) return jsonError(413, `Payload too large (max ${max} bytes)`);
    return JSON.parse(text);
  } catch {
    return jsonError(400, "Invalid JSON body");
  }
}