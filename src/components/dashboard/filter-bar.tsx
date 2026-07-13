"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterChip {
  key: string;
  label: string;
  options: FilterOption[];
  value?: string;
  onChange?: (v: string) => void;
}

interface FilterBarProps {
  chips: FilterChip[];
  className?: string;
  trailing?: ReactNode;
}

export function FilterBar({ chips, className, trailing }: FilterBarProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2",
        className,
      )}
    >
      <span className="text-xs font-semibold text-zinc-500">Filters</span>
      {chips.map((chip) => {
        const active = chip.value && chip.value !== "all" && chip.value !== chip.options[0]?.value;
        return (
          <div key={chip.key} className="relative">
            <button
              type="button"
              onClick={() => setOpenKey(openKey === chip.key ? null : chip.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
              )}
            >
              <span>{chip.label}</span>
              {chip.value ? (
                <span className={cn("text-[10px]", active ? "text-zinc-300" : "text-zinc-500")}>
                  {chip.options.find((o) => o.value === chip.value)?.label ?? chip.value}
                </span>
              ) : null}
            </button>
            {openKey === chip.key && chip.options.length > 0 ? (
              <div className="absolute left-0 top-full mt-1 z-30 min-w-[160px] rounded-md border border-zinc-200 bg-white shadow-lg py-1">
                {chip.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      chip.onChange?.(opt.value);
                      setOpenKey(null);
                    }}
                    className={cn(
                      "block w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-50",
                      chip.value === opt.value && "font-semibold text-zinc-900",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      {trailing ? <div className="ml-auto">{trailing}</div> : null}
    </div>
  );
}