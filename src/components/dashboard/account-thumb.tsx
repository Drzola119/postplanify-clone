"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformMeta } from "@/lib/platforms";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";

interface AccountThumbProps {
  platform: PlatformMeta;
  onEdit?: () => void;
  onRemove?: () => void;
}

// Header thumbnail — small circular avatar (image or fallback icon) for each selected account.
// Click opens a small action menu (edit / remove).
export function AccountThumb({ platform, onEdit, onRemove }: AccountThumbProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={`${platform.name} options`}
        className="size-7 rounded-full ring-2 ring-white overflow-hidden bg-zinc-100 flex items-center justify-center hover:ring-zinc-200 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-950"
      >
        {platform.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={platform.avatar}
            alt={platform.handle}
            className="size-full object-cover"
          />
        ) : (
          <PlatformAvatar platform={platform} size={28} rounded="full" />
        )}
      </button>
      {menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-9 z-50 w-40 rounded-md border border-zinc-200 bg-white shadow-lg p-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onEdit?.();
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-zinc-100 text-left"
          >
            <Pencil className="size-3.5 text-zinc-500" />
            Edit account
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onRemove?.();
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-red-50 text-left text-red-600"
          >
            <Trash2 className="size-3.5" />
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}
