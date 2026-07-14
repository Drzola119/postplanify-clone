"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  RefreshCcw,
  RotateCcw,
  Send,
  XCircle,
  Zap,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import { cn } from "@/lib/utils";

type Platform =
  | "bluesky"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "twitter"
  | "linkedin"
  | "threads"
  | "facebook";

interface JobRow {
  id: string;
  status: string;
  caption: string;
  platforms: Platform[];
  workerId?: string | null;
  claimedAt?: string | null;
  failureReason?: string | null;
  publishedAt?: string;
  updatedAt: string;
}

interface TickResult {
  scanned: number;
  published: number;
  failed: number;
  reaped: number;
  error?: string;
}

interface WorkerHealth {
  running: boolean;
  lastTickAt: string | null;
  lastResult: TickResult | null;
  n8nConfigured: boolean;
  intervalMs: number;
}

interface JobsResponse {
  ok: boolean;
  inflight: JobRow[];
  failed: JobRow[];
  health: WorkerHealth;
}

function platformEmoji(platform: string): string {
  const map: Record<string, string> = {
    instagram: "📷",
    twitter: "𝕏",
    x: "𝕏",
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

function formatAgo(iso?: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 0) return "just now";
  if (diff < 60_000) return `${Math.max(1, Math.round(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleString();
}

export default function CommandCenterPage() {
  const [inflight, setInflight] = useState<JobRow[]>([]);
  const [failed, setFailed] = useState<JobRow[]>([]);
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoTick, setAutoTick] = useState(true);
  const [runningTick, setRunningTick] = useState(false);
  const [lastForcedTick, setLastForcedTick] = useState<TickResult | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/queue/jobs", {
        credentials: "include",
        headers: getOverrideHeaders(),
      });
      if (!res.ok) return;
      const data = (await res.json()) as JobsResponse;
      setInflight(data.inflight ?? []);
      setFailed(data.failed ?? []);
      setHealth(data.health);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  // Polling for live updates. 5s cadence is light on Firestore reads.
  useEffect(() => {
    if (!autoTick) return;
    const id = setInterval(() => void load(), 5_000);
    return () => clearInterval(id);
  }, [autoTick]);

  async function forceRunTick() {
    if (runningTick) return;
    setRunningTick(true);
    try {
      const res = await fetch("/api/queue/run-tick", {
        method: "POST",
        credentials: "include",
        headers: getOverrideHeaders(),
      });
      const body = (await res.json().catch(() => ({}))) as { result?: TickResult; error?: string };
      if (res.ok && body.result) {
        setLastForcedTick(body.result);
      } else if (body.error) {
        setLastForcedTick({ scanned: 0, published: 0, failed: 0, reaped: 0, error: body.error });
      }
      await load();
    } finally {
      setRunningTick(false);
    }
  }

  async function retryFailed(job: JobRow) {
    if (retryingId) return;
    setRetryingId(job.id);
    try {
      const res = await fetch(`/api/posts/scheduled/${job.id}/retry`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setFailed((prev) => prev.filter((p) => p.id !== job.id));
      }
      await load();
    } finally {
      setRetryingId(null);
    }
  }

  const stuckInflight = useMemo(() => {
    const thresholdMs = Number(process.env.NEXT_PUBLIC_WORKER_STUCK_CLAIM_MS ?? 5 * 60_000);
    return inflight.filter((j) => {
      const t = j.claimedAt ? new Date(j.claimedAt).getTime() : 0;
      return t === 0 ? false : Date.now() - t > thresholdMs;
    });
  }, [inflight]);

  const lastTick = health?.lastTickAt ? new Date(health.lastTickAt) : null;
  const tickAgeMs = lastTick ? Date.now() - lastTick.getTime() : Infinity;
  const workerStale = tickAgeMs > Number(process.env.WORKER_INTERVAL_MS ?? 30_000) * 3;

  return (
    <div className="px-3 lg:px-6 pt-5 lg:pt-8 pb-3 lg:pb-6">
      <PageHeader
        title="Command Center"
        subtitle="Live view of what's publishing right now, what's stuck, and what's failing."
      />

      {/* Top status strip */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 mb-5">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "inline-flex items-center justify-center size-10 rounded-lg",
                health?.running
                  ? "bg-emerald-50 text-emerald-700"
                  : workerStale
                    ? "bg-red-50 text-red-600"
                    : "bg-zinc-100 text-zinc-700",
              )}
            >
              <Activity className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Worker {health?.running ? "running" : "idle"}
                {!health?.n8nConfigured ? (
                  <span className="ml-2 text-red-600">· n8n not configured</span>
                ) : null}
              </p>
              <p className="text-xs text-zinc-500">
                Last tick: {lastTick ? formatAgo(health?.lastTickAt ?? null) : "never"}
                {health?.intervalMs ? ` (every ${Math.round(health.intervalMs / 1000)}s)` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-zinc-700">
              <input
                type="checkbox"
                checked={autoTick}
                onChange={(e) => setAutoTick(e.target.checked)}
                className="size-3.5 rounded border-zinc-300"
              />
              Auto-refresh every 5s
            </label>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
            >
              <RefreshCcw className="size-3" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void forceRunTick()}
              disabled={runningTick || !health?.n8nConfigured}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 h-8 text-xs font-medium"
            >
              {runningTick ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Zap className="size-3" />
              )}
              {runningTick ? "Running…" : "Run tick now"}
            </button>
          </div>
        </div>

        {lastForcedTick ? (
          <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
            <p>
              <span className="font-semibold">Last forced tick:</span>{" "}
              {lastForcedTick.scanned} scanned ·{" "}
              <span className="text-emerald-700">{lastForcedTick.published} published</span> ·{" "}
              <span className="text-red-700">{lastForcedTick.failed} failed</span> ·{" "}
              {lastForcedTick.reaped} reaped
              {lastForcedTick.error ? (
                <span className="text-red-700"> · error: {lastForcedTick.error}</span>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard
          label="In-flight"
          value={inflight.length}
          icon={<Send className="size-4" />}
          iconClassName="bg-violet-50 text-violet-700"
          footer={stuckInflight.length > 0 ? `${stuckInflight.length} may be stuck` : null}
        />
        <StatCard
          label="Failed (recent)"
          value={failed.length}
          icon={<XCircle className="size-4" />}
          iconClassName="bg-red-50 text-red-600"
          footer="Eligible to retry"
        />
        <StatCard
          label="Worker state"
          value={health?.running ? "running" : workerStale ? "stale" : "idle"}
          icon={<Activity className="size-4" />}
          iconClassName={
            health?.running
              ? "bg-emerald-50 text-emerald-700"
              : workerStale
                ? "bg-red-50 text-red-600"
                : "bg-zinc-100 text-zinc-700"
          }
          footer={lastTick ? formatAgo(health?.lastTickAt ?? null) : "Never ticked"}
        />
        <StatCard
          label="Last published"
          value={
            health?.lastResult?.published
              ? `${health.lastResult.published}`
              : "0"
          }
          icon={<CheckCircle2 className="size-4" />}
          iconClassName="bg-emerald-50 text-emerald-700"
          footer={
            health?.lastResult
              ? `${health.lastResult.scanned} scanned in last tick`
              : "No tick yet"
          }
        />
      </div>

      {/* In-flight jobs */}
      <Section
        title="In-flight (publishing now)"
        icon={<Send className="size-4" />}
        emptyText="No posts are publishing right now. Things are quiet."
      >
        {loading ? (
          <EmptyRow icon={<Loader2 className="size-4 animate-spin" />} text="Loading…" />
        ) : inflight.length === 0 ? (
          <EmptyRow icon={<Clock className="size-4 text-zinc-400" />} text="Worker is idle — nothing being published." />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {inflight.map((job) => (
              <li key={job.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <StatusBadge tone="violet" icon={<Loader2 className="size-3 animate-spin" />}>
                      publishing
                    </StatusBadge>
                    {job.platforms.map((p) => (
                      <span
                        key={p}
                        title={p}
                        className="inline-flex items-center justify-center size-6 rounded-full bg-zinc-100 text-sm"
                      >
                        {platformEmoji(p)}
                      </span>
                    ))}
                    {job.workerId ? (
                      <span className="text-[10px] text-zinc-500">pid {job.workerId}</span>
                    ) : null}
                    {stuckInflight.find((s) => s.id === job.id) ? (
                      <StatusBadge tone="amber" icon={<AlertTriangle className="size-3" />}>
                        stuck
                      </StatusBadge>
                    ) : null}
                  </div>
                  <p className="text-sm text-zinc-900 line-clamp-2">{job.caption || "(no caption)"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Claimed {formatAgo(job.claimedAt ?? job.updatedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Failed jobs */}
      <Section
        title="Failed (eligible for retry)"
        icon={<RotateCcw className="size-4" />}
        emptyText="No failed posts. Everything published cleanly."
        className="mt-5"
      >
        {loading ? (
          <EmptyRow icon={<Loader2 className="size-4 animate-spin" />} text="Loading…" />
        ) : failed.length === 0 ? (
          <EmptyRow icon={<CheckCircle2 className="size-4 text-emerald-500" />} text="No failures to retry." />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {failed.map((job) => (
              <li key={job.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <StatusBadge tone="red" icon={<XCircle className="size-3" />}>
                      failed
                    </StatusBadge>
                    {job.platforms.map((p) => (
                      <span
                        key={p}
                        title={p}
                        className="inline-flex items-center justify-center size-6 rounded-full bg-zinc-100 text-sm"
                      >
                        {platformEmoji(p)}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-zinc-900 line-clamp-2">{job.caption || "(no caption)"}</p>
                  {job.failureReason ? (
                    <p className="mt-1 text-xs text-red-600 line-clamp-1">
                      Reason: {job.failureReason}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void retryFailed(job)}
                  disabled={retryingId === job.id}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-medium"
                >
                  {retryingId === job.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Play className="size-3" />
                  )}
                  Retry now
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  icon,
  emptyText,
  className,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  emptyText: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-zinc-200 bg-white overflow-hidden", className)}>
      <header className="flex items-center gap-2 px-5 py-3 border-b border-zinc-200 bg-zinc-50">
        <span className="inline-flex items-center justify-center size-6 rounded-md bg-white border border-zinc-200 text-zinc-700">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {/* NOTE: emptyText is shown via EmptyRow in children when no data */}
        <span className="sr-only">{emptyText}</span>
      </header>
      {children}
    </section>
  );
}

function EmptyRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-5 py-8 flex items-center justify-center gap-2 text-sm text-zinc-500">
      {icon}
      <span>{text}</span>
    </div>
  );
}
