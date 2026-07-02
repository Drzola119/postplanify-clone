"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

type Variant = "primary" | "outline" | "ghost" | "danger" | "pill" | "ai";
type Size = "xs" | "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent",
  outline: "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50",
  ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100 border border-transparent",
  danger: "bg-white text-red-500 border border-red-500/50 hover:bg-red-50",
  pill: "bg-zinc-100 text-zinc-900 border border-transparent hover:bg-zinc-200",
  ai: "bg-zinc-950 text-white hover:bg-zinc-900 border border-transparent rounded-[4px]",
};

const sizes: Record<Size, string> = {
  xs: "h-6 px-2 text-[11px] gap-1 rounded-md",
  sm: "h-7 px-2 text-xs gap-1 rounded-md",
  md: "h-9 px-3.5 text-sm gap-1.5 rounded-md",
  lg: "h-10 px-4 text-sm gap-2 rounded-md",
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const PPButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "outline", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={props.type ?? "button"}
        className={cn(
          "inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
PPButton.displayName = "PPButton";