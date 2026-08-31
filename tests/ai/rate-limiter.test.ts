import { describe, it, expect, beforeEach } from "vitest";
import { globalGrokRateLimiter } from "@/lib/ai/rate-limiter";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";

describe("lib/ai/rate-limiter - GlobalGrokRateLimiter", () => {
  beforeEach(() => {
    globalGrokRateLimiter._reset();
  });

  it("acquires lease when within limits", () => {
    const lease = globalGrokRateLimiter.tryAcquire("user_1");
    expect(lease.acquired).toBe(true);
    expect(typeof lease.release).toBe("function");

    lease.release({ success: true, actualTokens: 500, statusCode: 200 });
  });

  it("enforces per-user concurrency limit", () => {
    const leases: Array<{ release: () => void }> = [];

    for (let i = 0; i < CAPTION_CONFIG.MAX_PER_USER_CONCURRENCY; i++) {
      const lease = globalGrokRateLimiter.tryAcquire("user_busy");
      expect(lease.acquired).toBe(true);
      leases.push(lease);
    }

    // Exceeding per-user concurrency should fail
    const blockedLease = globalGrokRateLimiter.tryAcquire("user_busy");
    expect(blockedLease.acquired).toBe(false);
    expect(blockedLease.reason).toContain("Per-user concurrency ceiling reached");

    // Releasing one allows another
    leases[0].release({ success: true });
    const retryLease = globalGrokRateLimiter.tryAcquire("user_busy");
    expect(retryLease.acquired).toBe(true);
    retryLease.release({ success: true });

    // Clean up remaining
    leases.slice(1).forEach((l) => l.release({ success: true }));
  });

  it("activates adaptive throttling on 429 status code", () => {
    const lease = globalGrokRateLimiter.tryAcquire("user_test");
    expect(lease.acquired).toBe(true);

    // Simulate 429 error response
    lease.release({ success: false, statusCode: 429 });

    // Subsequent calls should be throttled
    const nextLease = globalGrokRateLimiter.tryAcquire("user_test");
    expect(nextLease.acquired).toBe(false);
    expect(nextLease.reason).toContain("Adaptive backpressure active");

    const status = globalGrokRateLimiter.getStatus();
    expect(status.isThrottled).toBe(true);
    expect(status.throttleCooldownRemainingMs).toBeGreaterThan(0);
  });
});
