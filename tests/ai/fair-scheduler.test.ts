import { describe, it, expect } from "vitest";
import {
  calculateCaptionDeadlines,
  calculatePriorityScore,
  selectFairBatch,
} from "@/lib/ai/fair-scheduler";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";
import type { CaptionJobDoc } from "@/lib/db/schema";

describe("lib/ai/fair-scheduler", () => {
  it("calculates correct target and emergency deadlines", () => {
    const scheduledAt = new Date("2026-09-01T12:00:00.000Z");
    const deadlines = calculateCaptionDeadlines(scheduledAt);

    // Target buffer: 30 minutes prior -> 11:30:00
    expect(deadlines.generationDeadline.toISOString()).toBe("2026-09-01T11:30:00.000Z");

    // Emergency buffer: 10 minutes prior -> 11:50:00
    expect(deadlines.emergencyDeadline.toISOString()).toBe("2026-09-01T11:50:00.000Z");

    // Recommended start time should be before generation deadline
    expect(deadlines.generationRecommendedAt.getTime()).toBeLessThan(deadlines.generationDeadline.getTime());
  });

  it("assigns higher priority score to more imminent posts", () => {
    const now = Date.now();
    const imminentDate = new Date(now + 15 * 60_000).toISOString(); // 15 mins away
    const distantDate = new Date(now + 24 * 60 * 60_000).toISOString(); // 24 hours away
    const createdAt = new Date(now - 60_000).toISOString();

    const imminentScore = calculatePriorityScore(imminentDate, createdAt, 0);
    const distantScore = calculatePriorityScore(distantDate, createdAt, 0);

    expect(imminentScore).toBeGreaterThan(distantScore);
  });

  it("applies retry penalty to failed jobs", () => {
    const now = Date.now();
    const scheduledDate = new Date(now + 60 * 60_000).toISOString();
    const createdAt = new Date(now - 60_000).toISOString();

    const freshScore = calculatePriorityScore(scheduledDate, createdAt, 0);
    const retryingScore = calculatePriorityScore(scheduledDate, createdAt, 3);

    expect(freshScore).toBeGreaterThan(retryingScore);
  });

  it("applies deficit round-robin fairness across workspaces", () => {
    const now = new Date();
    const futureDate = new Date(Date.now() + 5 * 3600_000).toISOString();

    // Create 10 jobs for workspace A, and 2 jobs for workspace B
    const jobs: CaptionJobDoc[] = [];

    for (let i = 0; i < 10; i++) {
      jobs.push({
        id: `job_a_${i}`,
        workspaceId: "ws_A",
        userId: "user_a",
        postId: `post_a_${i}`,
        status: "pending",
        priorityScore: 1000 - i,
        scheduledAt: futureDate,
        generationRecommendedAt: futureDate,
        generationDeadline: futureDate,
        emergencyDeadline: futureDate,
        attempts: 0,
        maxAttempts: 3,
        provider: "xai",
        model: CAPTION_CONFIG.XAI_MODEL,
        idempotencyKey: `ws_A_${i}`,
        promptVersion: "1.0",
        generationConfigHash: "h1",
        contentHash: "h2",
        fingerprint: `fp_a_${i}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (let i = 0; i < 2; i++) {
      jobs.push({
        id: `job_b_${i}`,
        workspaceId: "ws_B",
        userId: "user_b",
        postId: `post_b_${i}`,
        status: "pending",
        priorityScore: 990 - i,
        scheduledAt: futureDate,
        generationRecommendedAt: futureDate,
        generationDeadline: futureDate,
        emergencyDeadline: futureDate,
        attempts: 0,
        maxAttempts: 3,
        provider: "xai",
        model: CAPTION_CONFIG.XAI_MODEL,
        idempotencyKey: `ws_B_${i}`,
        promptVersion: "1.0",
        generationConfigHash: "h1",
        contentHash: "h2",
        fingerprint: `fp_b_${i}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    const batch = selectFairBatch(jobs, 4);
    expect(batch.length).toBe(4);

    // Both ws_A and ws_B must be represented in the batch
    const wsAItems = batch.filter((j) => j.workspaceId === "ws_A");
    const wsBItems = batch.filter((j) => j.workspaceId === "ws_B");

    expect(wsAItems.length).toBeGreaterThan(0);
    expect(wsBItems.length).toBeGreaterThan(0);
  });
});
