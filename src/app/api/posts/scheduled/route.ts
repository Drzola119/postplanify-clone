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

  // Upcoming = scheduled (future) + paused (any time). Both are user-actionable.
  const upcomingResult = await listPosts(session.workspaceId, {
    status: ["scheduled", "paused"],
    pageSize: 100,
  });
  const upcoming = upcomingResult.items.sort((a, b) => {
    const ta = a.scheduledAt ? Date.parse(a.scheduledAt) : Number.MAX_SAFE_INTEGER;
    const tb = b.scheduledAt ? Date.parse(b.scheduledAt) : Number.MAX_SAFE_INTEGER;
    return ta - tb;
  });
  const pausedCount = upcoming.filter((p) => p.status === "paused").length;

  return jsonOk({ due, upcoming, pausedCount });
}