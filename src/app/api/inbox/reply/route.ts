import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { replyToComment } from "@/lib/db/inbox";
import { deliverWebhook } from "@/lib/webhooks/delivery";
import { inboxReplySchema } from "@/lib/validation/inbox";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, inboxReplySchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  const replyId = await replyToComment(
    session.workspaceId,
    parsed.data.commentId,
    parsed.data.body,
    parsed.data.platform
  );

  // Fire-and-forget delivery — never blocks the response.
  void deliverWebhook(session.workspaceId, {
    event: "inbox.comment",
    workspaceId: session.workspaceId,
    data: {
      replyId,
      commentId: parsed.data.commentId,
      body: parsed.data.body,
      platform: parsed.data.platform,
    },
  });

  return jsonOk({ replyId }, 201);
}
