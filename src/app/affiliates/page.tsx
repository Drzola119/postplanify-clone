"use client";

import { DollarSign, Copy, Users, TrendingUp, Share2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

const STATS = [
  { label: "Total earned", value: "$2,481.20", icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
  { label: "Referrals", value: "12", icon: Users, color: "text-blue-600 bg-blue-50" },
  { label: "Pending", value: "$320.00", icon: TrendingUp, color: "text-amber-600 bg-amber-50" },
];

export default function AffiliatesPage() {
  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="Affiliate Program"
        subtitle="Earn 40% recurring for every customer you refer."
      />

      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 text-white mb-6">
        <p className="text-3xl font-extrabold leading-tight">Earn 40% recurring</p>
        <p className="mt-2 text-white/80 max-w-lg">For every customer you bring to PostPlanify, you earn 40% of their subscription — for as long as they stay subscribed.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 rounded-lg bg-white/15 backdrop-blur px-3 py-2 border border-white/20">
            <code className="flex-1 text-sm font-mono">postplanify.com/?ref=zack</code>
            <button type="button" className="inline-flex items-center justify-center size-7 rounded bg-white/20 hover:bg-white/30" aria-label="Copy link">
              <Copy className="size-3.5" />
            </button>
          </div>
          <button type="button" className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-100">
            <Share2 className="size-4" />
            Share
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center justify-center size-9 rounded-lg ${s.color}`}>
                  <Icon className="size-4" />
                </span>
                <p className="text-xs font-semibold text-zinc-500">{s.label}</p>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent referrals</h3>
          <button type="button" className="text-xs text-blue-600 hover:underline">View all</button>
        </div>
        <div className="divide-y divide-zinc-100">
          {[
            { name: "maria.k", status: "Paid", amount: "$79.00", date: "Jun 22, 2026" },
            { name: "techreview_er", status: "Pending", amount: "$79.00", date: "Jun 18, 2026" },
            { name: "designbymike", status: "Paid", amount: "$159.00", date: "Jun 14, 2026" },
            { name: "sarahc", status: "Paid", amount: "$79.00", date: "Jun 09, 2026" },
          ].map((r, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 items-center text-sm">
              <p className="font-semibold">{r.name}</p>
              <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {r.status}
              </span>
              <p className="font-semibold">{r.amount}</p>
              <p className="text-zinc-500">{r.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}