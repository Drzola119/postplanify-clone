import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { readCache, writeCache } from "@/lib/db/account-health";
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
    // Ensure we have the profile username (workspaceId scoped at upload-post.com).
    const profile = await readProfile(session.workspaceId);
    const profileUsername = profile?.username ?? session.workspaceId;

    if (force) {
      await invalidateAnalyticsCache(session.workspaceId, profileUsername).catch(() => {});
    }

    // Fetch accounts snapshot for the cache + platform list.
    const listRes = await fetch(
      `https://api.upload-post.com/api/uploadposts/users/${encodeURIComponent(profileUsername)}`,
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
    const cached = await readCache(session.workspaceId).catch(() => null);
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
      profiles: cached?.profiles ?? [],
      plan: cached?.plan ?? null,
      limit: cached?.limit ?? null,
    });

    // Pull live analytics from Upload-Post.
    const connectedPlatforms = accounts
      .map((a) => toInternalPlatform(a.platform))
      .filter((p) => isAnalyticsSupported(p)) as PlatformId[];

    // Use allSettled so a failure in one analytics source never breaks the other.
    const [profileSettled, unifiedSettled] = await Promise.allSettled([
      getProfileAnalytics(apiKey, profileUsername, SUPPORTED_ANALYTICS_PLATFORMS),
      getUnifiedAnalytics(apiKey, profileUsername, range),
    ]);

    const profileData = profileSettled.status === "fulfilled" ? profileSettled.value : null;
    const unified = unifiedSettled.status === "fulfilled" ? unifiedSettled.value : null;

    if (profileSettled.status === "rejected") {
      log.warn("profile analytics fetch failed in sync", { reason: String(profileSettled.reason) });
    }
    if (unifiedSettled.status === "rejected") {
      log.warn("unified analytics fetch failed in sync", { reason: String(unifiedSettled.reason) });
    }

    // Persist a unified snapshot into the user-scoped cache.
    if (unified?.status === "ok" || unified?.errorMessage) {
      await setCachedUnified(
        session.uid,
        session.workspaceId,
        profileUsername,
        range.from,
        range.to,
        unified,
      ).catch((e) => log.warn("cache unified failed", { error: String(e) }));
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
