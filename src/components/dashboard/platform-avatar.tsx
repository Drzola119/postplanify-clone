"use client";

import { cn } from "@/lib/utils";
import type { PlatformMeta } from "@/lib/platforms";

export const PLATFORM_BRAND_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#010101",
  threads: "#000000",
  twitter: "#000000",
  linkedin: "#0A66C2",
  bluesky: "#0085FF",
  youtube: "#FF0000",
  pinterest: "#E60023",
};

export const PLATFORM_GRADIENTS: Record<string, string> = {
  instagram:
    "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
};

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

function iconUrl(id: string, color: string): string {
  return `https://cdn.simpleicons.org/${simpleIconsSlug(id)}/${color.replace("#", "")}`;
}

interface PlatformAvatarProps {
  platform: PlatformMeta;
  size?: number;
  rounded?: "sm" | "md" | "full";
  className?: string;
}

export function PlatformAvatar({
  platform,
  size = 32,
  rounded = "md",
  className,
}: PlatformAvatarProps) {
  const id = platform.id;
  const color = PLATFORM_BRAND_COLORS[id] ?? "#666";
  const gradient = PLATFORM_GRADIENTS[id];
  const iconSize = Math.round(size * 0.6);

  const borderRadius =
    rounded === "sm" ? "8px" : rounded === "md" ? "12px" : "9999px";

  const bgStyle = gradient
    ? { background: gradient }
    : {
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18) 0%, transparent 70%), ${color}`,
      };

  return (
    <div
      className={cn("relative flex-shrink-0 overflow-hidden", className)}
      style={{
        width: size,
        height: size,
        borderRadius,
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        ...bgStyle,
      }}
    >
      <img
        src={iconUrl(id, "ffffff")}
        alt={platform.name}
        width={iconSize}
        height={iconSize}
        className="absolute inset-0 m-auto"
        style={{ width: iconSize, height: iconSize }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
