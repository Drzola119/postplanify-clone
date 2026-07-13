import { describe, it, expect } from "vitest";
import {
  dateRangeSchema,
  analyticsOverviewQuerySchema,
  analyticsPlatformQuerySchema,
  analyticsPostQuerySchema,
  analyticsIngestSchema,
} from "@/lib/validation/analytics";
import { parseValue, parseSearchParams } from "@/lib/validation/helpers";

describe("validation/analytics - dateRangeSchema", () => {
  it("accepts a valid 7-day range", () => {
    const r = parseValue(
      {
        from: "2026-07-01T00:00:00Z",
        to: "2026-07-08T00:00:00Z",
      },
      dateRangeSchema
    );
    expect(r.ok).toBe(true);
  });

  it("rejects when from >= to", () => {
    const r = parseValue(
      { from: "2026-07-08T00:00:00Z", to: "2026-07-01T00:00:00Z" },
      dateRangeSchema
    );
    expect(r.ok).toBe(false);
  });

  it("rejects when range > 18 months", () => {
    const r = parseValue(
      { from: "2020-01-01T00:00:00Z", to: "2026-01-01T00:00:00Z" },
      dateRangeSchema
    );
    expect(r.ok).toBe(false);
  });
});

describe("validation/analytics - analyticsOverviewQuerySchema", () => {
  it("applies via parseSearchParams", () => {
    const r = parseSearchParams(
      new URLSearchParams("from=2026-07-01&to=2026-07-08"),
      analyticsOverviewQuerySchema
    );
    expect(r.ok).toBe(true);
  });
});

describe("validation/analytics - analyticsPlatformQuerySchema", () => {
  it("accepts a date range", () => {
    const r = parseSearchParams(
      new URLSearchParams("from=2026-07-01&to=2026-07-08"),
      analyticsPlatformQuerySchema
    );
    expect(r.ok).toBe(true);
  });
});

describe("validation/analytics - analyticsPostQuerySchema", () => {
  it("requires non-empty postId", () => {
    const r = parseValue({}, analyticsPostQuerySchema);
    expect(r.ok).toBe(false);
    const r2 = parseValue({ postId: "p1" }, analyticsPostQuerySchema);
    expect(r2.ok).toBe(true);
  });
});

describe("validation/analytics - analyticsIngestSchema", () => {
  it("accepts a daily metrics payload", () => {
    const r = parseValue(
      {
        date: "2026-07-13",
        platform: "twitter",
        followers: 1000,
        engagementRate: 4.2,
        impressions: 50000,
        likes: 1200,
        comments: 80,
        shares: 30,
        clicks: 200,
      },
      analyticsIngestSchema
    );
    expect(r.ok).toBe(true);
  });

  it("rejects invalid platform", () => {
    const r = parseValue(
      { date: "2026-07-13", platform: "mastodon" },
      analyticsIngestSchema
    );
    expect(r.ok).toBe(false);
  });

  it("rejects engagementRate > 100", () => {
    const r = parseValue(
      { date: "2026-07-13", platform: "twitter", engagementRate: 150 },
      analyticsIngestSchema
    );
    expect(r.ok).toBe(false);
  });
});
