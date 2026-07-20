// Strict types for real Upload-Post analytics integration.
// No `any` — every shape is explicit so the dashboard can render honest states.

export type AnalyticsStatus =
  | "ok"
  | "error"
  | "token_expired"
  | "not_connected"
  | "unsupported"
  | "unknown";

export type PlatformKey =
  | "instagram"
  | "tiktok"
  | "linkedin"
  | "facebook"
  | "x"
  | "twitter"
  | "youtube"
  | "threads"
  | "pinterest"
  | "reddit"
  | "bluesky"
  | "discord"
  | "telegram"
  | "google_business";

/** A single day point from a platform timeseries. */
export interface AnalyticsTimeseriesPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

/** Per-platform metric configuration returned by Upload-Post. */
export interface PlatformMetricConfig {
  platform: PlatformKey;
  metricType?: string;
  primaryImpressionsField?: string;
  availableMetrics?: string[];
  metricLabels?: Record<string, string>;
}

/** Normalized, stable shape for one platform's analytics. */
export interface NormalizedPlatformAnalytics {
  platform: PlatformKey;
  status: AnalyticsStatus;
  followers: number | null;
  impressionsPrimary: number | null;
  engagements: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  clicks: number | null;
  reach: number | null;
  views: number | null;
  engagementRate: number | null;
  timeseries: AnalyticsTimeseriesPoint[];
  metricType: string | null;
  primaryImpressionsField: string | null;
  availableMetrics: string[];
  metricLabels: Record<string, string>;
  errorMessage: string | null;
  lastSyncedAt: string | null;
}

/** Unified totals payload from the total-impressions endpoint. */
export interface UnifiedAnalytics {
  status: AnalyticsStatus;
  followers: number | null;
  impressions: number | null;
  reach: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  clicks: number | null;
  engagementRate: number | null;
  postsPublished: number;
  byPlatform: NormalizedPlatformAnalytics[];
  errorMessage: string | null;
  lastSyncedAt: string | null;
}

/** Per-post analytics from Upload-Post. */
export interface PostAnalytics {
  status: AnalyticsStatus;
  requestId: string | null;
  platform: PlatformKey | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  clicks: number | null;
  views: number | null;
  errorMessage: string | null;
}

export interface DateRange {
  from: Date;
  to: Date;
}

// ============================================================
// Admin analytics types (kept for /admin/analytics)
// ============================================================
export interface FunnelStep {
  step: string;
  count: number;
  percent: string;
}

export interface RetentionCohort {
  cohort: string;
  week1: number;
  week2: number;
  week4: number;
  week8: number;
}

export interface AnalyticsOverviewData {
  funnel: FunnelStep[];
  platformBreakdown: { platform: string; count: number }[];
  featureAdoption: { feature: string; count: number }[];
  timeSeries: { date: string; signups: number; posts: number }[];
  retentionCohorts: RetentionCohort[];
  subscriptionStats: { total: number; paid: number; churned30d: number; mrr: number };
}

export interface TopPost {
  postId: string;
  workspaceId: string;
  platform: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagementRate: number;
}

export interface PlatformAnalytics {
  platform: string;
  status: "ok" | "error" | "token_expired" | "not_connected";
  lastSyncedAt: string | null;
  impressions30d: number;
  engagements30d: number;
  followerCount: number;
  followerGrowth30d: number;
  topPosts: TopPost[];
  audienceCountries: { country: string; count: number }[];
}

export interface SocialAnalyticsData {
  platforms: PlatformAnalytics[];
  heroStats: {
    totalImpressions: number;
    totalEngagements: number;
    totalFollowerGrowth: number;
    totalPublishedPosts: number;
    avgEngagementRate: number;
  };
  topPosts: TopPost[];
  geoDistribution: { country: string; count: number; percent: string }[];
  cachedAt: string | null;
}
