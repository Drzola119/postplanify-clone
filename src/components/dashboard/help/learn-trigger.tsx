"use client";

import * as React from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageHelpConfig, HelpTopic } from "@/lib/help/content";

interface LearnTriggerProps {
  config: PageHelpConfig;
  onOpenTopic: (triggerLabel: string, topic: HelpTopic) => void;
  className?: string;
  buttonClassName?: string;
  align?: "left" | "right";
}

export function LearnTrigger({ config, onOpenTopic, className, buttonClassName, align = "left" }: LearnTriggerProps) {
  const [open, setOpen] = React.useState(false);
  const [activeTriggerIndex, setActiveTriggerIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const trigger = config.triggers[activeTriggerIndex];

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50",
          buttonClassName
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Learn
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Learn topics"
          className={cn(
            "absolute top-full mt-1 z-[60] w-[280px] max-w-[calc(100vw-2rem)] rounded-md border border-zinc-200 bg-white shadow-lg p-1",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {config.triggers.length > 1 ? (
            <div className="px-2 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              {trigger.label}
            </div>
          ) : null}
          {trigger.topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenTopic(trigger.label, topic);
              }}
              className="relative flex select-none items-start gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-100 w-full text-left"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
              <span className="leading-snug">{topic.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}