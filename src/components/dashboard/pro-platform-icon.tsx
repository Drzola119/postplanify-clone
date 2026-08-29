"use client";

import React from "react";
import { BrandIcons } from "@/components/dashboard/brand-icons";

export const PRO_PLATFORM_COLORS: Record<string, string> = {
  bluesky: "#0085FF",
  instagram: "gradient",
  tiktok: "#010101",
  youtube: "#FF0000",
  pinterest: "#E60023",
  twitter: "#000000",
  x: "#000000",
  linkedin: "#0A66C2",
  threads: "#000000",
  facebook: "#1877F2",
  discord: "#5865F2",
  telegram: "#2AABEE",
  reddit: "#FF4500",
  google_business: "#4285F4",
  google: "#4285F4",
};

const INSTAGRAM_GRADIENT =
  "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";

function normalizeId(id: string): string {
  const lower = id.toLowerCase();
  if (lower === "x") return "twitter";
  if (lower === "google_business") return "google_business";
  if (lower === "google") return "google";
  return lower;
}

interface ProPlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
  withBorder?: boolean;
}

export function ProPlatformIcon({ platform, size = 32, className, withBorder = true }: ProPlatformIconProps) {
  const nid = normalizeId(platform);
  const rawColor = PRO_PLATFORM_COLORS[nid] ?? "#52525b";
  const isGradient = rawColor === "gradient";
  const Icon = BrandIcons[nid as keyof typeof BrandIcons] ?? BrandIcons[platform as keyof typeof BrandIcons];

  const iconSize = Math.round(size * 0.52);

  const bgStyle: React.CSSProperties = isGradient
    ? { background: INSTAGRAM_GRADIENT }
    : { background: rawColor };

  // Super pro: white inner border + black outer ring + soft drop shadow
  const borderStyle: React.CSSProperties = withBorder
    ? {
        border: "2.5px solid white",
        boxShadow: "0 0 0 1.5px #0a0a0a, 0 3px 8px rgba(0,0,0,0.16), 0 1.5px 2px rgba(0,0,0,0.10)",
      }
    : {
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
      };

  return (
    <span
      title={platform}
      aria-label={platform}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size >= 30 ? 11 : 10,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        ...bgStyle,
        ...borderStyle,
      }}
    >
      {Icon ? (
        <Icon size={iconSize} className="text-white fill-white shrink-0" />
      ) : (
        <span
          style={{
            color: "white",
            fontSize: Math.round(size * 0.32),
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {platform.slice(0, 2).toUpperCase()}
        </span>
      )}
      {/* subtle highlight gloss */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
    </span>
  );
}

export function ProOverflowBadge({ count, size = 32 }: { count: number; size?: number }) {
  return (
    <span
      title={`+${count} more`}
      style={{
        width: size,
        height: size,
        borderRadius: size >= 30 ? 11 : 10,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: "#0a0a0a",
        border: "2.5px solid white",
        boxShadow: "0 0 0 1.5px #0a0a0a, 0 3px 8px rgba(0,0,0,0.16)",
        color: "white",
        fontSize: Math.round(size * 0.34),
        fontWeight: 800,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      +{count}
    </span>
  );
}
