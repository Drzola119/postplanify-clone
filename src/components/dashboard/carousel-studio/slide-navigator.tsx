"use client";

import {
  Plus,
  Copy,
  Trash2,
  Lock,
  Unlock,
  MoveUp,
  MoveDown,
} from "lucide-react";
import type { CarouselSlideItem } from "@/lib/carousel-gen/types";

interface SlideNavigatorProps {
  slides: CarouselSlideItem[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (fromIndex: number, toIndex: number) => void;
  onToggleLock: (index: number) => void;
}

export function SlideNavigator({
  slides,
  activeSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onToggleLock,
}: SlideNavigatorProps) {
  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 border-r border-zinc-800">
      {/* Top Header */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Slides ({slides.length})
        </span>
        <button
          type="button"
          disabled={slides.length >= 30}
          onClick={onAddSlide}
          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Slide
        </button>
      </div>

      {/* Slide Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {slides.map((slide, idx) => {
          const isActive = idx === activeSlideIndex;
          return (
            <div
              key={slide.id}
              draggable={!slide.isLocked}
              onDragStart={(e) =>
                e.dataTransfer.setData("text/plain", String(idx))
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const from = Number(e.dataTransfer.getData("text/plain"));
                if (Number.isInteger(from) && from >= 0 && from < slides.length)
                  onMoveSlide(from, idx);
              }}
              tabIndex={0}
              role="button"
              aria-label={`Select slide ${idx + 1}`}
              aria-pressed={isActive}
              onKeyDown={(e) => {
                if (
                  e.target === e.currentTarget &&
                  (e.key === "Enter" || e.key === " ")
                ) {
                  e.preventDefault();
                  onSelectSlide(idx);
                }
              }}
              onClick={() => onSelectSlide(idx)}
              className={`group relative p-2.5 rounded-xl border transition cursor-pointer ${
                isActive
                  ? "bg-zinc-800 border-amber-500/80 shadow-md shadow-amber-500/10"
                  : "bg-zinc-900/80 hover:bg-zinc-800/60 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {/* Header inside thumbnail card */}
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      isActive
                        ? "bg-amber-500 text-zinc-950"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-zinc-300 capitalize truncate max-w-[90px]">
                    {slide.type}
                  </span>
                </div>

                {/* Quick Slide Actions */}
                <div className="flex items-center gap-1 opacity-100 transition">
                  <button
                    type="button"
                    title={slide.isLocked ? "Unlock slide" : "Lock slide"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(idx);
                    }}
                    className={`p-1 rounded hover:bg-zinc-700 ${
                      slide.isLocked ? "text-amber-400" : "text-zinc-400"
                    }`}
                  >
                    {slide.isLocked ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </button>

                  <button
                    type="button"
                    title="Duplicate slide"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSlide(idx);
                    }}
                    className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {slides.length > 2 && (
                    <button
                      type="button"
                      title="Delete slide"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(idx);
                      }}
                      className="p-1 rounded hover:bg-red-950/60 text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Headline preview */}
              <p className="text-xs font-medium text-zinc-200 line-clamp-2 leading-snug">
                {slide.headline || "Untitled slide"}
              </p>

              {/* Reorder arrows */}
              <div className="flex items-center justify-end gap-1 mt-2 pt-1 border-t border-zinc-800/60 opacity-100 transition">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveSlide(idx, idx - 1);
                  }}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-20"
                >
                  <MoveUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={idx === slides.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveSlide(idx, idx + 1);
                  }}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-20"
                >
                  <MoveDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
