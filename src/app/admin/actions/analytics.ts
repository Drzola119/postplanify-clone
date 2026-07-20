"use server";

import { adminDb, getCurrentUser } from "@/lib/firebase/admin";
import { isAdminUser, getAdminUser, hasPermission, ADMIN_EMAIL } from "@/lib/firebase/admin-auth";
import { revalidatePath } from "next/cache";
import { logAdminAudit } from "@/app/admin/actions";
import type { 
  AnalyticsOverviewData, 
  SocialAnalyticsData,
  PlatformAnalytics,
  FunnelStep,
  RetentionCohort
} from "@/types/analytics";

// Permission validation helper
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user)) {
    throw new Error("Unauthorized: Admin privileges required.");
  }
  return user;
}

async function requirePermission(permission: string) {
  const user = await getCurrentUser();
  if (!user || !user.uid) throw new Error("Unauthorized: Not authenticated.");
  if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return user;

  if (adminDb) {
    const adminUser = await getAdminUser(user.uid);
    if (!adminUser || adminUser.status !== "active") {
      throw new Error("Unauthorized: Admin account not active.");
    }
    if (!hasPermission(adminUser.role, permission, adminUser.permissions)) {
      throw new Error(`Forbidden: Requires "${permission}" permission (role: ${adminUser.role}).`);
    }
  }
  return user;
}

// Convert Firestore Timestamp or String to Date safely
function toDate(val: { toDate?: () => Date } | string | null | undefined): Date {
  if (!val) return new Date();
  if (typeof (val as { toDate?: () => Date }).toDate === "function") return (val as { toDate: () => Date }).toDate();
  return new Date(val as string);
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverviewData> {
  await requireAdmin();

  if (!adminDb) {
    throw new Error("Database unavailable.");
  }

  // 1. Funnel Steps
  const usersSnap = await adminDb.collection("users").get();
  const totalUsers = usersSnap.size;

  const socialAccountsSnap = await adminDb.collectionGroup("socialAccounts").get();
  const connectedWorkspaces = new Set<string>();
  socialAccountsSnap.docs.forEach((doc) => {
    const segments = doc.ref.path.split("/");
    if (segments[1]) connectedWorkspaces.add(segments[1]);
  });

  const publishedPostsSnap = await adminDb.collectionGroup("posts")
    .where("status", "==", "published")
    .get();
  const postWorkspaces = new Set<string>();
  publishedPostsSnap.docs.forEach((doc) => {
    const segments = doc.ref.path.split("/");
    if (segments[1]) postWorkspaces.add(segments[1]);
  });

  // Subscriptions funnel step count
  let paidCount = 0;
  try {
    const subsSnap = await adminDb.collection("subscriptions")
      .where("status", "in", ["active", "trialing"])
      .get();
    paidCount = subsSnap.docs.filter((d) => {
      const pId = d.data().planId || d.data().plan;
      return pId && pId !== "free";
    }).length;
  } catch {}

  if (paidCount === 0) {
    const workspacesSnap = await adminDb.collection("workspaces").get();
    paidCount = workspacesSnap.docs.filter((d) => {
      const plan = d.data().plan;
      return plan && plan !== "free";
    }).length;
  }

  const funnel: FunnelStep[] = [
    { step: "1. Registered Users", count: totalUsers, percent: "100%" },
    { 
      step: "2. Connected Social Account", 
      count: connectedWorkspaces.size, 
      percent: totalUsers > 0 ? `${((connectedWorkspaces.size / totalUsers) * 100).toFixed(1)}%` : "0%" 
    },
    { 
      step: "3. Published ≥1 Post", 
      count: postWorkspaces.size, 
      percent: connectedWorkspaces.size > 0 ? `${((postWorkspaces.size / connectedWorkspaces.size) * 100).toFixed(1)}%` : "0%" 
    },
    { 
      step: "4. Upgraded to Paid Plan", 
      count: paidCount, 
      percent: postWorkspaces.size > 0 ? `${((paidCount / postWorkspaces.size) * 100).toFixed(1)}%` : "0%" 
    }
  ];

  // 2. Platform Breakdown
  const platformCounts: Record<string, number> = {};
  publishedPostsSnap.docs.forEach((doc) => {
    const platforms: string[] = doc.data().platforms || [];
    platforms.forEach((p) => {
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    });
  });

  const supportedPlatforms = ["instagram", "linkedin", "facebook", "twitter", "x", "tiktok", "threads", "youtube", "pinterest"];
  let otherCount = 0;
  const platformBreakdown = Object.entries(platformCounts).map(([platform, count]) => {
    const isSupported = supportedPlatforms.includes(platform.toLowerCase());
    if (!isSupported) {
      otherCount += count;
      return null;
    }
    return { platform: platform.toLowerCase(), count };
  }).filter((x): x is { platform: string; count: number } => x !== null);

  if (otherCount > 0) {
    platformBreakdown.push({ platform: "other", count: otherCount });
  }

  // 3. Feature Adoption
  let aiCaptionCount = 0;
  publishedPostsSnap.docs.forEach((doc) => {
    const d = doc.data();
    if (d.aiGenerated === true || d.captionSource === "ai" || d.captionSource === "caption_generator") {
      aiCaptionCount++;
    }
  });

  const workspacesSnap = await adminDb.collection("workspaces").get();
  let totalImageGen = 0;
  let totalTextGen = 0;
  workspacesSnap.docs.forEach((doc) => {
    const d = doc.data();
    totalImageGen += d.imageGenUsedLifetime ?? 0;
    totalTextGen += d.textGenUsedLifetime ?? 0;
  });

  const scheduledCountSnap = await adminDb.collectionGroup("posts")
    .where("status", "==", "scheduled")
    .get();

  const bulkCountSnap = await adminDb.collectionGroup("posts")
    .where("source", "==", "bulk")
    .get();
  const bulkUploadCount = bulkCountSnap.size;

  const featureAdoption = [
    { feature: "AI Caption Generator", count: aiCaptionCount },
    { feature: "Image Generation", count: totalImageGen },
    { feature: "Text AI Usage", count: totalTextGen },
    { feature: "Scheduled Posts", count: scheduledCountSnap.size },
    { feature: "Bulk Uploads", count: bulkUploadCount }
  ];

  // 4. Daily Time Series (Last 30 days)
  const timeSeries = await getAnalyticsTimeSeries(30);

  // 5. Workspace & Subscription Stats
  const totalWorkspaces = workspacesSnap.size;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let churned30d = 0;
  try {
    const churnSnap = await adminDb.collection("subscriptions")
      .where("status", "==", "canceled")
      .get();
    churnSnap.docs.forEach((doc) => {
      const canceledAt = toDate(doc.data().canceledAt || doc.data().updatedAt);
      if (canceledAt >= thirtyDaysAgo) {
        churned30d++;
      }
    });
  } catch {}

  const planPrices: Record<string, number> = {
    free: 0,
    growth: 79,
    pro: 79,
    premium: 159,
    scale: 239,
    team: 239,
    enterprise: 499
  };

  let mrr = 0;
  workspacesSnap.docs.forEach((doc) => {
    const plan = (doc.data().plan || "free").toLowerCase();
    mrr += planPrices[plan] || 0;
  });

  // 6. Retention Cohorts
  const retentionCohorts: RetentionCohort[] = [];
  const now = new Date();

  // Create weeks array (going backwards from now)
  const cohortWeeks = Array.from({ length: 4 }).map((_, idx) => {
    const start = new Date(now.getTime() - (idx + 1) * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() - idx * 7 * 24 * 60 * 60 * 1000);
    return { name: `Wk -${idx + 1}`, start, end };
  }).reverse();

  // Load all posts with authorUid
  const allPosts = publishedPostsSnap.docs.map((doc) => ({
    authorUid: doc.data().authorUid,
    publishedAt: toDate(doc.data().publishedAt || doc.data().createdAt)
  }));

  cohortWeeks.forEach((cohort) => {
    // Find users who signed up in this cohort window
    const cohortUsers = usersSnap.docs.filter((doc) => {
      const createdAt = toDate(doc.data().createdAt || doc.data().joinedAt);
      return createdAt >= cohort.start && createdAt < cohort.end;
    });

    if (cohortUsers.length === 0) {
      retentionCohorts.push({ cohort: cohort.name, week1: 0, week2: 0, week4: 0, week8: 0 });
      return;
    }

    let w1Count = 0, w2Count = 0, w4Count = 0, w8Count = 0;

    cohortUsers.forEach((u) => {
      const signupDate = toDate(u.data().createdAt || u.data().joinedAt);
      const lastActive = toDate(u.data().lastLoginAt || u.data().lastActive || signupDate);

      const checkRetention = (daysStart: number, daysEnd: number) => {
        const winStart = signupDate.getTime() + daysStart * 24 * 60 * 60 * 1000;
        const winEnd = signupDate.getTime() + daysEnd * 24 * 60 * 60 * 1000;
        // User is active if last login falls in/after window, or they published a post inside window
        if (lastActive.getTime() >= winStart) return true;
        return allPosts.some((p) => p.authorUid === u.id && p.publishedAt.getTime() >= winStart && p.publishedAt.getTime() < winEnd);
      };

      if (checkRetention(0, 7)) w1Count++;
      if (checkRetention(7, 14)) w2Count++;
      if (checkRetention(21, 28)) w4Count++;
      if (checkRetention(49, 56)) w8Count++;
    });

    retentionCohorts.push({
      cohort: cohort.name,
      week1: Math.round((w1Count / cohortUsers.length) * 100),
      week2: Math.round((w2Count / cohortUsers.length) * 100),
      week4: Math.round((w4Count / cohortUsers.length) * 100),
      week8: Math.round((w8Count / cohortUsers.length) * 100)
    });
  });

  return {
    funnel,
    platformBreakdown,
    featureAdoption,
    timeSeries,
    retentionCohorts,
    subscriptionStats: {
      total: totalWorkspaces,
      paid: paidCount,
      churned30d,
      mrr
    }
  };
}

export async function getAnalyticsTimeSeries(days: 7 | 30 | 90): Promise<{ date: string; signups: number; posts: number }[]> {
  await requireAdmin();

  if (!adminDb) {
    return [];
  }

  const now = new Date();
  const startMs = now.getTime() - days * 24 * 60 * 60 * 1000;
  void startMs; // used below for filtering

  // Get signups in range
  const usersSnap = await adminDb.collection("users")
    .get();

  const postsSnap = await adminDb.collectionGroup("posts")
    .where("status", "==", "published")
    .get();

  // Create date buckets
  const buckets: Record<string, { signups: number; posts: number }> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    buckets[dateStr] = { signups: 0, posts: 0 };
  }

  usersSnap.docs.forEach((doc) => {
    const dateVal = doc.data().createdAt || doc.data().joinedAt;
    if (!dateVal) return;
    const dateStr = toDate(dateVal).toISOString().slice(0, 10);
    if (dateStr in buckets) {
      buckets[dateStr].signups++;
    }
  });

  postsSnap.docs.forEach((doc) => {
    const dateVal = doc.data().publishedAt || doc.data().createdAt;
    if (!dateVal) return;
    const dateStr = toDate(dateVal).toISOString().slice(0, 10);
    if (dateStr in buckets) {
      buckets[dateStr].posts++;
    }
  });

  return Object.entries(buckets).map(([date, counts]) => ({
    date,
    signups: counts.signups,
    posts: counts.posts
  }));
}

export async function getSocialAnalytics(): Promise<SocialAnalyticsData> {
  await requireAdmin();

  if (!adminDb) {
    throw new Error("Database unavailable.");
  }

  // Fetch all social accounts connected to workspaces
  const socialAccountsSnap = await adminDb.collectionGroup("socialAccounts").get();
  
  const platformsData: PlatformAnalytics[] = [];
  const now = new Date();

  // Map each connected account to its status. No external API calls are made here.
  socialAccountsSnap.docs.forEach((doc) => {
    const d = doc.data();
    const platform = d.platform || "unknown";
    const segments = doc.ref.path.split("/");
    const workspaceId = segments[1];

    if (!workspaceId || platform === "unknown") return;

    const token = d.accessToken || d.token;
    const reauthRequired = !!(d.reauthRequired || d.reauth_required);

    let status: PlatformAnalytics["status"] = "ok";
    if (!token) {
      status = "not_connected";
    } else if (reauthRequired || (d.tokenExpiry && new Date(d.tokenExpiry).getTime() < now.getTime())) {
      status = "token_expired";
    }

    platformsData.push({
      platform,
      status,
      lastSyncedAt: now.toISOString(),
      impressions30d: 0,
      engagements30d: 0,
      followerCount: 0,
      followerGrowth30d: 0,
      topPosts: [],
      audienceCountries: []
    });
  });

  const totalPublishedPostsSnap = await adminDb.collectionGroup("posts")
    .where("status", "==", "published")
    .get();
  const totalPublishedPosts = totalPublishedPostsSnap.size;

  return {
    platforms: platformsData,
    heroStats: {
      totalImpressions: 0,
      totalEngagements: 0,
      totalFollowerGrowth: 0,
      totalPublishedPosts,
      avgEngagementRate: 0
    },
    topPosts: [],
    geoDistribution: [],
    cachedAt: now.toISOString()
  };
}

export async function refreshSocialAnalytics(): Promise<void> {
  await requirePermission("platform.settings");

  if (!adminDb) {
    throw new Error("Database unavailable.");
  }

  // Clear cache if needed (cache is not used for direct fetches now, but rules mandate cache logic remains)
  const cacheSnap = await adminDb.collection("analyticsCache").get();
  const batch = adminDb.batch();
  cacheSnap.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  await logAdminAudit("analytics_cache_refresh", "all", {});
  revalidatePath("/admin/analytics");
}

export async function getWebTrafficViews(days: number = 30): Promise<number | null> {
  // Provider-agnostic placeholder for GA4, Plausible, Cloudflare, etc.
  // Currently not configured on Hostinger.
  void days;
  return null;
}

