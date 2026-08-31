import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session-context";
import { createPost } from "@/lib/db/posts";
import { createLogger } from "@/lib/log";
import { parseBody, validateCaptionsByPlatform } from "@/lib/validation/helpers";

const log = createLogger("posts/schedule");

const schedulePayloadSchema = z.object({
  jobId: z.string().optional(),
  platforms: z.array(z.string().min(1)).min(1),
  caption: z.string().min(1),
  hashtags: z.string().optional(),
  mediaUrls: z.array(z.string().min(1)).optional().default([]),
  scheduledAt: z.string().min(1),
  firstComment: z.string().optional(),
  firstCommentByPlatform: z.record(z.string(), z.string()).optional(),
  quoteTweetUrl: z.string().optional(),
  community: z.string().optional(),
  mediaType: z.string().optional(),
  tagUsers: z.union([z.string(), z.array(z.string())]).optional(),
  feedType: z.enum(["feed", "story"]).optional(),
  altTextByPlatform: z.record(z.string(), z.string()).optional(),
  carouselItems: z.array(z.object({ url: z.string().min(1) }).passthrough()).optional(),
  trialReel: z.object({ url: z.string().min(1) }).passthrough().optional(),
  document: z.object({
    url: z.string().min(1),
    title: z.string().min(1),
    mimeType: z.string().min(1),
  }).passthrough().optional(),
  frameCoverUrl: z.string().url().optional(),
  customCoverUrl: z.string().url().optional(),
  collaborators: z.array(z.string().min(1)).max(3).optional(),
  advancedByPlatform: z.record(z.string(), z.unknown()).optional(),
  captionsByPlatform: z.record(z.string(), z.string()).optional(),
  sameForAll: z.boolean().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, schedulePayloadSchema);
  if (!parsed.ok || !parsed.data) {
    return NextResponse.json(
      { error: "Invalid scheduling payload", issues: parsed.error?.issues },
      { status: 400 }
    );
  }
  const body = parsed.data;
  const scheduledAt = new Date(body.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledAt - must be an ISO date string" }, { status: 400 });
  }
  // Give a 30s grace window so tiny clock skew doesn't turn a valid
  // "tomorrow 09:00" into a confusing 503/400 loop.
  if (scheduledAt.getTime() <= Date.now() - 30_000) {
    return NextResponse.json(
      { error: `Scheduled time must be in the future (server time is ${new Date().toISOString()})` },
      { status: 400 }
    );
  }

  const captionsErr = validateCaptionsByPlatform(body.platforms, body.captionsByPlatform as Record<string, string> | undefined, body.sameForAll, body.caption);
  if (captionsErr) return captionsErr;

  try {
    const postId = await createPost(session.workspaceId, session.uid, {
      caption: body.caption,
      platforms: body.platforms as never,
      mediaUrls: body.mediaUrls,
      mediaType: body.mediaType,
      hashtags: body.hashtags?.split(/\s+/).filter(Boolean) ?? [],
      status: "scheduled",
      scheduledAt,
      firstComment: body.firstComment,
      firstCommentByPlatform: body.firstCommentByPlatform,
      quoteTweetUrl: body.quoteTweetUrl,
      community: body.community,
      tagUsers: body.tagUsers,
      feedType: body.feedType,
      altTextByPlatform: body.altTextByPlatform,
      carouselItems: body.carouselItems,
      trialReel: body.trialReel,
      document: body.document,
      frameCoverUrl: body.frameCoverUrl,
      customCoverUrl: body.customCoverUrl,
      collaborators: body.collaborators?.map((handle) => ({ uid: handle, handle, status: "invited" as const })),
      captionsByPlatform: body.captionsByPlatform,
      sameForAll: body.sameForAll,
      advancedByPlatform: body.advancedByPlatform as Record<string, Record<string, unknown>> | undefined,
    });

    // This endpoint deliberately does not import or call UploadPost. Delivery
    // is exclusively owned by the queue worker once scheduledAt is due.
    return NextResponse.json({
      ok: true,
      accepted: true,
      scheduled: true,
      deliveryConfirmed: false,
      postId,
      jobId: body.jobId ?? postId,
      scheduledAt: scheduledAt.toISOString(),
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("Failed to persist scheduled post", { err, workspaceId: session.workspaceId, message });

    // Map known Firestore failure modes to the most actionable status.
    // Permission-denied (security rules) -> 403, not 503.
    // Details are logged server-side only to avoid leaking project/collection paths.
    if (/PERMISSION_DENIED|permission/i.test(message)) {
      return NextResponse.json(
        { error: "Firestore permission denied. Please contact support." },
        { status: 403 }
      );
    }
    if (/adminDb not configured|FIREBASE/i.test(message)) {
      return NextResponse.json(
        { error: "Unable to save scheduled post. Database not configured on server." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Unable to save scheduled post" }, { status: 503 });
  }
}
