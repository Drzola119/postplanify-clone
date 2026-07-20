import "server-only";
import { adminDb } from "@/lib/firebase/admin";

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  comparator: "gt" | "gte" | "lt" | "eq";
  threshold: number;
  windowMinutes: number;
  severity: "info" | "warning" | "critical";
  enabled: boolean;
  notifyChannels: ("in_app" | "email" | "webhook")[];
}

interface AlertToCreate {
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  source: string;
  relatedId?: string;
  dedupeKey: string;
}

function dedupeKey(ruleId: string, windowMinutes: number): string {
  const bucket = Math.floor(Date.now() / (windowMinutes * 60 * 1000));
  return `${ruleId}_${bucket}`;
}

export async function evaluateAlertRules(): Promise<void> {
  if (!adminDb) return;
  try {
    const rulesSnap = await adminDb.collection("alertRules").where("enabled", "==", true).get();
    if (rulesSnap.empty) return;

    // Reuse existing system health data
    let failedPosts24h = 0;
    let totalPosts24h = 0;
    let paymentFailures24h = 0;
    let tokenExpiringSoon = 0;
    let queueDepth = 0;
    let dailyAiCostUsd = 0;
    let storageHighWorkspaces = 0;
    let signups24h = 0;
    let cancellations24h = 0;

    const now = Date.now();
    const dayAgo = new Date(now - 86400000).toISOString();

    try {
      const postsSnap = await adminDb.collection("posts").get();
      postsSnap.docs.forEach((doc) => {
        const data = doc.data();
        const ts = data.updatedAt || data.publishedAt || data.scheduledAt || "";
        if (ts >= dayAgo) {
          totalPosts24h++;
          if (data.status === "failed") failedPosts24h++;
        }
      });
    } catch {}

    try {
      const subsSnap = await adminDb.collection("subscriptions").get();
      subsSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === "canceled" && (data.canceledAt || "") >= dayAgo) cancellations24h++;
      });
    } catch {}

    try {
      const usersSnap = await adminDb.collection("users").get();
      usersSnap.docs.forEach((doc) => {
        const data = doc.data();
        if ((data.createdAt || "") >= dayAgo) signups24h++;
      });
    } catch {}

    try {
      const statsDoc = await adminDb.collection("adminStats").doc("today").get();
      if (statsDoc.exists) {
        const statsData = statsDoc.data();
        queueDepth = (statsData?.queueDepth ?? 0) as number;
      }
    } catch {}

    // Payment failures — subscriptions currently past_due
    try {
      const pastDueSnap = await adminDb.collection("subscriptions")
        .where("status", "==", "past_due")
        .get();
      paymentFailures24h = pastDueSnap.size;
    } catch {}

    // Tokens expiring within 3 days
    try {
      const threeDaysFromNow = new Date(now + 3 * 86400000).toISOString();
      const tokenSnap = await adminDb.collectionGroup("socialAccounts")
        .where("tokenExpiry", ">=", new Date().toISOString())
        .where("tokenExpiry", "<=", threeDaysFromNow)
        .get();
      tokenExpiringSoon = tokenSnap.size;
    } catch {}

    // Daily AI cost — sum imageGenLastCostUsd + textGenLastCostUsd from workspaces
    try {
      const wsSnap = await adminDb.collection("workspaces").get();
      wsSnap.docs.forEach((doc) => {
        const d = doc.data();
        dailyAiCostUsd += (d.imageGenLastCostUsd ?? 0) + (d.textGenLastCostUsd ?? 0);
      });
    } catch {}

    // Storage — group mediaAssets by workspace, count over 1 GB threshold
    try {
      const mediaSnap = await adminDb.collectionGroup("mediaAssets").get();
      const perWorkspace = new Map<string, number>();
      mediaSnap.docs.forEach((doc) => {
        const d = doc.data();
        const wsId = d.workspaceId || doc.ref.parent.parent?.id;
        if (!wsId) return;
        const bytes = d.sizeBytes ?? d.totalBytes ?? 0;
        perWorkspace.set(wsId, (perWorkspace.get(wsId) ?? 0) + bytes);
      });
      const ONE_GB = 1_073_741_824;
      let count = 0;
      for (const totalBytes of perWorkspace.values()) {
        if (totalBytes > ONE_GB) count++;
      }
      storageHighWorkspaces = count;
    } catch {}

    const failureRatePct = totalPosts24h > 0 ? (failedPosts24h / totalPosts24h) * 100 : 0;

    const metrics: Record<string, number> = {
      failure_rate_pct: failureRatePct,
      failed_posts_count: failedPosts24h,
      payment_failures_count: paymentFailures24h,
      token_expiring_count: tokenExpiringSoon,
      queue_depth: queueDepth,
      ai_spend_daily_usd: dailyAiCostUsd,
      storage_high_workspaces: storageHighWorkspaces,
      signups_24h: signups24h,
      churn_24h: cancellations24h,
    };

    const alertsToCreate: AlertToCreate[] = [];

    for (const rule of rulesSnap.docs) {
      const r = { id: rule.id, ...rule.data() } as AlertRule;
      if (!r.enabled) continue;

      const currentValue = metrics[r.metric];
      if (currentValue === undefined) continue;

      let triggered = false;
      switch (r.comparator) {
        case "gt": triggered = currentValue > r.threshold; break;
        case "gte": triggered = currentValue >= r.threshold; break;
        case "lt": triggered = currentValue < r.threshold; break;
        case "eq": triggered = currentValue === r.threshold; break;
      }

      if (triggered) {
        const dk = dedupeKey(r.id, r.windowMinutes);
        alertsToCreate.push({
          type: r.metric,
          severity: r.severity,
          title: r.name,
          message: `Value ${currentValue} ${r.comparator} threshold ${r.threshold} (metric: ${r.metric})`,
          source: "system",
          dedupeKey: dk,
        });
      }
    }

    // Bulk upsert alerts with deduplication
    for (const alert of alertsToCreate) {
      const existingSnap = await adminDb.collection("platformAlerts")
        .where("dedupeKey", "==", alert.dedupeKey)
        .where("resolvedAt", "==", null)
        .limit(1)
        .get();

      if (existingSnap.empty) {
        await adminDb.collection("platformAlerts").add({
          ...alert,
          acknowledged: false,
          createdAt: new Date().toISOString(),
          resolvedAt: null,
        });
        // Also write to adminNotifications for the header bell
        await adminDb.collection("adminNotifications").add({
          type: "alert",
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error("[alerts/evaluate] Error:", err);
  }
}

/** Seed sensible default rules on first run */
export async function seedDefaultAlertRules(): Promise<void> {
  if (!adminDb) return;
  const existing = await adminDb.collection("alertRules").limit(1).get();
  if (!existing.empty) return;

  const defaults: Omit<AlertRule, "id">[] = [
    { name: "High Post Failure Rate", metric: "failure_rate_pct", comparator: "gt", threshold: 20, windowMinutes: 60, severity: "warning", enabled: true, notifyChannels: ["in_app"] },
    { name: "Payment Failures Detected", metric: "payment_failures_count", comparator: "gt", threshold: 5, windowMinutes: 60, severity: "critical", enabled: true, notifyChannels: ["in_app"] },
    { name: "Social Token Expiring Soon", metric: "token_expiring_count", comparator: "gt", threshold: 3, windowMinutes: 4320, severity: "warning", enabled: true, notifyChannels: ["in_app"] },
    { name: "Queue Backlog", metric: "queue_depth", comparator: "gt", threshold: 100, windowMinutes: 30, severity: "warning", enabled: true, notifyChannels: ["in_app"] },
    { name: "Daily AI Spend Cap Reached", metric: "ai_spend_daily_usd", comparator: "gt", threshold: 50, windowMinutes: 1440, severity: "warning", enabled: true, notifyChannels: ["in_app"] },
    { name: "Storage Quota Exceeded", metric: "storage_high_workspaces", comparator: "gt", threshold: 5, windowMinutes: 1440, severity: "info", enabled: true, notifyChannels: ["in_app"] },
    { name: "New Signup Spike", metric: "signups_24h", comparator: "gt", threshold: 100, windowMinutes: 1440, severity: "info", enabled: false, notifyChannels: ["in_app"] },
    { name: "Churn Spike", metric: "churn_24h", comparator: "gt", threshold: 10, windowMinutes: 1440, severity: "critical", enabled: true, notifyChannels: ["in_app"] },
  ];

  const batch = adminDb.batch();
  for (const rule of defaults) {
    const ref = adminDb.collection("alertRules").doc();
    batch.set(ref, rule);
  }
  await batch.commit();
}
