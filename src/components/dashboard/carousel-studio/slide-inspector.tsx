"use client";

import {
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Lock,
} from "lucide-react";
import type {
  CarouselSlideItem,
  ExtendedSlideType,
} from "@/lib/carousel-gen/types";

interface SlideInspectorProps {
  slide: CarouselSlideItem;
  slideIndex: number;
  onUpdateSlide: (updates: Partial<CarouselSlideItem>) => void;
  onApplyAIAction: (
    action: "rewrite" | "shorten" | "punch_up" | "translate" | "cta",
    targetLanguage?: "ar" | "fr",
  ) => void;
}

const SLIDE_ROLES: Array<{ id: ExtendedSlideType; label: string }> = [
  { id: "hook", label: "Hook / Cover" },
  { id: "stakes", label: "Stakes / Problem" },
  { id: "value", label: "Value / Insight" },
  { id: "receipts", label: "Receipts / Proof" },
  { id: "stats", label: "Statistic Callout" },
  { id: "cta", label: "Call to Action" },
  { id: "quote", label: "Quote" },
  { id: "comparison", label: "Comparison" },
  { id: "step", label: "Step" },
  { id: "checklist", label: "Checklist" },
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

      <fieldset
        disabled={slide.isLocked}
        className="p-4 space-y-5 disabled:opacity-60"
      >
        {/* Slide Role */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
            Slide Role
          </label>
          <select
            value={slide.type}
            onChange={(e) =>
              onUpdateSlide({ type: e.target.value as ExtendedSlideType })
            }
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
              onClick={() => onApplyAIAction("cta")}
              className="p-2 border border-zinc-700 rounded"
            >
              Suggest CTA
            </button>
            <button
              type="button"
              onClick={() => onApplyAIAction("rewrite")}
              className="p-2 border border-zinc-700 rounded"
            >
              Rewrite
            </button>
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
              aria-label="Align text left"
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
              aria-label="Align text center"
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
              aria-label="Align text right"
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

        <div className="space-y-3">
          <label className="block text-xs">
            Layout
            <select
              className="w-full bg-zinc-800 p-2 rounded"
              value={slide.layoutId || "split"}
              onChange={(e) =>
                onUpdateSlide({
                  layoutId: e.target.value as CarouselSlideItem["layoutId"],
                })
              }
            >
              {["centered", "split", "bold-headline"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          {(["displayFont", "bodyFont"] as const).map((field) => (
            <label key={field} className="block text-xs">
              {field === "displayFont" ? "Heading font" : "Body font"}
              <select
                className="w-full bg-zinc-800 p-2 rounded"
                value={slide[field] || ""}
                onChange={(e) =>
                  onUpdateSlide({ [field]: e.target.value || undefined })
                }
              >
                <option value="">Use deck font</option>
                <option>Noto Sans</option>
                <option>Noto Serif</option>
                <option>Noto Sans Arabic</option>
              </select>
            </label>
          ))}
          {(["backgroundColor", "textColor", "accentColor"] as const).map(
            (field) => (
              <label key={field} className="flex justify-between text-xs">
                {field}
                <input
                  type="color"
                  value={
                    slide[field] ||
                    (field === "backgroundColor" ? "#18181b" : "#ffffff")
                  }
                  onChange={(e) => onUpdateSlide({ [field]: e.target.value })}
                />
              </label>
            ),
          )}
          <label className="block text-xs">
            Text size: {Math.round((slide.fontSizeScale ?? 1) * 100)}%
            <input
              className="w-full"
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={slide.fontSizeScale ?? 1}
              onChange={(e) =>
                onUpdateSlide({ fontSizeScale: Number(e.target.value) })
              }
            />
          </label>
          <label className="block text-xs">
            Heading weight
            <select
              className="w-full bg-zinc-800 p-2"
              value={slide.fontWeight ?? 700}
              onChange={(e) =>
                onUpdateSlide({
                  fontWeight: Number(e.target.value) as 400 | 700,
                })
              }
            >
              <option value="400">Regular</option>
              <option value="700">Bold</option>
            </select>
          </label>
          <label className="block text-xs">
            Line height
            <input
              className="w-full"
              type="range"
              min="1"
              max="2"
              step="0.05"
              value={slide.lineHeight ?? 1.3}
              onChange={(e) =>
                onUpdateSlide({ lineHeight: Number(e.target.value) })
              }
            />
          </label>
          <label className="block text-xs">
            Letter spacing
            <input
              className="w-full"
              type="range"
              min="-2"
              max="8"
              step="0.5"
              value={slide.letterSpacing ?? 0}
              onChange={(e) =>
                onUpdateSlide({ letterSpacing: Number(e.target.value) })
              }
            />
          </label>
          {slide.type === "stats" && (
            <>
              <label className="block text-xs">
                Statistic value
                <input
                  className="w-full bg-zinc-800 p-2"
                  value={slide.statsValue || ""}
                  onChange={(e) =>
                    onUpdateSlide({ statsValue: e.target.value })
                  }
                />
              </label>
              <label className="block text-xs">
                Statistic label
                <input
                  className="w-full bg-zinc-800 p-2"
                  value={slide.statsLabel || ""}
                  onChange={(e) =>
                    onUpdateSlide({ statsLabel: e.target.value })
                  }
                />
              </label>
            </>
          )}
          {slide.type === "quote" && (
            <label className="block text-xs">
              Attribution
              <input
                className="w-full bg-zinc-800 p-2"
                value={slide.quoteAuthor || ""}
                onChange={(e) => onUpdateSlide({ quoteAuthor: e.target.value })}
              />
            </label>
          )}
          {slide.type === "checklist" && (
            <label className="block text-xs">
              Checklist (one item per line)
              <textarea
                className="w-full bg-zinc-800 p-2"
                value={(slide.bulletPoints || []).join("\n")}
                onChange={(e) =>
                  onUpdateSlide({ bulletPoints: e.target.value.split("\n") })
                }
              />
            </label>
          )}
          {slide.type === "comparison" && (
            <label className="block text-xs">
              Comparison (left | right, one pair per line)
              <textarea
                className="w-full bg-zinc-800 p-2"
                value={(slide.comparisonItems || [])
                  .map((r) => `${r.left} | ${r.right}`)
                  .join("\n")}
                onChange={(e) =>
                  onUpdateSlide({
                    comparisonItems: e.target.value.split("\n").map((line) => {
                      const [left, ...right] = line.split("|");
                      return { left, right: right.join("|") };
                    }),
                  })
                }
              />
            </label>
          )}
          <label className="block text-xs">
            Image fit
            <select
              className="w-full bg-zinc-800 p-2"
              value={slide.backgroundPosition || "cover"}
              onChange={(e) =>
                onUpdateSlide({
                  backgroundPosition: e.target
                    .value as CarouselSlideItem["backgroundPosition"],
                })
              }
            >
              {["cover", "contain", "top", "center", "bottom"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          {slide.isLegacyFlat && (
            <p className="text-xs text-amber-300">
              This slide is a flattened image.{" "}
              <button
                onClick={() =>
                  onUpdateSlide({
                    isLegacyFlat: false,
                    headline: "New headline",
                    backgroundImageUrl: slide.renderedImageUrl,
                    backgroundOpacity: 25,
                  })
                }
              >
                Create editable text over this image
              </button>
            </p>
          )}
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
            onChange={(e) =>
              onUpdateSlide({ backgroundImageUrl: e.target.value })
            }
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
                onChange={(e) =>
                  onUpdateSlide({ backgroundOpacity: Number(e.target.value) })
                }
                className="w-full accent-amber-500"
              />
            </div>
          )}
        </div>
      </fieldset>
    </div>
  );
}
