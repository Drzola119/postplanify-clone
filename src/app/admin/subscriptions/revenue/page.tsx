"use client";

import React from "react";
import { DollarSign, TrendingUp, UserMinus, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function RevenuePage() {
  const revenueCards = [
    { title: "Monthly Recurring (MRR)", value: "$4,850.00", change: "+15% vs last month", icon: DollarSign, color: "bg-emerald-50 text-emerald-700" },
    { title: "Annual Recurring (ARR)", value: "$58,200.00", change: "Projected annual", icon: TrendingUp, color: "bg-teal-50 text-teal-700" },
    { title: "Monthly Churn Rate", value: "2.1%", change: "-0.4% improvement", icon: UserMinus, color: "bg-amber-50 text-amber-700" },
    { title: "ARPU (Avg Revenue/User)", value: "$115.47", change: "+$12.30", icon: CreditCard, color: "bg-sky-50 text-sky-700" },
  ];

  const revenueByPlanData = [
    { month: "Jan", Pro: 1800, Business: 1400, Agency: 800 },
    { month: "Feb", Pro: 2200, Business: 1800, Agency: 1200 },
    { month: "Mar", Pro: 2600, Business: 2100, Agency: 1600 },
    { month: "Apr", Pro: 3100, Business: 2400, Agency: 2000 },
    { month: "May", Pro: 3600, Business: 2900, Agency: 2400 },
    { month: "Jun", Pro: 4100, Business: 3400, Agency: 2800 },
  ];

  const churnVSNewData = [
    { month: "Jan", newSubs: 14, churned: 2 },
    { month: "Feb", newSubs: 18, churned: 3 },
    { month: "Mar", newSubs: 22, churned: 4 },
    { month: "Apr", newSubs: 25, churned: 2 },
    { month: "May", newSubs: 30, churned: 3 },
    { month: "Jun", newSubs: 38, churned: 5 },
  ];

  const topPayingUsers = [
    { name: "Edy Labels", email: "edylabels@gmail.com", plan: "Agency Tier", ltv: "$2,868.00" },
    { name: "Jessica Vance", email: "jessica@agency.org", plan: "Business Tier", ltv: "$1,908.00" },
    { name: "Elena Rostova", email: "elena@spypublishing.com", plan: "Pro Tier", ltv: "$948.00" },
    { name: "Sophia Martinez", email: "sophia@influencerhub.io", plan: "Pro Tier", ltv: "$790.00" },
    { name: "Jack Miller", email: "jack@growthhackers.com", plan: "Pro Tier", ltv: "$632.00" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Revenue & Financial Analytics</h1>
        <p className="text-xs text-gray-500">Breakdown of subscription revenues, LTV, and churn performance.</p>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">{c.title}</span>
                <div className={`p-2 rounded-xl ${c.color}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{c.value}</p>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <ArrowUpRight className="size-3" />
                {c.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Revenue by Plan Tier ($)</h2>
          <p className="text-xs text-gray-500 mb-4">Pro vs Business vs Agency breakdown</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByPlanData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Pro" stackId="a" fill="#01696f" />
                <Bar dataKey="Business" stackId="a" fill="#0284c7" />
                <Bar dataKey="Agency" stackId="a" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grouped Bar Chart: New vs Churned */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 mb-1">New vs. Churned Subscribers</h2>
          <p className="text-xs text-gray-500 mb-4">Net subscriber growth count</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnVSNewData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="newSubs" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churned" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 10 Highest-Paying Users */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Top Highest-Paying Customers (LTV)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Current Plan</th>
                <th className="px-4 py-3 text-right">Lifetime Value (LTV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topPayingUsers.map((u, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {u.name} <span className="text-gray-400 font-normal">({u.email})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-50 text-teal-800 rounded">
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-extrabold text-emerald-700">{u.ltv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
