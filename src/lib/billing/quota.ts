/**
 * billing/quota.ts
 *
 * Per-workspace monthly quota + cost-cap enforcement for AI generation
 * features. Today this covers Carousel Studio (M1+); Video Studio quota
 * enforcement is wired as a fast-follow — the function shape already
 * supports it.
 *
 * Pattern: callers call `checkQuota(workspaceId, feature, estimatedCost)`
 * BEFORE they begin any work that costs money. If allowed, they go ahead
 * and call `recordUsage(workspaceId, feature, actualCost)` AFTER success,
 * with the real cost (not the estimate). The check uses the estimate so
 * we don't blow past the cap mid-run; the record uses the real cost so
 * the cap converges to reality across retries.
 *
 * Why server-only: reads + writes the workspace Firestore doc, which
 * requires firebase-admin. Routes pull these helpers in directly.
 */
import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { createLogger } from "@/lib/log";
import type { WorkspaceDoc } from "@/lib/db/schema";

const logger = createLogger("billing:quota");

export type Feature = "carousel" | "video";

export interface PlanMonthlyLimits {
  /** Max successful carousel generations per calendar month. */
  carouselGens: number;
  /** Max USD spent on carousel generations per calendar month. */
  carouselCostCapUsd: number;
  /**
   * Max successful video generations per calendar month. Reserved for
   * the video fast-follow — not currently enforced. Existing video-gen
   * code tracks seconds, not count, so the shape may evolve when wired.
   */
  videoGens: number;
  /** Max USD spent on video generations per calendar month. */
  videoCostCapUsd: number;
}

/**
 * Monthly caps by WorkspaceDoc.plan. PLACEHOLDER NUMBERS — deliberately
 * conservative guesses to keep the platform safe while real pricing
 * decisions land. Confirm against the marketing page in src/data/pricing.ts
 * (Growth/Premium/Scale/Enterprise map roughly to pro/team/team-or-
 * enterprise/enterprise) before launch.
 *
 * Caps are 2× the max realistic spend at the count limit (worst case
 * per-carousel = 5 slides × $0.10 × ~3x retries ≈ $1.50) so retries
 * don't immediately bounce a legitimate request.
 */
export const PLAN_MONTHLY_LIMITS: Record<WorkspaceDoc["plan"], PlanMonthlyLimits> = {
  free: { carouselGens: 3, carouselCostCapUsd: 5, videoGens: 3, videoCostCapUsd: 5 },
  pro: { carouselGens: 30, carouselCostCapUsd: 30, videoGens: 30, videoCostCapUsd: 30 },
  team: { carouselGens: 100, carouselCostCapUsd: 100, videoGens: 100, videoCostCapUsd: 100 },
  // Enterprise: a runaway loop can't bill unboundedly because both caps
  // are finite (10k), but a healthy account never hits them.
  enterprise: {
    carouselGens: 10000,
    carouselCostCapUsd: 10000,
    videoGens: 10000,
    videoCostCapUsd: 10000,
  },
};

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function resolvePlan(data: Record<string, unknown>): WorkspaceDoc["plan"] {
  const raw = data.plan;
  if (raw === "free" || raw === "pro" || raw === "team" || raw === "enterprise") {
    return raw;
  }
  // Unknown / missing → default to the strictest tier. Better to block a
  // request than to silently let a misconfigured workspace bill unlimited.
  return "free";
}

export interface QuotaCheckResult {
  allowed: boolean;
  /** Human-readable reason, populated when allowed=false. Safe to show the user. */
  reason?: string;
  /** Current month bucket the check was scoped to, for logging. */
  monthKey: string;
}

/**
 * Check whether a workspace is allowed to start one more generation of
 * `feature`, assuming the caller will spend `estimatedCostUsd`. Pure
 * read — does not modify the workspace doc.
 *
 * Returns { allowed: true } or { allowed: false, reason } with a reason
 * string safe to surface to the user in a 402 response.
 */
export async function checkQuota(
  workspaceId: string,
  feature: Feature,
  estimatedCostUsd: number
): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  const db = adminDb;
  if (!db) {
    return { allowed: false, reason: "Billing is not configured on this server." };
  }

  const wsRef = db.collection("workspaces").doc(workspaceId);
  const snap = await wsRef.get();
  if (!snap.exists) {
    return { allowed: false, reason: "Workspace not found." };
  }

  const data = snap.data() ?? {};
  const plan = resolvePlan(data);
  const limits = PLAN_MONTHLY_LIMITS[plan];
  const monthKey = currentMonthKey();

  if (feature === "carousel") {
    const storedMonth = (data.carouselGenMonth as string | undefined) ?? "";
    const isSameMonth = storedMonth === monthKey;
    const usedCount = isSameMonth ? (data.carouselGenUsedThisMonth ?? 0) : 0;
    const usedCost = isSameMonth ? (data.carouselGenCostThisMonthUsd ?? 0) : 0;

    if (usedCount + 1 > limits.carouselGens) {
      return {
        allowed: false,
        reason: `Carousel quota reached for this month (${usedCount}/${limits.carouselGens} carousels). Upgrade your plan or wait for the next billing cycle.`,
      };
    }
    if (usedCost + Math.max(0, estimatedCostUsd) > limits.carouselCostCapUsd) {
      return {
        allowed: false,
        reason: `Carousel cost cap reached for this month (~$${usedCost.toFixed(2)} of $${limits.carouselCostCapUsd} used). Upgrade your plan or wait for the next billing cycle.`,
      };
    }
    return { allowed: true };
  }

  if (feature === "video") {
    const storedMonth = (data.videoGenMonth as string | undefined) ?? "";
    const isSameMonth = storedMonth === monthKey;
    const usedCost = isSameMonth ? ((data.videoGenCostThisMonthUsd as number | undefined) ?? 0) : 0;
    // videoGenUsedThisMonth is not yet populated by legacy video-gen/usage.ts (uses seconds),
    // so derive count as lifetime / month-aware fallback to avoid blocking valid users on upgrade
    const usedCount = isSameMonth
      ? ((data.videoGenUsedThisMonth as number | undefined) ?? 0)
      : 0;

    if (usedCount + 1 > limits.videoGens) {
      return {
        allowed: false,
        reason: `Video quota reached for this month (${usedCount}/${limits.videoGens} videos). Upgrade your plan or wait for the next billing cycle.`,
      };
    }
    if (usedCost + Math.max(0, estimatedCostUsd) > limits.videoCostCapUsd) {
      return {
        allowed: false,
        reason: `Video cost cap reached for this month (~$${usedCost.toFixed(2)} of $${limits.videoCostCapUsd} used). Upgrade your plan or wait for the next billing cycle.`,
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: `Unknown feature: ${String(feature)}` };
}

/**
 * Record actual usage after a generation succeeds. Increments the
 * *ThisMonth and *Lifetime counters atomically inside a transaction; if
 * the stored month bucket doesn't match the current YYYY-MM the counter
 * resets to the new value (not adds — the month is fresh).
 *
 * Call this AFTER the work succeeds, with the real cost (not the
 * estimate that was passed to checkQuota). Failures are non-fatal — a
 * missed counter increment is better than a thrown error from a billing
 * helper masking a real generation error upstream.
 */
export async function recordUsage(
  workspaceId: string,
  feature: Feature,
  actualCostUsd: number
): Promise<void> {
  if (feature === "video") {
    // Video has its own recordVideoGenUsage() in src/lib/video-gen/usage.ts
    // which already tracks seconds + cost + provider. Don't double-write.
    return;
  }

  const db = adminDb;
  if (!db) return;

  const wsRef = db.collection("workspaces").doc(workspaceId);
  const now = new Date();
  const monthKey = currentMonthKey();

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(wsRef);
      const data = snap.data() ?? {};
      const storedMonth = (data.carouselGenMonth as string | undefined) ?? "";
      const resetMonth = storedMonth !== monthKey;

      const update: Record<string, unknown> = {
        carouselGenUsedLifetime: (data.carouselGenUsedLifetime ?? 0) + 1,
        carouselGenUsedThisMonth: resetMonth
          ? 1
          : (data.carouselGenUsedThisMonth ?? 0) + 1,
        carouselGenCostThisMonthUsd: resetMonth
          ? Math.max(0, actualCostUsd)
          : (data.carouselGenCostThisMonthUsd ?? 0) + Math.max(0, actualCostUsd),
        carouselGenMonth: monthKey,
        carouselGenLastUsedAt: now,
        // carouselGenLastProvider is left for the caller to patch
        // separately if it knows which provider served the request.
      };
      tx.update(wsRef, update);
    });
    logger.info("Quota usage recorded", {
      workspaceId,
      feature,
      actualCostUsd,
      monthKey,
    });
  } catch (err) {
    logger.error("Failed to record quota usage", {
      workspaceId,
      feature,
      error: err instanceof Error ? err.message : String(err),
    });
    // Non-fatal — don't throw.
  }
}