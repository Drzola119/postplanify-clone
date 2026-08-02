"use client";

/**
 * Carousel analytics view (F9).
 *
 * Fetches /api/carousels/analytics + /api/carousels/list in parallel
 * and renders four hand-rolled SVG cards (the same visual style as
 * the rest of the analytics page — no recharts dependency for this
 * light surface). Also lists the most recent carousels below the
 * charts so the user can jump back into the wizard for any record.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Layers, Calendar, Sparkles, DollarSign } from "lucide-react";

interface AnalyticsResponse {
  totals: {
    allTime: number;
    thisMonth: number;
    totalSlides: number;
    totalCostUsd: number;
    thisMonthCostUsd: number;
    asOf: number;
  };
  byStatus: { draft: number; scheduled: number; published: number };
  topStyles: Array<{ styleId: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
}

interface CarouselRecord {
  id: string;
  title: string;
  status: "scheduled" | "draft" | "published";
  mediaUrls: string[];
  slideCount: number;
  costUsd: number;
  createdAt: number;
}

export function CarouselAnalyticsView() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [items, setItems] = useState<CarouselRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [a, l] = await Promise.all([
          fetch("/api/carousels/analytics", { credentials: "include", cache: "no-store" }),
          fetch("/api/carousels/list", { credentials: "include", cache: "no-store" }),
        ]);
        if (!a.ok) throw new Error(`Analytics failed (${a.status})`);
        if (!l.ok) throw new Error(`List failed (${l.status})`);
        const aData = (await a.json()) as Partial<AnalyticsResponse> & { ok?: boolean; error?: { message?: string } };
        const lData = (await l.json()) as { items?: CarouselRecord[]; ok?: boolean; error?: { message?: string } };
        if (cancelled) return;
        if (aData.totals) setAnalytics(aData as AnalyticsResponse);
        if (lData.items) setItems(lData.items);
        if (!aData.totals && aData.error) throw new Error(aData.error.message ?? "Failed");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="size-4 animate-spin" />
        Loading carousel analytics…
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!analytics) return null;

  return (
    <div className="mt-6 space-y-6">
      {/* Summary tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          icon={<Layers className="size-4" />}
          label="Decks (all time)"
          value={analytics.totals.allTime.toString()}
          hint={`${analytics.totals.totalSlides} slides total`}
          accent="bg-violet-50 text-violet-700"
        />
        <Tile
          icon={<Calendar className="size-4" />}
          label="This month"
          value={analytics.totals.thisMonth.toString()}
          hint={`${analytics.byStatus.scheduled ?? 0} scheduled`}
          accent="bg-amber-50 text-amber-700"
        />
        <Tile
          icon={<Sparkles className="size-4" />}
          label="Published"
          value={(analytics.byStatus.published ?? 0).toString()}
          hint={`${analytics.byStatus.draft ?? 0} drafts`}
          accent="bg-emerald-50 text-emerald-700"
        />
        <Tile
          icon={<DollarSign className="size-4" />}
          label="Spend (all time)"
          value={`$${analytics.totals.totalCostUsd.toFixed(2)}`}
          hint={`$${analytics.totals.thisMonthCostUsd.toFixed(2)} this month`}
          accent="bg-zinc-100 text-zinc-700"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-900">Decks by month</p>
          <p className="mt-0.5 text-xs text-zinc-500">Last 6 months</p>
          <MonthBars data={analytics.byMonth} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-900">Top styles</p>
          <p className="mt-0.5 text-xs text-zinc-500">By deck count</p>
          <StyleBars data={analytics.topStyles} />
        </div>
      </div>

      {/* Recent carousels */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900">Recent carousels</p>
          <Link
            href="/dashboard/carousels"
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            View all →
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="mt-3 text-xs text-zinc-500">
            No carousels yet. Create your first one from the{" "}
            <Link href="/dashboard/carousels" className="underline">
              carousel hub
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {items.slice(0, 6).map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-2.5"
              >
                <Thumb url={c.mediaUrls[0]} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-zinc-900">
                    {c.title}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {c.slideCount} slides · ${c.costUsd.toFixed(2)} ·{" "}
                    <StatusBadge status={c.status} />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className={`inline-flex size-8 items-center justify-center rounded-lg ${accent}`}>
        {icon}
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">{hint}</p>
    </div>
  );
}

function MonthBars({ data }: { data: Array<{ month: string; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="mt-4 flex h-40 items-end gap-2">
      {data.map((d) => {
        const h = (d.count / max) * 100;
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="relative w-full" style={{ height: "100%" }}>
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 rounded-t-sm bg-violet-500"
                style={{ height: `${h}%`, minHeight: d.count > 0 ? 4 : 0 }}
                aria-label={`${d.month}: ${d.count}`}
              />
              {d.count > 0 ? (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold tabular-nums text-zinc-700">
                  {d.count}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] text-zinc-500 tabular-nums">{shortMonth(d.month)}</span>
          </div>
        );
      })}
    </div>
  );
}

function StyleBars({ data }: { data: Array<{ styleId: string; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (data.length === 0) {
    return <p className="mt-4 text-xs text-zinc-500">No style data yet.</p>;
  }
  return (
    <ul className="mt-4 space-y-2">
      {data.map((d) => {
        const w = (d.count / max) * 100;
        return (
          <li key={d.styleId} className="flex items-center gap-2">
            <span className="w-32 shrink-0 truncate text-xs text-zinc-700">
              {d.styleId === "default" ? "Default" : d.styleId}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full bg-violet-500"
                style={{ width: `${w}%` }}
                aria-hidden
              />
            </div>
            <span className="w-8 text-right text-[11px] font-medium tabular-nums text-zinc-700">
              {d.count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Thumb({ url }: { url?: string }) {
  if (!url) {
    return (
      <div className="flex size-12 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50">
        <Layers className="size-4 text-zinc-400" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="size-12 rounded-md border border-zinc-200 object-cover"
    />
  );
}

function StatusBadge({ status }: { status: CarouselRecord["status"] }) {
  const cls =
    status === "published"
      ? "text-emerald-700"
      : status === "scheduled"
        ? "text-violet-700"
        : "text-zinc-500";
  return <span className={`font-medium ${cls}`}>{status}</span>;
}

function shortMonth(key: string): string {
  const [, m] = key.split("-");
  if (!m) return key;
  return new Date(Date.UTC(2000, Number(m) - 1, 1)).toLocaleString("en", { month: "short" });
}
