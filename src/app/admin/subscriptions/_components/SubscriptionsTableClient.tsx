"use client";

import React, { useState } from "react";
import { CreditCard, CheckCircle2, AlertTriangle, XCircle, MoreVertical, Gift, ArrowUpCircle } from "lucide-react";
import { cancelSubscriptionAction, grantFreeMonthAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

export interface SubscriptionRow {
  id: string;
  user: string;
  email: string;
  plan: string;
  amount: string;
  billingCycle: string;
  status: "active" | "trialing" | "past_due" | "canceled";
  started: string;
  nextRenewal: string;
}

export function SubscriptionsTableClient({ initialSubs, filterTab = "all" }: { initialSubs: SubscriptionRow[]; filterTab?: string }) {
  const [subs, setSubs] = useState<SubscriptionRow[]>(initialSubs);
  const [tab, setTab] = useState<string>(filterTab);
  const { toast } = useToast();

  const filteredSubs = subs.filter((s) => {
    if (tab === "all") return true;
    return s.status.toLowerCase() === tab.toLowerCase();
  });

  const handleCancel = async (subId: string) => {
    try {
      await cancelSubscriptionAction(subId);
      setSubs((prev) => prev.map((s) => (s.id === subId ? { ...s, status: "canceled" } : s)));
      toast({ title: "Subscription Cancelled", description: `Cancelled subscription ${subId}`, tone: "warning" });
    } catch (err: any) {
      toast({ title: "Cancellation Failed", description: err.message, tone: "error" });
    }
  };

  const handleGrantFreeMonth = async (subId: string) => {
    try {
      await grantFreeMonthAction(subId);
      toast({ title: "Free Month Granted", description: `Added 1 month credit to ${subId}`, tone: "success" });
    } catch (err: any) {
      toast({ title: "Failed to grant credit", description: err.message, tone: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        {["all", "active", "trialing", "past_due", "canceled"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-colors ${
              tab === t ? "bg-[#01696f] text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Plan</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Billing</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Started</th>
                <th className="px-6 py-3.5">Renewal</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubs.length > 0 ? (
                filteredSubs.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{s.user}</p>
                        <p className="text-[11px] text-gray-500">{s.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 rounded-full">
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-900">{s.amount}</td>
                    <td className="px-6 py-4 text-xs text-gray-600 capitalize">/{s.billingCycle}</td>
                    <td className="px-6 py-4">
                      {s.status === "active" && <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Active</span>}
                      {s.status === "canceled" && <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">Cancelled</span>}
                      {s.status === "past_due" && <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">Past Due</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(s.started).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(s.nextRenewal).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleGrantFreeMonth(s.id)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg text-xs flex items-center gap-1"
                          title="Grant Free Month"
                        >
                          <Gift className="size-3.5" />
                        </button>
                        {s.status === "active" && (
                          <button
                            onClick={() => handleCancel(s.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                            title="Cancel Subscription"
                          >
                            <XCircle className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs text-gray-400">
                    No subscriptions in this tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
