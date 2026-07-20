"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

interface DisputeRow {
  id: string;
  disputeId: string;
  chargeId: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  evidenceDueBy: string | null;
  stripeDashboardUrl: string | null;
}

interface Props {
  disputes: DisputeRow[];
}

function statusBadge(status: string) {
  if (status === "won" || status === "unlost")
    return "px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full";
  if (status === "lost" || status === "warning_closed")
    return "px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full";
  return "px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full";
}

export function DisputesClient({ disputes }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-3.5">Dispute</th>
            <th className="px-6 py-3.5">Charge</th>
            <th className="px-6 py-3.5">Amount</th>
            <th className="px-6 py-3.5">Reason</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5">Evidence Due</th>
            <th className="px-6 py-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {disputes.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-xs text-gray-400">No disputes recorded.</td>
            </tr>
          ) : (
            disputes.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50/80">
                <td className="px-6 py-4 text-xs font-mono font-bold text-[#01696f]">{d.disputeId}</td>
                <td className="px-6 py-4 text-xs text-gray-600 font-mono">{d.chargeId}</td>
                <td className="px-6 py-4 text-xs font-bold text-gray-900">
                  ${(d.amount ?? 0).toFixed(2)} {d.currency?.toUpperCase()}
                </td>
                <td className="px-6 py-4 text-xs text-gray-600">{d.reason}</td>
                <td className="px-6 py-4"><span className={statusBadge(d.status)}>{d.status}</span></td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {d.evidenceDueBy ? new Date(d.evidenceDueBy).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  {d.stripeDashboardUrl && (
                    <a
                      href={d.stripeDashboardUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
                    >
                      <ExternalLink className="size-3" /> Stripe
                    </a>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
