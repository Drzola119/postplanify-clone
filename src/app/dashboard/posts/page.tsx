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
import { cn } from "@/lib/utils";
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
const PLATFORM_META: Record<Platform, { color: string; bg: string; label: string; svg: React.ReactNode }> = {
  instagram: {
    color: "#DD2A7B",
    bg: "bg-pink-50",
    label: "Instagram",
    svg: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  twitter: {
    color: "#000000",
    bg: "bg-zinc-100",
    label: "Twitter/X",
    svg: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  tiktok: {
    color: "#000000",
    bg: "bg-zinc-100",
    label: "TikTok",
    svg: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.51a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.05z" />
      </svg>
    ),
  },
  linkedin: {
    color: "#0A66C2",
    bg: "bg-blue-50",
    label: "LinkedIn",
    svg: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  facebook: {
    color: "#1877F2",
    bg: "bg-blue-50",
    label: "Facebook",
    svg: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
      </svg>
    ),
  },
  threads: {
    color: "#000000",
    bg: "bg-zinc-100",
    label: "Threads",
    svg: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.32.143 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
      </svg>
    ),
  },
  youtube: {
    color: "#FF0000",
    bg: "bg-red-50",
    label: "YouTube",
    svg: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
      </svg>
    ),
  },
  pinterest: {
    color: "#E60023",
    bg: "bg-red-50",
    label: "Pinterest",
    svg: (
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.11-1.28-.56-2.02-2.38-2.02-3.85 0-3.16 2.24-6.03 6.56-6.03 3.44 0 6.12 2.47 6.12 5.74 0 3.44-2.13 6.2-5.18 6.2-.97 0-1.92-.52-2.26-1.13l-.67 2.37c-.23.86-.86 2.01-1.29 2.7v-.03z" />
      </svg>
    ),
  },
  bluesky: {
    color: "#1185FE",
    bg: "bg-blue-50",
    label: "Bluesky",
    svg: (
      <svg viewBox="0 -3.268 64 68.414" className="h-3 w-3 text-blue-500" fill="currentColor">
        <path d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805zm36.254 0C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745z" />
      </svg>
    ),
  },
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

// ===== SAMPLE DATA =====
const SAMPLE_POSTS: CalendarPost[] = [
  {
    id: "p1",
    date: "2026-06-23",
    time: "10:44",
    caption: "Your full reminder that cats do not need a gym membership...",
    status: "scheduled",
    thumbnail: "https://cdn.postplanify.com/posts/all-types/8e44be67-9b3f-4a61-96c8-708fd3131a0c/ba9a528b-b3e7-41b5-979d-18b6773bd130/1782207863335-ya5f2h3vz-0.jpg",
    platforms: ["bluesky", "twitter", "pinterest"],
    accountName: "nicklorance.bsky.social",
  },
  {
    id: "p2",
    date: "2026-06-23",
    time: "10:44",
    caption: "Productivity lessons from a black cat and a remote cat!...",
    status: "scheduled",
    thumbnail: "https://cdn.postplanify.com/posts/all-types/8e44be67-9b3f-4a61-96c8-708fd3131a0c/ba9a528b-b3e7-41b5-979d-18b6773bd130/1782207863335-ya5f2h3vz-1.jpg",
    platforms: ["instagram", "twitter", "pinterest"],
    accountName: "nicklorance7",
  },
  {
    id: "p3",
    date: "2026-06-27",
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
  const [view, setView] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 27)); // June 27 2026
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [posts, setPosts] = useState<CalendarPost[]>(SAMPLE_POSTS);
  const [postsVersion, setPostsVersion] = useState(0);
  const today = new Date(2026, 5, 27);

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
            <ToolIconBtn ariaLabel="Text posts"><TextIcon /></ToolIconBtn>
            <ToolIconBtn ariaLabel="Image posts"><ImageIcon /></ToolIconBtn>
            <ToolIconBtn ariaLabel="Video posts"><VideoIcon /></ToolIconBtn>
          </div>

          <FilterPill label="All Accounts" showCheck />
          <FilterPill label="All Status" />
          <FilterPill label="All Approvals" />
          <FilterPill label="All Labels" />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Download className="size-3.5" />
            Export CSV
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
          Apply
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
              Today
            </button>
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center justify-center size-8 rounded-md border border-input bg-background shadow-sm hover:bg-accent"
              aria-label="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center justify-center size-8 rounded-md border border-input bg-background shadow-sm hover:bg-accent"
              aria-label="Next"
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
  const status = STATUS_META[post.status];
  const primaryPlatform = post.platforms[0];
  const platformMeta = PLATFORM_META[primaryPlatform];

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
              <span>Post Details</span>
            </h2>
            <p className="text-sm text-muted-foreground">View and manage your social media post</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
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
                  <span style={{ color: platformMeta.color }}>{platformMeta.svg}</span>
                  <a className="text-sm font-medium hover:underline" href="#">{post.accountName}</a>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Scheduled For</h3>
                    <p className="text-sm mt-1">Not scheduled yet</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Published At</h3>
                    <p className="text-sm mt-1">Jun 23, 2026, 10:44 AM</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Caption</h3>
                  <p className="text-sm whitespace-pre-wrap mt-1">{post.caption}</p>
                </div>

                {post.thumbnail && (
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">Media (1)</h3>
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
                  <DetailRow label="Privacy Level" value="PUBLIC_TO_EVERYONE" />
                  <DetailRow label="Disable Duet" value="❌" />
                  <DetailRow label="Disable Comment" value="❌" />
                  <DetailRow label="Disable Stitch" value="❌" />
                  <DetailRow label="Draft Post" value="❌" />
                  <DetailRow label="Auto Add Music" value="❌" />
                  <DetailRow label="Title" value="my cute cat" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Discussion panel */}
          <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-zinc-200 flex flex-col bg-card">
            <div className="px-4 pt-4 pb-3 border-b border-zinc-200">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ChatIcon />
                Discussion
              </h3>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="mx-auto size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                  <ChatIcon className="size-6 text-zinc-400" />
                </div>
                <p className="text-sm font-semibold">Premium feature</p>
                <p className="text-xs text-muted-foreground mt-1">Comment on any post and @mention teammates</p>
                <button className="mt-3 inline-flex items-center rounded-md bg-zinc-900 text-white px-3 h-8 text-xs font-medium hover:bg-zinc-800">
                  Upgrade to Premium
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
                  placeholder="Comment... @ to mention"
                />
                <button className="size-9 rounded-md bg-zinc-100 hover:bg-zinc-200 inline-flex items-center justify-center text-zinc-500" aria-label="Send">
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
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-9 justify-between text-xs min-w-[180px]"
    >
      <span className="flex items-center gap-2">
        <GlobeIcon />
        Lagos +01:00
      </span>
      <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
    </button>
  );
}

function ViewModeSwitch({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const buttons: { mode: ViewMode; aria: string; icon: React.ReactNode }[] = [
    { mode: "weekly", aria: "Weekly view", icon: <WeekIcon /> },
    { mode: "monthly", aria: "Monthly view", icon: <MonthIcon /> },
    { mode: "list", aria: "List view", icon: <ListIcon /> },
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
            {b.mode === "monthly" && <span>Monthly</span>}
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
              aria-label="Add label"
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
          aria-label="Create post"
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
      draggable={false}
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
            <span key={i} style={{ color: PLATFORM_META[p].color }}>{PLATFORM_META[p].svg}</span>
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
          <span key={i} style={{ color: PLATFORM_META[p].color }}>{PLATFORM_META[p].svg}</span>
        ))}
      </div>
      {post.time && <span className="font-semibold">{post.time}</span>}
      <Check className="size-2.5 ml-auto opacity-80" />
    </div>
  );
}

// ===== LIST VIEW =====
function ListView({ currentDate, posts, onPostClick, onBulkDelete }: { currentDate: Date; posts: CalendarPost[]; onPostClick: (p: CalendarPost) => void; onBulkDelete: (ids: string[]) => Promise<void> }) {
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
            aria-label="Select all"
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
              {busy ? "Deleting…" : `Delete ${selected.size}`}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="size-8 rounded-md hover:bg-zinc-100 inline-flex items-center justify-center" aria-label="Previous">
            <ChevronLeft className="size-4" />
          </button>
          <button className="size-8 rounded-md hover:bg-zinc-100 inline-flex items-center justify-center" aria-label="Next">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="sticky top-[57px] bg-card z-20">
          <tr className="border-b border-zinc-200 text-xs text-muted-foreground">
            <th className="w-10 px-3 py-2" />
            <th className="text-left px-3 py-2 font-medium">Caption</th>
            <th className="text-left px-3 py-2 font-medium">Account</th>
            <th className="text-left px-3 py-2 font-medium">Status</th>
            <th className="text-left px-3 py-2 font-medium">Date</th>
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
                      <span key={i} style={{ color: PLATFORM_META[p].color }}>{PLATFORM_META[p].svg}</span>
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

const LIST_SAMPLE: (CalendarPost & { dateLabel: string })[] = [
  {
    id: "l1",
    date: "2026-06-23",
    dateLabel: "Jun 23, 2026 8:4",
    caption: "Why you bought a tennis ball for fitness. Your cat likes hustle sideways...",
    status: "scheduled",
    platforms: ["twitter"],
    accountName: "nicklorance7",
  },
  {
    id: "l2",
    date: "2026-06-23",
    dateLabel: "Jun 23, 2026 8:4",
    caption: "Ever seen a house panther descend quietly? 👀 This little shadow match has everything...",
    status: "published",
    platforms: ["instagram"],
    accountName: "nicklorance7",
  },
  {
    id: "l3",
    date: "2026-06-23",
    dateLabel: "Jun 23, 2026 8:4",
    caption: "Your daily reminder that cats do not need a gym membership...",
    status: "published",
    platforms: ["bluesky"],
    accountName: "nicklorance.bsky.social",
  },
  {
    id: "l4",
    date: "2026-06-23",
    dateLabel: "Jun 23, 2026 8:4",
    caption: "A tennis ball entered his kitchen. The tiny panther chose violence...",
    status: "published",
    platforms: ["twitter"],
    accountName: "nicklorance.bsky.social",
  },
  {
    id: "l5",
    date: "2026-06-23",
    dateLabel: "Jun 23, 2026 8:4",
    caption: "Productivity lessons from a black cat and a remote cat! Focus on one target...",
    status: "published",
    platforms: ["linkedin"],
    accountName: "nicklorance7",
  },
  {
    id: "l6",
    date: "2026-06-23",
    dateLabel: "Jun 23, 2026 8:4",
    caption: "Not in the dramatic, but the cat in one paw away from a sports documentary...",
    status: "published",
    platforms: ["tiktok"],
    accountName: "nicklorance7",
  },
  {
    id: "l7",
    date: "2026-06-23",
    dateLabel: "Jun 23, 2026 8:4",
    caption: "Watch cat play time, approved by one very serious dog partner...",
    status: "published",
    platforms: ["pinterest"],
    accountName: "nicklorance7",
  },
  {
    id: "l8",
    date: "2026-06-23",
    dateLabel: "Jun 23, 2026 8:4",
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