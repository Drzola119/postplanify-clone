"use client";

import React, { useState, useMemo } from "react";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  totalReferrals: number;
  activeSubs: number;
  earned: string;
  paidOut: string;
  pending: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  suspended: "bg-amber-50 text-amber-700",
};

export function AffiliatesTableClient({ affiliates }: { affiliates: Affiliate[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return affiliates;
    const q = search.toLowerCase();
    return affiliates.filter(
      (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.referralCode.toLowerCase().includes(q)
    );
  }, [affiliates, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search affiliates..."
          className="flex-1 min-w-[200px] max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01696f] bg-white"
        />
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} affiliates</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              {["Name", "Email", "Code", "Referrals", "Active Subs", "Earned", "Paid Out", "Pending", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{a.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.email}</td>
                <td className="px-4 py-3">
                  <code className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{a.referralCode}</code>
                </td>
                <td className="px-4 py-3 text-center text-gray-700">{a.totalReferrals}</td>
                <td className="px-4 py-3 text-center text-gray-700">{a.activeSubs}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{a.earned}</td>
                <td className="px-4 py-3 text-gray-600">{a.paidOut}</td>
                <td className="px-4 py-3 text-teal-700 font-semibold">{a.pending}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">No affiliates found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
