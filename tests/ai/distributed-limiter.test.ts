import { describe, it, expect, beforeEach, vi } from "vitest";
import { tryAcquireDistributedLease, type DistributedLimiterDoc } from "@/lib/ai/rate-limiter-distributed";
import { globalGrokRateLimiter } from "@/lib/ai/rate-limiter";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";

// Mock adminDb
let mockDocData: Partial<DistributedLimiterDoc> = {};
let mockDocExists = false;

vi.mock("@/lib/db", () => {
  return {
    adminDb: {
      doc: vi.fn(() => ({
        path: "adminStats/grokRateLimiter",
      })),
      runTransaction: vi.fn(async (updateFn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          get: vi.fn(async () => ({
            exists: mockDocExists,
            data: () => ({ ...mockDocData }),
          })),
          set: vi.fn((_ref: unknown, data: Partial<DistributedLimiterDoc>) => {
            mockDocExists = true;
            mockDocData = { ...mockDocData, ...data };
          }),
          update: vi.fn((_ref: unknown, data: Partial<DistributedLimiterDoc>) => {
            mockDocData = { ...mockDocData, ...data };
          }),
        };
        return updateFn(tx);
      }),
    },
    FieldValue: {
      serverTimestamp: vi.fn(() => new Date()),
    },
  };
});

describe("lib/ai/rate-limiter-distributed - tryAcquireDistributedLease", () => {
  beforeEach(() => {
    mockDocData = {
      requestTokens: CAPTION_CONFIG.SAFE_RPS,
      tpmTokens: CAPTION_CONFIG.SAFE_TPM,
      lastRefillMs: Date.now(),
      activeConcurrency: 0,
      throttleUntil: 0,
      throttleMult: 1,
    };
    mockDocExists = true;
    globalGrokRateLimiter._reset();
    process.env.ENABLE_DISTRIBUTED_LIMITER = "true";
  });

  it("acquires lease atomically through transaction when within limits", async () => {
    const lease = await tryAcquireDistributedLease("user_dist_1", 1000);
    expect(lease.acquired).toBe(true);
    expect(mockDocData.activeConcurrency).toBe(1);
    expect(Math.floor(mockDocData.requestTokens!)).toBeLessThanOrEqual(CAPTION_CONFIG.SAFE_RPS);
    expect(Math.floor(mockDocData.tpmTokens!)).toBeLessThanOrEqual(CAPTION_CONFIG.SAFE_TPM);

    lease.release({ success: true, actualTokens: 800, statusCode: 200 });
  });

  it("blocks acquisition when distributed concurrency limit is reached", async () => {
    mockDocData.activeConcurrency = CAPTION_CONFIG.MAX_GLOBAL_CONCURRENCY;

    const lease = await tryAcquireDistributedLease("user_dist_2");
    expect(lease.acquired).toBe(false);
    expect(lease.reason).toContain("Distributed concurrency limit reached");
  });

  it("blocks acquisition during cluster-wide 429 adaptive backpressure", async () => {
    mockDocData.throttleUntil = Date.now() + 10_000;

    const lease = await tryAcquireDistributedLease("user_dist_3");
    expect(lease.acquired).toBe(false);
    expect(lease.reason).toContain("Adaptive backpressure active across cluster");
    expect(lease.retryAfterMs).toBeGreaterThan(0);
  });

  it("gracefully falls back to in-memory rate limiter when flag is false", async () => {
    process.env.ENABLE_DISTRIBUTED_LIMITER = "false";

    const lease = await tryAcquireDistributedLease("user_fallback");
    expect(lease.acquired).toBe(true);

    const status = globalGrokRateLimiter.getStatus();
    expect(status.isDistributed).toBe(false);
  });
});
