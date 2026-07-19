"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  RefreshCcw,
  Search,
  Loader2,
  History as HistoryIcon,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { PLATFORMS } from "@/lib/platforms";

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
};

const PLATFORM_META = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p])
) as Record<Platform, (typeof PLATFORMS)[number]>;

interface PostRow {
  id: string;
  status: "published" | "failed";
  caption: string;
  platforms: Platform[];
  publishedAt?: string;
  createdAt: string;
  failureReason?: string;
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
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + "…";
}

export default function PublishHistoryPage() {
  const t = useTranslations("dashboard");
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
        const data = (await res.json()) as HistoryResponse;
        if (cancelled) return;
        setPosts(data.posts ?? []);
        setStats(data.stats ?? { published: 0, failed: 0, total: 0, successRate: null, byPlatform: {} });
      } catch (err) {
        if (!cancelled) setErrorMsg(t("posts.history.network_error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rangePreset, statusFilter, platformFilter, reloadKey]);

  const filteredPosts = useMemo(() => {
    let list = posts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.caption.toLowerCase().includes(q));
    }
    return list;
  }, [posts, search]);

  function esc(v: string) {
    return /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }

  const csvHref = useMemo(() => {
    const headers = ["id", "status", "caption", "platforms", "publishedAt"];
    const rows = (filteredPosts.length ? filteredPosts : []).map((p) =>
      [esc(p.id), esc(p.status), esc(p.caption), esc(p.platforms.join("|")), esc(p.publishedAt ?? "")].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    return URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  }, [filteredPosts]);

  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

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
        return;
      }
      // Optimistically remove the failure reason — the post is now re-queued
      // for the worker to pick up. Reload the full list so stats reflect the
      // new state.
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, failureReason: undefined } : p))
      );
      // Trigger a reload by toggling a re-render via the data fetch effect.
      setReloadKey((k) => k + 1);
    } catch (e) {
      setRetryError(e instanceof Error ? e.message : "Network error");
    } finally {
      setRetryingId(null);
    }
  }

  function handleDownloadCsv() {
    const a = document.createElement("a");
    a.href = csvHref;
    a.download = `publish-history-${rangePreset}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="px-3 lg:px-6 pt-5 lg:pt-8 pb-3 lg:pb-6">
      <PageHeader
        title={t("posts.history.page_title")}
        subtitle={t("posts.history.page_subtitle")}
      />

      {retryError ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-900">
          <XCircle className="size-3.5 mt-0.5 shrink-0" />
          <span>Retry failed: {retryError}</span>
          <button
            type="button"
            onClick={() => setRetryError(null)}
            className="ml-auto text-rose-700 hover:text-rose-900"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t("posts.history.published")}
          value={stats.published}
          icon={<CheckCircle2 className="size-4" />}
          iconClassName="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label={t("posts.history.failed")}
          value={stats.failed}
          icon={<XCircle className="size-4" />}
          iconClassName="bg-red-50 text-red-600"
        />
        <StatCard
          label={t("posts.history.success_rate")}
          value={stats.successRate === null ? t("posts.history.na") : `${stats.successRate}%`}
          icon={<RefreshCcw className="size-4" />}
          iconClassName="bg-blue-50 text-blue-700"
          footer={stats.total > 0 ? t("posts.history.total_attempts", { count: stats.total }) : t("posts.history.no_attempts")}
        />
        <StatCard
          label={t("posts.history.date_range")}
          value={PRESETS.find((p) => p.value === rangePreset)?.label ?? "Custom"}
          icon={<Calendar className="size-4" />}
          iconClassName="bg-violet-50 text-violet-700"
          footer={stats.total > 0 ? t("posts.history.showing", { count: filteredPosts.length }) : null}
        />
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-zinc-200 bg-white mb-4">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-zinc-200 bg-zinc-50">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("posts.history.search_placeholder")}
              className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              aria-label={t("posts.history.search_placeholder")}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-zinc-500" />
            <select
              value={rangePreset}
              onChange={(e) => setRangePreset(e.target.value as DateRangePreset)}
              className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              aria-label="Date range"
            >
              {PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "failed")}
              className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              aria-label="Status filter"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as Platform | "all")}
              className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
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
          <div className="ml-auto">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={filteredPosts.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="size-3.5" />
              {t("posts.history.export_csv")}
            </button>
          </div>
        </div>
      </div>

      {errorMsg ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      {/* Table */}
      {loading ? (
        <LoadingState />
      ) : filteredPosts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-[100px]">{t("posts.history.col_status")}</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("posts.history.col_caption")}</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-[200px]">{t("posts.history.col_platforms")}</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-[180px]">{t("posts.history.col_date")}</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-[130px]">{t("posts.history.col_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-5 py-3 align-middle">
                      {p.status === "published" ? (
                        <StatusBadge tone="green" icon={<CheckCircle2 className="size-3" />}>
                          {t("posts.history.published")}
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="red" icon={<XCircle className="size-3" />}>
                          {t("posts.history.failed")}
                        </StatusBadge>
                      )}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <p className="text-sm text-zinc-900 line-clamp-2 max-w-[480px]" title={p.caption}>
                        {truncate(p.caption || t("posts.history.no_caption"), 140)}
                      </p>
                      {p.failureReason ? (
                        <p className="mt-1 text-xs text-red-600 line-clamp-1" title={p.failureReason}>
                          {p.failureReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="flex flex-wrap gap-1.5">
                        {p.platforms.map((plat) => (
                          <div key={plat} className="inline-flex items-center gap-1.5">
                            <PlatformAvatar platform={PLATFORM_META[plat]} size={20} rounded="sm" />
                            <span className="text-[11px] font-medium">{PLATFORM_LABELS[plat]}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle text-sm text-zinc-700">
                      {formatDateTime(p.publishedAt)}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/posts/drafts`}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-zinc-200 bg-white text-xs font-medium hover:bg-zinc-50"
                          title={t("posts.history.view")}
                        >
                          {t("posts.history.view")}
                          <ArrowRight className="size-3" />
                        </Link>
                        {p.status === "failed" ? (
                          <button
                            type="button"
                            onClick={() => handleRetry(p)}
                            disabled={retryingId === p.id}
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-medium disabled:opacity-50"
                            title={t("posts.history.retry")}
                          >
                            {retryingId === p.id ? <Loader2 className="size-3 animate-spin" /> : null}
                            {t("posts.history.retry")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  const t = useTranslations("dashboard");
  return (
    <div className="rounded-xl border border-zinc-200 bg-white py-16 flex flex-col items-center justify-center">
      <Loader2 className="size-5 animate-spin text-zinc-400" />
      <p className="mt-3 text-sm text-zinc-500">{t("posts.history.loading")}</p>
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("dashboard");
  return (
    <div className="rounded-xl border border-zinc-200 bg-white py-16 flex flex-col items-center justify-center">
      <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
        <HistoryIcon className="size-5 text-zinc-400" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">{t("posts.history.empty_title")}</h3>
      <p className="mt-1 text-sm text-zinc-500 max-w-sm text-center">
        {t("posts.history.empty_subtitle")}
      </p>
    </div>
  );
}
