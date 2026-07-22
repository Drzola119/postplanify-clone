import "server-only";
import { createLogger } from "@/lib/log";
import type {
  AnalyticsStatus,
  AnalyticsTimeseriesPoint,
  DateRange,
  NormalizedPlatformAnalytics,
  PlatformKey,
  PlatformMetricConfig,
  PostAnalytics,
  UnifiedAnalytics,
} from "@/types/analytics";

const log = createLogger("uploadpost-analytics");

const UPLOAD_POST_BASE = "https://api.upload-post.com/api";

export const SUPPORTED_ANALYTICS_PLATFORMS: PlatformKey[] = [
  "instagram",
  "tiktok",
  "linkedin",
  "facebook",
  "x",
  "twitter",
  "youtube",
  "threads",
  "pinterest",
  "reddit",
  "bluesky",
];

export const UNSUPPORTED_ANALYTICS_PLATFORMS: PlatformKey[] = [
  "discord",
  "telegram",
  "google_business",
];

export function isAnalyticsSupported(platform: string): boolean {
  return SUPPORTED_ANALYTICS_PLATFORMS.includes(platform as PlatformKey);
}

function authHeader(apiKey: string): Record<string, string> {
  return {
    Authorization: `Apikey ${apiKey}`,
    Accept: "application/json",
  };
}

/** Map our internal platform id (twitter) to Upload-Post key (x) when needed. */
function toUploadPostPlatform(platform: PlatformKey): string {
  return platform === "twitter" ? "x" : platform;
}

function toInternalPlatformKey(platform: string): PlatformKey {
  return (platform === "x" ? "twitter" : platform) as PlatformKey;
}

// ============================================================
// Raw response shapes (Upload-Post)
// ============================================================
interface RawProfilePlatform {
  success?: boolean;
  message?: string | null;
  linkedin_personal_unsupported?: boolean;
  followers?: number | null;
  reach?: number | null;
  views?: number | null;
  impressions?: number | null;
  profileViews?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  pin_clicks?: number | null;
  outbound_clicks?: number | null;
  reach_timeseries?: Array<{ date?: string; value?: number }> | Record<string, number> | null;
  metric_type?: string | null;
  primary_impressions_field?: string | null;
  available_metrics?: string[] | null;
  metric_labels?: Record<string, string> | null;
}

interface RawProfileResponse {
  success?: boolean;
  message?: string;
  platforms?: Record<string, RawProfilePlatform | "" | null> | null;
  error?: string | null;
  [platform: string]: unknown;
}

interface RawUnifiedResponse {
  success?: boolean;
  message?: string;
  error?: string | null;
  total_impressions?: number | null;
  per_platform?: Record<string, number> | null;
  per_day?: Record<string, number> | null;
  followers?: number | null;
  impressions?: number | null;
  reach?: number | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  profileViews?: number | null;
  pin_clicks?: number | null;
  outbound_clicks?: number | null;
  breakdown?: Record<string, Record<string, number>> | null;
}

interface RawPostResponse {
  success?: boolean;
  message?: string;
  error?: string | null;
  request_id?: string | null;
  platform?: string | null;
  impressions?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  views?: number | null;
  outbound_clicks?: number | null;
  pin_clicks?: number | null;
}

interface RawPlatformMetricsResponse {
  success?: boolean;
  message?: string;
  platforms?: Record<string, PlatformMetricConfig> | null;
}

// ============================================================
// Networking with honest error classification
// ============================================================
async function fetchUploadPost(
  url: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, {
    method: "GET",
    headers: authHeader(apiKey),
    cache: "no-store",
    signal,
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

/** Resolve status from HTTP status + body for a failed platform. */
function classifyFailure(status: number, body: unknown): AnalyticsStatus {
  if (status === 401 || status === 403) return "token_expired";
  if (status === 404) return "not_connected";
  const msg =
    (body as { message?: string; error?: string })?.message ||
    (body as { message?: string; error?: string })?.error ||
    "";
  if (/token|expired|unauthor/i.test(msg)) return "token_expired";
  if (/not connected|not found|does not exist/i.test(msg)) return "not_connected";
  return "error";
}

function classifyPlatformFailure(raw: RawProfilePlatform): AnalyticsStatus {
  const message = raw.message ?? "";
  if (raw.linkedin_personal_unsupported || /not supported|unsupported|limitation/i.test(message)) {
    return "unsupported";
  }
  if (/token|expired|unauthor/i.test(message)) return "token_expired";
  if (/not connected|not found|does not exist/i.test(message)) return "not_connected";
  return "error";
}

function resolveClicks(platform: PlatformKey, raw: RawProfilePlatform): number | null {
  if (platform === "pinterest") {
    return typeof raw.outbound_clicks === "number"
      ? raw.outbound_clicks
      : typeof raw.pin_clicks === "number"
        ? raw.pin_clicks
        : null;
  }
  return typeof raw.outbound_clicks === "number" ? raw.outbound_clicks : null;
}

// ============================================================
// Normalizer — the heart of correct metric mapping
// ============================================================
export function normalizePlatformAnalytics(
  platformInput: PlatformKey,
  raw: RawProfilePlatform | null,
  config: PlatformMetricConfig | null,
  status: AnalyticsStatus = "ok",
  errorMessage: string | null = null,
  lastSyncedAt: string | null = null,
): NormalizedPlatformAnalytics {
  const metricType = raw?.metric_type ?? config?.metricType ?? null;
  const primaryImpressionsField =
    raw?.primary_impressions_field ?? config?.primaryImpressionsField ?? null;
  const availableMetrics = raw?.available_metrics ?? config?.availableMetrics ?? [];
  const metricLabels = raw?.metric_labels ?? config?.metricLabels ?? {};

  const platform = platformInput;
  const followers = typeof raw?.followers === "number" ? raw.followers : null;

  // Determine the "primary impressions-like" field for this platform.
  let impressionsPrimary: number | null = null;
  if (primaryImpressionsField && primaryImpressionsField in (raw ?? {})) {
    const v = (raw as Record<string, unknown>)[primaryImpressionsField];
    impressionsPrimary = typeof v === "number" ? v : null;
  } else if (metricType === "views") {
    impressionsPrimary = typeof raw?.views === "number" ? raw.views : null;
  } else if (metricType === "reach") {
    impressionsPrimary = typeof raw?.reach === "number" ? raw.reach : null;
  } else {
    impressionsPrimary =
      typeof raw?.impressions === "number"
        ? raw.impressions
        : typeof raw?.views === "number"
          ? raw.views
          : typeof raw?.reach === "number"
            ? raw.reach
            : null;
  }

  const likes = typeof raw?.likes === "number" ? raw.likes : null;
  const comments = typeof raw?.comments === "number" ? raw.comments : null;
  const shares = typeof raw?.shares === "number" ? raw.shares : null;
  const saves = typeof raw?.saves === "number" ? raw.saves : null;
  const reach = typeof raw?.reach === "number" ? raw.reach : null;
  const views = typeof raw?.views === "number" ? raw.views : null;
  const clicks = raw ? resolveClicks(platform, raw) : null;

  const engagements =
    likes !== null || comments !== null || shares !== null || saves !== null
      ? (likes ?? 0) + (comments ?? 0) + (shares ?? 0) + (saves ?? 0)
      : null;

  const engagementRate =
    impressionsPrimary && impressionsPrimary > 0 && engagements !== null
      ? (engagements / impressionsPrimary) * 100
      : null;

  // Upload-Post returns reach_timeseries as an array on the live API and an object in older responses.
  const timeseries: AnalyticsTimeseriesPoint[] = [];
  if (Array.isArray(raw?.reach_timeseries)) {
    for (const point of raw.reach_timeseries) {
      if (typeof point.date === "string" && typeof point.value === "number") {
        timeseries.push({ date: point.date, value: point.value });
      }
    }
  } else if (raw?.reach_timeseries) {
    for (const [date, value] of Object.entries(raw.reach_timeseries)) {
      if (typeof value === "number") timeseries.push({ date, value });
    }
  }
  timeseries.sort((a, b) => a.date.localeCompare(b.date));

  return {
    platform,
    status,
    followers,
    impressionsPrimary,
    engagements,
    likes,
    comments,
    shares,
    saves,
    clicks,
    reach,
    views,
    engagementRate,
    timeseries,
    metricType,
    primaryImpressionsField,
    availableMetrics,
    metricLabels,
    errorMessage,
    lastSyncedAt,
  };
}

// ============================================================
// Public service functions
// ============================================================
export async function getPlatformMetricsConfig(
  apiKey: string,
  signal?: AbortSignal,
): Promise<Record<string, PlatformMetricConfig> | null> {
  try {
    const { status, body } = await fetchUploadPost(
      `${UPLOAD_POST_BASE}/uploadposts/platform-metrics`,
      apiKey,
      signal,
    );
    if (!status.toString().startsWith("2")) return null;
    const parsed = body as RawPlatformMetricsResponse;
    return parsed.platforms ?? null;
  } catch (err) {
    log.warn("platform-metrics fetch failed", { error: String(err) });
    return null;
  }
}

export async function getProfileAnalytics(
  apiKey: string,
  profileUsername: string,
  platforms: PlatformKey[] = SUPPORTED_ANALYTICS_PLATFORMS,
  signal?: AbortSignal,
): Promise<NormalizedPlatformAnalytics[]> {
  const platformQuery = platforms
    .map((p) => toUploadPostPlatform(p))
    .join(",");
  const url = `${UPLOAD_POST_BASE}/analytics/${encodeURIComponent(profileUsername)}?platforms=${platformQuery}`;
  const { status, body } = await fetchUploadPost(url, apiKey, signal);

  const responseRecord =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as RawProfileResponse)
      : ({} as RawProfileResponse);
  const wrappedPlatforms =
    responseRecord.platforms && typeof responseRecord.platforms === "object"
      ? responseRecord.platforms
      : null;
  const platformsMap = wrappedPlatforms ?? responseRecord;

  log.info("getProfileAnalytics response", {
    url,
    status,
    platformKeys: Object.keys(platformsMap),
    rawBody: JSON.stringify(body).slice(0, 500),
  });

  if (!status.toString().startsWith("2")) {
    const failStatus = classifyFailure(status, body);
    const message =
      (body as { message?: string; error?: string })?.message ||
      (body as { message?: string; error?: string })?.error ||
      `Upload-Post returned ${status}`;
    // Return all requested platforms with the failure status so one bad
    // platform never silently becomes zero.
    return platforms.map((p) =>
      normalizePlatformAnalytics(
        p,
        null,
        null,
        failStatus,
        message,
      ),
    );
  }

  const lastSyncedAt = new Date().toISOString();

  return platforms.map((p) => {
    const upKey = toUploadPostPlatform(p);
    const rawEntry = platformsMap[upKey];
    const raw =
      rawEntry && typeof rawEntry === "object" && !Array.isArray(rawEntry)
        ? (rawEntry as RawProfilePlatform)
        : null;
    log.info("platform data", {
      platform: p,
      upKey,
      hasRaw: !!raw,
      rawEntry: JSON.stringify(rawEntry)?.slice(0, 200),
    });
    if (!raw) {
      return normalizePlatformAnalytics(
        p,
        null,
        null,
        "not_connected",
        "No data returned for this platform",
        lastSyncedAt,
      );
    }
    if (raw.success === false) {
      return normalizePlatformAnalytics(
        p,
        null,
        null,
        classifyPlatformFailure(raw),
        raw.message ?? "Upload-Post could not load analytics for this platform",
        lastSyncedAt,
      );
    }
    return normalizePlatformAnalytics(
      p,
      raw,
      null,
      "ok",
      null,
      lastSyncedAt,
    );
  });
}

export async function getUnifiedAnalytics(
  apiKey: string,
  profileUsername: string,
  range: DateRange,
  breakdown = true,
): Promise<UnifiedAnalytics> {
  const from = range.from.toISOString().slice(0, 10);
  const to = range.to.toISOString().slice(0, 10);
  const url = `${UPLOAD_POST_BASE}/uploadposts/total-impressions/${encodeURIComponent(profileUsername)}?start_date=${from}&end_date=${to}&breakdown=${breakdown}`;

  const { status, body } = await fetchUploadPost(url, apiKey);

  if (!status.toString().startsWith("2")) {
    const failStatus = classifyFailure(status, body);
    const message =
      (body as { message?: string; error?: string })?.message ||
      (body as { message?: string; error?: string })?.error ||
      `Upload-Post returned ${status}`;
    return {
      status: failStatus,
      followers: null,
      impressions: null,
      reach: null,
      views: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      clicks: null,
      engagementRate: null,
      postsPublished: 0,
      byPlatform: [],
      errorMessage: message,
      lastSyncedAt: null,
    };
  }

  const parsed = body as RawUnifiedResponse;
  const lastSyncedAt = new Date().toISOString();
  const byPlatform: NormalizedPlatformAnalytics[] = [];

  for (const [upKey, metrics] of Object.entries(parsed.breakdown ?? {})) {
    const platform = toInternalPlatformKey(upKey);
    const raw: RawProfilePlatform = {
      followers: metrics.followers,
      impressions: metrics.impressions,
      reach: metrics.reach,
      views: metrics.views,
      likes: metrics.likes,
      comments: metrics.comments,
      shares: metrics.shares,
      saves: metrics.saves,
      profileViews: metrics.profileViews,
    };
    byPlatform.push(
      normalizePlatformAnalytics(
        platform,
        raw,
        null,
        "ok",
        null,
        lastSyncedAt,
      ),
    );
  }

  if (byPlatform.length === 0) {
    for (const [upKey, impressions] of Object.entries(parsed.per_platform ?? {})) {
      if (typeof impressions !== "number") continue;
      byPlatform.push(
        normalizePlatformAnalytics(
          toInternalPlatformKey(upKey),
          {
            impressions,
            metric_type: "impressions",
            primary_impressions_field: "impressions",
          },
          null,
          "ok",
          null,
          lastSyncedAt,
        ),
      );
    }
  }

  const impressions =
    typeof parsed.total_impressions === "number"
      ? parsed.total_impressions
      : typeof parsed.impressions === "number"
        ? parsed.impressions
        : null;
  const likes = typeof parsed.likes === "number" ? parsed.likes : null;
  const comments = typeof parsed.comments === "number" ? parsed.comments : null;
  const shares = typeof parsed.shares === "number" ? parsed.shares : null;
  const saves = typeof parsed.saves === "number" ? parsed.saves : null;
  const engagements =
    likes !== null || comments !== null || shares !== null || saves !== null
      ? (likes ?? 0) + (comments ?? 0) + (shares ?? 0) + (saves ?? 0)
      : null;
  const engagementRate =
    impressions && impressions > 0 && engagements !== null
      ? (engagements / impressions) * 100
      : null;

  return {
    status: "ok",
    followers: typeof parsed.followers === "number" ? parsed.followers : null,
    impressions,
    reach: typeof parsed.reach === "number" ? parsed.reach : null,
    views: typeof parsed.views === "number" ? parsed.views : null,
    likes,
    comments,
    shares,
    saves,
    clicks:
      typeof parsed.outbound_clicks === "number"
        ? parsed.outbound_clicks
        : typeof parsed.pin_clicks === "number"
          ? parsed.pin_clicks
          : null,
    engagementRate,
    postsPublished: 0,
    byPlatform,
    errorMessage: null,
    lastSyncedAt,
  };
}

export async function getPostAnalyticsByRequestId(
  apiKey: string,
  requestId: string,
  platform?: PlatformKey,
): Promise<PostAnalytics> {
  const url = `${UPLOAD_POST_BASE}/uploadposts/post-analytics/${encodeURIComponent(requestId)}`;
  const { status, body } = await fetchUploadPost(url, apiKey);
  return mapPostAnalytics(status, body, requestId, platform ?? null);
}

export async function getPostAnalyticsByPlatformPostId(
  apiKey: string,
  platformPostId: string,
  platform: PlatformKey,
  profileUsername: string,
): Promise<PostAnalytics> {
  const upKey = toUploadPostPlatform(platform);
  const url = `${UPLOAD_POST_BASE}/uploadposts/post-analytics?platform_post_id=${encodeURIComponent(platformPostId)}&platform=${upKey}&user=${encodeURIComponent(profileUsername)}`;
  const { status, body } = await fetchUploadPost(url, apiKey);
  return mapPostAnalytics(status, body, null, platform);
}

function mapPostAnalytics(
  status: number,
  body: unknown,
  requestId: string | null,
  platform: PlatformKey | null,
): PostAnalytics {
  if (!status.toString().startsWith("2")) {
    return {
      status: classifyFailure(status, body),
      requestId,
      platform,
      impressions: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      clicks: null,
      views: null,
      errorMessage:
        (body as { message?: string; error?: string })?.message ||
        (body as { message?: string; error?: string })?.error ||
        `Upload-Post returned ${status}`,
    };
  }
  const parsed = body as RawPostResponse;
  return {
    status: "ok",
    requestId: parsed.request_id ?? requestId,
    platform: (parsed.platform ? toInternalPlatformKey(parsed.platform) : platform) as PlatformKey,
    impressions: typeof parsed.impressions === "number" ? parsed.impressions : null,
    likes: typeof parsed.likes === "number" ? parsed.likes : null,
    comments: typeof parsed.comments === "number" ? parsed.comments : null,
    shares: typeof parsed.shares === "number" ? parsed.shares : null,
    saves: typeof parsed.saves === "number" ? parsed.saves : null,
    clicks:
      typeof parsed.outbound_clicks === "number"
        ? parsed.outbound_clicks
        : typeof parsed.pin_clicks === "number"
          ? parsed.pin_clicks
          : null,
    views: typeof parsed.views === "number" ? parsed.views : null,
    errorMessage: null,
  };
}
