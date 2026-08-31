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

interface GenerateJwtResponse {
  success?: boolean;
  access_url?: string;
  duration?: number;
  message?: string;
  raw?: string;
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
  ).catch(() => undefined);
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
 */
export async function ensureProfile(
  workspaceId: string,
  apiKey: string
): Promise<UploadPostProfile> {
  // 1. Check our cache first.
  const cached = await readProfile(workspaceId);
  if (cached && cached.username) return cached;

  // 2. Try to create the profile.
  let created: UploadPostProfile | null = null;
  try {
    const res = await callUploadPost(apiKey, {
      method: "POST",
      body: { username: workspaceId },
    });

    if (res && res.ok) {
      const data = (await res.json().catch(() => null)) as CreateUserResponse | null;
      if (data?.success && data.profile) {
        created = {
          username: data.profile.username,
          createdAt: data.profile.created_at ?? new Date().toISOString(),
          blocked: !!data.profile.blocked,
          redirectUrl: data.profile.redirect_url ?? null,
        };
      }
    } else if (res && res.status === 409) {
      created = await fetchProfile(workspaceId, apiKey);
    }
  } catch (err) {
    log.error(err, { step: "createProfile" });
  }

  const profile: UploadPostProfile = created ?? {
    username: workspaceId,
    createdAt: new Date().toISOString(),
    blocked: false,
    redirectUrl: null,
  };

  await writeProfile(workspaceId, profile);
  return profile;
}

async function fetchProfile(username: string, apiKey: string): Promise<UploadPostProfile | null> {
  try {
    const res = await fetch(`${UPLOAD_POST_API_BASE}/${encodeURIComponent(username)}`, {
      method: "GET",
      headers: { Authorization: `Apikey ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res || !res.ok) return null;
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
 * Automatically provisions the profile if missing, with retry.
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

  async function requestJwt(
    username: string
  ): Promise<{ ok: boolean; data: GenerateJwtResponse; status: number }> {
    const body: Record<string, unknown> = {
      username,
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
    let data: GenerateJwtResponse = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return { ok: Boolean(res.ok && data.success && data.access_url), data, status: res.status };
  }

  // Attempt 1: with profile.username
  const firstAttempt = await requestJwt(profile.username);
  if (firstAttempt.ok) {
    const _url1 = firstAttempt.data.access_url; if (!_url1) throw new Error("upload-post generate-jwt missing access_url (attempt 1)");
    return { url: _url1, duration: firstAttempt.data.duration ?? 172800 };
  }

  // Retry only the recoverable "profile not found" case. Retrying auth,
  // validation, or rate-limit failures hides the useful upstream message and
  // can multiply a single button click into several failing API calls.
  if (firstAttempt.status !== 404) {
    throw new Error(firstAttempt.data?.message || `upload-post generate-jwt failed (${firstAttempt.status})`);
  }

  // If 404 or profile not found, ensure remote profile is created on upload-post.com and retry
  try {
    await callUploadPost(apiKey, { method: "POST", body: { username: profile.username } });
  } catch {}
  const secondAttempt = await requestJwt(profile.username);
  if (secondAttempt.ok) {
    const _url2 = secondAttempt.data.access_url; if (!_url2) throw new Error("upload-post generate-jwt missing access_url (attempt 2)");
    return { url: _url2, duration: secondAttempt.data.duration ?? 172800 };
  }

  // Attempt 3: fallback to default username (e.g. trustiify_test)
  const defaultUser = process.env.UPLOAD_POST_DEFAULT_USERNAME || "trustiify_test";
  try {
    await callUploadPost(apiKey, { method: "POST", body: { username: defaultUser } });
  } catch {}
  const thirdAttempt = await requestJwt(defaultUser);
  if (thirdAttempt.ok) {
    const _url3 = thirdAttempt.data.access_url; if (!_url3) throw new Error("upload-post generate-jwt missing access_url (attempt 3)");
    return { url: _url3, duration: thirdAttempt.data.duration ?? 172800 };
  }

  const msg =
    secondAttempt.data?.message ||
    firstAttempt.data?.message ||
    `upload-post generate-jwt failed (${firstAttempt.status})`;
  throw new Error(msg);
}
