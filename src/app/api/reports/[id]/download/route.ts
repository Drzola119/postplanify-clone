import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getReport } from "@/lib/db/reports";
import { getOverview, getPlatformSeries, type PlatformSeriesPoint } from "@/lib/db/analytics";
import { renderReportPdf } from "@/lib/reports/pdf";
import { jsonError } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import type { PlatformId } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("reports/download");

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

function safeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9\-_. ]/gi, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "report";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await params;
  if (!id) return jsonError(400, "Missing report id");

  const report = await getReport(session.workspaceId, id);
  if (!report) return jsonError(404, "Report not found");

  const fromDate = new Date(report.dateRange.from);
  const toDate = new Date(report.dateRange.to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return jsonError(500, "Stored report has an invalid date range");
  }

  try {
    const overview = await getOverview(session.workspaceId, fromDate, toDate);
    const platformSeries: Record<PlatformId, PlatformSeriesPoint[]> = {} as Record<
      PlatformId,
      PlatformSeriesPoint[]
    >;
    await Promise.all(
      ALL_PLATFORMS.map(async (p) => {
        platformSeries[p] = await getPlatformSeries(session.workspaceId, p, fromDate, toDate);
      })
    );

    const buf = await renderReportPdf({
      reportName: report.name,
      template: report.template,
      dateRange: report.dateRange,
      generatedAt: report.generatedAt ?? new Date().toISOString(),
      overview,
      platformSeries,
    });

    const filename = `${safeFilename(report.name)}.pdf`;
    log.info("Generated PDF report", {
      reportId: report.id,
      bytes: buf.length,
      filename,
    });

    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buf.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    log.error(err, { reportId: report.id, route: "/api/reports/[id]/download" });
    return jsonError(500, err instanceof Error ? err.message : "PDF generation failed");
  }
}
