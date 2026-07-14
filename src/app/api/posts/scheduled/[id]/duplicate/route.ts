import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getPost, createPost } from "@/lib/db/posts";
import { createLogger } from "@/lib/log";

const log = createLogger("posts/scheduled/[id]/duplicate");

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await params;

  const source = await getPost(session.workspaceId, id);
  if (!source) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // New duplicate: copy all fields except scheduledAt, status, timestamps.
  // Keep status as "draft" so the user can re-edit before scheduling.
  try {
    const newId = await createPost(session.workspaceId, session.uid, {
      caption: source.caption,
      platforms: source.platforms,
      mediaUrls: source.mediaUrls,
      hashtags: source.hashtags,
      labels: source.labels,
      status: "draft",
    });
    return NextResponse.json({ ok: true, id: newId });
  } catch (err) {
    log.error("duplicate failed", { err, postId: id });
    return NextResponse.json({ error: "Duplicate failed" }, { status: 500 });
  }
}