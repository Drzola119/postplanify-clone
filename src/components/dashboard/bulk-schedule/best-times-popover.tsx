"use client";

import * as React from "react";
import { Sparkles, X, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformId } from "@/lib/platforms";
import { getPlatform } from "@/lib/platforms";
import type { CountryConfig } from "@/data/scheduling/countries";
import type { SmartStrategy } from "@/services/scheduling/generate-smart-schedule";
import { defaultBenchmarkProvider, getDayOfWeekInTimezone } from "@/services/scheduling/recommendation-provider";

interface BestTimesPopoverProps {
  open: boolean;
  onClose: () => void;
  country: CountryConfig;
  startDate: string;
  platforms: PlatformId[];
  postsPerDay: number;
  strategy: SmartStrategy;
  onStrategyChange: (s: SmartStrategy) => void;
  onApply: () => void;
  className?: string;
}

export function BestTimesPopover({
  open,
  onClose,
  country,
  startDate,
  platforms,
  postsPerDay,
  strategy,
  onStrategyChange,
  onApply,
  className,
}: BestTimesPopoverProps) {
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) && open) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const dow = React.useMemo(
    () => getDayOfWeekInTimezone(startDate, country.timezone),
    [startDate, country.timezone]
  );

  const recommendations = React.useMemo(() => {
    return defaultBenchmarkProvider.getRecommendationsSync({
      country,
      platforms,
      date: startDate,
      postsPerDay,
    });
  }, [country, platforms, startDate, postsPerDay]);

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      className={cn(
        "absolute left-0 top-full mt-2 z-50 w-[380px] max-w-[95vw] rounded-2xl border border-zinc-200 bg-white shadow-2xl p-4 text-left animate-in fade-in zoom-in-95 duration-150",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900">
            <Sparkles className="size-4 text-amber-500 fill-amber-400" />
            <span>Smart Best Times</span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {country.flagEmoji} {country.name} • Local time • {country.timezone}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Scheduling Strategy */}
      <div className="py-3 border-b border-zinc-100 space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block">
          Scheduling Strategy
        </label>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-50 cursor-pointer border border-transparent has-[:checked]:border-zinc-200 has-[:checked]:bg-zinc-50/70 transition-all">
            <input
              type="radio"
              name="smart_strategy"
              value="per_platform"
              checked={strategy === "per_platform"}
              onChange={() => onStrategyChange("per_platform")}
              className="size-3.5 text-zinc-900 focus:ring-zinc-900"
            />
            <div>
              <div className="text-xs font-semibold text-zinc-900">Optimize for each platform</div>
              <div className="text-[10px] text-zinc-500">
                Posts publish at each platform's distinct peak engagement hours
              </div>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-50 cursor-pointer border border-transparent has-[:checked]:border-zinc-200 has-[:checked]:bg-zinc-50/70 transition-all">
            <input
              type="radio"
              name="smart_strategy"
              value="shared"
              checked={strategy === "shared"}
              onChange={() => onStrategyChange("shared")}
              className="size-3.5 text-zinc-900 focus:ring-zinc-900"
            />
            <div>
              <div className="text-xs font-semibold text-zinc-900">Use the same times for all platforms</div>
              <div className="text-[10px] text-zinc-500">
                Consensus schedule aligned across all your active channels
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Recommended Times list */}
      <div className="py-3 border-b border-zinc-100 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-600">
          <span>Recommended times for {dow.toUpperCase()}</span>
          <span className="text-[10px] font-normal text-zinc-600 capitalize">
            {postsPerDay} post{postsPerDay > 1 ? "s" : ""}/day
          </span>
        </div>

        {platforms.length === 0 ? (
          <div className="py-4 text-center text-xs text-zinc-500 font-medium bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            Select at least one platform above to see recommended times.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {platforms.map((pid) => {
              const meta = getPlatform(pid);
              const sched = recommendations.find((r) => r.platform === pid);
              const slots = (sched?.slots ?? []).slice(0, postsPerDay);

              return (
                <div
                  key={pid}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-50/80 border border-zinc-100 text-xs font-medium"
                >
                  <span className="font-semibold text-zinc-800">{meta?.name ?? pid}</span>
                  <div className="flex items-center gap-1.5">
                    {slots.map((s, idx) => (
                      <span
                        key={idx}
                        className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-900 shadow-2xs"
                      >
                        {s.time}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Benchmark source disclaimer */}
      <p className="text-[10px] text-zinc-600 leading-relaxed pt-2.5 pb-3">
        Suggested times based on regional platform benchmarks. Your connected account performance data can refine these recommendations over time.
      </p>

      {/* Action button */}
      <button
        type="button"
        onClick={() => {
          onApply();
          onClose();
        }}
        disabled={platforms.length === 0}
        className="w-full h-9 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
      >
        <CheckCircle2 className="size-3.5" />
        <span>Apply Smart Schedule</span>
      </button>
    </div>
  );
}
