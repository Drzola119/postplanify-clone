"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Download,
  RefreshCcw,
  Search,
  Loader2,
  History as HistoryIcon,
  Calendar,
  Clock,
  Image as ImageIcon,
  Video,
  FileText,
  Type as TypeIcon,
  Layers,
  Eye,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Copy,
  RotateCcw,
  Send,
  TrendingUp,
  BarChart3,
  Plus,
  ArrowUpRight,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type Platform =
  | "bluesky"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "twitter"
  | "linkedin"
  | "threads"
  | "facebook"
  | "discord"
  | "telegram"
  | "google_business";

const PLATFORM_LABELS: Record<Platform, string> = {
  bluesky: "Bluesky",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  threads: "Threads",
  facebook: "Facebook",
  discord: "Discord",
  telegram: "Telegram",
  google_business: "Google Business",
};

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

interface PostRow {
  id: string;
  status: "published" | "failed" | "partially_published";
  caption: string;
  platforms: Platform[];
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  failureReason?: string;
  mediaUrls?: string[];
  mediaType?: string;
  hashtags?: string[];
  labels?: string[];
  firstComment?: string;
}

interface HistoryStats {
  published: number;
  failed: number;
  total: number;
  successRate: number | null;
  byPlatform: Record<string, { published: number; failed: number }>;
}

interface HistoryResponse {
  ok: boolean;
  posts: PostRow[];
  stats: HistoryStats;
}

type DateRangePreset = "7d" | "30d" | "90d" | "all";

function sinceIso(preset: DateRangePreset): string | undefined {
  if (preset === "all") return undefined;
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatRelative(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + "…";
}

// ── Media helpers (mirrors queue) ──────────────────────────────────────────
function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes(".mp4") || lower.includes(".mov") || lower.includes(".webm") || lower.includes(".m4v") || lower.includes("video");
}
function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes(".jpg") || lower.includes(".jpeg") || lower.includes(".png") || lower.includes(".gif") || lower.includes(".webp") || lower.includes(".heic") || lower.includes("image");
}
type MediaKind = "image" | "video" | "carousel" | "document" | "text";
function getMediaKind(row: PostRow): MediaKind {
  const urls = row.mediaUrls ?? [];
  const type = row.mediaType?.toLowerCase() ?? "";
  if (type.includes("carousel")) return "carousel";
  if (type.includes("document")) return "document";
  if (type.includes("video")) return "video";
  if (type.includes("image")) return urls.length > 1 ? "carousel" : "image";
  if (urls.length === 0) return "text";
  if (urls.length > 1) return "carousel";
  const first = urls[0] ?? "";
  if (isVideoUrl(first)) return "video";
  if (isImageUrl(first)) return "image";
  return "image";
}
function getThumbnailUrl(row: PostRow): string | null {
  return row.mediaUrls?.[0] ?? null;
}

function MediaThumbnail({ row, size = 68 }: { row: PostRow; size?: number }) {
  const kind = getMediaKind(row);
  const thumb = getThumbnailUrl(row);
  const count = row.mediaUrls?.length ?? 0;
  const base = "relative flex-shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center";
  const style = { width: size, height: size } as const;

  if (kind === "text") {
    return (
      <div className={cn(base, "bg-gradient-to-br from-zinc-50 to-zinc-100")} style={style}>
        <div className="flex flex-col items-center gap-1 p-2 text-center">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-white border border-zinc-200 shadow-sm">
            <TypeIcon className="size-3.5 text-zinc-600" />
          </span>
          <span className="text-[9px] font-semibold tracking-widest text-zinc-500 uppercase">Text</span>
        </div>
        <div className="absolute bottom-2 left-2 right-2 space-y-1 opacity-40 hidden sm:block">
          <div className="h-1 rounded bg-zinc-300 w-[90%]" />
          <div className="h-1 rounded bg-zinc-300 w-[70%]" />
        </div>
      </div>
    );
  }
  if (kind === "document") {
    return (
      <div className={cn(base, "bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200")} style={style}>
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
      <div className={cn(base, "bg-zinc-900")} style={style}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/95 shadow-lg">
            <Video className="size-4 text-zinc-900 ml-0.5" />
          </span>
        </span>
        <span className="absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-full bg-black/80 text-white text-[9px] font-semibold px-1.5 py-0.5">
          <Video className="size-2.5" /> VIDEO
        </span>
        {count > 1 && (
          <span className="absolute top-1 right-1 inline-flex items-center rounded-full bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5">+{count}</span>
        )}
      </div>
    );
  }
  if (kind === "carousel") {
    return (
      <div className={cn(base, "bg-white")} style={style}>
        {thumb ? (
          <>
            <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-xl bg-zinc-200 border border-zinc-200" />
            <div className="absolute inset-0 rounded-xl overflow-hidden border border-zinc-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <span className="absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white text-[9px] font-semibold px-1.5 py-0.5 shadow">
              <Layers className="size-2.5" /> {count}
            </span>
            <span className="absolute top-1 left-1 inline-flex items-center rounded-full bg-white/95 border border-zinc-200 text-zinc-700 text-[8px] font-bold px-1.5 py-0.5">CAROUSEL</span>
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
  return (
    <div className={cn(base, "bg-zinc-100")} style={style}>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <ImageIcon className="size-6 text-zinc-400" />
      )}
      <span className="absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-full bg-black/75 text-white text-[9px] font-semibold px-1.5 py-0.5">
        <ImageIcon className="size-2.5" /> IMG
      </span>
      {count > 1 && <span className="absolute top-1 right-1 inline-flex items-center rounded-full bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5">+{count - 1}</span>}
    </div>
  );
}

function StatusPill({ status }: { status: PostRow["status"] }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Published
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">
        <span className="size-1.5 rounded-full bg-red-500" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
      <span className="size-1.5 rounded-full bg-amber-500" />
      Partial
    </span>
  );
}

export default function PublishHistoryPage() {
  const t = useTranslations("dashboard");
  const { toast } = useToast();
  const PRESETS: { value: DateRangePreset; label: string }[] = [
    { value: "7d", label: t("posts.history.last_7_days") },
    { value: "30d", label: t("posts.history.last_30_days") },
    { value: "90d", label: t("posts.history.last_90_days") },
    { value: "all", label: t("posts.history.all_time") },
  ];
  const STATUS_FILTERS: { value: "all" | "published" | "failed"; label: string }[] = [
    { value: "all", label: t("posts.history.filter_all") },
    { value: "published", label: t("posts.history.filter_published") },
    { value: "failed", label: t("posts.history.filter_failed") },
  ];
  const [rangePreset, setRangePreset] = useState<DateRangePreset>("30d");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "failed">("all");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    published: 0,
    failed: 0,
    total: 0,
    successRate: null,
    byPlatform: {},
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const params = new URLSearchParams();
        const from = sinceIso(rangePreset);
        if (from) params.set("from", from);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (platformFilter !== "all") params.set("platform", platformFilter);
        params.set("pageSize", "100");
        const res = await fetch(`/api/posts/history?${params.toString()}`, {
          credentials: "include",
          headers: getOverrideHeaders(),
        });
        if (!res.ok) {
          if (!cancelled) setErrorMsg(t("posts.history.load_error", { status: res.status }));
          return;
        }
        const data = (await res.json()) as HistoryResponse & { posts: Array<Record<string, unknown>> };
        if (cancelled) return;
        const normalized: PostRow[] = (data.posts as unknown as Array<Record<string, unknown>>).map((r) => ({
          id: String(r.id ?? ""),
          status: (r.status as PostRow["status"]) ?? "published",
          caption: String(r.caption ?? ""),
          platforms: Array.isArray(r.platforms) ? (r.platforms as Platform[]) : [],
          publishedAt: r.publishedAt ? String(r.publishedAt) : undefined,
          createdAt: String(r.createdAt ?? new Date().toISOString()),
          updatedAt: r.updatedAt ? String(r.updatedAt) : undefined,
          failureReason: r.failureReason ? String(r.failureReason) : undefined,
          mediaUrls: Array.isArray(r.mediaUrls) ? (r.mediaUrls as string[]) : [],
          mediaType: r.mediaType ? String(r.mediaType) : undefined,
          hashtags: Array.isArray(r.hashtags) ? (r.hashtags as string[]) : [],
          labels: Array.isArray(r.labels) ? (r.labels as string[]) : [],
          firstComment: r.firstComment ? String(r.firstComment) : undefined,
        }));
        setPosts(normalized);
        setStats((data.stats as HistoryStats) ?? { published: 0, failed: 0, total: 0, successRate: null, byPlatform: {} });
      } catch {
        if (!cancelled) setErrorMsg(t("posts.history.network_error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rangePreset, statusFilter, platformFilter, reloadKey, t]);

  const filteredPosts = useMemo(() => {
    let list = posts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.caption.toLowerCase().includes(q) || p.platforms.some((pl) => pl.toLowerCase().includes(q)) || (p.failureReason ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [posts, search]);

  const grouped = useMemo(() => {
    const buckets: Record<string, PostRow[]> = {
      today: [],
      yesterday: [],
      "this-week": [],
      earlier: [],
    };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 7 * 86400000;
    for (const p of filteredPosts) {
      const ts = Date.parse(p.publishedAt ?? p.createdAt);
      if (Number.isNaN(ts) || ts >= todayStart) buckets.today.push(p);
      else if (ts >= yesterdayStart) buckets.yesterday.push(p);
      else if (ts >= weekStart) buckets["this-week"].push(p);
      else buckets.earlier.push(p);
    }
    return buckets;
  }, [filteredPosts]);

  const successRate = stats.successRate;
  const publishedPct = successRate ?? 0;

  function esc(v: string) {
    return /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }

  const csvContent = useMemo(() => {
    const headers = ["id", "status", "caption", "platforms", "publishedAt", "mediaType", "mediaCount"];
    const rows = filteredPosts.map((p) => [esc(p.id), esc(p.status), esc(p.caption), esc(p.platforms.join("|")), esc(p.publishedAt ?? ""), esc(p.mediaType ?? getMediaKind(p)), esc(String(p.mediaUrls?.length ?? 0))].join(","));
    return [headers.join(","), ...rows].join("\n");
  }, [filteredPosts]);

  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostRow | null>(null);

  async function handleRetry(post: PostRow) {
    if (retryingId) return;
    setRetryingId(post.id);
    setRetryError(null);
    try {
      const res = await fetch(`/api/posts/scheduled/${encodeURIComponent(post.id)}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
        credentials: "include",
        body: JSON.stringify({ clearReason: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setRetryError(body.error ?? `Retry failed (${res.status})`);
        toast({ title: "Retry failed", description: body.error ?? `HTTP ${res.status}`, tone: "error" });
        return;
      }
      toast({ title: "Retry queued", description: "Post moved back to queue", tone: "success" });
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, failureReason: undefined } : p)));
      setReloadKey((k) => k + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setRetryError(msg);
      toast({ title: "Retry failed", description: msg, tone: "error" });
    } finally {
      setRetryingId(null);
    }
  }

  async function handleDuplicate(post: PostRow) {
    try {
      const res = await fetch(`/api/posts/scheduled/${encodeURIComponent(post.id)}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({ title: "Duplicate failed", description: body.error ?? `HTTP ${res.status}`, tone: "error" });
        return;
      }
      toast({ title: "Post duplicated", description: "Draft created — open drafts to schedule", tone: "success" });
    } catch (e) {
      toast({ title: "Duplicate failed", description: e instanceof Error ? e.message : "Network error", tone: "error" });
    }
  }

  function handleDownloadCsv() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `publish-history-${rangePreset}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const summaryCards = [
    {
      label: t("posts.history.published"),
      value: stats.published,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-500",
      sub: `${stats.total} total`,
      footer: publishedPct > 80 ? "Excellent" : publishedPct > 50 ? "Good" : "Needs attention",
    },
    {
      label: t("posts.history.failed"),
      value: stats.failed,
      icon: XCircle,
      gradient: "from-red-500 to-rose-500",
      sub: stats.failed === 0 ? "No failures" : `${stats.failed} need retry`,
      footer: stats.failed === 0 ? "All clear" : "Retry available",
    },
    {
      label: t("posts.history.success_rate"),
      value: successRate === null ? t("posts.history.na") : `${successRate}%`,
      icon: TrendingUp,
      gradient: "from-blue-500 to-indigo-500",
      sub: stats.total > 0 ? t("posts.history.total_attempts", { count: stats.total }) : t("posts.history.no_attempts"),
      footer: publishedPct >= 90 ? "Top performer" : publishedPct >= 70 ? "On track" : "Review failures",
    },
    {
      label: t("posts.history.date_range"),
      value: PRESETS.find((p) => p.value === rangePreset)?.label ?? "Custom",
      icon: Calendar,
      gradient: "from-violet-500 to-purple-500",
      sub: t("posts.history.showing", { count: filteredPosts.length }),
      footer: `${PRESETS.find((p) => p.value === rangePreset)?.label ?? ""} • ${filteredPosts.length} showing`,
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
                <HistoryIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-zinc-900 dark:text-white leading-none">{t("posts.history.page_title")}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold tracking-widest px-2 py-0.5 uppercase">
                    <Sparkles className="size-3" /> Pro
                  </span>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border", successRate !== null && successRate >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : successRate !== null && successRate >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-zinc-100 text-zinc-700 border-zinc-200")}>
                    <BarChart3 className="size-3.5" />
                    {successRate === null ? "—" : `${successRate}% success`}
                  </span>
                </div>
                <p className="text-[13px] sm:text-sm text-zinc-500 mt-1 max-w-[640px] leading-relaxed">{t("posts.history.page_subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/dashboard/posts/history" className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm">
                <HistoryIcon className="size-3.5" /> History
              </Link>
              <Link href="/dashboard/queue" className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm">
                <Send className="size-3.5" /> Queue
              </Link>
              <Link href="/dashboard/calendar" className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm">
                <Calendar className="size-3.5" /> Calendar
              </Link>
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold hover:bg-zinc-50 shadow-sm">
                <RefreshCcw className={cn("size-3.5", loading && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <Link href="/dashboard/posts/create" className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white px-4 h-9 text-xs font-bold shadow-sm">
                <Plus className="size-3.5" /> Create Post <ArrowUpRight className="size-3 opacity-70 hidden sm:block" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <Link href="/dashboard/queue" className="inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white border border-transparent hover:border-zinc-200 px-2.5 py-1 font-medium text-zinc-600 transition-colors">
              Queue <ExternalLink className="size-3 opacity-50" />
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-2.5 py-1 font-bold">History</span>
            <Link href="/dashboard/calendar" className="inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white border border-transparent hover:border-zinc-200 px-2.5 py-1 font-medium text-zinc-600 transition-colors">
              Calendar <ExternalLink className="size-3 opacity-50" />
            </Link>
            <Link href="/dashboard/posts/drafts" className="inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white border border-transparent hover:border-zinc-200 px-2.5 py-1 font-medium text-zinc-600 transition-colors">
              Drafts
            </Link>
            <span className="text-zinc-400 hidden sm:inline">• Past publishes with retry + duplicate</span>
          </div>
        </div>

        {retryError ? (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm">
            <XCircle className="size-4 mt-0.5 shrink-0" />
            <span className="font-medium">Retry failed: {retryError}</span>
            <button type="button" onClick={() => setRetryError(null)} className="ml-auto inline-flex size-7 items-center justify-center rounded-full bg-white border border-rose-200 text-rose-700 hover:bg-rose-100">
              ×
            </button>
          </div>
        ) : null}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {summaryCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all">
                <div className="absolute top-0 right-0 size-24 bg-gradient-to-br from-zinc-50 to-white rounded-full blur-2xl opacity-60 -mr-8 -mt-8 pointer-events-none" />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className={cn("inline-flex items-center justify-center size-9 sm:size-10 rounded-xl text-white shadow-sm shrink-0 bg-gradient-to-br", s.gradient)}>
                      <Icon className="size-4 sm:size-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-zinc-500 leading-none truncate">{s.label}</p>
                      <p className="text-[11px] text-zinc-400 font-medium truncate hidden sm:block">{s.sub}</p>
                    </div>
                  </div>
                </div>
                <div className="relative mt-3">
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 leading-none">{loading ? <span className="inline-block h-7 w-12 rounded bg-zinc-100 animate-pulse" /> : s.value}</p>
                  {s.footer && <p className="text-[10px] font-semibold text-zinc-500 mt-1 hidden sm:block">{s.footer}</p>}
                </div>
                {s.label.includes("Success") && successRate !== null && (
                  <div className="mt-2 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", successRate >= 80 ? "bg-emerald-500" : successRate >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${Math.min(100, Math.max(0, successRate))}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Filters ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-2 sm:p-3 space-y-2 sm:space-y-3">
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("posts.history.search_placeholder")}
                className="w-full pl-10 pr-10 h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-colors"
                aria-label={t("posts.history.search_placeholder")}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-7 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-black">
                  ×
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-full bg-zinc-100 p-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setRangePreset(p.value)}
                    className={cn("inline-flex items-center justify-center rounded-full px-3 h-7 text-xs font-bold transition-all", rangePreset === p.value ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="hidden sm:inline-flex rounded-full bg-zinc-100 p-1">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatusFilter(s.value)}
                    className={cn("inline-flex items-center justify-center rounded-full px-3 h-7 text-xs font-bold transition-all", statusFilter === s.value ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-600 hover:text-zinc-900")}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value as Platform | "all")}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                aria-label="Platform filter"
              >
                <option value="all">{t("posts.history.all_platforms")}</option>
                {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5 flex-wrap lg:hidden">
              <span className="text-xs font-bold text-zinc-500 mr-1">Status:</span>
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={cn("inline-flex items-center justify-center rounded-full px-3 h-7 text-xs font-bold border transition-all", statusFilter === s.value ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200")}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                <Eye className="size-3.5" /> {filteredPosts.length} visible
              </span>
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={filteredPosts.length === 0}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs font-bold hover:bg-zinc-50 disabled:opacity-50 shadow-sm"
              >
                <Download className="size-3.5" />
                {t("posts.history.export_csv")}
              </button>
            </div>
          </div>
        </div>

        {errorMsg ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">{errorMsg}</div> : null}

        {/* ── History List ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-zinc-50 to-white">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex size-8 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm shrink-0">
                <HistoryIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-zinc-900 leading-none">Publish log</p>
                <p className="text-xs text-zinc-500 font-medium">
                  {loading ? "Loading…" : `${filteredPosts.length} of ${posts.length} • `}
                  <span className="hidden sm:inline">{stats.published} published • {stats.failed} failed</span>
                  <span className="sm:hidden">{stats.published}✓ {stats.failed}✕</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm">
                <Timer className="size-3" />
                Newest first
              </span>
              <Link href="/dashboard/queue" className="hidden sm:inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-3 py-1.5 text-[11px] font-bold hover:bg-black">
                View Queue <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="p-4 sm:p-5 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 p-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 animate-pulse">
                  <div className="size-[68px] rounded-xl bg-zinc-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded bg-zinc-200 w-1/3" />
                    <div className="h-4 rounded bg-zinc-200 w-3/4" />
                    <div className="h-3 rounded bg-zinc-100 w-1/2" />
                  </div>
                  <div className="hidden sm:block h-8 w-24 rounded-xl bg-zinc-200" />
                </div>
              ))}
              <p className="text-center text-sm text-zinc-500 py-2 flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" /> {t("posts.history.loading")}
              </p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="px-5 py-16 flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
                <HistoryIcon className="size-5 text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900">{t("posts.history.empty_title")}</h3>
              <p className="mt-1 text-sm text-zinc-500 max-w-sm">{t("posts.history.empty_subtitle")}</p>
              <div className="mt-4 flex gap-2">
                <Link href="/dashboard/posts/create" className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 text-white px-4 h-9 text-xs font-bold hover:bg-black">
                  <Plus className="size-3.5" /> Create Post
                </Link>
                <Link href="/dashboard/queue" className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 h-9 text-xs font-bold hover:bg-zinc-50">
                  View Queue
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {(["today", "yesterday", "this-week", "earlier"] as const).map((bucket) => {
                const items = grouped[bucket];
                if (!items || items.length === 0) return null;
                const label = bucket === "today" ? "Today" : bucket === "yesterday" ? "Yesterday" : bucket === "this-week" ? "This week" : "Earlier";
                return (
                  <div key={bucket} className="border-b border-zinc-100 last:border-b-0">
                    <div className="sticky top-0 z-10 px-4 sm:px-5 py-2.5 border-b bg-zinc-50/90 backdrop-blur text-xs font-bold flex items-center gap-2 text-zinc-700">
                      <span className="size-1.5 rounded-full bg-zinc-400" />
                      {label} <span className="inline-flex items-center justify-center min-w-6 h-5 rounded-full px-1.5 text-[10px] font-black bg-zinc-900 text-white border border-zinc-900">{items.length}</span>
                    </div>
                    <ul className="divide-y divide-zinc-100">
                      {items.map((p) => (
                        <HistoryRow
                          key={p.id}
                          post={p}
                          onRetry={handleRetry}
                          onDuplicate={handleDuplicate}
                          onView={setSelectedPost}
                          retryingId={retryingId}
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
          History shows <Link href="/dashboard/queue" className="underline decoration-dotted hover:text-zinc-600">queued</Link> posts after they publish. Retry moves failed posts back to queue. Duplicate creates a new draft.
        </p>
      </div>

      {/* ── Details Modal ── */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-zinc-200 flex flex-col">
            <div className="px-5 sm:px-6 py-4 border-b border-zinc-200 flex items-center justify-between gap-4 bg-zinc-50">
              <div className="flex items-center gap-3 min-w-0">
                <MediaThumbnail row={selectedPost} size={48} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 leading-none flex items-center gap-2">
                    Post details <StatusPill status={selectedPost.status} />
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{formatDateTime(selectedPost.publishedAt ?? selectedPost.createdAt)} • {formatRelative(selectedPost.publishedAt ?? selectedPost.createdAt)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedPost(null)} className="inline-flex size-8 items-center justify-center rounded-full bg-white border border-zinc-200 hover:bg-zinc-50">
                ×
              </button>
            </div>
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* large media preview if available */}
              {getThumbnailUrl(selectedPost) && getMediaKind(selectedPost) !== "text" && (
                <div className="rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getThumbnailUrl(selectedPost)!} alt="" className="w-full max-h-[360px] object-contain bg-white" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-1">Caption</p>
                <p className="text-sm leading-relaxed text-zinc-900 whitespace-pre-wrap">{selectedPost.caption || <span className="italic text-zinc-400">{t("posts.history.no_caption")}</span>}</p>
              </div>
              {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-1">Hashtags</p>
                  <p className="text-sm text-blue-600">{selectedPost.hashtags.join(" ")}</p>
                </div>
              )}
              {selectedPost.failureReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-bold text-red-700 flex items-center gap-1.5"><AlertTriangle className="size-3.5" /> Failure reason</p>
                  <p className="text-sm text-red-700 mt-1">{selectedPost.failureReason}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {selectedPost.platforms.map((pl) => (
                  <span key={pl} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold", "bg-white border-zinc-200 text-zinc-700")}>
                    <span className={cn("inline-flex size-5 items-center justify-center rounded-full text-white text-[10px]", PLATFORM_COLORS[pl] ?? "bg-zinc-700", PLATFORM_COLORS[pl]?.startsWith("from-") ? `bg-gradient-to-br ${PLATFORM_COLORS[pl]}` : "")}>{platformEmoji(pl)}</span>
                    {PLATFORM_LABELS[pl] ?? pl}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Published</p>
                  <p className="font-medium text-zinc-900 mt-1">{formatDateTime(selectedPost.publishedAt)}</p>
                  <p className="text-zinc-500">{formatRelative(selectedPost.publishedAt)}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Media</p>
                  <p className="font-medium text-zinc-900 mt-1 capitalize">{getMediaKind(selectedPost)} • {selectedPost.mediaUrls?.length ?? 0} file(s)</p>
                  <p className="text-zinc-500">{selectedPost.mediaType ?? "—"}</p>
                </div>
              </div>
            </div>
            <div className="px-5 sm:px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setSelectedPost(null)} className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 h-9 text-xs font-bold hover:bg-zinc-50">
                Close
              </button>
              {selectedPost.status === "failed" && (
                <button
                  type="button"
                  onClick={() => {
                    handleRetry(selectedPost);
                    setSelectedPost(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 h-9 text-xs font-bold"
                >
                  <RotateCcw className="size-3.5" /> Retry now
                </button>
              )}
              <button type="button" onClick={() => { handleDuplicate(selectedPost); setSelectedPost(null); }} className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white px-4 h-9 text-xs font-bold">
                <Copy className="size-3.5" /> Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryRow({
  post,
  onRetry,
  onDuplicate,
  onView,
  retryingId,
}: {
  post: PostRow;
  onRetry: (p: PostRow) => void;
  onDuplicate: (p: PostRow) => void;
  onView: (p: PostRow) => void;
  retryingId: string | null;
}) {
  const t = useTranslations("dashboard");
  const isFailed = post.status === "failed";
  const kind = getMediaKind(post);
  return (
    <li className="group px-3 sm:px-5 py-3 sm:py-4 hover:bg-zinc-50/80 transition-colors flex gap-3 sm:gap-4">
      <div className="shrink-0 self-start">
        <MediaThumbnail row={post} size={68} />
        <div className="sm:hidden mt-1 flex justify-center">
          <span className="inline-flex items-center rounded-full bg-zinc-900 text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-widest">{kind}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <StatusPill status={post.status} />
          <div className="flex items-center gap-1">
            {post.platforms.slice(0, 4).map((p) => {
              const bg = PLATFORM_COLORS[p] ?? "bg-zinc-800";
              const isGrad = bg.startsWith("from-");
              return (
                <span key={p} title={PLATFORM_LABELS[p] ?? p} className={cn("inline-flex items-center justify-center size-6 sm:size-7 rounded-full text-white text-[11px] shadow-sm border border-white shrink-0", isGrad ? `bg-gradient-to-br ${bg}` : bg)}>
                  {platformEmoji(p)}
                </span>
              );
            })}
            {post.platforms.length > 4 && <span className="inline-flex items-center justify-center size-6 sm:size-7 rounded-full bg-zinc-900 text-white text-[10px] font-bold border border-white">+{post.platforms.length - 4}</span>}
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-600 shadow-sm">
            <Clock className="size-3" /> {formatRelative(post.publishedAt ?? post.createdAt)}
          </span>
          {isFailed && post.failureReason && (
            <span className="hidden lg:inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-1 text-[10px] font-bold text-red-700 max-w-[260px] truncate">
              <AlertTriangle className="size-3" /> {truncate(post.failureReason, 60)}
            </span>
          )}
        </div>

        <p className="text-[13px] sm:text-[14px] font-medium text-zinc-900 leading-[1.4] line-clamp-2">{post.caption ? truncate(post.caption, 140) : <span className="italic text-zinc-400 font-normal">{t("posts.history.no_caption")}</span>}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3" /> {formatDateTime(post.publishedAt ?? post.createdAt)}
          </span>
          <span className="hidden sm:inline text-zinc-300">•</span>
          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs">
            {post.platforms.length} platform{post.platforms.length !== 1 ? "s" : ""} •{" "}
            <span className="inline-flex items-center gap-1">
              {kind === "video" ? <Video className="size-3" /> : kind === "carousel" ? <Layers className="size-3" /> : kind === "text" ? <TypeIcon className="size-3" /> : kind === "document" ? <FileText className="size-3" /> : <ImageIcon className="size-3" />}
              {kind} {post.mediaUrls && post.mediaUrls.length > 0 ? `• ${post.mediaUrls.length} file(s)` : ""}
            </span>
          </span>
        </div>

        {isFailed && post.failureReason && <p className="lg:hidden text-xs text-red-600 line-clamp-1 bg-red-50 border border-red-100 rounded-lg px-2 py-1">{post.failureReason}</p>}

        <div className="flex lg:hidden items-center gap-1.5 pt-1 flex-wrap">
          <button type="button" onClick={() => onView(post)} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-8 text-xs font-bold hover:bg-zinc-50 shadow-sm">
            <Eye className="size-3.5" /> View
          </button>
          <button type="button" onClick={() => onDuplicate(post)} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-8 text-xs font-bold hover:bg-zinc-50 shadow-sm">
            <Copy className="size-3.5" /> Duplicate
          </button>
          {isFailed && (
            <button
              type="button"
              onClick={() => onRetry(post)}
              disabled={retryingId === post.id}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-3 h-8 text-xs font-bold shadow-sm disabled:opacity-50"
            >
              {retryingId === post.id ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
              Retry
            </button>
          )}
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0 self-center">
        <button type="button" onClick={() => onView(post)} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 h-8 text-xs font-bold hover:bg-zinc-50 shadow-sm">
          <Eye className="size-3.5" /> View
        </button>
        <button type="button" onClick={() => onDuplicate(post)} className="inline-flex items-center justify-center size-8 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 shadow-sm" title="Duplicate">
          <Copy className="size-3.5" />
        </button>
        {isFailed ? (
          <button
            type="button"
            onClick={() => onRetry(post)}
            disabled={retryingId === post.id}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-3.5 h-8 text-xs font-bold shadow-sm disabled:opacity-50"
          >
            {retryingId === post.id ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3.5" />}
            Retry
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 text-[11px] font-bold">
            <CheckCircle2 className="size-3" /> Delivered
          </span>
        )}
      </div>
    </li>
  );
}
