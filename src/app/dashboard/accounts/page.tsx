"use client";

import { useState } from "react";
import {
  RefreshCw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Info,
  Grid3x3,
  X,
  Loader2,
  Search,
  ExternalLink,
  Trash2,
  XCircle,
  ChevronDown,
} from "lucide-react";

type Platform =
  | "bluesky"
  | "instagram"
  | "pinterest"
  | "threads"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "linkedin"
  | "x";

interface ConnectedAccount {
  id: string;
  platform: Platform;
  handle: string;
  img?: string;
  initials?: string;
  initialsBg?: string;
  initialsColor?: string;
  validityDays?: number;
  hasGridPreview?: boolean;
}

const PLATFORM_META: Record<
  Platform,
  { label: string; badgeColor: string; badgeBg: string }
> = {
  bluesky: { label: "Bluesky", badgeColor: "text-sky-500", badgeBg: "" },
  instagram: { label: "Instagram", badgeColor: "text-pink-600", badgeBg: "" },
  pinterest: { label: "Pinterest", badgeColor: "text-rose-600", badgeBg: "" },
  threads: { label: "Threads", badgeColor: "text-zinc-900", badgeBg: "" },
  tiktok: { label: "TikTok", badgeColor: "text-zinc-900", badgeBg: "" },
  youtube: { label: "YouTube", badgeColor: "text-red-600", badgeBg: "" },
  facebook: { label: "Facebook", badgeColor: "text-blue-600", badgeBg: "" },
  linkedin: { label: "LinkedIn", badgeColor: "text-blue-700", badgeBg: "" },
  x: { label: "X", badgeColor: "text-zinc-900", badgeBg: "" },
};

function PlatformBadge({ platform }: { platform: Platform }) {
  const meta = PLATFORM_META[platform];
  switch (platform) {
    case "bluesky":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -3.268 64 68.414" className={`w-3.5 h-3.5 ${meta.badgeColor}`}>
          <path fill="currentColor" d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805zm36.254 0C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${meta.badgeColor}`} fill="none">
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </svg>
      );
    case "pinterest":
      return (
        <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${meta.badgeColor}`} fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.314-.087-.79-.166-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
        </svg>
      );
    case "threads":
      return (
        <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${meta.badgeColor}`} fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.745-1.757-.513-.593-1.281-.892-2.298-.892H12c-.785 0-1.378.16-1.769.474-.41.33-.65.836-.717 1.503l-2.06-.272c.146-2.302 1.656-3.788 4.362-3.788h.013c3.062 0 4.932 2.02 5.146 5.564.022.302.034.612.034.93 1.63.708 2.778 1.85 3.317 3.314.617 1.685.488 3.834-.764 5.512-1.745 2.337-3.876 3.51-7.114 3.535h-.026" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${meta.badgeColor}`} fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.92a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.33z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${meta.badgeColor}`} fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${meta.badgeColor}`} fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${meta.badgeColor}`} fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${meta.badgeColor}`} fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
  }
}

function PlatformIconLarge({ platform, className }: { platform: Platform; className?: string }) {
  const baseClass = className || "w-6 h-6";
  switch (platform) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={`${baseClass} text-blue-600`} fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={`${baseClass} text-pink-600`} fill="none">
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={`${baseClass} text-zinc-900`} fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={`${baseClass} text-red-600`} fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={`${baseClass} text-zinc-900`} fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.92a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.33z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className={`${baseClass} text-blue-700`} fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "threads":
      return (
        <svg viewBox="0 0 24 24" className={`${baseClass} text-zinc-900`} fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.745-1.757-.513-.593-1.281-.892-2.298-.892H12c-.785 0-1.378.16-1.769.474-.41.33-.65.836-.717 1.503l-2.06-.272c.146-2.302 1.656-3.788 4.362-3.788h.013c3.062 0 4.932 2.02 5.146 5.564.022.302.034.612.034.93 1.63.708 2.778 1.85 3.317 3.314.617 1.685.488 3.834-.764 5.512-1.745 2.337-3.876 3.51-7.114 3.535h-.026" />
        </svg>
      );
    case "pinterest":
      return (
        <svg viewBox="0 0 24 24" className={`${baseClass} text-rose-600`} fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.314-.087-.79-.166-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
        </svg>
      );
    case "bluesky":
      return (
        <svg viewBox="0 0 24 24" className={`${baseClass} text-sky-500`} fill="currentColor">
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.59 3.513 6.182 3.225-3.71.547-7.081 2.118-3.36 7.498 4.166 5.965 5.706-1.275 6.554-4.846.848 3.571 1.927 10.654 6.554 4.846 3.72-5.38.349-6.951-3.36-7.498 2.591.288 5.397-.598 6.182-3.225.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.62-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8Z" />
        </svg>
      );
  }
}

const INITIAL_ACCOUNTS: ConnectedAccount[] = [
  {
    id: "1",
    platform: "bluesky",
    handle: "nicklorance.bsky.social",
    img: "https://cdn.bsky.app/img/avatar/plain/did:plc:rxzikv2qahzbwx7kggut2fiq/bafkreibbjbshetcjzi6cionfd3f62wzbhtmad7raj43h3pd3753vothaxy",
    validityDays: undefined,
    hasGridPreview: false,
  },
  {
    id: "2",
    platform: "instagram",
    handle: "nicklorance7",
    img: "https://cdn.postplanify.com/social-profile-pictures/ba9a528b-b3e7-41b5-979d-18b6773bd130/profile-1782204326749.jpg",
    validityDays: 56,
    hasGridPreview: false,
  },
  {
    id: "3",
    platform: "pinterest",
    handle: "nicklorance7",
    img: "https://cdn.postplanify.com/social-profile-pictures/ba9a528b-b3e7-41b5-979d-18b6773bd130/profile-1782203009982.jpg",
    validityDays: 361,
    hasGridPreview: false,
  },
  {
    id: "4",
    platform: "instagram",
    handle: "nicklorance7",
    img: "https://cdn.postplanify.com/social-profile-pictures/ba9a528b-b3e7-41b5-979d-18b6773bd130/profile-1782204326749.jpg",
    validityDays: 56,
    hasGridPreview: true,
  },
  {
    id: "5",
    platform: "tiktok",
    handle: "nick_lorance",
    img: "https://cdn.postplanify.com/social-profile-pictures/ba9a528b-b3e7-41b5-979d-18b6773bd130/profile-1782203631115.jpg",
    validityDays: 361,
    hasGridPreview: true,
  },
  {
    id: "6",
    platform: "youtube",
    handle: "Zakaria 11",
    img: "https://cdn.postplanify.com/social-profile-pictures/ba9a528b-b3e7-41b5-979d-18b6773bd130/profile-1782203779482.jpg",
    validityDays: undefined,
    hasGridPreview: false,
  },
  {
    id: "7",
    platform: "threads",
    handle: "nick lorance life",
    img: "https://cdn.postplanify.com/social-profile-pictures/ba9a528b-b3e7-41b5-979d-18b6773bd130/profile-1782202379534.jpg",
    validityDays: 56,
    hasGridPreview: false,
  },
  {
    id: "8",
    platform: "linkedin",
    handle: "Nick Lorance",
    initials: "N",
    initialsBg: "bg-blue-700",
    initialsColor: "text-white",
    validityDays: 56,
    hasGridPreview: false,
  },
  {
    id: "9",
    platform: "x",
    handle: "LoranceNic36048",
    img: "https://cdn.postplanify.com/social-profile-pictures/ba9a528b-b3e7-41b5-979d-18b6773bd130/profile-1782208486182.jpg",
    validityDays: undefined,
    hasGridPreview: false,
  },
];

const AVAILABLE_PLATFORMS: { name: string; platform: Platform; key: string }[] = [
  { name: "Facebook", platform: "facebook", key: "facebook" },
  { name: "Instagram", platform: "instagram", key: "instagram" },
  { name: "X", platform: "x", key: "x" },
  { name: "YouTube", platform: "youtube", key: "youtube" },
  { name: "TikTok", platform: "tiktok", key: "tiktok" },
  { name: "LinkedIn", platform: "linkedin", key: "linkedin" },
  { name: "Threads", platform: "threads", key: "threads" },
  { name: "Pinterest", platform: "pinterest", key: "pinterest" },
  { name: "Bluesky", platform: "bluesky", key: "bluesky" },
  { name: "Google Business", platform: "facebook", key: "google-business" },
];

interface TutorialContent {
  title: string;
  author: string;
  role: string;
  videoTitle: string;
  videoId?: string;
  intro?: string;
  optionsHeading?: string;
  options?: string[];
  requirements: string[];
  notes?: string[];
}

const TUTORIAL_CONTENT: Record<string, TutorialContent> = {
  facebook: {
    title: "Connect a Facebook account",
    author: "Written by Hasan Cagli",
    role: "Founder of PostPlanify",
    videoTitle: "Connecting Facebook Account on PostPlanify",
    requirements: [
      "Must be a Facebook Page (not a personal profile)",
      "Requires Admin or Full Control access to the page",
    ],
  },
  instagram: {
    title: "Connect a Instagram account",
    author: "Written by Hasan Cagli",
    role: "Founder of PostPlanify",
    videoTitle: "Connecting Instagram Account on PostPlanify",
    optionsHeading: "You have 2 connection options:",
    options: ["Instagram Direct", "Facebook Page Linked"],
    requirements: [
      "Requires a Professional or Business account",
      "Switch: Settings → Account → Switch to Professional Account",
    ],
  },
  x: {
    title: "Connect a X (Twitter) account",
    author: "Written by Hasan Cagli",
    role: "Founder of PostPlanify",
    videoTitle: "Connecting X Account on PostPlanify",
    requirements: [],
  },
  youtube: {
    title: "Connect a YouTube account",
    author: "Written by Hasan Cagli",
    role: "Founder of PostPlanify",
    videoTitle: "Connecting YouTube Account on PostPlanify",
    requirements: [
      "Phone verification required for custom thumbnails",
      "Enable at: Studio → Settings → Channel → Feature Eligibility",
    ],
  },
  tiktok: {
    title: "Connect a TikTok account",
    author: "Written by Hasan Cagli",
    role: "Founder of PostPlanify",
    videoTitle: "Connecting TikTok Account on PostPlanify",
    requirements: [],
  },
  linkedin: {
    title: "Connect a LinkedIn account",
    author: "Written by Hasan Cagli",
    role: "Founder of PostPlanify",
    videoTitle: "Connecting LinkedIn Account on PostPlanify",
    intro: "You can connect both LinkedIn company pages and personal profiles.",
    requirements: [
      "Requires Super Admin role for company pages",
      "Personal profiles connect without restrictions",
    ],
  },
  threads: {
    title: "Connect a Threads account",
    author: "Written by Hasan Cagli",
    role: "Founder of PostPlanify",
    videoTitle: "",
    requirements: [
      "Log into Threads in your browser first, then connect here",
    ],
  },
  pinterest: {
    title: "Connect a Pinterest account",
    author: "Written by Hasan Cagli",
    role: "Founder of PostPlanify",
    videoTitle: "Connecting Pinterest Account on PostPlanify",
    requirements: [],
  },
  bluesky: {
    title: "Connect a Bluesky account",
    author: "Written by Hasan Cagli",
    role: "Founder of PostPlanify",
    videoTitle: "Connecting Bluesky Account on PostPlanify",
    requirements: [],
    notes: [
      "Note: Bluesky connections cannot be refreshed. If you need to reconnect, you'll need to disconnect and reconnect the account.",
    ],
  },
};

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(INITIAL_ACCOUNTS);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [learnOpen, setLearnOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [gridPreviewAccount, setGridPreviewAccount] = useState<ConnectedAccount | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  const showToast = (message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleRefresh = (id: string) => {
    setRefreshingId(id);
    showToast("Refreshing account...", "info");
    setTimeout(() => {
      setRefreshingId(null);
      showToast("Account refreshed successfully", "success");
    }, 1500);
  };

  const handleDeleteConfirm = () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    setConfirmDeleteId(null);
    setTimeout(() => {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setDeletingId(null);
      showToast("Account disconnected", "success");
    }, 800);
  };

  const handleConnect = (platformKey: string) => {
    setConnectingId(platformKey);
    showToast(`Connecting to ${platformKey}...`, "info");
    setTimeout(() => {
      setConnectingId(null);
      showToast("Redirecting to authentication...", "info");
    }, 1500);
  };

  return (
    <div className="p-3 lg:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight">Social Accounts</h2>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLearnOpen((v) => !v)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 border border-zinc-200 bg-white hover:bg-zinc-50 h-8 rounded-md px-3 text-xs"
                >
                  <BookOpen className="size-4" />
                  <span className="text-sm ml-1.5">Learn</span>
                  <ChevronDown className="size-4" />
                </button>
                {learnOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg p-1 z-20">
                    {AVAILABLE_PLATFORMS.filter((p) => p.key !== "google-business").map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          setLearnOpen(false);
                          setActiveTutorial(p.key);
                        }}
                        className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm hover:bg-zinc-50"
                      >
                        <BookOpen className="size-4 shrink-0 text-zinc-500" />
                        <span>Connect a {p.name} account</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-muted-foreground">
              Connect and manage your social media accounts
            </p>
          </div>
        </div>

        {/* Card 1: Connected Accounts */}
        <div className="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="font-semibold leading-none tracking-tight">
              Connected Accounts
            </div>
            <div className="text-sm text-zinc-500">
              Manage your connected social media accounts
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {accounts.map((account) => (
                  <ConnectedAccountCard
                    key={account.id}
                    account={account}
                    isRefreshing={refreshingId === account.id}
                    isDeleting={deletingId === account.id}
                    onRefresh={() => handleRefresh(account.id)}
                    onDelete={() => setConfirmDeleteId(account.id)}
                    onGridPreview={() => setGridPreviewAccount(account)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Available Platforms */}
        <div className="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="font-semibold leading-none tracking-tight">
                  Available Platforms
                </div>
                <div className="text-sm text-zinc-500">
                  Connect new social media accounts
                </div>
              </div>
              {/* Warning banner */}
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs">
                <AlertCircle className="size-4 text-amber-600 shrink-0" />
                <span className="text-amber-800">
                  Connection works best on Chrome or Edge.{" "}
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(true)}
                    className="text-amber-800 underline hover:no-underline font-medium"
                  >
                    Having other issues?
                  </button>
                </span>
              </div>
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {AVAILABLE_PLATFORMS.map((p) => (
                  <PlatformCard
                    key={p.key}
                    name={p.name}
                    platform={p.platform}
                    isConnecting={connectingId === p.key}
                    onConnect={() => handleConnect(p.name)}
                  />
                ))}
              </div>
              {/* Footer note */}
              <div className="p-3 rounded-lg bg-zinc-100 border border-zinc-200 flex items-start gap-2">
                <Info className="size-3.5 mt-0.5 shrink-0 text-zinc-500" />
                <p className="text-xs text-zinc-500">
                  We only request permissions to schedule posts. Passwords are never
                  stored. Disconnect anytime in settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg min-w-[280px]"
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            ) : toast.type === "error" ? (
              <XCircle className="size-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="size-4 text-blue-600 shrink-0" />
            )}
            <span className="text-sm text-zinc-900">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <ConfirmDeleteModal
          account={accounts.find((a) => a.id === confirmDeleteId)!}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Grid Preview Modal */}
      {gridPreviewAccount && (
        <GridPreviewModal
          account={gridPreviewAccount}
          onClose={() => setGridPreviewAccount(null)}
        />
      )}

      {/* Support Modal */}
      {supportModalOpen && (
        <SupportModal onClose={() => setSupportModalOpen(false)} />
      )}

      {/* Tutorial Drawer */}
      {activeTutorial && (
        <TutorialDrawer
          platformKey={activeTutorial}
          onClose={() => setActiveTutorial(null)}
        />
      )}
    </div>
  );
}

function ConnectedAccountCard({
  account,
  isRefreshing,
  isDeleting,
  onRefresh,
  onDelete,
  onGridPreview,
}: {
  account: ConnectedAccount;
  isRefreshing: boolean;
  isDeleting: boolean;
  onRefresh: () => void;
  onDelete: () => void;
  onGridPreview: () => void;
}) {
  return (
    <div className={`group flex items-center justify-between p-4 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors bg-white ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-4 min-w-0">
        {/* Avatar with platform badge */}
        <div className="relative w-11 h-11 shrink-0">
          {account.img ? (
            <img
              src={account.img}
              alt={account.handle}
              className="rounded-full w-11 h-11 object-cover bg-zinc-100"
            />
          ) : (
            <div className={`rounded-full w-11 h-11 flex items-center justify-center text-sm font-semibold ${account.initialsBg} ${account.initialsColor}`}>
              {account.initials}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-200">
            <PlatformBadge platform={account.platform} />
          </div>
        </div>

        {/* Username + status */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm text-zinc-900 truncate">
              {account.handle}
            </p>
            {account.validityDays !== undefined ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                <CheckCircle2 className="size-3" />
                Valid for {account.validityDays} days
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {account.hasGridPreview && (
          <button
            type="button"
            onClick={onGridPreview}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium"
          >
            <Grid3x3 className="size-3.5" />
            Grid Preview
          </button>
        )}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
        >
          {isRefreshing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Refresh
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label="Delete account"
          className="inline-flex items-center justify-center size-8 rounded-md bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
        >
          {isDeleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function PlatformCard({
  name,
  platform,
  isConnecting,
  onConnect,
}: {
  name: string;
  platform: Platform;
  isConnecting: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="p-4 rounded-lg border border-zinc-200 bg-white flex items-center justify-between hover:border-zinc-300 transition-colors">
      <div className="flex items-center gap-2">
        <PlatformIconLarge platform={platform} />
        <span className="text-sm font-medium text-zinc-900">{name}</span>
      </div>
      <button
        type="button"
        onClick={onConnect}
        disabled={isConnecting}
        className="inline-flex items-center justify-center h-8 px-6 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium whitespace-nowrap min-w-[100px]"
      >
        {isConnecting ? (
          <>
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            Connecting...
          </>
        ) : (
          "Connect"
        )}
      </button>
    </div>
  );
}

function ConfirmDeleteModal({
  account,
  onConfirm,
  onCancel,
}: {
  account: ConnectedAccount;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-white rounded-xl border border-zinc-200 p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="size-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <Trash2 className="size-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Disconnect account?</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Are you sure you want to disconnect{" "}
              <span className="font-semibold text-zinc-900">{account.handle}</span>?
              You can reconnect it anytime.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

function GridPreviewModal({
  account,
  onClose,
}: {
  account: ConnectedAccount;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-zinc-200 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Grid Preview</h3>
            <p className="text-sm text-zinc-500">{account.handle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gradient-to-br from-zinc-100 to-zinc-200 rounded"
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 text-center mt-4">
            Sample grid preview for {account.handle}
          </p>
        </div>
      </div>
    </div>
  );
}

function SupportModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-zinc-200 p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900">Need help connecting?</h3>
          <button
            type="button"
            onClick={onClose}
            className="size-8 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="text-sm text-zinc-600 mb-4">
          If you&apos;re having trouble connecting your accounts, try these steps:
        </p>
        <ol className="space-y-2 text-sm text-zinc-600 list-decimal list-inside mb-6">
          <li>Use the latest version of Chrome or Edge</li>
          <li>Disable browser extensions that block popups</li>
          <li>Clear your browser cookies and cache</li>
          <li>Make sure third-party cookies are enabled</li>
        </ol>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-medium"
          >
            Close
          </button>
          <a
            href="mailto:support@postplanify.com"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
          >
            Contact Support
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function TutorialDrawer({
  platformKey,
  onClose,
}: {
  platformKey: string;
  onClose: () => void;
}) {
  const content = TUTORIAL_CONTENT[platformKey];
  if (!content) return null;

  const platform = AVAILABLE_PLATFORMS.find((p) => p.key === platformKey);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[480px] h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-200 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              HC
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-zinc-900 leading-tight">
                {content.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {content.author} • {content.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500 shrink-0"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-5">
          {/* Video embed */}
          {content.videoTitle && (
            <div className="rounded-lg overflow-hidden border border-zinc-200 bg-zinc-900 aspect-video relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="size-16 rounded-full bg-red-600 mx-auto flex items-center justify-center mb-2">
                    <svg viewBox="0 0 24 24" className="size-8 text-white fill-current">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-white text-sm font-medium px-4">{content.videoTitle}</p>
                  <p className="text-zinc-400 text-xs mt-1">Hasan | Social Media Growth</p>
                </div>
              </div>
              <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Watch on YouTube
              </div>
            </div>
          )}

          {/* Intro */}
          {content.intro && (
            <p className="text-sm text-zinc-700 leading-relaxed">
              {content.intro}
            </p>
          )}

          {/* Options */}
          {content.optionsHeading && content.options && (
            <div>
              <p className="text-sm text-zinc-700 mb-2">{content.optionsHeading}</p>
              <ul className="space-y-1">
                {content.options.map((opt, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                    <span className="size-1.5 rounded-full bg-zinc-400 shrink-0" />
                    {opt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {content.requirements.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-zinc-900 mb-2">Requirements:</p>
              <ul className="space-y-1.5">
                {content.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="size-1.5 rounded-full bg-zinc-400 mt-2 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {content.notes && content.notes.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-200">
              {content.notes.map((note, i) => (
                <p key={i} className="text-xs text-zinc-500 leading-relaxed">
                  {note}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}