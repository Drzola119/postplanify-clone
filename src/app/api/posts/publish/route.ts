import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Payload sent to the n8n AutoPost webhook (mirrors media-flow-genie/backend shape). */
interface PublishPayload {
  /** Stable job id so retries don't double-post. */
  jobId: string;
  /** Firebase uid of the requesting user. */
  userId: string;
  /** upload-post.com username connected for this brand (resolved via /v1/social-accounts). */
  uploadPostUsername: string;
  /** One or more targets. */
  platforms: string[];
  caption: string;
  /** Optional: AI-suggested hashtags (space-delimited, appended to caption on some platforms). */
  hashtags?: string;
  /** Public URLs (Bunny CDN) of the media for this post. */
  mediaUrls: string[];
  /** Schedule timestamp (ISO). If null → post immediately. */
  scheduledAt: string | null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const body = (await request.json().catch(() => null)) as Partial<PublishPayload> | null;
  if (!body?.platforms?.length || !body.caption) {
    return NextResponse.json(
      { error: "Missing platforms / caption" },
      { status: 400 }
    );
  }
  if (!Array.isArray(body.mediaUrls) || body.mediaUrls.length === 0) {
    return NextResponse.json(
      { error: "At least one mediaUrl is required" },
      { status: 400 }
    );
  }

  // Resolve upload-post.com username: explicit param → env fallback → default token.
  const uploadPostUsername =
    body.uploadPostUsername?.trim() ||
    process.env.UPLOAD_POST_DEFAULT_USERNAME ||
    "trustiify_test";

  const payload: PublishPayload = {
    jobId: body.jobId ?? crypto.randomUUID(),
    userId: user.uid,
    uploadPostUsername,
    platforms: body.platforms,
    caption: body.caption,
    hashtags: body.hashtags,
    mediaUrls: body.mediaUrls,
    scheduledAt: body.scheduledAt ?? null,
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
      // n8n returned non-JSON; keep raw text under `raw`
      parsed = { raw: text };
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: "n8n webhook failed", upstream: parsed, status: res.status },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, jobId: payload.jobId, result: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook call failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
