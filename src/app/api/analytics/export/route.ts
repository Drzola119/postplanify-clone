import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getOverview, getPlatformSeries } from "@/lib/db/analytics";
import { analyticsOverviewQuerySchema } from "@/lib/validation/analytics";
import { parseSearchParams } from "@/lib/validation/helpers";
import { getPlatform } from "@/lib/platforms";
import type { PlatformId } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALL_PLATFORMS: PlatformId[] = [
  "bluesky",
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "twitter",
  "linkedin",
  "threads",
  "facebook",
];

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, "\"\"")}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, analyticsOverviewQuerySchema);
  if (!parsed.ok || !parsed.data) {
    return NextResponse.json(
      { error: parsed.error?.message ?? "Invalid query" },
      { status: parsed.error?.status ?? 400 },
    );
  }

  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const overview = await getOverview(session.workspaceId, from, to);

  // Build a row per platform × day by reading each platform series.
  const seriesByPlatform = await Promise.all(
    ALL_PLATFORMS.map(async (p) => ({
      platform: p,
      series: await getPlatformSeries(session.workspaceId, p, from, to),
    })),
  );

  const lines: string[] = [];
  lines.push("section,date,platform,followers,impressions,engagement_rate,likes,comments,shares,clicks");

  // Summary rows per platform.
  for (const row of overview.byPlatform) {
    lines.push(
      [
        "summary",
        "",
        getPlatform(row.platform)?.name ?? row.platform,
        row.followers,
        row.impressions,
        row.engagementRate.toFixed(2),
        "",
        "",
        "",
        "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  // Daily rows for each platform.
  for (const { platform, series } of seriesByPlatform) {
    for (const point of series) {
      lines.push(
        [
          "daily",
          point.date,
          getPlatform(platform)?.name ?? platform,
          point.followers,
          point.impressions,
          point.engagementRate.toFixed(2),
          point.likes,
          point.comments,
          point.shares,
          point.clicks,
        ]
          .map(csvEscape)
          .join(","),
      );
    }
  }

  const csv = lines.join("\n");
  const filename = `analytics_${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}