import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listScheduledDue, listPosts } from "@/lib/db/posts";
import { jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const now = url.searchParams.get("from")
    ? new Date(url.searchParams.get("from")!)
    : new Date();

  const due = await listScheduledDue(session.workspaceId, now);
  const upcoming = await listPosts(session.workspaceId, { status: "scheduled", pageSize: 100 });
  return jsonOk({ due, upcoming: upcoming.items });
}