import "server-only";
import { adminDb } from "@/lib/db";
import type { AnalyticsDailyPlatformDoc, PlatformId } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

export interface AnalyticsOverview {
  workspaceId: string;
  from: string;
  to: string;
  totals: {
    followers: number;
    engagementRate: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    postsPublished: number;
  };
  byPlatform: Array<{
    platform: PlatformId;
    followers: number;
    impressions: number;
    engagementRate: number;
  }>;
}

export async function getOverview(
  workspaceId: string,
  from: Date,
  to: Date
): Promise<AnalyticsOverview> {
  const days = enumerateDays(from, to);
  const platforms: PlatformId[] = [
    "bluesky",
    "instagram",
    "tiktok",
    "youtube",
    "pinterest",
    "twitter",
    "linkedin",
    "threads",
    "facebook",
  ];

  const byPlatform = await Promise.all(
    platforms.map(async (p) => {
      const series = await getPlatformSeries(workspaceId, p, from, to);
      const followersLatest = series.length > 0 ? series[series.length - 1].followers : 0;
      const impressions = series.reduce((acc, x) => acc + x.impressions, 0);
      const likes = series.reduce((acc, x) => acc + x.likes, 0);
      const comments = series.reduce((acc, x) => acc + x.comments, 0);
      const shares = series.reduce((acc, x) => acc + x.shares, 0);
      const clicks = series.reduce((acc, x) => acc + x.clicks, 0);
      const engagementRate =
        series.length > 0
          ? series.reduce((acc, x) => acc + x.engagementRate, 0) / series.length
          : 0;
      return {
        platform: p,
        followers: followersLatest,
        impressions,
        likes,
        comments,
        shares,
        clicks,
        engagementRate,
      };
    })
  );

  const totals = byPlatform.reduce(
    (acc, p) => ({
      followers: acc.followers + p.followers,
      engagementRate: acc.engagementRate + p.engagementRate,
      impressions: acc.impressions + p.impressions,
      likes: acc.likes + p.likes,
      comments: acc.comments + p.comments,
      shares: acc.shares + p.shares,
      clicks: acc.clicks + p.clicks,
      postsPublished: acc.postsPublished,
    }),
    {
      followers: 0,
      engagementRate: 0,
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      postsPublished: 0,
    }
  );
  totals.engagementRate = byPlatform.length > 0 ? totals.engagementRate / byPlatform.length : 0;

  // postsPublished: count posts in range with status=published
  if (adminDb) {
    const posts = await adminDb
      .collection(`workspaces/${workspaceId}/posts`)
      .where("status", "==", "published")
      .where("publishedAt", ">=", from)
      .where("publishedAt", "<=", to)
      .get();
    totals.postsPublished = posts.size;
  }

  void days;
  return {
    workspaceId,
    from: from.toISOString(),
    to: to.toISOString(),
    totals,
    byPlatform,
  };
}

export interface PlatformSeriesPoint {
  date: string;
  followers: number;
  engagementRate: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

export async function getPlatformSeries(
  workspaceId: string,
  platform: PlatformId,
  from: Date,
  to: Date
): Promise<PlatformSeriesPoint[]> {
  if (!adminDb) return [];
  const db = adminDb;
  const dates = enumerateDays(from, to);
  const docs = await Promise.all(
    dates.map(async (d) => {
      const key = isoDateKey(d);
      const ref = db
        .collection(`workspaces/${workspaceId}/analyticsDaily`)
        .doc(key)
        .collection("platforms")
        .doc(platform);
      const snap = await ref.get();
      if (!snap.exists) return null;
      const data = snap.data() as AnalyticsDailyPlatformDoc;
      return {
        date: key,
        followers: data.followers ?? 0,
        engagementRate: data.engagementRate ?? 0,
        impressions: data.impressions ?? 0,
        likes: data.likes ?? 0,
        comments: data.comments ?? 0,
        shares: data.shares ?? 0,
        clicks: data.clicks ?? 0,
      };
    })
  );
  return docs.filter((d): d is PlatformSeriesPoint => d !== null);
}

export interface PostMetrics {
  postId: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
}

export interface AccountAnalytics {
  accountId: string;
  platform: PlatformId;
  from: string;
  to: string;
  totals: {
    followers: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    engagementRate: number;
    postsPublished: number;
  };
  series: PlatformSeriesPoint[];
}

export async function getPostMetrics(
  workspaceId: string,
  postId: string
): Promise<PostMetrics | null> {
  if (!adminDb) return null;
  const ref = adminDb
    .collection(`workspaces/${workspaceId}/posts`)
    .doc(postId)
    .collection("metrics")
    .doc("summary");
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as PostMetrics;
  return {
    postId,
    impressions: data.impressions ?? 0,
    likes: data.likes ?? 0,
    comments: data.comments ?? 0,
    shares: data.shares ?? 0,
    clicks: data.clicks ?? 0,
    engagementRate: data.engagementRate ?? 0,
  };
}

export async function ingestDailyMetric(
  workspaceId: string,
  date: Date,
  platform: PlatformId,
  data: Partial<AnalyticsDailyPlatformDoc>
): Promise<void> {
  if (!adminDb) throw new Error("adminDb not configured");
  const db = adminDb;
  const key = isoDateKey(date);
  const ref = db
    .collection(`workspaces/${workspaceId}/analyticsDaily`)
    .doc(key)
    .collection("platforms")
    .doc(platform);
  await ref.set(
    {
      date: key,
      ...data,
    },
    { merge: true }
  );
  void SERVER_TIMESTAMP;
}

/**
 * Per-account analytics: aggregates the platform series for a single
 * (workspaceId, platform) pair and counts published posts in the date range.
 * The `accountId` is propagated for downstream callers (e.g. metrics endpoint
 * cache keys); the platform field is what actually drives the query.
 */
export async function getAccountAnalytics(
  workspaceId: string,
  accountId: string,
  platform: PlatformId,
  from: Date,
  to: Date
): Promise<AccountAnalytics> {
  const series = await getPlatformSeries(workspaceId, platform, from, to);
  const totals = {
    followers: series.length > 0 ? series[series.length - 1].followers : 0,
    impressions: series.reduce((acc, x) => acc + x.impressions, 0),
    likes: series.reduce((acc, x) => acc + x.likes, 0),
    comments: series.reduce((acc, x) => acc + x.comments, 0),
    shares: series.reduce((acc, x) => acc + x.shares, 0),
    clicks: series.reduce((acc, x) => acc + x.clicks, 0),
    engagementRate:
      series.length > 0
        ? series.reduce((acc, x) => acc + x.engagementRate, 0) / series.length
        : 0,
    postsPublished: 0,
  };

  if (adminDb) {
    try {
      const posts = await adminDb
        .collection(`workspaces/${workspaceId}/posts`)
        .where("status", "==", "published")
        .where("platforms", "array-contains", platform)
        .where("publishedAt", ">=", from)
        .where("publishedAt", "<=", to)
        .get();
      totals.postsPublished = posts.size;
    } catch {
      // index may not be present yet; treat as 0 — UI shows "0 posts"
    }
  }

  return {
    accountId,
    platform,
    from: from.toISOString(),
    to: to.toISOString(),
    totals,
    series,
  };
}

function enumerateDays(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  while (d <= end) {
    days.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

function isoDateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
