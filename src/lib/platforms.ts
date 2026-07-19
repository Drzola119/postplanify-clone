// Platform metadata for the Create Post composer.
// Source: docs/audit/create-post-audit.md (extracted from postplanify.com 2026-06-26)

export type PlatformId =
  | "bluesky"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "twitter"
  | "linkedin"
  | "threads"
  | "facebook"
  | "discord"
  | "telegram"
  | "reddit"
  | "google_business";

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  handle: string;
  avatar: string | null;
  charLimit: number;
  // Border color class for per-account preview cards (e.g. "border-blue-500/20").
  borderClass: string;
  // Solid text color for the platform badge.
  textClass: string;
  // Emoji or short label used when no icon component is available.
  icon: string;
  // Whether this account only accepts video.
  videoOnly?: boolean;
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "bluesky",
    name: "Bluesky",
    handle: "nicklorance.bsky.social",
    avatar: null,
    charLimit: 300,
    borderClass: "border-blue-500/20",
    textClass: "text-blue-500",
    icon: "🦋",
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "nicklorance7",
    avatar: null,
    charLimit: 2200,
    borderClass: "border-[#DD2A7B]/20",
    textClass: "text-[#DD2A7B]",
    icon: "📷",
  },
  {
    id: "tiktok",
    name: "TikTok",
    handle: "nick_lorance",
    avatar: null,
    charLimit: 2200,
    borderClass: "border-black/20",
    textClass: "text-black",
    icon: "🎵",
  },
  {
    id: "youtube",
    name: "YouTube",
    handle: "Zakaria 11",
    avatar: null,
    charLimit: 4000,
    borderClass: "border-red-500/20",
    textClass: "text-red-500",
    icon: "▶️",
    videoOnly: true,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    handle: "nicklorance7",
    avatar: null,
    charLimit: 500,
    borderClass: "border-red-600/20",
    textClass: "text-red-600",
    icon: "📌",
  },
  {
    id: "twitter",
    name: "X / Twitter",
    handle: "LoranceNic36048",
    avatar: null,
    charLimit: 280,
    borderClass: "border-black/20",
    textClass: "text-black",
    icon: "𝕏",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "Nick Lorance",
    avatar: null,
    charLimit: 3000,
    borderClass: "border-blue-700/20",
    textClass: "text-blue-700",
    icon: "in",
  },
  {
    id: "threads",
    name: "Threads",
    handle: "nicklorance7",
    avatar: null,
    charLimit: 500,
    borderClass: "border-black/20",
    textClass: "text-black",
    icon: "@",
  },
  {
    id: "facebook",
    name: "Facebook",
    handle: "nick lorance life",
    avatar: null,
    charLimit: 63206,
    borderClass: "border-blue-600/20",
    textClass: "text-blue-600",
    icon: "f",
  },
  {
    id: "discord",
    name: "Discord",
    handle: "",
    avatar: null,
    charLimit: 2000,
    borderClass: "border-indigo-500/20",
    textClass: "text-indigo-500",
    icon: "💬",
  },
  {
    id: "telegram",
    name: "Telegram",
    handle: "",
    avatar: null,
    charLimit: 4096,
    borderClass: "border-sky-500/20",
    textClass: "text-sky-500",
    icon: "✈️",
  },
  {
    id: "reddit",
    name: "Reddit",
    handle: "",
    avatar: null,
    charLimit: 40000,
    borderClass: "border-orange-500/20",
    textClass: "text-orange-500",
    icon: "🤖",
  },
  {
    id: "google_business",
    name: "Google Business",
    handle: "",
    avatar: null,
    charLimit: 1500,
    borderClass: "border-yellow-500/20",
    textClass: "text-yellow-600",
    icon: "🏪",
  },
];

export function getPlatform(id: string): PlatformMeta | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

export function toInternalPlatform(key: string): string {
  if (key === "x") return "twitter";
  return key;
}