import "server-only";
import PDFDocument from "pdfkit";
import type { AnalyticsOverview, PlatformSeriesPoint } from "@/lib/db/analytics";
import type { PlatformId } from "@/lib/db/schema";

const PLATFORM_LABELS: Record<PlatformId, string> = {
  twitter: "X (Twitter)",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  threads: "Threads",
  pinterest: "Pinterest",
  bluesky: "Bluesky",
  discord: "Discord",
  telegram: "Telegram",
  google_business: "Google Business",
};

export interface RenderReportPdfInput {
  reportName: string;
  template: string;
  dateRange: { from: string; to: string };
  generatedAt: string;
  overview: AnalyticsOverview;
  platformSeries: Record<PlatformId, PlatformSeriesPoint[]>;
  branding?: { accentColor?: string; footerText?: string };
}

const ACCENT_FALLBACK = "#2563eb";

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "0%";
  return `${(n * 100).toFixed(2)}%`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function parseHex(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [37, 99, 235];
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

export async function renderReportPdf(input: RenderReportPdfInput): Promise<Buffer> {
  const accent = parseHex(input.branding?.accentColor ?? ACCENT_FALLBACK);
  const footerText = input.branding?.footerText?.trim() || "Generated with PostPlanify";

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 56, bottom: 64, left: 56, right: 56 },
      info: {
        Title: input.reportName,
        Author: "PostPlanify",
        Subject: `${input.template} report`,
        CreationDate: new Date(input.generatedAt),
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // ---- Header ----
    doc
      .fillColor("#0f172a")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("PostPlanify", { continued: false });
    doc
      .moveDown(0.2)
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#64748b")
      .text("Analytics Report", { characterSpacing: 1 });

    doc.moveDown(1);
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#0f172a")
      .text(input.reportName, { width: pageWidth });
    doc
      .moveDown(0.3)
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#475569")
      .text(`${fmtDate(input.dateRange.from)} — ${fmtDate(input.dateRange.to)}`);
    doc
      .fontSize(9)
      .fillColor("#94a3b8")
      .text(`Generated ${fmtDate(input.generatedAt)} • Template: ${input.template}`);

    // Accent rule
    doc.moveDown(0.8);
    const ruleY = doc.y;
    doc
      .moveTo(doc.page.margins.left, ruleY)
      .lineTo(doc.page.margins.left + 64, ruleY)
      .lineWidth(3)
      .strokeColor([accent[0], accent[1], accent[2]])
      .stroke();
    doc.moveDown(1);

    // ---- Totals ----
    const t = input.overview.totals;
    const kpis: Array<[string, string]> = [
      ["Followers", fmtNum(t.followers)],
      ["Engagement", fmtPct(t.engagementRate)],
      ["Impressions", fmtNum(t.impressions)],
      ["Likes", fmtNum(t.likes)],
      ["Comments", fmtNum(t.comments)],
      ["Shares", fmtNum(t.shares)],
      ["Clicks", fmtNum(t.clicks)],
      ["Posts Published", fmtNum(t.postsPublished)],
    ];
    const cols = 4;
    const cellW = (pageWidth - (cols - 1) * 8) / cols;
    const cellH = 56;
    const kpiStartY = doc.y;
    kpis.forEach(([label, value], idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = doc.page.margins.left + col * (cellW + 8);
      const y = kpiStartY + row * (cellH + 8);
      doc
        .roundedRect(x, y, cellW, cellH, 6)
        .fillAndStroke("#f8fafc", "#e2e8f0");
      doc
        .fillColor("#94a3b8")
        .font("Helvetica")
        .fontSize(8)
        .text(label.toUpperCase(), x + 10, y + 10, { width: cellW - 20, characterSpacing: 1 });
      doc
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(value, x + 10, y + 24, { width: cellW - 20 });
    });
    doc.y = kpiStartY + Math.ceil(kpis.length / cols) * (cellH + 8);

    // ---- By Platform table ----
    doc.moveDown(1.2);
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#0f172a")
      .text("By Platform");
    doc.moveDown(0.4);

    const colWidths = [pageWidth * 0.4, pageWidth * 0.2, pageWidth * 0.2, pageWidth * 0.2];
    const headers = ["Platform", "Followers", "Impressions", "Engagement"];
    let y = doc.y;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#475569");
    headers.forEach((h, i) => {
      const x = doc.page.margins.left + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(h.toUpperCase(), x, y, { width: colWidths[i], characterSpacing: 1 });
    });
    y += 18;
    doc
      .moveTo(doc.page.margins.left, y - 4)
      .lineTo(doc.page.margins.left + pageWidth, y - 4)
      .lineWidth(0.5)
      .strokeColor("#cbd5e1")
      .stroke();

    doc.font("Helvetica").fontSize(10).fillColor("#0f172a");
    for (const row of input.overview.byPlatform) {
      if (y + 18 > doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      const cells = [
        PLATFORM_LABELS[row.platform] ?? row.platform,
        fmtNum(row.followers),
        fmtNum(row.impressions),
        fmtPct(row.engagementRate),
      ];
      cells.forEach((c, i) => {
        const x = doc.page.margins.left + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.fillColor(i === 0 ? "#0f172a" : "#334155").text(c, x, y, { width: colWidths[i] });
      });
      y += 16;
    }
    doc.y = y + 8;

    // ---- Time series (text grid per platform) ----
    const platforms = Object.keys(input.platformSeries) as PlatformId[];
    for (const p of platforms) {
      const series = input.platformSeries[p] ?? [];
      if (series.length === 0) continue;
      if (doc.y + 80 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#0f172a")
        .text(PLATFORM_LABELS[p] ?? p);
      doc.moveDown(0.3);

      // Render a compact 14-day grid of impressions as bar chars.
      const last14 = series.slice(-14);
      const max = Math.max(1, ...last14.map((s) => s.impressions));
      doc.font("Courier").fontSize(8).fillColor("#475569");
      const line = last14
        .map((s) => {
          const ratio = s.impressions / max;
          const bars = "▁▂▃▄▅▆▇█";
          const idx = Math.min(bars.length - 1, Math.floor(ratio * bars.length));
          return bars[idx];
        })
        .join("");
      doc.text(`Impressions (last ${last14.length}d): ${line}`, { width: pageWidth });
      const totals = last14.reduce(
        (acc, s) => ({
          impressions: acc.impressions + s.impressions,
          likes: acc.likes + s.likes,
          comments: acc.comments + s.comments,
        }),
        { impressions: 0, likes: 0, comments: 0 }
      );
      doc.text(
        `Totals: ${fmtNum(totals.impressions)} imp • ${fmtNum(totals.likes)} likes • ${fmtNum(totals.comments)} comments`,
        { width: pageWidth }
      );
      doc.moveDown(0.6);
    }

    // ---- Footer on every page ----
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const bottom = doc.page.height - doc.page.margins.bottom + 24;
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#94a3b8")
        .text(
          footerText,
          doc.page.margins.left,
          bottom,
          { width: pageWidth, align: "left", lineBreak: false }
        );
      doc.text(
        `Page ${i - range.start + 1} of ${range.count}`,
        doc.page.margins.left,
        bottom,
        { width: pageWidth, align: "right", lineBreak: false }
      );
    }

    doc.end();
  });
}
