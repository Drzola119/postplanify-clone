import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { resolvers } from "@/lib/security/server-config";
import { adminDb } from "@/lib/db";
import { getPostAnalyticsByRequestId, getPostAnalyticsByPlatformPostId } from "@/lib/uploadpost/analytics";
import { toInternalPlatform } from "@/lib/platforms";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";

const log = createLogger("posts-live-metrics");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch {
    return jsonOk({ metrics: [] });
  }

  const url = new URL(request.url);
  const postIds = url.searchParams.get("postIds")?.split(",").filter(Boolean) ?? [];
  if (postIds.length === 0) return jsonOk({ metrics: [] });
  if (postIds.length > 20) return jsonError(400, "Max 20 post IDs per request");

  // Fetch each post's Firestore doc to extract perPlatformResults.
  if (!adminDb) return jsonOk({ metrics: [] });

  const metrics: Record<string, unknown>[] = [];
  const errors: { postId: string; error: string }[] = [];

  const snapshots = await Promise.allSettled(
    postIds.map((pid) =>
      adminDb!.collection(`workspaces/${session.workspaceId}/posts`).doc(pid).get(),
    ),
  );

  for (let i = 0; i < postIds.length; i++) {
    const pid = postIds[i];
    const settled = snapshots[i];
    if (settled.status === "rejected" || !settled.value.exists) {
      metrics.push({ postId: pid, status: "not_found", likes: null, comments: null, shares: null, impressions: null });
      continue;
    }
    const doc = settled.value.data() as Record<string, unknown>;
    const perPlatformResults = (doc.perPlatformResults ?? {}) as Record<string, { postId?: string | null; status?: string }>;
    const publishedAt = (doc.publishedAt as string) ?? null;

    // Collect live metrics from the first platform result that has a postId.
    const platformEntry = Object.entries(perPlatformResults).find(
      ([, v]) => v?.postId && v.status === "delivered",
    );
    if (!platformEntry) {
      metrics.push({ postId: pid, status: "no_live_data", likes: null, comments: null, shares: null, impressions: null, publishedAt });
      continue;
    }
    const [rawPlatform, result] = platformEntry;
    const platform = toInternalPlatform(rawPlatform);
    const uploadPostId = result.postId!;

    const [settledMetric] = await Promise.allSettled([
      getPostAnalyticsByRequestId(apiKey, uploadPostId, platform as never),
    ]);
    if (settledMetric.status === "fulfilled") {
      const pm = settledMetric.value;
      metrics.push({
        postId: pid,
        status: pm.status,
        platform,
        likes: pm.likes,
        comments: pm.comments,
        shares: pm.shares,
        saves: pm.saves,
        impressions: pm.impressions,
        views: pm.views,
        clicks: pm.clicks,
        publishedAt,
      });
    } else {
      errors.push({ postId: pid, error: String(settledMetric.reason) });
      metrics.push({ postId: pid, status: "fetch_failed", likes: null, comments: null, shares: null, impressions: null, publishedAt });
    }
  }

  if (errors.length > 0) {
    log.warn("per-post metric errors", { count: errors.length });
  }

  return jsonOk({ metrics, errorCount: errors.length });
}
