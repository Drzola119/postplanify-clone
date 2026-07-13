"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Users, Eye, BarChart3, ChevronDown, ChevronRight, Calendar, RefreshCw,
  Heart, MessageCircle, Repeat2, Bookmark, Share2, MousePointerClick, MessageSquare, Play,
  TrendingUp, Globe, MoreHorizontal, CheckCircle2, Download,
} from "lucide-react";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import { toCsv, downloadCsv } from "@/lib/csv";

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
  listed?: number;
  monthlyViews?: number;
  pins?: number;
  isError?: boolean;
  errorMessage?: string;
  contentTypes?: { images: number; videos: number; text: number; imageViews?: number };
}

// ============================================================
// Accounts (9 connected — 8 unique platforms, 2 Bluesky)
// Fallback mock data used when API fails or user is unauthenticated
// ============================================================
const MOCK_ACCOUNTS: AccountSummary[] = [
  { id: "yt-zakaria", name: "Zakaria 11", handle: "@zakaria_119", platform: "youtube", initials: "Z",
    subscribers: 1, videos: 6, totalViews: 9, syncedAgo: "47m ago" },
  { id: "pin-nick", name: "nicklorance7", handle: "pinterest.com/nicklorance7", platform: "pinterest", initials: "N",
    followers: 0, monthlyViews: 0, pins: 14, syncedAgo: "42m ago" },
  { id: "fb-nicklife", name: "nick lorance life", handle: "Personal blog", platform: "facebook", initials: "N",
    bio: "Personal blog", followers: 0, posts: 1, totalViews: 0, syncedAgo: "14h ago" },
  { id: "th-nick", name: "Nick Lorance", handle: "@nicklorance7", platform: "threads", initials: "N",
    avatar: "https://scontent-dus1-1.cdninstagram.com/v/t51.82787-19/694687640_18106157872753132_4330973063129979937_n.jpg",
    followers: 2, following: 11, posts: 25, syncedAgo: "4h ago",
    contentTypes: { images: 100, videos: 0, text: 0, imageViews: 1 } },
  { id: "bs-nick", name: "Nick Lorance", handle: "@nicklorance7", platform: "bluesky", initials: "N",
    followers: 0, syncedAgo: "40m ago" },
  { id: "tt-nick", name: "nick_lorance", handle: "@nick_lorance", platform: "tiktok", initials: "n",
    followers: 3, following: 1, videos: 22, totalLikes: 183, syncedAgo: "3h ago" },
  { id: "li-nick", name: "LinkedIn Account", handle: "@nick-lorance", platform: "linkedin", initials: "N",
    syncedAgo: "—", isError: true,
    errorMessage: "LinkedIn analytics are not available for this account. Please reconnect with the required permissions." },
  { id: "x-nick", name: "nick lorance", handle: "@LoranceNic36048", platform: "twitter", initials: "N",
    followers: 0, following: 12, posts: 42, totalLikes: 0, listed: 0, syncedAgo: "2h ago" },
  { id: "bs-bsky", name: "nicklorance.bsky.social", handle: "@nicklorance.bsky.social", platform: "bluesky", initials: "🦋",
    avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:rxzikv2qahzbwx7kggut2fiq/bafkreibbjbshetcjzi6cionfd3f62wzbhtmad7raj43h3pd3753vothaxy",
    followers: 17, following: 33, posts: 26, syncedAgo: "41m ago" },
];

// Map upload-post.com platform key → our Platform type
function toPlatform(key: string): Platform {
  switch (key) {
    case "tiktok": return "tiktok";
    case "facebook": return "facebook";
    case "x": return "twitter";
    case "bluesky": return "bluesky";
    case "instagram": return "instagram";
    case "youtube": return "youtube";
    case "threads": return "threads";
    case "pinterest": return "pinterest";
    case "linkedin": return "linkedin";
    default: return "bluesky";
  }
}

// Convert upload-post.com ConnectedAccountDTO → AccountSummary
function adaptAccount(a: {
  id: string;
  profileUsername: string;
  platform: string;
  handle: string;
  displayName: string | null;
  img: string | null;
  reauthRequired: boolean;
}): AccountSummary {
  const platform = toPlatform(a.platform);
  return {
    id: a.id,
    name: a.displayName || a.handle,
    handle: a.handle.startsWith("@") ? a.handle : `@${a.handle}`,
    platform,
    initials: (a.displayName || a.handle)[0]?.toUpperCase() || "?",
    avatar: a.img || undefined,
    isError: platform === "linkedin" && a.reauthRequired,
    errorMessage: platform === "linkedin" && a.reauthRequired
      ? "LinkedIn analytics are not available for this account. Please reconnect with the required permissions."
      : undefined,
    syncedAgo: "just now",
    contentTypes: platform === "threads" ? { images: 100, videos: 0, text: 0, imageViews: 1 } : undefined,
  };
}

// Per-platform accent for header card border-l-4
const PLATFORM_ACCENT: Record<Platform, { color: string; leftClass: string }> = {
  youtube:    { color: "#FF0000", leftClass: "border-l-red-500" },
  instagram:  { color: "#E1306C", leftClass: "border-l-pink-500" },
  twitter:    { color: "#000000", leftClass: "border-l-zinc-900" },
  tiktok:     { color: "#000000", leftClass: "border-l-zinc-900" },
  facebook:   { color: "#1877F2", leftClass: "border-l-blue-600" },
  threads:    { color: "#000000", leftClass: "border-l-pink-500" },
  linkedin:   { color: "#0A66C2", leftClass: "border-l-blue-700" },
  pinterest:  { color: "#E60023", leftClass: "border-l-red-600" },
  bluesky:    { color: "#1185FE", leftClass: "border-l-sky-500" },
};

// ============================================================
// Platform avatar / icon
// ============================================================
function PlatformIcon({ platform, className = "" }: { platform: Platform; className?: string }) {
  const map: Record<Platform, { bg: string; letter: string }> = {
    youtube:   { bg: "#FF0000", letter: "▶" },
    instagram: { bg: "linear-gradient(135deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)", letter: "📷" },
    twitter:   { bg: "#000000", letter: "𝕏" },
    tiktok:    { bg: "#000000", letter: "♪" },
    facebook:  { bg: "#1877F2", letter: "f" },
    threads:   { bg: "#000000", letter: "@" },
    linkedin:  { bg: "#0A66C2", letter: "in" },
    pinterest: { bg: "#E60023", letter: "P" },
    bluesky:   { bg: "#1185FE", letter: "🦋" },
  };
  const info = map[platform];
  return (
    <span
      className={`inline-flex items-center justify-center size-4 rounded-md text-[10px] font-bold text-white shrink-0 ${className}`}
      style={{ background: info.bg }}
      aria-label={platform}
    >
      {info.letter}
    </span>
  );
}

function PlatformAvatar({ platform, name, initials, avatar, size = 56 }: { platform: Platform; name: string; initials?: string; avatar?: string; size?: number }) {
  const ringClass = {
    youtube: "ring-red-500/20", instagram: "ring-pink-500/20", twitter: "ring-zinc-500/30",
    tiktok: "ring-zinc-500/30", facebook: "ring-blue-500/20", threads: "ring-pink-500/20",
    linkedin: "ring-blue-500/20", pinterest: "ring-red-500/20", bluesky: "ring-sky-500/20",
  }[platform];

  return (
    <div
      className={`relative shrink-0 rounded-full ring-2 ${ringClass} shadow-md overflow-hidden bg-gradient-to-br from-zinc-300 to-zinc-500 flex items-center justify-center`}
      style={{ width: size, height: size }}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-semibold" style={{ fontSize: size * 0.4 }}>
          {initials ?? name[0]?.toUpperCase() ?? "?"}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Content Types donut (Threads/Instagram only)
// ============================================================
function ContentTypesDonut({ data }: { data: { images: number; videos: number; text: number; imageViews?: number } }) {
  const total = data.images + data.videos + data.text;
  if (total === 0) return null;
  const size = 80;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const segs = [
    { value: data.images, color: "#ec4899" },
    { value: data.videos, color: "#8b5cf6" },
    { value: data.text, color: "#06b6d4" },
  ];
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f4f4f5" strokeWidth={stroke} />
          {segs.map((s, i) => {
            if (s.value === 0) return null;
            const length = (s.value / total) * circumference;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return el;
          })}
        </svg>
      </div>
      <div className="space-y-1 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-pink-500" /> Images {data.images}%{data.imageViews !== undefined && <span className="text-zinc-400 ml-1">{data.imageViews} views</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-violet-500" /> Videos {data.videos}%
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-cyan-500" /> Text {data.text}%
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Trend mini chart with "Collecting data..." placeholder
// ============================================================
function MiniTrend({ data, color, yMax, change, collecting }: {
  data: number[]; color: string; yMax?: number; change?: string; collecting?: boolean;
}) {
  if (collecting || !data || data.length === 0 || data.every(v => v === 0)) {
    return (
      <div className="h-14 flex items-center justify-center text-[11px] text-zinc-400 italic">
        Collecting data...
      </div>
    );
  }
  const max = yMax ?? Math.max(...data, 1) * 1.1;
  const width = 180;
  const height = 56;
  const padding = { top: 4, right: 4, bottom: 4, left: 4 };
  const cw = width - padding.left - padding.right;
  const ch = height - padding.top - padding.bottom;
  const path = data.map((v, i) => {
    const x = padding.left + (i / (data.length - 1)) * cw;
    const y = padding.top + ch - (v / max) * ch;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");
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
// Metric card spec
// ============================================================
type MetricColor = "indigo" | "red" | "purple" | "orange" | "teal" | "blue" | "green" | "sky" | "amber" | "cyan" | "rose" | "violet" | "emerald" | "pink" | "fuchsia";
type MetricIcon = "eye" | "heart" | "message" | "reply" | "repost" | "quote" | "bookmark" | "share" | "click" | "trending" | "chart" | "play";

interface MetricCardSpec {
  label: string;
  value: string;
  sub: string;
  color: MetricColor;
  icon: MetricIcon;
}

const COLOR_CLASSES: Record<MetricColor, { bg: string; text: string; sub: string }> = {
  indigo:   { bg: "bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200",   text: "text-indigo-700",   sub: "text-indigo-600/70" },
  red:      { bg: "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200",             text: "text-red-700",      sub: "text-red-600/70" },
  rose:     { bg: "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200",          text: "text-rose-700",     sub: "text-rose-600/70" },
  purple:   { bg: "bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200",    text: "text-purple-700",   sub: "text-purple-600/70" },
  violet:   { bg: "bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-200",    text: "text-violet-700",   sub: "text-violet-600/70" },
  orange:   { bg: "bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200",    text: "text-orange-700",   sub: "text-orange-600/70" },
  teal:     { bg: "bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200",          text: "text-teal-700",     sub: "text-teal-600/70" },
  emerald:  { bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200",text: "text-emerald-700",  sub: "text-emerald-600/70" },
  green:    { bg: "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200",      text: "text-green-700",    sub: "text-green-600/70" },
  blue:     { bg: "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200",          text: "text-blue-700",     sub: "text-blue-600/70" },
  sky:      { bg: "bg-gradient-to-br from-sky-50 to-sky-100/50 border-sky-200",             text: "text-sky-700",      sub: "text-sky-600/70" },
  amber:    { bg: "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200",       text: "text-amber-700",    sub: "text-amber-600/70" },
  cyan:     { bg: "bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200",          text: "text-cyan-700",     sub: "text-cyan-600/70" },
  pink:     { bg: "bg-gradient-to-br from-pink-50 to-pink-100/50 border-pink-200",          text: "text-pink-700",     sub: "text-pink-600/70" },
  fuchsia:  { bg: "bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/50 border-fuchsia-200",text: "text-fuchsia-700",  sub: "text-fuchsia-600/70" },
};

function MetricCardIcon({ icon, className = "size-3.5" }: { icon: MetricIcon; className?: string }) {
  switch (icon) {
    case "eye": return <Eye className={className} />;
    case "heart": return <Heart className={className} />;
    case "message": return <MessageCircle className={className} />;
    case "reply": return <MessageCircle className={className} />;
    case "repost": return <Repeat2 className={className} />;
    case "quote": return <MessageSquare className={className} />;
    case "bookmark": return <Bookmark className={className} />;
    case "share": return <Share2 className={className} />;
    case "click": return <MousePointerClick className={className} />;
    case "trending": return <TrendingUp className={className} />;
    case "chart": return <BarChart3 className={className} />;
    case "play": return <Play className={className} />;
  }
}

function MetricCard({ spec }: { spec: MetricCardSpec }) {
  const c = COLOR_CLASSES[spec.color];
  return (
    <div className={`rounded-xl border ${c.bg} p-4`}>
      <div className={`text-[11px] font-bold tracking-wide ${c.text} flex items-center gap-1.5`}>
        <MetricCardIcon icon={spec.icon} />
        {spec.label}
      </div>
      <div className="text-2xl font-bold text-zinc-900 mt-1 tabular-nums">{spec.value}</div>
      <div className={`text-[11px] ${c.sub}`}>{spec.sub}</div>
    </div>
  );
}

// ============================================================
// Time filter pill group
// ============================================================
function TimeFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const options: { value: Period; label: string }[] = [
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
// Account avatar (avatar + small platform badge)
// ============================================================
function AccountAvatar({ account, size = 32 }: { account: AccountSummary; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 flex items-center justify-center text-zinc-700 font-semibold overflow-hidden"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {account.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={account.avatar} alt={account.name} className="w-full h-full object-cover" />
        ) : (
          account.initials ?? account.name[0]?.toUpperCase()
        )}
      </div>
      <span
        className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white flex items-center justify-center border border-zinc-200"
        style={{ width: size * 0.45, height: size * 0.45 }}
      >
        <PlatformIcon platform={account.platform} className="size-2.5" />
      </span>
    </div>
  );
}

// ============================================================
// Overview dropdown
// ============================================================
function OverviewDropdown({ currentId, accounts }: { currentId?: string; accounts: AccountSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const go = (accountId?: string) => {
    setOpen(false);
    if (accountId) router.push(`${pathname}?accountId=${accountId}`);
    else router.push(pathname);
  };
  return (
    <div className="relative">
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
          <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden max-h-[420px] overflow-y-auto">
            <button
              type="button"
              onClick={() => go(undefined)}
              className="block w-full text-left px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50"
            >
              <p className="text-xs text-zinc-500 mb-0.5">All accounts</p>
              <p className="text-sm font-semibold text-zinc-900">Overview (All)</p>
            </button>
            {accounts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => go(a.id)}
                className={`flex items-center gap-2.5 w-full px-4 py-2 hover:bg-zinc-50 text-left ${currentId === a.id ? "bg-zinc-50" : ""}`}
              >
                <AccountAvatar account={a} />
                <span className="text-[13px] text-zinc-700 truncate flex-1">{a.name}</span>
                {currentId === a.id && <CheckCircle2 className="size-3.5 text-zinc-900 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TimezoneDropdown() {
  const [open, setOpen] = useState(false);
  const [tz, setTz] = useState("Lagos (+01:00)");
  const options = ["UTC (+00:00)", "Lagos (+01:00)", "Cairo (+02:00)", "Paris (+01:00)", "New York (-05:00)", "Los Angeles (-08:00)"];
  return (
    <div className="relative">
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
// Avatar row (click switches account)
// ============================================================
function AvatarRow({ currentId, onSelect, accounts }: { currentId: string; onSelect: (id: string) => void; accounts: AccountSummary[] }) {
  return (
    <div className="flex items-center -space-x-2">
      {accounts.map((a) => {
        const isActive = currentId === a.id;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.id)}
            aria-label={a.name}
            aria-current={isActive ? "true" : undefined}
            className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-full transition-all duration-200 flex-shrink-0 ${
              isActive
                ? "ring-2 ring-zinc-900 ring-offset-2 ring-offset-white scale-110 z-10"
                : "opacity-50 hover:opacity-80"
            }`}
            style={{ padding: 0, border: "none", background: "transparent" }}
          >
            <AccountAvatar account={a} size={44} />
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// LinkedIn error state
// ============================================================
function AnalyticsErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-12 flex flex-col items-center justify-center text-center">
      <div className="size-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
        <TrendingUp className="size-7 text-pink-600" />
      </div>
      <h2 className="text-xl font-bold text-rose-700 mb-2">Unable to Load Analytics</h2>
      <p className="text-[13px] text-rose-700/80 max-w-md mb-6">{message}</p>
      <a
        href="/dashboard/accounts"
        className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 h-10 text-[13px] font-medium text-white hover:bg-zinc-800"
      >
        Go to Accounts
      </a>
    </div>
  );
}

// ============================================================
// Per-platform analytics config
// ============================================================
interface TrendSeries {
  data: number[];
  color: string;
  collecting?: boolean;
  change?: string;
}
interface PlatformAnalyticsConfig {
  headerMetrics: { value: string; label: string; color: string; icon: React.ReactNode }[];
  metrics: MetricCardSpec[];
  trends: { followers: TrendSeries; views: TrendSeries; engagement: TrendSeries; interactions: TrendSeries };
  table: {
    title: string;
    count: string;
    columns: string[];
    rows: { thumb?: string; col1: string; col2: string; values: (string | number)[]; engRate?: string }[];
  };
  banner?: string;
  updatedAt: string;
  updatedRelative: string;
}

const PLATFORM_ANALYTICS: Record<Platform, PlatformAnalyticsConfig> = {
  youtube: {
    updatedAt: "Jul 8, 2026, 02:56 PM",
    updatedRelative: "47 minutes ago",
    headerMetrics: [
      { value: "1", label: "Subscribers", color: "#ef4444", icon: <Users className="size-4 text-white" /> },
      { value: "6", label: "Videos", color: "#a855f7", icon: <Play className="size-4 text-white" /> },
      { value: "9", label: "Total Views", color: "#3b82f6", icon: <Eye className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "VIEWS", value: "0", sub: "Total views", color: "indigo", icon: "eye" },
      { label: "LIKES", value: "0", sub: "Total likes", color: "red", icon: "heart" },
      { label: "COMMENTS", value: "0", sub: "Total comments", color: "purple", icon: "message" },
      { label: "ENGAGEMENT", value: "0.00%", sub: "Avg rate", color: "orange", icon: "trending" },
      { label: "INTERACTIONS", value: "0", sub: "Total", color: "teal", icon: "chart" },
    ],
    trends: {
      followers: { data: [1, 1, 1, 1, 1], color: "#3b82f6" },
      views: { data: [0, 0, 0, 0, 0], color: "#8b5cf6", collecting: true },
      engagement: { data: [0, 0, 0, 0, 0], color: "#f97316", collecting: true },
      interactions: { data: [0, 0, 0, 0, 0], color: "#10b981", collecting: true },
    },
    table: {
      title: "Video Performance",
      count: "1 videos",
      columns: ["Video", "Title", "Date", "Views", "Likes", "Comments", "Eng. Rate", "Duration", "Interactions", "Actions"],
      rows: [
        { thumb: "🎬", col1: "hello guys", col2: "Jul 8, 2026\n14:55", values: ["0", "0", "0", "0.00%", "57s", "0"] },
      ],
    },
  },
  pinterest: {
    updatedAt: "Jul 8, 2026, 03:01 PM",
    updatedRelative: "42 minutes ago",
    headerMetrics: [
      { value: "0", label: "Followers", color: "#E60023", icon: <Users className="size-4 text-white" /> },
      { value: "0", label: "Monthly Views", color: "#3b82f6", icon: <Eye className="size-4 text-white" /> },
      { value: "14", label: "Pins", color: "#a855f7", icon: <Bookmark className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "IMPRESSIONS", value: "0", sub: "Total impressions", color: "indigo", icon: "eye" },
      { label: "SAVES", value: "0", sub: "Total saves", color: "red", icon: "heart" },
      { label: "PIN CLICKS", value: "0", sub: "Total pin clicks", color: "blue", icon: "click" },
      { label: "LINK CLICKS", value: "0", sub: "Total link clicks", color: "teal", icon: "click" },
      { label: "COMMENTS", value: "0", sub: "Total comments", color: "purple", icon: "message" },
      { label: "REACTIONS", value: "0", sub: "Total reactions", color: "pink", icon: "heart" },
    ],
    trends: {
      followers: { data: [0, 0, 0, 0, 0], color: "#3b82f6" },
      views: { data: [0, 0, 0, 0, 1.2], color: "#8b5cf6" },
      engagement: { data: [0, 0, 0, 0, 0], color: "#f97316", collecting: true },
      interactions: { data: [0, 0, 0, 0, 0], color: "#10b981" },
    },
    table: {
      title: "Pin Performance",
      count: "2 pins",
      columns: ["Pin", "Content", "Date", "Impressions", "Saves", "Pin Clicks", "Link Clicks", "Comments", "Reactions", "Eng. Rate", "Actions"],
      rows: [
        { thumb: "📌", col1: "hello guys tt", col2: "Jul 8, 2026\n14:56", values: ["0", "0", "0", "0", "0", "0", "0.00%"] },
        { thumb: "📌", col1: "hey", col2: "Jul 7, 2026\n19:52", values: ["0", "0", "0", "0", "0", "0", "0.00%"] },
      ],
    },
  },
  facebook: {
    updatedAt: "Jul 8, 2026, 01:07 AM",
    updatedRelative: "14 hours ago",
    headerMetrics: [
      { value: "0", label: "Followers", color: "#1877F2", icon: <Users className="size-4 text-white" /> },
      { value: "1", label: "Posts", color: "#3b82f6", icon: <MessageCircle className="size-4 text-white" /> },
      { value: "0", label: "Total Views", color: "#0ea5e9", icon: <Eye className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "VIEWS", value: "0", sub: "Total views", color: "indigo", icon: "eye" },
      { label: "REACTIONS", value: "0", sub: "Total reactions", color: "blue", icon: "heart" },
      { label: "COMMENTS", value: "0", sub: "Total comments", color: "purple", icon: "message" },
      { label: "SHARES", value: "0", sub: "Total shares", color: "green", icon: "share" },
      { label: "CLICKS", value: "0", sub: "Total clicks", color: "amber", icon: "click" },
      { label: "ENGAGEMENT", value: "0.00%", sub: "Avg rate", color: "orange", icon: "trending" },
    ],
    trends: {
      followers: { data: [0, 0, 0, 0, 0], color: "#3b82f6" },
      views: { data: [0, 0, 0, 0, 0], color: "#8b5cf6", collecting: true },
      engagement: { data: [0, 0, 0, 0, 0], color: "#f97316", collecting: true },
      interactions: { data: [0, 0, 0, 0, 0], color: "#10b981", collecting: true },
    },
    table: {
      title: "Post Performance",
      count: "1 posts",
      columns: ["Post", "Content", "Date", "Views", "Reactions", "Comments", "Shares", "Clicks", "Eng. Rate", "Actions"],
      rows: [
        { thumb: "📄", col1: "Ever catch a cat mid-lick and realize they still look more photogenic than you do on a good day?", col2: "Jul 7, 2026\n19:52", values: ["0", "0", "0", "0", "0", "0.00%"] },
      ],
    },
  },
  threads: {
    updatedAt: "Jul 8, 2026, 11:01 AM",
    updatedRelative: "4 hours ago",
    headerMetrics: [
      { value: "2", label: "Followers", color: "#ec4899", icon: <Users className="size-4 text-white" /> },
      { value: "11", label: "Following", color: "#a855f7", icon: <Users className="size-4 text-white" /> },
      { value: "25", label: "Posts", color: "#3b82f6", icon: <MessageCircle className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "VIEWS", value: "1", sub: "Total views", color: "indigo", icon: "eye" },
      { label: "REACH", value: "1", sub: "Total accounts", color: "blue", icon: "eye" },
      { label: "LIKES", value: "0", sub: "Total likes", color: "red", icon: "heart" },
      { label: "COMMENTS", value: "0", sub: "Total comments", color: "purple", icon: "message" },
      { label: "SHARES", value: "0", sub: "Total shares", color: "green", icon: "share" },
      { label: "ENGAGEMENT", value: "0.00%", sub: "Avg rate", color: "orange", icon: "trending" },
      { label: "SAVED", value: "0", sub: "Total saved", color: "teal", icon: "bookmark" },
    ],
    trends: {
      followers: { data: [0, 0, 0, 1, 2], color: "#3b82f6" },
      views: { data: [0, 0, 0, 0, 1], color: "#8b5cf6" },
      engagement: { data: [0, 0, 0, 0, 0], color: "#f97316", collecting: true },
      interactions: { data: [0, 0, 0, 0, 0], color: "#10b981" },
    },
    table: {
      title: "Post Performance",
      count: "1 posts",
      columns: ["Media", "Type", "Caption", "Date", "Views", "Reach", "Likes", "Comments", "Eng. Rate", "Saves", "Shares", "Replies", "Profile Visits", "Follows", "Watch Time", "Avg Watch", "Interactions", "Actions"],
      rows: [
        { thumb: "🖼️", col1: "Image", col2: "This is the exact face of \"I was not eating anything.\"", values: ["Jul 7, 2026\n19:53", "1", "1", "0", "0", "0.00%", "0", "0", "0", "0", "0", "-", "-", "0"], engRate: "0.00%" },
      ],
    },
  },
  bluesky: {
    updatedAt: "Jul 8, 2026, 03:02 PM",
    updatedRelative: "41 minutes ago",
    headerMetrics: [
      { value: "17", label: "Followers", color: "#1185FE", icon: <Users className="size-4 text-white" /> },
      { value: "33", label: "Following", color: "#a855f7", icon: <Users className="size-4 text-white" /> },
      { value: "26", label: "Posts", color: "#3b82f6", icon: <MessageCircle className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "LIKES", value: "1", sub: "Total likes", color: "red", icon: "heart" },
      { label: "REPOSTS", value: "0", sub: "Total reposts", color: "green", icon: "repost" },
      { label: "REPLIES", value: "0", sub: "Total replies", color: "blue", icon: "reply" },
      { label: "QUOTES", value: "0", sub: "Total quotes", color: "purple", icon: "quote" },
      { label: "BOOKMARKS", value: "0", sub: "Total bookmarks", color: "amber", icon: "bookmark" },
    ],
    trends: {
      followers: { data: [17, 17, 17, 17, 17], color: "#3b82f6" },
      views: { data: [0, 0, 0, 0, 0], color: "#8b5cf6", collecting: true },
      engagement: { data: [0, 0, 0, 0, 0], color: "#f97316", collecting: true },
      interactions: { data: [1, 0, 0, 0, 0], color: "#10b981", change: "-100%" },
    },
    table: {
      title: "Post Performance",
      count: "2 posts",
      columns: ["Post", "Content", "Date", "Likes", "Reposts", "Replies", "Quotes", "Bookmarks", "Eng. Rate", "Actions"],
      rows: [
        { thumb: "📝", col1: "The moment a soft hospital scene turns into panic is brutal.", col2: "Jul 8, 2026\n14:54", values: ["0", "0", "0", "0", "0", "0.00%"] },
        { thumb: "📝", col1: "POV: you smelled treats from three rooms away.", col2: "Jul 7, 2026\n19:52", values: ["1", "0", "0", "0", "0", "5.88%"] },
      ],
    },
  },
  tiktok: {
    updatedAt: "Jul 8, 2026, 12:36 PM",
    updatedRelative: "3 hours ago",
    headerMetrics: [
      { value: "3", label: "Followers", color: "#000000", icon: <Users className="size-4 text-white" /> },
      { value: "1", label: "Following", color: "#737373", icon: <Users className="size-4 text-white" /> },
      { value: "22", label: "Videos", color: "#a855f7", icon: <Play className="size-4 text-white" /> },
      { value: "183", label: "Total Likes", color: "#ec4899", icon: <Heart className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "VIEWS", value: "101", sub: "Total views", color: "indigo", icon: "eye" },
      { label: "LIKES", value: "32", sub: "Total likes", color: "red", icon: "heart" },
      { label: "COMMENTS", value: "0", sub: "Total comments", color: "purple", icon: "message" },
      { label: "SHARES", value: "0", sub: "Total shares", color: "green", icon: "share" },
      { label: "ENGAGEMENT", value: "31.68%", sub: "Avg rate", color: "orange", icon: "trending" },
      { label: "INTERACTIONS", value: "32", sub: "Total", color: "teal", icon: "chart" },
    ],
    trends: {
      followers: { data: [3, 3, 3, 3, 3], color: "#3b82f6" },
      views: { data: [2.7, 3.4, 17, 101, 0], color: "#8b5cf6", change: "-100%" },
      engagement: { data: [0, 0.7, 1.5, 15.9, 31.68], color: "#f97316", change: "-99.7%" },
      interactions: { data: [0, 0, 1, 32, 0], color: "#10b981", change: "-95.7%" },
    },
    table: {
      title: "Post Performance",
      count: "1 posts",
      columns: ["Video", "Description", "Date", "Views", "Likes", "Comments", "Shares", "Eng. Rate", "Duration", "Interactions", "Actions"],
      rows: [
        { thumb: "🎬", col1: "This cat said: \"No crumbs left behind.\" The tongue. The stare. The suspiciously innocent energy. If ...", col2: "Jul 7, 2026\n19:52", values: ["101", "32", "0", "0", "31.68%", "-", "32"], engRate: "31.68%" },
      ],
    },
  },
  linkedin: {
    updatedAt: "—",
    updatedRelative: "—",
    headerMetrics: [],
    metrics: [],
    trends: {
      followers: { data: [], color: "#0A66C2" },
      views: { data: [], color: "#0A66C2" },
      engagement: { data: [], color: "#0A66C2" },
      interactions: { data: [], color: "#0A66C2" },
    },
    table: { title: "", count: "", columns: [], rows: [] },
  },
  twitter: {
    updatedAt: "Jul 8, 2026, 01:24 PM",
    updatedRelative: "2 hours ago",
    headerMetrics: [
      { value: "0", label: "Followers", color: "#000000", icon: <Users className="size-4 text-white" /> },
      { value: "12", label: "Following", color: "#737373", icon: <Users className="size-4 text-white" /> },
      { value: "42", label: "Posts", color: "#3b82f6", icon: <MessageCircle className="size-4 text-white" /> },
      { value: "0", label: "Likes", color: "#ef4444", icon: <Heart className="size-4 text-white" /> },
      { value: "0", label: "Listed", color: "#a855f7", icon: <Bookmark className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "IMPRESSIONS", value: "1", sub: "Total views", color: "indigo", icon: "eye" },
      { label: "LIKES", value: "0", sub: "Total favorites", color: "red", icon: "heart" },
      { label: "REPOSTS", value: "0", sub: "Retweets", color: "green", icon: "repost" },
      { label: "REPLIES", value: "0", sub: "Total replies", color: "purple", icon: "message" },
      { label: "ENGAGEMENT", value: "0.00%", sub: "Avg rate", color: "orange", icon: "trending" },
      { label: "BOOKMARKS", value: "0", sub: "Saved posts", color: "teal", icon: "bookmark" },
    ],
    banner: "Showing posts published via PostPlanify only",
    trends: {
      followers: { data: [0, 0, 0, 0, 0], color: "#3b82f6" },
      views: { data: [0, 0, 0, 1, 0], color: "#8b5cf6" },
      engagement: { data: [0, 0, 0, 0, 0], color: "#f97316", collecting: true },
      interactions: { data: [0, 0, 0, 0, 0], color: "#10b981" },
    },
    table: {
      title: "Post Performance",
      count: "1 posts",
      columns: ["", "Media", "Content", "Date", "Views", "Likes", "Replies", "Reposts", "Eng. Rate", "Actions"],
      rows: [
        { thumb: "🐦", col1: "✓", col2: "That face when the treat bag makes a noise in another zip code.", values: ["Jul 7, 2026\n19:52", "1", "0", "0", "0", "0.00%"] },
      ],
    },
  },
  instagram: {
    updatedAt: "Jul 8, 2026, 03:02 PM",
    updatedRelative: "41 minutes ago",
    headerMetrics: [
      { value: "17", label: "Followers", color: "#E1306C", icon: <Users className="size-4 text-white" /> },
      { value: "33", label: "Following", color: "#a855f7", icon: <Users className="size-4 text-white" /> },
      { value: "26", label: "Posts", color: "#3b82f6", icon: <MessageCircle className="size-4 text-white" /> },
    ],
    metrics: [
      { label: "LIKES", value: "1", sub: "Total likes", color: "red", icon: "heart" },
      { label: "REPOSTS", value: "0", sub: "Total reposts", color: "green", icon: "repost" },
      { label: "REPLIES", value: "0", sub: "Total replies", color: "blue", icon: "reply" },
      { label: "QUOTES", value: "0", sub: "Total quotes", color: "purple", icon: "quote" },
      { label: "BOOKMARKS", value: "0", sub: "Total bookmarks", color: "amber", icon: "bookmark" },
    ],
    trends: {
      followers: { data: [17, 17, 17, 17, 17], color: "#3b82f6" },
      views: { data: [0, 0, 0, 0, 0], color: "#8b5cf6", collecting: true },
      engagement: { data: [0, 0, 0, 0, 0], color: "#f97316", collecting: true },
      interactions: { data: [1, 0, 0, 0, 0], color: "#10b981", change: "-100%" },
    },
    table: {
      title: "Post Performance",
      count: "2 posts",
      columns: ["Post", "Content", "Date", "Likes", "Reposts", "Replies", "Quotes", "Bookmarks", "Eng. Rate", "Actions"],
      rows: [
        { thumb: "📝", col1: "The moment a soft hospital scene turns into panic is brutal.", col2: "Jul 8, 2026\n14:54", values: ["0", "0", "0", "0", "0", "0.00%"] },
        { thumb: "📝", col1: "POV: you smelled treats from three rooms away.", col2: "Jul 7, 2026\n19:52", values: ["1", "0", "0", "0", "0", "5.88%"] },
      ],
    },
  },
};

// ============================================================
// Per-account view
// ============================================================
function PerAccountView({ accountId, accounts }: { accountId: string; accounts: AccountSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [period, setPeriod] = useState<Period>("7d");

  const handleExport = () => {
    const csv = toCsv(
      accounts.map((a) => ({
        id: a.id,
        name: a.name,
        handle: a.handle,
        platform: a.platform,
        followers: a.followers ?? 0,
        views: a.views ?? 0,
        engagement: a.engagement ?? 0,
        engRate: a.engRate ?? "",
        syncedAgo: a.syncedAgo,
      }))
    );
    downloadCsv(`analytics-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };
  const account = accounts.find(a => a.id === accountId);

  if (!account) {
    return (
      <div className="p-6">
        <p className="text-zinc-500">Account not found.</p>
      </div>
    );
  }

  const data = PLATFORM_ANALYTICS[account.platform];
  const dates = ["Jul 7", "Jul 7", "Jul 7", "Jul 8", "Jul 8"];
  const accent = PLATFORM_ACCENT[account.platform];

  if (account.isError) {
    return (
      <div className="px-6 py-6 space-y-4">
        <PageHeader
          currentId={accountId}
          onSelect={(id) => router.push(`${pathname}?accountId=${id}`)}
          accounts={accounts}
        />
        <AnalyticsErrorState message={account.errorMessage || "Analytics are not available for this account."} />
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-4">
      <PageHeader
        currentId={accountId}
        onSelect={(id) => router.push(`${pathname}?accountId=${id}`)}
        accounts={accounts}
        rightExtra={
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 h-8 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        }
      />

      {/* ===== ACCOUNT HEADER CARD ===== */}
      <div className={`rounded-xl border border-zinc-200 bg-white border-l-4 ${accent.leftClass} shadow-sm p-4 md:p-5`}>
        <div className="flex flex-col md:flex-row md:justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <div className="flex items-start gap-3">
              <PlatformAvatar
                platform={account.platform}
                name={account.name}
                initials={account.initials}
                avatar={account.avatar}
                size={48}
              />
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-zinc-900 truncate">{account.name}</h3>
                <p className="text-sm text-zinc-500 truncate">{account.handle}{account.bio ? ` · ${account.bio}` : ""}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-around gap-4 md:gap-6 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-4 md:gap-6 flex-wrap justify-end">
              {data.headerMetrics.map((m, i) => (
                <div key={i} className="text-center min-w-[60px]">
                  <div className="text-2xl font-bold text-zinc-900 whitespace-nowrap tabular-nums">{m.value}</div>
                  <div className="text-xs text-zinc-500 inline-flex items-center gap-1 whitespace-nowrap">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
            {(account.platform === "threads" || account.platform === "instagram") && account.contentTypes ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-700">Content Types</p>
                <ContentTypesDonut data={account.contentTypes} />
              </div>
            ) : null}
          </div>
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

      {/* ===== BANNER (X only) ===== */}
      {data.banner ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          <span className="size-1.5 mt-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>{data.banner}</span>
        </div>
      ) : null}

      {/* ===== METRIC CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {data.metrics.map((m, i) => (
          <MetricCard key={i} spec={m} />
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-[12px] text-zinc-500 mb-1">Followers</p>
            <MiniTrend data={data.trends.followers.data} color={data.trends.followers.color} collecting={data.trends.followers.collecting} />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              {dates.map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[12px] text-zinc-500">Views</p>
              {data.trends.views.change && <span className="text-[11px] text-rose-600 font-medium">{data.trends.views.change}</span>}
            </div>
            <MiniTrend data={data.trends.views.data} color={data.trends.views.color} collecting={data.trends.views.collecting} />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              {dates.map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[12px] text-zinc-500">Engagement Rate</p>
              {data.trends.engagement.change && <span className="text-[11px] text-rose-600 font-medium">{data.trends.engagement.change}</span>}
            </div>
            <MiniTrend data={data.trends.engagement.data} color={data.trends.engagement.color} collecting={data.trends.engagement.collecting} />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              {dates.map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[12px] text-zinc-500">Interactions</p>
              {data.trends.interactions.change && <span className="text-[11px] text-rose-600 font-medium">{data.trends.interactions.change}</span>}
            </div>
            <MiniTrend data={data.trends.interactions.data} color={data.trends.interactions.color} collecting={data.trends.interactions.collecting} />
            <div className="flex items-center justify-center gap-3 mt-1 text-[10px]">
              <span className="text-orange-600">← Comments</span>
              <span className="text-rose-600">← Likes</span>
              <span className="text-emerald-600">← Shares</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PERFORMANCE TABLE ===== */}
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
                      {vi === row.values.length - 1 && data.table.columns.includes("Eng. Rate") ? (
                        <span className="text-orange-600 font-medium">{v}</span>
                      ) : (
                        v
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <button type="button" className="text-zinc-400 hover:text-zinc-700" aria-label="Row actions">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Page header
// ============================================================
function PageHeader({
  currentId,
  onSelect,
  accounts,
  rightExtra,
}: {
  currentId: string;
  onSelect: (id: string) => void;
  accounts: AccountSummary[];
  rightExtra?: React.ReactNode;
}) {
  return (
    <>
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
          {rightExtra}
          <OverviewDropdown currentId={currentId} accounts={accounts} />
          <AvatarRow currentId={currentId} onSelect={onSelect} accounts={accounts} />
        </div>
      </div>
      <p className="text-sm text-zinc-500 -mt-3">Track your social media performance and insights</p>
    </>
  );
}

// ============================================================
// Overview (All) view
// ============================================================
function OverviewView({ accounts }: { accounts: AccountSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="px-6 py-6 space-y-4">
      <PageHeader
        currentId=""
        onSelect={(id) => router.push(`${pathname}?accountId=${id}`)}
        accounts={accounts}
      />
      <div className="rounded-xl border border-zinc-200/70 bg-white p-6 text-center text-zinc-500 text-sm">
        Switch to a specific account using the avatar row above to view per-platform analytics.
      </div>
    </div>
  );
}

// ============================================================
// Main page (with Suspense for useSearchParams)
// ============================================================
function AnalyticsPageInner() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") ?? undefined;
  const [accounts, setAccounts] = useState<AccountSummary[]>(MOCK_ACCOUNTS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/social-accounts/list", {
          cache: "no-store",
          headers: getOverrideHeaders(),
        });
        if (!res.ok) return;
        const data: { ok: boolean; accounts?: Parameters<typeof adaptAccount>[0][] } = await res.json();
        if (cancelled || !data?.ok || !data.accounts) return;
        const adapted = data.accounts.map(adaptAccount);
        if (adapted.length > 0) setAccounts(adapted);
      } catch {
        // API unavailable (e.g. unauthenticated or network error) — keep MOCK_ACCOUNTS
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return accountId ? <PerAccountView accountId={accountId} accounts={accounts} /> : <OverviewView accounts={accounts} />;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500">Loading…</div>}>
      <AnalyticsPageInner />
    </Suspense>
  );
}