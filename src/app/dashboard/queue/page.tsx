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
  Image as ImageIcon,
  Video,
  FileText,
  Type as TypeIcon,
  Layers,
  Eye,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Timer,
  Filter,
  Plus,
} from "lucide-react";
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
  mediaUrls?: string[];
  mediaType?: string;
  hashtags?: string[];
  labels?: string[];
  firstComment?: string;
  createdAt?: string;
  updatedAt?: string;
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
  uploadPostConfigured: boolean;
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
    discord: "💬",
    telegram: "✈️",
    reddit: "🤖",
    google_business: "🏪",
  };
  return map[platform.toLowerCase()] ?? "📱";
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "from-[#f09433] via-[#e6683c] to-[#bc1888]",
  tiktok: "bg-zinc-950",
  youtube: "bg-red-600",
  linkedin: "bg-[#0A66C2]",
  facebook: "bg-[#1877F2]",
  twitter: "bg-black",
  x: "bg-black",
  threads: "bg-zinc-900",
  pinterest: "bg-[#E60023]",
  bluesky: "bg-[#0085FF]",
  discord: "bg-[#5865F2]",
  telegram: "bg-[#2AABEE]",
};

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

// ── Media helpers ──────────────────────────────────────────────────────────
function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes(".mp4") ||
    lower.includes(".mov") ||
    lower.includes(".webm") ||
    lower.includes(".m4v") ||
    lower.includes("video") ||
    lower.endsWith(".mp4")
  );
}

function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".gif") ||
    lower.includes(".webp") ||
    lower.includes(".heic") ||
    lower.includes("image")
  );
}

type MediaKind = "image" | "video" | "carousel" | "document" | "text";

function getMediaKind(row: QueueRow): MediaKind {
  const urls = row.mediaUrls ?? [];
  const type = row.mediaType?.toLowerCase() ?? "";
  if (type.includes("carousel") || type.includes("carousel")) return "carousel";
  if (type.includes("document")) return "document";
  if (type.includes("video")) return "video";
  if (type.includes("image")) return urls.length > 1 ? "carousel" : "image";
  if (urls.length === 0) return "text";
  if (urls.length > 1) return "carousel";
  const first = urls[0] ?? "";
  if (isVideoUrl(first)) return "video";
  if (isImageUrl(first)) return "image";
  // fallback: if url looks like cdn without extension, treat as image if not video
  return "image";
}

function getThumbnailUrl(row: QueueRow): string | null {
  const urls = row.mediaUrls ?? [];
  if (urls.length === 0) return null;
  return urls[0] ?? null;
}

// ── MediaThumbnail Component ───────────────────────────────────────────────
function MediaThumbnail({ row, size = 72 }: { row: QueueRow; size?: number }) {
  const kind = getMediaKind(row);
  const thumb = getThumbnailUrl(row);
  const count = row.mediaUrls?.length ?? 0;

  const baseClasses =
    "relative flex-shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center";

  const style = { width: size, height: size } as const;

  if (kind === "text") {
    return (
      <div className={cn(baseClasses, "bg-gradient-to-br from-zinc-50 to-zinc-100")} style={style}>
        <div className="flex flex-col items-center gap-1 p-2 text-center">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-white border border-zinc-200 shadow-sm">
            <TypeIcon className="size-3.5 text-zinc-600" />
          </span>
          <span className="text-[9px] font-semibold tracking-widest text-zinc-500 uppercase">Text</span>
        </div>
        {/* subtle caption preview lines */}
        <div className="absolute bottom-2 left-2 right-2 space-y-1 opacity-40 hidden sm:block">
          <div className="h-1 rounded bg-zinc-300 w-[90%]" />
          <div className="h-1 rounded bg-zinc-300 w-[70%]" />
        </div>
      </div>
    );
  }

  if (kind === "document") {
    return (
      <div
        className={cn(baseClasses, "bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200")}
        style={style}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-white border border-violet-200 shadow-sm">
            <FileText className="size-4 text-violet-600" />
          </span>
          <span className="text-[9px] font-bold tracking-widest text-violet-700 uppercase">Doc</span>
        </div>
        <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-full bg-zinc-900 text-white text-[8px] font-semibold px-1.5 py-0.5">
          <FileText className="size-2.5" /> PDF
        </span>
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div className={cn(baseClasses, "bg-zinc-900")} style={style}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        {/* video overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur">
            <Play className="size-4 text-zinc-900 ml-0.5 fill-zinc-900" />
          </span>
        </span>
        <span className="absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-full bg-black/80 text-white text-[9px] font-semibold px-1.5 py-0.5">
          <Video className="size-2.5" /> VIDEO
        </span>
        {count > 1 && (
          <span className="absolute top-1 right-1 inline-flex items-center rounded-full bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5">
            +{count}
          </span>
        )}
      </div>
    );
  }

  if (kind === "carousel") {
    return (
      <div className={cn(baseClasses, "bg-white")} style={style}>
        {thumb ? (
          <>
            {/* stacked effect */}
            <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-xl bg-zinc-200 border border-zinc-200" />
            <div className="absolute inset-0 rounded-xl overflow-hidden border border-zinc-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <span className="absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white text-[9px] font-semibold px-1.5 py-0.5 shadow">
              <Layers className="size-2.5" /> {count}
            </span>
            <span className="absolute top-1 left-1 inline-flex items-center rounded-full bg-white/95 border border-zinc-200 text-zinc-700 text-[8px] font-bold px-1.5 py-0.5 backdrop-blur">
              CAROUSEL
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Layers className="size-6 text-zinc-400" />
            <span className="text-[9px] font-semibold text-zinc-500">{count} items</span>
          </div>
        )}
      </div>
    );
  }

  // image
  return (
    <div className={cn(baseClasses, "bg-zinc-100")} style={style}>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <ImageIcon className="size-6 text-zinc-400" />
      )}
      <span className="absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-full bg-black/75 text-white text-[9px] font-semibold px-1.5 py-0.5 backdrop-blur">
        <ImageIcon className="size-2.5" /> IMG
      </span>
      {count > 1 && (
        <span className="absolute top-1 right-1 inline-flex items-center rounded-full bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5">
          +{count - 1}
        </span>
      )}
    </div>
  );
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
        const data = (await schedRes.json()) as QueueResponse & { upcoming?: Array<Record<string, unknown>>; due?: Array<Record<string, unknown>> };
        // Normalize upcoming/due to include mediaUrls etc (backend already sends but type was stripped)
        const normalize = (arr: Array<Record<string, unknown>> | undefined): QueueRow[] =>
          (arr ?? []).map((r) => ({
            id: String(r.id ?? ""),
            caption: String(r.caption ?? ""),
            platforms: Array.isArray(r.platforms) ? (r.platforms as string[]) : [],
            scheduledAt: r.scheduledAt ? String(r.scheduledAt) : undefined,
            status: String(r.status ?? "scheduled"),
            mediaUrls: Array.isArray(r.mediaUrls) ? (r.mediaUrls as string[]) : [],
            mediaType: r.mediaType ? String(r.mediaType) : undefined,
            hashtags: Array.isArray(r.hashtags) ? (r.hashtags as string[]) : [],
            labels: Array.isArray(r.labels) ? (r.labels as string[]) : [],
            firstComment: r.firstComment ? String(r.firstComment) : undefined,
            createdAt: r.createdAt ? String(r.createdAt) : undefined,
            updatedAt: r.updatedAt ? String(r.updatedAt) : undefined,
          }));
        setDueRows(normalize(data.due as Array<Record<string, unknown>>));
        setRows(normalize(data.upcoming as Array<Record<string, unknown>>));
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
        return (
          r.caption.toLowerCase().includes(q) ||
          r.platforms.some((p) => p.toLowerCase().includes(q)) ||
          (r.mediaType ?? "").toLowerCase().includes(q)
        );
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
    const withMedia = rows.filter((r) => (r.mediaUrls?.length ?? 0) > 0).length;
    const textOnly = total - withMedia;
    return { dueNow, today, tomorrow, paused, total, withMedia, textOnly };
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
    {
      label: "Due now",
      tKey: "due_now",
      value: stats.dueNow,
      icon: Send,
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      sub: stats.dueNow > 0 ? "Publishing next tick" : "All clear",
    },
    {
      label: "Today",
      tKey: "today",
      value: stats.today,
      icon: Clock,
      gradient: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50",
      text: "text-blue-700",
      sub: `${stats.withMedia} with media`,
    },
    {
      label: "Tomorrow",
      tKey: "tomorrow",
      value: stats.tomorrow,
      icon: Calendar,
      gradient: "from-violet-500 to-purple-500",
      bg: "bg-violet-50",
      text: "text-violet-700",
      sub: `${stats.textOnly} text-only`,
    },
    {
      label: "Paused",
      tKey: "paused",
      value: stats.paused,
      icon: Pause,
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      text: "text-amber-700",
      sub: stats.paused > 0 ? "Needs attention" : "No holds",
    },
  ];

  return (
    <div className="min-h-0 flex-1 bg-[#fcfcfc] dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex gap-3">
              <span className="hidden sm:inline-flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm shrink-0">
                <ListChecks className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-zinc-900 dark:text-white leading-none">
                    {t("queue.page_title")}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold tracking-widest px-2 py-0.5 uppercase">
                    <Sparkles className="size-3" /> Pro
                  </span>
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
                <p className="text-[13px] sm:text-sm text-zinc-500 mt-1 max-w-[560px] leading-relaxed">
                  {t("queue.page_subtitle")} •{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {stats.total} in queue
                  </span>{" "}
                  <span className="hidden sm:inline">• Linked to Calendar, Bulk Schedule & Posting automation</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/dashboard/calendar"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-sm"
              >
                <Calendar className="size-3.5" />
                Calendar
              </Link>
              <Link
                href="/dashboard/posts/bulk-schedule"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
              >
                <Layers className="size-3.5" />
                Bulk
              </Link>
              <button
                type="button"
                onClick={() => void reload()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold hover:bg-zinc-50 shadow-sm"
              >
                <RotateCcw className={cn("size-3.5", loading && "animate-spin")} />
                <span className="hidden sm:inline">{t("queue.refresh")}</span>
              </button>
              <Link
                href="/dashboard/posts/create"
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white px-4 h-9 text-xs font-bold shadow-sm transition-colors"
              >
                <Plus className="size-3.5" />
                Create Post
                <ArrowUpRight className="size-3 opacity-70 hidden sm:block" />
              </Link>
            </div>
          </div>

          {/* Quick ecosystem links */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-zinc-200 px-2.5 py-1 font-medium text-zinc-600 shadow-sm">
              <Filter className="size-3" /> Queue
            </span>
            <Link href="/dashboard/calendar" className="inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white border border-transparent hover:border-zinc-200 px-2.5 py-1 font-medium text-zinc-600 transition-colors">
              Calendar <ExternalLink className="size-3 opacity-50" />
            </Link>
            <Link href="/dashboard/posts/history" className="inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white border border-transparent hover:border-zinc-200 px-2.5 py-1 font-medium text-zinc-600 transition-colors">
              History <ExternalLink className="size-3 opacity-50" />
            </Link>
            <Link href="/dashboard/posts/drafts" className="inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white border border-transparent hover:border-zinc-200 px-2.5 py-1 font-medium text-zinc-600 transition-colors">
              Drafts <ExternalLink className="size-3 opacity-50" />
            </Link>
            <Link href="/dashboard/inbox" className="inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white border border-transparent hover:border-zinc-200 px-2.5 py-1 font-medium text-zinc-600 transition-colors">
              Inbox
            </Link>
            <span className="text-zinc-400 hidden sm:inline">• Auto-linked to your Posting Schedule & Worker</span>
          </div>
        </div>

        {/* ── Worker diagnostics ── */}
        {health && (
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <span className="inline-flex items-center gap-2">
                <span className={cn("size-2 rounded-full animate-pulse", health.running ? "bg-emerald-500" : "bg-zinc-400")} />
                <span className="font-bold text-zinc-900">{t("queue.worker_label")}</span>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border", health.running ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-600 border-zinc-200")}>
                  {health.running ? t("queue.running") : t("queue.idle")}
                </span>
                <span className="text-zinc-500 font-medium">{t("queue.interval", { n: Math.round(health.intervalMs / 1000) })}</span>
              </span>
              <span className="hidden sm:inline h-4 w-px bg-zinc-200" />
              <span className="inline-flex items-center gap-1.5">
                <Timer className="size-3.5 text-zinc-400" />
                <span className="font-semibold text-zinc-900">{t("queue.last_tick")}</span>
                <span className="font-medium text-zinc-600">
                  {health.lastTickAt ? new Date(health.lastTickAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : t("queue.na")}
                </span>
              </span>
              {health.lastResult && (
                <>
                  <span className="hidden sm:inline h-4 w-px bg-zinc-200" />
                  <span className="inline-flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-zinc-900">{t("queue.last_result")}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-2 py-0.5 text-[10px] font-bold">
                      {health.lastResult.scanned} {t("queue.scanned")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold">
                      <CheckCircle2 className="size-3" /> {health.lastResult.published} {t("queue.published")}
                    </span>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border", health.lastResult.failed > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-zinc-50 text-zinc-600 border-zinc-200")}>
                      {health.lastResult.failed} {t("queue.failed")}
                    </span>
                    <span className="text-zinc-500 font-medium hidden sm:inline">• {health.lastResult.reaped} {t("queue.reaped")}</span>
                  </span>
                </>
              )}
              {!health.uploadPostConfigured && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 text-[11px] font-semibold">
                  <AlertCircle className="size-3.5" />
                  {t("queue.uploadpost_warning")}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {summaryCards.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all"
              >
                <div className="absolute top-0 right-0 size-24 bg-gradient-to-br from-zinc-50 to-white rounded-full blur-2xl opacity-60 -mr-8 -mt-8 pointer-events-none" />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className={cn("inline-flex items-center justify-center size-9 sm:size-10 rounded-xl text-white shadow-sm shrink-0 bg-gradient-to-br", s.gradient)}>
                      <Icon className="size-4 sm:size-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-zinc-500 leading-none">{t(`queue.${s.tKey}`)}</p>
                      <p className="text-[11px] text-zinc-400 font-medium truncate hidden sm:block">{s.sub}</p>
                    </div>
                  </div>
                  <span className={cn("hidden sm:inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold", s.bg, s.text)}>
                    {s.value > 9 ? "9+" : s.value}
                  </span>
                </div>
                <div className="relative mt-3 flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 leading-none">
                    {loading ? <span className="inline-block h-7 w-8 rounded bg-zinc-100 animate-pulse" /> : s.value}
                  </p>
                  <span className="text-xs font-medium text-zinc-500 hidden sm:inline">posts</span>
                  {s.value > 0 && <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Search + Filters ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-2 sm:p-3 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder={t("queue.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-7 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-black transition-colors"
              >
                <span className="text-xs">✕</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex rounded-full bg-zinc-100 p-1" role="tablist">
              {(["all", "scheduled", "paused"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-3.5 h-8 text-xs font-bold transition-all",
                    filter === f ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                  )}
                >
                  {f === "all" ? t("queue.filter_all") : f === "scheduled" ? t("queue.filter_scheduled") : t("queue.filter_paused")}
                </button>
              ))}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 pl-2 border-l border-zinc-200">
              <Eye className="size-3.5" />
              <span className="font-medium">{filteredRows.length} visible</span>
            </div>
          </div>
        </div>

        {/* ── Queue List ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-zinc-50 to-white">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex size-8 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm shrink-0">
                <ListChecks className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-zinc-900 leading-none">{t("queue.up_next")}</p>
                <p className="text-xs text-zinc-500 font-medium">
                  {loading ? t("queue.loading") : t("queue.count_posts", { n: rows.length })}
                  <span className="hidden sm:inline"> • </span>
                  <span className="hidden sm:inline">{stats.withMedia} media • {stats.textOnly} text</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm">
                <Clock className="size-3" />
                Sorted by schedule time
              </span>
              <Link href="/dashboard/calendar" className="hidden sm:inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-3 py-1.5 text-[11px] font-bold hover:bg-black transition-colors">
                View Calendar <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>

          {/* Due now */}
          {!loading && dueRows.length > 0 && (
            <div className="border-b border-zinc-200 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-white">
              <div className="px-4 sm:px-5 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-800 border-b border-emerald-100">
                <span className="relative flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-emerald-600" />
                </span>
                <Send className="size-3.5" />
                {t("queue.publishing_now", { n: dueRows.length })}
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                  Live • Worker active
                </span>
              </div>
              <ul className="divide-y divide-emerald-100/60">
                {dueRows.map((q) => (
                  <QueueRowView
                    key={q.id}
                    row={q}
                    onPause={(r) => handleAction(r, "pause")}
                    onReschedule={(r) => setRescheduleTarget(r)}
                    onCancel={(r) => setCancelTarget(r)}
                    onDuplicate={(r) => handleDuplicate(r)}
                    pendingAction={pendingAction}
                    variant="due"
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Grouped upcoming */}
          {loading ? (
            <div className="p-4 sm:p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 animate-pulse">
                  <div className="size-[72px] rounded-xl bg-zinc-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded bg-zinc-200 w-1/3" />
                    <div className="h-4 rounded bg-zinc-200 w-3/4" />
                    <div className="h-3 rounded bg-zinc-100 w-1/2" />
                  </div>
                  <div className="hidden sm:block h-8 w-24 rounded-xl bg-zinc-200" />
                </div>
              ))}
              <p className="text-center text-sm text-zinc-500 py-2">{t("queue.loading_queue")}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                title={t("queue.empty_title")}
                description={t("queue.empty_subtitle")}
                icon={<ListChecks className="size-5" />}
                action={
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <Link
                      href="/dashboard/posts/create"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-black text-white px-5 h-10 text-sm font-bold shadow-sm transition-colors w-full sm:w-auto"
                    >
                      <Plus className="size-4" />
                      {t("queue.create_post")}
                    </Link>
                    <Link
                      href="/dashboard/posts/bulk-schedule"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-5 h-10 text-sm font-semibold shadow-sm transition-colors w-full sm:w-auto"
                    >
                      <Layers className="size-4" /> Bulk Schedule
                    </Link>
                  </div>
                }
              />
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-bold text-zinc-900 flex items-center gap-1.5"><Sparkles className="size-3.5" /> Tip: Use Bulk</p>
                  <p className="text-zinc-500 mt-1">Upload 10 media files at once and auto-assign times via Posting Schedule.</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-bold text-zinc-900">Calendar sync</p>
                  <p className="text-zinc-500 mt-1">All queued posts also appear in Calendar with drag-to-reschedule.</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-bold text-zinc-900">Worker healthy?</p>
                  <p className="text-zinc-500 mt-1">Check the worker strip above. If idle, posts wait for next tick.</p>
                </div>
              </div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto size-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
                <Search className="size-5" />
              </div>
              <p className="text-sm font-semibold text-zinc-900">No matches</p>
              <p className="text-sm text-zinc-500 mt-1">No queued posts match “{search}” in {filter}.</p>
              <button
                type="button"
                onClick={() => { setSearch(""); setFilter("all"); }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-8 text-xs font-semibold hover:bg-zinc-50"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div>
              {(["today", "tomorrow", "this-week", "later", "paused", "unscheduled", "past"] as ScheduleBucket[]).map((bucket) => {
                const items = grouped[bucket];
                if (!items || items.length === 0) return null;
                const displayLabel = bucket === "past" ? t("queue.past_due") : bucketLabel(bucket);
                const isPast = bucket === "past";
                const isPaused = bucket === "paused";
                return (
                  <div key={bucket} className="border-b border-zinc-100 last:border-b-0">
                    <div className={cn(
                      "sticky top-0 z-10 px-4 sm:px-5 py-2.5 border-b text-xs font-bold flex items-center gap-2 backdrop-blur supports-[backdrop-filter]:bg-white/80",
                      isPast
                        ? "bg-red-50/90 text-red-700 border-red-100"
                        : isPaused
                          ? "bg-amber-50/90 text-amber-800 border-amber-100"
                          : "bg-zinc-50/90 text-zinc-700 border-zinc-100"
                    )}>
                      <span className={cn("size-1.5 rounded-full shrink-0", isPast ? "bg-red-500" : isPaused ? "bg-amber-500" : "bg-zinc-400")} />
                      {displayLabel}
                      <span className={cn("inline-flex items-center justify-center min-w-6 h-5 rounded-full px-1.5 text-[10px] font-black border", isPast ? "bg-red-600 text-white border-red-600" : isPaused ? "bg-amber-500 text-white border-amber-500" : "bg-zinc-900 text-white border-zinc-900")}>
                        {items.length}
                      </span>
                      <span className="ml-auto hidden sm:inline text-[10px] font-semibold tracking-widest uppercase opacity-60">
                        {bucket === "today" ? "Next up" : bucket === "tomorrow" ? "On deck" : bucket === "this-week" ? "This week" : bucket === "later" ? "Later" : bucket}
                      </span>
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

        <p className="text-center text-[11px] text-zinc-400 px-4">
          Queue is linked to <Link href="/dashboard/calendar" className="underline decoration-dotted hover:text-zinc-600">Calendar</Link> • <Link href="/dashboard/posts/history" className="underline decoration-dotted hover:text-zinc-600">History</Link> • Worker publishes automatically on schedule. Pause to hold, Reschedule to move, Duplicate to reuse.
        </p>
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
  variant,
}: {
  row: QueueRow;
  onPause?: (r: QueueRow) => void;
  onResume?: (r: QueueRow) => void;
  onReschedule: (r: QueueRow) => void;
  onCancel: (r: QueueRow) => void;
  onDuplicate: (r: QueueRow) => void;
  pendingAction: null | "pause" | "resume";
  variant?: "due" | "default";
}) {
  const t = useTranslations("dashboard");
  const { label, rel } = fmtScheduled(row.scheduledAt);
  const tone = statusBadgeTone(row.status);
  const isPaused = row.status === "paused";
  const isPast = rel === "past";
  const isDue = variant === "due";

  return (
    <li className={cn("group relative px-3 sm:px-5 py-3 sm:py-4 hover:bg-zinc-50/80 transition-colors", isDue && "hover:bg-emerald-50/50")}>
      {/* subtle left accent for due */}
      {isDue && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-emerald-500" />}
      <div className="flex gap-3 sm:gap-4">
        {/* Thumbnail - always visible, responsive size */}
        <div className="shrink-0 self-start">
          <MediaThumbnail row={row} size={68} />
          {/* mobile media type label under thumb */}
          <div className="sm:hidden mt-1 flex justify-center">
            <span className="inline-flex items-center rounded-full bg-zinc-900 text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-widest">
              {getMediaKind(row)}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1 flex flex-col gap-1.5 sm:gap-2">
          {/* Top meta row */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {row.platforms.slice(0, 4).map((p) => {
                const bg = PLATFORM_COLORS[p.toLowerCase()] ?? "bg-zinc-800";
                const isGradient = bg.startsWith("from-");
                return (
                  <span
                    key={p}
                    title={p}
                    className={cn(
                      "inline-flex items-center justify-center size-6 sm:size-7 rounded-full text-white text-[11px] shadow-sm border border-white shrink-0",
                      isGradient ? `bg-gradient-to-br ${bg}` : bg
                    )}
                  >
                    {platformEmoji(p)}
                  </span>
                );
              })}
              {row.platforms.length > 4 ? (
                <span className="inline-flex items-center justify-center size-6 sm:size-7 rounded-full bg-zinc-900 text-white text-[10px] font-bold border border-white">
                  +{row.platforms.length - 4}
                </span>
              ) : null}
            </div>

            <StatusPill tone={tone} label={row.status} />

            {isPast && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="size-3" />
                {t("queue.worker_down")}
              </span>
            )}

            {isDue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                <span className="size-1.5 rounded-full bg-white animate-pulse" />
                Due
              </span>
            )}

            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-600 shadow-sm">
              <Clock className="size-3" />
              {label}
            </span>
          </div>

          {/* Caption */}
          <p className="text-[13px] sm:text-[14px] font-medium text-zinc-900 leading-[1.4] line-clamp-2">
            {row.caption ? (
              row.caption
            ) : (
              <span className="text-zinc-400 italic font-normal">{t("queue.no_caption")}</span>
            )}
          </p>

          {/* Secondary meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5 sm:hidden">
              <Clock className="size-3" />
              {label}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <Calendar className="size-3" />
              {row.platforms.join(" • ")}
            </span>
            <span className="sm:hidden text-zinc-400">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs">
              {row.platforms.length} platform{row.platforms.length !== 1 ? "s" : ""}
              {row.mediaUrls && row.mediaUrls.length > 0 && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span className="inline-flex items-center gap-1">
                    {getMediaKind(row) === "video" ? <Video className="size-3" /> : getMediaKind(row) === "carousel" ? <Layers className="size-3" /> : getMediaKind(row) === "text" ? <TypeIcon className="size-3" /> : <ImageIcon className="size-3" />}
                    {getMediaKind(row)} {row.mediaUrls.length > 1 ? `• ${row.mediaUrls.length} files` : ""}
                  </span>
                </>
              )}
            </span>
            {row.hashtags && row.hashtags.length > 0 && (
              <span className="hidden lg:inline-flex items-center gap-1 text-[11px]">
                <span className="text-zinc-300">•</span>
                <span className="truncate max-w-[220px]">{row.hashtags.slice(0, 3).join(" ")} {row.hashtags.length > 3 ? `+${row.hashtags.length - 3}` : ""}</span>
              </span>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex lg:hidden items-center gap-1.5 pt-1 flex-wrap">
            {isPaused ? (
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={() => onResume?.(row)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 h-8 text-xs font-bold shadow-sm disabled:opacity-50 transition-colors"
              >
                <Play className="size-3" />
                {t("queue.resume")}
              </button>
            ) : (
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={() => onPause?.(row)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-8 text-xs font-bold hover:bg-zinc-50 shadow-sm disabled:opacity-50 transition-colors"
              >
                <Pause className="size-3" />
                {t("queue.pause")}
              </button>
            )}
            <button
              type="button"
              onClick={() => onReschedule(row)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-8 text-xs font-bold hover:bg-zinc-50 shadow-sm transition-colors"
            >
              <Calendar className="size-3" />
              {t("queue.reschedule")}
            </button>
            <button
              type="button"
              onClick={() => onDuplicate(row)}
              className="inline-flex items-center justify-center size-8 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 shadow-sm transition-colors"
              aria-label={t("queue.duplicate")}
            >
              <Copy className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onCancel(row)}
              className="inline-flex items-center justify-center size-8 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 shadow-sm transition-colors"
              aria-label={t("queue.cancel")}
            >
              <Trash2 className="size-3.5" />
            </button>
            <Link
              href={`/dashboard/calendar?highlight=${row.id}`}
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-2.5 py-1 text-[10px] font-bold"
            >
              <Eye className="size-3" /> View
            </Link>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0 self-center">
          {isPaused ? (
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => onResume?.(row)}
              title={t("queue.resume")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 h-8 text-xs font-bold shadow-sm disabled:opacity-50 transition-colors"
            >
              <Play className="size-3.5" />
              {t("queue.resume")}
            </button>
          ) : (
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => onPause?.(row)}
              title={t("queue.pause")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 h-8 text-xs font-bold hover:bg-zinc-50 shadow-sm disabled:opacity-50 transition-colors"
            >
              <Pause className="size-3.5" />
              {t("queue.pause")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onReschedule(row)}
            title={t("queue.reschedule")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 h-8 text-xs font-bold hover:bg-zinc-50 shadow-sm transition-colors"
          >
            <Calendar className="size-3.5" />
            {t("queue.reschedule")}
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(row)}
            title={t("queue.duplicate")}
            className="inline-flex items-center justify-center size-8 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 shadow-sm transition-colors"
            aria-label={t("queue.duplicate")}
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onCancel(row)}
            title={t("queue.cancel")}
            className="inline-flex items-center justify-center size-8 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 shadow-sm transition-colors"
            aria-label={t("queue.cancel")}
          >
            <Trash2 className="size-3.5" />
          </button>
          <Link
            href={`/dashboard/calendar`}
            className="inline-flex items-center justify-center size-8 rounded-xl bg-zinc-900 hover:bg-black text-white shadow-sm transition-colors"
            title="View in calendar"
          >
            <Eye className="size-3.5" />
          </Link>
        </div>
      </div>
    </li>
  );
}

function StatusPill({ tone, label }: { tone: "blue" | "amber" | "green" | "red" | "zinc" | "violet"; label: string }) {
  const cls: Record<typeof tone, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    zinc: "bg-zinc-100 text-zinc-700 border-zinc-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  const dot: Record<typeof tone, string> = {
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    green: "bg-emerald-500",
    red: "bg-red-500",
    zinc: "bg-zinc-400",
    violet: "bg-violet-500",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold capitalize tracking-wide", cls[tone])}>
      <span className={cn("size-1.5 rounded-full", dot[tone])} />
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
  return (
    <ScheduleModal
      open
      onClose={onCancel}
      onConfirm={(d) => {
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
