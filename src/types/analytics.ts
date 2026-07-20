export interface FunnelStep {
  step: string;
  count: number;
  percent: string;
}

export interface RetentionCohort {
  cohort: string;
  week1: number; // percentage (e.g. 85 for 85%)
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
