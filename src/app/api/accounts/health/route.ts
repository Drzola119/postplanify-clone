import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/db";
import {
  deriveHealth,
  readCache,
  writeCache,
  type CachedAccount,
} from "@/lib/db/account-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_PLATFORMS = [
  "tiktok",
  "facebook",
  "x",
  "bluesky",
  "instagram",
  "youtube",
  "threads",
  "pinterest",
  "linkedin",
] as const;

interface UploadPostAccount {
  display_name?: string;
  handle?: string;
  social_images?: string;
  reauth_required?: boolean;
}

interface UploadPostProfile {
  username: string;
  social_accounts: Partial<Record<(typeof SUPPORTED_PLATFORMS)[number], UploadPostAccount | "">>;
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

async function fetchLiveAccounts(apiKey: string): Promise<CachedAccount[] | null> {
  try {
    const res = await fetch("https://api.upload-post.com/api/uploadposts/users", {
      method: "GET",
      headers: { Authorization: `Apikey ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    const data = JSON.parse(text) as UploadPostResponse;
    if (!data.success) return null;
    const out: CachedAccount[] = [];
    for (const p of data.profiles) {
      for (const key of SUPPORTED_PLATFORMS) {
        const acct = p.social_accounts?.[key];
        if (!acct || typeof acct === "string") continue;
        const a = acct as UploadPostAccount;
        if (!a.handle) continue;
        out.push({
          id: `${p.username}:${key}`,
          profileUsername: p.username,
          platform: key,
          handle: a.handle,
          displayName: a.display_name ?? null,
          img: a.social_images || null,
          reauthRequired: !!a.reauth_required,
        });
      }
    }
    return out;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Try to refresh from upload-post.com if the env var is configured; otherwise fall back to cache.
  const apiKey = process.env.UPLOAD_POST_API_KEY;
  if (apiKey) {
    const live = await fetchLiveAccounts(apiKey);
    if (live) {
      const cached = await readCache(session.workspaceId);
      await writeCache(session.workspaceId, {
        accounts: live,
        profiles: cached?.profiles ?? [],
        plan: cached?.plan ?? null,
        limit: cached?.limit ?? null,
      });
    }
  }

  const snapshot = await readCache(session.workspaceId);
  const health = deriveHealth(snapshot);
  return NextResponse.json({ health });
}