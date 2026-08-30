"use client";

import {
  AlignLeft,
  FileText,
  GalleryHorizontal,
  Image as ImageIcon,
  Images,
  Layers3,
  MessageCircleMore,
  PlaySquare,
  Smartphone,
  Video,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BulkContentType, CarouselMediaMode } from "@/lib/bulk-schedule/content-types";

const CONTENT_TYPES: Array<{
  id: BulkContentType;
  label: string;
  hint: string;
  icon: React.ReactNode;
}> = [
  { id: "text", label: "Text post", hint: "No media", icon: <AlignLeft className="size-4" /> },
  { id: "image", label: "Image post", hint: "Single image", icon: <ImageIcon className="size-4" /> },
  { id: "long_video", label: "Long video", hint: "Standard video", icon: <Video className="size-4" /> },
  { id: "short_video", label: "Shorts & Reels", hint: "Short-form video", icon: <PlaySquare className="size-4" /> },
  { id: "story", label: "Stories", hint: "Instagram · Facebook", icon: <Smartphone className="size-4" /> },
  { id: "trial_reel", label: "Trial Reel", hint: "Instagram", icon: <Zap className="size-4 text-amber-500" /> },
  { id: "carousel", label: "Carousel", hint: "2+ media items", icon: <GalleryHorizontal className="size-4" /> },
  { id: "document", label: "Document", hint: "LinkedIn", icon: <FileText className="size-4" /> },
  { id: "community", label: "X Community", hint: "Community ID required", icon: <MessageCircleMore className="size-4" /> },
];

const CAROUSEL_MODES: Array<{ id: CarouselMediaMode; label: string; icon: React.ReactNode }> = [
  { id: "images", label: "Images only", icon: <Images className="size-3.5" /> },
  { id: "videos", label: "Videos only", icon: <Video className="size-3.5" /> },
  { id: "mixed", label: "Images + videos", icon: <Layers3 className="size-3.5" /> },
];

interface BulkContentTypeSelectorProps {
  value: BulkContentType;
  carouselMode: CarouselMediaMode;
  onChange: (value: BulkContentType) => void;
  onCarouselModeChange: (value: CarouselMediaMode) => void;
}

export function BulkContentTypeSelector({
  value,
  carouselMode,
  onChange,
  onCarouselModeChange,
}: BulkContentTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-zinc-900">What are you planning?</p>
          <p className="text-[11px] text-zinc-500">Choosing a format automatically selects every compatible connected platform.</p>
        </div>
        <span className="hidden sm:inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
          Smart platform selection
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-2" role="radiogroup" aria-label="Content type">
        {CONTENT_TYPES.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.id)}
              className={cn(
                "min-h-[68px] rounded-xl border px-2.5 py-2 text-left transition-all",
                active
                  ? "border-zinc-950 bg-zinc-950 text-white shadow-sm ring-2 ring-zinc-950/15"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold">
                {option.icon}
                {option.label}
              </span>
              <span className={cn("mt-1 block text-[10px] leading-tight", active ? "text-zinc-300" : "text-zinc-500")}>
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>

      {value === "carousel" ? (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-2.5">
          <p className="mb-2 text-[11px] font-bold text-indigo-950">Choose the carousel media</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Carousel media type">
            {CAROUSEL_MODES.map((option) => {
              const active = carouselMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onCarouselModeChange(option.id)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-colors",
                    active
                      ? "border-indigo-700 bg-indigo-700 text-white"
                      : "border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-100",
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
