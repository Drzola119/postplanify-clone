"use client";

import React, { useState, useMemo } from "react";

interface Subscription {
  id: string;
  user: string;
  email: string;
  plan: string;
  amount: string;
  billingCycle: string;
  status: string;
  started: string;
  nextRenewal: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  canceled: "bg-rose-50 text-rose-700",
  past_due: "bg-amber-50 text-amber-700",
  trialing: "bg-blue-50 text-blue-700",
};

export function SubscriptionsTableClient({ subscriptions }: { subscriptions: Subscription[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let rows = subscriptions;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) => s.user.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") rows = rows.filter((s) => s.status === statusFilter);
    return rows;
  }, [subscriptions, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 min-w-[200px] max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01696f] bg-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="canceled">Canceled</option>
          <option value="past_due">Past Due</option>
          <option value="trialing">Trialing</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} subscriptions</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              {["Customer", "Email", "Plan", "Amount", "Cycle", "Status", "Started", "Next Renewal"].map((h) => (
                <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{s.user}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.email}</td>
                <td className="px-4 py-3 text-gray-700">{s.plan}</td>
                <td className="px-4 py-3 text-gray-900 font-semibold">{s.amount}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{s.billingCycle}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(s.started).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(s.nextRenewal).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No subscriptions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
