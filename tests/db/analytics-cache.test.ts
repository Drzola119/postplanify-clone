import { describe, it, expect, vi } from "vitest";

const { CACHE_TTL_MS, invalidateAnalyticsCache } = await import("@/lib/db/analytics-cache");

describe("analytics-cache", () => {
  it("exports the live one-minute TTL", () => {
    expect(CACHE_TTL_MS).toBe(1000 * 60);
  });

  it("invalidateAnalyticsCache does not throw when adminDb is null", async () => {
    // adminDb is already mocked as null by the project's test setup.
    // This verifies the function handles a missing db gracefully.
    await expect(invalidateAnalyticsCache("ws1", "test")).resolves.toBeUndefined();
  });
});
