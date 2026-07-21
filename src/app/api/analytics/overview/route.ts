import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { resolvers } from "@/lib/security/server-config";
import { readProfile } from "@/lib/db/upload-post-profiles";
import { getUnifiedAnalytics } from "@/lib/uploadpost/analytics";
import {
  getCachedUnified,
  setCachedUnified,
} from "@/lib/db/analytics-cache";
import { countPublishedPosts } from "@/lib/db/posts";
import { analyticsOverviewQuerySchema } from "@/lib/validation/analytics";
import { parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import type { PlatformId } from "@/lib/db/schema";
import type { NormalizedPlatformAnalytics, UnifiedAnalytics } from "@/types/analytics";

const log = createLogger("analytics-overview");

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, analyticsOverviewQuerySchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid query");
  }

  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return jsonError(400, "Invalid date range");
  }

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    log.warn("UPLOAD_POST_API_KEY not configured", { error: String(err) });
    return jsonOk({
      overview: emptyOverview(session.workspaceId, from, to, "error", "Upload-Post API key not configured"),
    });
  }

  const profile = await readProfile(session.workspaceId);
  const profileUsername = profile?.username ?? session.workspaceId;

  // Serve cached payload when fresh (avoids hammering Upload-Post per load).
  const cached = await getCachedUnified(session.workspaceId, profileUsername, from, to).catch(
    () => null,
  );
  if (cached) {
    return jsonOk({ overview: toOverviewShape(cached, session.workspaceId, from, to) });
  }

  const range = { from, to };
  const [unifiedSettled, postsCountSettled] = await Promise.allSettled([
    getUnifiedAnalytics(apiKey, profileUsername, range),
    countPublishedPosts(session.workspaceId, from, to),
  ]);
  const unified: UnifiedAnalytics | null = unifiedSettled.status === "fulfilled" ? unifiedSettled.value : null;
  const postsPublished = postsCountSettled.status === "fulfilled" ? postsCountSettled.value : 0;

  if (!unified) {
    return jsonOk({
      overview: emptyOverview(session.workspaceId, from, to, "error", "Upload-Post analytics fetch failed"),
    });
  }

  unified.postsPublished = postsPublished;

  await setCachedUnified(
    session.uid,
    session.workspaceId,
    profileUsername,
    from,
    to,
    unified,
  ).catch(() => {});

  return jsonOk({
    overview: toOverviewShape(unified, session.workspaceId, from, to),
  });
}

function emptyOverview(
  workspaceId: string,
  from: Date,
  to: Date,
  status: "error",
  message: string,
) {
  return {
    workspaceId,
    from: from.toISOString(),
    to: to.toISOString(),
    status,
    errorMessage: message,
    totals: {
      followers: null,
      engagementRate: null,
      impressions: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      clicks: null,
      postsPublished: 0,
    },
    byPlatform: [],
  };
}

function toOverviewShape(
  unified: UnifiedAnalytics,
  workspaceId: string,
  from: Date,
  to: Date,
) {
  const byPlatform: Array<{
    platform: PlatformId;
    status: string;
    followers: number | null;
    impressions: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    engagementRate: number | null;
    errorMessage: string | null;
  }> = unified.byPlatform.map((p: NormalizedPlatformAnalytics) => ({
    platform: p.platform as PlatformId,
    status: p.status,
    followers: p.followers,
    impressions: p.impressionsPrimary,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    engagementRate: p.engagementRate,
    errorMessage: p.errorMessage,
  }));

  return {
    workspaceId,
    from: from.toISOString(),
    to: to.toISOString(),
    status: unified.status,
    errorMessage: unified.errorMessage,
    lastSyncedAt: unified.lastSyncedAt,
    totals: {
      followers: unified.followers,
      engagementRate: unified.engagementRate,
      impressions: unified.impressions,
      likes: unified.likes,
      comments: unified.comments,
      shares: unified.shares,
      saves: unified.saves,
      clicks: unified.clicks,
      postsPublished: unified.postsPublished,
    },
    byPlatform,
  };
}
