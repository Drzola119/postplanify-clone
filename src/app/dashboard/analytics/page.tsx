"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Users, Eye, ThumbsUp, BarChart3, ChevronDown, ChevronRight, Calendar, RefreshCw,
  Heart, MessageCircle, Repeat2, Bookmark, Share2, MousePointerClick, MessageSquare, Play,
  TrendingUp, Globe,
} from "lucide-react";

// ============================================================
// Types
// ============================================================
type Period = "7d" | "14d" | "30d" | "90d" | "custom";

type Platform =
  | "youtube" | "instagram" | "twitter" | "tiktok"
  | "facebook" | "threads" | "linkedin" | "pinterest" | "bluesky";

interface AccountSummary {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  initials?: string;
  avatar?: string;
  followers?: number;
  views?: number;
  engagement?: number;
  engRate?: string;
  syncedAgo: string;
  bio?: string;
  following?: number;
  posts?: number;
  videos?: number;
  totalLikes?: number;
  totalViews?: number;
  subscribers?: number;
}

// ============================================================
// Mock data — same accounts as the live postplanify
// ============================================================
const ACCOUNTS: AccountSummary[] = [
  { id: "f7d35d06-c1e3-4f35-856f-44e894afe89b", name: "Zakaria 11", handle: "@zakaria_119", platform: "youtube", initials: "Z", subscribers: 1, videos: 5, totalViews: 9, syncedAgo: "1h ago" },
  { id: "d4fd9445-2853-4fa3-b457-3a139f0d9909", name: "nicklorance.bsky.social", handle: "@nicklorance.bsky.social", platform: "bluesky", initials: "🦋", followers: 16, following: 33, posts: 23, syncedAgo: "1h ago" },
  { id: "f1e8da8f-ae54-4d49-af95-7503ffa81836", name: "Nick Lorance", handle: "@nicklorance7", platform: "threads", initials: "N", followers: 0, posts: 0, syncedAgo: "1h ago" },
  { id: "8cd534e3-fdb9-4bb8-822d-b666f386dfb5", name: "nick_lorance", handle: "@nick_lorance", platform: "tiktok", initials: "n", followers: 2, following: 1, videos: 20, totalLikes: 140, syncedAgo: "1h ago" },
  { id: "cc9882eb-2491-453e-8a19-9e7430d6fa7e", name: "nick lorance life", handle: "@nick-lorance-life", platform: "facebook", initials: "N", bio: "Personal blog", followers: 0, posts: 16, totalViews: 221, syncedAgo: "19h ago" },
  { id: "f7c4825f-1880-4a3a-9fd5-c5d1fa5bbccc", name: "LoranceNic36048", handle: "@LoranceNic36048", platform: "twitter", initials: "N", followers: 0, syncedAgo: "3h ago" },
];

// ============================================================
// Platform icon (colored square badge w/ letter)
// ============================================================
function PlatformIcon({ platform, className = "" }: { platform: Platform; className?: string }) {
  const map: Record<Platform, { color: string; letter: string }> = {
    youtube: { color: "#FF0000", letter: "▶" },
    instagram: { color: "#E1306C", letter: "📷" },
    twitter: { color: "#000000", letter: "𝕏" },
    tiktok: { color: "#000000", letter: "♪" },
    facebook: { color: "#1877F2", letter: "f" },
    threads: { color: "#000000", letter: "@" },
    linkedin: { color: "#0A66C2", letter: "in" },
    pinterest: { color: "#E60023", letter: "P" },
    bluesky: { color: "#1185FE", letter: "🦋" },
  };
  const info = map[platform];
  return (
    <span
      className={`inline-flex items-center justify-center size-4 rounded-md text-[10px] font-bold text-white shrink-0 ${className}`}
      style={{ backgroundColor: info.color }}
      aria-label={platform}
    >
      {info.letter}
    </span>
  );
}

function PlatformAvatar({ platform, name, initials, size = 40 }: { platform: Platform; name: string; initials?: string; size?: number }) {
  const letter = initials ?? name[0]?.toUpperCase() ?? "?";
  const map: Record<Platform, string> = {
    youtube: "#FF0000",
    instagram: "linear-gradient(135deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)",
    twitter: "#000000",
    tiktok: "#000000",
    facebook: "#1877F2",
    threads: "#000000",
    linkedin: "#0A66C2",
    pinterest: "#E60023",
    bluesky: "#1185FE",
  };
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.4,
        background: map[platform],
      }}
    >
      {letter}
    </div>
  );
}

// ============================================================
// Sparkline mini chart
// ============================================================
function Sparkline({ data, color, width = 80, height = 36 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={area} fill={color} fillOpacity={0.12} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================
// Line chart for right column
// ============================================================
function LineChart({
  series, dates, yMax, height = 128, xLabels = [],
}: {
  series: { label: string; color: string; data: number[] }[];
  dates: string[];
  yMax?: number;
  height?: number;
  xLabels?: string[];
}) {
  const padding = { top: 10, right: 8, bottom: 22, left: 30 };
  const width = 539;
  const all = series.flatMap(s => s.data);
  const max = yMax ?? Math.max(...all, 1) * 1.1;
  const min = 0;
  const cw = width - padding.left - padding.right;
  const ch = height - padding.top - padding.bottom;

  const makePath = (data: number[]) =>
    data.map((v, i) => {
      const x = padding.left + (i / (data.length - 1)) * cw;
      const y = padding.top + ch - ((v - min) / (max - min)) * ch;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");

  const makeArea = (data: number[]) => {
    const line = makePath(data);
    const last = padding.left + cw;
    return `${line} L${last},${padding.top + ch} L${padding.left},${padding.top + ch} Z`;
  };

  // Y-axis ticks
  const yTicks = [];
  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) {
    const value = (max / tickCount) * i;
    yTicks.push({ value, y: padding.top + ch - (i / tickCount) * ch });
  }

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-auto">
      {yTicks.map((t, i) => (
        <text key={i} x={padding.left - 6} y={t.y + 3} textAnchor="end" fontSize="9" fill="rgb(161, 161, 170)">
          {Math.round(t.value)}
        </text>
      ))}
      {series.map((s, i) => (
        <g key={i}>
          <path d={makeArea(s.data)} fill={s.color} fillOpacity={0.12} />
          <path d={makePath(s.data)} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {dates.map((d, i) => {
        const x = padding.left + (i / (dates.length - 1)) * cw;
        return (
          <text key={i} x={x} y={height - 6} textAnchor="middle" fontSize="10" fill="rgb(115, 115, 115)">
            {d}
          </text>
        );
      })}
      {xLabels.length > 0 && xLabels.map((xl, i) => (
        <text key={i} x={padding.left + 4} y={padding.top + 10} fontSize="9" fill="rgb(115, 115, 115)">{xl}</text>
      ))}
    </svg>
  );
}

// ============================================================
// Mini trend chart for Trends section (with optional change %)
// ============================================================
function MiniTrend({ data, color, yMax, height = 56 }: { data: number[]; color: string; yMax?: number; height?: number }) {
  if (!data || data.length === 0) return null;
  const max = yMax ?? Math.max(...data, 1) * 1.1;
  const width = 180;
  const padding = { top: 4, right: 4, bottom: 4, left: 4 };
  const cw = width - padding.left - padding.right;
  const ch = height - padding.top - padding.bottom;
  const path = data.map((v, i) => {
    const x = padding.left + (i / (data.length - 1)) * cw;
    const y = padding.top + ch - (v / max) * ch;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");
  // Dots on each point
  const dots = data.map((v, i) => {
    const x = padding.left + (i / (data.length - 1)) * cw;
    const y = padding.top + ch - (v / max) * ch;
    return { x, y };
  });
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full">
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={2.5} fill="white" stroke={color} strokeWidth={1.5} />
      ))}
    </svg>
  );
}

// ============================================================
// Best Times heatmap (M T W T F S S x 4 time slots)
// ============================================================
function BestTimesHeatmap({ data }: { data: number[][] }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const times = ["12a", "6a", "12p", "6p"];
  const max = Math.max(...data.flat(), 1);

  return (
    <div>
      <div className="grid grid-cols-[28px_1fr] gap-1">
        <div></div>
        <div className="grid grid-cols-4 gap-1">
          {times.map(t => (
            <div key={t} className="text-center text-[10px] text-zinc-500">{t}</div>
          ))}
        </div>
        {days.map((day, di) => (
          <div key={di} className="contents">
            <div className="text-center text-[10px] text-zinc-500 leading-[28px]">{day}</div>
            <div className="grid grid-cols-4 gap-1">
              {data[di]?.map((v, ti) => {
                const intensity = v / max;
                return (
                  <div
                    key={ti}
                    className="h-7 rounded"
                    style={{
                      backgroundColor: v === 0 ? "#f4f4f5" : `rgba(16, 185, 129, ${0.2 + intensity * 0.8})`,
                    }}
                    title={`${day} ${times[ti]}: ${v}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-2 text-[10px] text-zinc-500">
        <span>Less</span>
        <div className="flex">
          {[0.2, 0.4, 0.6, 0.8, 1].map(i => (
            <div key={i} className="size-3" style={{ backgroundColor: `rgba(16, 185, 129, ${i})` }} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

// ============================================================
// Time filter pill group
// ============================================================
function TimeFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const options: { value: Period; label: string; icon?: boolean }[] = [
    { value: "7d", label: "7d" },
    { value: "14d", label: "14d" },
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-zinc-100 p-0.5 h-7">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 h-6 text-[12px] font-medium transition-colors whitespace-nowrap ${
            value === o.value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
          }`}
          aria-pressed={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Account avatar
// ============================================================
function AccountAvatar({ account }: { account: AccountSummary }) {
  return (
    <div className="relative shrink-0">
      <div className="size-8 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 flex items-center justify-center text-xs font-semibold text-zinc-700 overflow-hidden">
        {account.initials ?? account.name[0]?.toUpperCase()}
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-white flex items-center justify-center border border-zinc-200">
        <PlatformIcon platform={account.platform} className="size-3" />
      </span>
    </div>
  );
}

// ============================================================
// Compare + Overview dropdowns
// ============================================================
function OverviewDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const go = (accountId?: string) => {
    setOpen(false);
    if (accountId) router.push(`${pathname}?accountId=${accountId}`);
    else router.push(pathname);
  };
  return (
    <div className="relative" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 h-8 text-[13px] font-medium text-white hover:bg-zinc-800"
      >
        Overview (All)
        <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => go(undefined)}
              className="block w-full text-left px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50"
            >
              <p className="text-xs text-zinc-500 mb-0.5">All accounts</p>
              <p className="text-sm font-semibold text-zinc-900">Overview (All)</p>
            </button>
            {ACCOUNTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => go(a.id)}
                className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-zinc-50 text-left"
              >
                <AccountAvatar account={a} />
                <span className="text-[13px] text-zinc-700 truncate">{a.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Timezone dropdown
// ============================================================
function TimezoneDropdown() {
  const [open, setOpen] = useState(false);
  const [tz, setTz] = useState("Lagos (+01:00)");
  const options = ["UTC (+00:00)", "Lagos (+01:00)", "Cairo (+02:00)", "Paris (+01:00)", "New York (-05:00)", "Los Angeles (-08:00)"];
  return (
    <div className="relative" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900"
      >
        <Globe className="size-3.5" />
        {tz}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
            {options.map(o => (
              <button
                key={o}
                type="button"
                onClick={() => { setTz(o); setOpen(false); }}
                className={`block w-full text-left px-4 py-2 text-[13px] hover:bg-zinc-50 ${tz === o ? "bg-zinc-50 font-semibold" : ""}`}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Per-account analytics view data
// ============================================================
interface MetricCard {
  label: string;
  value: string;
  sub: string;
  bg: string;
  textColor: string;
}

const PER_ACCOUNT_DATA: Record<string, {
  updatedAt: string;
  updatedRelative: string;
  headerMetrics: { value: string; label: string; color: string; icon: React.ReactNode }[];
  metrics: MetricCard[];
  trends: {
    followers: number[];
    views: number[];
    viewsChange?: string;
    engagement: number[];
    engagementChange?: string;
    interactions: number[];
    interactionsChange?: string;
    bestTimes: number[][];
  };
  table: {
    title: string;
    count: string;
    columns: string[];
    rows: { thumb?: string; col1: string; col2: string; values: (string | number)[]; engRate?: string; actions?: boolean }[];
  };
}> = {
  youtube: {
    updatedAt: "Jun 27, 2026, 09:49 AM",
    updatedRelative: "6 minutes ago",
    headerMetrics: [
      { value: "1", label: "Subscribers", color: "#ef4444", icon: <Users className="size-4 text-white" /> },
      { value: "5", label: "Videos", color: "#a855f7", icon: <Play className="size-4 text-white" /> },
      { value: "9", label: "Total Views", color: "#3b82f6", icon: <Eye className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "VIEWS", value: "26", sub: "Total views", bg: "bg-blue-50", textColor: "text-blue-700" },
      { label: "LIKES", value: "1", sub: "Total likes", bg: "bg-rose-50", textColor: "text-rose-700" },
      { label: "COMMENTS", value: "0", sub: "Total comments", bg: "bg-violet-50", textColor: "text-violet-700" },
      { label: "ENGAGEMENT", value: "2.04%", sub: "Avg rate", bg: "bg-orange-50", textColor: "text-orange-700" },
      { label: "INTERACTIONS", value: "1", sub: "Total", bg: "bg-emerald-50", textColor: "text-emerald-700" },
    ],
    trends: {
      followers: [1, 1, 1, 1, 1],
      views: [9, 0, 0, 0, 0],
      engagement: [0, 0, 0, 0, 0],
      interactions: [1, 0, 0, 0, 0],
      bestTimes: [
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
        [0, 0, 0, 1], [0, 0, 0, 0], [0, 0, 0, 0],
      ],
    },
    table: {
      title: "Video Performance",
      count: "7 videos",
      columns: ["Video", "Title", "Date", "Views", "Likes", "Comments", "Eng. Rate", "Duration", "Interactions", "Actions"],
      rows: [
        { thumb: "K", col1: "Kling 3 Revolutionizes 2026", col2: "May 13, 2026 14:31", values: [17, 0, 0, "0.00%", "6s", 0], engRate: "0.00%" },
        { thumb: "T", col1: "Top 7 Black Cat Breeds That Rule the Internet", col2: "May 8, 2026 20:41", values: [7, 1, 0, "14.29%", "29s", 1], engRate: "14.29%" },
        { thumb: "M", col1: "Meet Luna, My Adorable Black Kitty!", col2: "May 7, 2026 19:57", values: [2, 0, 0, "0.00%", "5s", 0], engRate: "0.00%" },
        { thumb: "M", col1: "Meet My Furry Little Buddy", col2: "May 6, 2026 18:59", values: [0, 0, 0, "0.00%", "5s", 0], engRate: "0.00%" },
        { thumb: "T", col1: "Transform Your Mornings with These Life-Changing Habits!", col2: "Apr 13, 2026 21:12", values: [0, 0, 0, "0.00%", "9s", 0], engRate: "0.00%" },
        { thumb: "v", col1: "video", col2: "Mar 25, 2026 11:17", values: [0, 0, 0, "0.00%", "57s", 0], engRate: "0.00%" },
        { thumb: "v", col1: "video", col2: "Mar 25, 2026 10:47", values: [0, 0, 0, "0.00%", "57s", 0], engRate: "0.00%" },
      ],
    },
  },
  bluesky: {
    updatedAt: "Jun 27, 2026, 09:00 AM",
    updatedRelative: "55 minutes ago",
    headerMetrics: [
      { value: "16", label: "Followers", color: "#1185FE", icon: <Users className="size-4 text-white" /> },
      { value: "33", label: "Following", color: "#a855f7", icon: <Users className="size-4 text-white" /> },
      { value: "23", label: "Posts", color: "#3b82f6", icon: <MessageCircle className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "LIKES", value: "28", sub: "Total likes", bg: "bg-rose-50", textColor: "text-rose-700" },
      { label: "REPOSTS", value: "3", sub: "Total reposts", bg: "bg-emerald-50", textColor: "text-emerald-700" },
      { label: "REPLIES", value: "0", sub: "Total replies", bg: "bg-blue-50", textColor: "text-blue-700" },
      { label: "QUOTES", value: "0", sub: "Total quotes", bg: "bg-violet-50", textColor: "text-violet-700" },
      { label: "BOOKMARKS", value: "0", sub: "Total bookmarks", bg: "bg-amber-50", textColor: "text-amber-700" },
    ],
    trends: {
      followers: [16, 16, 16, 16, 16],
      views: [0, 0, 0, 0, 0],
      engagement: [0.25, 0.5, 0.75, 1, 0],
      interactions: [0, 0.25, 0.5, 0.75, 1],
      bestTimes: [
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
      ],
    },
    table: {
      title: "Post Performance",
      count: "23 posts",
      columns: ["Post", "Content", "Date", "Likes", "Reposts", "Replies", "Quotes", "Bookmarks", "Eng. Rate", "Actions"],
      rows: [
        { thumb: "🐱", col1: "Tiny panther vs. tennis ball.", col2: "Jun 23, 2026 10:44", values: [0, 0, 0, 0, 0], engRate: "0.00%" },
        { thumb: "❤️", col1: "❤️❤️❤️", col2: "May 23, 2026 23:08", values: [0, 0, 0, 0, 0], engRate: "0.00%" },
        { thumb: "🐈", col1: "Cat Playing with Toy", col2: "May 21, 2026 21:56", values: [6, 2, 0, 0, 0], engRate: "50.00%" },
        { thumb: "🐾", col1: "The Joy of Cat Playtime: Understanding Feline Behavior", col2: "May 20, 2026 21:47", values: [4, 0, 0, 0, 0], engRate: "25.00%" },
        { thumb: "c", col1: "ctts", col2: "May 20, 2026 18:43", values: [0, 0, 0, 0, 0], engRate: "0.00%" },
        { thumb: "🐾", col1: "The Joy of Cat Playtime: Understanding Feline Behavior", col2: "May 20, 2026 15:17", values: [1, 0, 0, 0, 0], engRate: "6.25%" },
      ],
    },
  },
  tiktok: {
    updatedAt: "Jun 27, 2026, 07:03 AM",
    updatedRelative: "2 hours ago",
    headerMetrics: [
      { value: "2", label: "Followers", color: "#000000", icon: <Users className="size-4 text-white" /> },
      { value: "1", label: "Following", color: "#737373", icon: <Users className="size-4 text-white" /> },
      { value: "20", label: "Videos", color: "#a855f7", icon: <Play className="size-4 text-white" /> },
      { value: "140", label: "Total Likes", color: "#ec4899", icon: <Heart className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "VIEWS", value: "3.0K", sub: "Total views", bg: "bg-blue-50", textColor: "text-blue-700" },
      { label: "LIKES", value: "140", sub: "Total likes", bg: "bg-rose-50", textColor: "text-rose-700" },
      { label: "COMMENTS", value: "4", sub: "Total comments", bg: "bg-violet-50", textColor: "text-violet-700" },
      { label: "SHARES", value: "2", sub: "Total shares", bg: "bg-emerald-50", textColor: "text-emerald-700" },
      { label: "ENGAGEMENT", value: "4.87%", sub: "Avg rate", bg: "bg-orange-50", textColor: "text-orange-700" },
      { label: "INTERACTIONS", value: "146", sub: "Total", bg: "bg-cyan-50", textColor: "text-cyan-700" },
    ],
    trends: {
      followers: [2, 2, 2, 2, 2],
      views: [384, 50, 5, 0, 0],
      viewsChange: "-99.2%",
      engagement: [0, 2, 4, 6, 7.69],
      engagementChange: "-100%",
      interactions: [28, 14, 7, 1, 0],
      interactionsChange: "-100%",
      bestTimes: [
        [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0],
        [0, 0, 0, 1], [0, 0, 0, 0], [0, 0, 0, 0],
      ],
    },
    table: {
      title: "Post Performance",
      count: "20 posts",
      columns: ["Post", "Video Description", "Date", "Views", "Likes", "Comments", "Shares", "Eng. Rate", "Duration", "Interactions", "Actions"],
      rows: [
        { thumb: "🐱", col1: "POV: you bought a tennis ball for fitness. Your cat filed a hostile takeover. 🐈‍⬛ Tiny panther. Big...", col2: "Jun 23, 2026 10:44", values: [459, 32, 0, 0, "6.97%", "-", 32], engRate: "6.97%" },
        { thumb: "❤️", col1: "❤️❤️❤️", col2: "May 23, 2026 19:29", values: [86, 18, 0, 0, "20.93%", "-", 18], engRate: "20.93%" },
        { thumb: "🐈", col1: "Cat Playing with Toy Observe the agility of this black cat as it jumps to catch a toy. The indoor se...", col2: "May 21, 2026 21:56", values: [93, 6, 1, 1, "8.60%", "-", 8], engRate: "8.60%" },
        { thumb: "🐾", col1: "The Joy of Cat Playtime: Understanding Feline Behavior Cat playtime is crucial for their overall wel...", col2: "May 20, 2026 21:47", values: [1, 0, 0, 0, "0.00%", "-", 0], engRate: "0.00%" },
        { thumb: "c", col1: "ctts", col2: "May 20, 2026 18:43", values: [1, 0, 0, 0, "0.00%", "-", 0], engRate: "0.00%" },
        { thumb: "🐾", col1: "The Joy of Cat Playtime: Understanding Feline Behavior Cat playtime is crucial for their overall wel...", col2: "May 20, 2026 15:17", values: [658, 6, 0, 1, "1.06%", "-", 7], engRate: "1.06%" },
        { thumb: "🐾", col1: "The Joy of Cat Playtime Cat playtime is essential for their physical and mental health. Cats need to...", col2: "May 20, 2026 09:06", values: [371, 7, 0, 0, "1.89%", "-", 7], engRate: "1.89%" },
      ],
    },
  },
  facebook: {
    updatedAt: "Jun 27, 2026, 09:01 AM",
    updatedRelative: "54 minutes ago",
    headerMetrics: [
      { value: "0", label: "Followers", color: "#1877F2", icon: <Users className="size-4 text-white" /> },
      { value: "16", label: "Posts", color: "#3b82f6", icon: <MessageCircle className="size-4 text-white" /> },
      { value: "221", label: "Total Views", color: "#0ea5e9", icon: <Eye className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "VIEWS", value: "221", sub: "Total views", bg: "bg-blue-50", textColor: "text-blue-700" },
      { label: "REACTIONS", value: "0", sub: "Total reactions", bg: "bg-rose-50", textColor: "text-rose-700" },
      { label: "COMMENTS", value: "0", sub: "Total comments", bg: "bg-violet-50", textColor: "text-violet-700" },
      { label: "SHARES", value: "0", sub: "Total shares", bg: "bg-emerald-50", textColor: "text-emerald-700" },
      { label: "CLICKS", value: "0", sub: "Total clicks", bg: "bg-cyan-50", textColor: "text-cyan-700" },
      { label: "ENGAGEMENT", value: "0.00%", sub: "Avg rate", bg: "bg-orange-50", textColor: "text-orange-700" },
    ],
    trends: {
      followers: [0, 0, 0, 0, 0],
      views: [0, 6, 12, 18, 23],
      engagement: [0, 0, 0, 0, 0],
      interactions: [0, 1, 2, 3, 4],
      bestTimes: [
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
      ],
    },
    table: {
      title: "Post Performance",
      count: "16 posts",
      columns: ["Post", "Content", "Date", "Views", "Reactions", "Comments", "Shares", "Clicks", "Eng. Rate", "Actions"],
      rows: [
        { thumb: "🐱", col1: "Your daily reminder that cats do not need a gym membership.", col2: "Jun 23, 2026 10:44", values: [7, 0, 0, 0, 0], engRate: "0.00%" },
        { thumb: "🐈", col1: "Cat Playing with Toy", col2: "May 21, 2026 21:56", values: [8, 0, 0, 0, 0], engRate: "0.00%" },
        { thumb: "🐾", col1: "The Joy of Cat Playtime: Understanding Feline Behavior", col2: "May 20, 2026 21:47", values: [11, 0, 0, 0, 0], engRate: "0.00%" },
        { thumb: "c", col1: "ctts", col2: "May 20, 2026 18:43", values: [9, 0, 0, 0, 0], engRate: "0.00%" },
        { thumb: "🐾", col1: "The Joy of Cat Playtime", col2: "May 20, 2026 09:06", values: [14, 0, 0, 0, 0], engRate: "0.00%" },
        { thumb: "🐱", col1: "caty (2)", col2: "May 19, 2026 23:17", values: [11, 0, 0, 0, 0], engRate: "0.00%" },
      ],
    },
  },
};

// Fallback data for accounts without specific config (LinkedIn, Instagram, Pinterest, Threads, Twitter)
const FALLBACK_DATA = (account: AccountSummary): NonNullable<typeof PER_ACCOUNT_DATA[keyof typeof PER_ACCOUNT_DATA]> => ({
  updatedAt: "Jun 27, 2026, 09:49 AM",
  updatedRelative: account.syncedAgo,
  headerMetrics: [
    { value: String(account.followers ?? 0), label: "Followers", color: "#3b82f6", icon: <Users className="size-4 text-white" /> },
    { value: String(account.posts ?? account.videos ?? 0), label: account.platform === "tiktok" || account.platform === "youtube" ? "Videos" : "Posts", color: "#a855f7", icon: <Play className="size-4 text-white" /> },
    { value: String(account.totalViews ?? 0), label: "Total Views", color: "#0ea5e9", icon: <Eye className="size-4 text-white" /> },
  ],
  metrics: [
    { label: "VIEWS", value: "0", sub: "Total views", bg: "bg-blue-50", textColor: "text-blue-700" },
    { label: "LIKES", value: "0", sub: "Total likes", bg: "bg-rose-50", textColor: "text-rose-700" },
    { label: "ENGAGEMENT", value: "0.00%", sub: "Avg rate", bg: "bg-orange-50", textColor: "text-orange-700" },
  ],
  trends: {
    followers: [0, 0, 0, 0, 0],
    views: [0, 0, 0, 0, 0],
    engagement: [0, 0, 0, 0, 0],
    interactions: [0, 0, 0, 0, 0],
    bestTimes: Array(7).fill([0, 0, 0, 0]),
  },
  table: {
    title: "Post Performance",
    count: "0 posts",
    columns: ["Post", "Content", "Date", "Views", "Likes", "Eng. Rate", "Actions"],
    rows: [],
  },
});

// ============================================================
// Per-account view
// ============================================================
function PerAccountView({ accountId }: { accountId: string }) {
  const [period, setPeriod] = useState<Period>("7d");
  const account = ACCOUNTS.find(a => a.id === accountId);
  const dates = ["Jun 23", "Jun 24", "Jun 25", "Jun 26", "Jun 27"];

  if (!account) {
    return (
      <div className="p-6">
        <p className="text-zinc-500">Account not found.</p>
      </div>
    );
  }
  const data = PER_ACCOUNT_DATA[account.platform] ?? FALLBACK_DATA(account);

  return (
    <div className="px-6 py-6 space-y-4">
      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-[30px] font-bold leading-[36px] text-zinc-900">Analytics</h1>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 h-8 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <RefreshCw className="size-3.5" />
            Sync Now
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <OverviewDropdown />
          <div className="flex items-center -space-x-2">
            {ACCOUNTS.slice(0, 8).map((a, i) => (
              <div
                key={i}
                className="size-9 sm:size-11 rounded-full ring-2 ring-white flex items-center justify-center text-sm font-semibold text-white overflow-hidden"
                style={{ background: a.platform === "instagram" ? "linear-gradient(135deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)" : "#a1a1aa" }}
              >
                {a.initials ?? a.name[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-zinc-500 -mt-3">Track your social media performance and insights</p>

      {/* ===== ACCOUNT HEADER CARD ===== */}
      <div className="rounded-xl border border-rose-300 border-l-4 bg-white p-4 flex flex-wrap items-center gap-4">
        <PlatformAvatar platform={account.platform} name={account.name} initials={account.initials} size={56} />
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900 truncate">{account.name}</h2>
          </div>
          <p className="text-[13px] text-zinc-500 truncate">{account.handle}{account.bio ? ` · ${account.bio}` : ""}</p>
        </div>
        <div className="flex items-center gap-6 sm:gap-8 shrink-0 flex-wrap justify-end">
          {data.headerMetrics.map((m, i) => (
            <div key={i} className="text-center min-w-[72px]">
              <div className="text-2xl font-bold text-zinc-900 whitespace-nowrap">{m.value}</div>
              <div className="text-[12px] text-zinc-500 inline-flex items-center gap-1 whitespace-nowrap">
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== LAST UPDATED + TIMEZONE ===== */}
      <div className="flex flex-wrap items-center justify-between text-[13px]">
        <div className="inline-flex items-center gap-1.5 text-zinc-500">
          <Calendar className="size-3.5" />
          Last updated: {data.updatedAt} <span className="text-zinc-400">({data.updatedRelative})</span>
        </div>
        <TimezoneDropdown />
      </div>

      {/* ===== METRIC CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {data.metrics.map((m, i) => (
          <div key={i} className={`${m.bg} rounded-xl p-4`}>
            <div className={`text-[11px] font-bold tracking-wide ${m.textColor} flex items-center gap-1.5`}>
              {m.label === "VIEWS" && <Eye className="size-3.5" />}
              {m.label === "LIKES" && <Heart className="size-3.5" />}
              {m.label === "REACTIONS" && <Heart className="size-3.5" />}
              {m.label === "COMMENTS" && <MessageCircle className="size-3.5" />}
              {m.label === "REPLIES" && <MessageCircle className="size-3.5" />}
              {m.label === "REPOSTS" && <Repeat2 className="size-3.5" />}
              {m.label === "QUOTES" && <MessageSquare className="size-3.5" />}
              {m.label === "BOOKMARKS" && <Bookmark className="size-3.5" />}
              {m.label === "SHARES" && <Share2 className="size-3.5" />}
              {m.label === "CLICKS" && <MousePointerClick className="size-3.5" />}
              {m.label === "ENGAGEMENT" && <TrendingUp className="size-3.5" />}
              {m.label === "INTERACTIONS" && <BarChart3 className="size-3.5" />}
              {m.label}
            </div>
            <div className="text-2xl font-bold text-zinc-900 mt-1">{m.value}</div>
            <div className={`text-[11px] ${m.textColor}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ===== TRENDS ===== */}
      <div className="rounded-xl border border-zinc-200/70 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5">
            <TrendingUp className="size-4" /> Trends
          </h3>
          <TimeFilter value={period} onChange={setPeriod} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Followers */}
          <div>
            <p className="text-[12px] text-zinc-500 mb-1">Followers</p>
            <MiniTrend data={data.trends.followers} color="#3b82f6" />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              {dates.map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
          {/* Views */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[12px] text-zinc-500">Views</p>
              {data.trends.viewsChange && (
                <span className="text-[11px] text-rose-600 font-medium">{data.trends.viewsChange}</span>
              )}
            </div>
            <MiniTrend data={data.trends.views} color="#a855f7" yMax={400} />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              {dates.map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
          {/* Engagement Rate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[12px] text-zinc-500">Engagement Rate</p>
              {data.trends.engagementChange && (
                <span className="text-[11px] text-rose-600 font-medium">{data.trends.engagementChange}</span>
              )}
            </div>
            <MiniTrend data={data.trends.engagement} color="#f97316" yMax={8} />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              {dates.map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
          {/* Interactions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[12px] text-zinc-500">Interactions</p>
              {data.trends.interactionsChange && (
                <span className="text-[11px] text-rose-600 font-medium">{data.trends.interactionsChange}</span>
              )}
            </div>
            <MiniTrend data={data.trends.interactions} color="#10b981" />
            <div className="flex items-center justify-center gap-3 mt-1 text-[10px]">
              <span className="text-orange-600">← Comments</span>
              <span className="text-rose-600">← Likes</span>
              <span className="text-emerald-600">← Shares</span>
            </div>
          </div>
          {/* Best Times */}
          <div>
            <p className="text-[12px] text-zinc-500 mb-2">Best Times</p>
            <BestTimesHeatmap data={data.trends.bestTimes} />
          </div>
        </div>
      </div>

      {/* ===== POST/VIDEO PERFORMANCE TABLE ===== */}
      <div className="rounded-xl border border-zinc-200/70 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900">{data.table.title}</h3>
          <div className="text-[12px] text-zinc-500 inline-flex items-center gap-1.5">
            <BarChart3 className="size-3.5" />
            {data.table.count}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[12px] font-medium text-zinc-500 border-b border-zinc-100 bg-zinc-50/40">
              <tr>
                {data.table.columns.map((c, i) => (
                  <th key={i} className={`px-3 py-2.5 ${i === 0 ? "w-12" : ""} ${i >= 3 ? "text-right" : "text-left"} whitespace-nowrap`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.table.rows.map((row, i) => (
                <tr key={i} className="hover:bg-zinc-50/50">
                  <td className="px-3 py-2">
                    <div className="size-10 rounded bg-gradient-to-br from-zinc-300 to-zinc-500 flex items-center justify-center text-white font-semibold text-sm">
                      {row.thumb}
                    </div>
                  </td>
                  <td className="px-3 py-2 max-w-xs">
                    <p className="text-zinc-900 line-clamp-2 text-[13px]">{row.col1}</p>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-zinc-500 whitespace-nowrap">{row.col2}</td>
                  {row.values.map((v, vi) => (
                    <td key={vi} className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                      {row.engRate && vi === row.values.length - (data.table.columns.length - 4) ? (
                        <span className="text-orange-600 font-medium">{row.engRate}</span>
                      ) : (
                        v
                      )}
                    </td>
                  ))}
                  {row.engRate && data.table.columns.includes("Eng. Rate") && (
                    <td className="px-3 py-2 text-right text-orange-600 font-medium tabular-nums whitespace-nowrap">
                      {row.engRate}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right">
                    <button type="button" className="text-zinc-400 hover:text-zinc-700">
                      <ChevronRight className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="h-1.5 bg-zinc-100">
          <div className="h-full bg-zinc-300" style={{ width: "40%" }} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Overview (All) view — keeps existing layout
// ============================================================
function OverviewView() {

  return (
    <div className="px-6 py-6 space-y-4">
      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-[30px] font-bold leading-[36px] text-zinc-900">Analytics</h1>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 h-8 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <RefreshCw className="size-3.5" />
            Sync Now
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <OverviewDropdown />
          <div className="flex items-center -space-x-2">
            {ACCOUNTS.slice(0, 8).map((a, i) => (
              <div
                key={i}
                className="size-9 sm:size-11 rounded-full ring-2 ring-white flex items-center justify-center text-sm font-semibold text-white overflow-hidden"
                style={{ background: a.platform === "instagram" ? "linear-gradient(135deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)" : "#a1a1aa" }}
              >
                {a.initials ?? a.name[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-zinc-500 -mt-3">Track your social media performance and insights</p>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Followers" value={20} icon={<Users className="size-4 text-blue-600" />} sparkData={[0, 0, 5, 12, 18, 20, 20]} color="#3b82f6" />
        <KpiCard label="Views" value={134} icon={<Eye className="size-4 text-violet-600" />} sparkData={[134, 110, 95, 60, 30, 15, 5]} color="#8b5cf6" />
        <KpiCard label="Engagement" value={7} icon={<ThumbsUp className="size-4 text-emerald-600" />} sparkData={[7, 5, 4, 3, 2, 1.5, 1]} color="#10b981" />
        <KpiCard label="Avg Eng. Rate" value="5.22%" icon={<BarChart3 className="size-4 text-orange-500" />} sparkData={[5.22, 5.0, 4.7, 4.3, 4.1, 3.9, 4.5]} color="#f97316" />
      </div>

      {/* ===== 2-COL: ACCOUNT TABLE + CHARTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_487px] gap-4">
        <div className="rounded-xl border border-zinc-200/70 bg-white overflow-hidden">
          <div className="grid grid-cols-[1fr_85px_63px_53px_84px_32px] text-[12px] font-medium text-zinc-500 border-b border-zinc-100">
            <div className="px-4 py-2.5">Account</div>
            <div className="px-3 py-2.5 text-right">Followers</div>
            <div className="px-3 py-2.5 text-right">Views</div>
            <div className="px-3 py-2.5 text-right">Eng.</div>
            <div className="px-3 py-2.5 text-right">Eng. Rate</div>
            <div className="px-1 py-2.5"></div>
          </div>
          <div className="divide-y divide-zinc-100">
            {ACCOUNTS.map((a, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_85px_63px_53px_84px_32px] items-center text-sm hover:bg-zinc-50/50"
              >
                <div className="px-4 py-2 flex items-center gap-2.5 min-w-0">
                  <AccountAvatar account={a} />
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 truncate text-[13px]">{a.name}</p>
                    <p className="text-[11px] text-zinc-400">Synced {a.syncedAgo}</p>
                  </div>
                </div>
                <div className="px-3 py-2 text-right text-zinc-700 tabular-nums">{a.followers ?? 0}</div>
                <div className="px-3 py-2 text-right text-zinc-700 tabular-nums">{a.totalViews ?? a.posts ?? 0}</div>
                <div className="px-3 py-2 text-right text-zinc-700 tabular-nums">{a.totalLikes ?? 0}</div>
                <div className="px-3 py-2 text-right text-zinc-700 tabular-nums">–</div>
                <div className="px-1 py-2 text-zinc-300">
                  <ChevronRight className="size-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200/70 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-zinc-900">Total Followers</h3>
              <span className="text-[11px] text-zinc-400">0 (0%)</span>
            </div>
            <LineChart
              series={[{ label: "Followers", color: "#3b82f6", data: [0, 0, 5, 12, 18, 20, 20] }]}
              dates={["Jun 23", "Jun 24", "Jun 25", "Jun 26", "Jun 27"]}
              yMax={25}
            />
          </div>
          <div className="rounded-xl border border-zinc-200/70 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-zinc-900">Daily Views &amp; Engagement</h3>
              <span className="text-[11px] text-zinc-400">538 total</span>
            </div>
            <LineChart
              series={[
                { label: "Views", color: "#8b5cf6", data: [397, 60, 14, 50, 17] },
                { label: "Engagement", color: "#10b981", data: [22, 6, 0, 1, 6] },
              ]}
              dates={["Jun 23", "Jun 24", "Jun 25", "Jun 26", "Jun 27"]}
              yMax={420}
            />
          </div>
        </div>
      </div>

      {/* ===== BOTTOM: PLATFORM BARS + TOP POSTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_487px] gap-4">
        <div className="rounded-xl border border-zinc-200/70 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900">Views by Platform</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              TikTok drove 85% of views
            </span>
          </div>
          <div className="space-y-2">
            {[
              { name: "TikTok", value: 85, color: "#2dd4bf" },
              { name: "Facebook", value: 8, color: "#3b82f6" },
              { name: "Threads", value: 5, color: "#000000" },
              { name: "X", value: 2, color: "#000000" },
            ].map(b => (
              <div key={b.name} className="flex items-center gap-2 text-[11px]" style={{ width: "100%" }}>
                <span className="w-14 text-zinc-700 font-medium">{b.name}</span>
                <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${b.value}%`, backgroundColor: b.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-400 px-16">
            <span>0</span><span>30</span><span>60</span><span>90</span><span>120</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/70 bg-white overflow-hidden">
          <div className="grid grid-cols-[1fr_60px_60px_60px] text-[12px] font-medium text-zinc-500 border-b border-zinc-100 bg-zinc-50/40">
            <div className="px-4 py-2.5">Top Posts</div>
            <div className="px-3 py-2.5 text-right">Views</div>
            <div className="px-3 py-2.5 text-right">Likes</div>
            <div className="px-3 py-2.5 text-right">Eng. Rate</div>
          </div>
          <div className="divide-y divide-zinc-100 max-h-[420px] overflow-y-auto">
            {[
              { id: 1, title: "POV: you bought a tennis ball for fitness. Your cat filed a…", date: "Jun 23, 2026", views: 459, likes: 32, engRate: "6.97%" },
              { id: 2, title: "The Joy of Cat Playtime: Understanding Feline Behavior Cat p…", date: "May 20, 2026", views: 658, likes: 6, engRate: "1.06%" },
              { id: 3, title: "The Joy of Cat Playtime Cat playtime is essential for their…", date: "May 20, 2026", views: 371, likes: 7, engRate: "1.89%" },
              { id: 4, title: "Cat Playing with Toy Observe the agility of this black cat…", date: "May 21, 2026", views: 8, likes: 0, engRate: "0%" },
              { id: 5, title: "ctts", date: "May 20, 2026", views: 9, likes: 0, engRate: "0%" },
              { id: 6, title: "The Joy of Cat Playtime: Understanding Feline Behavior Cat…", date: "May 20, 2026", views: 11, likes: 0, engRate: "0%" },
              { id: 7, title: "The Joy of Cat Playtime Cat playtime is essential for their…", date: "May 20, 2026", views: 14, likes: 0, engRate: "0%" },
              { id: 8, title: "A tennis ball entered the kitchen. The tiny panther chose vi…", date: "Jun 23, 2026", views: 4, likes: 0, engRate: "0%" },
              { id: 9, title: "Black Cat Chasing Monarch Butterfly in Garden Observe the p…", date: "May 19, 2026", views: 11, likes: 1, engRate: "9.09%" },
              { id: 10, title: "caty (2)", date: "May 19, 2026", views: 11, likes: 0, engRate: "0%" },
            ].map(p => (
              <div key={p.id} className="grid grid-cols-[1fr_60px_60px_60px] items-center text-sm hover:bg-zinc-50/50 cursor-pointer">
                <div className="px-4 py-2 flex items-start gap-2.5 min-w-0">
                  <span className="text-[11px] text-zinc-400 font-semibold tabular-nums mt-0.5 w-4 shrink-0">{p.id}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 line-clamp-1 text-[13px]">{p.title}</p>
                    <p className="text-[11px] text-zinc-400">{p.date}</p>
                  </div>
                </div>
                <div className="px-3 py-2 text-right text-zinc-700 tabular-nums">{p.views}</div>
                <div className="px-3 py-2 text-right text-zinc-700 tabular-nums">{p.likes}</div>
                <div className="px-3 py-2 text-right text-zinc-700 tabular-nums">{p.engRate}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, icon, sparkData, color,
}: {
  label: string; value: string | number; icon: React.ReactNode; sparkData: number[]; color: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {icon}
          <p className="text-[12px] font-medium text-zinc-500">{label}</p>
        </div>
        <p className="text-2xl font-bold text-zinc-900 leading-tight">{value}</p>
      </div>
      <Sparkline data={sparkData} color={color} width={80} height={36} />
    </div>
  );
}

// ============================================================
// Main page (with Suspense for useSearchParams)
// ============================================================
function AnalyticsPageInner() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") ?? undefined;
  return accountId ? <PerAccountView accountId={accountId} /> : <OverviewView />;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500">Loading…</div>}>
      <AnalyticsPageInner />
    </Suspense>
  );
}