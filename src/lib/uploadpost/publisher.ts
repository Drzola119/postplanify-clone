import "server-only";
import { randomUUID } from "crypto";

const API_BASE = "https://api.upload-post.com/api";
const DEFAULT_TIMEOUT_MS = 70_000;

export type UploadPostPlatformResult = {
  ok: boolean;
  error?: string;
  postId?: string;
  url?: string;
};

export interface UploadPostPublishInput {
  apiKey: string;
  username: string;
  platforms: string[];
  caption: string;
  captionsByPlatform?: Record<string, string>;
  mediaUrls: string[];
  mediaType?: string;
  scheduledAt?: string | null;
  advancedByPlatform?: Record<string, Record<string, unknown>>;
  firstComment?: string;
  firstCommentByPlatform?: Record<string, string>;
  document?: { url: string; title: string; mimeType: string };
  frameCoverUrl?: string;
  customCoverUrl?: string;
  requestId?: string;
  externalId?: string;
  timeoutMs?: number;
}

export interface UploadPostPublishResult {
  accepted: boolean;
  deliveryConfirmed: boolean;
  scheduled: boolean;
  requestId?: string;
  jobId?: string;
  results?: Record<string, UploadPostPlatformResult>;
  raw: unknown;
  httpStatus: number;
}

export interface UploadPostStatusResult {
  status: string;
  final: boolean;
  requestId?: string;
  jobId?: string;
  results?: Record<string, UploadPostPlatformResult>;
  raw: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function toUploadPostPlatform(platform: string): string {
  return platform === "twitter" ? "x" : platform;
}

function errorMessage(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value;
  if (!isRecord(value)) return fallback;
  for (const key of ["error", "error_message", "message", "detail", "reason", "msg", "description", "failureReason"]) {
    const val = value[key];
    if (typeof val === "string" && val.trim()) return val;
    if (isRecord(val)) {
      const nested = errorMessage(val, "");
      if (nested) return nested;
    }
  }
  return fallback;
}

function stringField(value: unknown, keys: string[]): string | undefined {
  if (!isRecord(value)) return undefined;
  for (const key of keys) {
    if (typeof value[key] === "string" && value[key]) return value[key];
  }
  return undefined;
}

/** Statuses that UploadPost uses to signal the post was accepted / will be delivered. */
const OK_STATUSES = new Set([
  "ok", "success", "published", "delivered", "publish_success", "completed",
  "queued", "processing", "accepted", "scheduled",
]);

function normalizeOneResult(raw: unknown): UploadPostPlatformResult {
  if (!isRecord(raw)) return { ok: false, error: "Invalid platform result" };
  const status = typeof raw.status === "string" ? raw.status.toLowerCase() : "";
  const skipped = raw.skipped === true;
  const ok = !skipped && (
    raw.success === true ||
    raw.ok === true ||
    OK_STATUSES.has(status)
  );
  const result: UploadPostPlatformResult = { ok };
  const postId = stringField(raw, ["post_id", "platform_post_id", "publish_id", "id", "container_id"]);
  const url = stringField(raw, ["url", "post_url"]);
  if (postId) result.postId = postId;
  if (url) result.url = url;
  if (!ok) result.error = skipped
    ? errorMessage(raw, "Platform is not connected to this UploadPost profile")
    : errorMessage(raw, "UploadPost did not confirm delivery");
  return result;
}

/**
 * Try to find the per-platform results map inside the UploadPost response.
 * The API uses several different shapes depending on the endpoint/version:
 *   - { results: [...] }           array of { platform, status, ... }
 *   - { results: { ig: {...} } }   object keyed by platform
 *   - { data: { results: ... } }   nested wrapper
 *   - { response: { results: ... } }
 *   - { platforms: { ... } }       alternative key
 *   - { bluesky: {...}, ... }      top-level platform keys
 */
function findResultsPayload(raw: unknown): unknown {
  if (!isRecord(raw)) return undefined;
  // Direct results key
  if (raw.results != null) return raw.results;
  // Nested wrappers
  for (const wrapper of ["data", "response"]) {
    const inner = raw[wrapper];
    if (isRecord(inner) && inner.results != null) return inner.results;
  }
  // Alternative key
  if (raw.platforms != null) return raw.platforms;
  return undefined;
}

/** Known UploadPost platform keys so we can detect top-level platform results. */
const KNOWN_PLATFORMS = new Set([
  "tiktok", "facebook", "x", "twitter", "bluesky", "instagram", "youtube",
  "threads", "pinterest", "linkedin", "google_business", "reddit",
  "discord", "telegram",
]);

export function normalizeUploadPostResults(
  raw: unknown,
  requestedPlatforms: string[],
): Record<string, UploadPostPlatformResult> | undefined {
  const normalized: Record<string, UploadPostPlatformResult> = {};

  const resultsPayload = findResultsPayload(raw);
  if (resultsPayload != null) {
    if (Array.isArray(resultsPayload)) {
      for (const item of resultsPayload) {
        if (!isRecord(item) || typeof item.platform !== "string") continue;
        const uiPlatform = item.platform === "x" ? "twitter" : item.platform;
        normalized[uiPlatform] = normalizeOneResult(item);
      }
    } else if (isRecord(resultsPayload)) {
      for (const [platform, result] of Object.entries(resultsPayload)) {
        normalized[platform === "x" ? "twitter" : platform] = normalizeOneResult(result);
      }
    }
  }

  // Fallback: check for top-level platform keys (e.g. { bluesky: { status: "success" } })
  if (Object.keys(normalized).length === 0 && isRecord(raw)) {
    for (const [key, value] of Object.entries(raw)) {
      const uiKey = key === "x" ? "twitter" : key;
      if (KNOWN_PLATFORMS.has(key) && isRecord(value)) {
        normalized[uiKey] = normalizeOneResult(value);
      }
    }
  }

  if (Object.keys(normalized).length === 0) return undefined;
  for (const platform of requestedPlatforms) {
    if (!normalized[platform]) normalized[platform] = { ok: false, error: "No result returned for this platform" };
  }
  return normalized;
}

const ADVANCED_FIELD_MAP: Record<string, string> = {
  instagram_media_type: "media_type",
  instagram_cover_url: "cover_url",
  instagram_thumbnail_offset_ms: "cover_timestamp",
  instagram_share_mode: "share_mode",
  instagram_trial_reels_enabled: "trial_reels",
  instagram_trial_reels_audience: "trial_audience",
  tiktok_post_mode: "post_mode",
  tiktok_privacy_level: "privacy_level",
  tiktok_auto_add_music: "auto_add_music",
  tiktok_disable_comment: "disable_comment",
  tiktok_disable_duet: "disable_duet",
  tiktok_disable_stitch: "disable_stitch",
  tiktok_ai_generated_content: "is_aigc",
  youtube_privacy: "privacyStatus",
  youtube_category_id: "categoryId",
  youtube_made_for_kids: "madeForKids",
  youtube_synthetic_media: "containsSyntheticMedia",
  youtube_thumbnail_url: "thumbnail_url",
  linkedin_page_id: "target_linkedin_page_id",
};

function normalizeMediaTypeField(key: string, value: unknown, endpoint: string): unknown {
  if (typeof value !== "string") return value;
  const mediaType = value.toUpperCase();
  const isPhoto = endpoint.endsWith("/upload_photos");
  const isVideo = endpoint.endsWith("/upload");

  // The composer uses the human-facing FEED value. UploadPost deliberately
  // uses different API enums for Instagram and Facebook and rejects FEED.
  if (key === "instagram_media_type") {
    if (isPhoto) return mediaType === "STORIES" ? "STORIES" : "IMAGE";
    if (isVideo) return mediaType === "STORIES" ? "STORIES" : "REELS";
  }
  if (key === "facebook_media_type") {
    if (isPhoto) return mediaType === "STORIES" ? "STORIES" : "POSTS";
    if (isVideo) return mediaType === "FEED" ? "VIDEO" : mediaType;
  }
  return value;
}

function appendValue(form: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null || value === "") return;
  if (Array.isArray(value)) {
    for (const item of value) form.append(key.endsWith("[]") ? key : `${key}[]`, String(item));
  } else if (typeof value === "boolean") {
    form.append(key, value ? "true" : "false");
  } else if (["string", "number"].includes(typeof value)) {
    form.append(key, String(value));
  }
}

function endpointAndMedia(input: UploadPostPublishInput): { endpoint: string; mediaField?: string; mediaValues: string[] } {
  if (input.document) return { endpoint: `${API_BASE}/upload_document`, mediaField: "document", mediaValues: [input.document.url] };
  if (input.mediaUrls.length === 0) return { endpoint: `${API_BASE}/upload_text`, mediaValues: [] };
  if (input.mediaType === "video" || input.mediaType === "trial_reel") {
    return { endpoint: `${API_BASE}/upload`, mediaField: "video", mediaValues: [input.mediaUrls[0]] };
  }
  return { endpoint: `${API_BASE}/upload_photos`, mediaField: "photos[]", mediaValues: input.mediaUrls };
}

function truncateText(value: string, maxCharacters: number): string {
  const characters = Array.from(value);
  if (characters.length <= maxCharacters) return value;
  if (maxCharacters <= 1) return characters.slice(0, maxCharacters).join("");
  return `${characters.slice(0, maxCharacters - 1).join("").trimEnd()}…`;
}

function platformTitle(platform: string, caption: string, endpoint: string): string {
  // Always provide the platform override so a long shared caption does not
  // fall back to the global title and reject the entire multi-platform job.
  const photoPost = endpoint.endsWith("/upload_photos");
  const limits: Record<string, number | undefined> = {
    tiktok: photoPost ? 90 : undefined,
    pinterest: 100,
    youtube: 100,
    reddit: 300,
    linkedin: 400,
    bluesky: 300,
    threads: 500,
    instagram: 2200,
    discord: 2000,
    telegram: photoPost ? 1024 : undefined,
  };
  return limits[platform] ? truncateText(caption, limits[platform]) : caption;
}

function platformDescription(platform: string, caption: string, endpoint: string): string {
  const photoPost = endpoint.endsWith("/upload_photos");
  const limits: Record<string, number | undefined> = {
    tiktok: photoPost ? 4000 : undefined,
    pinterest: 500,
    linkedin: 3000,
    facebook: 63_206,
    youtube: 5000,
    reddit: 5000,
  };
  return limits[platform] ? truncateText(caption, limits[platform]) : caption;
}

function fallbackTitle(input: UploadPostPublishInput, endpoint: string): string {
  const titles = input.platforms.map((platform) => {
    const uploadPlatform = toUploadPostPlatform(platform);
    const caption = input.captionsByPlatform?.[platform] || input.caption;
    return platformTitle(uploadPlatform, caption, endpoint);
  });
  return titles.reduce((shortest, title) =>
    Array.from(title).length < Array.from(shortest).length ? title : shortest,
  input.caption);
}

export async function publishToUploadPost(input: UploadPostPublishInput): Promise<UploadPostPublishResult> {
  if (!input.apiKey.trim()) throw new Error("UPLOAD_POST_API_KEY is empty");
  if (!input.username.trim()) throw new Error("UploadPost profile username is empty");
  if (input.platforms.length === 0) throw new Error("At least one platform is required");

  const requestId = input.requestId || randomUUID();
  const { endpoint, mediaField, mediaValues } = endpointAndMedia(input);
  const form = new FormData();
  form.append("user", input.username);
  form.append("title", input.document?.title || fallbackTitle(input, endpoint));
  if (input.document || mediaValues.length > 0) form.append("description", input.caption);
  for (const platform of input.platforms) form.append("platform[]", toUploadPostPlatform(platform));
  if (mediaField) for (const url of mediaValues) form.append(mediaField, url);
  form.append("request_id", requestId);
  form.append("external_id", input.externalId || requestId);
  form.append("async_upload", "false");
  if (input.scheduledAt) form.append("scheduled_date", input.scheduledAt);

  const sharedFirstComment = input.firstComment || input.firstCommentByPlatform?.__all;
  if (sharedFirstComment) form.append("first_comment", sharedFirstComment);
  if (input.customCoverUrl || input.frameCoverUrl) form.append("cover_url", input.customCoverUrl || input.frameCoverUrl!);

  for (const platform of input.platforms) {
    const uploadPlatform = toUploadPostPlatform(platform);
    const platformCaption = input.captionsByPlatform?.[platform] || input.caption;
    form.append(`${uploadPlatform}_title`, platformTitle(uploadPlatform, platformCaption, endpoint));
    if (["tiktok", "pinterest", "linkedin", "facebook", "youtube", "reddit"].includes(uploadPlatform)) {
      form.append(`${uploadPlatform}_description`, platformDescription(uploadPlatform, platformCaption, endpoint));
    }
    const platformComment = input.firstCommentByPlatform?.[platform];
    if (platformComment && platformComment !== sharedFirstComment) form.append(`${uploadPlatform}_first_comment`, platformComment);
    for (const [key, value] of Object.entries(input.advancedByPlatform?.[platform] || {})) {
      appendValue(form, ADVANCED_FIELD_MAP[key] || key, normalizeMediaTypeField(key, value, endpoint));
    }
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Apikey ${input.apiKey}`,
      "Idempotency-Key": requestId,
      "X-Request-Id": requestId,
      "X-External-Id": input.externalId || requestId,
    },
    body: form,
    signal: AbortSignal.timeout(input.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });
  const text = await response.text();
  let raw: unknown = text;
  try { raw = text ? JSON.parse(text) : {}; } catch { raw = { raw: text }; }

  if (!response.ok || (isRecord(raw) && (raw.success === false || raw.ok === false))) {
    throw new Error(`UploadPost ${response.status}: ${errorMessage(raw, "Publish request failed")}`);
  }

  const results = normalizeUploadPostResults(raw, input.platforms);
  const deliveryConfirmed = Boolean(results && input.platforms.every((platform) => results[platform]?.ok === true));
  const returnedRequestId = stringField(raw, ["request_id"]) || requestId;
  const jobId = stringField(raw, ["job_id"]);
  // A job_id is just a tracking identifier — it does NOT mean the post was
  // scheduled for later delivery. Only honour the caller's explicit
  // scheduledAt to avoid marking immediate posts as "scheduled".
  const isScheduled = Boolean(input.scheduledAt);

  return {
    accepted: true,
    deliveryConfirmed,
    scheduled: isScheduled,
    requestId: returnedRequestId,
    jobId,
    results,
    raw,
    httpStatus: response.status,
  };
}

export async function getUploadPostStatus(input: {
  apiKey: string;
  requestId?: string;
  jobId?: string;
  platforms: string[];
}): Promise<UploadPostStatusResult> {
  if (!input.requestId && !input.jobId) throw new Error("UploadPost request_id or job_id is required");
  const query = input.requestId
    ? `request_id=${encodeURIComponent(input.requestId)}`
    : `job_id=${encodeURIComponent(input.jobId!)}`;
  const response = await fetch(`${API_BASE}/uploadposts/status?${query}`, {
    headers: { Authorization: `Apikey ${input.apiKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  let raw: unknown = text;
  try { raw = text ? JSON.parse(text) : {}; } catch { raw = { raw: text }; }
  if (!response.ok) throw new Error(`UploadPost status ${response.status}: ${errorMessage(raw, "Status request failed")}`);
  const status = isRecord(raw) && typeof raw.status === "string" ? raw.status.toLowerCase() : "unknown";
  const results = normalizeUploadPostResults(raw, input.platforms);
  const isFinal =
    ["completed", "failed", "success", "published", "delivered", "done", "error"].includes(status) ||
    (results != null &&
      Object.keys(results).length === input.platforms.length &&
      Object.values(results).every((r) => r.ok || Boolean(r.error)));
  return {
    status,
    final: isFinal,
    requestId: stringField(raw, ["request_id"]) || input.requestId,
    jobId: stringField(raw, ["job_id"]) || input.jobId,
    results,
    raw,
  };
}
