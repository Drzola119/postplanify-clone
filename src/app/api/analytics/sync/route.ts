import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { writeCache } from "@/lib/db/account-health";
import { readProfile } from "@/lib/db/upload-post-profiles";
import {
  getProfileAnalytics,
  getUnifiedAnalytics,
  isAnalyticsSupported,
  SUPPORTED_ANALYTICS_PLATFORMS,
  UNSUPPORTED_ANALYTICS_PLATFORMS,
} from "@/lib/uploadpost/analytics";
import {
  invalidateAnalyticsCache,
  setCachedUnified,
} from "@/lib/db/analytics-cache";
import { countPublishedPosts } from "@/lib/db/posts";
import { toInternalPlatform } from "@/lib/platforms";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import type { PlatformId } from "@/lib/db/schema";
import type { DateRange } from "@/types/analytics";

const log = createLogger("analytics-sync");

interface UploadPostAccount {
  display_name?: string;
  handle?: string;
  social_images?: string;
  reauth_required?: boolean;
}

interface UploadPostProfile {
  username: string;
  social_accounts?: Record<string, UploadPostAccount | "">;
  created_at?: string;
  redirect_url?: string;
  blocked?: boolean;
}

interface UploadPostSingleResponse {
  success: boolean;
  profile?: UploadPostProfile;
  message?: string;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) {
      return jsonError(500, `${err.secret} not configured on server`);
    }
    throw err;
  }

  const force = new URL(request.url).searchParams.get("force") === "1";
  const range: DateRange = {
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    to: new Date(),
  };

  try {
    // Fetch accounts snapshot for the cache + platform list.
    // Use readProfile as a hint for the username to call Upload-Post with,
    // but the returned upProfile.username is the authoritative value.
    const storedProfile = await readProfile(session.workspaceId);
    const hintUsername = storedProfile?.username ?? session.workspaceId;

    const listRes = await fetch(
      `https://api.upload-post.com/api/uploadposts/users/${encodeURIComponent(hintUsername)}`,
      {
        method: "GET",
        headers: { Authorization: `Apikey ${apiKey}`, Accept: "application/json" },
        cache: "no-store",
      },
    );
    const listData = (await listRes.json().catch(() => null)) as UploadPostSingleResponse | null;
    if (!listRes.ok || !listData?.success || !listData.profile) {
      return jsonError(502, listData?.message ?? "Failed to fetch profile from upload-post.com");
    }

    const upProfile = listData.profile;

    // Now we have the real username — use it for cache invalidation.
    if (force) {
      await invalidateAnalyticsCache(session.workspaceId, upProfile.username).catch(() => {});
    }

    // Canonical profileUsername from the live API response.
    const profileUsername = upProfile.username;

    const accounts: {
      id: string;
      profileUsername: string;
      platform: string;
      handle: string;
      displayName: string | null;
      img: string | null;
      reauthRequired: boolean;
    }[] = [];

    if (upProfile.social_accounts) {
      for (const [platform, acct] of Object.entries(upProfile.social_accounts)) {
        if (!acct || typeof acct === "string") continue;
        if (!acct.handle) continue;
        const id = `${upProfile.username}:${platform}`;
        accounts.push({
          id,
          profileUsername: upProfile.username,
          platform,
          handle: acct.handle,
          displayName: acct.display_name ?? null,
          img: acct.social_images ?? null,
          reauthRequired: !!acct.reauth_required,
        });
      }
    }

    // Cache accounts snapshot (no secrets — just ids/handles).
    await writeCache(session.workspaceId, {
      accounts: accounts.map((a) => ({
        id: a.id,
        profileUsername: a.profileUsername,
        platform: a.platform,
        handle: a.handle,
        displayName: a.displayName,
        img: a.img,
        reauthRequired: a.reauthRequired,
      })),
      // Always persist the freshly-fetched username so overview + account routes
      // can resolve profileUsername correctly without a separate Firestore read.
      profiles: [{
        username: upProfile.username,
        redirectUrl: upProfile.redirect_url ?? null,
        blocked: !!upProfile.blocked,
        createdAt: upProfile.created_at ?? null,
      }],
      plan: null,
      limit: null,
    });

    // Pull live analytics from Upload-Post.
    const connectedPlatforms = accounts
      .map((a) => toInternalPlatform(a.platform))
      .filter((p) => isAnalyticsSupported(p)) as PlatformId[];

    // Fetch profile analytics + multi-period unified analytics in parallel
    const periodsDays = [7, 14, 30, 90];
    const now = new Date();

    const unifiedPromises = periodsDays.map(async (days) => {
      const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const periodRange: DateRange = { from: fromDate, to: now };
      const [u, postCount] = await Promise.all([
        getUnifiedAnalytics(apiKey, profileUsername, periodRange).catch(() => null),
        countPublishedPosts(session.workspaceId, fromDate, now).catch(() => 0),
      ]);
      if (u) {
        u.postsPublished = postCount;
        await setCachedUnified(
          session.uid,
          session.workspaceId,
          profileUsername,
          fromDate,
          now,
          u,
        ).catch((e) => log.warn(`cache unified ${days}d failed`, { error: String(e) }));
      }
      return { days, unified: u };
    });

    const [profileSettled, ...unifiedSettledList] = await Promise.allSettled([
      getProfileAnalytics(apiKey, profileUsername, SUPPORTED_ANALYTICS_PLATFORMS),
      ...unifiedPromises,
    ]);

    const profileData = profileSettled.status === "fulfilled" ? profileSettled.value : null;
    const ninetyDayResult = unifiedSettledList.find(
      (s) => s.status === "fulfilled" && s.value.days === 90,
    );
    const unified = ninetyDayResult && ninetyDayResult.status === "fulfilled" ? ninetyDayResult.value.unified : null;

    if (profileSettled.status === "rejected") {
      log.warn("profile analytics fetch failed in sync", { reason: String(profileSettled.reason) });
    }

    const results = accounts.map((a) => ({
      platform: a.platform,
      handle: a.handle,
      supported: isAnalyticsSupported(toInternalPlatform(a.platform)),
      status:
        profileData?.find((p) => p.platform === toInternalPlatform(a.platform))?.status ?? "unknown",
    }));

    // Mark unsupported platforms explicitly so the UI can show "analytics unsupported".
    for (const p of UNSUPPORTED_ANALYTICS_PLATFORMS) {
      if (accounts.some((a) => toInternalPlatform(a.platform) === p)) {
        results.push({ platform: p, handle: "", supported: false, status: "unsupported" });
      }
    }

    return jsonOk({
      synced: true,
      profileUsername,
      accountsCount: accounts.length,
      connectedAnalyticsPlatforms: connectedPlatforms.length,
      unifiedStatus: unified?.status ?? "unknown",
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    log.error(err, { msg });
    return jsonError(502, msg);
  }
}
