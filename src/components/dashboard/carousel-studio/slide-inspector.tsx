"use client";

import {
  Type,
  Palette,
  Image as ImageIcon,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Lock,
} from "lucide-react";
import type { CarouselSlideItem, ExtendedSlideType } from "@/lib/carousel-gen/types";

interface SlideInspectorProps {
  slide: CarouselSlideItem;
  slideIndex: number;
  onUpdateSlide: (updates: Partial<CarouselSlideItem>) => void;
  onApplyAIAction: (action: "shorten" | "punch_up" | "translate", targetLanguage?: "ar" | "fr") => void;
}

const SLIDE_ROLES: Array<{ id: ExtendedSlideType; label: string }> = [
  { id: "hook", label: "Hook / Cover" },
  { id: "stakes", label: "Stakes / Problem" },
  { id: "value", label: "Value / Insight" },
  { id: "receipts", label: "Receipts / Proof" },
  { id: "stats", label: "Statistic Callout" },
  { id: "cta", label: "Call to Action" },
];

export function SlideInspector({
  slide,
  slideIndex,
  onUpdateSlide,
  onApplyAIAction,
}: SlideInspectorProps) {
  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
      {/* Top Header */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900/90 backdrop-blur z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          Slide {slideIndex + 1} Inspector
        </span>
        {slide.isLocked && (
          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1">
            <Lock className="w-3 h-3" /> Locked
          </span>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Slide Role */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
            Slide Role
          </label>
          <select
            value={slide.type}
            onChange={(e) => onUpdateSlide({ type: e.target.value as ExtendedSlideType })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {SLIDE_ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subheadline / Kicker */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
            Kicker / Category Tag
          </label>
          <input
            type="text"
            placeholder="e.g. Masterclass, Step 01..."
            value={slide.subheadline || ""}
            onChange={(e) => onUpdateSlide({ subheadline: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Headline */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Headline
            </label>
            <span className="text-[10px] text-zinc-500">
              {(slide.headline || "").length}/120
            </span>
          </div>
          <textarea
            rows={3}
            placeholder="Enter slide headline..."
            value={slide.headline || ""}
            onChange={(e) => onUpdateSlide({ headline: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 resize-none leading-snug"
          />
        </div>

        {/* Body Copy */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Supporting Body
            </label>
            <span className="text-[10px] text-zinc-500">
              {(slide.body || "").length}/220
            </span>
          </div>
          <textarea
            rows={4}
            placeholder="Supporting explanations or takeaways..."
            value={slide.body || ""}
            onChange={(e) => onUpdateSlide({ body: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
          />
        </div>

        {/* AI Quick Actions on this slide */}
        <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            AI Slide Assistant
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onApplyAIAction("shorten")}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-[11px] font-medium text-zinc-200 transition"
            >
              ✂️ Shorten Text
            </button>
            <button
              type="button"
              onClick={() => onApplyAIAction("punch_up")}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-[11px] font-medium text-zinc-200 transition"
            >
              🔥 Punch Up Hook
            </button>
            <button
              type="button"
              onClick={() => onApplyAIAction("translate", "ar")}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-[11px] font-medium text-zinc-200 transition"
            >
              🌐 Arabic (RTL)
            </button>
            <button
              type="button"
              onClick={() => onApplyAIAction("translate", "fr")}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-[11px] font-medium text-zinc-200 transition"
            >
              🌐 French
            </button>
          </div>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
            Text Alignment
          </label>
          <div className="grid grid-cols-3 gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700">
            <button
              type="button"
              onClick={() => onUpdateSlide({ textAlign: "left" })}
              className={`py-1.5 rounded flex items-center justify-center text-xs font-semibold ${
                slide.textAlign === "left" || !slide.textAlign
                  ? "bg-amber-500 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateSlide({ textAlign: "center" })}
              className={`py-1.5 rounded flex items-center justify-center text-xs font-semibold ${
                slide.textAlign === "center"
                  ? "bg-amber-500 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateSlide({ textAlign: "right" })}
              className={`py-1.5 rounded flex items-center justify-center text-xs font-semibold ${
                slide.textAlign === "right"
                  ? "bg-amber-500 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Background Image / Texture */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
            Background Media URL
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={slide.backgroundImageUrl || ""}
            onChange={(e) => onUpdateSlide({ backgroundImageUrl: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
          />

          {slide.backgroundImageUrl && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Opacity</span>
                <span>{slide.backgroundOpacity ?? 20}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={slide.backgroundOpacity ?? 20}
                onChange={(e) => onUpdateSlide({ backgroundOpacity: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
