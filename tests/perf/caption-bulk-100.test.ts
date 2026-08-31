import { describe, it, expect } from "vitest";
import { selectFairBatch } from "@/lib/ai/fair-scheduler";
import type { CaptionJobDoc } from "@/lib/db/schema";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";

describe("Performance & Load Smoke - 100 Bulk Caption Jobs Simulation", () => {
  it("prevents single-user starvation under 100-post bulk burst (User A=100, User B=2)", () => {
    const now = new Date();
    const futureDate = new Date(Date.now() + 3600_000).toISOString();

    const jobs: CaptionJobDoc[] = [];

    // User A creates 100 jobs in workspace A
    for (let i = 0; i < 100; i++) {
      jobs.push({
        id: `job_user_a_${i}`,
        workspaceId: "workspace_A",
        userId: "user_A",
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
        inputSnapshot: {},
        createdAt: now,
        updatedAt: now,
      });
    }

    // User B creates 2 urgent jobs in workspace B
    for (let i = 0; i < 2; i++) {
      jobs.push({
        id: `job_user_b_${i}`,
        workspaceId: "workspace_B",
        userId: "user_B",
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
        inputSnapshot: {},
        createdAt: now,
        updatedAt: now,
      });
    }

    // Select a fair batch of size 10 (MAX_GLOBAL_CONCURRENCY)
    const batch = selectFairBatch(jobs, 10);

    expect(batch.length).toBe(10);

    const userAJobs = batch.filter((j) => j.userId === "user_A");
    const userBJobs = batch.filter((j) => j.userId === "user_B");

    // Both tenants are represented in the execution batch
    expect(userAJobs.length).toBeGreaterThan(0);
    expect(userBJobs.length).toBeGreaterThan(0);

    // User B is guaranteed allocation and not starved by User A's 100-item burst
    expect(userBJobs.length).toBe(2);
    expect(userAJobs.length).toBe(8);
  });
});
