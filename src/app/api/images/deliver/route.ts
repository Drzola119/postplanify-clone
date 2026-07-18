import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { requireSession } from "@/lib/auth/session-context";
import {
  EngineError,
  getOutpaintJob,
  type EngineVariant,
} from "@/lib/images/engine-client";
import { resolvers } from "@/lib/security/server-config";
import { readCache } from "@/lib/db/account-health";
import { createPost, updatePost } from "@/lib/db/posts";
import { toEnginePlatform } from "@/lib/images/platform-ratios";
import { createLogger } from "@/lib/log";

const log = createLogger("api/images/deliver");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UP_BASE_URL = "https://api.upload-post.com";
const UP_PHOTOS_ENDPOINT = `${UP_BASE_URL}/api/upload_photos`;
const UP_TIMEOUT_MS = 30_000;
const UP_MAX_RETRIES = 2;
const UP_RETRY_BASE_MS = 1_500;

interface DeliverPayload {
  jobId: string;
  caption: string;
  hashtags?: string;
  scheduledAt?: string | null;
  firstComment?: string;
  mediaType?: string;
  advancedByPlatform?: Record<string, Record<string, string | number | boolean | string[] | undefined>>;
  sourceMediaUrl?: string;
}

interface PlatformDeliveryResult {
  platform: string;
  status: "delivered" | "failed";
  postId: string | null;
  mediaUrl: string | null;
  deliveredAt: string | null;
  error: { code?: string; message: string } | null;
}

interface UploadPostError extends Error {
  httpStatus?: number;
  code?: string;
}

function makeUploadPostError(message: string, httpStatus?: number, code?: string): UploadPostError {
  const err = new Error(message) as UploadPostError;
  err.name = "UploadPostError";
  err.httpStatus = httpStatus;
  err.code = code;
  return err;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractPostId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.id === "string" && obj.id) return obj.id;
  if (typeof obj.post_id === "string" && obj.post_id) return obj.post_id;
  const results = obj.results;
  if (results && typeof results === "object") {
    for (const platformResult of Object.values(results as Record<string, unknown>)) {
      if (!platformResult || typeof platformResult !== "object") continue;
      const pr = platformResult as Record<string, unknown>;
      if (typeof pr.id === "string" && pr.id) return pr.id;
      if (typeof pr.post_id === "string" && pr.post_id) return pr.post_id;
      const post = pr.post;
      if (post && typeof post === "object") {
        const postObj = post as Record<string, unknown>;
        if (typeof postObj.id === "string" && postObj.id) return postObj.id;
        if (typeof postObj.post_id === "string" && postObj.post_id) return postObj.post_id;
      }
    }
  }
  return null;
}

/**
 * POST /api/images/deliver
 *
 * Called by the composer after the engine has finished generating
 * per-ratio variants for a job (started via /api/images/outpaint).
 *
 * For each selected platform, downloads the matching variant from the
 * engine's public CDN URL and POSTs it to upload-post.com using the
 * workspace's own upload-post API key + profile username. Each platform
 * is published independently so a failure on one doesn't block others.
 *
 * Body: {
 *   jobId, caption, hashtags?, scheduledAt?, firstComment?,
 *   mediaType?, advancedByPlatform?, sourceMediaUrl?
 * }
 *
 * Returns 200 with per-platform results:
 *   { ok: true, postId, results: [{platform, status, postId, ...}], totals }
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { uid, workspaceId } = session;

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Firebase ID token in Authorization header" },
      { status: 401 }
    );
  }
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) {
    return NextResponse.json({ error: "Empty Firebase ID token" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Partial<DeliverPayload> | null;
  if (!body?.jobId || typeof body.jobId !== "string") {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }
  if (!body.caption || typeof body.caption !== "string") {
    return NextResponse.json({ error: "Missing caption" }, { status: 400 });
  }
  // After validation, `body` is guaranteed to have jobId/caption. Cast
  // once so downstream code (incl. callbacks) sees non-nullable fields.
  const safeBody = body as Required<Pick<DeliverPayload, "jobId" | "caption">> &
    DeliverPayload;

  // ── 1. Resolve upload-post credentials (workspace-scoped) ─────────────
  let uploadPostApiKey: string;
  try {
    uploadPostApiKey = resolvers.uploadPostApiKey(request.headers);
  } catch {
    return NextResponse.json(
      { error: "UPLOAD_POST_API_KEY not configured on server" },
      { status: 500 }
    );
  }

  // The workspace's upload-post.com profile username lives in the
  // social-accounts cache. Fall back to the env default if no cache yet.
  let uploadPostUsername =
    process.env.UPLOAD_POST_DEFAULT_USERNAME || "trustiify_test";
  try {
    const cache = await readCache(workspaceId);
    const profileUser = cache?.profiles?.[0]?.username;
    if (profileUser) uploadPostUsername = profileUser;
  } catch (err) {
    log.warn("[api/images/deliver] readCache failed; using env default username", { err });
  }

  // ── 2. Fetch the engine job + verify variants are complete ─────────────
  let job: Awaited<ReturnType<typeof getOutpaintJob>>;
  try {
    job = await getOutpaintJob(safeBody.jobId, idToken);
  } catch (err) {
    if (err instanceof EngineError) {
      return NextResponse.json(
        { error: err.message, engineStatus: err.status },
        { status: err.status === 404 ? 404 : 502 }
      );
    }
    log.error("[api/images/deliver] engine poll failed", { err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Engine poll failed" },
      { status: 502 }
    );
  }

  const completeVariants = job.variants.filter(
    (v) => v.status === "complete" && v.publicUrl
  );
  if (completeVariants.length === 0) {
    return NextResponse.json(
      {
        error: "No complete variants available",
        jobStatus: job.status,
        variants: job.variants.map((v) => ({
          variantId: v.variantId,
          ratioKey: v.ratioKey,
          status: v.status,
        })),
      },
      { status: 409 }
    );
  }
  const pendingRatioKeys = job.variants
    .filter((v) => v.status !== "complete")
    .map((v) => v.ratioKey);
  if (pendingRatioKeys.length > 0) {
    return NextResponse.json(
      {
        error: "Engine job still generating",
        jobStatus: job.status,
        pendingRatioKeys,
      },
      { status: 409 }
    );
  }

  // ── 3. Build per-platform variant mapping ──────────────────────────────
  // Each variant covers one or more platforms (e.g. the 4:5 variant
  // covers instagram/tiktok/facebook/threads). Build the reverse map:
  // platform → publicUrl.
  const variantByPlatform = new Map<string, EngineVariant>();
  for (const variant of completeVariants) {
    for (const p of variant.platforms) {
      // First write wins. If multiple variants claim the same platform
      // (shouldn't happen with the engine), prefer the more specific one.
      if (!variantByPlatform.has(p) && variant.publicUrl) {
        variantByPlatform.set(p, variant);
      }
    }
  }

  const platformsToPublish = job.platforms.filter((p) => variantByPlatform.has(p));
  if (platformsToPublish.length === 0) {
    return NextResponse.json(
      {
        error: "No matching variant for any selected platform",
        jobPlatforms: job.platforms,
        variantPlatforms: completeVariants.flatMap((v) => v.platforms),
      },
      { status: 422 }
    );
  }

  // ── 4. Persist a posts/{id} doc up-front so the result is durable ─────
  let postId: string;
  try {
    postId = await createPost(workspaceId, uid, {
      caption: safeBody.caption,
      platforms: platformsToPublish as never,
      mediaUrls: [
        ...new Set(completeVariants.map((v) => v.publicUrl!).filter(Boolean)),
      ],
      hashtags: safeBody.hashtags
        ? safeBody.hashtags.split(/\s+/).filter(Boolean)
        : [],
      status: "queued",
      scheduledAt: safeBody.scheduledAt ? new Date(safeBody.scheduledAt) : undefined,
      firstComment: safeBody.firstComment,
    });
  } catch (err) {
    // Firestore unavailable — fall back to stateless delivery so the
    // user still sees the publish result during env-var setup.
    log.warn("[api/images/deliver] createPost failed; publishing stateless", { err });
    postId = `stateless_${randomUUID()}`;
  }

  // ── 5. Publish per platform ────────────────────────────────────────────
  log.info("[api/images/deliver] starting per-platform publish", {
    jobId: safeBody.jobId,
    postId,
    platforms: platformsToPublish,
    uploadPostUsername,
    workspaceId,
  });

  const results = await Promise.allSettled(
    platformsToPublish.map((platform) => {
      const platformAdvancedOpts = safeBody.advancedByPlatform?.[platform];
      return deliverVariantToPlatform({
        variant: variantByPlatform.get(platform)!,
        platform,
        apiKey: uploadPostApiKey,
        username: uploadPostUsername,
        caption: safeBody.caption ?? "",
        ...(safeBody.firstComment ? { firstComment: safeBody.firstComment } : {}),
        ...(platformAdvancedOpts ? { advancedOptions: platformAdvancedOpts } : {}),
        jobId: safeBody.jobId,
      });
    })
  );

  const deliveryResults: PlatformDeliveryResult[] = results.map((r, idx) => {
    const platform = platformsToPublish[idx];
    if (r.status === "fulfilled") return r.value;
    const reason =
      r.reason instanceof Error ? r.reason.message : "Unknown delivery failure";
    return {
      platform,
      status: "failed",
      postId: null,
      mediaUrl: variantByPlatform.get(platform)?.publicUrl ?? null,
      deliveredAt: null,
      error: {
        code: r.reason instanceof Error ? (r.reason as UploadPostError).code : undefined,
        message: reason,
      },
    };
  });

  // ── 6. Persist results + update overall post status ────────────────────
  const perPlatformMap: Record<string, PlatformDeliveryResult> = {};
  for (const r of deliveryResults) perPlatformMap[r.platform] = r;

  const succeeded = deliveryResults.filter((r) => r.status === "delivered").length;
  const failed = deliveryResults.length - succeeded;
  let overallStatus: "published" | "partially_published" | "failed";
  if (succeeded === deliveryResults.length) overallStatus = "published";
  else if (succeeded > 0) overallStatus = "partially_published";
  else overallStatus = "failed";

  if (postId && !postId.startsWith("stateless_")) {
    try {
      await updatePost(workspaceId, postId, {
        status: overallStatus,
        publishedAt: succeeded > 0 ? new Date() : undefined,
        failureReason:
          failed > 0
            ? `${failed}/${deliveryResults.length} platforms failed: ${deliveryResults
                .filter((r) => r.status === "failed")
                .map((r) => `${r.platform}:${r.error?.message ?? "unknown"}`)
                .join("; ")}`
            : undefined,
        perPlatformResults: perPlatformMap as never,
      });
    } catch (err) {
      log.warn("[api/images/deliver] updatePost failed", { err });
    }
  }

  log.info("[api/images/deliver] completed", {
    jobId: safeBody.jobId,
    postId,
    succeeded,
    failed,
    overallStatus,
  });

  return NextResponse.json({
    ok: succeeded > 0,
    jobId: safeBody.jobId,
    postId,
    status: overallStatus,
    totals: { total: deliveryResults.length, succeeded, failed },
    results: deliveryResults,
  });
}

async function deliverVariantToPlatform(args: {
  variant: EngineVariant;
  platform: string;
  apiKey: string;
  username: string;
  caption: string;
  firstComment?: string;
  advancedOptions?: Record<string, string | number | boolean | string[] | undefined>;
  jobId: string;
}): Promise<PlatformDeliveryResult> {
  const {
    variant,
    platform,
    apiKey,
    username,
    caption,
    firstComment,
    advancedOptions,
    jobId,
  } = args;

  const t0 = Date.now();
  log.info(`[api/images/deliver] -> upload-post.com ${platform}`, {
    platform,
    jobId,
    variantId: variant.variantId,
    ratioKey: variant.ratioKey,
  });

  // ── a) Download variant bytes from the engine CDN ──────────────────────
  let fileBuffer: Buffer;
  let mimeType: string;
  let fileName: string;
  try {
    const variantRes = await fetch(variant.publicUrl!, {
      signal: AbortSignal.timeout(UP_TIMEOUT_MS),
      headers: { "User-Agent": "TrustiifyDeliver/1.0" },
    });
    if (!variantRes.ok) {
      throw makeUploadPostError(
        `Variant download failed: HTTP ${variantRes.status}`,
        variantRes.status,
        `cdn_${variantRes.status}`
      );
    }
    const arrayBuf = await variantRes.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuf);
    mimeType = variantRes.headers.get("content-type") || "image/jpeg";
    fileName = `${platform}_${variant.ratioKey}.jpg`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Variant download failed";
    log.warn("[api/images/deliver] variant download failed", { platform, err: msg });
    throw makeUploadPostError(msg, undefined, "cdn_download_failed");
  }

  // ── b) Build the upload-post.com multipart payload ────────────────────
  const form = new FormData();
  form.append("platform[]", toEnginePlatform(platform));
  form.append("title", caption);
  if (firstComment) form.append("first_comment", firstComment);
  form.append(
    "photos[]",
    new Blob([new Uint8Array(fileBuffer)], { type: mimeType }),
    fileName
  );

  // Pass through any per-platform advanced options uploaded-post understands.
  if (advancedOptions) {
    for (const [key, value] of Object.entries(advancedOptions)) {
      if (value === undefined || value === null) continue;
      // Skip fields we already wrote explicitly.
      if (key === "title" || key === "first_comment" || key === "platform[]") continue;
      if (typeof value === "boolean") {
        form.append(key, value ? "true" : "false");
      } else if (Array.isArray(value)) {
        for (const v of value) form.append(`${key}[]`, String(v));
      } else {
        form.append(key, String(value));
      }
    }
  }

  const idempotencyKey = randomUUID();

  // ── c) Retry loop ──────────────────────────────────────────────────────
  let lastError: UploadPostError | null = null;
  let lastHttpStatus: number | null = null;

  for (let attempt = 1; attempt <= UP_MAX_RETRIES + 1; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), UP_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(UP_PHOTOS_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Apikey ${apiKey}`,
            "Idempotency-Key": idempotencyKey,
          },
          body: form,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      lastHttpStatus = res.status;

      // Parse response (JSON or text)
      const ct = res.headers.get("content-type") || "";
      let parsed: unknown;
      if (ct.includes("application/json")) {
        parsed = await res.json();
      } else {
        const text = await res.text();
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { raw: text };
        }
      }

      // Auth errors are not retried — the workspace's API key is invalid.
      if (res.status === 401 || res.status === 403) {
        throw makeUploadPostError(
          `Upload-Post auth failed (HTTP ${res.status})`,
          res.status,
          "auth"
        );
      }

      if (res.ok) {
        const postId = extractPostId(parsed);
        const latencyMs = Date.now() - t0;
        log.info(`[api/images/deliver] delivered to ${platform}`, {
          platform,
          jobId,
          postId,
          latencyMs,
          status: res.status,
        });
        return {
          platform,
          status: "delivered",
          postId,
          mediaUrl: variant.publicUrl ?? null,
          deliveredAt: new Date().toISOString(),
          error: null,
        };
      }

      // Other non-2xx — record and maybe retry
      const msg =
        (parsed && typeof parsed === "object" && "error" in parsed
          ? String((parsed as Record<string, unknown>).error)
          : null) || `HTTP ${res.status}`;
      lastError = makeUploadPostError(msg, res.status, `http_${res.status}`);

      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt > UP_MAX_RETRIES) break;

      const jitter = Math.random() * 500;
      const backoff = UP_RETRY_BASE_MS * Math.pow(2, attempt - 1) + jitter;
      log.warn(`[api/images/deliver] retrying ${platform}`, {
        platform,
        attempt,
        status: res.status,
        backoffMs: Math.round(backoff),
      });
      await sleep(backoff);
    } catch (err) {
      lastError =
        err instanceof Error && (err as UploadPostError).httpStatus !== undefined
          ? (err as UploadPostError)
          : makeUploadPostError(err instanceof Error ? err.message : "fetch failed");

      // Auth errors bail immediately
      if (lastError.code === "auth") break;

      if (attempt > UP_MAX_RETRIES) break;

      const jitter = Math.random() * 500;
      const backoff = UP_RETRY_BASE_MS * Math.pow(2, attempt - 1) + jitter;
      log.warn(`[api/images/deliver] retrying ${platform} after error`, {
        platform,
        attempt,
        err: lastError.message,
        backoffMs: Math.round(backoff),
      });
      await sleep(backoff);
    }
  }

  const latencyMs = Date.now() - t0;
  log.error(`[api/images/deliver] failed to deliver to ${platform}`, {
    platform,
    jobId,
    err: lastError?.message,
    httpStatus: lastError?.httpStatus ?? lastHttpStatus,
    latencyMs,
  });

  return {
    platform,
    status: "failed",
    postId: null,
    mediaUrl: variant.publicUrl ?? null,
    deliveredAt: null,
    error: {
      code: lastError?.code ?? `http_${lastHttpStatus ?? "unknown"}`,
      message: lastError?.message ?? `Upload-Post returned HTTP ${lastHttpStatus}`,
    },
  };
}