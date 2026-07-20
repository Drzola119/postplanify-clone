"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend
} from "recharts";
import {
  Users, TrendingUp, Eye, Activity, Globe, Zap,
  RefreshCw, AlertTriangle,
  BarChart2, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import type { AnalyticsOverviewData, SocialAnalyticsData } from "@/types/analytics";
import { refreshSocialAnalytics, getAnalyticsTimeSeries } from "@/app/admin/actions/analytics";

// ─────────────── Platform metadata ───────────────
const PLATFORM_META: Record<string, { name: string; color: string; icon: string }> = {
  instagram:       { name: "Instagram",       color: "#DD2A7B", icon: "📷" },
  linkedin:        { name: "LinkedIn",         color: "#0A66C2", icon: "in" },
  facebook:        { name: "Facebook",         color: "#1877F2", icon: "f"  },
  twitter:         { name: "X / Twitter",      color: "#000000", icon: "𝕏"  },
  x:               { name: "X / Twitter",      color: "#000000", icon: "𝕏"  },
  tiktok:          { name: "TikTok",           color: "#010101", icon: "🎵" },
  threads:         { name: "Threads",          color: "#101010", icon: "@"  },
  youtube:         { name: "YouTube",          color: "#FF0000", icon: "▶️" },
  pinterest:       { name: "Pinterest",        color: "#E60023", icon: "📌" },
  bluesky:         { name: "Bluesky",          color: "#3B82F6", icon: "🦋" },
  discord:         { name: "Discord",          color: "#5865F2", icon: "💬" },
  telegram:        { name: "Telegram",         color: "#0EA5E9", icon: "✈️" },
  reddit:          { name: "Reddit",           color: "#F97316", icon: "🤖" },
  other:           { name: "Other",            color: "#94A3B8", icon: "📱" },
};

function platformMeta(platform: string) {
  return PLATFORM_META[platform.toLowerCase()] ?? { name: platform, color: "#94A3B8", icon: "📱" };
}

// ─────────────── Helpers ───────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function retentionCellClass(pct: number): string {
  if (pct >= 80) return "bg-emerald-100 text-emerald-800 font-bold";
  if (pct >= 60) return "bg-yellow-50 text-yellow-800 font-semibold";
  return "bg-rose-50 text-rose-700";
}

// ─────────────── Sub-components ───────────────
function HeroCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <span
        className="flex-shrink-0 size-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: accent ? `${accent}15` : "#01696f15" }}
      >
        <Icon
          className="size-5"
          style={{ color: accent ?? "#01696f" }}
        />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PlatformStatusBadge({
  platform,
  status,
  lastSyncedAt,
  nowMs,
}: {
  platform: string;
  status: "ok" | "error" | "token_expired" | "not_connected";
  lastSyncedAt: string | null;
  nowMs: number;
}) {
  const meta = platformMeta(platform);
  const statusConfig = {
    ok:            { dot: "bg-emerald-500", label: "Live"          },
    error:         { dot: "bg-rose-500",    label: "Error"         },
    token_expired: { dot: "bg-amber-400",   label: "Token expired" },
    not_connected: { dot: "bg-gray-300",    label: "Not connected" },
  }[status];

  const ago = useMemo(() => {
    if (!lastSyncedAt) return null;
    const secs = Math.floor((nowMs - new Date(lastSyncedAt).getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  }, [lastSyncedAt, nowMs]);

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs">
      <span
        className="size-7 rounded-lg flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0"
        style={{ backgroundColor: meta.color }}
      >
        {meta.icon}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-gray-800">{meta.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`size-1.5 rounded-full flex-shrink-0 ${statusConfig.dot}`} />
          <span className="text-gray-500">{statusConfig.label}</span>
          {ago && <span className="text-gray-400">· {ago}</span>}
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ platform, dismiss }: { platform: string; dismiss: () => void }) {
  const meta = platformMeta(platform);
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
      <div className="flex items-start gap-2">
        <AlertTriangle className="size-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <span>
          <strong>{meta.name}</strong> analytics unavailable — token may have expired.
          Visit <strong>Integrations → Social Accounts</strong> to reconnect.
        </span>
      </div>
      <button onClick={dismiss} className="text-amber-500 hover:text-amber-700 flex-shrink-0">✕</button>
    </div>
  );
}

// ─────────────── Main Client Component ───────────────
interface Props {
  initialOverview: AnalyticsOverviewData;
  initialSocial: SocialAnalyticsData;
}

export default function AnalyticsClient({ initialOverview, initialSocial }: Props) {
  const [overview] = useState(initialOverview);
  const [social] = useState(initialSocial);
  const [nowMs] = useState<number>(() => new Date().getTime());
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const [timeSeries, setTimeSeries] = useState(overview.timeSeries);
  const [isPending, startTransition] = useTransition();

  const errorPlatforms = social.platforms.filter(
    (p) => (p.status === "error" || p.status === "token_expired") && !dismissedErrors.has(p.platform)
  );

  
  // ─── Refresh cache button ───
  function handleRefresh() {
    startTransition(async () => {
      await refreshSocialAnalytics();
    });
  }

  // ─── Time range change ───
  function handleTimeRangeChange(days: 7 | 30 | 90) {
    setTimeRange(days);
    startTransition(async () => {
      const data = await getAnalyticsTimeSeries(days);
      setTimeSeries(data);
    });
  }

  // ─── Funnel max count ───
  const funnelMax = overview.funnel[0]?.count || 1;

  // ─── Platform breakdown (add bar colors) ───
  const platformBarData = overview.platformBreakdown.map((p) => ({
    name: platformMeta(p.platform).name,
    posts: p.count,
    fill: platformMeta(p.platform).color,
  }));

  // ─── Top posts with caption truncation ───
  const topPostsData = social.topPosts.map((p) => ({
    ...p,
    captionTruncated: p.caption.length > 60 ? `${p.caption.slice(0, 60)}…` : p.caption,
  }));

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Product Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Live data from Firestore &amp; connected social platforms.
            {social.cachedAt && (
              <span className="text-gray-400"> Last sync: {new Date(social.cachedAt).toLocaleString()}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-[#01696f] text-white text-xs font-semibold rounded-xl hover:bg-[#015559] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
          Refresh Now
        </button>
      </div>

      {/* ── Error banners ── */}
      {errorPlatforms.length > 0 && (
        <div className="space-y-2">
          {errorPlatforms.map((p) => (
            <ErrorBanner
              key={p.platform}
              platform={p.platform}
              dismiss={() => setDismissedErrors((prev) => new Set([...prev, p.platform]))}
            />
          ))}
        </div>
      )}

      {/* ── 1. HERO SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <HeroCard
          icon={Users}
          label="Registered Users"
          value={fmt(overview.subscriptionStats.total > 0 ? overview.funnel[0]?.count ?? 0 : 0)}
          sub={`${overview.subscriptionStats.total} workspaces`}
        />
        <HeroCard
          icon={TrendingUp}
          label="Active Paid Subs"
          value={fmt(overview.subscriptionStats.paid)}
          sub={`MRR ~$${fmt(overview.subscriptionStats.mrr)}`}
          accent="#8B5CF6"
        />
        <HeroCard
          icon={Eye}
          label="Total Impressions"
          value="N/A"
          sub="Not available through configured provider (UploadPost)"
          accent="#3B82F6"
        />
        <HeroCard
          icon={Activity}
          label="Total Engagements"
          value="N/A"
          sub="Not available through configured provider (UploadPost)"
          accent="#F97316"
        />
        <HeroCard
          icon={Zap}
          label="Avg Engagement Rate"
          value="N/A"
          sub="Not available through configured provider (UploadPost)"
          accent="#10B981"
        />
      </div>

      {/* ── 2. PLATFORM API STATUS ROW ── */}
      {social.platforms.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Platform Integration Status</h2>
          <div className="flex flex-wrap gap-3">
            {social.platforms.map((p) => (
              <PlatformStatusBadge
                key={p.platform}
                platform={p.platform}
                status={p.status}
                lastSyncedAt={p.lastSyncedAt}
                nowMs={nowMs}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-400">
          No social accounts connected. Connect social accounts in{" "}
          <Link href="/admin/integrations/social-accounts" className="text-[#01696f] underline hover:no-underline">
            Integrations → Social Accounts
          </Link>{" "}
          to see platform analytics.
        </div>
      )}

      {/* ── 3. SIGNUP CONVERSION FUNNEL ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Signup &amp; Onboarding Conversion Funnel</h2>
        <div className="space-y-3">
          {overview.funnel.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-800">{item.step}</span>
                <span className="text-[#01696f]">
                  {item.count.toLocaleString()} users ({item.percent})
                </span>
              </div>
              <div className="w-full h-7 bg-gray-100 rounded-xl overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#01696f] to-teal-400 rounded-lg transition-all duration-700"
                  style={{ width: `${Math.max((item.count / funnelMax) * 100, 0.5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. TWO-COLUMN CHARTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts per Platform */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Posts Published per Social Platform</h2>
          <p className="text-xs text-gray-500 mb-4">Total published posts by platform</p>
          {platformBarData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformBarData} layout="vertical" margin={{ left: 4, right: 16 }}>
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={90} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    formatter={(v: unknown) => [typeof v === "number" ? v.toLocaleString() : String(v), "Posts"]}
                  />
                  <Bar dataKey="posts" radius={[0, 6, 6, 0]}>
                    {platformBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-gray-400">
              No published posts yet.
            </div>
          )}
        </div>

        {/* Daily Activity Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Daily Activity</h2>
              <p className="text-xs text-gray-500">Signups + posts published over time</p>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            
              {([7, 30, 90] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => handleTimeRangeChange(d)}
                  disabled={isPending}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    timeRange === d
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {isPending ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={(v: string) => v.slice(5)}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="signups" stroke="#01696f" strokeWidth={2} dot={false} name="Signups" />
                  <Line type="monotone" dataKey="posts" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Posts Published" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. FEATURE ADOPTION ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="size-4 text-[#01696f]" />
          <h2 className="text-sm font-bold text-gray-900">Feature Adoption</h2>
        </div>
        {overview.featureAdoption.some((f) => f.count > 0) ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.featureAdoption} margin={{ left: 0, right: 8, bottom: 20 }}>
                <XAxis
                  dataKey="feature"
                  stroke="#94a3b8"
                  fontSize={10}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(v: unknown) => [typeof v === "number" ? v.toLocaleString() : String(v), "Uses"]}
                />
                <Bar dataKey="count" name="Uses" fill="#01696f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-8 text-center">Feature usage data not available yet.</p>
        )}
      </div>

      {/* ── 6. TOP PERFORMING POSTS ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpRight className="size-4 text-[#01696f]" />
          <h2 className="text-sm font-bold text-gray-900">Top Performing Posts</h2>
        </div>
        {topPostsData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                  <th className="px-3 py-2.5">Platform</th>
                  <th className="px-3 py-2.5">Caption</th>
                  <th className="px-3 py-2.5 text-right">Impressions</th>
                  <th className="px-3 py-2.5 text-right">Likes</th>
                  <th className="px-3 py-2.5 text-right">Comments</th>
                  <th className="px-3 py-2.5 text-right">Eng. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topPostsData.map((p) => {
                  const meta = platformMeta(p.platform);
                  return (
                    <tr key={`${p.workspaceId}-${p.postId}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-[11px] font-semibold"
                          style={{ backgroundColor: meta.color }}
                        >
                          {meta.icon} {meta.name}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 max-w-[220px]">
                        <span title={p.caption}>{p.captionTruncated}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{fmt(p.impressions)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{fmt(p.likes)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{fmt(p.comments)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-[#01696f]">
                        {p.engagementRate.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-8 text-center">
            No social analytics data available — connect social accounts and check token status above.
          </p>
        )}
      </div>

      {/* ── 7. GEO DISTRIBUTION (only if real data) ── */}
      {social.geoDistribution.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="size-4 text-[#01696f]" />
            <h2 className="text-sm font-bold text-gray-900">Audience Geographic Distribution</h2>
          </div>
          <div className="divide-y divide-gray-100 text-xs">
            {social.geoDistribution.map((g, i) => (
              <div key={i} className="py-2.5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono w-5 text-right">{i + 1}.</span>
                  <span className="font-semibold text-gray-800">{g.country}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#01696f] rounded-full"
                      style={{ width: g.percent }}
                    />
                  </div>
                  <span className="text-gray-500 w-16 text-right">{g.count.toLocaleString()} users</span>
                  <span className="px-2 py-0.5 font-bold bg-teal-50 text-teal-800 rounded w-14 text-right">{g.percent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 8. RETENTION COHORTS ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-gray-900">User Retention Cohorts</h2>
          <span className="text-xs text-gray-400 ml-2">Activity signal: login or published post</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
                <th className="p-2.5">Signup Cohort</th>
                <th className="p-2.5 text-center">Week 1</th>
                <th className="p-2.5 text-center">Week 2</th>
                <th className="p-2.5 text-center">Week 4</th>
                <th className="p-2.5 text-center">Week 8</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {overview.retentionCohorts.map((r, i) => (
                <tr key={i}>
                  <td className="p-2.5 font-bold text-gray-900">{r.cohort}</td>
                  {([r.week1, r.week2, r.week4, r.week8] as number[]).map((pct, j) => (
                    <td key={j} className={`p-2.5 text-center rounded-sm ${retentionCellClass(pct)}`}>
                      {pct}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 pt-2">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-100 border border-emerald-300 inline-block" /> ≥80% retained</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-yellow-50 border border-yellow-300 inline-block" /> 60–80%</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-rose-50 border border-rose-300 inline-block" /> &lt;60%</span>
        </div>
      </div>

    </div>
  );
}
