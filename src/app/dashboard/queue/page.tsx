"use client";

import { useEffect, useState } from "react";
import { ListChecks, Clock, Play, Pause, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { HealthPill } from "@/components/dashboard/health-pill";
import { EmptyState } from "@/components/dashboard/empty-state";

interface QueueRow {
  id: string;
  caption: string;
  platforms: string[];
  scheduledAt: string;
  status: string;
}

interface QueueResponse {
  due?: QueueRow[];
  upcoming?: QueueRow[];
}

function platformEmoji(platform: string): string {
  const map: Record<string, string> = {
    instagram: "📷",
    twitter: "🐦",
    x: "🐦",
    threads: "🧵",
    tiktok: "🎵",
    linkedin: "💼",
    facebook: "📘",
    youtube: "▶️",
    pinterest: "📌",
    bluesky: "🦋",
  };
  return map[platform.toLowerCase()] ?? "📱";
}

function fmtScheduled(iso?: string): string {
  if (!iso) return "Unscheduled";
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${time}`;
}

export default function PostingQueuePage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ queued: 0, publishing: 0, paused: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/posts/scheduled", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = (await res.json()) as QueueResponse;
        if (cancelled) return;
        const upcoming = data.upcoming ?? [];
        const due = data.due ?? [];
        const combined = [...due, ...upcoming];
        setRows(combined);
        setStats({
          queued: upcoming.length,
          publishing: due.length,
          paused: combined.filter((r) => r.status === "paused").length,
        });
      } catch {
        // offline — leave zeros
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summaryCards = [
    { label: "Queued", value: stats.queued, icon: ListChecks, color: "text-blue-600 bg-blue-50" },
    { label: "Publishing now", value: stats.publishing, icon: Play, color: "text-emerald-600 bg-emerald-50" },
    { label: "Paused", value: stats.paused, icon: Pause, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Posting Queue"
          subtitle="Posts queued and waiting to publish, in the order they'll go live."
        />
        <HealthPill
          status={loading ? "idle" : stats.publishing > 0 ? "ok" : stats.queued > 0 ? "warning" : "idle"}
          label={loading ? "Checking…" : stats.publishing > 0 ? "Worker live" : stats.queued > 0 ? "Worker waiting" : "No posts queued"}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center justify-center size-9 rounded-lg ${s.color}`}>
                  <Icon className="size-4" />
                </span>
                <p className="text-xs font-semibold text-zinc-500">{s.label}</p>
              </div>
              <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <p className="text-sm font-semibold">Up next</p>
          <button type="button" className="text-xs text-red-600 hover:underline flex items-center gap-1">
            <Trash2 className="size-3" />
            Clear queue
          </button>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-500">Loading queue…</div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No posts queued"
              description="Schedule a post from the composer and it will appear here, ready to publish at its scheduled time."
            />
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {rows.map((q) => (
              <div key={q.id} className="grid grid-cols-[1fr_180px_180px_120px] gap-3 px-5 py-3 items-center text-sm">
                <p className="font-semibold truncate">{q.caption || "(no caption)"}</p>
                <p className="text-zinc-600">
                  {platformEmoji(q.platforms[0] ?? "")} @{q.platforms[0] ?? "—"}
                </p>
                <p className="text-zinc-600 inline-flex items-center gap-1.5">
                  <Clock className="size-3.5 text-zinc-400" />
                  {fmtScheduled(q.scheduledAt)}
                </p>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
                  <Clock className="size-3" />
                  {q.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}