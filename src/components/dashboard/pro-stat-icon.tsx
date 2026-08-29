"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Human-crafted, senior-designer stat icons — Soft Structuralism
// No AI-slop gradients, no thick lucide, no harsh shadows.
// Double-bezel (outer shell + inner core) + ultra-light precise strokes + hairline + ambient diffused shadow.

type Tint = "emerald" | "blue" | "violet" | "amber" | "red";

const TINTS: Record<Tint, { outer: string; ring: string; icon: string; accent: string }> = {
  emerald: {
    outer: "bg-emerald-50/80",
    ring: "ring-emerald-500/10",
    icon: "text-emerald-700",
    accent: "bg-emerald-500",
  },
  blue: {
    outer: "bg-blue-50/80",
    ring: "ring-blue-500/10",
    icon: "text-blue-700",
    accent: "bg-blue-500",
  },
  violet: {
    outer: "bg-violet-50/80",
    ring: "ring-violet-500/10",
    icon: "text-violet-700",
    accent: "bg-violet-500",
  },
  amber: {
    outer: "bg-amber-50/80",
    ring: "ring-amber-500/10",
    icon: "text-amber-700",
    accent: "bg-amber-500",
  },
  red: {
    outer: "bg-red-50/80",
    ring: "ring-red-500/10",
    icon: "text-red-600",
    accent: "bg-red-500",
  },
};

interface ProStatIconProps {
  tint: Tint;
  children: React.ReactNode;
  size?: number; // outer shell size incl. padding, default 44 -> inner 36
  accentDot?: boolean;
}

export function ProStatIcon({ tint, children, size = 44, accentDot = false }: ProStatIconProps) {
  const t = TINTS[tint];
  const outerRadius = 14;
  const innerRadius = 10;

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 p-1",
        t.outer,
        t.ring,
        "ring-1 shadow-sm"
      )}
      style={{
        width: size,
        height: size,
        borderRadius: outerRadius,
        // ultra-soft ambient diffused shadow, not harsh
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.04)",
      }}
    >
      {/* inner core — machined hardware plate */}
      <span
        className="relative flex items-center justify-center bg-white border border-zinc-100"
        style={{
          width: size - 8,
          height: size - 8,
          borderRadius: innerRadius,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {/* hairline highlight top */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/80" style={{ borderRadius: innerRadius }} />
        <span className={cn("relative flex items-center justify-center", t.icon)} style={{ fontSize: 0 }}>
          {/* clone child to force thin stroke */}
          {React.isValidElement(children)
            ? React.cloneElement(children as React.ReactElement<{ className?: string; strokeWidth?: number; size?: number }>, {
                strokeWidth: 1.35,
                className: cn((children as React.ReactElement<{ className?: string }>).props?.className, t.icon),
              })
            : children}
        </span>
        {/* subtle paper grain — fixed pointer-events-none */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.018]"
          style={{
            borderRadius: innerRadius,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
          }}
        />
      </span>

      {accentDot && (
        <span
          className={cn("absolute -top-0.5 -right-0.5 size-[9px] rounded-full ring-2 ring-white shadow-sm", t.accent)}
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}
        />
      )}
    </span>
  );
}
