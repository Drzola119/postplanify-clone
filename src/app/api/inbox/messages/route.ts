import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canRead, canWrite } from "@/lib/auth/workspace-role";
import { adminDb } from "@/lib/db";
import { listConversations, getMessages } from "@/lib/db/inbox";
import { inboxMessageFilterSchema } from "@/lib/validation/inbox";
import { parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canRead(role)) return jsonError(401, "Unauthorized");

  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  if (conversationId) {
    const messages = await getMessages(session.workspaceId, conversationId);
    return jsonOk({ messages });
  }

  const parsed = parseSearchParams(url.searchParams, inboxMessageFilterSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid filters");
  }

  try {
    const result = await listConversations(session.workspaceId, parsed.data);
    return jsonOk({ conversations: result.items, nextCursor: result.nextCursor });
  } catch (err) {
    const msg = String((err as { message?: unknown })?.message ?? err);
    if (/quota|RESOURCE_EXHAUSTED/i.test(msg)) {
      return jsonError(503, "Database quota exhausted — showing cached content only", { code: "QUOTA_EXCEEDED" });
    }
    throw err;
  }
}

/** Mark a conversation read (shared read state). */
export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canWrite(role)) return jsonError(403, "Requires an editor role or higher");
  if (!adminDb) return jsonError(503, "Database not configured");
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) return jsonError(400, "conversationId is required");
  await adminDb.doc(`workspaces/${session.workspaceId}/conversations/${conversationId}`).update({
    unreadCount: 0,
    read: true,
  });
  return jsonOk({ id: conversationId, read: true });
}
