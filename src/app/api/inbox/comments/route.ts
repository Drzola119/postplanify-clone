import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canRead, canWrite } from "@/lib/auth/workspace-role";
import { listComments, createComment } from "@/lib/db/inbox";
import { inboxCommentFilterSchema, inboxInboundSchema } from "@/lib/validation/inbox";
import { parseBody, parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";
import { InboxAccountError, resolveCanonicalInboxAccount } from "@/lib/inbox/account";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canRead(role)) return jsonError(401, "Unauthorized");

  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, inboxCommentFilterSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid filters");
  }
  try {
    await resolveCanonicalInboxAccount(session.workspaceId, parsed.data.accountKey);
  } catch (err) {
    if (err instanceof InboxAccountError) return jsonError(err.status, err.message, { code: err.code });
    throw err;
  }

  try {
    const result = await listComments(session.workspaceId, parsed.data);
    return jsonOk({ comments: result.items, nextCursor: result.nextCursor });
  } catch (err) {
    const msg = String((err as { message?: unknown })?.message ?? err);
    if (/quota|RESOURCE_EXHAUSTED/i.test(msg)) {
      return jsonError(503, "Database quota exhausted — showing cached content only", { code: "QUOTA_EXCEEDED" });
    }
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canWrite(role)) return jsonError(403, "Requires an editor role or higher");

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
