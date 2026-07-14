"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Info,
  Grid3x3,
  X,
  Loader2,
  ExternalLink,
  Trash2,
  XCircle,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";
import { getOverrideHeaders } from "@/lib/security/client-overrides";

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
  profileUsername: string;
  platform: Platform;
  handle: string;
  displayName: string | null;
  img: string | null;
  reauthRequired: boolean;
}

interface ProfileMeta {
  username: string;
  redirectUrl: string | null;
  blocked: boolean;
}

interface ApiResponse {
  ok: boolean;
  accounts: ConnectedAccount[];
  profiles: ProfileMeta[];
  plan: string | null;
  limit: number | null;
}

const PLATFORM_META: Record<
  Platform,
  { label: string; badgeColor: string }
> = {
  bluesky: { label: "Bluesky", badgeColor: "text-sky-500" },
  instagram: { label: "Instagram", badgeColor: "text-pink-600" },
  pinterest: { label: "Pinterest", badgeColor: "text-rose-600" },
  threads: { label: "Threads", badgeColor: "text-zinc-900" },
  tiktok: { label: "TikTok", badgeColor: "text-zinc-900" },
  youtube: { label: "YouTube", badgeColor: "text-red-600" },
  facebook: { label: "Facebook", badgeColor: "text-blue-600" },
  linkedin: { label: "LinkedIn", badgeColor: "text-blue-700" },
  x: { label: "X", badgeColor: "text-zinc-900" },
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
  { name: "Google Business", platform: "facebook", key: "google_business" },
];

type IntegrationKey = "unsplash" | "google-drive" | "canva" | "dropbox";

interface IntegrationMeta {
  key: IntegrationKey;
  name: string;
  description: string;
  authUrl: string;
  brand: { color: string; bg: string };
  steps: string[];
}

const INTEGRATIONS: IntegrationMeta[] = [
  {
    key: "unsplash",
    name: "Unsplash",
    description: "Browse and import royalty-free photos directly into your posts.",
    authUrl: "https://unsplash.com/developers",
    brand: { color: "#000000", bg: "#FFFFFF" },
    steps: [
      "Create a free developer account at unsplash.com/developers.",
      "Register a new app to obtain an Access Key.",
      "Paste the Access Key into PostPlanify → Settings → Integrations → Unsplash.",
    ],
  },
  {
    key: "google-drive",
    name: "Google Drive",
    description: "Pick images, videos, and PDFs straight from your Drive folders.",
    authUrl: "https://console.cloud.google.com/apis/credentials",
    brand: { color: "#1A73E8", bg: "#E8F0FE" },
    steps: [
      "Open Google Cloud Console and create (or select) a project.",
      "Enable the Google Drive API and configure an OAuth consent screen.",
      "Create OAuth credentials and paste the Client ID + Secret into PostPlanify → Settings → Integrations → Google Drive.",
    ],
  },
  {
    key: "canva",
    name: "Canva",
    description: "Import your Canva designs and edit them in a click.",
    authUrl: "https://www.canva.com/developers/",
    brand: { color: "#00C4CC", bg: "#E5FAFA" },
    steps: [
      "Sign up for the Canva Developers program and create an integration.",
      "Add PostPlanify as an authorized redirect URI.",
      "Copy the Client ID and Secret into PostPlanify → Settings → Integrations → Canva.",
    ],
  },
  {
    key: "dropbox",
    name: "Dropbox",
    description: "Browse and import files from any Dropbox folder.",
    authUrl: "https://www.dropbox.com/developers/apps",
    brand: { color: "#0061FF", bg: "#E5EFFF" },
    steps: [
      "Go to the Dropbox App Console and create a scoped app (Full Dropbox).",
      "Set the OAuth 2 redirect URI to https://trustiify.agency/api/integrations/dropbox/callback.",
      "Paste the App key and secret into PostPlanify → Settings → Integrations → Dropbox.",
    ],
  },
];

const INTEGRATIONS_LS_KEY = "postplanify.connectedIntegrations";

function IntegrationIcon({ k, className }: { k: IntegrationKey; className?: string }) {
  const sz = className ?? "w-6 h-6";
  switch (k) {
    case "unsplash":
      return (
        <svg viewBox="0 0 48 48" className={sz} aria-hidden>
          <path d="M28 6h12v12h-4V14h-8V6zM16 6H4v12h4v-4h8V6z" fill="#000" />
          <circle cx="24" cy="30" r="12" fill="#000" />
        </svg>
      );
    case "google-drive":
      return (
        <svg viewBox="0 0 48 48" className={sz} aria-hidden>
          <path d="M15.6 7.4l-9 15.6 6.5 0 9-15.6z" fill="#0066DA" />
          <path d="M32.4 7.4l-9 15.6 6.5 0 9-15.6z" fill="#00AC47" />
          <path d="M9 27l6.5 11.3 6.5-11.3z" fill="#EA4335" />
          <path d="M22 27l6.5 11.3 6.5-11.3z" fill="#00832D" />
          <path d="M15.6 7.4L24 23l6.5-11.3z" fill="#008329" />
        </svg>
      );
    case "canva":
      return (
        <span
          className={`inline-flex items-center justify-center rounded-md font-bold text-white ${sz}`}
          style={{ backgroundColor: "#00C4CC", fontSize: "1rem" }}
        >
          C
        </span>
      );
    case "dropbox":
      return (
        <svg viewBox="0 0 48 48" className={sz} aria-hidden>
          <path d="M14 6 L24 13 L34 6 L24 0 Z" fill="#0061FF" />
          <path d="M14 24 L24 31 L34 24 L24 18 Z" fill="#0061FF" />
          <path d="M0 16 L10 23 L20 16 L10 9 Z" fill="#0061FF" />
          <path d="M28 16 L38 9 L48 16 L38 23 Z" fill="#0061FF" />
          <path d="M0 34 L10 41 L20 34 L10 27 Z" fill="#0061FF" />
          <path d="M28 34 L38 27 L48 34 L38 41 Z" fill="#0061FF" />
          <path d="M14 42 L24 49 L34 42 L24 35 Z" fill="#0061FF" />
        </svg>
      );
  }
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [profiles, setProfiles] = useState<ProfileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Integration connections (Unsplash / Drive / Canva / Dropbox).
  // Tracked locally so the UI can show "Connected" once credentials are added in Settings.
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<IntegrationKey>>(
    () => new Set<IntegrationKey>()
  );
  const [setupIntegration, setSetupIntegration] = useState<IntegrationKey | null>(null);

  // Load connection state from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(INTEGRATIONS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        const valid = INTEGRATIONS.map((i) => i.key) as string[];
        setConnectedIntegrations(new Set(parsed.filter((k) => valid.includes(k)) as IntegrationKey[]));
      }
    } catch {
      // Ignore corruption — start with empty set.
    }
  }, []);

  function persistIntegrations(next: Set<IntegrationKey>) {
    setConnectedIntegrations(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(INTEGRATIONS_LS_KEY, JSON.stringify(Array.from(next)));
    }
  }

  function markConnected(k: IntegrationKey) {
    const next = new Set(connectedIntegrations);
    next.add(k);
    persistIntegrations(next);
    showToast(`${INTEGRATIONS.find((i) => i.key === k)?.name ?? k} marked as connected.`, "success");
    setSetupIntegration(null);
  }

  function disconnect(k: IntegrationKey) {
    const next = new Set(connectedIntegrations);
    next.delete(k);
    persistIntegrations(next);
    showToast(`${INTEGRATIONS.find((i) => i.key === k)?.name ?? k} disconnected.`, "info");
  }

  const showToast = (message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchAccounts = async () => {
    setError(null);
    try {
      const res = await fetch("/api/social-accounts/list", {
        cache: "no-store",
        headers: getOverrideHeaders(),
      });
      const data: ApiResponse = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error((data as unknown as { error?: string }).error || "Failed to load accounts");
      }
      setAccounts(data.accounts);
      setProfiles(data.profiles);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load accounts";
      setError(msg);
      setAccounts([]);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Detect ?connected=1 / ?error= in the URL — show a toast on first paint
  // after the user returns from the hosted connect page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      showToast("Accounts updated. Reloading connections...", "success");
      // Refresh the account list to pick up newly linked profiles.
      fetchAccounts();
      // Clean the URL so a refresh doesn't re-toast.
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
    } else if (params.get("error")) {
      showToast(`Connection failed: ${params.get("error")}`, "error");
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [connecting, setConnecting] = useState(false);

  const openConnectPage = async (platformKey?: string) => {
    if (connecting) return;
    setConnecting(true);
    try {
      const res = await fetch("/api/social-accounts/connect-url", {
        method: "GET",
        cache: "no-store",
        headers: getOverrideHeaders(),
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || "Failed to open connect page");
      }
      // Optional: append a platform filter via the JWT page query if upload-post
      // supports it. For now, the hosted page lists all platforms — the user
      // picks which one to link.
      showToast(
        platformKey
          ? `Opening ${platformKey} connect page in new tab...`
          : "Opening connect page in new tab...",
        "info"
      );
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to open connect page";
      showToast(msg, "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    showToast("Refreshing accounts from upload-post.com...", "info");
    await fetchAccounts();
    setRefreshingAll(false);
    if (!error) {
      showToast("Accounts refreshed successfully", "success");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    setConfirmDeleteId(null);
    // upload-post.com does not expose a per-platform disconnect endpoint via
    // this JWT; removing the account locally and asking the user to revoke via
    // the hosted connect page (or upload-post.com directly).
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(null);
    showToast(
      "Account removed from view. To revoke at source, open the connect page and unlink it.",
      "info"
    );
  };

  return (
    <div className="p-3 lg:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">Social Accounts</h2>
              {(() => {
                const cfg = getHelpConfig("accounts");
                if (!cfg) return null;
                return <PageHelp config={cfg} align="left" buttonClassName="rounded-full" />;
              })()}
            </div>
            <p className="text-muted-foreground">
              Connect and manage your social media accounts
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={refreshingAll || loading}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {refreshingAll ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </button>
          <button
            type="button"
            onClick={() => openConnectPage()}
            disabled={connecting}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
          >
            {connecting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ExternalLink className="size-4" />
            )}
            Connect accounts
          </button>
        </div>

        {/* Error banner */}
        {error && !loading && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-900">Could not load accounts</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={handleRefreshAll}
              className="text-xs font-medium text-rose-700 hover:text-rose-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Card 1: Connected Accounts */}
        <div className="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="font-semibold leading-none tracking-tight">
              Connected Accounts
            </div>
            <div className="text-sm text-zinc-500">
              {profiles.length > 0
                ? `${accounts.length} account${accounts.length === 1 ? "" : "s"} across ${profiles.length} profile${profiles.length === 1 ? "" : "s"} on upload-post.com`
                : "Manage your connected social media accounts"}
            </div>
          </div>
          <div className="p-6 pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-sm text-zinc-500">
                <Loader2 className="size-5 animate-spin" />
                Loading connected accounts from upload-post.com...
              </div>
            ) : accounts.length === 0 && !error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center">
                  <Info className="size-6 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-900">No accounts connected yet</p>
                <p className="text-xs text-zinc-500 max-w-sm">
                  Use the &quot;Connect&quot; buttons below to link your social media accounts.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {accounts.map((account) => (
                    <ConnectedAccountCard
                      key={account.id}
                      account={account}
                      isDeleting={deletingId === account.id}
                      onDelete={() => setConfirmDeleteId(account.id)}
                      onReconnect={() => openConnectPage(PLATFORM_META[account.platform].label)}
                    />
                  ))}
                </div>
              </div>
            )}
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
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs">
                <AlertCircle className="size-4 text-amber-600 shrink-0" />
                <span className="text-amber-800">
                  Connection works best on Chrome or Edge.
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
                    onConnect={() => openConnectPage(p.name)}
                  />
                ))}
              </div>
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

        {/* Card 3: Available Integrations (Unsplash / Drive / Canva / Dropbox) */}
        <div className="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="font-semibold leading-none tracking-tight">
              Available Integrations
            </div>
            <div className="text-sm text-zinc-500">
              Connect cloud storage and design tools to import media directly into your posts.
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {INTEGRATIONS.map((it) => {
                const isConnected = connectedIntegrations.has(it.key);
                return (
                  <div
                    key={it.key}
                    className={`p-4 rounded-lg border bg-white flex items-start gap-3 transition-colors ${
                      isConnected ? "border-emerald-300" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <IntegrationIcon k={it.key} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-zinc-900">{it.name}</span>
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                            <CheckCircle2 className="size-3" />
                            Connected
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{it.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {isConnected ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setSetupIntegration(it.key)}
                              className="inline-flex items-center justify-center h-7 px-3 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-medium"
                            >
                              Manage
                            </button>
                            <button
                              type="button"
                              onClick={() => disconnect(it.key)}
                              className="inline-flex items-center justify-center h-7 px-3 rounded-md text-rose-600 hover:bg-rose-50 text-xs font-medium"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSetupIntegration(it.key)}
                            className="inline-flex items-center justify-center h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-zinc-100 border border-zinc-200 flex items-start gap-2">
              <Info className="size-3.5 mt-0.5 shrink-0 text-zinc-500" />
              <p className="text-xs text-zinc-500">
                Integrations use your own provider credentials and are stored encrypted. They only get
                used to import media for your posts — never to send messages, post, or access private data.
              </p>
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

      {/* Integration Setup Modal */}
      {setupIntegration && (
        <IntegrationSetupModal
          meta={INTEGRATIONS.find((i) => i.key === setupIntegration)!}
          isConnected={connectedIntegrations.has(setupIntegration)}
          onClose={() => setSetupIntegration(null)}
          onMarkConnected={() => markConnected(setupIntegration)}
          onDisconnect={() => disconnect(setupIntegration)}
        />
      )}
    </div>
  );
}

function ConnectedAccountCard({
  account,
  isDeleting,
  onDelete,
  onReconnect,
}: {
  account: ConnectedAccount;
  isDeleting: boolean;
  onDelete: () => void;
  onReconnect: () => void;
}) {
  return (
    <div className={`group flex items-center justify-between p-4 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors bg-white ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative w-11 h-11 shrink-0">
          {account.img ? (
            <img
              src={account.img}
              alt={account.handle}
              className="rounded-full w-11 h-11 object-cover bg-zinc-100"
            />
          ) : (
            <div className="rounded-full w-11 h-11 flex items-center justify-center text-sm font-semibold bg-zinc-200 text-zinc-700">
              {account.handle.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-200">
            <PlatformBadge platform={account.platform} />
          </div>
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm text-zinc-900 truncate">
              {account.handle}
            </p>
            {account.reauthRequired ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                <AlertCircle className="size-3" />
                Re-auth required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                <CheckCircle2 className="size-3" />
                Connected
              </span>
            )}
          </div>
          {account.displayName && account.displayName !== account.handle && (
            <p className="text-xs text-zinc-500 truncate">{account.displayName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {account.reauthRequired ? (
          <button
            type="button"
            onClick={onReconnect}
            title="Reconnect this account in a new tab"
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-600 px-3 h-8 text-xs font-medium text-white"
          >
            <RefreshCw className="size-3.5" />
            Reconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={onReconnect}
            title="Open connect page in a new tab"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 h-8 text-xs font-medium hover:bg-zinc-50"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label="Remove account from view"
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
  onConnect,
}: {
  name: string;
  platform: Platform;
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
        className="inline-flex items-center justify-center h-8 px-6 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium whitespace-nowrap min-w-[100px]"
      >
        Connect
        <ExternalLink className="size-3 ml-1.5" />
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
            <h3 className="text-lg font-semibold text-zinc-900">Remove account?</h3>
            <p className="text-sm text-zinc-500 mt-1">
              This hides <span className="font-semibold text-zinc-900">{account.handle}</span>{" "}
              from this view. To fully revoke at source, disconnect it from your
              upload-post.com dashboard.
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
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationSetupModal({
  meta,
  isConnected,
  onClose,
  onMarkConnected,
  onDisconnect,
}: {
  meta: IntegrationMeta;
  isConnected: boolean;
  onClose: () => void;
  onMarkConnected: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-6 border-b border-zinc-200">
          <div className="size-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: meta.brand.bg }}>
            <IntegrationIcon k={meta.key} className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              {isConnected ? `Manage ${meta.name}` : `Connect ${meta.name}`}
              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="size-3.5" />
                  Connected
                </span>
              ) : null}
            </h3>
            <p className="text-sm text-zinc-500 mt-1">{meta.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500 shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Setup steps
            </p>
            <ol className="space-y-2">
              {meta.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span
                    className="size-5 shrink-0 inline-flex items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: meta.brand.color }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <a
            href={meta.authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 text-sm font-medium w-full"
          >
            Open {meta.name} developer console
            <ExternalLink className="size-3.5" />
          </a>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
            <p>
              {isConnected
                ? "You can revoke access anytime from here or from your provider account."
                : "After adding credentials in Settings, come back and click below to enable importing."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 bg-zinc-50 border-t border-zinc-200">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-medium"
          >
            Close
          </button>
          {isConnected ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={onMarkConnected}
              className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
            >
              Mark as connected
            </button>
          )}
        </div>
      </div>
    </div>
  );
}