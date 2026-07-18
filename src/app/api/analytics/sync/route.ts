import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { readCache, writeCache } from "@/lib/db/account-health";
import { ingestDailyMetric } from "@/lib/db/analytics";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import type { PlatformId } from "@/lib/db/schema";

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

  const results: { platform: string; handle: string; ingested: boolean }[] = [];

  try {
    const res = await fetch(
      `https://api.upload-post.com/api/uploadposts/users/${encodeURIComponent(session.workspaceId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Apikey ${apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    let data: UploadPostSingleResponse | null = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok || !data?.success || !data.profile) {
      return jsonError(502, data?.message ?? "Failed to fetch profile from upload-post.com");
    }

    const profile = data.profile;
    const accounts: { id: string; profileUsername: string; platform: string; handle: string; displayName: string | null; img: string | null; reauthRequired: boolean }[] = [];

    if (profile.social_accounts) {
      for (const [platform, acct] of Object.entries(profile.social_accounts)) {
        if (!acct || typeof acct === "string") continue;
        const a = acct as UploadPostAccount;
        if (!a.handle) continue;
        const id = `${profile.username}:${platform}`;
        accounts.push({
          id,
          profileUsername: profile.username,
          platform,
          handle: a.handle,
          displayName: a.display_name ?? null,
          img: a.social_images ?? null,
          reauthRequired: !!a.reauth_required,
        });
      }
    }

    // For each connected account, try to ingest basic stats — upload-post.com
    // returns profile metadata only (no follower counts, etc.), so we store
    // what we have. Rich daily metrics are populated via the ingest endpoint.
    const UP_ACCT_TO_PLATFORM: Record<string, PlatformId> = {
      tiktok: "tiktok", facebook: "facebook", x: "twitter", bluesky: "bluesky",
      instagram: "instagram", youtube: "youtube", threads: "threads",
      pinterest: "pinterest", linkedin: "linkedin",
      google_business: "google_business", reddit: "bluesky", discord: "discord", telegram: "telegram",
    };
    const today = new Date();
    for (const acct of accounts) {
      const pid = UP_ACCT_TO_PLATFORM[acct.platform] ?? "bluesky";
      try {
        await ingestDailyMetric(session.workspaceId, today, pid, {
          followers: 0,
          impressions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
          engagementRate: 0,
        });
        results.push({ platform: acct.platform, handle: acct.handle, ingested: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.warn(msg, { msg: "ingest failed", account: acct.id });
        results.push({ platform: acct.platform, handle: acct.handle, ingested: false });
      }
    }

    // Update the workspace's account cache.
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

    return jsonOk({
      synced: true,
      accountsCount: accounts.length,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    log.error(err, { msg });
    return jsonError(502, msg);
  }
}
