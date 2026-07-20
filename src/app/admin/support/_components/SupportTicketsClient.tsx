"use client";

import React from "react";
import Link from "next/link";

interface Props {
  tickets: any[];
}

function statusBadge(status: string) {
  if (status === "open")
    return "px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full";
  if (status === "pending")
    return "px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full";
  return "px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 rounded-full";
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-rose-50 text-rose-700 border border-rose-200",
  high: "bg-orange-50 text-orange-700 border border-orange-200",
  normal: "bg-teal-50 text-teal-700 border border-teal-200",
  low: "bg-gray-100 text-gray-600 border border-gray-200",
};

export function SupportTicketsClient({ tickets }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-3.5">Subject</th>
            <th className="px-6 py-3.5">User</th>
            <th className="px-6 py-3.5">Priority</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5">Updated</th>
            <th className="px-6 py-3.5 text-right">Messages</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tickets.length === 0 ? (
            <tr><td colSpan={6} className="px-6 py-8 text-center text-xs text-gray-400">No tickets.</td></tr>
          ) : (
            tickets.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50/80">
                <td className="px-6 py-4">
                  <Link href={`/admin/support/${t.id}`} className="text-xs font-semibold text-[#01696f] hover:underline">{t.subject}</Link>
                </td>
                <td className="px-6 py-4 text-xs text-gray-600 font-mono">{t.uid}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${PRIORITY_COLOR[t.priority] ?? PRIORITY_COLOR.normal}`}>{t.priority}</span>
                </td>
                <td className="px-6 py-4"><span className={statusBadge(t.status)}>{t.status}</span></td>
                <td className="px-6 py-4 text-xs text-gray-500">{t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : "—"}</td>
                <td className="px-6 py-4 text-xs text-gray-600 text-right">{t.messageCount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
