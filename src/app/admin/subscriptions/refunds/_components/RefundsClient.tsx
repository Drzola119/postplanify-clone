"use client";

import React, { useState } from "react";
import { issueRefundAction, applyBillingAdjustmentAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";
import { CreditCard, ScrollText } from "lucide-react";

export function RefundsClient() {
  const { toast } = useToast();
  const [chargeId, setChargeId] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [amountUsd, setAmountUsd] = useState<string>("");
  const [reason, setReason] = useState<"duplicate" | "fraudulent" | "requested_by_customer">("requested_by_customer");
  const [submitting, setSubmitting] = useState(false);

  // manual adjustment state
  const [adjWorkspace, setAdjWorkspace] = useState("");
  const [adjType, setAdjType] = useState<"credit" | "debit">("credit");
  const [adjAmount, setAdjAmount] = useState<string>("");
  const [adjReason, setAdjReason] = useState("");
  const [adjSubmitting, setAdjSubmitting] = useState(false);

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjWorkspace.trim() || !adjReason.trim()) {
      toast({ title: "Workspace ID and reason are required", tone: "error" });
      return;
    }
    setAdjSubmitting(true);
    try {
      await applyBillingAdjustmentAction({
        workspaceId: adjWorkspace.trim(),
        type: adjType,
        amountUsd: Number(adjAmount) || 0,
        reason: adjReason.trim(),
      });
      toast({ title: "Adjustment recorded", tone: "success" });
      setAdjWorkspace("");
      setAdjAmount("");
      setAdjReason("");
    } catch (err: any) {
      toast({ title: "Adjustment failed", description: err?.message ?? "Unknown error", tone: "error" });
    } finally {
      setAdjSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeId.trim() && !paymentIntentId.trim()) {
      toast({ title: "Provide a charge or payment intent ID", tone: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await issueRefundAction({
        chargeId: chargeId.trim() || undefined,
        paymentIntentId: paymentIntentId.trim() || undefined,
        amountUsd: amountUsd ? Number(amountUsd) : undefined,
        reason,
      });
      toast({ title: "Refund issued", description: `Refund ${res.refundId}`, tone: "success" });
      setChargeId("");
      setPaymentIntentId("");
      setAmountUsd("");
    } catch (err: any) {
      toast({ title: "Refund failed", description: err?.message ?? "Unknown error", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="size-5 text-[#01696f]" />
        <h3 className="font-bold text-gray-900 text-sm">New Refund</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-bold text-gray-700">Charge ID</label>
          <input
            type="text"
            placeholder="ch_..."
            value={chargeId}
            onChange={(e) => setChargeId(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl"
          />
        </div>
        <div>
          <label className="font-bold text-gray-700">Payment Intent ID (optional)</label>
          <input
            type="text"
            placeholder="pi_..."
            value={paymentIntentId}
            onChange={(e) => setPaymentIntentId(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl"
          />
        </div>
        <div>
          <label className="font-bold text-gray-700">Amount (USD, empty = full refund)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder="e.g. 19.99"
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl"
          />
        </div>
        <div>
          <label className="font-bold text-gray-700">Reason</label>
          <select
            value={reason}
            onChange={(e: any) => setReason(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl"
          >
            <option value="requested_by_customer">Requested by customer</option>
            <option value="duplicate">Duplicate</option>
            <option value="fraudulent">Fraudulent</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-[#01696f] text-white font-bold rounded-xl disabled:opacity-50"
          >
            {submitting ? "Issuing..." : "Issue Refund"}
          </button>
        </div>
      </form>

      <hr className="border-gray-100" />

      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="size-5 text-[#01696f]" />
        <h3 className="font-bold text-gray-900 text-sm">Manual Billing Adjustment (internal ledger)</h3>
      </div>
      <form onSubmit={handleAdjustment} className="space-y-4 text-xs">
        <div>
          <label className="font-bold text-gray-700">Workspace ID</label>
          <input
            type="text"
            required
            placeholder="workspace_..."
            value={adjWorkspace}
            onChange={(e) => setAdjWorkspace(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="font-bold text-gray-700">Type</label>
            <select
              value={adjType}
              onChange={(e: any) => setAdjType(e.target.value)}
              className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl"
            >
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="font-bold text-gray-700">Amount (USD)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              required
              placeholder="0.00"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl"
            />
          </div>
        </div>
        <div>
          <label className="font-bold text-gray-700">Reason (required)</label>
          <input
            type="text"
            required
            placeholder="e.g. goodwill credit for outage"
            value={adjReason}
            onChange={(e) => setAdjReason(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={adjSubmitting}
            className="px-4 py-2 bg-[#01696f] text-white font-bold rounded-xl disabled:opacity-50"
          >
            {adjSubmitting ? "Recording..." : "Record Adjustment"}
          </button>
        </div>
      </form>
    </div>
  );
}
