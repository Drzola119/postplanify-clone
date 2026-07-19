"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Globe, Users, TrendingUp, Sparkles } from "lucide-react";

export default function AnalyticsPage() {
  const funnelData = [
    { step: "1. Visited Landing", count: 12400, percent: "100%" },
    { step: "2. Signed Up", count: 1840, percent: "14.8%" },
    { step: "3. Connected Social Account", count: 1420, percent: "77.1%" },
    { step: "4. Published First Post", count: 1100, percent: "77.4%" },
    { step: "5. Upgraded to Paid Plan", count: 320, percent: "29.0%" },
  ];

  const platformUsage = [
    { name: "Instagram", posts: 4500, fill: "#e1306c" },
    { name: "LinkedIn", posts: 3200, fill: "#0a66c2" },
    { name: "Facebook", posts: 2800, fill: "#1877f2" },
    { name: "X (Twitter)", posts: 2100, fill: "#000000" },
    { name: "TikTok", posts: 1900, fill: "#00f2fe" },
    { name: "Threads", posts: 950, fill: "#101010" },
  ];

  const featureUsage = [
    { feature: "AI Caption Generator", usage: 8400 },
    { feature: "Bulk Scheduler", usage: 6200 },
    { feature: "Canva Integration", usage: 4100 },
    { feature: "Link in Bio Builder", usage: 2900 },
  ];

  const geoDistribution = [
    { country: "United States", users: 850, percent: "57%" },
    { country: "United Kingdom", users: 240, percent: "16%" },
    { country: "Canada", users: 130, percent: "9%" },
    { country: "Germany", users: 95, percent: "6%" },
    { country: "Australia", users: 85, percent: "6%" },
  ];

  const retentionCohorts = [
    { cohort: "Week 1", week1: "100%", week2: "78%", week4: "65%", week8: "58%" },
    { cohort: "Week 2", week1: "100%", week2: "81%", week4: "68%", week8: "61%" },
    { cohort: "Week 3", week1: "100%", week2: "83%", week4: "70%", week8: "64%" },
    { cohort: "Week 4", week1: "100%", week2: "85%", week4: "72%", week8: "66%" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Advanced Product Analytics</h1>
        <p className="text-xs text-gray-500">Signup conversion funnel, social platform usage, feature adoption, and retention cohorts.</p>
      </div>

      {/* Horizontal Signup Conversion Funnel */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Signup & Onboarding Conversion Funnel</h2>
        <div className="space-y-3">
          {funnelData.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-800">{item.step}</span>
                <span className="text-[#01696f]">
                  {item.count.toLocaleString()} users ({item.percent})
                </span>
              </div>
              <div className="w-full h-7 bg-gray-100 rounded-xl overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#01696f] to-teal-500 rounded-lg transition-all duration-500"
                  style={{ width: `${(item.count / 12400) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Usage */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Posts Published per Social Platform</h2>
          <p className="text-xs text-gray-500 mb-4">Total published posts volume</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformUsage} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={90} />
                <Tooltip />
                <Bar dataKey="posts" radius={[0, 4, 4, 0]}>
                  {platformUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Usage */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Feature Adoption & Usage</h2>
          <p className="text-xs text-gray-500 mb-4">Most frequently triggered tools</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureUsage}>
                <XAxis dataKey="feature" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="usage" fill="#01696f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geo & Retention Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geo Distribution Table */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Globe className="size-4 text-[#01696f]" />
            Geographic User Distribution
          </h2>
          <div className="divide-y divide-gray-100 text-xs">
            {geoDistribution.map((g, i) => (
              <div key={i} className="py-2.5 flex justify-between items-center">
                <span className="font-semibold text-gray-800">{g.country}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">{g.users} users</span>
                  <span className="px-2 py-0.5 font-bold bg-teal-50 text-teal-800 rounded">{g.percent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention Cohort Table */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Users className="size-4 text-emerald-600" />
            User Retention Cohorts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
                  <th className="p-2">Cohort</th>
                  <th className="p-2">Wk 1</th>
                  <th className="p-2">Wk 2</th>
                  <th className="p-2">Wk 4</th>
                  <th className="p-2">Wk 8</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {retentionCohorts.map((r, i) => (
                  <tr key={i}>
                    <td className="p-2 font-bold text-gray-900">{r.cohort}</td>
                    <td className="p-2 text-emerald-700 font-bold bg-emerald-50/50">{r.week1}</td>
                    <td className="p-2 text-emerald-700 font-semibold bg-emerald-50/40">{r.week2}</td>
                    <td className="p-2 text-emerald-600 bg-emerald-50/30">{r.week4}</td>
                    <td className="p-2 text-teal-600 bg-teal-50/20">{r.week8}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
