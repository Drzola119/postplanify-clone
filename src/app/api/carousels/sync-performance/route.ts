/**
 * POST /api/carousels/sync-performance
 *
 * Feature A — pulls live post metrics for a carousel's published post
 * and writes them onto the carousel doc. The hub card uses the result
 * to render the perf row + drive the "stale > 6h" sync button.
 *
 * Lookup strategy:
 *   1. If the carousel doc has `postId`, use it.
 *   2. Otherwise, query `posts` for a doc whose `perPlatformResults`
 *      array contains a mediaUrl that overlaps with this carousel's
 *      `mediaUrls` — the most common case for carousels that were
 *      scheduled from the wizard before the back-link was added.
 *   3. If no post is found, return a friendly "no-post" result so the
 *      hub can surface "publish this carousel to start tracking stats".
 *
 * The actual live fetch reuses `getPostAnalyticsByRequestId` from
 * `src/lib/uploadpost/analytics.ts` — the same primitive the existing
 * `/api/posts/live-metrics` route already uses. We do not rebuild any
 * upload-post integration here.
 */
import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireSession } from "@/lib/auth/session-context";
import { resolvers } from "@/lib/security/server-config";
import { adminDb } from "@/lib/firebase/admin";
import { getPostAnalyticsByRequestId } from "@/lib/uploadpost/analytics";
import { toInternalPlatform } from "@/lib/platforms";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import type {
  CarouselPerformance,
  CarouselSyncResult,
} from "@/lib/carousel-gen/analytics-types";
import type { PlatformKey } from "@/types/analytics";

const logger = createLogger("api:carousels:sync-performance");

const syncSchema = z.object({
  carouselId: z.string().min(1).max(64),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const parsed = await parseBody(request, syncSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }
  const { carouselId } = parsed.data;

  // Step 1 — load the carousel doc.
  const carouselRef = adminDb
    .collection("workspaces")
    .doc(session.workspaceId)
    .collection("carousels")
    .doc(carouselId);
  const carouselSnap = await carouselRef.get();
  if (!carouselSnap.exists) {
    return jsonError(404, "Carousel not found");
  }
  const carousel = carouselSnap.data() as Record<string, unknown>;
  const mediaUrls = Array.isArray(carousel.mediaUrls)
    ? (carousel.mediaUrls as unknown[]).filter(
        (u): u is string => typeof u === "string"
      )
    : [];

  // Step 2 — resolve the post.
  const postId = await resolvePostId(
    session.workspaceId,
    typeof carousel.postId === "string" ? carousel.postId : null,
    mediaUrls
  );
  if (!postId) {
    const result: CarouselSyncResult = {
      ok: false,
      reason: "no-post",
      message: "No published post found for this carousel yet. Schedule and publish it to start tracking metrics.",
    };
    return jsonOk(result);
  }

  // Step 3 — load the post doc and pick the first delivered platform.
  const postRef = adminDb
    .collection("workspaces")
    .doc(session.workspaceId)
    .collection("posts")
    .doc(postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) {
    const result: CarouselSyncResult = {
      ok: false,
      reason: "no-post",
      message: "The post this carousel was scheduled to no longer exists.",
    };
    return jsonOk(result);
  }
  const post = postSnap.data() as Record<string, unknown>;
  const perPlatformResults = (post.perPlatformResults ?? {}) as Record<
    string,
    { postId?: string | null; status?: string }
  >;
  const platformEntry = Object.entries(perPlatformResults).find(
    ([, v]) => v?.postId && v.status === "delivered"
  );
  if (!platformEntry) {
    const result: CarouselSyncResult = {
      ok: false,
      reason: "no-post",
      message: "The linked post hasn't been published yet to any platform.",
    };
    return jsonOk(result);
  }
  const [rawPlatform, result] = platformEntry;
  const platform = toInternalPlatform(rawPlatform) as PlatformKey;
  const uploadPostId = result.postId!;

  // Step 4 — call the existing live-metrics primitive.
  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch {
    const r: CarouselSyncResult = {
      ok: false,
      reason: "unconfigured",
      message: "Upload-Post is not configured on this server.",
    };
    return jsonOk(r);
  }

  try {
    const pm = await getPostAnalyticsByRequestId(
      apiKey,
      uploadPostId,
      platform
    );
    if (pm.status !== "ok") {
      const r: CarouselSyncResult = {
        ok: false,
        reason: "fetch-failed",
        message: pm.errorMessage ?? `Live metrics unavailable (${pm.status})`,
      };
      return jsonOk(r);
    }
    const likes = pm.likes ?? 0;
    const comments = pm.comments ?? 0;
    const shares = pm.shares ?? 0;
    const saves = pm.saves ?? 0;
    const impressions = pm.impressions ?? 0;
    const engagements = likes + comments + shares + saves;
    const engagementRate =
      impressions > 0
        ? Math.round((engagements / impressions) * 10000) / 100
        : 0;
    const lastSyncedAt = Date.now();

    const performance: CarouselPerformance = {
      likes,
      comments,
      shares,
      saves,
      impressions,
      engagementRate,
      lastSyncedAt,
      platform,
    };

    // Step 5 — write back to the carousel doc + persist the postId
    // back-link if it wasn't already set.
    await carouselRef.set(
      {
        performance,
        postId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info("Carousel performance synced", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      carouselId,
      postId,
      platform,
      engagementRate,
    });

    const ok: CarouselSyncResult = { ok: true, performance, postId };
    return jsonOk(ok);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Carousel sync-performance failed", {
      workspaceId: session.workspaceId,
      carouselId,
      error: message,
    });
    const r: CarouselSyncResult = {
      ok: false,
      reason: "fetch-failed",
      message,
    };
    return jsonOk(r);
  }
}

/**
 * Resolve the post id for a carousel. Tries the explicit `postId`
 * field first; if that's missing, walks the workspace's posts looking
 * for one whose delivered media overlaps this carousel's mediaUrls.
 */
async function resolvePostId(
  workspaceId: string,
  explicitPostId: string | null,
  mediaUrls: string[]
): Promise<string | null> {
  if (!adminDb) return null;
  if (explicitPostId) {
    const snap = await adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("posts")
      .doc(explicitPostId)
      .get();
    if (snap.exists) return explicitPostId;
  }
  if (mediaUrls.length === 0) return null;

  // Firestore `array-contains-any` accepts up to 30 values. Carousels
  // are 5-15 slides so the cap is comfortable.
  const probe = mediaUrls.slice(0, 30);
  const candidates = await adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("posts")
    .where("mediaUrls", "array-contains-any", probe)
    .limit(5)
    .get();
  if (candidates.empty) return null;
  // Prefer a doc that actually has a delivered platform result.
  for (const doc of candidates.docs) {
    const data = doc.data() as Record<string, unknown>;
    const ppr = (data.perPlatformResults ?? {}) as Record<
      string,
      { postId?: string | null; status?: string }
    >;
    if (Object.values(ppr).some((v) => v?.postId && v.status === "delivered")) {
      return doc.id;
    }
  }
  return candidates.docs[0]?.id ?? null;
}
