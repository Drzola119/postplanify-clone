import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { resolvers } from "@/lib/security/server-config";
import { readCache } from "@/lib/db/account-health";
import { readProfile } from "@/lib/db/upload-post-profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://api.upload-post.com/api";

async function up(url: string, apiKey: string) {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Apikey ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    const text = await res.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, ok: res.ok, body };
  } catch (e) {
    return { status: 0, ok: false, body: String(e) };
  }
}

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  let apiKey: string;
  try { apiKey = resolvers.uploadPostApiKey(request.headers); }
  catch { return NextResponse.json({ error: "UPLOAD_POST_API_KEY missing" }, { status: 500 }); }

  const [cache, profile] = await Promise.all([
    readCache(session.workspaceId).catch(() => null),
    readProfile(session.workspaceId).catch(() => null),
  ]);

  const profileUsernameFromCache = cache?.profiles?.[0]?.username ?? null;
  const profileUsernameFromProfile = profile?.username ?? null;
  const profileUsername = profileUsernameFromCache ?? profileUsernameFromProfile ?? session.workspaceId;

  // Platforms from cached accounts
  const platforms = (cache?.accounts ?? []).map((a) => a.platform).join(",") || "tiktok,instagram";

  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);

  const [analyticsRes, unifiedRes, userRes] = await Promise.all([
    up(`${BASE}/analytics/${encodeURIComponent(profileUsername)}?platforms=${platforms}`, apiKey),
    up(`${BASE}/uploadposts/total-impressions/${encodeURIComponent(profileUsername)}?start_date=${from}&end_date=${to}&breakdown=true`, apiKey),
    up(`${BASE}/uploadposts/users/${encodeURIComponent(profileUsername)}`, apiKey),
  ]);

  return NextResponse.json({
    workspaceId: session.workspaceId,
    profileUsername,
    profileUsernameFromCache,
    profileUsernameFromProfile,
    cachedAccounts: cache?.accounts ?? [],
    platformsQueried: platforms,
    analytics: analyticsRes,
    unified: unifiedRes,
    userProfile: userRes,
  });
}
