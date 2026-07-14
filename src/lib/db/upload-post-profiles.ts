import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { createLogger } from "@/lib/log";

const log = createLogger("upload-post-profiles");

const UPLOAD_POST_API_BASE = "https://api.upload-post.com/api/uploadposts/users";
const SETTINGS_KEY = "uploadPostProfile";

export interface UploadPostProfile {
  /** Profile username on upload-post.com. We use the workspaceId as the username. */
  username: string;
  createdAt: string;
  /** Whether the profile is blocked at upload-post.com. */
  blocked: boolean;
  /** Optional redirect URL configured on the profile. */
  redirectUrl: string | null;
}

export interface JwtUrlResponse {
  /** Hosted page URL where the user links their social accounts. Open in new tab. */
  url: string;
  /** JWT validity in seconds (typically 172800 = 48h). */
  duration: number;
}

function workspaceRef(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.doc(`workspaces/${workspaceId}`);
}

/** Read the cached profile for this workspace, if any. */
export async function readProfile(workspaceId: string): Promise<UploadPostProfile | null> {
  if (!adminDb) return null;
  const snap = await workspaceRef(workspaceId).get().catch(() => null);
  if (!snap?.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  const settings = (data.settings ?? {}) as Record<string, unknown>;
  const raw = settings[SETTINGS_KEY] as UploadPostProfile | undefined;
  return raw ?? null;
}

async function writeProfile(workspaceId: string, profile: UploadPostProfile): Promise<void> {
  if (!adminDb) return;
  await workspaceRef(workspaceId).set(
    {
      settings: { [SETTINGS_KEY]: profile },
      updatedAt: new Date(),
    },
    { merge: true }
  );
}

interface CreateUserResponse {
  success: boolean;
  profile?: {
    username: string;
    created_at?: string;
    redirect_url?: string;
    blocked?: boolean;
  };
  message?: string;
}

interface SingleUserResponse {
  success: boolean;
  profile?: {
    username: string;
    created_at?: string;
    redirect_url?: string;
    blocked?: boolean;
  };
  message?: string;
}

async function callUploadPost(
  apiKey: string,
  init: { method: string; body?: unknown }
): Promise<Response> {
  return fetch(UPLOAD_POST_API_BASE, {
    method: init.method,
    headers: {
      Authorization: `Apikey ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
}

/**
 * Ensure an upload-post.com profile exists for this workspace.
 *
 * Profiles are 1:1 with Trustiify workspaces, so each workspace's connections
 * are isolated from other workspaces on the same upload-post.com plan.
 *
 * If a profile already exists at upload-post.com but we don't have it cached
 * (e.g. after a fresh deploy or workspace restore), we re-discover it via the
 * GET /users/{username} endpoint and cache the result.
 */
export async function ensureProfile(
  workspaceId: string,
  apiKey: string
): Promise<UploadPostProfile> {
  // 1. Check our cache first.
  const cached = await readProfile(workspaceId);
  if (cached) return cached;

  // 2. Try to create the profile. If a 409 conflict happens, the profile
  //    already exists at upload-post.com — fetch it instead.
  let created: UploadPostProfile | null = null;
  try {
    const res = await callUploadPost(apiKey, {
      method: "POST",
      body: { username: workspaceId },
    });

    if (res.ok) {
      const data = (await res.json().catch(() => null)) as CreateUserResponse | null;
      if (data?.success && data.profile) {
        created = {
          username: data.profile.username,
          createdAt: data.profile.created_at ?? new Date().toISOString(),
          blocked: !!data.profile.blocked,
          redirectUrl: data.profile.redirect_url ?? null,
        };
      }
    } else if (res.status === 409) {
      // Profile already exists — fetch it.
      created = await fetchProfile(workspaceId, apiKey);
    } else {
      const text = await res.text().catch(() => "");
      log.warn("upload-post create profile failed", { status: res.status, body: text.slice(0, 200) });
    }
  } catch (err) {
    log.error(err, { step: "createProfile" });
  }

  if (!created) {
    // Last-resort fallback: synthesize a profile locally. The hosted connect
    // page may still work — upload-post.com will lazy-create on first use.
    created = {
      username: workspaceId,
      createdAt: new Date().toISOString(),
      blocked: false,
      redirectUrl: null,
    };
  }

  await writeProfile(workspaceId, created);
  return created;
}

async function fetchProfile(workspaceId: string, apiKey: string): Promise<UploadPostProfile | null> {
  try {
    const res = await fetch(`${UPLOAD_POST_API_BASE}/${encodeURIComponent(workspaceId)}`, {
      method: "GET",
      headers: { Authorization: `Apikey ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as SingleUserResponse | null;
    if (!data?.success || !data.profile) return null;
    return {
      username: data.profile.username,
      createdAt: data.profile.created_at ?? new Date().toISOString(),
      blocked: !!data.profile.blocked,
      redirectUrl: data.profile.redirect_url ?? null,
    };
  } catch (err) {
    log.error(err, { step: "fetchProfile" });
    return null;
  }
}

/**
 * Generate a hosted connect-page URL for the given workspace's profile.
 * The returned URL is a JWT-protected page (48h validity) where the user
 * links social accounts scoped to this workspace's upload-post profile.
 */
export async function generateConnectUrl(
  workspaceId: string,
  apiKey: string,
  options: {
    redirectUrl: string;
    platforms?: string[];
    logoImage?: string;
    connectTitle?: string;
    connectDescription?: string;
    redirectButtonText?: string;
    hidePlatformSelector?: boolean;
    customColor?: string;
  }
): Promise<JwtUrlResponse> {
  const profile = await ensureProfile(workspaceId, apiKey);

  const body: Record<string, unknown> = {
    username: profile.username,
    redirect_url: options.redirectUrl,
    show_calendar: false,
    language: "en",
  };
  if (options.platforms?.length) body.platforms = options.platforms;
  if (options.logoImage) body.logo_image = options.logoImage;
  if (options.connectTitle) body.connect_title = options.connectTitle;
  if (options.connectDescription) body.connect_description = options.connectDescription;
  if (options.redirectButtonText) body.redirect_button_text = options.redirectButtonText;
  if (options.hidePlatformSelector !== undefined) {
    body.hide_platform_selector = options.hidePlatformSelector;
  }
  if (options.customColor) body.custom_color = options.customColor;

  const res = await fetch(`${UPLOAD_POST_API_BASE}/generate-jwt`, {
    method: "POST",
    headers: {
      Authorization: `Apikey ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let data: { success?: boolean; access_url?: string; duration?: number; message?: string } | null = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!res.ok || !data?.success || !data.access_url) {
    const msg = data?.message || text.slice(0, 200) || `upload-post generate-jwt failed (${res.status})`;
    throw new Error(msg);
  }

  return { url: data.access_url, duration: data.duration ?? 172800 };
}