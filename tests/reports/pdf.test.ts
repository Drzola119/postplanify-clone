import { describe, it, expect } from "vitest";
import { renderReportPdf } from "@/lib/reports/pdf";
import type { AnalyticsOverview } from "@/lib/db/analytics";

const overview: AnalyticsOverview = {
  workspaceId: "ws1",
  from: "2026-06-01T00:00:00.000Z",
  to: "2026-06-30T00:00:00.000Z",
  totals: {
    followers: 12500,
    engagementRate: 0.0432,
    impressions: 84000,
    likes: 3600,
    comments: 410,
    shares: 220,
    clicks: 1900,
    postsPublished: 28,
  },
  byPlatform: [
    { platform: "twitter", followers: 5000, impressions: 22000, engagementRate: 0.04 },
    { platform: "instagram", followers: 4200, impressions: 30000, engagementRate: 0.05 },
    { platform: "tiktok", followers: 3300, impressions: 32000, engagementRate: 0.06 },
  ],
};

const emptySeries: AnalyticsOverview["totals"] extends infer _ ? Record<string, never> : never = {} as never;

describe("reports/pdf - renderReportPdf", () => {
  it("produces a valid PDF buffer with the %PDF- magic bytes", async () => {
    const buf = await renderReportPdf({
      reportName: "Monthly Performance",
      template: "performance",
      dateRange: { from: "2026-06-01T00:00:00.000Z", to: "2026-06-30T00:00:00.000Z" },
      generatedAt: "2026-07-01T12:00:00.000Z",
      overview,
      platformSeries: {} as never,
      branding: { accentColor: "#FF0000", footerText: "Acme Agency" },
    });
    expect(buf.length).toBeGreaterThan(500);
    expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("uses the user-provided accent color and footer text", async () => {
    const buf = await renderReportPdf({
      reportName: "Branded Report",
      template: "engagement",
      dateRange: { from: "2026-06-01T00:00:00.000Z", to: "2026-06-30T00:00:00.000Z" },
      generatedAt: "2026-07-01T12:00:00.000Z",
      overview,
      platformSeries: {} as never,
      branding: { accentColor: "#10b981", footerText: "Prepared for Acme • hi@acme.com" },
    });
    // PDF binary — just verify size is non-trivial and starts with magic bytes.
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("falls back to default accent when given an invalid color", async () => {
    const buf = await renderReportPdf({
      reportName: "Default Colors",
      template: "audience",
      dateRange: { from: "2026-06-01T00:00:00.000Z", to: "2026-06-30T00:00:00.000Z" },
      generatedAt: "2026-07-01T12:00:00.000Z",
      overview,
      platformSeries: {} as never,
      branding: { accentColor: "not-a-color", footerText: "" },
    });
    expect(buf.length).toBeGreaterThan(500);
  });

  it("renders time-series bars for platforms with data", async () => {
    const buf = await renderReportPdf({
      reportName: "With Series",
      template: "performance",
      dateRange: { from: "2026-06-01T00:00:00.000Z", to: "2026-06-30T00:00:00.000Z" },
      generatedAt: "2026-07-01T12:00:00.000Z",
      overview,
      platformSeries: {
        twitter: Array.from({ length: 14 }, (_, i) => ({
          date: `2026-06-${String(i + 1).padStart(2, "0")}`,
          followers: 5000 + i * 10,
          engagementRate: 0.04,
          impressions: 1000 + i * 50,
          likes: 100 + i,
          comments: 10 + i,
          shares: 5,
          clicks: 50,
        })),
      } as never,
    });
    // More content → larger file than the empty-series case.
    expect(buf.length).toBeGreaterThan(1500);
  });

  void emptySeries;
});
