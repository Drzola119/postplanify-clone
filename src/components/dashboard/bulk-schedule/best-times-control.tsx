"use client";

import * as React from "react";
import { Sparkles, Clock, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformId } from "@/lib/platforms";
import type { CountryConfig } from "@/data/scheduling/countries";
import type { SmartStrategy } from "@/services/scheduling/generate-smart-schedule";
import { BestTimesPopover } from "./best-times-popover";

interface BestTimesControlProps {
  mode: "smart" | "manual";
  onModeChange: (mode: "smart" | "manual") => void;
  manualTime: string;
  onManualTimeChange: (time: string) => void;
  country: CountryConfig;
  startDate: string;
  platforms: PlatformId[];
  postsPerDay: number;
  strategy: SmartStrategy;
  onStrategyChange: (strategy: SmartStrategy) => void;
  onApplySmartSchedule: () => void;
  summaryText?: string;
  className?: string;
}

export function BestTimesControl({
  mode,
  onModeChange,
  manualTime,
  onManualTimeChange,
  country,
  startDate,
  platforms,
  postsPerDay,
  strategy,
  onStrategyChange,
  onApplySmartSchedule,
  summaryText,
  className,
}: BestTimesControlProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  return (
    <div className={cn("relative inline-flex items-center gap-1.5", className)}>
      {mode === "smart" ? (
        <div className="relative">
          <div className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50/50 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setPopoverOpen((v) => !v)}
              aria-expanded={popoverOpen}
              className="inline-flex items-center gap-1.5 h-8 rounded-lg px-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100/70 transition-colors cursor-pointer"
            >
              <Sparkles className="size-3.5 text-amber-600 fill-amber-400" />
              <span>{summaryText || "✨ Smart Best Times"}</span>
              <ChevronDown className="size-3 text-amber-700" />
            </button>

            <button
              type="button"
              onClick={() => onModeChange("manual")}
              title="Switch to Manual clock time"
              className="h-8 px-2 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-white/80 transition-colors cursor-pointer"
            >
              Manual
            </button>
          </div>

          <BestTimesPopover
            open={popoverOpen}
            onClose={() => setPopoverOpen(false)}
            country={country}
            startDate={startDate}
            platforms={platforms}
            postsPerDay={postsPerDay}
            strategy={strategy}
            onStrategyChange={onStrategyChange}
            onApply={onApplySmartSchedule}
          />
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5">
          <input
            type="time"
            value={manualTime}
            onChange={(e) => onManualTimeChange(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <button
            type="button"
            onClick={() => onModeChange("smart")}
            title="Switch to Smart Best Times"
            className="inline-flex items-center gap-1 h-9 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <Sparkles className="size-3 text-amber-500 fill-amber-400" />
            <span className="hidden lg:inline">Smart</span>
          </button>
        </div>
      )}
    </div>
  );
}
