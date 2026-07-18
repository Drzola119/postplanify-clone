"use client";

import { cn } from "@/lib/utils";

export type ComposerMode = "standard" | "carousel" | "trial_reel" | "document";

interface ModeOption {
  id: ComposerMode;
  emoji: string;
  label: string;
  badge?: { text: string; color: "amber" | "blue" };
}

const MODES: ModeOption[] = [
  { id: "standard", emoji: "🖼️", label: "Standard" },
  { id: "carousel", emoji: "📑", label: "Carousel", badge: { text: "Instagram · Facebook · Threads", color: "blue" } },
  {
    id: "trial_reel",
    emoji: "⚡",
    label: "Trial Reel",
    badge: { text: "Instagram Only", color: "amber" },
  },
  {
    id: "document",
    emoji: "📄",
    label: "Document",
    badge: { text: "LinkedIn Only", color: "blue" },
  },
];

interface ComposerModeSelectorProps {
  mode: ComposerMode;
  onChange: (mode: ComposerMode) => void;
}

export function ComposerModeSelector({ mode, onChange }: ComposerModeSelectorProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mr-1 whitespace-nowrap">
          Post Type:
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {MODES.map((m) => {
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange(m.id)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium transition-all duration-200 border",
                  isActive
                    ? "bg-zinc-950 text-white border-zinc-950 shadow-sm ring-2 ring-zinc-950/20"
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
                )}
              >
                <span className="text-base leading-none">{m.emoji}</span>
                <span>{m.label}</span>
                {m.badge && (
                  <span
                    className={cn(
                      "absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap leading-none",
                      m.badge.color === "amber"
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    )}
                  >
                    {m.badge.text}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
