import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch at the module level before importing the service.
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { normalizePlatformAnalytics } = await import("@/lib/uploadpost/analytics");
const analytics = await import("@/lib/uploadpost/analytics");

describe("normalizePlatformAnalytics", () => {
  it("uses primary_impressions_field when provided", () => {
    const raw = {
      followers: 1200,
      reach: 50000,
      views: 90000,
      impressions: 40000,
      likes: 1000,
      comments: 50,
      shares: 20,
      saves: 10,
      primary_impressions_field: "views",
      metric_type: "views",
    };
    const n = normalizePlatformAnalytics("tiktok", raw, null);
    expect(n.impressionsPrimary).toBe(90000); // views alias, not impressions
    expect(n.followers).toBe(1200);
    expect(n.engagements).toBe(1080);
    expect(n.engagementRate).toBeCloseTo((1080 / 90000) * 100, 5);
  });

  it("falls back to reach when metric_type is reach", () => {
    const raw = {
      followers: 500,
      reach: 30000,
      impressions: 1000,
      likes: 200,
      comments: 10,
      shares: 5,
      metric_type: "reach",
    };
    const n = normalizePlatformAnalytics("linkedin", raw, null);
    expect(n.impressionsPrimary).toBe(30000);
  });

  it("returns nulls (never 0) when raw is missing", () => {
    const n = normalizePlatformAnalytics("instagram", null, null, "not_connected", "no data");
    expect(n.followers).toBeNull();
    expect(n.impressionsPrimary).toBeNull();
    expect(n.engagementRate).toBeNull();
    expect(n.status).toBe("not_connected");
    expect(n.errorMessage).toBe("no data");
  });

  it("does not fabricate clicks when not provided", () => {
    const raw = { impressions: 1000, likes: 10, comments: 1, shares: 1 };
    const n = normalizePlatformAnalytics("instagram", raw, null);
    expect(n.clicks).toBeNull();
  });

  it("classifies pinterest via impressions primary field, no fabricated clicks", () => {
    const raw = {
      followers: 300,
      impressions: 5000,
      likes: 40,
      saves: 30,
      primary_impressions_field: "impressions",
    };
    const n = normalizePlatformAnalytics("pinterest", raw, null);
    expect(n.impressionsPrimary).toBe(5000);
    expect(n.followers).toBe(300);
    expect(n.clicks).toBeNull();
  });

  it("builds a sorted timeseries from reach_timeseries", () => {
    const raw = {
      followers: 10,
      reach_timeseries: { "2026-07-03": 3, "2026-07-01": 1, "2026-07-02": 2 },
    };
    const n = normalizePlatformAnalytics("x", raw, null);
    expect(n.timeseries.map((p) => p.date)).toEqual(["2026-07-01", "2026-07-02", "2026-07-03"]);
    expect(n.timeseries.map((p) => p.value)).toEqual([1, 2, 3]);
  });

  it("maps the live reach_timeseries array response", () => {
    const raw = {
      followers: 3,
      reach_timeseries: [
        { date: "2026-07-02", value: 12 },
        { date: "2026-07-01", value: 8 },
      ],
    };
    const n = normalizePlatformAnalytics("instagram", raw, null);
    expect(n.timeseries).toEqual([
      { date: "2026-07-01", value: 8 },
      { date: "2026-07-02", value: 12 },
    ]);
  });
});

describe("isAnalyticsSupported", () => {
  it("supports major platforms", () => {
    expect(analytics.isAnalyticsSupported("instagram")).toBe(true);
    expect(analytics.isAnalyticsSupported("twitter")).toBe(true);
  });
  it("marks discord/telegram/google_business as unsupported", () => {
    expect(analytics.isAnalyticsSupported("discord")).toBe(false);
    expect(analytics.isAnalyticsSupported("telegram")).toBe(false);
    expect(analytics.isAnalyticsSupported("google_business")).toBe(false);
  });
});

describe("getProfileAnalytics — network + honest status", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });
  afterEach(() => {
    fetchMock.mockReset();
  });

  it("returns ok normalized platforms on 200 with data", async () => {
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          instagram: {
            followers: 1000,
            reach: 50000,
            impressions: 70000,
            likes: 500,
            comments: 20,
            shares: 10,
            saves: 5,
            primary_impressions_field: "reach",
            reach_timeseries: [{ date: "2026-07-22", value: 50 }],
          },
        }),
    }));

    const result = await analytics.getProfileAnalytics("key", "ws1", ["instagram", "tiktok"]);
    expect(result.length).toBe(2);
    const ig = result.find((p) => p.platform === "instagram");
    expect(ig?.status).toBe("ok");
    expect(ig?.impressionsPrimary).toBe(50000);
    expect(ig?.engagements).toBe(535);
    expect(ig?.timeseries).toEqual([{ date: "2026-07-22", value: 50 }]);
    const tt = result.find((p) => p.platform === "tiktok");
    expect(tt?.status).toBe("not_connected");
  });

  it("preserves platform-level failures returned inside a 200 response", async () => {
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          linkedin: {
            success: false,
            linkedin_personal_unsupported: true,
            message: "LinkedIn personal analytics are not supported.",
          },
          facebook: {
            success: false,
            message: "Query parameter page_id is required.",
          },
        }),
    }));

    const result = await analytics.getProfileAnalytics("key", "ws1", ["linkedin", "facebook"]);
    expect(result[0].status).toBe("unsupported");
    expect(result[0].errorMessage).toContain("not supported");
    expect(result[1].status).toBe("error");
    expect(result[1].errorMessage).toContain("page_id");
  });

  it("classifies 401 as token_expired for all platforms", async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: "token expired" }),
    }));
    const result = await analytics.getProfileAnalytics("key", "ws1", ["instagram"]);
    expect(result[0].status).toBe("token_expired");
    expect(result[0].errorMessage).toBe("token expired");
  });

  it("classifies 404 as not_connected", async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ message: "not found" }),
    }));
    const result = await analytics.getProfileAnalytics("key", "ws1", ["x"]);
    expect(result[0].status).toBe("not_connected");
  });
});

describe("getUnifiedAnalytics — breakdown aggregation", () => {
  beforeEach(() => fetchMock.mockReset());
  afterEach(() => fetchMock.mockReset());

  it("aggregates engagement rate from breakdown totals", async () => {
    fetchMock
      .mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            impressions: 60000,
            likes: 600,
            comments: 40,
            shares: 20,
            breakdown: {
              instagram: { followers: 1000, impressions: 50000, likes: 500, comments: 20, shares: 10, saves: 5 },
              tiktok: { followers: 200, impressions: 10000, likes: 100, comments: 20, shares: 10 },
            },
          }),
      }));

    const res = await analytics.getUnifiedAnalytics(
      "key",
      "ws1",
      { from: new Date("2026-07-01"), to: new Date("2026-07-31") },
      true,
    );
    expect(res.status).toBe("ok");
    expect(res.impressions).toBe(60000);
    expect(res.byPlatform.length).toBe(2);
    const ig = res.byPlatform.find((p) => p.platform === "instagram");
    expect(ig?.impressionsPrimary).toBe(50000);
    // (600+40+20)/60000*100 = 1.1%
    expect(res.engagementRate).toBeCloseTo(1.1, 5);
  });

  it("maps the live total-impressions response", async () => {
    fetchMock
      .mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            total_impressions: 31175,
            per_platform: {
              instagram: 968,
              tiktok: 29794,
              threads: 327,
            },
            per_day: {
              "2026-07-21": 3931,
              "2026-07-22": 3955,
            },
          }),
      }));

    const res = await analytics.getUnifiedAnalytics(
      "key",
      "ws1",
      { from: new Date("2026-06-22"), to: new Date("2026-07-22") },
      true,
    );
    expect(res.status).toBe("ok");
    expect(res.impressions).toBe(31175);
    expect(res.byPlatform.find((p) => p.platform === "instagram")?.impressionsPrimary).toBe(968);
    expect(res.byPlatform.find((p) => p.platform === "tiktok")?.impressionsPrimary).toBe(29794);
  });

  it("returns error status with nulls on 500 (never zeros)", async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ message: "boom" }),
    }));
    const res = await analytics.getUnifiedAnalytics("key", "ws1", {
      from: new Date("2026-07-01"),
      to: new Date("2026-07-31"),
    });
    expect(res.status).toBe("error");
    expect(res.impressions).toBeNull();
    expect(res.likes).toBeNull();
    expect(res.byPlatform).toEqual([]);
  });
});

describe("getPostAnalyticsByRequestId", () => {
  beforeEach(() => fetchMock.mockReset());
  afterEach(() => fetchMock.mockReset());

  it("maps post analytics fields correctly", async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          request_id: "abc",
          platform: "instagram",
          impressions: 12345,
          likes: 200,
          comments: 10,
          shares: 5,
          saves: 3,
        }),
    }));
    const res = await analytics.getPostAnalyticsByRequestId("key", "abc", "instagram");
    expect(res.status).toBe("ok");
    expect(res.impressions).toBe(12345);
    expect(res.likes).toBe(200);
    expect(res.platform).toBe("instagram");
  });

  it("returns not_connected/token_expired honestly on failure", async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ message: "forbidden" }),
    }));
    const res = await analytics.getPostAnalyticsByRequestId("key", "abc", "instagram");
    expect(res.status).toBe("token_expired");
    expect(res.impressions).toBeNull();
  });
});

describe("analytics normalization edge cases", () => {
  it("defaults postsPublished to 0 from service level", async () => {
    fetchMock
      .mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ impressions: 100, breakdown: {} }),
      }));

    const res = await analytics.getUnifiedAnalytics("key", "ws1", {
      from: new Date("2026-07-01"),
      to: new Date("2026-07-31"),
    });
    expect(res.postsPublished).toBe(0);
  });

  it("handles unsupported platforms cleanly in helper check", () => {
    expect(analytics.UNSUPPORTED_ANALYTICS_PLATFORMS).toContain("discord");
    expect(analytics.UNSUPPORTED_ANALYTICS_PLATFORMS).toContain("telegram");
    expect(analytics.UNSUPPORTED_ANALYTICS_PLATFORMS).toContain("google_business");
  });
});

