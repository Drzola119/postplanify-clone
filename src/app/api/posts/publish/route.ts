import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session-context";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { createPost, updatePost } from "@/lib/db/posts";
import { createLogger } from "@/lib/log";
import { parseBody, validateCaptionsByPlatform } from "@/lib/validation/helpers";
import { readProfile } from "@/lib/db/upload-post-profiles";
import { publishToUploadPost } from "@/lib/uploadpost/publisher";

const log = createLogger("posts/publish");

function publishErrorStatus(message: string): number {
  const match = /^UploadPost\s+(\d{3}):/i.exec(message);
  const upstreamStatus = match ? Number(match[1]) : 0;
  return upstreamStatus >= 400 && upstreamStatus < 500 ? upstreamStatus : 502;
}

const publishPayloadSchema = z.object({
  jobId: z.string().optional(),
  uploadPostUsername: z.string().optional(),
  platforms: z.array(z.string().min(1)).min(1),
  caption: z.string().min(1),
  hashtags: z.string().optional(),
  mediaUrls: z.array(z.string().min(1)).optional().default([]),
  scheduledAt: z.string().nullable().optional(),
  firstComment: z.string().optional(),
  /** Per-platform first comments; supersedes `firstComment` when present. */
  firstCommentByPlatform: z.record(z.string(), z.string()).optional(),
  quoteTweetUrl: z.string().optional(),
  community: z.string().optional(),
  mediaType: z.string().optional(),
  /** Tag-users payload keyed by platform (or "__all" for shared). */
  tagUsers: z.union([z.string(), z.array(z.string())]).optional(),
  /** Feed vs Story placement hint (e.g. "story" for IG/FB stories). */
  feedType: z.enum(["feed", "story"]).optional(),
  /** Per-platform alt-text payload keyed by platform. */
  altTextByPlatform: z.record(z.string(), z.string()).optional(),
  /** List of carousel/trial/document mode-specific items so n8n can dispatch correctly. */
  carouselItems: z.array(z.object({ url: z.string().min(1) }).passthrough()).optional(),
  trialReel: z.object({ url: z.string().min(1) }).passthrough().optional(),
  document: z.object({
    url: z.string().min(1),
    title: z.string().min(1),
    mimeType: z.string().min(1),
  }).passthrough().optional(),
  /** CDN URL of a frame the user picked from a video. Optional. */
  frameCoverUrl: z.string().url().optional(),
  /** CDN URL of a custom cover image (e.g. uploaded for a video post). Optional. */
  customCoverUrl: z.string().url().optional(),
  /** Instagram collaborator usernames (max 3). */
  collaborators: z.array(z.string().min(1)).max(3).optional(),
  advancedByPlatform: z.record(z.string(), z.unknown()).optional(),
  /** Per-platform captions (with metadata rules applied). Supersedes top-level caption per platform. */
  captionsByPlatform: z.record(z.string(), z.string()).optional(),
  /** True when the user used the same caption for all platforms. */
  sameForAll: z.boolean().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { uid, workspaceId } = session;

  let uploadPostApiKey: string;
  try {
    uploadPostApiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) {
      return NextResponse.json(
        { error: `${err.secret} not configured on server` },
        { status: 500 }
      );
    }
    throw err;
  }

  const parsed = await parseBody(request, publishPayloadSchema);
  if (!parsed.ok || !parsed.data) {
    return NextResponse.json(
      { error: "Missing platforms / caption" },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // Shared captions validation (D deduplicated)
  const captionsErr = validateCaptionsByPlatform(body.platforms as string[], body.captionsByPlatform as Record<string, string> | undefined, body.sameForAll as boolean | undefined, body.caption);
  if (captionsErr) return captionsErr;

  const workspaceProfile = await readProfile(workspaceId).catch(() => null);
  const uploadPostUsername =
    body.uploadPostUsername?.trim() ||
    workspaceProfile?.username ||
    workspaceId ||
    process.env.UPLOAD_POST_DEFAULT_USERNAME ||
    "trustiify_test";

  const jobId = body.jobId ?? crypto.randomUUID();
  const isScheduled = body.scheduledAt ? Date.parse(body.scheduledAt) > Date.now() : false;

  // 1) Persist a posts/{id} document first so the publish flow becomes durable.
  let postId: string;
  try {
    postId = await createPost(workspaceId, uid, {
      caption: body.caption,
      platforms: body.platforms as never,
      mediaUrls: body.mediaUrls ?? [],
      hashtags: body.hashtags ? body.hashtags.split(/\s+/).filter(Boolean) : [],
      status: isScheduled ? "scheduled" : "queued",
      scheduledAt: isScheduled ? new Date(body.scheduledAt!) : undefined,
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
      collaborators: body.collaborators?.map((c) => ({ uid: c, handle: c, status: "invited" as const })),
      captionsByPlatform: body.captionsByPlatform,
      sameForAll: body.sameForAll,
      advancedByPlatform: body.advancedByPlatform as Record<string, Record<string, unknown>> | undefined,
      mediaType: body.mediaType,
    });
  } catch (err) {
    // Firestore unavailable — fall back to stateless publish so the existing
    // composer UX still works during Hostinger env-var setup.
    log.warn("Firestore write failed; publishing stateless", { err });
    postId = "";
  }

  // Scheduling is a persistence operation. The queue worker owns delivery at
  // the due time; forwarding a scheduled request to UploadPost here can be
  // interpreted as an immediate publish by upstream integrations.
  if (isScheduled) {
    if (!postId) {
      return NextResponse.json(
        { error: "Unable to save scheduled post; database is unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json({
      ok: true,
      accepted: true,
      deliveryConfirmed: false,
      scheduled: true,
      jobId,
      postId,
      scheduledAt: new Date(body.scheduledAt!).toISOString(),
    });
  }

  try {
    const result = await publishToUploadPost({
      apiKey: uploadPostApiKey,
      username: uploadPostUsername,
      platforms: body.platforms,
      caption: body.caption,
      captionsByPlatform: body.captionsByPlatform,
      mediaUrls: body.mediaUrls ?? [],
      mediaType: body.mediaType,
      scheduledAt: body.scheduledAt,
      advancedByPlatform: body.advancedByPlatform as Record<string, Record<string, unknown>> | undefined,
      firstComment: body.firstComment,
      firstCommentByPlatform: body.firstCommentByPlatform,
      document: body.document,
      frameCoverUrl: body.frameCoverUrl,
      customCoverUrl: body.customCoverUrl,
      requestId: jobId,
      externalId: postId || jobId,
    });
    const platformResults = result.results;
    const succeeded = platformResults ? Object.values(platformResults).filter((entry) => entry.ok).length : 0;
    const failed = platformResults ? Object.values(platformResults).filter((entry) => !entry.ok).length : 0;
    if (postId) {
      const patch: Record<string, unknown> = {
        uploadPostRequestId: result.requestId,
        uploadPostJobId: result.jobId,
      };
      if (platformResults) {
        patch.perPlatformResults = Object.fromEntries(Object.entries(platformResults).map(([platform, entry]) => [platform, {
          status: entry.ok ? "delivered" : "failed",
          postId: entry.postId ?? null,
          postUrl: entry.url ?? null,
          deliveredAt: entry.ok ? new Date().toISOString() : null,
          error: entry.ok ? null : { message: entry.error || "UploadPost delivery failed" },
        }]));
      }
      if (isScheduled || result.scheduled) {
        patch.status = "scheduled";
        if (platformResults) {
          patch.perPlatformResults = Object.fromEntries(Object.entries(platformResults).map(([platform, entry]) => [platform, {
            status: "scheduled",
            postId: entry.postId ?? null,
            postUrl: entry.url ?? null,
            deliveredAt: null,
            error: entry.ok ? null : { message: entry.error || "UploadPost schedule failed" },
          }]));
        }
      } else if (result.deliveryConfirmed) {
        patch.status = "published";
        patch.publishedAt = new Date();
      } else if (platformResults && failed > 0) {
        patch.status = succeeded > 0 ? "partially_published" : "failed";
        patch.failureReason = Object.entries(platformResults)
          .filter(([, entry]) => !entry.ok)
          .map(([platform, entry]) => `${platform}: ${entry.error || "failed"}`)
          .join("; ");
      } else {
        patch.status = "publishing";
      }
      await updatePost(workspaceId, postId, patch as never).catch((err) => log.warn("Failed to persist UploadPost result", { err, postId }));
    }
    if (platformResults && succeeded === 0 && failed > 0) {
      const detailedError = Object.entries(platformResults)
        .filter(([, r]) => !r.ok)
        .map(([p, r]) => `${p}: ${r.error || "failed"}`)
        .join("; ");
      return NextResponse.json({
        error: detailedError || "UploadPost rejected every platform",
        accepted: false,
        deliveryConfirmed: false,
        jobId,
        postId,
        results: platformResults,
      }, { status: 502 });
    }
    return NextResponse.json({
      ok: true,
      accepted: result.accepted,
      deliveryConfirmed: result.deliveryConfirmed,
      scheduled: result.scheduled,
      uploadPostRequestId: result.requestId,
      uploadPostJobId: result.jobId,
      jobId,
      postId,
      results: platformResults,
      result: result.raw,
    }, { status: result.deliveryConfirmed ? 200 : 202 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "UploadPost call failed";
    if (postId) {
      await updatePost(workspaceId, postId, { status: "failed", failureReason: msg }).catch(() => undefined);
    }
    return NextResponse.json({ error: msg, postId }, { status: publishErrorStatus(msg) });
  }
}
