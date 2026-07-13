"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Copy, Trash2, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostActionsMenuProps {
  onDuplicate?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function PostActionsMenu({
  onDuplicate,
  onArchive,
  onDelete,
  className,
}: PostActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = [
    onDuplicate
      ? { icon: Copy, label: "Duplicate", action: onDuplicate }
      : null,
    onArchive
      ? { icon: Archive, label: "Archive", action: onArchive }
      : null,
    onDelete
      ? { icon: Trash2, label: "Delete", action: onDelete, danger: true }
      : null,
  ].filter(Boolean) as { icon: typeof Copy; label: string; action: () => void; danger?: boolean }[];

  if (items.length === 0) return null;

  return (
    <div className={cn("relative inline-block", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-7 items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-600"
        aria-label="Post actions"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full mt-1 z-30 min-w-[160px] rounded-md border border-zinc-200 bg-white shadow-lg py-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  item.action();
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-zinc-50",
                  item.danger ? "text-red-600" : "text-zinc-700",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}