/**
 * GET /api/carousels/analytics
 *
 * F9 — Aggregated carousel analytics for the workspace. Powers the
 * "Carousels" section of /dashboard/analytics. Returns:
 *   - totals: count + cost (this month / all time)
 *   - byStatus: count per status bucket
 *   - byStyle: count per styleId (top 6)
 *   - byMonth: monthly count for the last 6 months
 *
 * All data is computed server-side from the same `carousels` collection
 * the list endpoint reads, so the two stay in lockstep.
 */
import "server-only";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";

const logger = createLogger("api:carousels:analytics");

interface CarouselRecord {
  id: string;
  status: "scheduled" | "draft" | "published";
  styleId: string | null;
  slideCount: number;
  costUsd: number;
  createdAt: number;
}

function toMillis(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const ts = v as { toMillis?: () => number; _seconds?: number };
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts._seconds === "number") return ts._seconds * 1000;
  return 0;
}

function monthKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function lastNMonthKeys(n: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  try {
    // Pull the same record set the list endpoint exposes. For very
    // large workspaces (>5000 records) this would need to switch to
    // aggregation queries, but that's not the current case.
    const snap = await adminDb
      .collection("workspaces")
      .doc(session.workspaceId)
      .collection("carousels")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    const records: CarouselRecord[] = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        status: (data.status as CarouselRecord["status"]) ?? "draft",
        styleId: typeof data.styleId === "string" ? data.styleId : null,
        slideCount: typeof data.slideCount === "number" ? data.slideCount : 0,
        costUsd: typeof data.costUsd === "number" ? data.costUsd : 0,
        createdAt: toMillis(data.createdAt) || 0,
      };
    });

    const now = Date.now();
    const monthStart = (() => {
      const d = new Date();
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    })();

    const thisMonth = records.filter((r) => r.createdAt >= monthStart);

    const byStatus: Record<string, number> = { draft: 0, scheduled: 0, published: 0 };
    for (const r of records) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

    const byStyle: Record<string, number> = {};
    for (const r of records) {
      const key = r.styleId ?? "default";
      byStyle[key] = (byStyle[key] ?? 0) + 1;
    }
    const topStyles = Object.entries(byStyle)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([styleId, count]) => ({ styleId, count }));

    const monthKeys = lastNMonthKeys(6);
    const byMonth: Record<string, number> = Object.fromEntries(monthKeys.map((k) => [k, 0]));
    for (const r of records) {
      if (r.createdAt === 0) continue;
      const k = monthKey(r.createdAt);
      if (k in byMonth) byMonth[k] = (byMonth[k] ?? 0) + 1;
    }

    const totalCost = records.reduce((s, r) => s + r.costUsd, 0);
    const thisMonthCost = thisMonth.reduce((s, r) => s + r.costUsd, 0);
    const totalSlides = records.reduce((s, r) => s + r.slideCount, 0);

    return jsonOk({
      totals: {
        allTime: records.length,
        thisMonth: thisMonth.length,
        totalSlides,
        totalCostUsd: Number(totalCost.toFixed(4)),
        thisMonthCostUsd: Number(thisMonthCost.toFixed(4)),
        asOf: now,
      },
      byStatus,
      topStyles,
      byMonth: monthKeys.map((k) => ({ month: k, count: byMonth[k] ?? 0 })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Carousel analytics failed", {
      workspaceId: session.workspaceId,
      error: message,
    });
    return jsonError(500, message);
  }
}
