import { cn } from "@/lib/utils";
import * as React from "react";

type Tone = "neutral" | "blue" | "green" | "red" | "amber" | "violet" | "pink" | "cyan";

const tones: Record<Tone, string> = {
  neutral: "bg-zinc-100 text-zinc-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  pink: "bg-pink-50 text-pink-700",
  cyan: "bg-cyan-50 text-cyan-700",
};

interface StatusBadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function StatusBadge({ tone = "neutral", children, icon, className }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}