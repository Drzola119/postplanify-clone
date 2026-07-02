"use client";

import { Hash, Plus, Copy, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

const SETS = [
  { id: 1, name: "Launch day", tags: ["#newproduct", "#launch", "#comingsoon", "#innovation", "#startup"], posts: 12 },
  { id: 2, name: "Fitness brand", tags: ["#fitness", "#workout", "#gym", "#fitfam", "#healthylife"], posts: 47 },
  { id: 3, name: "Travel content", tags: ["#travel", "#wanderlust", "#explore", "#adventure", "#travelgram"], posts: 28 },
];

const TRENDING = [
  { tag: "#AIRevolution", uses: "12.4K", change: "+182%" },
  { tag: "#SustainableLiving", uses: "8.1K", change: "+24%" },
  { tag: "#ProductivityHacks", uses: "6.7K", change: "+15%" },
];

export default function HashtagsPage() {
  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="Hashtags"
        subtitle="Save hashtag sets so you never have to retype them."
        cta={
          <button type="button" className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium">
            <Plus className="size-4" />
            New set
          </button>
        }
      />

      <div className="space-y-4">
        {SETS.map((s) => (
          <div key={s.id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Hash className="size-4 text-zinc-500" />
                <p className="text-sm font-semibold">{s.name}</p>
                <span className="text-xs text-zinc-500">{s.posts} posts</span>
              </div>
              <button type="button" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Copy className="size-3" />
                Copy all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {s.tags.map((t) => (
                <span key={t} className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-emerald-600" />
            <p className="text-sm font-semibold">Trending now</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {TRENDING.map((t) => (
              <div key={t.tag} className="flex items-center justify-between py-2.5">
                <p className="text-sm font-semibold">{t.tag}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">{t.uses} posts today</span>
                  <span className="text-xs font-semibold text-emerald-600">{t.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}