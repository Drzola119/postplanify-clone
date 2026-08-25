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
      captionsByPlatform: (source as unknown as { captionsByPlatform?: Record<string,string> }).captionsByPlatform,
      sameForAll: (source as unknown as { sameForAll?: boolean }).sameForAll,
      platforms: source.platforms,
      mediaUrls: source.mediaUrls,
      hashtags: source.hashtags,
      labels: source.labels,
      firstComment: (source as unknown as { firstComment?: string }).firstComment,
      firstCommentByPlatform: (source as unknown as { firstCommentByPlatform?: Record<string,string> }).firstCommentByPlatform,
      altTextByPlatform: (source as unknown as { altTextByPlatform?: Record<string,string> }).altTextByPlatform,
      feedType: (source as unknown as { feedType?: string }).feedType as never,
      carouselItems: (source as unknown as { carouselItems?: Array<{url:string}> }).carouselItems,
      trialReel: (source as unknown as { trialReel?: {url:string} }).trialReel,
      document: (source as unknown as { document?: {url:string; title:string; mimeType:string} }).document,
      frameCoverUrl: (source as unknown as { frameCoverUrl?: string }).frameCoverUrl,
      customCoverUrl: (source as unknown as { customCoverUrl?: string }).customCoverUrl,
      collaborators: (source as unknown as { collaborators?: Array<{uid:string; handle:string}> }).collaborators as never,
      advancedByPlatform: (source as unknown as { advancedByPlatform?: Record<string, unknown> }).advancedByPlatform as never,
      tagUsers: (source as unknown as { tagUsers?: unknown }).tagUsers as never,
      status: "draft",
    });
    return NextResponse.json({ ok: true, id: newId });
  } catch (err) {
    log.error("duplicate failed", { err, postId: id });
    return NextResponse.json({ error: "Duplicate failed" }, { status: 500 });
  }
}