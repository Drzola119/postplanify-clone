import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session-context";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { createPost, updatePost } from "@/lib/db/posts";
import { createLogger } from "@/lib/log";
import { parseBody } from "@/lib/validation/helpers";

const log = createLogger("posts/publish");

const publishPayloadSchema = z.object({
  jobId: z.string().optional(),
  uploadPostUsername: z.string().optional(),
  platforms: z.array(z.string().min(1)).min(1),
  caption: z.string().min(1),
  hashtags: z.string().optional(),
  mediaUrls: z.array(z.string().min(1)).min(1),
  scheduledAt: z.string().nullable().optional(),
  firstComment: z.string().optional(),
  quoteTweetUrl: z.string().optional(),
  community: z.string().optional(),
  mediaType: z.string().optional(),
  advancedByPlatform: z.record(z.string(), z.unknown()).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PublishPayload {
  jobId?: string;
  uploadPostUsername?: string;
  platforms: string[];
  caption: string;
  hashtags?: string;
  mediaUrls: string[];
  scheduledAt?: string | null;
  firstComment?: string;
  quoteTweetUrl?: string;
  community?: string;
  mediaType?: string;
  /** Per-platform advanced options keyed by platform id. */
  advancedByPlatform?: Record<string, Record<string, string | number | boolean | string[] | undefined>>;
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { uid, workspaceId } = session;

  let n8nUrl: string;
  try {
    n8nUrl = resolvers.n8nWebhookUrl(request.headers);
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

  const uploadPostUsername =
    body.uploadPostUsername?.trim() ||
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
      mediaUrls: body.mediaUrls,
      hashtags: body.hashtags ? body.hashtags.split(/\s+/).filter(Boolean) : [],
      status: isScheduled ? "scheduled" : "queued",
      scheduledAt: isScheduled ? new Date(body.scheduledAt!) : undefined,
      firstComment: body.firstComment,
      quoteTweetUrl: body.quoteTweetUrl,
      community: body.community,
    });
  } catch (err) {
    // Firestore unavailable — fall back to stateless publish so the existing
    // composer UX still works during Hostinger env-var setup.
    log.warn("Firestore write failed; publishing stateless", { err });
    postId = "";
  }

  const payload = {
    jobId,
    postId,
    userId: uid,
    uploadPostUsername,
    platforms: body.platforms,
    caption: body.caption,
    hashtags: body.hashtags,
    mediaUrls: body.mediaUrls,
    scheduledAt: body.scheduledAt ?? null,
    advancedByPlatform: body.advancedByPlatform ?? {},
    firstComment: body.firstComment,
    mediaType: body.mediaType,
  };

  try {
    const res = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
    if (!res.ok) {
      if (postId) {
        await updatePost(workspaceId, postId, { status: "failed", failureReason: `n8n ${res.status}` }).catch(() => undefined);
      }
      return NextResponse.json(
        { error: "n8n webhook failed", upstream: parsed, status: res.status, postId },
        { status: 502 }
      );
    }
    if (postId && !isScheduled) {
      await updatePost(workspaceId, postId, { status: "published", publishedAt: new Date() }).catch(() => undefined);
    }
    return NextResponse.json({ ok: true, jobId, postId, result: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook call failed";
    if (postId) {
      await updatePost(workspaceId, postId, { status: "failed", failureReason: msg }).catch(() => undefined);
    }
    return NextResponse.json({ error: msg, postId }, { status: 502 });
  }
}