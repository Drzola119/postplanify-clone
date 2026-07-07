"use client";

import { PreviewCard } from "@base-ui/react/preview-card";
import { Eye, EyeOff, BookOpen, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PLATFORMS, type PlatformId, type PlatformMeta } from "@/lib/platforms";
import { PlatformPreviewRouter, type PreviewProps } from "@/components/dashboard/platform-previews/platform-previews";
import type { LearnSectionId } from "@/components/dashboard/learn-panel";

interface PlatformTileBarProps {
  selected: Set<PlatformId>;
  onToggle: (id: PlatformId) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
  getPreviewProps: (id: PlatformId) => Omit<PreviewProps, "platform">;
  onOpenLearn: (section?: LearnSectionId) => void;
}

export function PlatformTileBar({
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
  className,
  getPreviewProps,
  onOpenLearn,
}: PlatformTileBarProps) {
  const allSelected = selected.size === PLATFORMS.length;
  const [learnDropdownOpen, setLearnDropdownOpen] = useState(false);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Learn button + dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setLearnDropdownOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
          aria-expanded={learnDropdownOpen}
          aria-haspopup="menu"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Learn
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </button>
        {learnDropdownOpen ? (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setLearnDropdownOpen(false)}
              aria-hidden
            />
            <div
              role="menu"
              className="absolute left-0 top-full mt-1 z-50 w-[240px] rounded-md border border-zinc-200 bg-white shadow-lg p-1"
            >
              {[
                { id: "media-captions" as LearnSectionId, label: "Media & Captions" },
                { id: "publishing" as LearnSectionId, label: "Publishing & Platform Features" },
                { id: "troubleshooting" as LearnSectionId, label: "Troubleshooting Failed Posts" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setLearnDropdownOpen(false);
                    onOpenLearn(item.id);
                  }}
                  className="relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-100 w-full text-left"
                >
                  <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <span className="text-sm font-medium text-zinc-700 ml-2">Post in:</span>
      <div className="flex items-center gap-2 flex-wrap">
        {PLATFORMS.map((p) => {
          const isSelected = selected.has(p.id);
          return (
            <Tile
              key={p.id}
              platform={p}
              selected={isSelected}
              onToggle={() => onToggle(p.id)}
              getPreviewProps={getPreviewProps}
            />
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
  getPreviewProps,
}: {
  platform: PlatformMeta;
  selected: boolean;
  onToggle: () => void;
  getPreviewProps: (id: PlatformId) => Omit<PreviewProps, "platform">;
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
      <PreviewCard.Root>
        <PreviewCard.Trigger
          className={cn(
            "size-12 rounded-lg border-2 flex items-center justify-center transition-all overflow-hidden",
            selected
              ? "border-zinc-950 bg-white"
              : "border-zinc-200 bg-zinc-50 opacity-40 grayscale hover:opacity-60"
          )}
        >
          <span className={cn("text-xl leading-none", platform.textClass)}>{platform.icon}</span>
        </PreviewCard.Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner side="bottom" sideOffset={6} align="center">
            <PreviewCard.Popup className="z-[60] outline-none">
              <PlatformPreviewRouter platform={platform} {...getPreviewProps(platform.id)} />
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
    </div>
  );
}
