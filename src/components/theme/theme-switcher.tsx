"use client";

import * as React from "react";
import { Check, Monitor, Moon, Sun, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePostPlanifyTheme } from "@/components/theme/theme-provider";
import type { ThemePreference } from "@/lib/theme/types";

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { theme, resolvedTheme, setTheme, ready, enabled } = usePostPlanifyTheme();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((option) => option.value === theme) ?? OPTIONS[2];
  const Icon = current.icon;

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!enabled) return null;
  if (!ready) {
    return <div aria-hidden className={cn("h-9 w-24 rounded-md bg-muted animate-pulse", className)} />;
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${current.label}. Current appearance: ${resolvedTheme ?? "system"}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-sm text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon className="size-4" aria-hidden />
        {!compact && <span>{current.label}</span>}
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </button>
      {open && (
        <div role="menu" aria-label="Choose theme" className="absolute right-0 z-50 mt-1 min-w-36 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          {OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const selected = option.value === theme;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => { setTheme(option.value); setOpen(false); }}
                className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <OptionIcon className="size-4 text-muted-foreground" aria-hidden />
                <span className="flex-1">{option.label}</span>
                {selected && <Check className="size-4 text-primary" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
