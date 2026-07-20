"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: {
    workspaces: { workspaceId: string; name: string; lifetime: number; thisMonth: number; lastCostUsd: number; month: string }[];
    totals: { lifetime: number; thisMonth: number; costUsd: number };
  };
}

export function AiUsageClient({ data }: Props) {
  const { workspaces, totals } = data;
  const chartData = workspaces.slice(0, 10).map((w) => ({
    name: w.name.length > 18 ? w.name.slice(0, 16) + "…" : w.name,
    thisMonth: w.thisMonth,
    lifetime: w.lifetime,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-500">Total Generations (Lifetime)</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{totals.lifetime.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-500">This Month</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{totals.thisMonth.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-500">Estimated Cost (Latest)</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">${totals.costUsd.toFixed(2)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Top Workspaces — Monthly Usage</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip />
              <Bar dataKey="thisMonth" fill="#01696f" radius={[4, 4, 0, 0]} name="This Month" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Workspace Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Workspace</th>
              <th className="px-6 py-3.5">Lifetime</th>
              <th className="px-6 py-3.5">This Month</th>
              <th className="px-6 py-3.5">Bucket</th>
              <th className="px-6 py-3.5">Last Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workspaces.map((w) => (
              <tr key={w.workspaceId} className="hover:bg-gray-50/80">
                <td className="px-6 py-4 text-xs font-semibold text-gray-900">{w.name}</td>
                <td className="px-6 py-4 text-xs text-gray-700">{w.lifetime}</td>
                <td className="px-6 py-4 text-xs text-gray-700">{w.thisMonth}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{w.month}</td>
                <td className="px-6 py-4 text-xs text-gray-500">${w.lastCostUsd?.toFixed(2) ?? "0.00"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
