"use client";

import { Plus, Eye, Share2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

const LINKS = [
  { id: 1, title: "Latest blog post", url: "postplanify.com/blog", icon: "📝", clicks: 1247 },
  { id: 2, title: "Free trial — PostPlanify", url: "postplanify.com/signup", icon: "🚀", clicks: 892 },
  { id: 3, title: "YouTube channel", url: "youtube.com/@nicklorance", icon: "▶️", clicks: 654 },
  { id: 4, title: "Shop my favorites", url: "shopmeagent.com", icon: "🛍", clicks: 421 },
];

export default function LinkInBioPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Link in Bio"
        subtitle="One page. All your links. Styled to match your brand."
        cta={
          <div className="flex items-center gap-2">
            <button type="button" className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50">
              <Eye className="size-4" />
              Preview
            </button>
            <button type="button" className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium">
              <Share2 className="size-4" />
              Publish
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Header</p>
              <button type="button" className="text-xs text-blue-600 hover:underline">Edit profile</button>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">Z</div>
              <div className="flex-1">
                <p className="text-base font-bold">Zack Wick</p>
                <p className="text-sm text-zinc-500">postplanify.com/zack</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between">
              <p className="text-sm font-semibold">Links</p>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white px-3 h-8 text-xs font-medium">
                <Plus className="size-3" />
                Add link
              </button>
            </div>
            <div className="divide-y divide-zinc-100">
              {LINKS.map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50">
                  <span className="text-lg">{l.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{l.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{l.url}</p>
                  </div>
                  <span className="text-xs text-zinc-500">{l.clicks.toLocaleString()} clicks</span>
                  <button type="button" className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500" aria-label="Edit">
                    <ExternalLink className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-6">
          <div className="mx-auto max-w-[280px] rounded-3xl bg-white shadow-xl overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600" />
            <div className="px-5 pb-5 -mt-12">
              <div className="size-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-4 border-white flex items-center justify-center text-white text-2xl font-bold">
                Z
              </div>
              <p className="mt-3 text-base font-bold text-center">Zack Wick</p>
              <p className="text-xs text-zinc-500 text-center mt-0.5">postplanify.com/zack</p>
              <div className="mt-5 space-y-2">
                {LINKS.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 hover:bg-zinc-50 cursor-pointer">
                    <span className="text-lg">{l.icon}</span>
                    <span className="text-sm font-semibold flex-1 truncate">{l.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}