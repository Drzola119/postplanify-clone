import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { resolvers } from "@/lib/security/server-config";
import { readProfile } from "@/lib/db/upload-post-profiles";
import { readCache } from "@/lib/db/account-health";
import { getProfileAnalytics, isAnalyticsSupported } from "@/lib/uploadpost/analytics";
import { getCachedPlatform, setCachedPlatform } from "@/lib/db/analytics-cache";
import { analyticsOverviewQuerySchema } from "@/lib/validation/analytics";
import { parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import { countPublishedPosts } from "@/lib/db/posts";
import type { PlatformId } from "@/lib/db/schema";
import type { NormalizedPlatformAnalytics } from "@/types/analytics";

const log = createLogger("analytics-account");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await params;
  if (!id) return jsonError(400, "Missing account id");

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

  // Resolve platform for this account id from the cached snapshot.
  const cache = await readCache(session.workspaceId).catch(() => null);
  const acct = cache?.accounts?.find((a) => a.id === id);
  if (!acct) {
    return jsonError(404, "Account not found in workspace snapshot. Try refreshing accounts.");
  }
  const platform = acct.platform;

  if (!isAnalyticsSupported(platform)) {
    // Discord / Telegram / Google Business — analytics not offered by Upload-Post.
    return jsonOk({
      analytics: {
        accountId: id,
        platform,
        from: from.toISOString(),
        to: to.toISOString(),
        status: "unsupported",
        errorMessage: "Analytics not supported for this platform",
        totals: {
          followers: null,
          impressions: null,
          likes: null,
          comments: null,
          shares: null,
          saves: null,
          clicks: null,
          engagementRate: null,
          postsPublished: 0,
        },
        series: [],
      },
    });
  }

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    log.warn("UPLOAD_POST_API_KEY not configured", { error: String(err) });
    return jsonOk({
      analytics: {
        accountId: id,
        platform,
        from: from.toISOString(),
        to: to.toISOString(),
        status: "error",
        errorMessage: "Upload-Post API key not configured",
        totals: nullSeries(),
        series: [],
      },
    });
  }

  // Use the profileUsername stored on the cached account record — this is the
  // exact username the Upload-Post API used when the account was connected,
  // so it's guaranteed to match the analytics endpoint.
  const profileUsername = acct.profileUsername ?? (await readProfile(session.workspaceId))?.username ?? session.workspaceId;
  log.info("account analytics fetch", { accountId: id, platform, profileUsername });

  // Pass ?fresh=1 to bypass the cache — used by the page's live-poll loop so
  // the user actually sees fresh numbers every 30s.
  const wantsFresh = new URL(request.url).searchParams.get("fresh") === "1";

  let normalized: NormalizedPlatformAnalytics | null = null;
  if (!wantsFresh) {
    normalized = await getCachedPlatform(
      session.workspaceId,
      profileUsername,
      platform,
      from,
      to,
    ).catch(() => null);
  }
  if (!normalized) {
    const [settled] = await Promise.allSettled([
      getProfileAnalytics(apiKey, profileUsername, [platform as never]),
    ]);
    const list = settled.status === "fulfilled" ? settled.value : null;
    normalized = list?.[0] ?? null;
    if (normalized) {
      await setCachedPlatform(
        session.uid,
        session.workspaceId,
        profileUsername,
        platform,
        from,
        to,
        normalized,
      ).catch(() => {});
    }
  }

  if (normalized) {
    if (acct.reauthRequired) {
      normalized = {
        ...normalized,
        status: "token_expired",
        errorMessage: "Please reconnect this account to restore analytics.",
      };
    } else if (normalized.status === "not_connected") {
      normalized = {
        ...normalized,
        status: "ok",
        errorMessage: null,
      };
    }
  }

  const postsPublished = await countPublishedPosts(
    session.workspaceId,
    from,
    to,
    platform as PlatformId,
  );

  if (!normalized) {
    return jsonOk({
      analytics: {
        accountId: id,
        platform,
        from: from.toISOString(),
        to: to.toISOString(),
        status: "error",
        errorMessage: "No analytics returned",
        totals: nullSeries(),
        series: [],
      },
    });
  }

  return jsonOk({
    analytics: {
      accountId: id,
      platform,
      from: from.toISOString(),
      to: to.toISOString(),
      status: normalized.status,
      errorMessage: normalized.errorMessage,
      lastSyncedAt: normalized.lastSyncedAt,
      totals: {
        followers: normalized.followers,
        impressions: normalized.impressionsPrimary,
        likes: normalized.likes,
        comments: normalized.comments,
        shares: normalized.shares,
        saves: normalized.saves,
        clicks: normalized.clicks,
        engagementRate: normalized.engagementRate,
        postsPublished,
      },
      // Timeseries only when present — never fabricated with static totals.
      series: normalized.timeseries.map((pt) => ({
        date: pt.date,
        followers: 0,
        engagementRate: 0,
        impressions: pt.value,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
      })),
    },
  });
}

function nullSeries() {
  return {
    followers: null,
    impressions: null,
    likes: null,
    comments: null,
    shares: null,
    saves: null,
    clicks: null,
    engagementRate: null,
    postsPublished: 0,
  };
}

