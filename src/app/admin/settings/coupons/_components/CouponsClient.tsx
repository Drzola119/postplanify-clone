"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createCoupon } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";
import { Plus } from "lucide-react";

interface CouponDisplay {
  id: string;
  name: string;
  percentOff: number | null;
  amountOff: number | null;
  duration: string;
  timesRedeemed: number;
  valid: boolean;
}

interface Props {
  initialCoupons: CouponDisplay[];
}

export function CouponsClient({ initialCoupons }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [coupons, setCoupons] = useState<CouponDisplay[]>(initialCoupons);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState<number>(20);
  const [duration, setDuration] = useState<"once" | "repeating" | "forever">("repeating");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCoupon({ code, percentOff, duration });
      toast({ title: "Stripe Coupon Created", description: `Created coupon code ${code}`, tone: "success" });
      setShowModal(false);
      router.refresh();
    } catch (err: unknown) {
      toast({ title: "Failed to create coupon", description: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Create discount coupons synced directly with Stripe Billing.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#01696f] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#015257]"
        >
          <Plus className="size-4" />
          Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Code</th>
              <th className="px-6 py-3.5">Discount</th>
              <th className="px-6 py-3.5">Duration</th>
              <th className="px-6 py-3.5">Redemptions</th>
              <th className="px-6 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No coupons found.</td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80">
                  <td className="px-6 py-4 font-mono font-bold text-[#01696f]">{c.id}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {c.percentOff ? `${c.percentOff}% OFF` : `$${c.amountOff} OFF`}
                  </td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{c.duration}</td>
                  <td className="px-6 py-4 font-bold text-emerald-700">{c.timesRedeemed} redeemed</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${c.valid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                      {c.valid ? "Active" : "Expired"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="font-bold text-gray-900 text-sm">New Stripe Coupon</h3>
            <div>
              <label className="font-bold text-gray-700">Coupon Code:</label>
              <input
                type="text"
                required
                placeholder="e.g. FLASH50"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700">Percentage Discount (%):</label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={percentOff}
                onChange={(e) => setPercentOff(Number(e.target.value))}
                className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700">Duration:</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as "once" | "repeating" | "forever")}
                className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl"
              >
                <option value="once">Once</option>
                <option value="repeating">Repeating</option>
                <option value="forever">Forever</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-[#01696f] text-white font-bold rounded-xl disabled:opacity-50">
                {loading ? "Creating..." : "Create Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
