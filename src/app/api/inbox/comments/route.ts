import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listComments, createComment } from "@/lib/db/inbox";
import { inboxCommentFilterSchema, inboxInboundSchema } from "@/lib/validation/inbox";
import { parseBody, parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, inboxCommentFilterSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid filters");
  }

  const result = await listComments(session.workspaceId, parsed.data);
  return jsonOk({ comments: result.items, nextCursor: result.nextCursor });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, inboxInboundSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  const id = await createComment(session.workspaceId, {
    ...parsed.data,
    sentAt: parsed.data.sentAt ? new Date(parsed.data.sentAt) : undefined,
  });
  return jsonOk({ id }, 201);
}
