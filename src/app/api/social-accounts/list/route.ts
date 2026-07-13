import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";

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
  | "reddit";

interface UploadPostAccount {
  display_name?: string;
  handle?: string;
  social_images?: string;
  reauth_required?: boolean;
}

interface UploadPostProfile {
  username: string;
  social_accounts: Partial<Record<PlatformKey, UploadPostAccount | "">>;
  created_at?: string;
  redirect_url?: string;
  blocked?: boolean;
}

interface UploadPostResponse {
  success: boolean;
  profiles: UploadPostProfile[];
  limit?: number;
  plan?: string;
}

export interface ConnectedAccountDTO {
  /** Unique id combining profile + platform. */
  id: string;
  profileUsername: string;
  platform: PlatformKey;
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
];

function flatten(profiles: UploadPostProfile[]): ConnectedAccountDTO[] {
  const out: ConnectedAccountDTO[] = [];
  for (const profile of profiles) {
    if (!profile.social_accounts) continue;
    for (const key of SUPPORTED) {
      const acct = profile.social_accounts[key];
      // Empty string means "not connected" — skip.
      if (!acct || typeof acct === "string" || (acct as UploadPostAccount).handle === undefined) {
        continue;
      }
      const a = acct as UploadPostAccount;
      if (!a.handle) continue;
      out.push({
        id: `${profile.username}:${key}`,
        profileUsername: profile.username,
        platform: key,
        handle: a.handle,
        displayName: a.display_name ?? null,
        img: a.social_images || null,
        reauthRequired: !!a.reauth_required,
      });
    }
  }
  return out;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  try {
    const res = await fetch("https://api.upload-post.com/api/uploadposts/users", {
      method: "GET",
      headers: {
        Authorization: `Apikey ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();
    let data: UploadPostResponse | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!res.ok || !data?.success) {
      return NextResponse.json(
        {
          error: "upload-post.com fetch failed",
          status: res.status,
          body: data ?? text.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const accounts = flatten(data.profiles);
    const profiles = data.profiles.map((p) => ({
      username: p.username,
      redirectUrl: p.redirect_url ?? null,
      blocked: !!p.blocked,
      createdAt: p.created_at ?? null,
    }));

    return NextResponse.json({
      ok: true,
      accounts,
      profiles,
      plan: data.plan ?? null,
      limit: data.limit ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "upload-post.com request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}