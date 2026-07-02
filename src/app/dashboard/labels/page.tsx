"use client";

import { Tag, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

const LABELS = [
  { name: "Q3 Launch", color: "bg-blue-500", posts: 24 },
  { name: "Evergreen", color: "bg-emerald-500", posts: 142 },
  { name: "Holiday promo", color: "bg-rose-500", posts: 18 },
  { name: "Educational", color: "bg-amber-500", posts: 56 },
  { name: "Behind the scenes", color: "bg-violet-500", posts: 31 },
  { name: "Testimonial", color: "bg-cyan-500", posts: 12 },
];

const COLORS = ["bg-zinc-500", "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500", "bg-blue-500", "bg-violet-500", "bg-pink-500", "bg-rose-500"];

export default function LabelsPage() {
  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="Labels"
        subtitle="Organize posts into campaigns and themes."
        cta={
          <button type="button" className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium">
            <Plus className="size-4" />
            New label
          </button>
        }
      />

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px] gap-3 px-5 py-3 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          <div>Name</div>
          <div>Posts</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-zinc-100">
          {LABELS.map((l) => (
            <div key={l.name} className="grid grid-cols-[1fr_120px_120px] gap-3 px-5 py-3 items-center text-sm">
              <div className="flex items-center gap-2.5">
                <span className={`size-3 rounded-full ${l.color}`} />
                <Tag className="size-3.5 text-zinc-400" />
                <p className="font-semibold">{l.name}</p>
              </div>
              <p className="text-zinc-600">{l.posts} posts</p>
              <div className="flex items-center justify-end gap-1">
                {COLORS.slice(0, 5).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`size-5 rounded-full ${c} hover:ring-2 hover:ring-zinc-300`}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}