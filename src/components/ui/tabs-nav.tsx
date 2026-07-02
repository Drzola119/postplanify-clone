"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface TabsNavProps {
  tabs: { id: string; label: React.ReactNode; badge?: React.ReactNode; icon?: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  variant?: "segmented" | "underline" | "pill";
  className?: string;
}

export function TabsNav({ tabs, active, onChange, variant = "segmented", className }: TabsNavProps) {
  if (variant === "segmented") {
    return (
      <div className={cn("inline-flex items-center gap-1 rounded-full bg-zinc-100 p-1", className)}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-medium transition-colors",
              active === t.id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            {t.icon}
            {t.label}
            {t.badge}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "underline") {
    return (
      <div className={cn("inline-flex items-center gap-6 border-b border-zinc-200", className)}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "inline-flex items-center gap-2 pb-2.5 text-sm font-medium transition-colors border-b-2",
              active === t.id ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900"
            )}
          >
            {t.icon}
            {t.label}
            {t.badge}
          </button>
        ))}
      </div>
    );
  }

  // pill (sidebar-style)
  return (
    <nav className={cn("space-y-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 h-10 rounded-md text-sm font-medium transition-colors",
            active === t.id ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
          )}
        >
          {t.icon}
          <span className="flex-1 text-left">{t.label}</span>
          {t.badge}
        </button>
      ))}
    </nav>
  );
}