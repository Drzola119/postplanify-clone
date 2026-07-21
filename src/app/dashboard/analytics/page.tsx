"use client";

import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users, Eye, BarChart3, ChevronDown, ChevronRight, Calendar, RefreshCw,
  Heart, MessageCircle, Repeat2, Bookmark, Share2, MousePointerClick, MessageSquare, Play,
  TrendingUp, Globe, MoreHorizontal, CheckCircle2, Download,
} from "lucide-react";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import { toCsv, downloadCsv } from "@/lib/csv";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { toInternalPlatform } from "@/lib/platforms";

// ============================================================
// Types
// ============================================================
type Period = "7d" | "14d" | "30d" | "90d" | "custom";

type Platform =
  | "youtube" | "instagram" | "twitter" | "tiktok"
  | "facebook" | "threads" | "linkedin" | "pinterest" | "bluesky";



type AnalyticsStatus = "ok" | "error" | "token_expired" | "not_connected" | "unsupported" | "unknown";

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
  analyticsStatus?: AnalyticsStatus;
}

// Map upload-post.com platform key → our Platform type
function toPlatform(key: string): Platform {
  const p = toInternalPlatform(key);
  if (p in PLATFORM_ACCENT) return p as Platform;
  return "bluesky";
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
function PlatformIcon({ platform, className = "" }: { platform: Platform; className?: string }) {  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <PlatformAvatar
        platform={{ id: platform, name: platform.charAt(0).toUpperCase() + platform.slice(1), handle: "", avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }}
        size={16}
        rounded="sm"
      />
    </span>
  );
}

// ============================================================
// Status badge for honest platform states
// ============================================================
function StatusBadge({ status, errorMessage }: { status: AnalyticsStatus; errorMessage?: string | null }) {
  const t = useTranslations("dashboard");
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        <CheckCircle2 className="size-3" /> {t("analytics.status_ok")}
      </span>
    );
  }
  if (status === "unsupported") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
        {t("analytics.status_unsupported")}
      </span>
    );
  }
  if (status === "not_connected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
        {t("analytics.status_not_connected")}
      </span>
    );
  }
  if (status === "token_expired") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
        {t("analytics.reconnect_platform")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700" title={errorMessage ?? undefined}>
      {t("analytics.status_unavailable")}
    </span>
  );
}

// ============================================================
// Content Types donut (Threads/Instagram only)
// ============================================================
function ContentTypesDonut({ data }: { data: { images: number; videos: number; text: number; imageViews?: number } }) {
  const t = useTranslations("dashboard");
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
          <span className="size-2 rounded-full bg-pink-500" /> {t("analytics.images_pct", { n: data.images })}{data.imageViews !== undefined && <span className="text-zinc-400 ml-1">{data.imageViews} {t("analytics.views_label")}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-violet-500" /> {t("analytics.videos_pct", { n: data.videos })}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-cyan-500" /> {t("analytics.text_pct", { n: data.text })}
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
  const t = useTranslations("dashboard");
  if (collecting || !data || data.length === 0 || data.every(v => v === 0)) {
    return (
      <div className="h-14 flex items-center justify-center text-[11px] text-zinc-400 italic">
        {t("analytics.collecting_data")}
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

function periodToRange(p: Period): { from: Date; to: Date } {
  const to = new Date();
  const days = p === "7d" ? 7 : p === "14d" ? 14 : p === "30d" ? 30 : 90;
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to };
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
      <span className="absolute -bottom-0.5 -right-0.5">
        <PlatformAvatar
          platform={{ id: account.platform, name: account.platform.charAt(0).toUpperCase() + account.platform.slice(1), handle: "", avatar: null, charLimit: 0, borderClass: "", textClass: "", icon: "" }}
          size={size * 0.45 >= 16 ? Math.round(size * 0.45) : 16}
          rounded="full"
        />
      </span>
    </div>
  );
}

// ============================================================
// Overview dropdown
// ============================================================
function OverviewDropdown({ currentId, accounts }: { currentId?: string; accounts: AccountSummary[] }) {
  const t = useTranslations("dashboard");
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
        {t("analytics.overview_all")}
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
              <p className="text-xs text-zinc-500 mb-0.5">{t("analytics.all_accounts")}</p>
              <p className="text-sm font-semibold text-zinc-900">{t("analytics.overview_all")}</p>
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
  const [tz, setTz] = useState("UTC");
  const options = ["UTC", "Africa/Lagos", "Africa/Cairo", "Europe/Paris", "America/New_York", "America/Los_Angeles"];

  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
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
  const t = useTranslations("dashboard");
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-12 flex flex-col items-center justify-center text-center">
      <div className="size-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
        <TrendingUp className="size-7 text-pink-600" />
      </div>
      <h2 className="text-xl font-bold text-rose-700 mb-2">{t("analytics.unable_load")}</h2>
      <p className="text-[13px] text-rose-700/80 max-w-md mb-6">{message}</p>
      <a
        href="/dashboard/accounts"
        className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 h-10 text-[13px] font-medium text-white hover:bg-zinc-800"
      >
        {t("analytics.go_accounts")}
      </a>
    </div>
  );
}



// ============================================================
// Per-account view
// ============================================================
interface PerAccountAnalytics {
  accountId: string;
  platform: Platform;
  from: string;
  to: string;
  status?: AnalyticsStatus;
  errorMessage?: string | null;
  lastSyncedAt?: string | null;
  totals: {
    followers: number | null;
    impressions: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    saves: number | null;
    clicks: number | null;
    engagementRate: number | null;
    postsPublished: number;
  };
  series: { date: string; followers: number; engagementRate: number; impressions: number; likes: number; comments: number; shares: number; clicks: number }[];
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Format an optional number, returning an em-dash when unavailable. */
function fmtOpt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return fmt(n);
}

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = now - then;
  if (diffMs < 1000) return "just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function PerAccountView({ accountId, accounts }: { accountId: string; accounts: AccountSummary[] }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const [period, setPeriod] = useState<Period>("7d");
  const [exporting, setExporting] = useState(false);
  const [analytics, setAnalytics] = useState<PerAccountAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchNonce, setFetchNonce] = useState(0);
  const [publishedPosts, setPublishedPosts] = useState<{ id: string; caption: string; publishedAt: string | null; platforms: string[] }[] | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, { status?: string; likes: number | null; comments: number | null; shares: number | null; impressions: number | null }>>({});

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = periodToRange(period);
      const url = `/api/analytics/account/${encodeURIComponent(accountId)}?from=${encodeURIComponent(range.from.toISOString())}&to=${encodeURIComponent(range.to.toISOString())}`;
      const res = await fetch(url, { cache: "no-store", headers: getOverrideHeaders() });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        setError(body || `Analytics request failed (${res.status})`);
        setAnalytics(null);
        return;
      }
      const data = await res.json();
      setAnalytics(data.analytics as PerAccountAnalytics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, fetchNonce]);

  // Fetch published posts + live per-post analytics.
  useEffect(() => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;
    let cancelled = false;
    (async () => {
      try {
        const range = periodToRange(period);
        const from = encodeURIComponent(range.from.toISOString());
        const to = encodeURIComponent(range.to.toISOString());
        const platform = encodeURIComponent(account.platform);
        const res = await fetch(
          `/api/posts/published?from=${from}&to=${to}&platform=${platform}`,
          { cache: "no-store", headers: getOverrideHeaders() }
        );
        if (!cancelled && res.ok) {
          const data = await res.json();
          const posts = (data.posts as typeof publishedPosts) ?? [];
          setPublishedPosts(posts);
          // Fetch live per-post analytics.
          if (posts.length > 0) {
            const postIds = posts.map((p: { id: string }) => p.id).join(",");
            const lmRes = await fetch(`/api/posts/live-metrics?postIds=${postIds}`, {
              cache: "no-store", headers: getOverrideHeaders(),
            });
            if (!cancelled && lmRes.ok) {
              const lmData = await lmRes.json();
              const metricsMap: Record<string, typeof liveMetrics[string]> = {};
              for (const m of lmData.metrics ?? []) {
                metricsMap[m.postId] = { status: m.status, likes: m.likes, comments: m.comments, shares: m.shares, impressions: m.impressions };
              }
              if (!cancelled) setLiveMetrics(metricsMap);
            }
          }
        }
      } catch {
        // silent
      }
    })();
    return () => { cancelled = true; };
  }, [period, accountId, accounts, fetchNonce]);

  const handleAnalyticsExport = async () => {
    setExporting(true);
    try {
      const range = periodToRange(period);
      const url = `/api/analytics/export?from=${encodeURIComponent(range.from.toISOString())}&to=${encodeURIComponent(range.to.toISOString())}`;
      const res = await fetch(url, { credentials: "include", headers: getOverrideHeaders() });
      if (!res.ok) {
        window.alert(`Export failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `analytics_${range.from.toISOString().slice(0, 10)}_${range.to.toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.alert("Export failed");
    } finally {
      setExporting(false);
    }
  };

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
        <p className="text-zinc-500">{t("analytics.account_not_found")}</p>
      </div>
    );
  }

  const accent = PLATFORM_ACCENT[account.platform];
  const range = periodToRange(period);
  const dayCount = Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000)));
  const tickDates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const t = new Date(range.to.getTime() - ((4 - i) * (range.to.getTime() - range.from.getTime())) / 4);
    tickDates.push(fmtDateShort(t.toISOString()));
  }

  // Build the per-platform header / metrics / trend shape from the API response.
  const totals = analytics?.totals;
  const series = analytics?.series ?? [];
  const followersSeries = series.map((p) => p.followers);
  const viewsSeries = series.map((p) => p.impressions);
  const engagementSeries = series.map((p) => p.engagementRate);
  const interactionsSeries = series.map((p) => p.likes + p.comments + p.shares + p.clicks);

  const isUnsupported = analytics?.status === "unsupported";
  const isReconnect = analytics?.status === "token_expired";
  const isNotConnected = analytics?.status === "not_connected";
  const hasData =
    totals &&
    (totals.followers !== null ||
      totals.impressions !== null ||
      totals.likes !== null ||
      totals.comments !== null ||
      totals.shares !== null);

  const isCollecting = !analytics || series.length < dayCount;

  const data = {
    headerMetrics: totals
      ? [
          { value: fmtOpt(totals.followers), label: t("analytics.followers_label"), color: accent.color, icon: <Users className="size-4 text-white" /> },
          { value: fmt(totals.postsPublished), label: t("analytics.posts_label"), color: "#3b82f6", icon: <MessageCircle className="size-4 text-white" /> },
          { value: fmtOpt(totals.impressions), label: t("analytics.impressions_label"), color: "#a855f7", icon: <Eye className="size-4 text-white" /> },
        ]
      : [],
    metrics: totals
      ? [
          { label: t("analytics.views"), value: fmtOpt(totals.impressions), sub: t("analytics.views_sub"), color: "indigo" as MetricColor, icon: "eye" as MetricIcon },
          { label: t("analytics.likes"), value: fmtOpt(totals.likes), sub: t("analytics.likes_sub2"), color: "red" as MetricColor, icon: "heart" as MetricIcon },
          { label: t("analytics.comments"), value: fmtOpt(totals.comments), sub: t("analytics.comments_sub2"), color: "purple" as MetricColor, icon: "message" as MetricIcon },
          { label: t("analytics.shares"), value: fmtOpt(totals.shares), sub: t("analytics.shares_sub2"), color: "green" as MetricColor, icon: "share" as MetricIcon },
          { label: t("analytics.clicks"), value: fmtOpt(totals.clicks), sub: t("analytics.clicks_sub2"), color: "amber" as MetricColor, icon: "click" as MetricIcon },
          { label: t("analytics.engagement"), value: totals.engagementRate != null ? fmtPct(totals.engagementRate) : "—", sub: t("analytics.engagement_sub2"), color: "orange" as MetricColor, icon: "trending" as MetricIcon },
        ]
      : [],
    trends: {
      followers: { data: followersSeries, color: "#3b82f6", collecting: isCollecting },
      views: { data: viewsSeries, color: "#8b5cf6", collecting: isCollecting },
      engagement: { data: engagementSeries, color: "#f97316", collecting: isCollecting },
      interactions: { data: interactionsSeries, color: "#10b981", collecting: isCollecting },
    },
  };

  if (account.isError || isReconnect) {
    return (
      <div className="px-6 py-6 space-y-4">
        <PageHeader
          currentId={accountId}
          onSelect={(id) => router.push(`${pathname}?accountId=${id}`)}
          accounts={accounts}
          onSync={() => setFetchNonce((n) => n + 1)}
        />
        <AnalyticsErrorState message={account.errorMessage || analytics?.errorMessage || "Reconnect this platform to restore analytics."} />
      </div>
    );
  }

  if (isUnsupported) {
    return (
      <div className="px-6 py-6 space-y-4">
        <PageHeader
          currentId={accountId}
          onSelect={(id) => router.push(`${pathname}?accountId=${id}`)}
          accounts={accounts}
          onSync={() => setFetchNonce((n) => n + 1)}
        />
        <div className="rounded-xl border border-zinc-200 bg-white p-12 flex flex-col items-center justify-center text-center">
          <div className="size-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <TrendingUp className="size-7 text-zinc-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">{t("analytics.unsupported_title")}</h2>
          <p className="text-[13px] text-zinc-500 max-w-md mb-6">{t("analytics.unsupported_sub")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-4">
      <PageHeader
        currentId={accountId}
        onSelect={(id) => router.push(`${pathname}?accountId=${id}`)}
        accounts={accounts}
        syncing={loading}
        onSync={() => setFetchNonce((n) => n + 1)}
        rightExtra={
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 h-8 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Download className="size-3.5" />
            {t("analytics.export_csv")}
          </button>
        }
      />

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-900">
          <span className="size-1.5 mt-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{t("analytics.load_error", { error })}</span>
        </div>
      ) : null}

      {isNotConnected && !error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          {t("analytics.not_connected_sub")}
        </div>
      ) : null}

      {!hasData && !error && !isNotConnected ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 text-sm">
          <p className="font-medium text-zinc-700 mb-1">{t("analytics.no_data")}</p>
          <p>{t("analytics.no_data_sub")}</p>
        </div>
      ) : null}

      {analytics?.lastSyncedAt ? (
        <div className="text-[12px] text-zinc-500 inline-flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5" />
          {t("analytics.last_synced", { time: timeAgo(analytics.lastSyncedAt) })}
        </div>
      ) : null}

      {/* ===== ACCOUNT HEADER CARD ===== */}
      <div className={`rounded-xl border border-zinc-200 bg-white border-l-4 ${accent.leftClass} shadow-sm p-4 md:p-5`}>
        <div className="flex flex-col md:flex-row md:justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <div className="flex items-start gap-3">
              <AccountAvatar account={account} size={48} />
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
                <p className="text-sm font-semibold text-zinc-700">{t("analytics.content_types")}</p>
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
          {t("analytics.range", { from: fmtDateShort(range.from.toISOString()), to: fmtDateShort(range.to.toISOString()), n: dayCount })}
        </div>
        <TimezoneDropdown />
      </div>

      {/* ===== METRIC CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {data.metrics.map((m, i) => (
          <MetricCard key={i} spec={m} />
        ))}
      </div>

      {/* ===== TRENDS ===== */}
      <div className="rounded-xl border border-zinc-200/70 bg-white p-4">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-zinc-900 inline-flex items-center gap-1.5">
            <TrendingUp className="size-4" /> {t("analytics.trends")}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAnalyticsExport}
              disabled={exporting}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 h-7 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              <Download className="size-3" />
              {exporting ? t("analytics.exporting") : t("analytics.export_csv")}
            </button>
            <TimeFilter value={period} onChange={setPeriod} />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-[12px] text-zinc-500 mb-1">{t("analytics.trend_followers")}</p>
            <MiniTrend data={data.trends.followers.data} color={data.trends.followers.color} collecting={data.trends.followers.collecting} />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              {tickDates.map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>
          <div>
            <p className="text-[12px] text-zinc-500 mb-1">{t("analytics.trend_impressions")}</p>
            <MiniTrend data={data.trends.views.data} color={data.trends.views.color} collecting={data.trends.views.collecting} />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              {tickDates.map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>
          <div>
            <p className="text-[12px] text-zinc-500 mb-1">{t("analytics.trend_engagement")}</p>
            <MiniTrend data={data.trends.engagement.data} color={data.trends.engagement.color} collecting={data.trends.engagement.collecting} />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              {tickDates.map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>
          <div>
            <p className="text-[12px] text-zinc-500 mb-1">{t("analytics.trend_interactions")}</p>
            <MiniTrend data={data.trends.interactions.data} color={data.trends.interactions.color} collecting={data.trends.interactions.collecting} />
            <div className="flex items-center justify-center gap-3 mt-1 text-[10px]">
              <span className="text-orange-600">{t("analytics.legend_comments")}</span>
              <span className="text-rose-600">{t("analytics.legend_likes")}</span>
              <span className="text-emerald-600">{t("analytics.legend_shares")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PUBLISHED POSTS TABLE ===== */}
      <div className="rounded-xl border border-zinc-200/70 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900">{t("analytics.published_posts")}</h3>
          <div className="text-[12px] text-zinc-500 inline-flex items-center gap-1.5">
            <BarChart3 className="size-3.5" />
            {publishedPosts ? t("analytics.count_posts", { n: publishedPosts.length }) : t("analytics.na")}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[12px] font-medium text-zinc-500 border-b border-zinc-100 bg-zinc-50/40">
              <tr>
                <th className="px-3 py-2.5 text-left w-12">{t("analytics.col_hash")}</th>
                <th className="px-3 py-2.5 text-left">{t("analytics.col_content")}</th>
                <th className="px-3 py-2.5 text-left">{t("analytics.col_date")}</th>
                <th className="px-3 py-2.5 text-left">{t("analytics.col_platforms")}</th>
                <th className="px-3 py-2.5 text-right">Impr.</th>
                <th className="px-3 py-2.5 text-right">Likes</th>
                <th className="px-3 py-2.5 text-right">Cmts</th>
                <th className="px-3 py-2.5 text-right">Shares</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {!publishedPosts || publishedPosts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[12px] text-zinc-500">
                    {t("analytics.no_post_data")}
                  </td>
                </tr>
              ) : (
                publishedPosts.map((post, i) => {
                  const m = liveMetrics[post.id];
                  return (
                    <tr key={post.id} className="hover:bg-zinc-50/50">
                      <td className="px-3 py-2 text-[12px] text-zinc-400 tabular-nums">{i + 1}</td>
                      <td className="px-3 py-2 max-w-xs">
                        <p className="text-zinc-900 line-clamp-2 text-[13px]">{post.caption || t("analytics.no_caption")}</p>
                      </td>
                      <td className="px-3 py-2 text-[12px] text-zinc-500 whitespace-nowrap">
                        {post.publishedAt ? fmtDateShort(post.publishedAt) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {post.platforms.map((p) => (
                            <span key={p} className="inline-flex items-center gap-0.5 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 capitalize">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] tabular-nums text-zinc-800">{fmtOpt(m?.impressions)}</td>
                      <td className="px-3 py-2 text-right text-[12px] tabular-nums text-zinc-800">{fmtOpt(m?.likes)}</td>
                      <td className="px-3 py-2 text-right text-[12px] tabular-nums text-zinc-800">{fmtOpt(m?.comments)}</td>
                      <td className="px-3 py-2 text-right text-[12px] tabular-nums text-zinc-800">{fmtOpt(m?.shares)}</td>
                    </tr>
                  );
                })
              )}
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
  onSync,
  syncing,
}: {
  currentId: string;
  onSelect: (id: string) => void;
  accounts: AccountSummary[];
  rightExtra?: React.ReactNode;
  onSync?: () => void;
  syncing?: boolean;
}) {
  const t = useTranslations("dashboard");
  return (
    <>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-[30px] font-bold leading-[36px] text-zinc-900">{t("analytics.page_title")}</h1>
          {onSync ? (
            <button
              type="button"
              onClick={onSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 h-8 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? t("analytics.syncing") : t("analytics.sync_now")}
            </button>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {rightExtra}
          <OverviewDropdown currentId={currentId} accounts={accounts} />
          <AvatarRow currentId={currentId} onSelect={onSelect} accounts={accounts} />
        </div>
      </div>
      <p className="text-sm text-zinc-500 -mt-3">{t("analytics.page_subtitle")}</p>
    </>
  );
}

// ============================================================
// Overview (All) view
// ============================================================
interface OverviewData {
  workspaceId: string;
  from: string;
  to: string;
  status?: AnalyticsStatus;
  errorMessage?: string | null;
  lastSyncedAt?: string | null;
  totals: {
    followers: number | null;
    engagementRate: number | null;
    impressions: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    saves: number | null;
    clicks: number | null;
    postsPublished: number;
  };
  byPlatform: Array<{
    platform: string;
    status?: AnalyticsStatus;
    errorMessage?: string | null;
    followers: number | null;
    impressions: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    engagementRate: number | null;
  }>;
}

function OverviewView({ accounts }: { accounts: AccountSummary[] }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const [period, setPeriod] = useState<Period>("7d");
  const [platformFilter, setPlatformFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [fetchNonce, setFetchNonce] = useState(0);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const range = periodToRange(period);
      const from = encodeURIComponent(range.from.toISOString());
      const to = encodeURIComponent(range.to.toISOString());
      const res = await fetch(`/api/analytics/overview?from=${from}&to=${to}`, {
        cache: "no-store",
        headers: getOverrideHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data.overview as OverviewData);
      }
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview, fetchNonce]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/analytics/sync", { method: "POST", headers: getOverrideHeaders() });
      setFetchNonce((n) => n + 1);
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  };

  const range = periodToRange(period);
  const dayCount = Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000)));

  // Filter bySelectedPlatform
  const byPlatform = overview?.byPlatform ?? [];
  const filteredByPlatform = platformFilter
    ? byPlatform.filter((p) => p.platform === platformFilter)
    : byPlatform;

  const activePlatform = platformFilter && filteredByPlatform.length === 1 ? filteredByPlatform[0] : null;
  const ft = overview?.totals ?? { followers: null, engagementRate: null, impressions: null, likes: null, comments: null, shares: null, saves: null, clicks: null, postsPublished: 0 };

  const platformOptions = byPlatform.map((p) => ({
    platform: p.platform,
    label: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
  }));
  const PillRow = (
    <div className="flex flex-wrap items-center gap-1">
      {[{ platform: "", label: "All" }, ...platformOptions.sort((a, b) => a.label.localeCompare(b.label))].map((p) => (
        <button
          key={p.platform}
          type="button"
          onClick={() => setPlatformFilter(p.platform)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 h-6 text-[11px] font-medium transition-colors ${
            platformFilter === p.platform ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {p.label === "All" ? t("analytics.all_platforms") : (
            <><PlatformIcon platform={p.platform as Platform} className="mr-0.5" /> {p.label}</>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="px-6 py-6 space-y-4">
      <PageHeader
        currentId=""
        onSelect={(id) => router.push(`${pathname}?accountId=${id}`)}
        accounts={accounts}
        onSync={handleSync}
        syncing={syncing}
      />

      {/* Date range + timezone */}
      <div className="flex flex-wrap items-center justify-between text-[13px]">
        <div className="inline-flex items-center gap-1.5 text-zinc-500">
          <Calendar className="size-3.5" />
          {t("analytics.range", { from: fmtDateShort(range.from.toISOString()), to: fmtDateShort(range.to.toISOString()), n: dayCount })}
        </div>
        <div className="flex items-center gap-2">
          <TimezoneDropdown />
          <TimeFilter value={period} onChange={setPeriod} />
        </div>
      </div>

      {loading && !overview ? (
        <div className="rounded-xl border border-zinc-200/70 bg-white p-8 text-center text-sm text-zinc-500">
          {t("analytics.loading_overview")}
        </div>
      ) : null}

      {!t ? null : (
        <>
          {/* Error banner when the whole fetch failed */}
          {overview?.status && overview.status !== "ok" && overview.errorMessage ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-900">
              <span className="size-1.5 mt-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{overview.errorMessage}</span>
            </div>
          ) : null}

          {/* Platform filter pills */}
          <div className="flex items-center gap-3">
            {overview?.byPlatform && overview.byPlatform.length > 1 ? PillRow : null}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <MetricCard spec={{ label: t("analytics.followers"), value: fmtOpt(activePlatform?.followers ?? ft.followers), sub: t("analytics.followers_sub"), color: "indigo", icon: "eye" }} />
            <MetricCard spec={{ label: t("analytics.impressions"), value: fmtOpt(activePlatform?.impressions ?? ft.impressions), sub: t("analytics.impressions_sub"), color: "blue", icon: "eye" }} />
            <MetricCard spec={{ label: t("analytics.engagement"), value: activePlatform?.engagementRate != null ? fmtPct(activePlatform.engagementRate) : ft.engagementRate != null ? fmtPct(ft.engagementRate) : "—", sub: t("analytics.engagement_sub"), color: "orange", icon: "trending" }} />
            <MetricCard spec={{ label: t("analytics.posts"), value: fmt(ft.postsPublished), sub: t("analytics.posts_sub"), color: "green", icon: "chart" }} />
            <MetricCard spec={{ label: t("analytics.likes"), value: fmtOpt(activePlatform?.likes ?? ft.likes), sub: t("analytics.likes_sub"), color: "red", icon: "heart" }} />
            <MetricCard spec={{ label: t("analytics.comments"), value: fmtOpt(activePlatform?.comments ?? ft.comments), sub: t("analytics.comments_sub"), color: "purple", icon: "message" }} />
            <MetricCard spec={{ label: t("analytics.shares"), value: fmtOpt(activePlatform?.shares ?? ft.shares), sub: t("analytics.shares_sub"), color: "teal", icon: "share" }} />
            <MetricCard spec={{ label: t("analytics.clicks"), value: fmtOpt(ft.clicks), sub: t("analytics.clicks_sub"), color: "amber", icon: "click" }} />
          </div>

          {/* Last synced */}
          {overview?.lastSyncedAt ? (
            <div className="text-[12px] text-zinc-500 inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {t("analytics.last_synced", { time: timeAgo(overview.lastSyncedAt) })}
            </div>
          ) : null}

          {/* Per-platform breakdown */}
          <div className="rounded-xl border border-zinc-200/70 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900 inline-flex items-center gap-1.5">
                <BarChart3 className="size-4" /> {t("analytics.per_platform")}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[12px] font-medium text-zinc-500 border-b border-zinc-100 bg-zinc-50/40">
                  <tr>
                    <th className="px-3 py-2.5 text-left">{t("analytics.col_platform")}</th>
                    <th className="px-3 py-2.5 text-right">{t("analytics.col_followers")}</th>
                    <th className="px-3 py-2.5 text-right">{t("analytics.col_impressions")}</th>
                    <th className="px-3 py-2.5 text-right">Likes</th>
                    <th className="px-3 py-2.5 text-right">Comments</th>
                    <th className="px-3 py-2.5 text-right">Shares</th>
                    <th className="px-3 py-2.5 text-right">{t("analytics.col_engagement_rate")}</th>
                    <th className="px-3 py-2.5 text-left">Status</th>
                    <th className="px-3 py-2.5 text-right">Synced</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredByPlatform.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-[12px] text-zinc-500">
                        {t("analytics.no_platform_data")}
                      </td>
                    </tr>
                  ) : (
                    filteredByPlatform.map((p, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={p.platform as Platform} />
                            <span className="capitalize text-zinc-900 text-[13px]">{p.platform}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fmtOpt(p.followers)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fmtOpt(p.impressions)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fmtOpt(p.likes)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fmtOpt(p.comments)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fmtOpt(p.shares)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{p.engagementRate != null ? fmtPct(p.engagementRate) : "—"}</td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={p.status ?? "unknown"} errorMessage={p.errorMessage ?? null} />
                        </td>
                        <td className="px-3 py-2.5 text-right text-[11px] text-zinc-400 tabular-nums">{timeAgo(overview?.lastSyncedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Main page (with Suspense for useSearchParams)
// ============================================================
function AnalyticsPageInner() {
  const t = useTranslations("dashboard");
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") ?? undefined;
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [accountsError, setAccountsError] = useState(false);

  // Fetch accounts from social-accounts/list and auto-sync analytics on mount.
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
        if (cancelled || !data?.ok || !data.accounts) {
          setAccountsError(true);
          return;
        }
        const adapted = data.accounts.map(adaptAccount);
        if (adapted.length > 0) setAccounts(adapted);
      } catch {
        setAccountsError(true);
      }
    })();
    // Fire-and-forget auto-sync: refresh analytics cache in the background.
    fetch("/api/analytics/sync", { method: "POST", headers: getOverrideHeaders() }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (accounts.length === 0 && !accountsError) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-12 flex flex-col items-center justify-center text-center">
          <div className="size-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <TrendingUp className="size-7 text-zinc-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">{t("analytics.loading_title")}</h2>
        </div>
      </div>
    );
  }

  if (accounts.length === 0 && accountsError) {
    return (
      <div className="px-6 py-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-12 flex flex-col items-center justify-center text-center">
          <div className="size-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
            <TrendingUp className="size-7 text-pink-600" />
          </div>
          <h2 className="text-xl font-bold text-rose-700 mb-2">{t("analytics.unable_load")}</h2>
          <p className="text-[13px] text-rose-700/80 max-w-md mb-6">{t("analytics.connect_platforms_sub")}</p>
          <Link
            href="/dashboard/accounts"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 h-10 text-[13px] font-medium text-white hover:bg-zinc-800"
          >
            {t("analytics.go_accounts")}
          </Link>
        </div>
      </div>
    );
  }

  return accountId ? <PerAccountView accountId={accountId} accounts={accounts} /> : <OverviewView accounts={accounts} />;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500">Loading…</div>}>
      <AnalyticsPageInner />
    </Suspense>
  );
}