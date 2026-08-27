import "server-only";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/firebase/admin";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { writeCache } from "@/lib/db/account-health";
import { ensureProfile } from "@/lib/db/upload-post-profiles";
import { toInternalPlatform } from "@/lib/platforms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlatformKey =
  | "tiktok"
  | "facebook"
  | "x"
  | "bluesky"
  | "instagram"
  | "youtube"
  | "threads"
  | "pinterest"
  | "linkedin"
  | "google_business"
  | "reddit"
  | "discord"
  | "telegram";

interface UploadPostAccount {
  display_name?: string;
  handle?: string;
  social_images?: string;
  reauth_required?: boolean;
  /** Per-platform identifier used by some analytics endpoints (e.g. Facebook page_id). */
  username?: string;
  page_id?: string;
  social_id?: string;
  id?: string;
}

/** Extract a per-platform username/id (Facebook page_id, etc.) if the upstream provides one. */
function platformUsernameOf(a: UploadPostAccount): string | null {
  return a.page_id ?? a.username ?? a.social_id ?? a.id ?? null;
}

interface UploadPostProfile {
  username: string;
  social_accounts?: Partial<Record<PlatformKey, UploadPostAccount | "">>;
  created_at?: string;
  redirect_url?: string;
  blocked?: boolean;
}

interface UploadPostSingleResponse {
  success: boolean;
  profile?: UploadPostProfile;
  message?: string;
}

interface UploadPostListResponse {
  success: boolean;
  profiles: UploadPostProfile[];
  limit?: number;
  plan?: string;
}

export interface ConnectedAccountDTO {
  /** Unique id combining profile + platform. */
  id: string;
  profileUsername: string;
  platformUsername: string | null;
  platform: string;
  handle: string;
  displayName: string | null;
  img: string | null;
  reauthRequired: boolean;
}

/** Map upload-post.com key → our internal Platform type (subset supported by UI). */
const SUPPORTED: PlatformKey[] = [
  "tiktok",
  "facebook",
  "x",
  "bluesky",
  "instagram",
  "youtube",
  "threads",
  "pinterest",
  "linkedin",
  "google_business",
  "reddit",
  "discord",
  "telegram",
];

function flatten(profile: UploadPostProfile | null): ConnectedAccountDTO[] {
  if (!profile || !profile.social_accounts) return [];
  const out: ConnectedAccountDTO[] = [];
  for (const key of SUPPORTED) {
    const acct = profile.social_accounts[key];
    // Empty string means "not connected" — skip.
    if (!acct || typeof acct === "string") {
      continue;
    }
    const a = acct as UploadPostAccount;
    const handle = a.handle ?? a.display_name ?? platformUsernameOf(a);
    if (!handle) continue;
    out.push({
      id: `${profile.username}:${key}`,
      profileUsername: profile.username,
      platformUsername: platformUsernameOf(a),
      platform: toInternalPlatform(key),
      handle,
      displayName: a.display_name ?? null,
      img: a.social_images || null,
      reauthRequired: !!a.reauth_required,
    });
  }
  return out;
}

interface UploadPostDestination {
  id?: string | number;
  name?: string;
  title?: string;
  page_id?: string | number;
  page_name?: string;
}

interface UploadPostDestinationsResponse {
  boards?: UploadPostDestination[];
  pages?: UploadPostDestination[];
  facebook_pages?: UploadPostDestination[];
}

async function fetchDestinations(apiKey: string, profileUsername: string) {
  const headers = { Authorization: `Apikey ${apiKey}`, Accept: "application/json" };
  const query = `?profile=${encodeURIComponent(profileUsername)}`;
  const safeFetch = async (url: string): Promise<Response | null> => {
    try { return (await fetch(url, { headers, cache: "no-store" })) ?? null; }
    catch { return null; }
  };
  const [boardsRes, pagesRes] = await Promise.all([
    safeFetch(`https://api.upload-post.com/api/uploadposts/pinterest/boards${query}`),
    safeFetch(`https://api.upload-post.com/api/uploadposts/facebook/pages${query}`),
  ]);
  const parse = async (res: Response | null): Promise<UploadPostDestinationsResponse> => {
    if (!res?.ok) return {};
    try { return (await res.json()) as UploadPostDestinationsResponse; } catch { return {}; }
  };
  const [boardsData, pagesData] = await Promise.all([parse(boardsRes), parse(pagesRes)]);
  const boards = (boardsData.boards ?? []).map((item) => ({
    id: String(item.id ?? ""), name: String(item.name ?? item.title ?? item.id ?? ""),
  })).filter((item) => item.id && item.name);
  const rawPages = pagesData.pages ?? pagesData.facebook_pages ?? [];
  const pages = rawPages.map((item) => ({
    id: String(item.id ?? item.page_id ?? ""),
    name: String(item.name ?? item.page_name ?? item.title ?? item.id ?? item.page_id ?? ""),
  })).filter((item) => item.id && item.name);
  return { boards, pages };
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) {
      return NextResponse.json(
        { error: `${err.secret} not configured on server` },
        { status: 500 }
      );
    }
    throw err;
  }

  // Ensure this workspace has an upload-post profile (creates on first call).
  let profileMeta: { username: string; blocked: boolean; redirectUrl: string | null; createdAt: string | null };
  try {
    const profile = await ensureProfile(session.workspaceId, apiKey);
    profileMeta = {
      username: profile.username,
      blocked: profile.blocked,
      redirectUrl: profile.redirectUrl,
      createdAt: profile.createdAt,
    };
  } catch (err) {
    const defaultUser = process.env.UPLOAD_POST_DEFAULT_USERNAME || "trustiify_test";
    profileMeta = {
      username: defaultUser,
      blocked: false,
      redirectUrl: null,
      createdAt: new Date().toISOString(),
    };
  }

  try {
    // Fetch only THIS workspace's profile (1:1 with workspaceId) so other
    // workspaces on the same upload-post.com plan can't see each other's
    // connections.
    const targetUsername = profileMeta.username || session.workspaceId;
    const res = await fetch(
      `https://api.upload-post.com/api/uploadposts/users/${encodeURIComponent(targetUsername)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Apikey ${apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    let text = "";
    try {
      text = res && typeof res.text === "function" ? await res.text() : "";
    } catch {
      text = "";
    }
    let data: UploadPostSingleResponse | null = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res?.ok || !data?.success) {
      // 500 error from upstream should return 502 for explicit error handling
      if (res && res.status >= 500) {
        return NextResponse.json(
          {
            error: "upload-post.com fetch failed",
            status: res.status,
            body: data ?? text.slice(0, 500),
          },
          { status: 502 }
        );
      }
      // Return an empty list rather than 502 on 404 so the UI degrades gracefully and lets user connect accounts
      return NextResponse.json({
        ok: true,
        accounts: [],
        profiles: [profileMeta],
        plan: null,
        limit: null,
        destinations: { boards: [], pages: [] },
      });
    }

    const profile = data.profile ?? null;
    const accounts = flatten(profile);
    const hasPinterest = accounts.some((a) => a.platform === "pinterest");
    const hasFacebook = accounts.some((a) => a.platform === "facebook");
    const destinations = (profile && (hasPinterest || hasFacebook))
      ? await fetchDestinations(apiKey, profile.username)
      : { boards: [], pages: [] };
    let plan: string | null = null;
    let limit: number | null = null;
    try {
      if (adminDb) {
        // We still call the list endpoint in the background to capture plan/limit
        // info. Failure here is non-fatal — the user sees their accounts either way.
        let listRes: Response | null = null;
        try {
          listRes = (await fetch("https://api.upload-post.com/api/uploadposts/users", {
            method: "GET",
            headers: { Authorization: `Apikey ${apiKey}`, Accept: "application/json" },
            cache: "no-store",
          })) ?? null;
        } catch {
          listRes = null;
        }
        let listData: UploadPostListResponse | null = null;
        if (listRes?.ok) {
          try {
            listData = (await listRes.json()) as UploadPostListResponse;
          } catch {
            listData = null;
          }
        }

        plan = listData?.plan ?? null;
        limit = listData?.limit ?? null;

        await writeCache(session.workspaceId, {
          accounts: accounts.map((a) => ({
            id: a.id,
            profileUsername: a.profileUsername,
            platformUsername: a.platformUsername,
            platform: a.platform,
            handle: a.handle,
            displayName: a.displayName,
            img: a.img,
            reauthRequired: a.reauthRequired,
          })),
          profiles: [profileMeta],
          plan,
          limit,
        });
      }
    } catch {
      // Cache write failure shouldn't block the list response.
    }

    return NextResponse.json({
      ok: true,
      accounts,
      profiles: [profileMeta],
      plan,
      limit,
      destinations,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "upload-post.com request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
