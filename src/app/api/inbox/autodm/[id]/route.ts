import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canManage } from "@/lib/auth/workspace-role";
import { adminDb } from "@/lib/firebase/admin";
import { resolvers, MissingServerSecretError } from "@/lib/security/server-config";
import { autodmPause, autodmResume, autodmStop, autodmDelete, autodmLogs, UploadPostInboxError } from "@/lib/uploadpost/inbox";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { z } from "zod";
import { parseBody } from "@/lib/validation/helpers";
import { InboxAccountError, requireInboxOperation } from "@/lib/inbox/account";

const actionSchema = z.object({ action: z.enum(["pause", "resume", "stop", "delete"]) });

/** GET: provider-confirmed logs for one monitor (audit trail preserved on stop). */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canManage(role)) return jsonError(403, "Requires an admin role");
  const { id } = await ctx.params;
  try {
    await requireInboxOperation(session.workspaceId, "manage-autodm");
    if (adminDb) {
      const local = await adminDb.doc(`workspaces/${session.workspaceId}/inboxAutodm/${encodeURIComponent(id)}`).get();
      if (!local.exists) return jsonError(404, "AutoDM monitor not found in this workspace");
    }
  } catch (err) {
    if (err instanceof InboxAccountError) return jsonError(err.status, err.message, { code: err.code });
    throw err;
  }

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) return jsonError(503, "Social provider not configured");
    throw err;
  }
  try {
    const logs = await autodmLogs(apiKey, decodeURIComponent(id));
    return jsonOk({ monitorId: decodeURIComponent(id), logs });
  } catch (err) {
    if (err instanceof UploadPostInboxError) return jsonError(502, err.message, { code: err.code });
    throw err;
  }
}

/** POST {action}: pause / resume / stop / delete (admin-only). */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canManage(role)) return jsonError(403, "Requires an admin role");
  const { id } = await ctx.params;
  const monitorId = decodeURIComponent(id);

  try {
    await requireInboxOperation(session.workspaceId, "manage-autodm");
    if (adminDb) {
      const local = await adminDb.doc(`workspaces/${session.workspaceId}/inboxAutodm/${encodeURIComponent(monitorId)}`).get();
      if (!local.exists) return jsonError(404, "AutoDM monitor not found in this workspace");
    }
  } catch (err) {
    if (err instanceof InboxAccountError) return jsonError(err.status, err.message, { code: err.code });
    throw err;
  }

  const parsed = await parseBody(request, actionSchema);
  if (!parsed.ok) return jsonError(400, "Invalid action", parsed.error.issues);

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) return jsonError(503, "Social provider not configured");
    throw err;
  }
  try {
    if (parsed.data.action === "pause") await autodmPause(apiKey, monitorId);
    else if (parsed.data.action === "resume") await autodmResume(apiKey, monitorId);
    else if (parsed.data.action === "stop") await autodmStop(apiKey, monitorId);
    else await autodmDelete(apiKey, monitorId);
    // Mirror locally; on delete keep an audit tombstone instead of vanishing.
    if (adminDb) {
      const ref = adminDb.doc(`workspaces/${session.workspaceId}/inboxAutodm/${encodeURIComponent(monitorId)}`);
      if (parsed.data.action === "delete") {
        await ref.set({ monitorId, status: "stopped", deletedAt: new Date(), updatedAt: new Date() }, { merge: true }).catch(() => undefined);
      } else {
        const status = parsed.data.action === "stop" ? "stopped" : parsed.data.action === "pause" ? "paused" : "running";
        await ref.set({ status, updatedAt: new Date() }, { merge: true }).catch(() => undefined);
      }
    }
    return jsonOk({ monitorId, action: parsed.data.action });
  } catch (err) {
    if (err instanceof UploadPostInboxError) return jsonError(502, err.message, { code: err.code });
    throw err;
  }
}
