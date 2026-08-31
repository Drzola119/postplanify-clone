import "server-only";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";
import type { CaptionJobDoc } from "@/lib/db/schema";

export interface DeadlineCalculationResult {
  scheduledAt: Date;
  generationDeadline: Date;
  generationRecommendedAt: Date;
  emergencyDeadline: Date;
}

/**
 * Deterministically computes the caption generation deadlines and recommended start window.
 * All operations use canonical UTC dates.
 */
export function calculateCaptionDeadlines(
  scheduledAtInput: Date | string | number,
  queuePressure: "low" | "medium" | "high" = "low"
): DeadlineCalculationResult {
  const scheduledAt = new Date(scheduledAtInput);
  const scheduledMs = scheduledAt.getTime();

  // Target Buffer (e.g. 30 minutes before publishing)
  const targetBufferMs = CAPTION_CONFIG.TARGET_BUFFER_MINUTES * 60_000;
  const generationDeadline = new Date(scheduledMs - targetBufferMs);

  // Emergency Buffer (e.g. 10 minutes before publishing)
  const emergencyBufferMs = CAPTION_CONFIG.EMERGENCY_BUFFER_MINUTES * 60_000;
  const emergencyDeadline = new Date(scheduledMs - emergencyBufferMs);

  // Recommended start time adapts to queue pressure
  let recommendedLeadMs: number;
  if (queuePressure === "high") {
    // High pressure -> start up to 4 hours before deadline
    recommendedLeadMs = 4 * 60 * 60_000;
  } else if (queuePressure === "medium") {
    // Medium pressure -> start up to 90 minutes before deadline
    recommendedLeadMs = 90 * 60_000;
  } else {
    // Low pressure -> start 30 minutes before deadline (60 min before publish)
    recommendedLeadMs = 30 * 60_000;
  }

  const recommendedMs = generationDeadline.getTime() - recommendedLeadMs;
  const generationRecommendedAt = new Date(recommendedMs);

  return {
    scheduledAt,
    generationDeadline,
    generationRecommendedAt,
    emergencyDeadline,
  };
}

/**
 * Calculates a deterministic priority score for a job based on deadline proximity, age, and retries.
 * Higher score = higher priority.
 */
export function calculatePriorityScore(
  scheduledAtInput: Date | string,
  createdAtInput: Date | string,
  attempts = 0,
  isManualGenerateNow = false
): number {
  const now = Date.now();
  const scheduledMs = new Date(scheduledAtInput).getTime();
  const createdMs = new Date(createdAtInput).getTime();
  const minutesUntilPublish = (scheduledMs - now) / 60_000;
  const ageMinutes = Math.max(0, (now - createdMs) / 60_000);

  let urgencyScore = 0;

  if (minutesUntilPublish <= CAPTION_CONFIG.EMERGENCY_BUFFER_MINUTES) {
    // Critical / Emergency: Less than 10 minutes to publication
    urgencyScore = 100_000 + Math.max(0, 10 - minutesUntilPublish) * 1_000;
  } else if (minutesUntilPublish <= CAPTION_CONFIG.TARGET_BUFFER_MINUTES) {
    // High Urgency: 10 - 30 minutes
    urgencyScore = 50_000 + (30 - minutesUntilPublish) * 500;
  } else if (minutesUntilPublish <= 120) {
    // Medium-High Urgency: 30m - 2h
    urgencyScore = 20_000 + (120 - minutesUntilPublish) * 100;
  } else if (minutesUntilPublish <= 720) {
    // Medium: 2h - 12h
    urgencyScore = 5_000 + (720 - minutesUntilPublish) * 10;
  } else {
    // Far future
    urgencyScore = Math.max(0, 1_000 - minutesUntilPublish / 60);
  }

  // Aging bonus to prevent starvation of older jobs
  const agingBonus = Math.min(2_000, ageMinutes * 10);

  // Manual "Generate Now" priority boost
  const manualBoost = isManualGenerateNow ? 15_000 : 0;

  // Retry penalty to allow fresh jobs ahead of repeated transient failures
  const retryPenalty = attempts * 1_000;

  return Math.max(0, Math.floor(urgencyScore + agingBonus + manualBoost - retryPenalty));
}

/**
 * Selects candidate jobs using Deficit Round-Robin across tenant/workspace buckets.
 * Prevents a single workspace or user from monopolizing the batch.
 */
export function selectFairBatch(jobs: CaptionJobDoc[], maxBatchSize = 10): CaptionJobDoc[] {
  if (jobs.length <= maxBatchSize) {
    return [...jobs].sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // 1. Separate emergency jobs (always processed first regardless of fairness)
  const now = Date.now();
  const emergencyJobs: CaptionJobDoc[] = [];
  const normalJobs: CaptionJobDoc[] = [];

  for (const job of jobs) {
    const scheduledMs = new Date(job.scheduledAt).getTime();
    if (scheduledMs - now <= CAPTION_CONFIG.EMERGENCY_BUFFER_MINUTES * 60_000) {
      emergencyJobs.push(job);
    } else {
      normalJobs.push(job);
    }
  }

  // Sort emergencies by priority
  emergencyJobs.sort((a, b) => b.priorityScore - a.priorityScore);

  const selected: CaptionJobDoc[] = [...emergencyJobs.slice(0, maxBatchSize)];
  if (selected.length >= maxBatchSize) return selected;

  // 2. Group remaining normal jobs by workspaceId
  const buckets = new Map<string, CaptionJobDoc[]>();
  for (const job of normalJobs) {
    const key = job.workspaceId || job.userId;
    const list = buckets.get(key) ?? [];
    list.push(job);
    buckets.set(key, list);
  }

  // Sort each bucket by priority
  for (const list of buckets.values()) {
    list.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // 3. Round-robin pick across tenant buckets
  const bucketKeys = Array.from(buckets.keys());
  let bucketIndex = 0;
  let remainingCapacity = maxBatchSize - selected.length;

  while (remainingCapacity > 0 && bucketKeys.length > 0) {
    const key = bucketKeys[bucketIndex % bucketKeys.length];
    const list = buckets.get(key);

    if (list && list.length > 0) {
      const nextJob = list.shift()!;
      selected.push(nextJob);
      remainingCapacity--;
    } else {
      // Remove empty bucket
      const idx = bucketKeys.indexOf(key);
      if (idx !== -1) bucketKeys.splice(idx, 1);
    }

    bucketIndex++;
  }

  return selected;
}
