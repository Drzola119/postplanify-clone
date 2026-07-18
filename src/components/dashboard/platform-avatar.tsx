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
  x: "#000000",
  discord: "#5865F2",
  telegram: "#2AABEE",
  reddit: "#FF4500",
  googlebusiness: "#4285F4",
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
  x: "x",
  discord: "discord",
  telegram: "telegram",
  reddit: "reddit",
  googlebusiness: "googleforms",
};

function iconUrl(id: string): string {
  const slug = SIMPLE_ICONS_SLUGS[id] ?? id;
  return `https://cdn.simpleicons.org/${slug}/ffffff`;
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
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
  const iconSize = Math.round(size * 0.58);

  const borderRadius =
    rounded === "sm" ? "8px" : rounded === "md" ? "12px" : "9999px";

  const bgStyle = gradient
    ? { background: gradient }
    : {
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18) 0%, transparent 70%), ${color}`,
      };

  return (
    <div
      className={cn("relative flex-shrink-0 overflow-hidden flex items-center justify-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius,
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        ...bgStyle,
      }}
    >
      <img
        src={iconUrl(id)}
        alt={platform.name}
        width={iconSize}
        height={iconSize}
        loading="lazy"
        decoding="async"
        style={{ width: iconSize, height: iconSize }}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLSpanElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <span
        style={{
          display: "none",
          position: "absolute",
          inset: 0,
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: Math.round(size * 0.35),
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        {getInitials(platform.name)}
      </span>
    </div>
  );
}
