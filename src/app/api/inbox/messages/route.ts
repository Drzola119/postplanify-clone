import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listConversations, getMessages } from "@/lib/db/inbox";
import { inboxMessageFilterSchema } from "@/lib/validation/inbox";
import { parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

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

  const result = await listConversations(session.workspaceId, parsed.data);
  return jsonOk({ conversations: result.items, nextCursor: result.nextCursor });
}
