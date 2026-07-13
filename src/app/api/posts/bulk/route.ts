import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { bulkCreatePosts } from "@/lib/db/posts";
import { bulkScheduleSchema } from "@/lib/validation/posts";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, bulkScheduleSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  const ids = await bulkCreatePosts(
    session.workspaceId,
    session.uid,
    parsed.data.items.map((item) => ({ ...item, status: item.status ?? "scheduled" }))
  );
  return jsonOk({ ids, count: ids.length }, 201);
}