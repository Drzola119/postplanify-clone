"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  Calendar as CalIcon,
  Plus,
  Filter as FilterIcon,
  Check,
  Tag as TagIcon,
  Trophy,
  Trash2,
  Download,
  Copy,
  RefreshCw,
  RotateCcw,
  Loader2,
  Search,
  X as XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";
import { toCsv, downloadCsv } from "@/lib/csv";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/contexts/AuthContext";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import {
  comparePostsChronologically,
  fmtISO,
  formatInZone,
  groupPostsByDay,
  isSameDay,
  monthGridStart,
  normalizePlatforms,
  normalizeStatus,
  parseISODate,
  postMatchesFilters,
  weekBounds,
  type CalendarPost,
  type CalendarPlatform,
  type PostFilters,
} from "@/lib/posts/calendar";

type ViewMode = "weekly" | "monthly" | "list";
type MediaKindFilter = "any" | "text" | "image" | "video";
type StatusFilterValue = "all" | CalendarPost["status"];
type PlatformFilterValue = "all" | CalendarPlatform;

const PLATFORM_LABELS: Record<CalendarPlatform, string> = {
  bluesky: "Bluesky",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  threads: "Threads",
  facebook: "Facebook",
  discord: "Discord",
  telegram: "Telegram",
  google_business: "Google Business",
  reddit: "Reddit",
};

const STATUS_META: Record<CalendarPost["status"], { bg: string; text: string; border: string; label: string }> = {
  draft: { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-500", label: "Draft" },
  queued: { bg: "bg-sky-500/10", text: "text-sky-700", border: "border-sky-500", label: "Queued" },
  scheduled: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500 dark:border-emerald-400/20",
    label: "Scheduled",
  },
  publishing: { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500", label: "Publishing" },
  published: { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-300", label: "Published" },
  partially_published: { bg: "bg-violet-500/10", text: "text-violet-700", border: "border-violet-500", label: "Partially published" },
  failed: { bg: "bg-red-500/10", text: "text-red-700", border: "border-red-500", label: "Failed" },
  archived: { bg: "bg-zinc-100", text: "text-zinc-500", border: "border-zinc-300", label: "Archived" },
  paused: { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-500", label: "Paused" },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PAGE_SIZE = 50;
const DELETE_CONCURRENCY = 3;

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function weekRangeLabel(d: Date): string {
  const { start, end } = weekBounds(d);
  const endInclusive = addDays(end, -1);
  const fmt = (x: Date) => x.toLocaleString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} - ${fmt(endInclusive)}, ${endInclusive.getFullYear()}`;
}

function formatLongDateTime(iso: string | undefined, timeZone: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function platformMeta(p: CalendarPlatform): { id: CalendarPlatform; name: string; handle: string; avatar: null; charLimit: number; borderClass: string; textClass: string; icon: string } {
  return {
    id: p,
    name: PLATFORM_LABELS[p] ?? p,
    handle: "",
    avatar: null,
    charLimit: 0,
    borderClass: "",
    textClass: "",
    icon: "",
  };
}

function statusMetaOf(s: CalendarPost["status"]) {
  return STATUS_META[s] ?? STATUS_META.draft;
}

function isActionable(status: CalendarPost["status"]): boolean {
  return status === "draft" || status === "scheduled" || status === "queued" || status === "paused" || status === "failed";
}

function canRetry(status: CalendarPost["status"]): boolean {
  return status === "failed" || status === "paused";
}

function canDuplicate(status: CalendarPost["status"]): boolean {
  return status === "published" || status === "scheduled" || status === "failed" || status === "draft" || status === "paused" || status === "archived";
}

function mediaKindFromUrl(u: string): "image" | "video" | "other" {
  if (/\.(jpe?g|png|gif|webp|bmp|heic|heif)(\?|$)/i.test(u)) return "image";
  if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(u)) return "video";
  return "other";
}

function accountLabelForPost(post: CalendarPost): string | undefined {
  if (post.profile) return post.profile;
  if (post.platforms[0]) return PLATFORM_LABELS[post.platforms[0]];
  return undefined;
}

export default function PostsCalendarPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);

  // Data
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Filters
  const [draftSearch, setDraftSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftMediaKind, setDraftMediaKind] = useState<MediaKindFilter>("any");
  const [appliedMediaKind, setAppliedMediaKind] = useState<MediaKindFilter>("any");
  const [draftStatus, setDraftStatus] = useState<StatusFilterValue>("all");
  const [appliedStatus, setAppliedStatus] = useState<StatusFilterValue>("all");
  const [draftPlatform, setDraftPlatform] = useState<PlatformFilterValue>("all");
  const [appliedPlatform, setAppliedPlatform] = useState<PlatformFilterValue>("all");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  // Timezone (display-only)
  const [timeZone, setTimeZone] = useState<string>("UTC");
  useEffect(() => {
    try {
      const guess = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (guess) setTimeZone(guess);
    } catch {
      // SSR — keep UTC
    }
  }, []);

  // Resize: auto-switch to List on narrow viewports
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth < 1280 && view !== "list") {
        setView("list");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [view]);

  // ── Data loading (paginated) ────────────────────────────────────────
  const loadingRef = useRef(false);
  const loadPosts = useCallback(
    async (opts: { cursor?: string; append: boolean; reason: "initial" | "refresh" | "paginate" }) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        if (opts.reason === "initial") setLoading(true);
        else if (opts.reason === "refresh") setRefreshing(true);
        setLoadError(null);

        const idToken = await getIdToken();
        const params = new URLSearchParams();
        params.set("pageSize", String(PAGE_SIZE));
        if (opts.cursor) params.set("cursor", opts.cursor);

        const incoming: CalendarPost[] = [];
        let cursor = opts.cursor;
        let nextPageCursor: string | null = null;
        let pagesLoaded = 0;
        const MAX_INITIAL_PAGES = 6; // 300 posts cap on first paint — avoids OOM on 10k-post workspaces
        do {
          const pageParams = new URLSearchParams(params);
          if (cursor) pageParams.set("cursor", cursor);
          else pageParams.delete("cursor");
          const res = await fetch(`/api/posts?${pageParams.toString()}`, {
            credentials: "include",
            cache: "no-store",
            headers: {
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
              ...getOverrideHeaders(),
            },
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            setLoadError(`Failed to load posts (${res.status}${text ? `: ${text}` : ""})`);
            if (!opts.append) setPosts([]);
            return;
          }
          const data = (await res.json()) as { posts?: Array<Record<string, unknown>>; nextCursor?: string | null };
          incoming.push(...(data.posts ?? []).map((raw) => normalizeApiPost(raw)));
          nextPageCursor = data.nextCursor ?? null;
          cursor = nextPageCursor ?? undefined;
          pagesLoaded += 1;
          // Prevent duplicate-cursor infinite loop and bound initial load
          if (!opts.append && nextPageCursor && pagesLoaded >= MAX_INITIAL_PAGES) break;
        } while (!opts.append && nextPageCursor);

        setPosts((prev) => {
          if (!opts.append) return incoming;
          const seen = new Set(prev.map((p) => p.id));
          const merged = prev.slice();
          for (const p of incoming) if (!seen.has(p.id)) merged.push(p);
          return merged;
        });
        setNextCursor(nextPageCursor);
        setHasMore(Boolean(nextPageCursor));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Network error");
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getIdToken]
  );

  useEffect(() => {
    void loadPosts({ append: false, reason: "initial" });
  }, [loadPosts, reloadKey]);

  // ── Filters: derived visible posts ──────────────────────────────────
  const appliedFilters: PostFilters = useMemo(
    () => ({
      search: appliedSearch.trim() || undefined,
      mediaKind: appliedMediaKind,
      status: appliedStatus,
      platform: appliedPlatform,
      fromDate: appliedFromDate || undefined,
      toDate: appliedToDate || undefined,
    }),
    [appliedSearch, appliedMediaKind, appliedStatus, appliedPlatform, appliedFromDate, appliedToDate]
  );

  const visiblePosts = useMemo(() => {
    const list = posts.filter((p) => postMatchesFilters(p, appliedFilters, timeZone));
    return list.sort(comparePostsChronologically);
  }, [posts, appliedFilters, timeZone]);

  const postsByDay = useMemo(() => groupPostsByDay(visiblePosts, timeZone), [visiblePosts, timeZone]);

  const filterIsDirty =
    draftSearch !== appliedSearch ||
    draftMediaKind !== appliedMediaKind ||
    draftStatus !== appliedStatus ||
    draftPlatform !== appliedPlatform ||
    draftFromDate !== appliedFromDate ||
    draftToDate !== appliedToDate;

  const applyFilters = () => {
    setAppliedSearch(draftSearch);
    setAppliedMediaKind(draftMediaKind);
    setAppliedStatus(draftStatus);
    setAppliedPlatform(draftPlatform);
    setAppliedFromDate(draftFromDate);
    setAppliedToDate(draftToDate);
  };
  const clearFilters = () => {
    setDraftSearch("");
    setDraftMediaKind("any");
    setDraftStatus("all");
    setDraftPlatform("all");
    setDraftFromDate("");
    setDraftToDate("");
    setAppliedSearch("");
    setAppliedMediaKind("any");
    setAppliedStatus("all");
    setAppliedPlatform("all");
    setAppliedFromDate("");
    setAppliedToDate("");
  };

  // Auto-apply non-search filters instantly so the pill label and the list
  // stay in sync. Without this the user sees "LinkedIn" selected but the
  // list still shows TikTok (the draft vs applied split).
  useEffect(() => {
    setAppliedMediaKind(draftMediaKind);
  }, [draftMediaKind]);
  useEffect(() => {
    setAppliedStatus(draftStatus);
  }, [draftStatus]);
  useEffect(() => {
    setAppliedPlatform(draftPlatform);
  }, [draftPlatform]);
  useEffect(() => {
    // Validate date range: don't apply an inverted range
    if (draftFromDate && draftToDate && draftFromDate > draftToDate) {
      toast({ title: "Invalid date range", description: "From date cannot be after To date.", tone: "warning" });
      return;
    }
    setAppliedFromDate(draftFromDate);
    setAppliedToDate(draftToDate);
  }, [draftFromDate, draftToDate]);
  // Debounced search: live filter as user types, but keep Apply/Enter as instant fallback
  useEffect(() => {
    const t = setTimeout(() => setAppliedSearch(draftSearch), 350);
    return () => clearTimeout(t);
  }, [draftSearch]);

  // ── Date navigation ────────────────────────────────────────────────
  const goPrev = () => {
    if (view === "monthly") setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    else if (view === "weekly") setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const goNext = () => {
    if (view === "monthly") setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    else if (view === "weekly") setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  // ── Selection / list actions ───────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // Drop selection entries that no longer exist after a refetch
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const live = new Set(posts.map((p) => p.id));
      const next = new Set<string>();
      for (const id of prev) if (live.has(id)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }, [posts]);

  const authedFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const idToken = await getIdToken();
      const headers: Record<string, string> = {
        ...(init.headers as Record<string, string> | undefined),
        ...getOverrideHeaders(),
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      };
      return fetch(input, { ...init, credentials: "include", headers });
    },
    [getIdToken]
  );

  const deleteIds = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return { ok: 0, failed: 0, failedIds: [] as string[] };
      const idKey = (id: string) => `pp.bulkdelete.${id}.${Date.now()}`;
      let ok = 0;
      const failed: string[] = [];

      // Bounded worker pool so a 100-row selection doesn't 100x /api/posts
      const queue = ids.slice();
      const workers = Array.from({ length: Math.min(DELETE_CONCURRENCY, queue.length) }, async () => {
        while (queue.length > 0) {
          const id = queue.shift();
          if (!id) break;
          try {
            const res = await authedFetch(`/api/posts/${encodeURIComponent(id)}`, {
              method: "DELETE",
              headers: { "Idempotency-Key": idKey(id) },
            });
            if (res.ok) ok += 1;
            else failed.push(id);
          } catch {
            failed.push(id);
          }
        }
      });
      await Promise.all(workers);
      return { ok, failed: failed.length, failedIds: failed };
    },
    [authedFetch]
  );

  const handleSingleDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setBusy(true);
    try {
      const res = await deleteIds([id]);
      if (res.failed > 0) {
        toast({ title: "Delete failed", description: "Please try again.", tone: "error" });
        return;
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setSelectedPost((cur) => (cur?.id === id ? null : cur));
      toast({ title: "Post deleted", tone: "success" });
    } finally {
      setBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    setConfirmBulk(false);
    if (selectedIds.size === 0) return;
    setBusy(true);
    const ids = Array.from(selectedIds);
    const result = await deleteIds(ids);
    const failedSet = new Set(result.failedIds ?? []);
    if (result.failed > 0) {
      setPosts((prev) => prev.filter((p) => !ids.includes(p.id) || failedSet.has(p.id)));
      toast({
        title: `Deleted ${result.ok}, ${result.failed} failed`,
        description: "Failed items were kept; please retry.",
        tone: "warning",
      });
      // Keep failed ids selected so user can retry
      setSelectedIds(failedSet);
    } else {
      setPosts((prev) => prev.filter((p) => !ids.includes(p.id)));
      toast({ title: `Deleted ${result.ok} post${result.ok === 1 ? "" : "s"}`, tone: "success" });
      setSelectedIds(new Set());
    }
    setBusy(false);
  };

  const handleDuplicate = useCallback(
    async (post: CalendarPost) => {
      if (!canDuplicate(post.status)) return;
      setActionId(post.id);
      try {
        const res = await authedFetch(`/api/posts/scheduled/${encodeURIComponent(post.id)}/duplicate`, { method: "POST" });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          toast({ title: "Duplicate failed", description: data.error ?? `HTTP ${res.status}`, tone: "error" });
          return;
        }
        toast({ title: "Post duplicated", description: "A new draft has been created.", tone: "success" });
        setReloadKey((k) => k + 1);
      } finally {
        setActionId(null);
      }
    },
    [authedFetch, toast]
  );

  const handleRetry = useCallback(
    async (post: CalendarPost) => {
      if (!canRetry(post.status)) return;
      setActionId(post.id);
      try {
        const res = await authedFetch(`/api/posts/scheduled/${encodeURIComponent(post.id)}/retry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clearReason: true }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          toast({ title: "Retry failed", description: data.error ?? `HTTP ${res.status}`, tone: "error" });
          return;
        }
        toast({ title: "Retry queued", description: "The post is re-scheduled.", tone: "success" });
        setReloadKey((k) => k + 1);
      } finally {
        setActionId(null);
      }
    },
    [authedFetch, toast]
  );

  const handleCreateForDate = useCallback(
    (day: Date) => {
      const iso = fmtISO(day);
      router.push(`/dashboard/posts/create?date=${iso}`);
    },
    [router]
  );

  // ── CSV export ─────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = visiblePosts.map((p) => {
      const { date, time } = formatInZone(p.scheduledAt ?? p.publishedAt ?? p.createdAt, timeZone);
      return {
        id: p.id,
        date,
        time,
        status: p.status,
        platforms: p.platforms.join("|"),
        caption: p.caption,
      };
    });
    downloadCsv(`posts-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  const today = new Date();

  return (
    <div className="w-full p-3 lg:p-6 flex-1 min-h-0 flex flex-col h-full gap-4">
      {/* ===== TOOLBAR ===== */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <MediaKindSelector value={draftMediaKind} onChange={setDraftMediaKind} />
          <PlatformDropdown value={draftPlatform} onChange={setDraftPlatform} />
          <StatusDropdown value={draftStatus} onChange={setDraftStatus} />
          <DateRangePill from={draftFromDate} to={draftToDate} onChange={(f, t) => { setDraftFromDate(f); setDraftToDate(t); }} />
          <LabelsDropdown />
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
              placeholder={t("posts.calendar.search_placeholder", { defaultValue: "Search captions…" })}
              aria-label={t("posts.calendar.search_label", { defaultValue: "Search captions" })}
              className="inline-flex items-center rounded-md border border-input bg-background pl-7 pr-2 h-9 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={visiblePosts.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            <Download className="size-3.5" />
            {t("posts.calendar.export_csv")}
          </button>
          <TimezonePill value={timeZone} onChange={setTimeZone} />
          <ViewModeSwitch view={view} onChange={setView} />
        </div>
      </div>

      {/* ===== APPLY + ACTIONS ROW ===== */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={applyFilters}
          disabled={!filterIsDirty}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md text-xs h-9 px-3"
        >
          <FilterIcon className="size-3.5" />
          {t("posts.calendar.apply")}
        </button>
        {/* Clear is always visible when any filter is active, not only when dirty — so LinkedIn/failed pill + Apply auto-sync still allows clearing */}
        {(filterIsDirty || appliedPlatform !== "all" || appliedStatus !== "all" || appliedMediaKind !== "any" || appliedFromDate || appliedToDate || appliedSearch) && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-1.5 rounded-md text-xs h-9 px-3 hover:bg-accent text-muted-foreground"
          >
            <XIcon className="size-3.5" />
            {t("posts.calendar.clear_filters")}
          </button>
        )}
        <span className="text-xs text-muted-foreground">
          {visiblePosts.length} {visiblePosts.length === 1 ? "post" : "posts"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={refreshing}
            aria-label="Refresh"
            className="relative inline-flex items-center justify-center size-8 rounded-md border border-input bg-background shadow-sm hover:bg-accent disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="size-4 animate-spin text-zinc-500" /> : <RotateCcw className="size-4 text-zinc-500" />}
          </button>
          <button
            type="button"
            onClick={() => toast({ title: "Notifications", description: "The notifications drawer will land in a follow-up release.", tone: "info" })}
            className="relative inline-flex items-center justify-center size-8 rounded-md border border-input bg-background shadow-sm hover:bg-accent"
            aria-label="Notifications"
          >
            <Bell className="size-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* ===== CALENDAR CONTAINER ===== */}
      <div className="w-full overflow-hidden flex-1 min-h-0 rounded-xl border border-zinc-200 bg-card flex flex-col">
        {/* Calendar header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-zinc-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <CalIcon className="size-4 text-zinc-500" />
            <h2 className="text-[18px] font-semibold text-zinc-900">
              {view === "weekly" ? weekRangeLabel(currentDate) : monthLabel(currentDate)}
            </h2>
            {(() => {
              const cfg = getHelpConfig("posts");
              if (!cfg) return null;
              return <PageHelp config={cfg} align="left" buttonClassName="rounded-md" />;
            })()}
            <button
              type="button"
              onClick={() => router.push("/dashboard/reports")}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground text-xs h-8 px-3 font-medium"
            >
              <span aria-hidden>📊</span>
              Reporting
              <ChevronDown className="size-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/settings")}
              className="inline-flex items-center justify-center size-9 rounded-full bg-amber-400 hover:bg-amber-500 text-white shadow-sm"
              aria-label="Upgrade"
            >
              <Trophy className="size-4" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground text-xs h-8 px-3 font-medium"
            >
              {t("posts.calendar.today")}
            </button>
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center justify-center size-8 rounded-md border border-input bg-background shadow-sm hover:bg-accent"
              aria-label={t("posts.calendar.previous")}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center justify-center size-8 rounded-md border border-input bg-background shadow-sm hover:bg-accent"
              aria-label={t("posts.calendar.next")}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Calendar body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin mr-2" />
            Loading posts…
          </div>
        ) : loadError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 text-sm">
            <p className="text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
            >
              <RefreshCw className="size-3.5" />
              Retry
            </button>
          </div>
        ) : view === "monthly" ? (
          <MonthView currentDate={currentDate} today={today} postsByDay={postsByDay} onPostClick={setSelectedPost} onCreate={handleCreateForDate} timeZone={timeZone} />
        ) : view === "weekly" ? (
          <WeekView currentDate={currentDate} today={today} postsByDay={postsByDay} onPostClick={setSelectedPost} timeZone={timeZone} />
        ) : (
          <ListView
            currentDate={currentDate}
            posts={visiblePosts}
            selected={selectedIds}
            onToggleOne={(id) =>
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            onToggleAll={(ids, select) =>
              setSelectedIds((prev) => {
                if (select) {
                  const next = new Set(prev);
                  for (const id of ids) next.add(id);
                  return next;
                }
                const next = new Set(prev);
                for (const id of ids) next.delete(id);
                return next;
              })
            }
            onPostClick={(p) => setSelectedPost(p)}
            onDeleteOne={(id) => setConfirmDeleteId(id)}
            onDeleteBulk={() => setConfirmBulk(true)}
            onRetry={(p) => void handleRetry(p)}
            onDuplicate={(p) => void handleDuplicate(p)}
            onCreate={handleCreateForDate}
            onPrev={goPrev}
            onNext={goNext}
            busy={busy}
            timeZone={timeZone}
            hasMore={hasMore}
            onLoadMore={() => loadPosts({ cursor: nextCursor ?? undefined, append: true, reason: "paginate" })}
            loadingMore={loadingRef.current}
          />
        )}
      </div>

      {selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onRetry={(p) => void handleRetry(p)}
          onDuplicate={(p) => void handleDuplicate(p)}
          onDelete={(id) => setConfirmDeleteId(id)}
          actionId={actionId}
          timeZone={timeZone}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => void handleSingleDelete()}
        title="Delete post"
        description="This will permanently remove the post. This cannot be undone."
        confirmLabel={busy ? "Deleting…" : "Delete"}
        cancelLabel="Cancel"
        tone="destructive"
      />
      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={() => void handleBulkDelete()}
        title={`Delete ${selectedIds.size} posts`}
        description="These posts will be permanently removed. This cannot be undone."
        confirmLabel={busy ? "Deleting…" : "Delete all"}
        cancelLabel="Cancel"
        tone="destructive"
      />
    </div>
  );
}

// ─── View-specific renderers ───────────────────────────────────────────

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler, enabled]);
}

function MediaKindSelector({ value, onChange }: { value: MediaKindFilter; onChange: (v: MediaKindFilter) => void }) {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);
  const options: { value: MediaKindFilter; label: string; icon: React.ReactNode }[] = [
    { value: "any", label: t("posts.calendar.all_media"), icon: <TextIcon /> },
    { value: "text", label: t("posts.calendar.text_only"), icon: <TextIcon /> },
    { value: "image", label: t("posts.calendar.filter_image"), icon: <ImageIcon /> },
    { value: "video", label: t("posts.calendar.filter_video"), icon: <VideoIcon /> },
  ];
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Media: ${current.label}`}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent text-xs h-8 px-3 rounded-lg",
          value !== "any" && "text-foreground"
        )}
      >
        {current.icon}
        <span className="hidden lg:inline">{current.label}</span>
        <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 min-w-[180px] rounded-md border bg-card shadow-lg p-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left text-xs rounded-sm px-2 py-1.5 hover:bg-accent flex items-center gap-2",
                opt.value === value && "bg-accent font-medium"
              )}
            >
              {opt.icon}
              {opt.label}
              {opt.value === value && <Check className="ml-auto size-3.5 text-zinc-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlatformDropdown({ value, onChange }: { value: PlatformFilterValue; onChange: (v: PlatformFilterValue) => void }) {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);
  const order: { value: PlatformFilterValue; label: string }[] = [
    { value: "all", label: t("posts.calendar.filter_all_accounts") },
    { value: "bluesky", label: PLATFORM_LABELS.bluesky },
    { value: "instagram", label: PLATFORM_LABELS.instagram },
    { value: "tiktok", label: PLATFORM_LABELS.tiktok },
    { value: "youtube", label: PLATFORM_LABELS.youtube },
    { value: "pinterest", label: PLATFORM_LABELS.pinterest },
    { value: "twitter", label: PLATFORM_LABELS.twitter },
    { value: "linkedin", label: PLATFORM_LABELS.linkedin },
    { value: "threads", label: PLATFORM_LABELS.threads },
    { value: "facebook", label: PLATFORM_LABELS.facebook },
    { value: "discord", label: PLATFORM_LABELS.discord },
    { value: "telegram", label: PLATFORM_LABELS.telegram },
    { value: "google_business", label: PLATFORM_LABELS.google_business },
  ];
  const currentLabel = value === "all" ? t("posts.calendar.filter_all_accounts") : PLATFORM_LABELS[value as CalendarPlatform] ?? value;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-9 text-xs"
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 min-w-[200px] rounded-md border bg-card shadow-lg p-1 max-h-72 overflow-y-auto">
          {order.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left text-xs rounded-sm px-2 py-1.5 hover:bg-accent flex items-center gap-2",
                opt.value === value && "bg-accent font-medium"
              )}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <Check className="ml-auto size-3.5 text-zinc-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusDropdown({ value, onChange }: { value: StatusFilterValue; onChange: (v: StatusFilterValue) => void }) {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);
  const order: { value: StatusFilterValue; label: string }[] = [
    { value: "all", label: t("posts.calendar.filter_all_status") },
    { value: "draft", label: STATUS_META.draft.label },
    { value: "scheduled", label: STATUS_META.scheduled.label },
    { value: "queued", label: STATUS_META.queued.label },
    { value: "publishing", label: STATUS_META.publishing.label },
    { value: "published", label: STATUS_META.published.label },
    { value: "partially_published", label: STATUS_META.partially_published.label },
    { value: "paused", label: STATUS_META.paused.label },
    { value: "failed", label: STATUS_META.failed.label },
    { value: "archived", label: STATUS_META.archived.label },
  ];
  const currentLabel = value === "all" ? t("posts.calendar.filter_all_status") : STATUS_META[value as CalendarPost["status"]]?.label ?? value;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-9 text-xs"
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 min-w-[180px] rounded-md border bg-card shadow-lg p-1">
          {order.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left text-xs rounded-sm px-2 py-1.5 hover:bg-accent flex items-center gap-2",
                opt.value === value && "bg-accent font-medium"
              )}
            >
              <span
                className={cn(
                  "inline-block size-2 rounded-full shrink-0",
                  opt.value === "all" ? "bg-zinc-400" : STATUS_META[opt.value as CalendarPost["status"]]?.bg.includes("emerald") ? "bg-emerald-500" : opt.value === "failed" ? "bg-red-500" : opt.value === "published" ? "bg-zinc-500" : opt.value === "draft" ? "bg-amber-500" : "bg-sky-500"
                )}
              />
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <Check className="ml-auto size-3.5 text-zinc-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LabelsDropdown({ onSelect }: { onSelect?: (v: string) => void }) {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-9 text-xs"
      >
        <span className="truncate">{t("posts.calendar.filter_all_labels")}</span>
        <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 min-w-[220px] rounded-md border bg-card shadow-lg p-3 space-y-2">
          <p className="text-xs text-muted-foreground">{t("posts.calendar.filter_all_labels")}</p>
          <p className="text-[11px] text-muted-foreground">Label filtering is coming soon. All labels are currently shown.</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full text-left text-xs rounded-sm px-2 py-1.5 hover:bg-accent bg-accent font-medium flex items-center gap-2"
          >
            {t("posts.calendar.filter_all_labels")}
            <Check className="ml-auto size-3.5 text-zinc-500" />
          </button>
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-9 text-xs"
    >
      <span className="truncate">{label}</span>
      <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
    </button>
  );
}

function DateRangePill({ from, to, onChange }: { from: string; to: string; onChange: (f: string, t: string) => void }) {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);
  const label =
    from || to ? `${from || "…"} → ${to || "…"}` : t("posts.calendar.any_date");
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-9 text-xs"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 right-0 w-64 rounded-md border bg-card shadow-lg p-3 space-y-2">
          <label className="block text-[11px] font-medium text-muted-foreground">{t("posts.calendar.from_label")}</label>
          <input
            type="date"
            value={from}
            onChange={(e) => onChange(e.target.value, to)}
            className="w-full rounded-md border border-input bg-background px-2 h-8 text-xs"
          />
          <label className="block text-[11px] font-medium text-muted-foreground">{t("posts.calendar.to_label")}</label>
          <input
            type="date"
            value={to}
            onChange={(e) => onChange(from, e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2 h-8 text-xs"
          />
          <div className="flex justify-between pt-1">
            <button type="button" onClick={() => { onChange("", ""); setOpen(false); }} className="text-xs text-muted-foreground hover:underline">
              {t("posts.calendar.clear")}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs font-medium text-foreground hover:underline">
              {t("posts.calendar.done")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TimezonePill({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const common = [
    "UTC",
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    "America/Los_Angeles",
    "America/New_York",
    "Europe/London",
    "Europe/Paris",
  ].filter((v, i, arr) => arr.indexOf(v) === i);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Timezone"
        aria-expanded={open}
        className="inline-flex items-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-9 text-xs min-w-[180px]"
      >
        <GlobeIcon />
        {value}
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 rounded-md border bg-card shadow-lg p-1 max-h-72 overflow-y-auto">
          {common.map((tz) => (
            <button
              key={tz}
              type="button"
              onClick={() => { onChange(tz); setOpen(false); }}
              className={cn(
                "w-full text-left text-xs rounded-sm px-2 py-1.5 hover:bg-accent",
                tz === value && "bg-accent"
              )}
            >
              {tz}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewModeSwitch({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const t = useTranslations("dashboard");
  const buttons: { mode: ViewMode; aria: string; icon: React.ReactNode; label: string }[] = [
    { mode: "weekly", aria: t("posts.calendar.weekly_view"), icon: <WeekIcon />, label: t("posts.calendar.weekly_view", { defaultValue: "Week" }) },
    { mode: "monthly", aria: t("posts.calendar.monthly_view"), icon: <MonthIcon />, label: t("posts.calendar.monthly") },
    { mode: "list", aria: t("posts.calendar.list_view"), icon: <ListIcon />, label: t("posts.calendar.list_view", { defaultValue: "List" }) },
  ];
  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded-lg" role="tablist" aria-label="View mode">
      {buttons.map((b) => {
        const active = view === b.mode;
        return (
          <button
            key={b.mode}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={b.aria}
            onClick={() => onChange(b.mode)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:text-accent-foreground h-7 gap-1.5 rounded-md text-xs font-medium",
              b.mode === "monthly" ? "px-2.5" : "w-7 px-0",
              active ? "bg-background shadow-sm hover:bg-background text-foreground" : "hover:bg-accent text-muted-foreground"
            )}
          >
            {b.icon}
            {b.mode === "monthly" && <span>{b.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

function MonthView({
  currentDate,
  today,
  postsByDay,
  onPostClick,
  onCreate,
  timeZone,
}: {
  currentDate: Date;
  today: Date;
  postsByDay: Record<string, CalendarPost[]>;
  onPostClick: (p: CalendarPost) => void;
  onCreate: (day: Date) => void;
  timeZone: string;
}) {
  const start = monthGridStart(currentDate);
  const days = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(start, i)), [start]);
  const month = currentDate.getMonth();
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-7 border-b bg-background flex-shrink-0 sticky top-0 z-40">
        {DAYS.map((d) => (
          <div key={d} className="px-3 py-2 text-xs font-semibold text-muted-foreground text-center border-r last:border-r-0 border-zinc-200">
            {d}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 6 }).map((_, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b last:border-b-0 flex-1 min-h-[150px]">
            {days.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, i) => (
              <DayCell
                key={i}
                day={day}
                isCurrentMonth={day.getMonth() === month}
                isToday={isSameDay(day, today)}
                dayPosts={postsByDay[fmtISO(day)] ?? []}
                onPostClick={onPostClick}
                onCreate={onCreate}
                timeZone={timeZone}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayCell({
  day,
  isCurrentMonth,
  isToday,
  dayPosts,
  onPostClick,
  onCreate,
  timeZone,
}: {
  day: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayPosts: CalendarPost[];
  onPostClick: (p: CalendarPost) => void;
  onCreate: (day: Date) => void;
  timeZone: string;
}) {
  const t = useTranslations("dashboard");
  return (
    <div
      className={cn(
        "border-r last:border-r-0 p-2 flex flex-col min-w-[120px] min-h-[150px] relative group bg-card",
        !isCurrentMonth && "bg-muted/30"
      )}
    >
      <div className="flex items-center gap-1 mb-2 flex-shrink-0">
        <span className={cn("text-sm font-medium flex-shrink-0", isCurrentMonth ? "text-foreground" : "text-muted-foreground")}>
          {day.getDate()}
        </span>
        {isCurrentMonth && dayPosts.length > 0 && (
          <div className="flex items-center space-x-0.5 flex-shrink-0">
            <div className="w-4 h-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <span className="text-[9px] font-medium text-green-600">{dayPosts.length}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {dayPosts.map((p) => (
          <EventCard key={p.id} post={p} onClick={() => onPostClick(p)} timeZone={timeZone} />
        ))}
      </div>

      {isCurrentMonth && (
        <button
          type="button"
          onClick={() => onCreate(day)}
          className="absolute bottom-1.5 right-1.5 inline-flex items-center justify-center size-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={t("posts.calendar.create_post")}
        >
          <Plus className="size-3.5" />
        </button>
      )}

      {isToday && (
        <div className="absolute top-1.5 right-1.5 size-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
          {day.getDate()}
        </div>
      )}
    </div>
  );
}

function EventCard({ post, onClick, timeZone }: { post: CalendarPost; onClick: () => void; timeZone: string }) {
  const meta = statusMetaOf(post.status);
  const { time } = formatInZone(post.scheduledAt ?? post.publishedAt ?? post.createdAt, timeZone);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKey}
      className={cn(
        "text-xs rounded px-1.5 py-1 transition-all flex items-center justify-between border flex-shrink-0 relative z-10 overflow-visible cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20",
        meta.bg,
        meta.border,
        meta.text
      )}
    >
      <div className="flex items-center space-x-1 min-w-0">
        {post.mediaUrls[0] && (
          <img alt="" className="w-4 h-4 rounded-sm object-cover flex-shrink-0 hidden lg:block" src={post.mediaUrls[0]} />
        )}
        <div className="flex items-center space-x-0.5">
          {post.platforms.slice(0, 4).map((p) => (
            <PlatformAvatar key={p} platform={platformMeta(p)} size={14} rounded="sm" />
          ))}
        </div>
        <div className="flex items-center gap-1 min-w-0">
          {time && <span className="text-[10px] font-semibold whitespace-nowrap">{time}</span>}
          <span className="truncate text-[10px]">{post.caption.slice(0, 14)}</span>
        </div>
      </div>
      {post.status === "scheduled" && <Check className="size-3 ml-auto shrink-0 opacity-80" />}
    </div>
  );
}

function WeekView({
  currentDate,
  today,
  postsByDay,
  onPostClick,
  timeZone,
}: {
  currentDate: Date;
  today: Date;
  postsByDay: Record<string, CalendarPost[]>;
  onPostClick: (p: CalendarPost) => void;
  timeZone: string;
}) {
  const { start } = weekBounds(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="flex-1 overflow-auto min-h-0">
      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] min-w-[800px]">
        <div className="sticky top-0 z-30 bg-background border-r border-b border-zinc-200" />
        {days.map((d, i) => {
          const isToday = isSameDay(d, today);
          const iso = fmtISO(d);
          const count = (postsByDay[iso] ?? []).length;
          return (
            <div
              key={i}
              className={cn(
                "sticky top-0 z-30 bg-background border-r last:border-r-0 border-b border-zinc-200 px-2 py-2 text-center",
                isToday && "bg-blue-50"
              )}
            >
              <div className="text-xs font-semibold text-muted-foreground">{DAYS[i]}</div>
              <div
                className={cn(
                  "mt-1 text-sm font-medium",
                  isToday && "inline-flex items-center justify-center size-6 rounded-full bg-blue-600 text-white"
                )}
              >
                {d.getDate()}
              </div>
              {count > 0 && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-green-500/10 border border-green-500/30 text-[9px] font-medium text-green-600">
                    {count}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {hours.map((h) => (
          <FragmentRow key={h} hour={h} days={days} postsByDay={postsByDay} today={today} onPostClick={onPostClick} timeZone={timeZone} />
        ))}
      </div>
    </div>
  );
}

function FragmentRow({
  hour,
  days,
  postsByDay,
  today,
  onPostClick,
  timeZone,
}: {
  hour: number;
  days: Date[];
  postsByDay: Record<string, CalendarPost[]>;
  today: Date;
  onPostClick: (p: CalendarPost) => void;
  timeZone: string;
}) {
  return (
    <Fragment>
      <div className="border-r border-b border-zinc-200 h-16 px-2 py-1 text-[11px] text-muted-foreground flex items-start gap-1">
        <ClockIcon />
        <span>{String(hour).padStart(2, "0")}:00</span>
      </div>
      {days.map((d, i) => {
        const iso = fmtISO(d);
        const isToday = isSameDay(d, today);
        const slots = (postsByDay[iso] ?? []).filter((p) => {
          const { time } = formatInZone(p.scheduledAt ?? p.publishedAt ?? p.createdAt, timeZone);
          if (!time) return false;
          const h = parseInt(time.split(":")[0] ?? "", 10);
          return h === hour;
        });
        return (
          <div
            key={i}
            className={cn(
              "border-r last:border-r-0 border-b border-zinc-200 h-16 p-1 relative",
              isToday && "bg-blue-50/30"
            )}
          >
            {slots.map((p) => (
              <WeekEventCard key={p.id} post={p} onClick={() => onPostClick(p)} timeZone={timeZone} />
            ))}
            {isToday && hour === today.getHours() && (
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="absolute -left-1 -top-1.5 size-3 rounded-full bg-blue-600" />
                <div className="h-px bg-blue-600" />
                <div className="absolute right-1 -top-4 text-[10px] font-bold text-white bg-blue-600 px-1.5 rounded">
                  {String(today.getHours()).padStart(2, "0")}:{String(today.getMinutes()).padStart(2, "0")}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </Fragment>
  );
}

function WeekEventCard({ post, onClick, timeZone }: { post: CalendarPost; onClick: () => void; timeZone: string }) {
  const meta = statusMetaOf(post.status);
  const { time } = formatInZone(post.scheduledAt ?? post.publishedAt ?? post.createdAt, timeZone);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKey}
      className={cn(
        "rounded px-1.5 py-1 border flex items-center gap-1 text-[10px] cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20",
        meta.bg,
        meta.border,
        meta.text
      )}
    >
      {post.mediaUrls[0] && <img alt="" className="w-3 h-3 rounded-sm object-cover" src={post.mediaUrls[0]} />}
      <div className="flex items-center gap-0.5">
        {post.platforms.slice(0, 2).map((p) => (
          <PlatformAvatar key={p} platform={platformMeta(p)} size={14} rounded="sm" />
        ))}
      </div>
      {time && <span className="font-semibold">{time}</span>}
      <Check className="size-2.5 ml-auto opacity-80" />
    </div>
  );
}

function ListView({
  currentDate,
  posts,
  selected,
  onToggleOne,
  onToggleAll,
  onPostClick,
  onDeleteOne,
  onDeleteBulk,
  onRetry,
  onDuplicate,
  onCreate,
  onPrev,
  onNext,
  busy,
  timeZone,
  hasMore,
  onLoadMore,
  loadingMore,
}: {
  currentDate: Date;
  posts: CalendarPost[];
  selected: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll: (ids: string[], select: boolean) => void;
  onPostClick: (p: CalendarPost) => void;
  onDeleteOne: (id: string) => void;
  onDeleteBulk: () => void;
  onRetry: (p: CalendarPost) => void;
  onDuplicate: (p: CalendarPost) => void;
  onCreate: (day: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  busy: boolean;
  timeZone: string;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
}) {
  const t = useTranslations("dashboard");
  const monthName = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone,
  }).format(currentDate);
  const monthKey = formatInZone(currentDate.toISOString(), timeZone).date.slice(0, 7);
  const monthFiltered = posts.filter((p) => {
    const stamp = p.scheduledAt ?? p.publishedAt ?? p.createdAt;
    if (!stamp) return false;
    const { date } = formatInZone(stamp, timeZone);
    return (date || stamp.slice(0, 10)).startsWith(monthKey);
  });
  const allSelected = monthFiltered.length > 0 && monthFiltered.every((r) => selected.has(r.id));
  const someSelected = !allSelected && monthFiltered.some((r) => selected.has(r.id));

  return (
    <div className="flex-1 overflow-auto min-h-0">
      <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-200 sticky top-0 bg-card z-30 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="size-4 rounded border-zinc-300"
            aria-label={t("posts.calendar.select_all")}
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={() => onToggleAll(monthFiltered.map((r) => r.id), !allSelected)}
          />
          <h3 className="text-sm font-semibold">{monthName}</h3>
          <span className="text-xs text-muted-foreground">
            {monthFiltered.length} post{monthFiltered.length === 1 ? "" : "s"}
          </span>
          {selected.size > 0 && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs">{selected.size} selected</span>
              <button
                type="button"
                onClick={onDeleteBulk}
                disabled={busy}
                className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
                {busy ? "Deleting…" : `Delete ${selected.size}`}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onCreate(new Date())}
            className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-2.5 py-1 text-xs font-medium"
          >
            <Plus className="size-3.5" />
            New post
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="size-8 rounded-md hover:bg-zinc-100 inline-flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="size-8 rounded-md hover:bg-zinc-100 inline-flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      {monthFiltered.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          No posts in {monthName} match your filters.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="sticky top-[57px] bg-card z-20">
            <tr className="border-b border-zinc-200 text-xs text-muted-foreground">
              <th className="w-10 px-3 py-2" />
              <th className="text-left px-3 py-2 font-medium">{t("posts.calendar.caption")}</th>
              <th className="text-left px-3 py-2 font-medium">Account</th>
              <th className="text-left px-3 py-2 font-medium">{t("posts.calendar.status")}</th>
              <th className="text-left px-3 py-2 font-medium">{t("posts.calendar.date")}</th>
              <th className="text-right px-3 py-2 font-medium w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {monthFiltered.map((row) => {
              const meta = statusMetaOf(row.status);
              const isSelected = selected.has(row.id);
              const { date, time } = formatInZone(row.scheduledAt ?? row.publishedAt ?? row.createdAt, timeZone);
              const acct = accountLabelForPost(row);
              return (
                <tr
                  key={row.id}
                  className={cn("border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer", isSelected && "bg-blue-50/60")}
                  onClick={() => onPostClick(row)}
                >
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="size-4 rounded border-zinc-300"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleOne(row.id)}
                      aria-label={`Select ${row.id}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-start gap-2">
                      {row.mediaUrls[0] && (
                        <img alt="" className="w-10 h-10 rounded object-cover shrink-0" src={row.mediaUrls[0]} />
                      )}
                      <p className="line-clamp-2 text-[13px] text-zinc-900">{row.caption || <span className="italic text-muted-foreground">No caption</span>}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {row.platforms.slice(0, 1).map((p) => (
                        <PlatformAvatar key={p} platform={platformMeta(p)} size={14} rounded="sm" />
                      ))}
                      <span className="text-xs text-zinc-700">{acct ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border", meta.bg, meta.border, meta.text)}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-600 whitespace-nowrap">{date} {time}</td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      {canRetry(row.status) && (
                        <button
                          type="button"
                          onClick={() => onRetry(row)}
                          className="size-7 inline-flex items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50"
                          aria-label="Retry"
                          title="Retry"
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                      )}
                      {canDuplicate(row.status) && (
                        <button
                          type="button"
                          onClick={() => onDuplicate(row)}
                          className="size-7 inline-flex items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50"
                          aria-label="Duplicate"
                          title="Duplicate"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteOne(row.id)}
                        className="size-7 inline-flex items-center justify-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                        aria-label="Delete"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {hasMore && (
        <div className="p-3 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
          >
            {loadingMore ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── POST DETAILS MODAL ────────────────────────────────────────────────

function PostDetailsModal({
  post,
  onClose,
  onRetry,
  onDuplicate,
  onDelete,
  actionId,
  timeZone,
}: {
  post: CalendarPost;
  onClose: () => void;
  onRetry: (p: CalendarPost) => void;
  onDuplicate: (p: CalendarPost) => void;
  onDelete: (id: string) => void;
  actionId: string | null;
  timeZone: string;
}) {
  const t = useTranslations("dashboard");
  const meta = statusMetaOf(post.status);
  const scheduledLabel = post.scheduledAt ? formatLongDateTime(post.scheduledAt, timeZone) : t("posts.calendar.not_scheduled");
  const publishedLabel = post.publishedAt ? formatLongDateTime(post.publishedAt, timeZone) : "—";

  const account = accountLabelForPost(post);
  const mediaCount = post.mediaUrls?.length ?? 0;

  const youtubeFields = post.platforms.includes("youtube");
  const pinterestFields = post.platforms.includes("pinterest");

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={t("posts.calendar.post_details")}
      description={t("posts.calendar.post_details_subtitle")}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium", meta.bg, meta.text, meta.border)}>
                {meta.label}
              </span>
              {post.postIn && (
                <span className="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700">
                  {post.postIn === "story" ? "Story" : "Feed"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {post.platforms.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5 text-xs text-zinc-700">
                  <PlatformAvatar platform={platformMeta(p)} size={14} rounded="sm" />
                  {PLATFORM_LABELS[p] ?? p}
                </span>
              ))}
              {account && <span className="text-xs text-muted-foreground">• {account}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scheduled for</h3>
              <p className="text-sm mt-1">{scheduledLabel}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Published at</h3>
              <p className="text-sm mt-1">{publishedLabel}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Caption</h3>
            <p className="text-sm whitespace-pre-wrap mt-1">
              {post.caption || <span className="italic text-muted-foreground">No caption</span>}
            </p>
          </div>

          {post.failureReason && post.status === "failed" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <p className="font-semibold">Last failure</p>
              <p className="mt-0.5">{post.failureReason}</p>
            </div>
          )}

          {mediaCount > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Media ({mediaCount})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {post.mediaUrls.map((u, i) => {
                  const kind = mediaKindFromUrl(u);
                  return (
                    <div key={i} className="relative rounded-md overflow-hidden border bg-muted aspect-square">
                      {kind === "video" ? (
                        <video src={u} className="w-full h-full object-contain" controls preload="metadata" />
                      ) : (
                        <img alt="" className="w-full h-full object-contain" src={u} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(post.firstComment || post.community || post.quoteTweetUrl || post.hashtags?.length || post.labels?.length) ? (
            <div className="text-xs border rounded-md divide-y">
              {post.firstComment && <DetailRow label="First comment" value={post.firstComment} />}
              {post.community && <DetailRow label="Community" value={post.community} />}
              {post.quoteTweetUrl && <DetailRow label="Quote tweet" value={post.quoteTweetUrl} />}
              {post.hashtags && post.hashtags.length > 0 && <DetailRow label="Hashtags" value={post.hashtags.join(" ")} />}
              {post.labels && post.labels.length > 0 && <DetailRow label="Labels" value={post.labels.join(", ")} />}
            </div>
          ) : null}

          {youtubeFields && (post.youtubeTitle || post.youtubeTags || typeof post.autoAddMusic === "boolean") ? (
            <div className="text-xs border rounded-md divide-y">
              {post.youtubeTitle && <DetailRow label="Title" value={post.youtubeTitle} />}
              {post.youtubeTags && <DetailRow label="Tags" value={post.youtubeTags} />}
              {typeof post.autoAddMusic === "boolean" && (
                <DetailRow label="Auto-add music" value={post.autoAddMusic ? "✅" : "❌"} />
              )}
            </div>
          ) : null}

          {pinterestFields && post.pinterestBoard ? (
            <div className="text-xs border rounded-md divide-y">
              <DetailRow label="Board" value={post.pinterestBoard} />
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
            {canRetry(post.status) && (
              <button
                type="button"
                onClick={() => onRetry(post)}
                disabled={actionId === post.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-9 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
              >
                {actionId === post.id ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                Retry
              </button>
            )}
            {canDuplicate(post.status) && (
              <button
                type="button"
                onClick={() => onDuplicate(post)}
                disabled={actionId === post.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-9 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
              >
                {actionId === post.id ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
                Duplicate
              </button>
            )}
            {isActionable(post.status) && (
              <button
                type="button"
                onClick={() => onDelete(post.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 text-red-700 px-3 h-9 text-xs font-medium hover:bg-red-100"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[300px] flex-shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-zinc-200 -mx-5 lg:mx-0 px-5 lg:px-0 lg:pl-4">
          <div className="px-4 pt-4 pb-3 border-b border-zinc-200">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ChatIcon />
              {t("posts.calendar.discussion")}
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="mx-auto size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <ChatIcon className="size-6 text-zinc-400" />
              </div>
              <p className="text-sm font-semibold">{t("posts.calendar.premium_feature")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("posts.calendar.discussion_desc")}</p>
              <a
                href="/dashboard/settings"
                className="mt-3 inline-flex items-center rounded-md bg-zinc-900 text-white px-3 h-8 text-xs font-medium hover:bg-zinc-800"
              >
                {t("posts.calendar.upgrade_premium")}
              </a>
              <p className="text-[11px] text-muted-foreground mt-3 flex items-center justify-center gap-1">
                <RedirectIcon /> Upgrade in settings
              </p>
            </div>
          </div>
          <div className="border-t border-zinc-200 p-3">
            <div className="flex items-center gap-2">
              <input
                disabled
                aria-label="Discussion disabled"
                className="flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 h-9 text-sm text-muted-foreground cursor-not-allowed"
                placeholder={t("posts.calendar.comment_placeholder")}
              />
              <button
                disabled
                aria-label="Send (disabled in this build)"
                className="size-9 rounded-md bg-zinc-100 text-zinc-400 inline-flex items-center justify-center cursor-not-allowed"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="font-medium py-1.5 pl-3 pr-3 border-r w-1/2">{label}</span>
      <span className="py-1.5 pl-3 pr-3 w-1/2 text-right break-words">{value}</span>
    </div>
  );
}

// ─── API normalization ────────────────────────────────────────────────

function normalizeApiPost(raw: Record<string, unknown>): CalendarPost {
  const id = typeof raw.id === "string" ? raw.id : "";
  return {
    id,
    workspaceId: typeof raw.workspaceId === "string" ? raw.workspaceId : undefined,
    status: normalizeStatus(raw.status),
    caption: typeof raw.caption === "string" ? raw.caption : "",
    platforms: normalizePlatforms(raw.platforms),
    mediaUrls: Array.isArray(raw.mediaUrls) ? raw.mediaUrls.filter((u): u is string => typeof u === "string") : [],
    scheduledAt: typeof raw.scheduledAt === "string" ? raw.scheduledAt : undefined,
    publishedAt: typeof raw.publishedAt === "string" ? raw.publishedAt : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    hashtags: Array.isArray(raw.hashtags) ? raw.hashtags.filter((s): s is string => typeof s === "string") : [],
    labels: Array.isArray(raw.labels) ? raw.labels.filter((s): s is string => typeof s === "string") : [],
    firstComment: typeof raw.firstComment === "string" ? raw.firstComment : undefined,
    community: typeof raw.community === "string" ? raw.community : undefined,
    quoteTweetUrl: typeof raw.quoteTweetUrl === "string" ? raw.quoteTweetUrl : undefined,
    threadRootId: typeof raw.threadRootId === "string" ? raw.threadRootId : undefined,
    postIn: raw.postIn === "story" || raw.postIn === "feed" ? raw.postIn : undefined,
    youtubeTitle: typeof raw.youtubeTitle === "string" ? raw.youtubeTitle : undefined,
    youtubeTags: typeof raw.youtubeTags === "string" ? raw.youtubeTags : undefined,
    pinterestBoard: typeof raw.pinterestBoard === "string" ? raw.pinterestBoard : undefined,
    autoAddMusic: typeof raw.autoAddMusic === "boolean" ? raw.autoAddMusic : undefined,
    profile: typeof raw.profile === "string" ? raw.profile : undefined,
    failureReason: typeof raw.failureReason === "string" ? raw.failureReason : undefined,
  };
}

// ─── Icons ─────────────────────────────────────────────────────────────

function TextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M2.5 4v3h5v12h3V7h5V4zm19 5h-9v3h3v7h3v-7h3z" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2M8.5 13.5l2.5 3.01L14.5 12l4.5 6H5z" />
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11z" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3 text-muted-foreground/70" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function WeekIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m-7 2h2.5v12H13zm-2 12H8.5V6H11zM4 6h2.5v12H4zm16 12h-2.5V6H20z" />
    </svg>
  );
}
function MonthIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2M8 11H4V6h4zm6 0h-4V6h4zm6 0h-4V6h4zM8 18H4v-5h4zm6 0h-4v-5h4zm6 0h-4v-5h4z" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5m0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5m0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5M7 19h14v-2H7zm0-6h14v-2H7zm0-8v2h14V5z" />
    </svg>
  );
}
function ChatIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function RedirectIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}
