"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ListChecks,
  Clock,
  Play,
  Pause,
  Trash2,
  Copy,
  Calendar,
  AlertCircle,
  RotateCcw,
  Search,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { HealthPill } from "@/components/dashboard/health-pill";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { ScheduleModal } from "@/components/dashboard/schedule-modal";
import { cn } from "@/lib/utils";
import { fmtScheduled, bucketLabel, type ScheduleBucket } from "@/lib/queue/buckets";

interface QueueRow {
  id: string;
  caption: string;
  platforms: string[];
  scheduledAt?: string;
  status: string;
}

interface QueueResponse {
  due?: QueueRow[];
  upcoming?: QueueRow[];
  pausedCount?: number;
}

interface WorkerHealth {
  running: boolean;
  lastTickAt: string | null;
  lastResult: { scanned: number; published: number; failed: number; reaped: number; error?: string } | null;
  n8nConfigured: boolean;
  intervalMs: number;
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

function statusBadgeTone(status: string): "blue" | "amber" | "green" | "red" | "zinc" | "violet" {
  switch (status) {
    case "scheduled": return "blue";
    case "queued": return "blue";
    case "paused": return "amber";
    case "publishing": return "violet";
    case "published": return "green";
    case "failed": return "red";
    default: return "zinc";
  }
}

export default function PostingQueuePage() {
  const t = useTranslations("dashboard");
  const { toast } = useToast();
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [dueRows, setDueRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "scheduled" | "paused">("all");
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<QueueRow | null>(null);
  const [cancelTarget, setCancelTarget] = useState<QueueRow | null>(null);
  const [pendingAction, setPendingAction] = useState<null | "pause" | "resume">(null);

  async function reload() {
    setLoading(true);
    try {
      const [schedRes, healthRes] = await Promise.all([
        fetch("/api/posts/scheduled", { credentials: "include" }),
        fetch("/api/queue/health", { credentials: "include" }),
      ]);
      if (schedRes.ok) {
        const data = (await schedRes.json()) as QueueResponse;
        setDueRows(data.due ?? []);
        setRows(data.upcoming ?? []);
      }
      if (healthRes.ok) {
        setHealth((await healthRes.json()) as WorkerHealth);
      }
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "scheduled" && r.status !== "scheduled" && r.status !== "queued") return false;
      if (filter === "paused" && r.status !== "paused") return false;
      if (search.trim().length > 0) {
        const q = search.toLowerCase();
        return r.caption.toLowerCase().includes(q) || r.platforms.some((p) => p.toLowerCase().includes(q));
      }
      return true;
    });
  }, [rows, filter, search]);

  const grouped = useMemo(() => {
    const buckets: Record<ScheduleBucket, QueueRow[]> = {
      today: [],
      tomorrow: [],
      "this-week": [],
      later: [],
      paused: [],
      unscheduled: [],
      past: [],
    };
    for (const r of filteredRows) {
      const { rel } = fmtScheduled(r.scheduledAt);
      const key = r.status === "paused" ? "paused" : rel;
      buckets[key] = buckets[key] ?? [];
      buckets[key].push(r);
    }
    return buckets;
  }, [filteredRows]);

  const stats = useMemo(() => {
    const dueNow = dueRows.length;
    const today = grouped.today.length;
    const tomorrow = grouped.tomorrow.length;
    const paused = rows.filter((r) => r.status === "paused").length;
    const total = rows.length;
    return { dueNow, today, tomorrow, paused, total };
  }, [dueRows, grouped, rows]);

  async function patchRow(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/posts/scheduled/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast({ title: t("queue.update_failed"), description: data.error ?? `HTTP ${res.status}`, tone: "error" });
      return false;
    }
    return true;
  }

  async function deleteRow(id: string) {
    const res = await fetch(`/api/posts/scheduled/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast({ title: t("queue.cancel_failed"), description: data.error ?? `HTTP ${res.status}`, tone: "error" });
      return false;
    }
    return true;
  }

  async function duplicateRow(id: string) {
    const res = await fetch(`/api/posts/scheduled/${id}/duplicate`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast({ title: t("queue.duplicate_failed"), description: data.error ?? `HTTP ${res.status}`, tone: "error" });
      return null;
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return data.id ?? null;
  }

  async function handleAction(row: QueueRow, action: "pause" | "resume") {
    setPendingAction(action);
    const ok = await patchRow(row.id, { status: action === "pause" ? "paused" : "scheduled" });
    if (ok) {
      toast({
        title: action === "pause" ? t("queue.post_paused") : t("queue.post_resumed"),
        description: action === "pause" ? t("queue.post_paused_desc") : t("queue.post_resumed_desc"),
        tone: "success",
      });
      void reload();
    }
    setPendingAction(null);
  }

  async function handleReschedule(row: QueueRow, date: Date) {
    setRescheduleTarget(null);
    const ok = await patchRow(row.id, { scheduledAt: date.toISOString() });
    if (ok) {
      toast({
        title: t("queue.post_rescheduled"),
        description: t("queue.post_rescheduled_desc", { date: date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) }),
        tone: "success",
      });
      void reload();
    }
  }

  async function handleCancel(row: QueueRow) {
    setCancelTarget(null);
    const ok = await deleteRow(row.id);
    if (ok) {
      toast({ title: t("queue.post_cancelled"), description: t("queue.post_cancelled_desc"), tone: "success" });
      void reload();
    }
  }

  async function handleDuplicate(row: QueueRow) {
    const newId = await duplicateRow(row.id);
    if (newId) {
      toast({
        title: t("queue.post_duplicated"),
        description: t("queue.post_duplicated_desc"),
        tone: "success",
      });
      void reload();
    }
  }

  const summaryCards = [
    { label: "Due now", tKey: "due_now", value: stats.dueNow, icon: Send, color: "text-emerald-600 bg-emerald-50" },
    { label: "Today", tKey: "today", value: stats.today, icon: Clock, color: "text-blue-600 bg-blue-50" },
    { label: "Tomorrow", tKey: "tomorrow", value: stats.tomorrow, icon: Calendar, color: "text-violet-600 bg-violet-50" },
    { label: "Paused", tKey: "paused", value: stats.paused, icon: Pause, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title={t("queue.page_title")}
          subtitle={t("queue.page_subtitle")}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
          >
            <RotateCcw className="size-3" />
            {t("queue.refresh")}
          </button>
          <HealthPill
            status={
              health == null
                ? "idle"
                : health.lastResult?.error
                  ? "error"
                  : stats.dueNow > 0 || stats.today > 0
                    ? "ok"
                    : stats.total > 0
                      ? "warning"
                      : "idle"
            }
            label={
              health == null
                ? t("queue.health_loading")
                : health.lastResult?.error
                  ? t("queue.health_worker_error")
                  : stats.dueNow > 0
                    ? t("queue.health_publishing")
                    : stats.today > 0
                      ? t("queue.health_on_track")
                      : t("queue.health_all_clear")
            }
          />
        </div>
      </div>

      {/* Worker diagnostics strip */}
      {health && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-2 mb-4 text-xs text-zinc-600 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            <span className="font-semibold text-zinc-900">{t("queue.worker_label")}</span>{" "}
            {health.running ? t("queue.running") : t("queue.idle")}{" "}
            <span className="text-zinc-400">{t("queue.interval", { n: Math.round(health.intervalMs / 1000) })}</span>
          </span>
          <span>
            <span className="font-semibold text-zinc-900">{t("queue.last_tick")}</span>{" "}
            {health.lastTickAt
              ? new Date(health.lastTickAt).toLocaleTimeString()
              : t("queue.na")}
          </span>
          {health.lastResult ? (
            <span>
              <span className="font-semibold text-zinc-900">{t("queue.last_result")}</span>{" "}
              {health.lastResult.scanned} {t("queue.scanned")} ·{" "}
              <span className="text-emerald-700">{health.lastResult.published} {t("queue.published")}</span> ·{" "}
              {health.lastResult.failed > 0
                ? <span className="text-red-700">{health.lastResult.failed} {t("queue.failed")}</span>
                : `0 ${t("queue.failed")}`}{" "}
              · {health.lastResult.reaped} {t("queue.reaped")}
            </span>
          ) : null}
          {!health.n8nConfigured ? (
            <span className="inline-flex items-center gap-1 text-red-700">
              <AlertCircle className="size-3" />
              {t("queue.n8n_warning")}
            </span>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center justify-center size-7 rounded-lg ${s.color}`}>
                  <Icon className="size-3.5" />
                </span>
                <p className="text-xs font-semibold text-zinc-500">{t(`queue.${s.tKey}`)}</p>
              </div>
              <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filter + search */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="size-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
          <input
            type="search"
            placeholder={t("queue.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 h-9 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
          />
        </div>
        <div className="inline-flex rounded-full bg-zinc-100 p-1" role="tablist">
          {(["all", "scheduled", "paused"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-3 h-7 text-xs font-medium transition-colors",
                filter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              {f === "all" ? t("queue.filter_all") : f === "scheduled" ? t("queue.filter_scheduled") : t("queue.filter_paused")}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <p className="text-sm font-semibold">{t("queue.up_next")}</p>
          <p className="text-xs text-zinc-500">
            {loading ? t("queue.loading") : t("queue.count_posts", { n: rows.length })}
          </p>
        </div>

        {/* Due now (worker is about to publish these) */}
        {!loading && dueRows.length > 0 ? (
          <div className="border-b border-zinc-200 bg-emerald-50/40">
            <div className="px-5 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <Send className="size-3.5" />
              {t("queue.publishing_now", { n: dueRows.length })}
            </div>
            <ul className="divide-y divide-zinc-100">
              {dueRows.map((q) => (
                <QueueRowView
                  key={q.id}
                  row={q}
                  onPause={(r) => handleAction(r, "pause")}
                  onReschedule={(r) => setRescheduleTarget(r)}
                  onCancel={(r) => setCancelTarget(r)}
                  onDuplicate={(r) => handleDuplicate(r)}
                  pendingAction={pendingAction}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {/* Grouped upcoming */}
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-500">{t("queue.loading_queue")}</div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={t("queue.empty_title")}
              description={t("queue.empty_subtitle")}
              icon={<ListChecks className="size-5" />}
              action={
                <Link
                  href="/dashboard/posts/create"
                  className="inline-flex items-center justify-center rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-9 text-sm font-medium"
                >
                  {t("queue.create_post")}
                </Link>
              }
            />
          </div>
        ) : (
          <div>
            {(["today", "tomorrow", "this-week", "later", "paused", "unscheduled", "past"] as ScheduleBucket[]).map((bucket) => {
              const items = grouped[bucket];
              if (!items || items.length === 0) return null;
              const displayLabel = bucket === "past" ? t("queue.past_due") : bucketLabel(bucket);
              return (
                <div key={bucket}>
                  <div className={cn(
                    "px-5 py-2 border-b border-zinc-100 text-xs font-semibold",
                    bucket === "past"
                      ? "bg-red-50/40 text-red-700"
                      : "bg-zinc-50 text-zinc-700"
                  )}>
                    {displayLabel} ({items.length})
                  </div>
                  <ul className="divide-y divide-zinc-100">
                    {items.map((q) => (
                      <QueueRowView
                        key={q.id}
                        row={q}
                        onPause={(r) => handleAction(r, "pause")}
                        onResume={(r) => handleAction(r, "resume")}
                        onReschedule={(r) => setRescheduleTarget(r)}
                        onCancel={(r) => setCancelTarget(r)}
                        onDuplicate={(r) => handleDuplicate(r)}
                        pendingAction={pendingAction}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cancelTarget != null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && handleCancel(cancelTarget)}
        title={t("queue.cancel_title")}
        description={t("queue.cancel_desc", { caption: cancelTarget?.caption?.slice(0, 80) ?? t("queue.no_caption") })}
        confirmLabel={t("queue.cancel_post")}
        tone="destructive"
      />

      <Modal
        open={rescheduleTarget != null}
        onClose={() => setRescheduleTarget(null)}
        title={t("queue.reschedule_title")}
        description={t("queue.reschedule_desc")}
        size="lg"
      >
        <div className="h-[520px]">
          {rescheduleTarget ? (
            <RescheduleModalInner
              initialDate={rescheduleTarget.scheduledAt ? new Date(rescheduleTarget.scheduledAt) : null}
              onCancel={() => setRescheduleTarget(null)}
              onConfirm={(d) => handleReschedule(rescheduleTarget, d)}
            />
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function QueueRowView({
  row,
  onPause,
  onResume,
  onReschedule,
  onCancel,
  onDuplicate,
  pendingAction,
}: {
  row: QueueRow;
  onPause?: (r: QueueRow) => void;
  onResume?: (r: QueueRow) => void;
  onReschedule: (r: QueueRow) => void;
  onCancel: (r: QueueRow) => void;
  onDuplicate: (r: QueueRow) => void;
  pendingAction: null | "pause" | "resume";
}) {
  const t = useTranslations("dashboard");
  const { label, rel } = fmtScheduled(row.scheduledAt);
  const tone = statusBadgeTone(row.status);
  const isPaused = row.status === "paused";
  const isPast = rel === "past";

  return (
    <li className="px-5 py-3 hover:bg-zinc-50/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-zinc-700">
              {row.platforms.slice(0, 4).map((p) => (
                <span key={p} title={p} className="inline-flex items-center justify-center size-6 rounded-full bg-zinc-100">
                  {platformEmoji(p)}
                </span>
              ))}
              {row.platforms.length > 4 ? (
                <span className="text-[10px] text-zinc-500">+{row.platforms.length - 4}</span>
              ) : null}
              <span className="ml-1 text-xs text-zinc-500">@{row.platforms[0] ?? "—"}</span>
            </div>
            <StatusPill tone={tone} label={row.status} />
            {isPast ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-50 text-red-700">
                <AlertCircle className="size-3" />
                {t("queue.worker_down")}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-zinc-900 line-clamp-2 mb-1.5">{row.caption || <span className="text-zinc-400 italic">{t("queue.no_caption")}</span>}</p>
          <p className="text-xs text-zinc-500 inline-flex items-center gap-1.5">
            <Clock className="size-3" />
            {label}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isPaused ? (
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => onResume?.(row)}
              title={t("queue.resume")}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 h-7 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
            >
              <Play className="size-3" />
              {t("queue.resume")}
            </button>
          ) : (
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => onPause?.(row)}
              title={t("queue.pause")}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 h-7 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
            >
              <Pause className="size-3" />
              {t("queue.pause")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onReschedule(row)}
            title={t("queue.reschedule")}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 h-7 text-xs font-medium hover:bg-zinc-50"
          >
            <Calendar className="size-3" />
            {t("queue.reschedule")}
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(row)}
            title={t("queue.duplicate")}
            className="inline-flex items-center justify-center size-7 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50"
            aria-label={t("queue.duplicate")}
          >
            <Copy className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => onCancel(row)}
            title={t("queue.cancel")}
            className="inline-flex items-center justify-center size-7 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50"
            aria-label={t("queue.cancel")}
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </li>
  );
}

function StatusPill({ tone, label }: { tone: "blue" | "amber" | "green" | "red" | "zinc" | "violet"; label: string }) {
  const cls: Record<typeof tone, string> = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    zinc: "bg-zinc-100 text-zinc-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", cls[tone])}>
      {label}
    </span>
  );
}

function RescheduleModalInner({
  initialDate,
  onCancel,
  onConfirm,
}: {
  initialDate: Date | null;
  onCancel: () => void;
  onConfirm: (d: Date) => void;
}) {
  // Reuse the existing ScheduleModal for date selection, pre-filled when possible.
  return (
    <ScheduleModal
      open
      onClose={onCancel}
      onConfirm={(d) => {
        // Apply the user's original timezone offset if a previous time exists
        if (initialDate) {
          const merged = new Date(d);
          merged.setHours(initialDate.getHours(), initialDate.getMinutes(), 0, 0);
          onConfirm(merged);
        } else {
          onConfirm(d);
        }
      }}
    />
  );
}