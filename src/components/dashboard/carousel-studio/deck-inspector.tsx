"use client";

import {
  Palette,
  Sparkles,
  ShieldCheck,
  Ratio,
  Sliders,
  FileText,
  Layers,
} from "lucide-react";
import type {
  CarouselDocument,
  CarouselAspectRatio,
  BrandKit,
} from "@/lib/carousel-gen/types";

interface DeckInspectorProps {
  deck: CarouselDocument;
  brandKits: BrandKit[];
  showSafeZones: boolean;
  onToggleSafeZones: () => void;
  onUpdateDeck: (updates: Partial<CarouselDocument>) => void;
  onSelectBrandKit: (kitId: string) => void;
}

export function DeckInspector({
  deck,
  brandKits,
  showSafeZones,
  onToggleSafeZones,
  onUpdateDeck,
  onSelectBrandKit,
}: DeckInspectorProps) {
  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900/90 backdrop-blur z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          Global Deck Settings
        </span>
      </div>

      <div className="p-4 space-y-5">
        {/* Aspect Ratio Presets */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
            Canvas Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["1:1", "4:5", "9:16"] as CarouselAspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => onUpdateDeck({ aspectRatio: ratio })}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                  deck.aspectRatio === ratio
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <span>{ratio}</span>
                <span className="text-[9px] font-normal text-zinc-500">
                  {ratio === "1:1" ? "Square" : ratio === "4:5" ? "Portrait" : "Story"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Brand Kit Selector */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
            Apply Brand Kit
          </label>
          <select
            value={deck.brandKitId || ""}
            onChange={(e) => onSelectBrandKit(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">Default Brand (Zinc / Archivo)</option>
            {brandKits.map((kit) => (
              <option key={kit.id} value={kit.id}>
                {kit.name}
              </option>
            ))}
          </select>
        </div>

        {/* Safe Zone Overlay Toggle */}
        <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">
              Safe Zone Guides
            </span>
            <span className="text-[10px] text-zinc-400">
              Highlight Instagram 1:1 square crop
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleSafeZones}
            className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-300 ${
              showSafeZones ? "bg-amber-500 justify-end" : "bg-zinc-700 justify-start"
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition" />
          </button>
        </div>

        {/* Caption & Platform Overrides */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
            Post Caption
          </label>
          <textarea
            rows={5}
            placeholder="Write your high-converting caption here..."
            value={deck.caption || ""}
            onChange={(e) => onUpdateDeck({ caption: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
