// Per-platform publishing capability matrix.
//
// Ported from the Adsify publishing engine (capability-matrix.ts + endpoints.ts)
// and re-keyed to Trustiify's PlatformId set. This is the single source of truth
// for character limits, supported media kinds, required targets, per-24h hard
// caps, and media size/format requirements. Consumed by:
//   - the composer's per-platform advanced options (Feature 1)
//   - the requirements / readiness checker (Feature 2)
//
// Client-safe: pure data, no server-only imports.

import type { PlatformId } from "@/lib/platforms";

export type MediaKind = "text" | "image" | "video";

export interface MediaRequirement {
  /** Max file size in bytes for this media kind. */
  maxBytes: number;
  /** Allowed MIME types. */
  formats: string[];
  /** Max number of items of this kind in a single post. */
  maxItems?: number;
  /** Video only: min/max duration in seconds. */
  minDurationSec?: number;
  maxDurationSec?: number;
}

export interface PlatformCapability {
  displayName: string;
  supportsText: boolean;
  supportsImage: boolean;
  supportsVideo: boolean;
  /** Max length of the title/headline field, where the platform has one. */
  maxTitleLength: number;
  /** Max length of the caption/description body. */
  maxCaptionLength: number;
  /** Max posts per rolling 24h window (Upload-Post hard cap). */
  hardCapPer24h: number;
  /** Required target fields that must be set before publishing. */
  requiredTargets: RequiredTarget[];
  /** Per-media-kind size/format requirements. */
  media: Partial<Record<Exclude<MediaKind, "text">, MediaRequirement>>;
}

export interface RequiredTarget {
  /** Key inside the platform's advanced options that must be non-empty. */
  optionKey: string;
  label: string;
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const CAPABILITY_MATRIX: Record<PlatformId, PlatformCapability> = {
  instagram: {
    displayName: "Instagram",
    supportsText: false,
    supportsImage: true,
    supportsVideo: true,
    maxTitleLength: 0,
    maxCaptionLength: 2200,
    hardCapPer24h: 50,
    requiredTargets: [],
    media: {
      image: { maxBytes: 30 * MB, formats: ["image/jpeg", "image/png", "image/webp"], maxItems: 10 },
      video: { maxBytes: 100 * MB, formats: ["video/mp4", "video/quicktime"], minDurationSec: 3, maxDurationSec: 90 },
    },
  },
  tiktok: {
    displayName: "TikTok",
    supportsText: false,
    supportsImage: true,
    supportsVideo: true,
    maxTitleLength: 90,
    maxCaptionLength: 2200,
    hardCapPer24h: 15,
    requiredTargets: [],
    media: {
      image: { maxBytes: 20 * MB, formats: ["image/jpeg", "image/webp"], maxItems: 35 },
      video: { maxBytes: 287 * MB, formats: ["video/mp4", "video/quicktime"], minDurationSec: 3, maxDurationSec: 600 },
    },
  },
  youtube: {
    displayName: "YouTube",
    supportsText: false,
    supportsImage: false,
    supportsVideo: true,
    maxTitleLength: 100,
    maxCaptionLength: 5000,
    hardCapPer24h: 10,
    requiredTargets: [],
    media: {
      video: {
        maxBytes: 256 * GB,
        formats: ["video/mp4", "video/quicktime", "video/x-matroska", "video/webm"],
        maxDurationSec: 43200,
      },
    },
  },
  pinterest: {
    displayName: "Pinterest",
    supportsText: false,
    supportsImage: true,
    supportsVideo: true,
    maxTitleLength: 100,
    maxCaptionLength: 500,
    hardCapPer24h: 20,
    requiredTargets: [{ optionKey: "pinterest_board_id", label: "Board" }],
    media: {
      image: {
        maxBytes: 32 * MB,
        formats: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff"],
      },
      video: { maxBytes: 1 * GB, formats: ["video/mp4", "video/quicktime"], minDurationSec: 4, maxDurationSec: 900 },
    },
  },
  twitter: {
    displayName: "X (Twitter)",
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    maxTitleLength: 0,
    // Long-text-as-post is on by default in Adsify, so we use the extended cap.
    maxCaptionLength: 25000,
    hardCapPer24h: 10,
    requiredTargets: [],
    media: {
      image: { maxBytes: 5 * MB, formats: ["image/jpeg", "image/png", "image/gif", "image/webp"], maxItems: 4 },
      video: { maxBytes: 100 * MB, formats: ["video/mp4"], maxDurationSec: 140 },
    },
  },
  linkedin: {
    displayName: "LinkedIn",
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    maxTitleLength: 200,
    maxCaptionLength: 3000,
    hardCapPer24h: 150,
    requiredTargets: [],
    media: {
      image: { maxBytes: 5 * MB, formats: ["image/jpeg", "image/png", "image/gif"] },
      video: { maxBytes: 200 * MB, formats: ["video/mp4"], maxDurationSec: 600 },
    },
  },
  threads: {
    displayName: "Threads",
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    maxTitleLength: 0,
    maxCaptionLength: 500,
    hardCapPer24h: 50,
    requiredTargets: [],
    media: {
      image: { maxBytes: 8 * MB, formats: ["image/jpeg", "image/png"], maxItems: 10 },
      video: { maxBytes: 100 * MB, formats: ["video/mp4", "video/quicktime"], maxDurationSec: 300 },
    },
  },
  facebook: {
    displayName: "Facebook",
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    maxTitleLength: 255,
    maxCaptionLength: 63206,
    hardCapPer24h: 25,
    requiredTargets: [{ optionKey: "facebook_page_id", label: "Page" }],
    media: {
      image: { maxBytes: 30 * MB, formats: ["image/jpeg", "image/png", "image/gif", "image/webp"] },
      video: { maxBytes: 1 * GB, formats: ["video/mp4", "video/quicktime"], maxDurationSec: 14400 },
    },
  },
  bluesky: {
    displayName: "Bluesky",
    supportsText: true,
    supportsImage: true,
    supportsVideo: false,
    maxTitleLength: 0,
    maxCaptionLength: 300,
    hardCapPer24h: 50,
    requiredTargets: [],
    media: {
      image: { maxBytes: 1 * MB, formats: ["image/jpeg", "image/png", "image/gif", "image/webp"], maxItems: 4 },
    },
  },
  discord: {
    displayName: "Discord",
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    maxTitleLength: 0,
    maxCaptionLength: 2000,
    hardCapPer24h: 0,
    requiredTargets: [],
    media: {
      image: { maxBytes: 8 * MB, formats: ["image/jpeg", "image/png", "image/gif", "image/webp"], maxItems: 10 },
      video: { maxBytes: 8 * MB, formats: ["video/mp4", "video/quicktime"], maxDurationSec: 0 },
    },
  },
  telegram: {
    displayName: "Telegram",
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    maxTitleLength: 0,
    maxCaptionLength: 1024,
    hardCapPer24h: 0,
    requiredTargets: [],
    media: {
      image: { maxBytes: 10 * MB, formats: ["image/jpeg", "image/png", "image/webp"], maxItems: 10 },
      video: { maxBytes: 50 * MB, formats: ["video/mp4"], maxDurationSec: 0 },
    },
  },
  reddit: {
    displayName: "Reddit",
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    maxTitleLength: 300,
    maxCaptionLength: 40000,
    hardCapPer24h: 0,
    requiredTargets: [],
    media: {
      image: { maxBytes: 20 * MB, formats: ["image/jpeg", "image/png", "image/gif"], maxItems: 1 },
      video: { maxBytes: 1 * GB, formats: ["video/mp4"], maxDurationSec: 900 },
    },
  },
  google_business: {
    displayName: "Google Business",
    supportsText: true,
    supportsImage: true,
    supportsVideo: true,
    maxTitleLength: 0,
    maxCaptionLength: 1500,
    hardCapPer24h: 0,
    requiredTargets: [],
    media: {
      image: { maxBytes: 5 * MB, formats: ["image/jpeg", "image/png"], maxItems: 10 },
      video: { maxBytes: 100 * MB, formats: ["video/mp4"], maxDurationSec: 30 },
    },
  },
};

export function getCapability(platform: PlatformId): PlatformCapability {
  return CAPABILITY_MATRIX[platform];
}

export function supportsMediaKind(platform: PlatformId, kind: MediaKind): boolean {
  const cap = CAPABILITY_MATRIX[platform];
  if (kind === "text") return cap.supportsText;
  if (kind === "image") return cap.supportsImage;
  return cap.supportsVideo;
}
