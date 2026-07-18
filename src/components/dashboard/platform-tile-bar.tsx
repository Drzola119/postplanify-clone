"use client";

import { cn } from "@/lib/utils";
import { PLATFORMS, type PlatformId, type PlatformMeta } from "@/lib/platforms";
import { PlatformPreviewRouter, type PreviewProps } from "@/components/dashboard/platform-previews/platform-previews";
import { PLATFORM_BRAND_COLORS, PLATFORM_GRADIENTS } from "@/components/dashboard/platform-avatar";
import { PreviewCard } from "@base-ui/react/preview-card";

const SIMPLE_ICONS_SLUGS: Record<string, string> = {
  instagram: "instagram",
  facebook: "facebook",
  tiktok: "tiktok",
  threads: "threads",
  twitter: "x",
  linkedin: "linkedin",
  bluesky: "bluesky",
  youtube: "youtube",
  pinterest: "pinterest",
};

function simpleIconsSlug(id: string): string {
  return SIMPLE_ICONS_SLUGS[id] ?? id;
}

function iconUrl(id: string): string {
  return `https://cdn.simpleicons.org/${simpleIconsSlug(id)}/ffffff`;
}

interface PlatformTileBarProps {
  selected: Set<PlatformId>;
  onToggle: (id: PlatformId) => void;
  className?: string;
  getPreviewProps: (id: PlatformId) => Omit<PreviewProps, "platform">;
}

export function PlatformTileBar({
  selected,
  onToggle,
  className,
  getPreviewProps,
}: PlatformTileBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
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
  const id = platform.id;
  const color = PLATFORM_BRAND_COLORS[id] ?? "#666";
  const gradient = PLATFORM_GRADIENTS[id];

  const bgStyle = gradient
    ? { background: gradient }
    : {
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18) 0%, transparent 70%), ${color}`,
      };

  return (
    <div className="relative flex flex-col items-center">
      <PreviewCard.Root>
        <PreviewCard.Trigger>
          <button
            type="button"
            onClick={onToggle}
            aria-label={platform.name}
            className={cn(
              "inline-flex items-center justify-center transition-all duration-150 ease-out",
              "hover:scale-108 active:scale-94",
              selected
                ? "shadow-[0_2px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.12)]"
                : "grayscale opacity-35 shadow-none"
            )}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              outline: selected ? "2px solid white" : undefined,
              outlineOffset: selected ? -3 : undefined,
              ...bgStyle,
            }}
          >
            <img
              src={iconUrl(id)}
              alt=""
              width={28}
              height={28}
              className="pointer-events-none"
              style={{ width: 28, height: 28 }}
              loading="lazy"
              decoding="async"
            />
          </button>
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
