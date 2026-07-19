"use client";

import React, { useState } from "react";
import { DollarSign, CheckCircle2 } from "lucide-react";
import { markCommissionPaidAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

export default function CommissionsPage() {
  const [payoutRef, setPayoutRef] = useState("");
  const [pendingCommissions, setPendingCommissions] = useState([
    { id: "com_1", affiliate: "Jack Miller", email: "jack@growthhackers.com", amount: "$490.00", created: "2026-07-01" },
    { id: "com_2", affiliate: "Sophia Martinez", email: "sophia@influencerhub.io", amount: "$250.00", created: "2026-07-05" },
  ]);
  const { toast } = useToast();

  const handleMarkPaid = async (comId: string) => {
    if (!payoutRef.trim()) {
      toast({ title: "Reference Required", description: "Please enter a transaction/bank reference ID.", tone: "warning" });
      return;
    }
    await markCommissionPaidAction(comId, payoutRef);
    setPendingCommissions((prev) => prev.filter((c) => c.id !== comId));
    toast({ title: "Commission Paid", description: `Marked commission ${comId} as paid with ref ${payoutRef}`, tone: "success" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Affiliate Commissions</h1>
        <p className="text-xs text-gray-500">Process payouts and log payment reference IDs.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
        <label className="text-xs font-bold text-gray-700 shrink-0">Payment Reference ID:</label>
        <input
          type="text"
          placeholder="e.g. TXN_984124981"
          value={payoutRef}
          onChange={(e) => setPayoutRef(e.target.value)}
          className="flex-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#01696f]"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Affiliate</th>
              <th className="px-6 py-3.5">Commission Amount</th>
              <th className="px-6 py-3.5">Requested Date</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pendingCommissions.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/80">
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-gray-900">{c.affiliate}</p>
                  <p className="text-[11px] text-gray-500">{c.email}</p>
                </td>
                <td className="px-6 py-4 text-xs font-extrabold text-emerald-700">{c.amount}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{c.created}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleMarkPaid(c.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl ml-auto shadow-xs"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Mark as Paid
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
