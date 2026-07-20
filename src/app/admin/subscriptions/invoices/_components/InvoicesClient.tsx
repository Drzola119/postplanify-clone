"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

interface InvoiceRow {
  id: string;
  number: string | null;
  customer: string;
  customerName: string;
  amount: number;
  currency: string;
  status: string | null;
  created: string | null;
  hostedUrl: string | null;
  pdfUrl: string | null;
  subscriptionId: string | null;
}

interface Props {
  invoices: InvoiceRow[];
}

function statusBadge(status: string) {
  if (status === "paid")
    return "px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full";
  if (status === "open" || status === "void")
    return "px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full";
  if (status === "uncollectible")
    return "px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full";
  return "px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 rounded-full";
}

export function InvoicesClient({ invoices }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-3.5">Number</th>
            <th className="px-6 py-3.5">Customer</th>
            <th className="px-6 py-3.5">Amount</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5">Date</th>
            <th className="px-6 py-3.5 text-right">Links</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-xs text-gray-400">No invoices found (Stripe may be unconfigured).</td>
            </tr>
          ) : (
            invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50/80">
                <td className="px-6 py-4 text-xs font-mono font-bold text-[#01696f]">{inv.number ?? inv.id}</td>
                <td className="px-6 py-4 text-xs text-gray-700">
                  <p className="font-semibold">{inv.customerName || inv.customer}</p>
                  <p className="text-[10px] text-gray-400">{inv.customer}</p>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-gray-900">
                  ${(inv.amount ?? 0).toFixed(2)} {inv.currency?.toUpperCase()}
                </td>
                <td className="px-6 py-4"><span className={statusBadge(inv.status ?? "")}>{inv.status ?? "—"}</span></td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {inv.created ? new Date(inv.created).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  {inv.hostedUrl && (
                    <a href={inv.hostedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100">
                      <ExternalLink className="size-3" /> Hosted
                    </a>
                  )}
                  {inv.pdfUrl && (
                    <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                      <ExternalLink className="size-3" /> PDF
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
