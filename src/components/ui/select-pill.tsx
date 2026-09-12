"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

type Size = "sm" | "md";

interface SelectPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: Size;
  active?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function SelectPill({ label, size = "md", active, leading, trailing, className, ...props }: SelectPillProps) {
  const heights = size === "sm" ? "h-7 text-[11px] px-2.5" : "h-8 text-xs px-3";
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border bg-background font-medium hover:bg-muted transition-colors",
        heights,
        active ? "border-primary bg-muted text-foreground" : "border-border text-foreground",
        className
      )}
      {...props}
    >
      {leading}
      <span className="truncate">{label}</span>
      {trailing ?? <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />}
    </button>
  );
}
