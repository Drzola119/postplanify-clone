"use client";

import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORMS, type PlatformId, type PlatformMeta } from "@/lib/platforms";

interface PlatformTileBarProps {
  selected: Set<PlatformId>;
  onToggle: (id: PlatformId) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
}

export function PlatformTileBar({
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
  className,
}: PlatformTileBarProps) {
  const allSelected = selected.size === PLATFORMS.length;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium text-zinc-700">Post in:</span>
      <div className="flex items-center gap-2 flex-wrap">
        {PLATFORMS.map((p) => {
          const isSelected = selected.has(p.id);
          return (
            <Tile key={p.id} platform={p} selected={isSelected} onToggle={() => onToggle(p.id)} />
          );
        })}
      </div>
      <button
        type="button"
        onClick={allSelected ? onDeselectAll : onSelectAll}
        className="ml-1 inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 h-7 text-xs font-medium hover:bg-zinc-50"
      >
        {allSelected ? "Deselect All" : "Select All"}
      </button>
    </div>
  );
}

function Tile({
  platform,
  selected,
  onToggle,
}: {
  platform: PlatformMeta;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={onToggle}
        aria-label={selected ? `Hide ${platform.name}` : `Show ${platform.name}`}
        className={cn(
          "size-5 inline-flex items-center justify-center rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors",
          !selected && "text-zinc-300"
        )}
      >
        {selected ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Toggle ${platform.name}`}
        title={platform.handle}
        className={cn(
          "size-12 rounded-lg border-2 flex items-center justify-center transition-all overflow-hidden",
          selected
            ? "border-zinc-950 bg-white"
            : "border-zinc-200 bg-zinc-50 opacity-40 grayscale hover:opacity-60"
        )}
      >
        <span className={cn("text-xl leading-none", platform.textClass)}>{platform.icon}</span>
      </button>
    </div>
  );
}