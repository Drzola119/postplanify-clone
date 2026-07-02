"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SegmentedControl<T extends string>({ options, value, onChange, className, size = "md" }: SegmentedControlProps<T>) {
  const heights = size === "sm" ? "h-6" : size === "lg" ? "h-11" : "h-9";
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full bg-zinc-100 p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center justify-center rounded-full px-4 text-sm font-medium transition-colors whitespace-nowrap",
            heights,
            value === o.value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}