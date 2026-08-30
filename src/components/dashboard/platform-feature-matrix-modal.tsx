"use client";

import { useState, useMemo } from "react";
import {
  X,
  Check,
  Search,
  Sparkles,
  Info,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProPlatformIcon } from "@/components/dashboard/pro-platform-icon";
import type { PlatformId } from "@/lib/platforms";

export interface PlatformFeatureRow {
  id: PlatformId;
  name: string;
  text: boolean;
  image: boolean;
  singleVideo: boolean;
  feedReels: string; // e.g. "Reels", "Feed / Reels", "Feed", "Pins", "Submissions", "Updates", "Channel", etc.
  stories: boolean;
  shortsLong: string; // "Shorts & Long", "Long", "None"
  carouselsImages: string; // "Up to 10", "Up to 4", "Up to 5", "Photo Mode", "Galleries", "Media Group", "Embeds", "None"
  mixedCarousels: string; // "Up to 10", "None"
  carouselsVideos: string; // "Up to 10", "None"
  documents: string; // "Native Viewer", "None"
}

export const PLATFORM_FEATURE_MATRIX: PlatformFeatureRow[] = [
  {
    id: "instagram",
    name: "Instagram",
    text: false,
    image: true,
    singleVideo: true,
    feedReels: "Reels",
    stories: true,
    shortsLong: "None",
    carouselsImages: "Up to 10",
    mixedCarousels: "Up to 10",
    carouselsVideos: "Up to 10",
    documents: "None",
  },
  {
    id: "facebook",
    name: "Facebook",
    text: true,
    image: true,
    singleVideo: true,
    feedReels: "Feed / Reels",
    stories: true,
    shortsLong: "Long",
    carouselsImages: "Up to 10",
    mixedCarousels: "None",
    carouselsVideos: "None",
    documents: "None",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    text: true,
    image: true,
    singleVideo: true,
    feedReels: "Feed",
    stories: false,
    shortsLong: "Long",
    carouselsImages: "Up to 10",
    mixedCarousels: "None",
    carouselsVideos: "None",
    documents: "Native Viewer",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    text: true,
    image: true,
    singleVideo: true,
    feedReels: "Feed",
    stories: false,
    shortsLong: "Long",
    carouselsImages: "Up to 4",
    mixedCarousels: "None",
    carouselsVideos: "None",
    documents: "None",
  },
  {
    id: "threads",
    name: "Threads",
    text: true,
    image: true,
    singleVideo: true,
    feedReels: "Feed",
    stories: false,
    shortsLong: "None",
    carouselsImages: "Up to 10",
    mixedCarousels: "Up to 10",
    carouselsVideos: "Up to 10",
    documents: "None",
  },
  {
    id: "tiktok",
    name: "TikTok",
    text: false,
    image: true,
    singleVideo: true,
    feedReels: "Feed",
    stories: false,
    shortsLong: "Long",
    carouselsImages: "Photo Mode (Up to 35)",
    mixedCarousels: "None",
    carouselsVideos: "None",
    documents: "None",
  },
  {
    id: "youtube",
    name: "YouTube",
    text: false,
    image: false,
    singleVideo: true,
    feedReels: "None",
    stories: false,
    shortsLong: "Shorts & Long",
    carouselsImages: "None",
    mixedCarousels: "None",
    carouselsVideos: "None",
    documents: "None",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    text: false,
    image: true,
    singleVideo: true,
    feedReels: "Pins",
    stories: false,
    shortsLong: "None",
    carouselsImages: "Up to 5",
    mixedCarousels: "None",
    carouselsVideos: "None",
    documents: "None",
  },
  {
    id: "reddit",
    name: "Reddit",
    text: true,
    image: true,
    singleVideo: true,
    feedReels: "Submissions",
    stories: false,
    shortsLong: "Long",
    carouselsImages: "None",
    mixedCarousels: "None",
    carouselsVideos: "None",
    documents: "None",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    text: true,
    image: true,
    singleVideo: true,
    feedReels: "Feed",
    stories: false,
    shortsLong: "None",
    carouselsImages: "Up to 4",
    mixedCarousels: "None",
    carouselsVideos: "None",
    documents: "None",
  },
  {
    id: "google_business",
    name: "Google Business",
    text: true,
    image: true,
    singleVideo: true,
    feedReels: "Updates",
    stories: false,
    shortsLong: "None",
    carouselsImages: "None",
    mixedCarousels: "None",
    carouselsVideos: "None",
    documents: "None",
  },
  {
    id: "telegram",
    name: "Telegram",
    text: true,
    image: true,
    singleVideo: true,
    feedReels: "Channel / Chat",
    stories: false,
    shortsLong: "Long",
    carouselsImages: "Media Group (Up to 10)",
    mixedCarousels: "None",
    carouselsVideos: "None",
    documents: "None",
  },
  {
    id: "discord",
    name: "Discord",
    text: true,
    image: true,
    singleVideo: true,
    feedReels: "Channel Post",
    stories: false,
    shortsLong: "Long",
    carouselsImages: "Embeds (Up to 10)",
    mixedCarousels: "None",
    carouselsVideos: "None",
    documents: "None",
  },
];

export interface PlatformFeatureMatrixModalProps {
  open: boolean;
  onClose: () => void;
}

export function PlatformFeatureMatrixModal({ open, onClose }: PlatformFeatureMatrixModalProps) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "carousel" | "stories" | "video" | "doc" | "community">("all");

  const filtered = useMemo(() => {
    return PLATFORM_FEATURE_MATRIX.filter((row) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesName = row.name.toLowerCase().includes(q);
        const matchesPlacement = row.feedReels.toLowerCase().includes(q);
        if (!matchesName && !matchesPlacement) return false;
      }
      if (filterType === "carousel") {
        return row.carouselsImages !== "None" || row.mixedCarousels !== "None";
      }
      if (filterType === "stories") {
        return row.stories;
      }
      if (filterType === "video") {
        return row.singleVideo;
      }
      if (filterType === "doc") {
        return row.documents !== "None";
      }
      if (filterType === "community") {
        return row.id === "twitter";
      }
      return true;
    });
  }, [query, filterType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="size-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">
                  Upload-Post API Platform Feature Matrix
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  Live API Parity
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Exact supported media formats, carousel caps, and placement rules across all 13 platforms.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="p-3 sm:p-4 border-b border-zinc-100 bg-white flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search platform by name..."
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-semibold text-zinc-500 mr-1 hidden sm:inline">Filter by:</span>
            {[
              { id: "all" as const, label: "All Formats" },
              { id: "carousel" as const, label: "Carousels" },
              { id: "stories" as const, label: "Stories" },
              { id: "doc" as const, label: "Documents (PDF)" },
              { id: "community" as const, label: "Communities" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                  filterType === tab.id
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Matrix Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-50/70">
                <th className="py-2.5 px-3 rounded-l-lg">Platform</th>
                <th className="py-2.5 px-2 text-center">Text</th>
                <th className="py-2.5 px-2 text-center">Image</th>
                <th className="py-2.5 px-2 text-center">Video</th>
                <th className="py-2.5 px-2.5">Feed / Placement</th>
                <th className="py-2.5 px-2 text-center">Stories</th>
                <th className="py-2.5 px-2.5 text-center">Shorts / Long</th>
                <th className="py-2.5 px-2.5 text-center">Carousels (Images)</th>
                <th className="py-2.5 px-2.5 text-center">Mixed Carousels</th>
                <th className="py-2.5 px-2.5 text-center">Carousels (Videos)</th>
                <th className="py-2.5 px-3 text-center">Documents</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Communities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50/80 transition-colors">
                  {/* Platform */}
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ProPlatformIcon platform={row.id} size={20} />
                      <span>{row.name}</span>
                    </div>
                  </td>

                  {/* Text */}
                  <td className="py-2.5 px-2 text-center">
                    {row.text ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-200">
                        <X className="size-3 stroke-[3]" />
                      </span>
                    )}
                  </td>

                  {/* Image */}
                  <td className="py-2.5 px-2 text-center">
                    {row.image ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-200">
                        <X className="size-3 stroke-[3]" />
                      </span>
                    )}
                  </td>

                  {/* Single Video */}
                  <td className="py-2.5 px-2 text-center">
                    {row.singleVideo ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-200">
                        <X className="size-3 stroke-[3]" />
                      </span>
                    )}
                  </td>

                  {/* Feed / Placement */}
                  <td className="py-2.5 px-2.5 whitespace-nowrap">
                    {row.feedReels !== "None" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 text-zinc-800 px-2 py-0.5 text-[11px] font-medium border border-zinc-200">
                        <Check className="size-2.5 text-emerald-600" /> {row.feedReels}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>

                  {/* Stories */}
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    {row.stories ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 px-2 py-0.5 text-[10px] font-bold border border-purple-200">
                        <Check className="size-2.5" /> STORIES
                      </span>
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-50 text-red-400 border border-red-100">
                        <X className="size-3 stroke-[3]" />
                      </span>
                    )}
                  </td>

                  {/* Shorts / Long */}
                  <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                    {row.shortsLong === "Shorts & Long" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold border border-blue-200">
                        ✔️ Shorts & Long
                      </span>
                    ) : row.shortsLong === "Long" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 text-zinc-700 px-2 py-0.5 text-[10px] font-medium border border-zinc-200">
                        ❌ / ✔️ Long
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-[11px]">❌ / ❌</span>
                    )}
                  </td>

                  {/* Carousels (Images) */}
                  <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                    {row.carouselsImages !== "None" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                        <Check className="size-2.5" /> {row.carouselsImages}
                      </span>
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-50 text-red-400 border border-red-100">
                        <X className="size-3 stroke-[3]" />
                      </span>
                    )}
                  </td>

                  {/* Mixed Carousels */}
                  <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                    {row.mixedCarousels !== "None" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] font-bold border border-indigo-200">
                        <Check className="size-2.5" /> {row.mixedCarousels}
                      </span>
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-50 text-red-400 border border-red-100">
                        <X className="size-3 stroke-[3]" />
                      </span>
                    )}
                  </td>

                  {/* Carousels (Videos) */}
                  <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                    {row.carouselsVideos !== "None" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] font-bold border border-indigo-200">
                        <Check className="size-2.5" /> {row.carouselsVideos}
                      </span>
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-50 text-red-400 border border-red-100">
                        <X className="size-3 stroke-[3]" />
                      </span>
                    )}
                  </td>

                  {/* Documents (PDF) */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {row.documents !== "None" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 text-blue-800 px-2 py-0.5 text-[10px] font-bold border border-blue-200">
                        <FileText className="size-2.5" /> {row.documents}
                      </span>
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-50 text-red-400 border border-red-100">
                        <X className="size-3 stroke-[3]" />
                      </span>
                    )}
                  </td>

                  {/* Community publishing */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {row.id === "twitter" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 text-sky-800 px-2 py-0.5 text-[10px] font-bold border border-sky-200">
                        <Check className="size-2.5" /> X Community ID
                      </span>
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-50 text-red-400 border border-red-100">
                        <X className="size-3 stroke-[3]" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer Notes */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <Info className="size-3.5 text-zinc-400 shrink-0" />
            <span>
              All Upload-Post API limits and requirements are automatically enforced during composition & scheduling.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-8 rounded-xl bg-zinc-900 text-white font-bold hover:bg-black cursor-pointer shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
