"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Share2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  stats: {
    totalUsers: number;
    totalUsersChange: string;
    activeSubscriptions: number;
    activeSubsChange: string;
    mrr: string;
    mrrChange: string;
    postsPublishedToday: number;
    postsScheduled: number;
    failedPostsLast24h: number;
    activeAffiliates: number;
    affiliateRevenue: string;
  };
  signupsChart: { date: string; count: number }[];
  mrrChart: { month: string; mrr: number }[];
  postsChart: { day: string; count: number }[];
  planDistribution: { name: string; value: number; color: string }[];
  recentSignups: { id: string; email: string; displayName: string; plan: string; createdAt: string; photoURL?: string }[];
  recentStripeEvents: { id: string; type: string; created: string }[];
}

export function DashboardOverviewClient({ data, alertCounts }: { data: DashboardData; alertCounts?: { critical: number; warning: number; info: number; total: number } }) {
  const { stats, signupsChart, mrrChart, postsChart, planDistribution, recentSignups, recentStripeEvents } = data;

  const kpis = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      change: stats.totalUsersChange,
      isPositive: true,
      icon: Users,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions.toLocaleString(),
      change: stats.activeSubsChange,
      isPositive: true,
      icon: CreditCard,
      color: "from-[#01696f] to-teal-600",
    },
    {
      title: "Monthly Recurring (MRR)",
      value: stats.mrr,
      change: stats.mrrChange,
      isPositive: true,
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-700",
    },
    {
      title: "Posts Published Today",
      value: stats.postsPublishedToday.toLocaleString(),
      change: "+24 today",
      isPositive: true,
      icon: CheckCircle,
      color: "from-cyan-500 to-blue-500",
    },
    {
      title: "Scheduled Posts",
      value: stats.postsScheduled.toLocaleString(),
      change: "Pending queue",
      isPositive: true,
      icon: Clock,
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Failed Posts (24h)",
      value: stats.failedPostsLast24h.toString(),
      change: stats.failedPostsLast24h > 0 ? "Requires action" : "All clean",
      isPositive: stats.failedPostsLast24h === 0,
      isAlert: stats.failedPostsLast24h > 0,
      icon: AlertTriangle,
      color: stats.failedPostsLast24h > 0 ? "from-rose-500 to-red-600" : "from-emerald-500 to-teal-600",
    },
    {
      title: "Active Affiliates",
      value: stats.activeAffiliates.toLocaleString(),
      change: "+3 this month",
      isPositive: true,
      icon: Share2,
      color: "from-violet-500 to-purple-600",
    },
    {
      title: "Affiliate Revenue",
      value: stats.affiliateRevenue,
      change: "Current month",
      isPositive: true,
      icon: DollarSign,
      color: "from-sky-500 to-blue-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-xs text-gray-500">Real-time metrics, revenue performance, and activity insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
            <span className="size-2 bg-emerald-500 rounded-full animate-ping" />
            Live System Active
          </span>
        </div>
      </div>

      {/* Active Alerts Bar */}
      {alertCounts && alertCounts.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {alertCounts.critical > 0 && (
                <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                  {alertCounts.critical} Critical
                </span>
              )}
              {alertCounts.warning > 0 && (
                <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                  {alertCounts.warning} Warning
                </span>
              )}
              {alertCounts.info > 0 && (
                <span className="px-2.5 py-1 text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                  {alertCounts.info} Info
                </span>
              )}
            </div>
            <span className="text-xs text-gray-600">{alertCounts.total} active alert{alertCounts.total !== 1 ? "s" : ""} require attention</span>
          </div>
          <Link href="/admin/alerts" className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 rounded-xl hover:bg-rose-100">
            <AlertTriangle className="size-3.5" />
            View Alerts
          </Link>
        </div>
      )}

      {/* KPI Cards (4-column grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`bg-white p-5 rounded-2xl border ${
                kpi.isAlert ? "border-rose-300 ring-2 ring-rose-100" : "border-gray-200"
              } shadow-xs hover:shadow-md transition-shadow relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">{kpi.title}</span>
                <div
                  className={`size-9 rounded-xl bg-gradient-to-tr ${kpi.color} text-white flex items-center justify-center shadow-xs`}
                >
                  <Icon className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-gray-900 tracking-tight">{kpi.value}</span>
                <span
                  className={`inline-flex items-center text-[11px] font-semibold ${
                    kpi.isAlert
                      ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full"
                      : kpi.isPositive
                      ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"
                      : "text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                  }`}
                >
                  {kpi.isPositive ? <ArrowUpRight className="size-3 mr-0.5" /> : <ArrowDownRight className="size-3 mr-0.5" />}
                  {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signups Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">New Signups (Last 30 Days)</h2>
              <p className="text-xs text-gray-500">Daily registration rate</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupsChart}>
                <defs>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#01696f" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#01696f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#01696f" strokeWidth={2} fillOpacity={1} fill="url(#colorSignups)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MRR Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">MRR Growth (12 Months)</h2>
              <p className="text-xs text-gray-500">Monthly recurring revenue trends ($)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrrChart}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(val) => [`$${val}`, "MRR"]} />
                <Bar dataKey="mrr" fill="#01696f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Posts Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Posts Published (Last 14 Days)</h2>
              <p className="text-xs text-gray-500">Volume across all platforms</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={postsChart}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Plan Distribution</h2>
              <p className="text-xs text-gray-500">Free vs Paid user breakdown</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent User Signups */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="size-4 text-[#01696f]" />
            <h2 className="text-sm font-bold text-gray-900">Recent User Signups</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentSignups.map((usr) => (
              <div key={usr.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                    {usr.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{usr.displayName}</p>
                    <p className="text-[11px] text-gray-500">{usr.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-700 rounded-md">
                    {usr.plan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Stripe Events */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="size-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">Recent Stripe Events</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentStripeEvents.map((evt) => (
              <div key={evt.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-gray-900">{evt.type}</p>
                  <p className="text-[10px] text-gray-400">{evt.id}</p>
                </div>
                <span className="text-[11px] text-gray-500">
                  {new Date(evt.created).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
