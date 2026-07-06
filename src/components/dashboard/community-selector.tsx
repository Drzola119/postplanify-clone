"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Users, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityOption {
  id: string;
  label: string;
  hint?: string;
}

const DEFAULT_OPTIONS: CommunityOption[] = [
  { id: "profile", label: "Your Profile", hint: "Default" },
  { id: "community-1", label: "Creator Community" },
  { id: "community-2", label: "Marketing Hub" },
];

interface CommunitySelectorProps {
  value?: string;
  onChange?: (id: string) => void;
}

export function CommunitySelector({ value = "profile", onChange }: CommunitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; flip: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const flip = below < 220;
    setPos({
      top: flip ? rect.top - 8 : rect.bottom + 4,
      left: rect.right - 220,
      width: 220,
      flip,
    });
  }, [open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-community-listbox]")
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = DEFAULT_OPTIONS.find((o) => o.id === selected) ?? DEFAULT_OPTIONS[0];

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 px-1">
        <Users className="size-4 text-zinc-500 flex-shrink-0" />
        <span className="text-sm text-zinc-700">Community (optional)</span>
      </div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="absolute right-0 top-0 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50 min-w-[140px] justify-between"
      >
        <span className="truncate">
          {current.label}
          {current.hint ? (
            <span className="text-zinc-400">{current.hint}</span>
          ) : null}
        </span>
        <ChevronDown
          className={cn("size-3.5 text-zinc-400 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              data-community-listbox
              role="listbox"
              style={{
                position: "fixed",
                top: pos.flip ? pos.top - 4 : pos.top,
                left: pos.left,
                width: pos.width,
                transform: pos.flip ? "translateY(-100%)" : undefined,
                zIndex: 1000,
              }}
              className="rounded-md border border-zinc-200 bg-white shadow-lg p-1"
            >
              {DEFAULT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={opt.id === selected}
                  onClick={() => {
                    setSelected(opt.id);
                    onChange?.(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm hover:bg-zinc-100",
                    opt.id === selected && "bg-zinc-50"
                  )}
                >
                  <span className="flex flex-col items-start min-w-0">
                    <span className="truncate">{opt.label}</span>
                    {opt.hint ? <span className="text-xs text-zinc-400">{opt.hint}</span> : null}
                  </span>
                  {opt.id === selected ? <Check className="size-3.5 text-zinc-700" /> : null}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
