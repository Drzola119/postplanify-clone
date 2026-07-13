import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

vi.mock("@/lib/firebase/admin", () => ({
  adminApp: { name: "mock" },
  adminAuth: null,
  adminDb: (globalThis as unknown as { __mockFs: MockFirestore }).__mockFs,
  SESSION_COOKIE: "pp_session",
  SESSION_MAX_AGE_MS: 432000000,
  createSessionCookie: vi.fn(async () => null),
  verifySessionCookie: vi.fn(async () => null),
  getCurrentUser: vi.fn(async () => null),
}));

beforeEach(() => {
  mockFs.reset();
});

describe("db/analytics - ingestDailyMetric + getPlatformSeries", () => {
  it("ingest then read returns the doc", async () => {
    const { ingestDailyMetric, getPlatformSeries } = await import("@/lib/db/analytics");
    const date = new Date(Date.UTC(2026, 6, 13)); // 2026-07-13
    await ingestDailyMetric("ws1", date, "twitter", {
      followers: 1000,
      engagementRate: 4.5,
      impressions: 50000,
      likes: 1200,
      comments: 80,
      shares: 30,
      clicks: 200,
    });
    const series = await getPlatformSeries("ws1", "twitter", date, date);
    expect(series.length).toBe(1);
    expect(series[0].followers).toBe(1000);
    expect(series[0].impressions).toBe(50000);
  });

  it("getPlatformSeries returns empty when no data", async () => {
    const { getPlatformSeries } = await import("@/lib/db/analytics");
    const from = new Date(Date.UTC(2026, 6, 13));
    const to = new Date(Date.UTC(2026, 6, 14));
    const series = await getPlatformSeries("ws1", "instagram", from, to);
    expect(series).toEqual([]);
  });

  it("ingest merges subsequent calls on the same day", async () => {
    const { ingestDailyMetric, getPlatformSeries } = await import("@/lib/db/analytics");
    const date = new Date(Date.UTC(2026, 6, 13));
    await ingestDailyMetric("ws1", date, "twitter", { likes: 100 });
    await ingestDailyMetric("ws1", date, "twitter", { impressions: 5000 });
    const series = await getPlatformSeries("ws1", "twitter", date, date);
    expect(series[0].likes).toBe(100);
    expect(series[0].impressions).toBe(5000);
  });
});

describe("db/analytics - getOverview", () => {
  it("returns empty overview when no data", async () => {
    const { getOverview } = await import("@/lib/db/analytics");
    const from = new Date(Date.UTC(2026, 6, 1));
    const to = new Date(Date.UTC(2026, 6, 7));
    const overview = await getOverview("ws1", from, to);
    expect(overview.workspaceId).toBe("ws1");
    expect(overview.byPlatform.length).toBe(9);
    expect(overview.totals.impressions).toBe(0);
  });

  it("aggregates impressions across platforms", async () => {
    const { getOverview, ingestDailyMetric } = await import("@/lib/db/analytics");
    const day = new Date(Date.UTC(2026, 6, 13));
    await ingestDailyMetric("ws1", day, "twitter", { impressions: 1000 });
    await ingestDailyMetric("ws1", day, "instagram", { impressions: 500 });
    const overview = await getOverview("ws1", day, day);
    expect(overview.totals.impressions).toBe(1500);
  });
});

describe("db/analytics - getPostMetrics", () => {
  it("returns null when no metrics", async () => {
    const { getPostMetrics } = await import("@/lib/db/analytics");
    const result = await getPostMetrics("ws1", "p1");
    expect(result).toBeNull();
  });

  it("returns metrics when they exist", async () => {
    const { getPostMetrics } = await import("@/lib/db/analytics");
    await mockFs
      .doc("workspaces/ws1/posts/p1/metrics/summary")
      .set({ impressions: 1000, likes: 50 });
    const result = await getPostMetrics("ws1", "p1");
    expect(result).not.toBeNull();
    expect(result?.impressions).toBe(1000);
    expect(result?.likes).toBe(50);
  });
});
