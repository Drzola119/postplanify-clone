"use client";

import { ListChecks, Clock, Play, Pause, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

const QUEUE = [
  { id: 1, post: "Summer launch teaser", account: "📷 @brand.ig", scheduled: "Today 3:42 PM", status: "queued" },
  { id: 2, post: "Customer spotlight: Maria", account: "🐦 @brand.tw", scheduled: "Today 5:00 PM", status: "queued" },
  { id: 3, post: "Friday motivation quote", account: "🧵 @brand.th", scheduled: "Today 6:30 PM", status: "queued" },
  { id: 4, post: "Product demo reel", account: "🎵 @brand.tt", scheduled: "Tomorrow 9:00 AM", status: "queued" },
  { id: 5, post: "Weekly newsletter", account: "💼 @brand.li", scheduled: "Tomorrow 10:15 AM", status: "queued" },
];

export default function PostingQueuePage() {
  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="Posting Queue"
        subtitle="Posts queued and waiting to publish, in the order they'll go live."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Queued", value: "47", icon: ListChecks, color: "text-blue-600 bg-blue-50" },
          { label: "Publishing now", value: "2", icon: Play, color: "text-emerald-600 bg-emerald-50" },
          { label: "Paused", value: "3", icon: Pause, color: "text-amber-600 bg-amber-50" },
        ].map((s) => {
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

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <p className="text-sm font-semibold">Up next</p>
          <button type="button" className="text-xs text-red-600 hover:underline flex items-center gap-1">
            <Trash2 className="size-3" />
            Clear queue
          </button>
        </div>
        <div className="divide-y divide-zinc-100">
          {QUEUE.map((q) => (
            <div key={q.id} className="grid grid-cols-[1fr_180px_180px_120px] gap-3 px-5 py-3 items-center text-sm">
              <p className="font-semibold truncate">{q.post}</p>
              <p className="text-zinc-600">{q.account}</p>
              <p className="text-zinc-600 inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-zinc-400" />
                {q.scheduled}
              </p>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
                <Clock className="size-3" />
                queued
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}