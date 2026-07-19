"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";
import { toCsv, downloadCsv } from "@/lib/csv";

// ===== TYPES =====
type PostStatus = "scheduled" | "published" | "draft" | "failed" | "pending";
type Platform =
  | "instagram"
  | "twitter"
  | "tiktok"
  | "linkedin"
  | "facebook"
  | "threads"
  | "youtube"
  | "pinterest"
  | "bluesky";

interface CalendarPost {
  id: string;
  date: string; // ISO YYYY-MM-DD
  time?: string; // HH:MM
  caption: string;
  status: PostStatus;
  thumbnail?: string;
  platforms: Platform[];
  accountName?: string;
}

interface ApiPost {
  id: string;
  caption?: string;
  status?: string;
  platforms?: string[];
  mediaUrls?: string[];
  scheduledAt?: string;
  publishedAt?: string;
  createdAt?: string;
}

// ===== PLATFORM ICONS (color + glyph) =====
const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  twitter: "Twitter/X",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  threads: "Threads",
  youtube: "YouTube",
  pinterest: "Pinterest",
  bluesky: "Bluesky",
};

// ===== STATUS CONFIG =====
const STATUS_META: Record<PostStatus, { bg: string; text: string; border: string; label: string }> = {
  scheduled: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500 dark:border-emerald-400/20",
    label: "Scheduled",
  },
  published: { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-300", label: "Published" },
  draft: { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-500", label: "Draft" },
  failed: { bg: "bg-red-500/10", text: "text-red-700", border: "border-red-500", label: "Failed" },
  pending: { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-400", label: "Pending" },
};

function todayOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ===== SAMPLE DATA =====
const SAMPLE_POSTS: CalendarPost[] = [
  {
    id: "p1",
    date: todayOffset(0),
    time: "10:44",
    caption: "Your full reminder that cats do not need a gym membership...",
    status: "scheduled",
    thumbnail: "https://cdn.postplanify.com/posts/all-types/8e44be67-9b3f-4a61-96c8-708fd3131a0c/ba9a528b-b3e7-41b5-979d-18b6773bd130/1782207863335-ya5f2h3vz-0.jpg",
    platforms: ["bluesky", "twitter", "pinterest"],
    accountName: "nicklorance.bsky.social",
  },
  {
    id: "p2",
    date: todayOffset(0),
    time: "10:44",
    caption: "Productivity lessons from a black cat and a remote cat!...",
    status: "scheduled",
    thumbnail: "https://cdn.postplanify.com/posts/all-types/8e44be67-9b3f-4a61-96c8-708fd3131a0c/ba9a528b-b3e7-41b5-979d-18b6773bd130/1782207863335-ya5f2h3vz-1.jpg",
    platforms: ["instagram", "twitter", "pinterest"],
    accountName: "nicklorance7",
  },
  {
    id: "p3",
    date: todayOffset(4),
    time: "19:00",
    caption: "Saturday night content",
    status: "scheduled",
    thumbnail: "https://cdn.postplanify.com/posts/all-types/8e44be67-9b3f-4a61-96c8-708fd3131a0c/sample-3.jpg",
    platforms: ["tiktok", "instagram", "facebook", "tiktok", "tiktok", "threads"],
    accountName: "nick_lorance",
  },
];

// ===== HELPERS =====
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

// Find the Monday of the week containing the 1st of the month
function monthGridStart(d: Date): Date {
  const first = startOfMonth(d);
  // JS getDay(): 0=Sun..6=Sat. Monday=1
  const dow = first.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDays(first, offset);
}

// ===== VIEW MODES =====
type ViewMode = "weekly" | "monthly" | "list";

export default function PostsCalendarPage() {
  const t = useTranslations("dashboard");
  const [view, setView] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [posts, setPosts] = useState<CalendarPost[]>(SAMPLE_POSTS);
  const [postsVersion, setPostsVersion] = useState(0);
  const today = new Date();

  const refetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { posts?: ApiPost[] };
      const mapped = (data.posts ?? []).map<CalendarPost>((p) => {
        const d = new Date(p.scheduledAt ?? p.publishedAt ?? p.createdAt ?? Date.now());
        return {
          id: p.id,
          date: fmtISO(d),
          time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
          caption: p.caption ?? "",
          status: (p.status ?? "draft") as PostStatus,
          thumbnail: p.mediaUrls?.[0],
          platforms: (p.platforms ?? []) as Platform[],
          accountName: undefined,
        };
      });
      if (mapped.length > 0) setPosts(mapped);
    } catch {
      // offline — keep current
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/posts", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { posts?: ApiPost[] };
        if (cancelled) return;
        const mapped = (data.posts ?? []).map<CalendarPost>((p) => {
          const d = new Date(p.scheduledAt ?? p.publishedAt ?? p.createdAt ?? Date.now());
          return {
            id: p.id,
            date: fmtISO(d),
            time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
            caption: p.caption ?? "",
            status: (p.status ?? "draft") as PostStatus,
            thumbnail: p.mediaUrls?.[0],
            platforms: (p.platforms ?? []) as Platform[],
            accountName: undefined,
          };
        });
        if (mapped.length > 0) setPosts(mapped);
      } catch {
        // offline — keep seed
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postsVersion]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const snapshot = posts;
    setPosts((prev) => prev.filter((p) => !idSet.has(p.id)));
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/posts/${id}`, { method: "DELETE", credentials: "include" })
        )
      );
      const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok));
      if (failed.length > 0) {
        setPosts(snapshot);
        window.alert(
          `Could not delete ${failed.length} post${failed.length === 1 ? "" : "s"}. Please try again.`
        );
        return;
      }
    } catch {
      setPosts(snapshot);
      window.alert("Bulk delete failed. Please try again.");
    }
  }, [posts]);

  // Responsive: auto-switch to List view on narrow viewports (matches live PostPlanify behavior at <1280px)
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

  // Lock body scroll when modal open
  useEffect(() => {
    if (selectedPost) {
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedPost(null); };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      };
    }
  }, [selectedPost]);

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
  const goToday = () => setCurrentDate(today);

  const handleExport = () => {
    const csv = toCsv(
      posts.map((p) => ({
        id: p.id,
        date: p.date,
        time: p.time ?? "",
        caption: p.caption,
        status: p.status,
        platforms: (p.platforms ?? []).join("|"),
        thumbnail: p.thumbnail ?? "",
      }))
    );
    downloadCsv(`posts-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <div className="w-full p-3 lg:p-6 flex-1 min-h-0 flex flex-col h-full gap-4">
      {/* ===== TOOLBAR ===== */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter icons */}
          <div className="flex items-center gap-1">
            <ToolIconBtn ariaLabel={t("posts.calendar.filter_text")}><TextIcon /></ToolIconBtn>
            <ToolIconBtn ariaLabel={t("posts.calendar.filter_image")}><ImageIcon /></ToolIconBtn>
            <ToolIconBtn ariaLabel={t("posts.calendar.filter_video")}><VideoIcon /></ToolIconBtn>
          </div>

          <FilterPill label={t("posts.calendar.filter_all_accounts")} showCheck />
          <FilterPill label={t("posts.calendar.filter_all_status")} />
          <FilterPill label={t("posts.calendar.filter_all_approvals")} />
          <FilterPill label={t("posts.calendar.filter_all_labels")} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Download className="size-3.5" />
            {t("posts.calendar.export_csv")}
          </button>
          <TimezonePill />
          <ViewModeSwitch view={view} onChange={setView} />
        </div>
      </div>

      {/* ===== APPLY + NOTIFICATIONS ROW ===== */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md text-xs h-9 px-3"
        >
          <FilterIcon className="size-3.5" />
          {t("posts.calendar.apply")}
        </button>
        <button
          type="button"
          className="relative inline-flex items-center justify-center size-8 rounded-md border border-input bg-background shadow-sm hover:bg-accent"
          aria-label="Notifications"
        >
          <Bell className="size-4 text-zinc-500" />
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
            11
          </span>
        </button>
      </div>

      {/* ===== CALENDAR CONTAINER ===== */}
      <div className="w-full overflow-hidden flex-1 min-h-0 rounded-xl border border-zinc-200 bg-card flex flex-col">
        {/* Calendar header (month label + nav) */}
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
            <button className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground text-xs h-8 px-3 font-medium">
              <span aria-hidden>📊</span>
              Reporting
              <ChevronDown className="size-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
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
        {view === "monthly" && <MonthView currentDate={currentDate} today={today} posts={posts} onPostClick={setSelectedPost} />}
        {view === "weekly" && <WeekView currentDate={currentDate} today={today} posts={posts} onPostClick={setSelectedPost} />}
        {view === "list" && (
          <ListView
            currentDate={currentDate}
            posts={posts}
            onPostClick={setSelectedPost}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </div>

      {selectedPost && <PostDetailsModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
}

// ===== POST DETAILS MODAL =====
function PostDetailsModal({ post, onClose }: { post: CalendarPost; onClose: () => void }) {
  const t = useTranslations("dashboard");
  const status = STATUS_META[post.status];
  const primaryPlatform = post.platforms[0];
  const platformLabel = PLATFORM_LABELS[primaryPlatform] ?? primaryPlatform;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in-0" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-card border border-zinc-200 shadow-lg rounded-lg w-full max-w-[1180px] max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex flex-col space-y-1.5 text-left">
            <h2 className="text-lg font-semibold leading-none tracking-tight flex items-center space-x-2">
              <span className="mr-2 inline-flex items-center justify-center size-5 rounded-full bg-green-500/15">
                <Check className="size-3 text-green-600" />
              </span>
              <span>{t("posts.calendar.post_details")}</span>
            </h2>
            <p className="text-sm text-muted-foreground">{t("posts.calendar.post_details_subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("posts.calendar.close")}
            className="absolute right-4 top-4 inline-flex items-center justify-center size-6 rounded hover:bg-zinc-100 text-zinc-500"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body: 2 columns */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Post content */}
          <div className="flex-1 min-w-0 overflow-auto px-6 pb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                    status.bg, status.text, status.border
                  )}>
                    {post.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <PlatformAvatar platform={{ id: primaryPlatform, name: platformLabel, handle: "", avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }} size={16} rounded="sm" />
                  <a className="text-sm font-medium hover:underline" href="#">{post.accountName}</a>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t("posts.calendar.scheduled_for")}</h3>
                    <p className="text-sm mt-1">{t("posts.calendar.not_scheduled")}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t("posts.calendar.published_at")}</h3>
                    <p className="text-sm mt-1">Jun 23, 2026, 10:44 AM</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t("posts.calendar.caption")}</h3>
                  <p className="text-sm whitespace-pre-wrap mt-1">{post.caption}</p>
                </div>

                {post.thumbnail && (
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">{t("posts.calendar.media")} (1)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="relative rounded-md overflow-hidden border bg-muted">
                        <div className="w-full h-full flex items-center justify-center aspect-video">
                          <img alt="" className="w-full h-full object-contain" src={post.thumbnail} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs border rounded-md divide-y">
                  <DetailRow label={t("posts.calendar.privacy_level")} value="PUBLIC_TO_EVERYONE" />
                  <DetailRow label={t("posts.calendar.disable_duet")} value="❌" />
                  <DetailRow label={t("posts.calendar.disable_comment")} value="❌" />
                  <DetailRow label={t("posts.calendar.disable_stitch")} value="❌" />
                  <DetailRow label={t("posts.calendar.draft_post")} value="❌" />
                  <DetailRow label={t("posts.calendar.auto_add_music")} value="❌" />
                  <DetailRow label={t("posts.calendar.title")} value="my cute cat" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Discussion panel */}
          <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-zinc-200 flex flex-col bg-card">
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
                <button className="mt-3 inline-flex items-center rounded-md bg-zinc-900 text-white px-3 h-8 text-xs font-medium hover:bg-zinc-800">
                  {t("posts.calendar.upgrade_premium")}
                </button>
                <p className="text-[11px] text-muted-foreground mt-3 flex items-center justify-center gap-1">
                  <RedirectIcon /> Redirects to Stripe
                </p>
              </div>
            </div>
            <div className="border-t border-zinc-200 p-3">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-md border border-zinc-200 bg-background px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  placeholder={t("posts.calendar.comment_placeholder")}
                />
                <button className="size-9 rounded-md bg-zinc-100 hover:bg-zinc-200 inline-flex items-center justify-center text-zinc-500" aria-label={t("posts.calendar.send")}>
                  <SendIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="font-medium py-1.5 pl-3 pr-3 border-r w-1/2">{label}</span>
      <span className="py-1.5 pl-3 pr-3 w-1/2 text-right">{value}</span>
    </div>
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

// ===== SUB COMPONENTS =====
function ToolIconBtn({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent text-xs h-8 w-8 p-0 rounded-lg transition-all duration-150 text-muted-foreground hover:text-foreground"
    >
      {children}
    </button>
  );
}

function FilterPill({ label, showCheck }: { label: string; showCheck?: boolean }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-9 justify-between text-xs"
    >
      <span className="truncate">{label}</span>
      {showCheck ? <Check className="ml-2 h-3 w-3 shrink-0 opacity-50" /> : <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />}
    </button>
  );
}

function TimezonePill() {
  const [tz, setTz] = useState("UTC");
  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-9 justify-between text-xs min-w-[180px]"
    >
      <span className="flex items-center gap-2">
        <GlobeIcon />
        {tz}
      </span>
      <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
    </button>
  );
}

function ViewModeSwitch({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const t = useTranslations("dashboard");
  const buttons: { mode: ViewMode; aria: string; icon: React.ReactNode }[] = [
    { mode: "weekly", aria: t("posts.calendar.weekly_view"), icon: <WeekIcon /> },
    { mode: "monthly", aria: t("posts.calendar.monthly_view"), icon: <MonthIcon /> },
    { mode: "list", aria: t("posts.calendar.list_view"), icon: <ListIcon /> },
  ];
  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded-lg">
      {buttons.map((b) => {
        const active = view === b.mode;
        return (
          <button
            key={b.mode}
            type="button"
            aria-label={b.aria}
            aria-pressed={active}
            onClick={() => onChange(b.mode)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-7 gap-1.5 rounded-md text-xs font-medium",
              b.mode === "monthly" ? "px-2.5" : "w-7 px-0",
              active ? "bg-background shadow-sm hover:bg-background text-foreground" : "hover:bg-accent text-muted-foreground"
            )}
          >
            {b.icon}
            {b.mode === "monthly" && <span>{t("posts.calendar.monthly")}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ===== MONTH VIEW =====
function MonthView({ currentDate, today, posts, onPostClick }: { currentDate: Date; today: Date; posts: CalendarPost[]; onPostClick: (p: CalendarPost) => void }) {
  const start = monthGridStart(currentDate);
  const days = useMemo(() => Array.from({ length: 35 }, (_, i) => addDays(start, i)), [start]);
  const month = currentDate.getMonth();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Day headers (sticky) */}
      <div className="grid grid-cols-7 border-b bg-background flex-shrink-0 sticky top-0 z-40">
        {DAYS.map((d) => (
          <div
            key={d}
            className="px-3 py-2 text-xs font-semibold text-muted-foreground text-center border-r last:border-r-0 border-zinc-200"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Week rows */}
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b last:border-b-0 flex-1 min-h-[150px]">
            {days.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, i) => (
              <DayCell
                key={i}
                day={day}
                isCurrentMonth={day.getMonth() === month}
                isToday={isSameDay(day, today)}
                posts={posts}
                onPostClick={onPostClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayCell({ day, isCurrentMonth, isToday, posts, onPostClick }: { day: Date; isCurrentMonth: boolean; isToday: boolean; posts: CalendarPost[]; onPostClick?: (p: CalendarPost) => void }) {
  const t = useTranslations("dashboard");
  const iso = fmtISO(day);
  const dayPosts = posts.filter((p) => p.date === iso);
  return (
    <div
      className={cn(
        "border-r last:border-r-0 p-2 flex flex-col min-w-[120px] min-h-[150px] relative group bg-card",
        !isCurrentMonth && "bg-muted/30"
      )}
    >
      {/* Day number row */}
      <div className="flex items-center gap-1 mb-2 flex-shrink-0">
        <span className={cn("text-sm font-medium flex-shrink-0", isCurrentMonth ? "text-foreground" : "text-muted-foreground")}>
          {day.getDate()}
        </span>
        {/* Tag button (lucide-tag) */}
        {isCurrentMonth && (
          <div className="flex-1 flex flex-wrap items-center gap-0.5 min-w-0 overflow-hidden">
            <button
              className="w-4 h-4 ml-0.5 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-primary/10 hover:scale-110 transition-all flex-shrink-0"
              aria-label={t("posts.calendar.add_label")}
            >
              <TagIcon className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
        {/* Status badge */}
        {dayPosts.length > 0 && (
          <div className="flex items-center space-x-0.5 flex-shrink-0">
            <div className="w-4 h-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <span className="text-[9px] font-medium text-green-600">{dayPosts.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Post cards */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {dayPosts.map((p) => (
          <EventCard key={p.id} post={p} onClick={() => onPostClick?.(p)} />
        ))}
      </div>

      {/* "+" add button */}
      {isCurrentMonth && (
        <button
          type="button"
          className="absolute bottom-1.5 right-1.5 inline-flex items-center justify-center size-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={t("posts.calendar.create_post")}
        >
          <Plus className="size-3.5" />
        </button>
      )}

      {/* Today highlight on right edge */}
      {isToday && (
        <div className="absolute top-1.5 right-1.5 size-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
          {day.getDate()}
        </div>
      )}
    </div>
  );
}

function EventCard({ post, onClick }: { post: CalendarPost; onClick?: () => void }) {
  const status = STATUS_META[post.status];
  return (
    <div
      draggable={true}
      onClick={onClick}
      className={cn(
        "text-xs rounded px-1.5 py-1 transition-all flex items-center justify-between border flex-shrink-0 relative z-10 overflow-visible cursor-pointer hover:shadow-sm",
        status.bg,
        status.border,
        status.text
      )}
    >
      <div className="flex items-center space-x-1 min-w-0">
        {/* Thumbnail */}
        {post.thumbnail && (
          <img
            alt=""
            className="w-4 h-4 rounded-sm object-cover flex-shrink-0 hidden lg:block"
            src={post.thumbnail}
          />
        )}
        {/* Platform icons */}
        <div className="flex items-center space-x-0.5">
          {post.platforms.slice(0, 6).map((p, i) => (
            <PlatformAvatar key={i} platform={{ id: p, name: PLATFORM_LABELS[p] ?? p, handle: "", avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }} size={14} rounded="sm" />
          ))}
        </div>
        {/* Time + caption preview */}
        <div className="flex items-center gap-1 min-w-0">
          {post.time && <span className="text-[10px] font-semibold whitespace-nowrap">{post.time}</span>}
          <span className="truncate text-[10px]">{post.caption.slice(0, 14)}</span>
        </div>
      </div>
      {/* Status checkmark */}
      {post.status === "scheduled" && <Check className="size-3 ml-auto shrink-0 opacity-80" />}
    </div>
  );
}

// ===== WEEK VIEW =====
function WeekView({ currentDate, today, posts, onPostClick }: { currentDate: Date; today: Date; posts: CalendarPost[]; onPostClick: (p: CalendarPost) => void }) {
  // Monday of week containing currentDate
  const dow = currentDate.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const weekStart = addDays(currentDate, offset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Posts by day
  const postsByDay: Record<string, CalendarPost[]> = {};
  posts.forEach((p) => {
    if (!postsByDay[p.date]) postsByDay[p.date] = [];
    postsByDay[p.date].push(p);
  });

  return (
    <div className="flex-1 overflow-auto min-h-0">
      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] min-w-[800px]">
        {/* Header row */}
        <div className="sticky top-0 z-30 bg-background border-r border-b border-zinc-200" />
        {days.map((d, i) => {
          const isToday = isSameDay(d, today);
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
              {postsByDay[fmtISO(d)]?.length > 0 && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-green-500/10 border border-green-500/30 text-[9px] font-medium text-green-600">
                    {postsByDay[fmtISO(d)].length}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Hour rows */}
        {hours.map((h) => (
          <FragmentRow key={h} hour={h} days={days} postsByDay={postsByDay} today={today} onPostClick={onPostClick} />
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
}: {
  hour: number;
  days: Date[];
  postsByDay: Record<string, CalendarPost[]>;
  today: Date;
  onPostClick: (p: CalendarPost) => void;
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
        return (
          <div
            key={i}
            className={cn(
              "border-r last:border-r-0 border-b border-zinc-200 h-16 p-1 relative",
              isToday && "bg-blue-50/30"
            )}
          >
            {/* Posts for this hour */}
            {(postsByDay[iso] || [])
              .filter((p) => p.time && parseInt(p.time.split(":")[0], 10) === hour)
              .map((p) => (
                <WeekEventCard key={p.id} post={p} onClick={() => onPostClick(p)} />
              ))}
            {/* Current time line */}
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

function WeekEventCard({ post, onClick }: { post: CalendarPost; onClick?: () => void }) {
  const status = STATUS_META[post.status];
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded px-1.5 py-1 border flex items-center gap-1 text-[10px] cursor-pointer hover:shadow-sm",
        status.bg,
        status.border,
        status.text
      )}
    >
      {post.thumbnail && <img alt="" className="w-3 h-3 rounded-sm object-cover" src={post.thumbnail} />}
      <div className="flex items-center gap-0.5">
        {post.platforms.slice(0, 2).map((p, i) => (
          <PlatformAvatar key={i} platform={{ id: p, name: PLATFORM_LABELS[p] ?? p, handle: "", avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }} size={14} rounded="sm" />
        ))}
      </div>
      {post.time && <span className="font-semibold">{post.time}</span>}
      <Check className="size-2.5 ml-auto opacity-80" />
    </div>
  );
}

// ===== LIST VIEW =====
function ListView({ currentDate, posts, onPostClick, onBulkDelete }: { currentDate: Date; posts: CalendarPost[]; onPostClick: (p: CalendarPost) => void; onBulkDelete: (ids: string[]) => Promise<void> }) {
  const t = useTranslations("dashboard");
  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const listRows = posts
    .filter((p) => {
      const d = new Date(p.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({
      ...p,
      dateLabel: `${p.date}T${p.time ?? "00:00"}`.replace(/-/g, " ").slice(0, 16),
    }));

  const allSelected = listRows.length > 0 && listRows.every((r) => selected.has(r.id));
  const someSelected = !allSelected && listRows.some((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(listRows.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected post${selected.size === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await onBulkDelete(Array.from(selected));
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto min-h-0">
      <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-200 sticky top-0 bg-card z-30">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="size-4 rounded border-zinc-300"
            aria-label={t("posts.calendar.select_all")}
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleAll}
          />
          <h3 className="text-sm font-semibold">{monthName}</h3>
          <span className="text-xs text-muted-foreground">{listRows.length} posts</span>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={busy}
              className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
              {busy ? t("posts.calendar.deleting") : `Delete ${selected.size}`}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="size-8 rounded-md hover:bg-zinc-100 inline-flex items-center justify-center" aria-label={t("posts.calendar.previous")}>
            <ChevronLeft className="size-4" />
          </button>
          <button className="size-8 rounded-md hover:bg-zinc-100 inline-flex items-center justify-center" aria-label={t("posts.calendar.next")}>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="sticky top-[57px] bg-card z-20">
          <tr className="border-b border-zinc-200 text-xs text-muted-foreground">
            <th className="w-10 px-3 py-2" />
            <th className="text-left px-3 py-2 font-medium">{t("posts.calendar.caption")}</th>
            <th className="text-left px-3 py-2 font-medium">Account</th>
            <th className="text-left px-3 py-2 font-medium">{t("posts.calendar.status")}</th>
            <th className="text-left px-3 py-2 font-medium">{t("posts.calendar.date")}</th>
          </tr>
        </thead>
        <tbody>
          {listRows.map((row) => {
            const status = STATUS_META[row.status];
            const isSelected = selected.has(row.id);
            return (
              <tr
                key={row.id}
                className={cn("border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer", isSelected && "bg-blue-50/60")}
                onClick={() => onPostClick(row)}
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-zinc-300"
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleOne(row.id)}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-start gap-2">
                    {row.thumbnail && (
                      <img alt="" className="w-10 h-10 rounded object-cover shrink-0" src={row.thumbnail} />
                    )}
                    <p className="line-clamp-2 text-[13px] text-zinc-900">{row.caption}</p>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {row.platforms.slice(0, 1).map((p, i) => (
            <PlatformAvatar key={i} platform={{ id: p, name: PLATFORM_LABELS[p] ?? p, handle: "", avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }} size={14} rounded="sm" />
                    ))}
                    <span className="text-xs text-zinc-700">{row.accountName}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border", status.bg, status.border, status.text)}>
                    {status.label}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-zinc-600 whitespace-nowrap">{row.dateLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function todayLabel() {
  const d = new Date();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " 8:4";
}

const LIST_SAMPLE: (CalendarPost & { dateLabel: string })[] = [
  {
    id: "l1",
    date: todayOffset(0),
    dateLabel: todayLabel(),
    caption: "Why you bought a tennis ball for fitness. Your cat likes hustle sideways...",
    status: "scheduled",
    platforms: ["twitter"],
    accountName: "nicklorance7",
  },
  {
    id: "l2",
    date: todayOffset(0),
    dateLabel: todayLabel(),
    caption: "Ever seen a house panther descend quietly? 👀 This little shadow match has everything...",
    status: "published",
    platforms: ["instagram"],
    accountName: "nicklorance7",
  },
  {
    id: "l3",
    date: todayOffset(0),
    dateLabel: todayLabel(),
    caption: "Your daily reminder that cats do not need a gym membership...",
    status: "published",
    platforms: ["bluesky"],
    accountName: "nicklorance.bsky.social",
  },
  {
    id: "l4",
    date: todayOffset(0),
    dateLabel: todayLabel(),
    caption: "A tennis ball entered his kitchen. The tiny panther chose violence...",
    status: "published",
    platforms: ["twitter"],
    accountName: "nicklorance.bsky.social",
  },
  {
    id: "l5",
    date: todayOffset(0),
    dateLabel: todayLabel(),
    caption: "Productivity lessons from a black cat and a remote cat! Focus on one target...",
    status: "published",
    platforms: ["linkedin"],
    accountName: "nicklorance7",
  },
  {
    id: "l6",
    date: todayOffset(0),
    dateLabel: todayLabel(),
    caption: "Not in the dramatic, but the cat in one paw away from a sports documentary...",
    status: "published",
    platforms: ["tiktok"],
    accountName: "nicklorance7",
  },
  {
    id: "l7",
    date: todayOffset(0),
    dateLabel: todayLabel(),
    caption: "Watch cat play time, approved by one very serious dog partner...",
    status: "published",
    platforms: ["pinterest"],
    accountName: "nicklorance7",
  },
  {
    id: "l8",
    date: todayOffset(0),
    dateLabel: todayLabel(),
    caption: "The panther no tennis ball. Kitchen floor edition. The ball is trying really...",
    status: "draft",
    platforms: ["instagram"],
    accountName: "nicklorance.life",
  },
];

// ===== ICONS =====
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

// ===== HELPERS =====
function weekRangeLabel(d: Date): string {
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const start = addDays(d, offset);
  const end = addDays(start, 6);
  const fmt = (x: Date) => x.toLocaleString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} - ${fmt(end)}, ${end.getFullYear()}`;
}