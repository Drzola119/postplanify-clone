"use client";

import React, { useState } from "react";
import { Share2, DollarSign, CheckCircle2, Ban, Send, CreditCard } from "lucide-react";
import { markCommissionPaidAction, suspendAffiliateAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState([
    {
      id: "aff_1",
      name: "Jack Miller",
      email: "jack@growthhackers.com",
      referralCode: "JACK20",
      totalReferrals: 45,
      activeSubs: 28,
      earned: "$1,890.00",
      paidOut: "$1,400.00",
      pending: "$490.00",
      status: "active",
    },
    {
      id: "aff_2",
      name: "Sophia Martinez",
      email: "sophia@influencerhub.io",
      referralCode: "SOPHIA10",
      totalReferrals: 32,
      activeSubs: 19,
      earned: "$1,250.00",
      paidOut: "$1,000.00",
      pending: "$250.00",
      status: "active",
    },
  ]);

  const { toast } = useToast();

  const handleSuspend = async (affId: string) => {
    await suspendAffiliateAction(affId);
    setAffiliates((prev) => prev.map((a) => (a.id === affId ? { ...a, status: "suspended" } : a)));
    toast({ title: "Affiliate Suspended", description: `Suspended affiliate ${affId}`, tone: "warning" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Partners</h1>
        <p className="text-xs text-gray-500">Manage referral codes, tracking, and payout balances.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Affiliate</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Total Referrals</th>
                <th className="px-6 py-3.5">Active Subs</th>
                <th className="px-6 py-3.5">Earned</th>
                <th className="px-6 py-3.5">Paid Out</th>
                <th className="px-6 py-3.5">Pending</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {affiliates.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{a.name}</p>
                      <p className="text-[11px] text-gray-500">{a.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded inline-block">
                    {a.referralCode}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-700">{a.totalReferrals}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-emerald-700">{a.activeSubs}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-900">{a.earned}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{a.paidOut}</td>
                  <td className="px-6 py-4 text-xs font-bold text-amber-600">{a.pending}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSuspend(a.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                        title="Suspend Affiliate"
                      >
                        <Ban className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
