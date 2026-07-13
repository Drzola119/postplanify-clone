"use client";

import { PreviewCard } from "@base-ui/react/preview-card";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORMS, type PlatformId, type PlatformMeta } from "@/lib/platforms";
import { PlatformPreviewRouter, type PreviewProps } from "@/components/dashboard/platform-previews/platform-previews";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";

interface PlatformTileBarProps {
  selected: Set<PlatformId>;
  onToggle: (id: PlatformId) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
  getPreviewProps: (id: PlatformId) => Omit<PreviewProps, "platform">;
}

export function PlatformTileBar({
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
  className,
  getPreviewProps,
}: PlatformTileBarProps) {
  const allSelected = selected.size === PLATFORMS.length;
  const helpConfig = getHelpConfig("posts/create");
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {helpConfig ? (
        <PageHelp
          config={helpConfig}
          align="left"
          buttonClassName="rounded-full"
        />
      ) : null}

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
