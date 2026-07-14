import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { sendMessage } from "@/lib/db/inbox";
import { conversationMessageSchema } from "@/lib/validation/inbox";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, conversationMessageSchema);
  if (!parsed.ok) return jsonError(400, "Invalid message", parsed.error.issues);

  const id = await sendMessage(
    session.workspaceId,
    parsed.data.conversationId,
    parsed.data.body,
    parsed.data.direction,
  );
  return jsonOk({ id }, 201);
}
