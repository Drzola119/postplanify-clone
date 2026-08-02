"use client";

/**
 * Client view for the A/B comparison page.
 *
 * Renders:
 *   - Header with both variant titles + status
 *   - Side-by-side metric tiles (likes, comments, shares, saves, eng)
 *   - Hand-rolled bar chart (one bar per metric, A vs B)
 *   - "Recompute winner" button that calls /api/carousels/ab-test/compare
 *   - "Sync stats" buttons for each side
 *
 * The chart is hand-rolled SVG so we don't take a runtime hit on the
 * recharts bundle for a 5-bar widget. Max-width per bar is computed
 * against the max value in each metric so the relative shape is always
 * readable.
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  TrendingUp,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { showToast } from "@/components/ui/toast";
import type { CarouselRecord } from "@/lib/carousel-gen/analytics-types";

interface AbCompareViewProps {
  a: CarouselRecord;
  b: CarouselRecord;
}

interface MetricRow {
  key: "likes" | "comments" | "shares" | "saves" | "engagementRate";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  aValue: number;
  bValue: number;
  unit?: string;
}

export function AbCompareView({ a: initialA, b: initialB }: AbCompareViewProps) {
  const [a, setA] = useState<CarouselRecord>(initialA);
  const [b, setB] = useState<CarouselRecord>(initialB);
  const [syncing, setSyncing] = useState<"A" | "B" | null>(null);
  const [recomputing, setRecomputing] = useState(false);

  async function handleSync(side: "A" | "B") {
    const target = side === "A" ? a : b;
    setSyncing(side);
    try {
      const res = await fetch("/api/carousels/sync-performance", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carouselId: target.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(data.error?.message ?? "Sync failed");
      }
      const data = (await res.json()) as
        | { ok: true; performance: NonNullable<CarouselRecord["performance"]> }
        | { ok: false; reason: string; message: string };
      if (data.ok) {
        if (side === "A") {
          setA((curr) => ({ ...curr, performance: data.performance }));
        } else {
          setB((curr) => ({ ...curr, performance: data.performance }));
        }
        showToast({ tone: "success", title: `Variant ${side} stats synced` });
      } else {
        showToast({ tone: "error", title: data.message ?? "Sync failed" });
      }
    } catch (err) {
      showToast({ tone: "error", title: err instanceof Error ? err.message : "Sync failed" });
    } finally {
      setSyncing(null);
    }
  }

  async function handleRecompute() {
    if (!a.variantGroupId) return;
    setRecomputing(true);
    try {
      const res = await fetch(
        `/api/carousels/ab-test/compare?variantGroupId=${encodeURIComponent(a.variantGroupId)}`,
        { credentials: "include", cache: "no-store" }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(data.error?.message ?? "Recompute failed");
      }
      const data = (await res.json()) as {
        a: CarouselRecord;
        b: CarouselRecord;
        winner: "A" | "B" | null;
      };
      setA(data.a);
      setB(data.b);
      if (data.winner) {
        showToast({ tone: "success", title: `Variant ${data.winner} is winning` });
      } else {
        showToast({
          tone: "info",
          title: "Not enough data yet — both need 100+ impressions to declare a winner",
        });
      }
    } catch (err) {
      showToast({ tone: "error", title: err instanceof Error ? err.message : "Recompute failed" });
    } finally {
      setRecomputing(false);
    }
  }

  const rows: MetricRow[] = [
    {
      key: "likes",
      label: "Likes",
      icon: Heart,
      aValue: a.performance?.likes ?? 0,
      bValue: b.performance?.likes ?? 0,
    },
    {
      key: "comments",
      label: "Comments",
      icon: MessageCircle,
      aValue: a.performance?.comments ?? 0,
      bValue: b.performance?.comments ?? 0,
    },
    {
      key: "shares",
      label: "Shares",
      icon: Repeat2,
      aValue: a.performance?.shares ?? 0,
      bValue: b.performance?.shares ?? 0,
    },
    {
      key: "saves",
      label: "Saves",
      icon: Bookmark,
      aValue: a.performance?.saves ?? 0,
      bValue: b.performance?.saves ?? 0,
    },
    {
      key: "engagementRate",
      label: "Engagement rate",
      icon: TrendingUp,
      aValue: a.performance?.engagementRate ?? 0,
      bValue: b.performance?.engagementRate ?? 0,
      unit: "%",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/carousels"
            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <ArrowLeft className="size-3" /> Hub
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">A/B comparison</h1>
            <p className="text-[11px] text-zinc-500">
              Group <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px]">{a.variantGroupId}</code>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRecompute}
          disabled={recomputing}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {recomputing ? <Loader2 className="size-3 animate-spin" /> : <Trophy className="size-3" />}
          Recompute winner
        </button>
      </div>

      {/* Variant tiles */}
      <div className="grid gap-3 sm:grid-cols-2">
        <VariantTile
          record={a}
          label="A"
          onSync={() => void handleSync("A")}
          syncing={syncing === "A"}
        />
        <VariantTile
          record={b}
          label="B"
          onSync={() => void handleSync("B")}
          syncing={syncing === "B"}
        />
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">Side-by-side metrics</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Bar widths are scaled to the max value within each metric, so the
          longer bar is the leader for that metric.
        </p>
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <BarRow key={row.key} row={row} />
          ))}
        </div>
      </div>

      {/* Minimum impressions callout */}
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-600">
        <Sparkles className="inline size-3 me-1" />
        A winner is declared once both variants cross 100 impressions. Until
        then, the comparison is directional — small samples can flip.
      </div>
    </div>
  );
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function VariantTile({
  record,
  label,
  onSync,
  syncing,
}: {
  record: CarouselRecord;
  label: "A" | "B";
  onSync: () => void;
  syncing: boolean;
}) {
  const isWinner = record.variantWinner === true;
  const perf = record.performance;
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white ${
        isWinner ? "border-amber-300 ring-1 ring-amber-200" : "border-zinc-200"
      }`}
    >
      <div className="grid grid-cols-[120px_1fr] gap-3 p-3">
        <div className="aspect-[3/4] overflow-hidden rounded-md bg-zinc-100">
          {record.mediaUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={record.mediaUrls[0]}
              alt={record.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-zinc-300">
              <Sparkles className="size-4" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {label}
            </span>
            {isWinner ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                <Trophy className="size-2.5" /> Winner
              </span>
            ) : null}
            <span className="text-[10px] text-zinc-500">{record.status}</span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-zinc-900">{record.title}</p>
          <p className="text-[11px] text-zinc-500">
            {record.slideCount} slides · {perf?.platform ?? "no platform yet"}
          </p>
          {perf ? (
            <p className="mt-1 text-[11px] text-zinc-500">
              Last synced {new Date(perf.lastSyncedAt).toLocaleString()}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-amber-700">
              No metrics yet — schedule + publish this variant to start tracking.
            </p>
          )}
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="mt-2 inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
            Sync stats
          </button>
        </div>
      </div>
    </div>
  );
}

function BarRow({ row }: { row: MetricRow }) {
  const max = Math.max(row.aValue, row.bValue, 1);
  const aPct = (row.aValue / max) * 100;
  const bPct = (row.bValue / max) * 100;
  const aWins = row.aValue > row.bValue;
  const bWins = row.bValue > row.aValue;
  const Icon = row.icon;
  const format = (n: number) =>
    row.unit === "%" ? n.toFixed(2) : n.toLocaleString();
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-600">
        <span className="inline-flex items-center gap-1 font-medium">
          <Icon className="size-3" />
          {row.label}
        </span>
        <span className="font-mono text-[10px] text-zinc-500">
          A {format(row.aValue)}{row.unit ?? ""} · B {format(row.bValue)}{row.unit ?? ""}
        </span>
      </div>
      <div className="space-y-0.5">
        <Bar pct={aPct} wins={aWins} label="A" value={row.aValue} unit={row.unit} />
        <Bar pct={bPct} wins={bWins} label="B" value={row.bValue} unit={row.unit} />
      </div>
    </div>
  );
}

function Bar({
  pct,
  wins,
  label,
  value,
  unit,
}: {
  pct: number;
  wins: boolean;
  label: "A" | "B";
  value: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 shrink-0 text-[10px] font-semibold text-zinc-500">
        {label}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all ${
            wins ? "bg-emerald-500" : "bg-zinc-300"
          }`}
          style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-end font-mono text-[10px] text-zinc-700">
        {value.toLocaleString()}
        {unit ?? ""}
      </span>
    </div>
  );
}
