"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Upload,
  UploadCloud,
  Calendar,
  X,
  Sparkles,
  ChevronDown,
  Plus,
  ImagePlus,
  Undo2,
  Download,
  Trash2,
  Send,
  Clock,
  Layers,
  Image as ImageIcon,
  Video,
  FileText,
  Eye,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Settings2,
  MessageSquare,
  Hash,
  Users,
  ArrowUpRight,
  Timer,
  History as HistoryIcon,
  ListChecks,
  Zap,
  Crop,
  RefreshCw,
  Link2,
  Info,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PLATFORMS, getPlatform, type PlatformId } from "@/lib/platforms";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { ProPlatformIcon, ProOverflowBadge } from "@/components/dashboard/pro-platform-icon";
import { ProStatIcon } from "@/components/dashboard/pro-stat-icon";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import {
  parseCsv,
  normalizePlatforms,
  normalizeHashtags,
  normalizeMediaUrls,
  normalizePostType,
  normalizePlacement,
} from "@/lib/bulk-schedule/csv";
import { zonedDateTimeToDate } from "@/lib/datetime/zoned";
import { AdvancedOptionsPanel } from "@/components/dashboard/advanced-options-panel";
import { AICaptionsDialog } from "@/components/dashboard/ai-captions-dialog";
import { fitCaptionForPlatform, PLATFORM_LIMITS, getPlatformLimit } from "@/lib/ai/caption-fit";
import { CAPABILITY_MATRIX } from "@/lib/publishing/capability-matrix";
import { UnsplashDialog } from "@/components/dashboard/unsplash-dialog";
import { CanvaDialog, type ImportedFile } from "@/components/dashboard/canva-dialog";
import { GoogleDriveDialog } from "@/components/dashboard/google-drive-dialog";
import { DropboxDialog } from "@/components/dashboard/dropbox-dialog";
import { CropModal } from "@/components/dashboard/crop-modal";
import { CoverImageModal } from "@/components/dashboard/cover-image-modal";
import { CollaboratorsModal } from "@/components/dashboard/collaborators-modal";
import { HashtagsDropdown } from "@/components/dashboard/hashtags-dropdown";
import { MetadataRulesPanel, type MetadataRules } from "@/components/dashboard/metadata-rules-panel";
import { PlatformTileBar } from "@/components/dashboard/platform-tile-bar";
import { BrandIcons } from "@/components/dashboard/brand-icons";
import { checkRequirements, type MediaMeta, type ReadinessReport } from "@/lib/publishing/requirements";
import { getDefaultOptions, type PlatformAdvancedOptions } from "@/lib/publishing/advanced-options";
import type { MediaKind } from "@/lib/publishing/capability-matrix";
import type { ComposerMode } from "@/components/dashboard/composer-mode-selector";
import type { TrialReelMode } from "@/components/dashboard/trial-reel-card";
import { PlatformFeatureMatrixModal } from "@/components/dashboard/platform-feature-matrix-modal";
import { BulkContentTypeSelector } from "@/components/dashboard/bulk-content-type-selector";
import {
  acceptsMediaKind,
  normalizeBulkContentType,
  platformsForBulkContent,
  type BulkContentType,
  type CarouselMediaMode,
} from "@/lib/bulk-schedule/content-types";
import { probeVideoMetadataClient, type VideoMetadata } from "@/lib/media/video-metadata";

type BulkItemSource = "upload" | "csv";

type BulkCarouselSlide = {
  id: string;
  file?: File;
  previewUrl: string;
  url: string;
  kind: "image" | "video";
  name: string;
  size: number;
  mimeType: string;
  uploadStatus: "uploading" | "ready" | "error";
  uploadError?: string;
  storedPath?: string;
};

type BulkItemBase = {
  id: string;
  url: string;
  kind: "text" | "image" | "video" | "document";
  name: string;
  size: number;
  caption: string;
  scheduledAt: string;
  scheduledDate: string;
  scheduledTime: string;
  accountIds: PlatformId[];
  postIn: "feed" | "story";
  youtubeTitle: string;
  youtubeTags: string;
  pinterestBoard: string;
  autoAddMusic: boolean;
  community: boolean;
  profile: string;
  hashtags: string[];
  uploadStatus: "uploading" | "ready" | "error";
  uploadError?: string;
  uploadProgress?: number;
  // ── Post Type (parity with Create Post) ──
  postType: ComposerMode;
  contentType?: BulkContentType;
  carouselMediaMode?: CarouselMediaMode;
  // Carousel — when postType === "carousel", holds the slides (2–10). `url`/`kind` mirror first slide for preview compat.
  carouselSlides?: BulkCarouselSlide[];
  // Trial Reel — when postType === "trial_reel"
  trialMode?: TrialReelMode;
  // Document — when postType === "document"
  documentTitle?: string;
  documentPageCount?: number | null;
  // ── Full-fidelity extensions (parity with Create Post) ──
  captionByPlatform?: Partial<Record<PlatformId, string>>;
  firstComment?: string;
  altText?: string;
  tagUsers?: string;
  customCoverUrl?: string | null;
  frameCoverUrl?: string | null;
  collaborators?: string[];
  advancedByPlatform?: Partial<Record<PlatformId, PlatformAdvancedOptions>>;
  // per-item media kind override for advanced panel
  mediaKind?: MediaKind;
  mediaMetadata?: VideoMetadata;
};

type UploadedBulkItem = BulkItemBase & {
  source: "upload";
  file: File;
  previewUrl: string;
  storedPath?: string;
};

type CsvBulkItem = BulkItemBase & {
  source: "csv";
  mediaUrl: string;
};

type BulkItem = UploadedBulkItem | CsvBulkItem;

const MAX_FILES = 20;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_BULK_PAYLOAD_FILES = 100;
const MAX_FUTURE_DAYS = 365;
const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

const ACCEPTED_DOCUMENT_EXTS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"] as const;
const ACCEPTED_DOCUMENT_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
] as const;

const POST_TYPE_ALLOWED_PLATFORMS: Record<ComposerMode, PlatformId[] | null> = {
  standard: null, // no restriction (image/video kind still filters video-only)
  carousel: ["instagram", "facebook", "threads"],
  trial_reel: ["instagram"],
  document: ["linkedin"],
};

function composerModeForContentType(type: BulkContentType): ComposerMode {
  if (type === "carousel") return "carousel";
  if (type === "document") return "document";
  if (type === "trial_reel") return "trial_reel";
  return "standard";
}

function bulkAcceptForContentType(type: BulkContentType, carouselMode: CarouselMediaMode): string {
  if (type === "document") return [...ACCEPTED_DOCUMENT_EXTS, ...ACCEPTED_DOCUMENT_MIMES].join(",");
  if (type === "long_video" || type === "short_video" || type === "trial_reel") return "video/mp4,video/quicktime,video/webm";
  if (type === "image") return "image/jpeg,image/png,image/webp,image/gif";
  if (type === "carousel") {
    if (carouselMode === "images") return "image/jpeg,image/png,image/webp,image/gif";
    return ACCEPTED_MIME_TYPES.join(",");
  }
  return ACCEPTED_MIME_TYPES.join(",");
}

function contentTypeForLegacyMode(mode: ComposerMode): BulkContentType {
  if (mode === "carousel") return "carousel";
  if (mode === "document") return "document";
  if (mode === "trial_reel") return "trial_reel";
  return "image";
}

const TIMEZONES: Array<{ id: string; label: string }> = [
  { id: "Africa/Lagos", label: "Africa/Lagos" },
  { id: "America/New_York", label: "America/New_York" },
  { id: "America/Los_Angeles", label: "America/Los_Angeles" },
  { id: "America/Chicago", label: "America/Chicago" },
  { id: "America/Sao_Paulo", label: "America/Sao_Paulo" },
  { id: "Europe/London", label: "Europe/London" },
  { id: "Europe/Paris", label: "Europe/Paris" },
  { id: "Europe/Berlin", label: "Europe/Berlin" },
  { id: "Europe/Madrid", label: "Europe/Madrid" },
  { id: "Europe/Rome", label: "Europe/Rome" },
  { id: "Asia/Dubai", label: "Asia/Dubai" },
  { id: "Asia/Kolkata", label: "Asia/Kolkata" },
  { id: "Asia/Singapore", label: "Asia/Singapore" },
  { id: "Asia/Tokyo", label: "Asia/Tokyo" },
  { id: "Asia/Shanghai", label: "Asia/Shanghai" },
  { id: "Australia/Sydney", label: "Australia/Sydney" },
  { id: "UTC", label: "UTC" },
];

const INTERVALS = [
  { id: "1d", label: "Daily" },
  { id: "3d", label: "Every 3 days" },
  { id: "7d", label: "Weekly" },
  { id: "14d", label: "Every 2 weeks" },
  { id: "30d", label: "Monthly" },
];

const STORAGE_KEY = "pp.bulk-schedule.draft.v1";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultTime(): string {
  return "08:00";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string, fallbackName: string): File {
  const [meta, b64] = dataUrl.split(",");
  const mimeMatch = meta.match(/data:([^;]+)(?:;base64)?/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const isBase64 = /;base64/.test(meta);
  const ext = mime.includes("png")
    ? "png"
    : mime.includes("webp")
    ? "webp"
    : mime.includes("gif")
    ? "gif"
    : "jpg";
  const name = /\.([a-z0-9]{2,5})$/i.test(fallbackName)
    ? fallbackName
    : `${fallbackName.replace(/\.[^.]+$/, "")}.${ext}`;
  if (isBase64) {
    const binary = atob(b64 ?? "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], name, { type: mime });
  }
  const decoded = decodeURIComponent(b64 ?? "");
  const bytes = new TextEncoder().encode(decoded);
  return new File([bytes], name, { type: mime });
}

function splitDateTime(dt: string): { date: string; time: string } {
  if (!dt || !dt.includes("T")) return { date: todayISO(), time: "08:00" };
  const [date, time] = dt.split("T");
  return { date: date || todayISO(), time: (time || "08:00").slice(0, 5) };
}

function wallClockToUTC(date: string, time: string, timezone: string): Date | null {
  const [hh, mm] = time.split(":").map((s) => parseInt(s, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const [y, m, d] = date.split("-").map((s) => parseInt(s, 10));
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return zonedDateTimeToDate({ year: y, month: m, day: d, hour: hh, minute: mm }, timezone);
}

function getEffectiveLimit(pid: PlatformId, item: BulkItem): number {
  const cap = CAPABILITY_MATRIX[pid as unknown as keyof typeof CAPABILITY_MATRIX];
  if (cap) {
    // Twitter long-text-as-post inflates limit from 280 → 25000 when enabled (default true).
    if (pid === "twitter") {
      const adv = (item as BulkItemBase).advancedByPlatform?.twitter as Record<string, unknown> | undefined;
      const longText = adv?.twitter_long_text_as_post;
      // undefined = default true (same as FIELD_SPECS default)
      if (longText === false) return 280;
      return cap.maxCaptionLength; // 25000
    }
    return cap.maxCaptionLength;
  }
  const p = PLATFORMS.find((pl) => pl.id === pid);
  return p?.charLimit ?? 2200;
}

function pickCharLimitFor(item: BulkItem): number {
  if (item.accountIds.length === 0) return 2200;
  let min = Infinity;
  for (const id of item.accountIds) {
    const lim = getEffectiveLimit(id, item);
    if (lim < min) min = lim;
  }
  return min === Infinity ? 2200 : min;
}

function getMediaKindForItem(item: BulkItem): MediaKind {
  const base = item as BulkItemBase;
  const pt = (base.postType ?? "standard") as ComposerMode;
  if (pt === "document") return "text";
  if (pt === "carousel") {
    const slides = base.carouselSlides;
    if (!slides || slides.length === 0) return "image";
    const hasVideo = slides.some((s) => s.kind === "video");
    const allImages = slides.every((s) => s.kind === "image");
    if (hasVideo && !allImages) return "video";
    return hasVideo ? "video" : "image";
  }
  if (pt === "trial_reel") return "video";
  // standard
  return item.kind === "video" ? "video" : item.kind === "document" || item.kind === "text" ? "text" : "image";
}

function isVideoOnlyPlatform(id: PlatformId): boolean {
  return !!PLATFORMS.find((p) => p.id === id)?.videoOnly;
}

function filterAccountsForKind(kind: BulkItem["kind"], ids: PlatformId[]): PlatformId[] {
  if (kind === "image") return ids.filter((id) => !isVideoOnlyPlatform(id));
  if (kind === "text") return ids.filter((id) => CAPABILITY_MATRIX[id]?.supportsText);
  return ids;
}

function allowedPlatformsForPostType(postType: ComposerMode): PlatformId[] | null {
  return POST_TYPE_ALLOWED_PLATFORMS[postType] ?? null;
}

function allowedPlatformsForItem(item: BulkItemBase): PlatformId[] | null {
  if (item.contentType) {
    return platformsForBulkContent(item.contentType, item.carouselMediaMode ?? "images");
  }
  const pt = (item.postType ?? "standard") as ComposerMode;
  return POST_TYPE_ALLOWED_PLATFORMS[pt] ?? null;
}

function filterAccountsForPostType(postType: ComposerMode, ids: PlatformId[]): PlatformId[] {
  const allowed = allowedPlatformsForPostType(postType);
  if (!allowed) return ids;
  const set = new Set<string>(allowed);
  return ids.filter((id) => set.has(id));
}

function filterAccountsForItem(item: BulkItemBase, ids: PlatformId[]): PlatformId[] {
  let filtered = filterAccountsForKind(item.kind as BulkItem["kind"], ids);
  const allowed = allowedPlatformsForItem(item);
  if (allowed) {
    const set = new Set<string>(allowed);
    filtered = filtered.filter((id) => set.has(id));
  }
  return filtered;
}

function buildReadinessForItem(item: BulkItem) {
  const base = item as BulkItemBase;
  const postType = (base.postType ?? "standard") as ComposerMode;
  const mediaKind = getMediaKindForItem(item);
  let media: MediaMeta[] = [];

  if (postType === "document") {
    media = [];
  } else if (postType === "carousel") {
    const slides = base.carouselSlides ?? [];
    if (slides.length > 0) {
      media = slides.map((s) => ({
        kind: (s.kind === "video" ? "video" : "image") as MediaKind,
        mimeType: s.mimeType ?? (s.kind === "video" ? "video/mp4" : "image/jpeg"),
        sizeBytes: s.size || 1024 * 500,
      }));
    } else {
      // Fallback single preview (standard compat)
      const fakeMime = item.kind === "video" ? "video/mp4" : "image/jpeg";
      media = [{ kind: mediaKind, mimeType: fakeMime, sizeBytes: item.size || 1024 * 500 }];
    }
  } else if (postType === "trial_reel") {
    const fakeMime = "video/mp4";
    media = [{
      kind: "video" as MediaKind,
      mimeType: fakeMime,
      sizeBytes: item.size || 1024 * 500,
      durationSec: base.mediaMetadata?.durationSec,
      width: base.mediaMetadata?.width,
      height: base.mediaMetadata?.height,
      aspectRatio: base.mediaMetadata?.aspectRatio,
      aspectRatioValue: base.mediaMetadata?.aspectRatioValue,
      orientation: base.mediaMetadata?.orientation,
      isLinkedInRatioValid: base.mediaMetadata?.isLinkedInRatioValid,
      isExtremeVertical: base.mediaMetadata?.isExtremeVertical,
      metadataLoaded: base.mediaMetadata != null,
    }];
  } else if (item.kind === "text") {
    media = [];
  } else {
    const fakeMime = item.kind === "video" ? "video/mp4" : "image/jpeg";
    media = [{
      kind: mediaKind,
      mimeType: fakeMime,
      sizeBytes: item.size || 1024 * 500,
      durationSec: base.mediaMetadata?.durationSec,
      width: base.mediaMetadata?.width,
      height: base.mediaMetadata?.height,
      aspectRatio: base.mediaMetadata?.aspectRatio,
      aspectRatioValue: base.mediaMetadata?.aspectRatioValue,
      orientation: base.mediaMetadata?.orientation,
      isLinkedInRatioValid: base.mediaMetadata?.isLinkedInRatioValid,
      isExtremeVertical: base.mediaMetadata?.isExtremeVertical,
      metadataLoaded: base.mediaMetadata != null,
    }];
  }

  const captionByPlatform: Partial<Record<PlatformId, string>> = {};
  for (const pid of item.accountIds) {
    captionByPlatform[pid] = item.captionByPlatform?.[pid] ?? item.caption;
  }
  return checkRequirements(item.accountIds, {
    captionByPlatform,
    media,
    advancedByPlatform: item.advancedByPlatform ?? {},
    composerMediaKind: mediaKind,
    postType: (item as BulkItemBase).postType,
    contentType: (item as BulkItemBase).contentType,
  });
}

interface ValidationIssue {
  itemId: string;
  message: string;
}

function validateItems(items: BulkItem[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const now = Date.now();
  for (const it of items) {
    const readiness = buildReadinessForItem(it);
    // Deduplicate caption per item (one global caption field, not per-platform)
    const hasMissingCaption = readiness.perPlatform.some((per) =>
      per.issues.some((iss) => iss.code === "missing_caption" && iss.severity === "blocked")
    );
    if (hasMissingCaption) {
      issues.push({ itemId: it.id, message: "Caption is required" });
    }
    // Other blocked issues — one per distinct code per item (avoid 9x duplication)
    const seenCodes = new Set<string>();
    for (const per of readiness.perPlatform) {
      for (const iss of per.issues) {
        if (iss.severity !== "blocked") continue;
        if (iss.code === "missing_caption") continue; // already handled globally
        // Pinterest board: top-level field satisfies requirement; don't double-report
        if (iss.code === "missing_target_pinterest_board_id" && it.pinterestBoard.trim()) continue;
        const key = iss.code;
        if (seenCodes.has(key)) continue;
        seenCodes.add(key);
        issues.push({ itemId: it.id, message: iss.message });
      }
    }
    // Explicit YouTube/Pinterest top-level checks (not covered by capability matrix)
    if (it.accountIds.includes("youtube" as PlatformId) && !it.youtubeTitle.trim()) {
      if (!seenCodes.has("youtube_title")) {
        issues.push({ itemId: it.id, message: "YouTube title is required" });
      }
    }
    if (it.accountIds.includes("pinterest" as PlatformId) && !it.pinterestBoard.trim()) {
      const advBoard = (it.advancedByPlatform?.pinterest as Record<string, unknown> | undefined)?.pinterest_board_id;
      if (!advBoard) {
        issues.push({ itemId: it.id, message: "Pinterest board is required" });
      }
    }
    if (it.accountIds.length === 0) {
      issues.push({ itemId: it.id, message: "No platforms selected" });
    }
    // ── Post Type specific validations ──
    const pt = ((it as BulkItemBase).postType ?? "standard") as ComposerMode;
    const content = (it as BulkItemBase).contentType;
    const allowed = allowedPlatformsForItem(it as BulkItemBase);
    if (allowed) {
      const hasDisallowed = it.accountIds.some((id) => !allowed.includes(id));
      if (hasDisallowed) {
        const disallowedNames = it.accountIds
          .filter((id) => !allowed.includes(id))
          .map((id) => PLATFORMS.find((p) => p.id === id)?.name ?? id)
          .join(", ");
        issues.push({
          itemId: it.id,
          message: `${content === "community" ? "X Community" : content === "story" ? "Stories" : content === "short_video" ? "Shorts & Reels" : content === "long_video" ? "Long video" : content === "trial_reel" || pt === "trial_reel" ? "Trial Reel" : pt === "carousel" ? "This carousel format" : "Document"} is not supported on ${disallowedNames}`,
        });
      }
    }
    if (content === "community") {
      const communityId = (it.advancedByPlatform?.twitter as Record<string, unknown> | undefined)?.twitter_community;
      if (typeof communityId !== "string" || !communityId.trim()) {
        issues.push({ itemId: it.id, message: "X Community ID is required" });
      }
    }
    if (content === "image" && it.kind !== "image") {
      issues.push({ itemId: it.id, message: "Image post requires an image" });
    }
    if ((content === "long_video" || content === "short_video" || content === "trial_reel") && it.kind !== "video") {
      issues.push({ itemId: it.id, message: `${content === "trial_reel" ? "Trial Reel" : content === "short_video" ? "Shorts & Reels" : "Long video"} requires a video` });
    }

    // ── Video Metadata & Aspect Ratio Validations ──
    const meta = (it as BulkItemBase).mediaMetadata;
    if (meta && it.kind === "video") {
      // 1. Shorts & Reels / Trial Reel must be vertical 9:16
      if (content === "short_video" || content === "trial_reel" || pt === "trial_reel") {
        if (meta.orientation === "horizontal" || meta.aspectRatio === "16:9") {
          issues.push({ itemId: it.id, message: "Shorts & Reels require a 9:16 vertical video (detected 16:9 horizontal)" });
        }
      }
      // 2. Stories must be vertical 9:16
      if (content === "story") {
        if (meta.orientation === "horizontal" || meta.aspectRatio === "16:9") {
          issues.push({ itemId: it.id, message: "Stories require a 9:16 vertical video (detected 16:9 horizontal)" });
        }
      }
      // 3. YouTube Shorts 3-minute cap
      if (it.accountIds.includes("youtube" as PlatformId) && content === "short_video") {
        if (meta.durationSec > 180) {
          issues.push({ itemId: it.id, message: `YouTube Shorts cannot exceed 3 minutes (detected ${meta.formattedDuration})` });
        }
      }
      // 4. Facebook Reels 90s cap & Stories 60s cap
      if (it.accountIds.includes("facebook" as PlatformId)) {
        if (content === "short_video" && meta.durationSec > 90) {
          issues.push({ itemId: it.id, message: `Facebook Reels cannot exceed 90 seconds (detected ${meta.formattedDuration})` });
        }
        if (content === "story" && meta.durationSec > 60) {
          issues.push({ itemId: it.id, message: `Facebook Stories cannot exceed 60 seconds (detected ${meta.formattedDuration})` });
        }
      }
      // 5. LinkedIn aspect ratio (1:2.4 to 2.4:1) and 10-minute cap
      if (it.accountIds.includes("linkedin" as PlatformId)) {
        if (meta.isLinkedInRatioValid === false || meta.isExtremeVertical) {
          issues.push({ itemId: it.id, message: `LinkedIn does not support extreme aspect ratios outside 1:2.4–2.4:1 (got ${meta.aspectRatio})` });
        }
        if (meta.durationSec > 600) {
          issues.push({ itemId: it.id, message: `LinkedIn video cannot exceed 10 minutes (detected ${meta.formattedDuration})` });
        }
      }
      // 6. Instagram 300 MB and 15-minute cap
      if (it.accountIds.includes("instagram" as PlatformId)) {
        if (meta.sizeBytes && meta.sizeBytes > 300 * 1024 * 1024) {
          issues.push({ itemId: it.id, message: `Instagram video exceeds 300 MB limit (${Math.round(meta.sizeBytes / (1024 * 1024))} MB)` });
        }
        if (meta.durationSec > 900) {
          issues.push({ itemId: it.id, message: `Instagram video cannot exceed 15 minutes (detected ${meta.formattedDuration})` });
        }
      }
      // 7. Bluesky 100 MB and 180s cap
      if (it.accountIds.includes("bluesky" as PlatformId)) {
        if (meta.sizeBytes && meta.sizeBytes > 100 * 1024 * 1024) {
          issues.push({ itemId: it.id, message: `Bluesky video exceeds 100 MB limit (${Math.round(meta.sizeBytes / (1024 * 1024))} MB)` });
        }
        if (meta.durationSec > 180) {
          issues.push({ itemId: it.id, message: `Bluesky video cannot exceed 180 seconds (detected ${meta.formattedDuration})` });
        }
      }
    }
    if (pt === "carousel") {
      const slides = (it as BulkItemBase).carouselSlides ?? [];
      const effectiveCount = slides.length > 0 ? slides.length : 1;

      if (effectiveCount < 2) {
        issues.push({ itemId: it.id, message: "Carousel needs at least 2 slides" });
      }
      if (effectiveCount > 10) {
        issues.push({ itemId: it.id, message: "Carousel supports at most 10 slides" });
      }
      const carouselMode = (it as BulkItemBase).carouselMediaMode ?? "images";
      if (carouselMode === "images" && slides.some((slide) => slide.kind !== "image")) {
        issues.push({ itemId: it.id, message: "Images-only carousel cannot contain video" });
      }
      if (carouselMode === "mixed" && slides.length > 1) {
        const kinds = new Set(slides.map((slide) => slide.kind));
        if (!kinds.has("image") || !kinds.has("video")) {
          issues.push({ itemId: it.id, message: "Mixed carousel needs at least one image and one video" });
        }
      }

      for (const s of slides) {
        if (s.uploadStatus !== "ready") {
          issues.push({ itemId: it.id, message: `Carousel slide "${s.name}" still uploading` });
          break;
        }
        if (!s.url.startsWith("https://")) {
          issues.push({ itemId: it.id, message: `Carousel slide "${s.name}" not on CDN` });
          break;
        }
      }
    } else if (pt === "trial_reel") {
      const base = it as BulkItemBase;
      if (base.kind !== "video" && base.carouselSlides?.every((s) => s.kind !== "video")) {
        if ((it as BulkItemBase).kind !== "video") {
          issues.push({ itemId: it.id, message: "Trial Reel requires a video" });
        }
      }
    } else if (pt === "document") {
      const base = it as BulkItemBase;
      if (!base.documentTitle?.trim()) {
        issues.push({ itemId: it.id, message: "Document title is required (LinkedIn)" });
      }
      if (base.documentPageCount && base.documentPageCount > 300) {
        issues.push({ itemId: it.id, message: `Document has ~${base.documentPageCount} pages — LinkedIn max 300` });
      }
    }

    // Fallback simple checks for upload status & time (skip for carousel/document which handled per-slide)
    if (pt !== "carousel" && pt !== "document") {
      if (it.source === "upload" && it.uploadStatus !== "ready") {
        issues.push({ itemId: it.id, message: "Still uploading to CDN" });
      }
      if (it.source === "upload" && !it.url.startsWith("https://")) {
        issues.push({ itemId: it.id, message: "Media not on CDN" });
      }
    } else if (pt === "document") {
      if (it.source === "upload" && it.uploadStatus !== "ready") {
        issues.push({ itemId: it.id, message: "Document still uploading" });
      }
      if (it.source === "upload" && !it.url.startsWith("https://")) {
        issues.push({ itemId: it.id, message: "Document not on CDN" });
      }
    }
    const scheduled = Date.parse(it.scheduledAt);
    if (Number.isNaN(scheduled)) {
      issues.push({ itemId: it.id, message: "Invalid scheduled time" });
    } else if (scheduled <= now + 60_000) {
      issues.push({ itemId: it.id, message: "Scheduled time must be in the future" });
    } else if (scheduled - now > MAX_FUTURE_DAYS * 24 * 60 * 60 * 1000) {
      issues.push({ itemId: it.id, message: `More than ${MAX_FUTURE_DAYS} days ahead` });
    }
  }
  // Final dedup
  const seen = new Set<string>();
  return issues.filter((i) => {
    const key = `${i.itemId}:${i.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Persist only CSV items + scheduler settings — uploaded files aren't serializable. */
interface PersistedDraft {
  csvItems: CsvBulkItem[];
  accounts: PlatformId[];
  startDate: string;
  startTime: string;
  postsPerDay: number;
  interval: string;
  timezone: string;
  composerMode?: ComposerMode;
  contentType?: BulkContentType;
  carouselMediaMode?: CarouselMediaMode;
  xCommunityId?: string;
  shareCommunityWithFollowers?: boolean;
}

function loadPersistedDraft(): PersistedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedDraft) : null;
  } catch {
    return null;
  }
}

function savePersistedDraft(draft: PersistedDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Quota / private mode — ignore.
  }
}

function clearPersistedDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function BulkSchedulePage() {
  const t = useTranslations("dashboard");
  const { toast } = useToast();
  const { getIdToken } = useAuth();
  const [items, setItems] = useState<BulkItem[]>([]);
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [startTime, setStartTime] = useState<string>(defaultTime());
  const [postsPerDay, setPostsPerDay] = useState<number>(1);
  const [interval, setInterval] = useState<string>("1d");
  const [timezone, setTimezone] = useState<string>("Africa/Lagos");
  const [tzOpen, setTzOpen] = useState(false);
  const [accounts, setAccounts] = useState<Set<PlatformId>>(new Set());
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<PlatformId>>(new Set());
  const [composerMode, setComposerMode] = useState<ComposerMode>("standard");
  const [contentType, setContentType] = useState<BulkContentType>("image");
  const [carouselMediaMode, setCarouselMediaMode] = useState<CarouselMediaMode>("images");
  const [xCommunityId, setXCommunityId] = useState("");
  const [shareCommunityWithFollowers, setShareCommunityWithFollowers] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [undoStack, setUndoStack] = useState<Array<{ kind: "remove"; item: BulkItem; index: number }>>([]);
  const [aiTarget, setAiTarget] = useState<BulkItem | null>(null);
  const [aiGeneratingItemId, setAiGeneratingItemId] = useState<string | null>(null);
  const [batchAiOpen, setBatchAiOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<BulkItem | null>(null);
  const [coverTarget, setCoverTarget] = useState<BulkItem | null>(null);
  const [collaboratorsTarget, setCollaboratorsTarget] = useState<BulkItem | null>(null);
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const [canvaOpen, setCanvaOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [dropboxOpen, setDropboxOpen] = useState(false);
  const [metadataRules, setMetadataRules] = useState<MetadataRules>({
    enabled: false,
    hashtags: [],
    ctaLine: "",
    mode: "append",
    startDate: "",
    endDate: "",
  });
  const [rulesOpen, setRulesOpen] = useState(false);
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);
  const [batchAdvancedByPlatform, setBatchAdvancedByPlatform] = useState<
    Partial<Record<PlatformId, PlatformAdvancedOptions>>
  >({});
  const [destinationOptions, setDestinationOptions] = useState<{
    boards: Array<{ value: string; label: string }>;
    pages: Array<{ value: string; label: string }>;
  }>({ boards: [], pages: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const customCoverInputRef = useRef<HTMLInputElement>(null);
  const customCoverTargetItemId = useRef<string | null>(null);
  const tzRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  function scheduledSlot(index: number): { scheduledAt: string; date: string; time: string } | null {
    const [year, month, day] = startDate.split("-").map(Number);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    if ([year, month, day, startHour, startMinute].some((value) => !Number.isInteger(value))) return null;
    const perDay = Math.max(1, postsPerDay);
    const intervalDays = parseInt(interval, 10) || 1;
    const dayOffset = Math.floor(index / perDay) * intervalDays;
    const slotOffsetMinutes = (index % perDay) * 30;
    const wall = new Date(Date.UTC(year, month - 1, day + dayOffset, startHour, startMinute + slotOffsetMinutes));
    const localYear = wall.getUTCFullYear();
    const localMonth = wall.getUTCMonth() + 1;
    const localDay = wall.getUTCDate();
    const localHour = wall.getUTCHours();
    const localMinute = wall.getUTCMinutes();
    const instant = zonedDateTimeToDate(
      {
        year: localYear,
        month: localMonth,
        day: localDay,
        hour: localHour,
        minute: localMinute,
      },
      timezone
    );
    if (!instant) return null;
    return {
      scheduledAt: instant.toISOString(),
      date: `${localYear}-${String(localMonth).padStart(2, "0")}-${String(localDay).padStart(2, "0")}`,
      time: `${String(localHour).padStart(2, "0")}:${String(localMinute).padStart(2, "0")}`,
    };
  }

  // Auto-detect timezone on first mount and ensure it appears in the dropdown.
  useEffect(() => {
    try {
      const guess = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (guess) {
        setTimezone(guess);
        // Ensure the guessed zone is selectable even if not in the hard-coded list (rendered dynamically below).
      }
    } catch {
      setTimezone("Africa/Lagos");
    }
  }, []);

  // Fetch connected platforms + destinations for advanced options (Pinterest boards, FB pages)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/social-accounts/list", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          ok?: boolean;
          accounts?: { platform: string }[];
          destinations?: { boards?: { id: string; name: string }[]; pages?: { id: string; name: string }[] };
        };
        if (!data.ok || cancelled) return;
        const pids = new Set<PlatformId>();
        for (const a of data.accounts ?? []) {
          if (PLATFORMS.some((p) => p.id === a.platform)) pids.add(a.platform as PlatformId);
        }
        // Don't override if user already picked accounts via persisted draft
        if (pids.size > 0 && accounts.size === 0 && !hydratedRef.current) {
          // let persisted restore win; otherwise set default to connected
          // we set after hydration check below
        }
        setConnectedPlatforms(pids);
        setDestinationOptions({
          boards: (data.destinations?.boards ?? []).map((b) => ({ value: b.id, label: b.name })),
          pages: (data.destinations?.pages ?? []).map((p) => ({ value: p.id, label: p.name })),
        });
        if (pids.size > 0) {
          setAccounts((prev) => (prev.size === 0 ? pids : prev));
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Restore persisted CSV draft + scheduler settings
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const persisted = loadPersistedDraft();
    if (!persisted) return;
    setStartDate(persisted.startDate);
    setStartTime(persisted.startTime);
    setPostsPerDay(persisted.postsPerDay);
    setInterval(persisted.interval);
    setTimezone(persisted.timezone);
    setAccounts(new Set(persisted.accounts));
    if (persisted.composerMode) setComposerMode(persisted.composerMode);
    if (persisted.contentType) setContentType(persisted.contentType);
    if (persisted.carouselMediaMode) setCarouselMediaMode(persisted.carouselMediaMode);
    if (persisted.xCommunityId) setXCommunityId(persisted.xCommunityId);
    if (persisted.shareCommunityWithFollowers) setShareCommunityWithFollowers(true);
    if (persisted.csvItems.length > 0) {
      // Rehydrate with defaults for new fields (including postType for older drafts)
      const rehydrated = persisted.csvItems.map((it) => ({
        ...it,
        postType: (it as unknown as { postType?: ComposerMode }).postType ?? persisted.composerMode ?? "standard",
        contentType: (it as unknown as { contentType?: BulkContentType }).contentType ?? contentTypeForLegacyMode((it as unknown as { postType?: ComposerMode }).postType ?? persisted.composerMode ?? "standard"),
        firstComment: (it as unknown as { firstComment?: string }).firstComment ?? "",
        tagUsers: (it as unknown as { tagUsers?: string }).tagUsers ?? "",
        altText: (it as unknown as { altText?: string }).altText ?? "",
        advancedByPlatform: (it as unknown as { advancedByPlatform?: Record<string, unknown> }).advancedByPlatform ?? {},
      })) as CsvBulkItem[];
      setItems(rehydrated);
    }
  }, []);

  // Persist on changes
  useEffect(() => {
    if (!hydratedRef.current) return;
    savePersistedDraft({
      csvItems: items.filter((it): it is CsvBulkItem => it.source === "csv"),
      accounts: Array.from(accounts),
      startDate,
      startTime,
      postsPerDay,
      interval,
      timezone,
      composerMode,
      contentType,
      carouselMediaMode,
      xCommunityId,
      shareCommunityWithFollowers,
    });
  }, [items, accounts, startDate, startTime, postsPerDay, interval, timezone, composerMode, contentType, carouselMediaMode, xCommunityId, shareCommunityWithFollowers]);

  // Close TZ dropdown on outside click + Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTzOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) {
        setTzOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  // Keep a ref to the current items so the unmount cleanup can revoke without triggering a state update.
  const itemsRef = useRef<BulkItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Revoke blob URLs on unmount — synchronous loop, no setState.
  useEffect(() => {
    return () => {
      for (const it of itemsRef.current) {
        if (it.source === "upload") {
          try { URL.revokeObjectURL(it.previewUrl); } catch {}
        }
      }
    };
  }, []);

  // Warn before leaving while uploads would be lost (uploads are not persisted).
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      const hasUploads = itemsRef.current.some((it) => it.source === "upload");
      if (hasUploads && itemsRef.current.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Auto-fix: image posts must not target video-only platforms (e.g. YouTube). Fixes persisted bad state from before.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const needsFix = items.some((it) => (it as BulkItemBase).kind === "image" && (it as BulkItemBase).accountIds.includes("youtube" as PlatformId));
    if (!needsFix) return;
    setItems((prev) =>
      prev.map((it) => {
        const base = it as BulkItemBase;
        if (base.kind === "image" && base.accountIds.includes("youtube" as PlatformId)) {
          const filtered = filterAccountsForKind("image", base.accountIds as PlatformId[]);
          const adv = { ...(base.advancedByPlatform ?? {}) } as Record<string, Record<string, unknown>>;
          delete adv.youtube;
          const next: BulkItemBase = { ...base, accountIds: filtered, advancedByPlatform: adv };
          // keep top-level youtube fields empty
          next.youtubeTitle = "";
          next.youtubeTags = "";
          return next as BulkItem;
        }
        return it;
      })
    );
  }, [items]);

  const toggleAccount = useCallback((id: PlatformId) => {
    setAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectCompatibleAccounts = useCallback((nextType: BulkContentType, nextCarouselMode: CarouselMediaMode) => {
    const compatible = platformsForBulkContent(nextType, nextCarouselMode);
    setAccounts(new Set(compatible));
  }, []);

  const handleContentTypeChange = useCallback((next: BulkContentType, updateAllPosts = true) => {
    setContentType(next);
    const nextComposerMode = composerModeForContentType(next);
    setComposerMode(nextComposerMode);
    selectCompatibleAccounts(next, carouselMediaMode);

    if (updateAllPosts) {
      setItems((prev) =>
        prev.map((it) => {
          const base = it as BulkItemBase;
          const compatible = platformsForBulkContent(next, carouselMediaMode);
          const filteredAccounts = it.accountIds.filter((id) => compatible.includes(id));
          const finalAccounts = filteredAccounts.length > 0
            ? filteredAccounts
            : compatible;

          let advanced = { ...(base.advancedByPlatform ?? {}) } as Record<string, Record<string, unknown>>;
          if (next === "short_video") {
            advanced.instagram = { ...(advanced.instagram ?? {}), instagram_media_type: "REELS" };
            advanced.facebook = { ...(advanced.facebook ?? {}), facebook_media_type: "REELS" };
          } else if (next === "long_video") {
            advanced.facebook = { ...(advanced.facebook ?? {}), facebook_media_type: "VIDEO" };
          } else if (next === "story") {
            advanced.instagram = { ...(advanced.instagram ?? {}), instagram_media_type: "STORIES" };
            advanced.facebook = { ...(advanced.facebook ?? {}), facebook_media_type: "STORIES" };
          } else if (next === "trial_reel") {
            advanced.instagram = {
              ...(advanced.instagram ?? {}),
              instagram_media_type: "REELS",
              instagram_share_mode: base.trialMode ?? "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED",
            };
          } else if (next === "community") {
            advanced.twitter = {
              ...(advanced.twitter ?? {}),
              twitter_community: xCommunityId,
              twitter_share_with_followers: shareCommunityWithFollowers,
            };
          }

          return {
            ...it,
            contentType: next,
            postType: nextComposerMode,
            accountIds: finalAccounts,
            postIn: next === "story" ? "story" : "feed",
            advancedByPlatform: advanced as BulkItem["advancedByPlatform"],
          } as BulkItem;
        })
      );
    }
  }, [carouselMediaMode, connectedPlatforms, selectCompatibleAccounts, shareCommunityWithFollowers, xCommunityId]);

  const handleCarouselMediaModeChange = useCallback((next: CarouselMediaMode) => {
    setCarouselMediaMode(next);
    setComposerMode("carousel");
    selectCompatibleAccounts("carousel", next);
  }, [selectCompatibleAccounts]);

  function applyComposerModeToAll() {
    if (items.length === 0) {
      toast({ title: "No posts to update", tone: "warning" });
      return;
    }
    setItems((prev) =>
      prev.map((it) => {
        const base = it as BulkItemBase;
        const nextPostType = composerModeForContentType(contentType);
        const compatible = platformsForBulkContent(contentType, carouselMediaMode);
        const filteredAccounts = compatible;
        let advanced = { ...(base.advancedByPlatform ?? {}) } as Record<string, Record<string, unknown>>;
        if (contentType === "short_video") {
          advanced.instagram = { ...(advanced.instagram ?? {}), instagram_media_type: "REELS" };
          advanced.facebook = { ...(advanced.facebook ?? {}), facebook_media_type: "REELS" };
        } else if (contentType === "long_video") {
          advanced.facebook = { ...(advanced.facebook ?? {}), facebook_media_type: "VIDEO" };
        } else if (contentType === "story") {
          advanced.instagram = { ...(advanced.instagram ?? {}), instagram_media_type: "STORIES" };
          advanced.facebook = { ...(advanced.facebook ?? {}), facebook_media_type: "STORIES" };
        } else if (contentType === "trial_reel") {
          advanced.instagram = {
            ...(advanced.instagram ?? {}),
            instagram_media_type: "REELS",
            instagram_share_mode: base.trialMode ?? "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED",
          };
        } else if (contentType === "community") {
          advanced.twitter = {
            ...(advanced.twitter ?? {}),
            twitter_community: xCommunityId,
            twitter_share_with_followers: shareCommunityWithFollowers,
          };
        }
        // Carry over carouselSlides/documentTitle when switching away? Clear mismatched fields to keep state clean.
        const patch: Partial<BulkItemBase> = {
          postType: nextPostType,
          accountIds: filteredAccounts,
          contentType,
          carouselMediaMode: contentType === "carousel" ? carouselMediaMode : undefined,
          postIn: contentType === "story" ? "story" : "feed",
          advancedByPlatform: advanced,
          ...(contentType === "text" || contentType === "community" ? { kind: "text" as const } : {}),
        };
        // Seed defaults for carousel/document when switching into them
        if (nextPostType === "carousel" && !base.carouselSlides) {
          // Preserve current single media as first slide if available
          const firstSlide: BulkCarouselSlide | null =
            base.url && base.url.startsWith("https://")
              ? {
                  id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  previewUrl: base.url,
                  url: base.url,
                  kind: base.kind === "video" ? "video" : "image",
                  name: base.name,
                  size: base.size,
                  mimeType: base.kind === "video" ? "video/mp4" : "image/jpeg",
                  uploadStatus: "ready" as const,
                }
              : null;
          patch.carouselSlides = firstSlide ? [firstSlide] : [];
        }
        if (nextPostType === "document" && !base.documentTitle) {
          patch.documentTitle = base.name.replace(/\.[^.]+$/, "");
        }
        if (nextPostType === "trial_reel" && !base.trialMode) {
          patch.trialMode = "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED";
        }
        // Clear stale advanced that no longer applies (e.g. youtube for image-only, etc.) — keep generic
        return { ...it, ...patch } as BulkItem;
      })
    );
    toast({ title: `Applied ${contentType.replaceAll("_", " ")} to all ${items.length} post(s)`, tone: "success" });
  }

  // ── Per-item Post Type handlers ──
  const handleChangePostType = useCallback((itemId: string, nextMode: ComposerMode) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const base = it as BulkItemBase;
        let filteredAccounts = filterAccountsForPostType(nextMode, base.accountIds as PlatformId[]);
        // Also filter out youtube for image kind when switching to standard image
        filteredAccounts = filterAccountsForKind(base.kind as BulkItem["kind"], filteredAccounts);
        // If filtering empties the set, auto-select allowed platforms for this item (mirrors /create)
        if (filteredAccounts.length === 0) {
          const allowed = allowedPlatformsForPostType(nextMode);
          if (allowed && allowed.length > 0) {
            if (connectedPlatforms.size > 0) {
              const inter = allowed.filter((id) => connectedPlatforms.has(id));
              filteredAccounts = inter.length > 0 ? inter : [...allowed];
            } else {
              filteredAccounts = [...allowed];
            }
          } else if (!allowed) {
            // standard with no remaining — keep previous? else fallback to connected
            if (connectedPlatforms.size > 0) filteredAccounts = Array.from(connectedPlatforms);
            else filteredAccounts = Array.from(base.accountIds);
          }
        }
        let extraPatch: Partial<BulkItemBase> = { postType: nextMode, accountIds: filteredAccounts, contentType: undefined, carouselMediaMode: undefined };
        if (nextMode === "carousel" && !base.carouselSlides) {
          const firstSlide: BulkCarouselSlide | null =
            base.url && base.url.startsWith("https://")
              ? { id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, previewUrl: base.url, url: base.url, kind: base.kind === "video" ? "video" : "image", name: base.name, size: base.size, mimeType: base.kind === "video" ? "video/mp4" : "image/jpeg", uploadStatus: "ready" as const }
              : null;
          extraPatch.carouselSlides = firstSlide ? [firstSlide] : [];
        }
        if (nextMode === "document" && !base.documentTitle) extraPatch.documentTitle = base.name.replace(/\.[^.]+$/, "");
        if (nextMode === "trial_reel" && !base.trialMode) extraPatch.trialMode = "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED";
        // When moving away from carousel, keep url as first slide's url for preview compat
        if (nextMode !== "carousel" && base.carouselSlides && base.carouselSlides.length > 0) {
          const first = base.carouselSlides[0];
          if (first) {
            extraPatch.url = first.url;
            extraPatch.kind = first.kind as BulkItemBase["kind"];
          }
        }
        return { ...it, ...extraPatch } as BulkItem;
      })
    );
  }, [connectedPlatforms]);

  const handleAddCarouselSlides = useCallback(async (itemId: string, files: File[]) => {
    if (files.length === 0) return;
    const target = items.find((i) => i.id === itemId) as BulkItemBase | undefined;
    const mode = target?.carouselMediaMode ?? "images";
    const acceptedFiles = files.filter((file) => {
      const kind = file.type.startsWith("video/") ? "video" : "image";
      return acceptsMediaKind("carousel", kind, mode);
    });
    if (acceptedFiles.length !== files.length) {
      toast({ title: "Some slides were skipped", description: `This is a ${mode} carousel.`, tone: "warning" });
    }
    files = acceptedFiles;
    if (files.length === 0) return;
    const existingCount = (target?.carouselSlides?.length ?? 0);
    if (existingCount + files.length > 10) {
      toast({ title: "Carousel max 10 slides", description: `You can add ${10 - existingCount} more slide(s).`, tone: "warning" });
      files = files.slice(0, Math.max(0, 10 - existingCount));
      if (files.length === 0) return;
    }
    const pendingSlides: BulkCarouselSlide[] = files.map((file) => {
      const blob = URL.createObjectURL(file);
      return {
        id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        previewUrl: blob,
        url: blob,
        kind: file.type.startsWith("video/") ? "video" : "image",
        name: file.name,
        size: file.size,
        mimeType: file.type || "image/jpeg",
        uploadStatus: "uploading" as const,
      };
    });
    // Optimistically add to UI
    setItems((prev) => prev.map((it) => (it.id === itemId ? ({ ...it, carouselSlides: [...((it as BulkItemBase).carouselSlides ?? []), ...pendingSlides] } as BulkItem) : it)));
    // Upload each slide
    for (const slide of pendingSlides) {
      if (!slide.file) continue;
      const result = await uploadFile(slide.file);
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          const base = it as BulkItemBase;
          const updatedSlides = (base.carouselSlides ?? []).map((s) => (s.id === slide.id ? { ...s, url: result?.url ?? s.previewUrl, uploadStatus: (result ? "ready" : "error"), storedPath: result?.storedPath } : s));
          // Keep top-level url in sync with first slide
          const firstUrl = updatedSlides[0]?.url ?? base.url;
          const firstKind = updatedSlides[0]?.kind ?? base.kind;
          return { ...it, url: firstUrl, kind: firstKind as BulkItemBase["kind"], carouselSlides: updatedSlides } as BulkItem;
        })
      );
    }
  }, [items, toast]);

  const handleRemoveCarouselSlide = useCallback((itemId: string, slideId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const base = it as BulkItemBase;
        const nextSlides = (base.carouselSlides ?? []).filter((s) => s.id !== slideId);
        // Revoke previewUrl for removed slide if it's a blob
        const removed = (base.carouselSlides ?? []).find((s) => s.id === slideId);
        if (removed?.previewUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(removed.previewUrl); } catch {} }
        const first = nextSlides[0];
        return {
          ...it,
          carouselSlides: nextSlides,
          url: first?.url ?? base.url,
          kind: (first?.kind as BulkItemBase["kind"]) ?? base.kind,
        } as BulkItem;
      })
    );
  }, []);

  const handleReorderCarousel = useCallback((itemId: string, from: number, to: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const base = it as BulkItemBase;
        const slides = [...(base.carouselSlides ?? [])];
        if (from < 0 || from >= slides.length || to < 0 || to >= slides.length) return it;
        const [moved] = slides.splice(from, 1);
        slides.splice(to, 0, moved);
        const first = slides[0];
        return { ...it, carouselSlides: slides, url: first?.url ?? base.url, kind: (first?.kind as BulkItemBase["kind"]) ?? base.kind } as BulkItem;
      })
    );
  }, []);

  const handleDocumentTitleChange = useCallback((itemId: string, title: string) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? ({ ...it, documentTitle: title } as BulkItem) : it)));
  }, []);

  const handleDocumentFile = useCallback(async (itemId: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setItems((prev) => prev.map((it) => (it.id === itemId ? ({ ...it, file, previewUrl, url: previewUrl, name: file.name, size: file.size, kind: "document" as BulkItemBase["kind"], uploadStatus: "uploading" as const, documentTitle: (it as BulkItemBase).documentTitle || file.name.replace(/\.[^.]+$/, "") } as BulkItem) : it)));
    const result = await uploadFile(file);
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? ({
              ...it,
              url: result?.url ?? previewUrl,
              storedPath: result?.storedPath,
              uploadStatus: (result ? "ready" : "error"),
              uploadError: result ? undefined : "CDN upload failed",
            } as BulkItem)
          : it
      )
    );
  }, []);

  const handleTrialModeChange = useCallback((itemId: string, mode: TrialReelMode) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? ({ ...it, trialMode: mode } as BulkItem) : it)));
  }, []);

  const handleReplaceTrialVideo = useCallback(async (itemId: string, file: File) => {
    if (!file.type.startsWith("video/")) {
      toast({ title: "Trial Reel needs video", tone: "warning" });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setItems((prev) => prev.map((it) => (it.id === itemId ? ({ ...it, file, previewUrl, url: previewUrl, name: file.name, size: file.size, kind: "video" as BulkItemBase["kind"], uploadStatus: "uploading" as const } as BulkItem) : it)));
    const result = await uploadFile(file);
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? ({ ...it, url: result?.url ?? previewUrl, storedPath: result?.storedPath, uploadStatus: (result ? "ready" : "error") } as BulkItem) : it
      )
    );
  }, []);

  const pickFiles = () => fileInputRef.current?.click();
  const pickMoreFiles = () => addMoreInputRef.current?.click();
  const pickCsvFile = () => csvInputRef.current?.click();

  async function uploadFile(file: File): Promise<{ url: string; storedPath?: string } | null> {
    const idToken = await getIdToken();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "posts");
    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: fd,
        headers: {
          ...getOverrideHeaders(),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        storedPath?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      return { url: data.url, storedPath: data.storedPath };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: `${file.name}: ${msg}`, tone: "error" });
      return null;
    }
  }

  async function handleCsvFile(file: File) {
    setCsvBusy(true);
    try {
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      if (headers.length === 0 || rows.length === 0) {
        toast({ title: t("posts.bulkSchedule.csv_empty"), tone: "error" });
        return;
      }
      const capIdx = headers.indexOf("caption");
      const platformsIdx = headers.indexOf("platforms");
      const scheduledIdx = headers.indexOf("scheduledat");
      const hashtagsIdx = headers.indexOf("hashtags");
      // Media column matches: mediaurl, mediaurls, media_url, media_urls, photos, photo_urls, images
      let mediaIdx = headers.indexOf("mediaurl");
      if (mediaIdx < 0) mediaIdx = headers.indexOf("mediaurls");
      if (mediaIdx < 0) mediaIdx = headers.indexOf("media_url");
      if (mediaIdx < 0) mediaIdx = headers.indexOf("media_urls");
      if (mediaIdx < 0) mediaIdx = headers.indexOf("photos");
      if (mediaIdx < 0) mediaIdx = headers.indexOf("images");

      // Legacy post type column matches: posttype, post_type
      let postTypeIdx = headers.indexOf("posttype");
      if (postTypeIdx < 0) postTypeIdx = headers.indexOf("post_type");

      // Content type column matches: contenttype, content_type, format, type
      let contentTypeIdx = headers.indexOf("contenttype");
      if (contentTypeIdx < 0) contentTypeIdx = headers.indexOf("content_type");
      if (contentTypeIdx < 0) contentTypeIdx = headers.indexOf("format");
      if (contentTypeIdx < 0) contentTypeIdx = headers.indexOf("type");

      // Placement column matches: placement, postin, post_in, feedtype, feed_type
      let placementIdx = headers.indexOf("placement");
      if (placementIdx < 0) placementIdx = headers.indexOf("postin");
      if (placementIdx < 0) placementIdx = headers.indexOf("post_in");
      if (placementIdx < 0) placementIdx = headers.indexOf("feedtype");
      if (placementIdx < 0) placementIdx = headers.indexOf("feed_type");

      // Document title column matches: documenttitle, document_title, doctitle, title
      let docTitleIdx = headers.indexOf("documenttitle");
      if (docTitleIdx < 0) docTitleIdx = headers.indexOf("document_title");
      if (docTitleIdx < 0) docTitleIdx = headers.indexOf("doctitle");
      if (docTitleIdx < 0) docTitleIdx = headers.indexOf("title");

      if (capIdx < 0) {
        toast({ title: t("posts.bulkSchedule.csv_missing_column"), tone: "error" });
        return;
      }
      // Early guard: when the composer has no accounts and CSV also lacks platforms column, warn once.
      if (accounts.size === 0 && platformsIdx < 0) {
        toast({ title: "Select platforms first", description: "Pick accounts above or add a platforms column to your CSV.", tone: "warning" });
      }
      const newItems: CsvBulkItem[] = [];
      const errors: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const caption = (r[capIdx] ?? "").trim();
        if (!caption) {
          errors.push(`Row ${i + 2}: missing caption`);
          continue;
        }

        // Determine row-level post type (defaults to composerMode)
        const rowPostTypeRaw = postTypeIdx >= 0 ? r[postTypeIdx] : "";
        const rowContentTypeRaw = contentTypeIdx >= 0 ? r[contentTypeIdx] : "";
        const normalizedContentType = rowContentTypeRaw ? normalizeBulkContentType(rowContentTypeRaw) : null;
        const rowContentType: BulkContentType = normalizedContentType ?? (rowPostTypeRaw ? contentTypeForLegacyMode(normalizePostType(rowPostTypeRaw)) : contentType);
        const rowPostType: ComposerMode = rowPostTypeRaw ? normalizePostType(rowPostTypeRaw) : composerModeForContentType(rowContentType);

        // Determine row placement (feed vs story)
        const rowPlacementRaw = placementIdx >= 0 ? r[placementIdx] : "";
        const rowPlacement: "feed" | "story" = rowContentType === "story" ? "story" : rowPlacementRaw ? normalizePlacement(rowPlacementRaw) : "feed";

        // Document title if provided
        const rowDocTitle = docTitleIdx >= 0 ? (r[docTitleIdx] ?? "").trim() : "";

        let platforms: PlatformId[] = (platformsIdx >= 0 ? (normalizePlatforms(r[platformsIdx] ?? "") as PlatformId[]) : []);
        if (platforms.length === 0) platforms = Array.from(accounts);
        if (platforms.length === 0) {
          errors.push(`Row ${i + 2}: no platforms (add a "platforms" column or select accounts above)`);
          continue;
        }

        // Auto-filter video-only platforms for image rows (CSV defaults to image) + post type
        const rowCompatible = platformsForBulkContent(rowContentType, carouselMediaMode);
        const rowCompatibleSet = new Set(rowCompatible);
        const rowKindForFiltering: BulkItemBase["kind"] = rowContentType === "text" || rowContentType === "community" ? "text" : rowContentType === "long_video" || rowContentType === "short_video" ? "video" : rowContentType === "document" ? "document" : "image";
        platforms = filterAccountsForKind(rowKindForFiltering, platforms).filter((platform) => rowCompatibleSet.has(platform));
        if (platforms.length === 0) {
          errors.push(`Row ${i + 2}: no compatible platforms after filtering for ${rowPostType}`);
          continue;
        }
        const rawScheduled = (scheduledIdx >= 0 ? r[scheduledIdx] : "").trim();
        const fallbackSlot = scheduledSlot(items.length + newItems.length);
        if (!fallbackSlot) {
          errors.push(`Row ${i + 2}: invalid scheduler (check start date/time/timezone)`);
          continue;
        }
        let scheduledAt = fallbackSlot.scheduledAt;
        let date = fallbackSlot.date;
        let time = fallbackSlot.time;
        if (rawScheduled) {
          const rawParts = splitDateTime(rawScheduled);
          const hasExplicitOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(rawScheduled);
          const parsedDate = hasExplicitOffset ? new Date(rawScheduled) : wallClockToUTC(rawParts.date, rawParts.time, timezone);
          if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
            errors.push(`Row ${i + 2}: invalid scheduledAt "${rawScheduled}"`);
            continue;
          }
          scheduledAt = parsedDate.toISOString();
          date = rawParts.date;
          time = rawParts.time;
        }
        const hashtags = hashtagsIdx >= 0 ? normalizeHashtags(r[hashtagsIdx] ?? "") : [];
        const rawMedia = mediaIdx >= 0 ? (r[mediaIdx] ?? "").trim() : "";
        const parsedMediaList = normalizeMediaUrls(rawMedia);
        const primaryMediaUrl = parsedMediaList[0] ?? rawMedia;

        if (primaryMediaUrl && !/^https?:\/\//i.test(primaryMediaUrl)) {
          errors.push(`Row ${i + 2}: mediaurl must be http(s) (got "${primaryMediaUrl.slice(0, 40)}")`);
          continue;
        }

        // Build default advanced options for selected platforms so Pinterest board / FB page are pre-filled
        const adv: Record<string, Record<string, unknown>> = {};
        for (const pid of platforms) {
          const def = getDefaultOptions(pid);
          if (Object.keys(def).length > 0) adv[pid] = { ...def };
          if (pid === "pinterest" && destinationOptions.boards[0] && !adv[pid]?.pinterest_board_id) {
            adv[pid] = { ...def, pinterest_board_id: destinationOptions.boards[0].value };
          }
          if (pid === "facebook" && destinationOptions.pages[0] && !adv[pid]?.facebook_page_id) {
            adv[pid] = { ...def, facebook_page_id: destinationOptions.pages[0].value };
          }
        }
        if (rowContentType === "short_video") {
          adv.instagram = { ...(adv.instagram ?? {}), instagram_media_type: "REELS" };
          adv.facebook = { ...(adv.facebook ?? {}), facebook_media_type: "REELS" };
        } else if (rowContentType === "long_video") {
          adv.facebook = { ...(adv.facebook ?? {}), facebook_media_type: "VIDEO" };
        } else if (rowContentType === "story") {
          adv.instagram = { ...(adv.instagram ?? {}), instagram_media_type: "STORIES" };
          adv.facebook = { ...(adv.facebook ?? {}), facebook_media_type: "STORIES" };
        } else if (rowContentType === "community") {
          adv.twitter = {
            ...(adv.twitter ?? {}),
            twitter_community: xCommunityId,
            twitter_share_with_followers: shareCommunityWithFollowers,
          };
        }
        const csvPinterestBoardId = (adv.pinterest as Record<string, unknown> | undefined)?.pinterest_board_id as string | undefined;
        // CSV kind inherits row post type
        const effectiveContentType: BulkContentType = parsedMediaList.length > 1 && rowContentType === "image" ? "carousel" : rowContentType;
        const effectivePostType = effectiveContentType === "carousel" ? "carousel" : effectiveContentType === "document" ? "document" : rowPostType;
        const csvKind: BulkItemBase["kind"] = effectiveContentType === "text" || effectiveContentType === "community" ? "text" : effectiveContentType === "document" ? "document" : effectiveContentType === "long_video" || effectiveContentType === "short_video" ? "video" : "image";

        // Build carousel slides if multiple URLs or carousel mode
        let carouselSlides: BulkCarouselSlide[] | undefined;
        if (effectivePostType === "carousel" && parsedMediaList.length > 0) {
          carouselSlides = parsedMediaList.slice(0, 10).map((url, slideIdx) => ({
            id: `csv-slide-${i}-${slideIdx}-${Date.now()}`,
            previewUrl: url,
            url,
            kind: /\.(mp4|mov|webm)$/i.test(url) ? ("video" as const) : ("image" as const),
            name: `Slide ${slideIdx + 1}`,
            size: 0,
            mimeType: /\.(mp4|mov|webm)$/i.test(url) ? "video/mp4" : "image/jpeg",
            uploadStatus: "ready" as const,
          }));
        } else if (effectivePostType === "carousel" && primaryMediaUrl) {
          carouselSlides = [
            {
              id: `csv-slide-${i}-0-${Date.now()}`,
              previewUrl: primaryMediaUrl,
              url: primaryMediaUrl,
              kind: "image" as const,
              name: "Slide 1",
              size: 0,
              mimeType: "image/jpeg",
              uploadStatus: "ready" as const,
            },
          ];
        }

        newItems.push({
          id: `csv-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          source: "csv",
          url: primaryMediaUrl,
          mediaUrl: primaryMediaUrl,
          kind: csvKind,
          postType: effectivePostType,
          contentType: effectiveContentType,
          carouselMediaMode: effectiveContentType === "carousel" ? carouselMediaMode : undefined,
          name: rowDocTitle ? rowDocTitle : `CSV row ${i + 2}`,
          size: 0,
          caption,
          scheduledAt,
          scheduledDate: date,
          scheduledTime: time,
          accountIds: platforms,
          postIn: rowPlacement,
          youtubeTitle: "",
          youtubeTags: "",
          pinterestBoard: csvPinterestBoardId ?? "",
          autoAddMusic: false,
          community: false,
          profile: "Default",
          hashtags,
          uploadStatus: primaryMediaUrl || effectiveContentType === "text" || effectiveContentType === "community" ? "ready" : "error",
          uploadError: primaryMediaUrl || effectiveContentType === "text" || effectiveContentType === "community" ? undefined : "Add a mediaurl column or upload media files",
          firstComment: "",
          altText: "",
          tagUsers: "",
          advancedByPlatform: adv,
          carouselSlides,
          ...(effectivePostType === "document"
            ? { documentTitle: rowDocTitle || `Document ${i + 2}`, documentPageCount: null }
            : {}),
          ...(effectivePostType === "trial_reel" ? { trialMode: "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED" as TrialReelMode } : {}),
        } as CsvBulkItem);
      }
      const beforeCount = items.length;
      const remainingAtStart = Math.max(0, MAX_FILES - beforeCount);
      const truncatedByLimit = Math.max(0, newItems.length - remainingAtStart);
      setItems((prev) => {
        const remaining = Math.max(0, MAX_FILES - prev.length);
        return [...prev, ...newItems.slice(0, remaining)];
      });
      const inserted = Math.min(newItems.length, remainingAtStart);
      if (truncatedByLimit > 0) {
        toast({
          title: `Imported ${inserted} of ${newItems.length} row(s) — ${truncatedByLimit} truncated (limit ${MAX_FILES})`,
          description: errors.slice(0, 2).join("\n") || `Queue limit is ${MAX_FILES}. Remove items or schedule first.`,
          tone: "warning",
        });
      } else if (errors.length > 0) {
        toast({
          title: t("posts.bulkSchedule.csv_imported_skipped", { n: inserted, m: errors.length }),
          description: errors.slice(0, 3).join("\n"),
          tone: "warning",
        });
      } else if (inserted > 0) {
        toast({
          title: t("posts.bulkSchedule.csv_imported", { n: inserted }),
          tone: "success",
        });
      } else if (newItems.length === 0 && errors.length === 0) {
        toast({ title: "Nothing imported", description: `Queue is full (${MAX_FILES} max).`, tone: "warning" });
      }
    } catch (e) {
      toast({
        title: t("posts.bulkSchedule.csv_read_error"),
        description: e instanceof Error ? e.message : String(e),
        tone: "error",
      });
    } finally {
      setCsvBusy(false);
    }
  }

  async function handleScheduleAll() {
    if (items.length === 0 || scheduleBusy) return;
    // Ecosystem-aware: only schedule items that are fully ready (like single-post does), keep blocked for later.
    const allIssues = validateItems(items);
    const blockedIds = new Set(allIssues.map((i) => i.itemId));
    const readyPool = items.filter((it) => !blockedIds.has(it.id));
    const blockedCountLocal = items.length - readyPool.length;

    if (readyPool.length === 0) {
      const grouped = allIssues.reduce((acc, cur) => {
        acc[cur.message] = (acc[cur.message] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const summary = Object.entries(grouped)
        .map(([msg, n]) => (n > 1 ? `${msg} ×${n}` : msg))
        .slice(0, 3)
        .join("; ");
      toast({
        title: allIssues.length > 0 ? "Nothing ready to schedule" : "Can't schedule yet",
        description: allIssues.length > 0 ? `${allIssues.length} issue(s): ${summary}. Fix the blocked posts (red badges) or remove them.` : `Fix ${blockedCountLocal} blocked post(s) first.`,
        tone: "error",
      });
      return;
    }
    // If some are blocked, let the user know we'll schedule only the ready ones (parity with per-item scheduling)
    if (blockedCountLocal > 0) {
      toast({
        title: `Scheduling ${readyPool.length} ready post(s) — ${blockedCountLocal} blocked will stay`,
        description: "Blocked posts remain in bulk so you can fix them. Check red badges for details.",
        tone: "warning",
      });
    }
    const readyItems = readyPool.slice(0, MAX_BULK_PAYLOAD_FILES);
    if (readyPool.length > MAX_BULK_PAYLOAD_FILES) {
      toast({
        title: `Scheduling first ${MAX_BULK_PAYLOAD_FILES} of ${readyPool.length} ready posts`,
        description: `API limit is ${MAX_BULK_PAYLOAD_FILES} per batch. Remaining ready posts stay in bulk.`,
        tone: "info",
      });
    }
    setScheduleBusy(true);
    const idempotencyKey = crypto.randomUUID();
    try {
      const idToken = await getIdToken();
      const payload = {
        items: readyItems.map((it) => {
          const base = it as BulkItemBase;
          const pt = (base.postType ?? "standard") as ComposerMode;
          const intent = base.contentType;
          // Derive mediaUrls per post type
          let mediaUrls: string[] = [];
          let extra: Record<string, unknown> = {};
          let adv = { ...(base.advancedByPlatform ?? {}) } as Record<string, Record<string, unknown>>;
          if (intent === "text" || intent === "community") {
            mediaUrls = [];
          } else if (pt === "carousel") {
            const slides = base.carouselSlides ?? [];
            mediaUrls = slides.length > 0 ? slides.map((s) => s.url).filter((u) => !!u && u.startsWith("https://")) : it.url ? [it.url] : [];
            if (slides.length > 0) extra.carouselItems = slides.map((s) => ({ url: s.url }));
          } else if (pt === "trial_reel") {
            mediaUrls = it.url ? [it.url] : [];
            // Ensure Instagram trial fields are set (parity with /create)
            const trialMode = base.trialMode ?? "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED";
            const igAdv = { ...(adv.instagram ?? {}), instagram_media_type: "REELS", instagram_share_mode: trialMode } as Record<string, unknown>;
            adv = { ...adv, instagram: igAdv };
            extra.trialReel = { url: it.url };
          } else if (pt === "document") {
            mediaUrls = it.url ? [it.url] : [];
            const title = base.documentTitle?.trim() || base.name.replace(/\.[^.]+$/, "") || "Document";
            const linkedinAdv = { ...(adv.linkedin ?? {}), linkedin_document_title: title } as Record<string, unknown>;
            adv = { ...adv, linkedin: linkedinAdv };
            extra.document = { url: it.url, title, mimeType: (it as UploadedBulkItem).file?.type ?? "application/pdf" };
            extra.documentTitle = title;
          } else {
            mediaUrls = it.url ? [it.url] : [];
          }
          // Parity with create-post: translate postIn story to per-platform advanced (so worker publishes to Stories)
          if (base.postIn === "story") {
            if (it.accountIds.includes("instagram")) {
              adv = { ...adv, instagram: { ...(adv.instagram ?? {}), instagram_media_type: "STORIES" } };
            }
            if (it.accountIds.includes("facebook")) {
              adv = { ...adv, facebook: { ...(adv.facebook ?? {}), facebook_media_type: "STORIES" } };
            }
          }
          if (intent === "short_video") {
            if (it.accountIds.includes("instagram")) adv = { ...adv, instagram: { ...(adv.instagram ?? {}), instagram_media_type: "REELS" } };
            if (it.accountIds.includes("facebook")) adv = { ...adv, facebook: { ...(adv.facebook ?? {}), facebook_media_type: "REELS" } };
          } else if (intent === "long_video" && it.accountIds.includes("facebook")) {
            adv = { ...adv, facebook: { ...(adv.facebook ?? {}), facebook_media_type: "VIDEO" } };
          } else if (intent === "community") {
            adv = {
              ...adv,
              twitter: {
                ...(adv.twitter ?? {}),
                twitter_community: (adv.twitter ?? {}).twitter_community ?? xCommunityId,
                twitter_share_with_followers: (adv.twitter ?? {}).twitter_share_with_followers ?? shareCommunityWithFollowers,
              },
            };
          }
          return {
            caption: it.caption,
            platforms: it.accountIds,
            mediaUrls,
            scheduledAt: it.scheduledAt ? new Date(it.scheduledAt).toISOString() : undefined,
            hashtags: it.hashtags ?? [],
            status: "scheduled" as const,
            postIn: it.postIn,
            youtubeTitle: it.youtubeTitle || undefined,
            youtubeTags: it.youtubeTags || undefined,
            pinterestBoard: it.pinterestBoard || undefined,
            autoAddMusic: it.autoAddMusic,
            community: it.community ? "community" : undefined,
            profile: it.profile,
            firstComment: it.firstComment || undefined,
            altText: it.altText ? [it.altText] : undefined,
            tagUsers: it.tagUsers || undefined,
            advancedByPlatform: adv,
            captionsByPlatform: it.captionByPlatform,
            postType: pt,
            ...extra,
          };
        }),
      };
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          ...getOverrideHeaders(),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.error?.message ?? body.error ?? (Array.isArray(body.issues) ? body.issues.map((i: { message: string }) => i.message).join("; ") : `Bulk schedule failed (${res.status})`);
        throw new Error(msg);
      }
      const data = (await res.json()) as { count?: number; ids?: string[]; ok?: boolean };
      const n = data.count ?? readyItems.length;
      const scheduledIds = new Set(readyItems.map((it) => it.id));
      setItems((prev) => {
        const remaining = prev.filter((it) => !scheduledIds.has(it.id));
        // Revoke only the scheduled ones that are leaving the UI
        for (const it of prev) {
          if (scheduledIds.has(it.id) && it.source === "upload") {
            try { URL.revokeObjectURL(it.previewUrl); } catch {}
            // Also revoke carousel slide blobs for this item
            const base = it as BulkItemBase;
            if (base.carouselSlides) {
              for (const slide of base.carouselSlides) {
                if (slide.previewUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(slide.previewUrl); } catch {} }
              }
            }
          }
        }
        return remaining;
      });
      setUndoStack((prev) => prev.filter((e) => !scheduledIds.has(e.item.id)));
      // Ecosystem linking: toast with deep links like single-post does, keep user in flow without losing context
      const remainingCount = items.length - n;
      if (remainingCount > 0) {
        toast({
          title: t("posts.bulkSchedule.scheduled_n", { n }),
          description: `${remainingCount} post(s) remain in bulk (blocked or over batch limit). View scheduled in Queue & Calendar.`,
          tone: "success",
        });
      } else {
        toast({ title: t("posts.bulkSchedule.scheduled_n", { n }), description: "All posts scheduled — check Queue and Calendar.", tone: "success" });
      }
      // Only clear persisted draft when bulk is fully empty (all scheduled)
      if (remainingCount === 0) clearPersistedDraft();
    } catch (e) {
      toast({
        title: t("posts.bulkSchedule.bulk_failed"),
        description: e instanceof Error ? e.message : undefined,
        tone: "error",
      });
    } finally {
      setScheduleBusy(false);
    }
  }

  function addTextPost() {
    if (items.length >= MAX_FILES) {
      toast({ title: "Queue full", description: `Bulk scheduling supports up to ${MAX_FILES} posts at once.`, tone: "warning" });
      return;
    }
    const slot = scheduledSlot(items.length);
    if (!slot) {
      toast({ title: "Invalid schedule", description: "Check the start date, time, and timezone.", tone: "error" });
      return;
    }
    const compatible = platformsForBulkContent(contentType, carouselMediaMode);
    const selected = Array.from(accounts).filter((id) => compatible.includes(id));
    const connected = compatible.filter((id) => connectedPlatforms.has(id));
    const accountIds = selected.length > 0 ? selected : connectedPlatforms.size > 0 ? connected : compatible;
    const advancedByPlatform: Partial<Record<PlatformId, PlatformAdvancedOptions>> = {};
    for (const platform of accountIds) {
      advancedByPlatform[platform] = getDefaultOptions(platform);
    }
    if (contentType === "community") {
      advancedByPlatform.twitter = {
        ...(advancedByPlatform.twitter ?? {}),
        twitter_community: xCommunityId,
        twitter_share_with_followers: shareCommunityWithFollowers,
      };
    }
    const item: CsvBulkItem = {
      id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "csv",
      mediaUrl: "",
      url: "",
      kind: "text",
      name: contentType === "community" ? "X Community post" : "Text post",
      size: 0,
      caption: "",
      scheduledAt: slot.scheduledAt,
      scheduledDate: slot.date,
      scheduledTime: slot.time,
      accountIds,
      postIn: "feed",
      youtubeTitle: "",
      youtubeTags: "",
      pinterestBoard: "",
      autoAddMusic: false,
      community: false,
      profile: "Default",
      hashtags: [],
      uploadStatus: "ready",
      postType: "standard",
      contentType,
      firstComment: "",
      altText: "",
      tagUsers: "",
      advancedByPlatform,
    };
    setItems((previous) => [...previous, item]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length > 0) handleFiles(files);
  }

  function onAddMoreDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length > 0) handleFiles(files);
  }

  async function handleFiles(files: File[]) {
    const remaining = Math.max(0, MAX_FILES - items.length);
    if (remaining === 0) {
      toast({
        title: "Queue full",
        description: `You already have ${MAX_FILES} items — schedule or remove some first.`,
        tone: "warning",
      });
      return;
    }
    if (files.length > remaining) {
      toast({
        title: "Too many files",
        description: `You can only add ${remaining} more file(s) (limit is ${MAX_FILES}) — ${files.length - remaining} will be skipped.`,
        tone: "warning",
      });
    }
    const accepted = files.slice(0, remaining);
    const skipped: string[] = [];
    const newItems: UploadedBulkItem[] = [];
    let counter = 0;
    for (const file of accepted) {
      if (file.size > MAX_FILE_BYTES) {
        skipped.push(`${file.name} (${formatBytes(file.size)} > ${MAX_FILE_BYTES / 1024 / 1024}MB)`);
        continue;
      }
      // ── Mode-aware file type gating ──
      const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
      const isDocExt = (ACCEPTED_DOCUMENT_EXTS as readonly string[]).includes(ext);
      const isDocMime = file.type ? (ACCEPTED_DOCUMENT_MIMES as readonly string[]).includes(file.type) : false;
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/") || (!file.type && /\.(jpe?g|png|webp|gif|heic)$/i.test(file.name));

      if (contentType === "text" || contentType === "community") {
        skipped.push(`${file.name} (${contentType === "text" ? "Text posts" : "X Community text posts"} do not need a media upload)`);
        continue;
      } else if (contentType === "document") {
        if (!isDocExt && !isDocMime) {
          skipped.push(`${file.name} (Document needs PDF/DOC/PPT/TXT — got ${file.type || ext})`);
          continue;
        }
      } else if (contentType === "long_video" || contentType === "short_video" || contentType === "trial_reel") {
        if (!isVideo) {
          skipped.push(`${file.name} (${contentType === "trial_reel" ? "Trial Reel" : contentType === "short_video" ? "Shorts & Reels" : "Long video"} needs video — got ${file.type || ext})`);
          continue;
        }
      } else if (contentType === "carousel") {
        const fileKind = isVideo ? "video" : isImage ? "image" : null;
        if (!fileKind || !acceptsMediaKind(contentType, fileKind, carouselMediaMode)) {
          skipped.push(`${file.name} (${carouselMediaMode === "images" ? "Images-only" : "Mixed"} carousel does not accept ${file.type || ext})`);
          continue;
        }
      } else if (contentType === "image" && !isImage) {
        skipped.push(`${file.name} (Image post needs an image — got ${file.type || ext})`);
        continue;
      } else {
        // standard
        if (file.type && !ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
          // Allow images with empty type via extension fallback
          if (!isImage && !isVideo) {
            skipped.push(`${file.name} (unsupported type: ${file.type || ext})`);
            continue;
          }
        }
      }

      // Determine kind + postType for this item (inherits global composerMode at creation time)
      let kind: BulkItemBase["kind"] = "image";
      if (contentType === "document") kind = "document";
      else if (isVideo) kind = "video";
      else kind = "image";

      const slot = scheduledSlot(items.length + counter);
      if (!slot) {
        skipped.push(`${file.name} (invalid schedule date, time, or timezone)`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      // Filter accounts by kind + post type, with auto-fallback to allowed platforms (mirrors /create)
      const compatible = platformsForBulkContent(contentType, carouselMediaMode);
      const compatibleSet = new Set(compatible);
      let filteredAccounts = filterAccountsForKind(kind as BulkItem["kind"], Array.from(accounts)).filter((id) => compatibleSet.has(id));
      const originalFilteredLen = filteredAccounts.length;
      if (filteredAccounts.length === 0) {
        const connected = compatible.filter((id) => connectedPlatforms.has(id));
        filteredAccounts = connectedPlatforms.size > 0 ? connected : compatible;
      }
      const adv: Record<string, Record<string, unknown>> = {};
      for (const pid of filteredAccounts) {
        const def = getDefaultOptions(pid);
        const batchSaved = (batchAdvancedByPlatform[pid] ?? {}) as Record<string, unknown>;
        adv[pid] = { ...def, ...batchSaved };
        if (pid === "pinterest" && destinationOptions.boards[0] && !adv[pid]?.pinterest_board_id) {
          adv[pid] = { ...(adv[pid] ?? def), pinterest_board_id: destinationOptions.boards[0].value };
        }
        if (pid === "facebook" && destinationOptions.pages[0] && !adv[pid]?.facebook_page_id) {
          adv[pid] = { ...(adv[pid] ?? def), facebook_page_id: destinationOptions.pages[0].value };
        }
      }
      const pinterestBoardId = (adv.pinterest as Record<string, unknown> | undefined)?.pinterest_board_id as string | undefined;
      // Inform once if we auto-dropped YouTube for image
      if (kind === "image" && accounts.has("youtube" as PlatformId) && !filteredAccounts.includes("youtube" as PlatformId)) {
        if (counter === 0) toast({ title: "YouTube auto-removed for images", description: "YouTube only accepts video — auto-deselected for image posts. Add video to enable YouTube.", tone: "info" });
      }
      // Post-type auto-select feedback (when we had to fall back to allowed platforms)
      if (counter === 0 && originalFilteredLen === 0 && filteredAccounts.length > 0) {
        if (contentType === "carousel") {
          toast({ title: "Carousel platforms auto-selected", description: `Compatible platforms selected for ${carouselMediaMode}.`, tone: "info" });
        } else if (contentType === "document") {
          toast({ title: "Document → LinkedIn auto-selected", description: "LinkedIn selected for Document (LinkedIn only).", tone: "info" });
        } else if (contentType === "trial_reel") {
          toast({ title: "Trial Reel → Instagram auto-selected", description: "Instagram selected for Trial Reel (Instagram only).", tone: "info" });
        } else {
          toast({ title: `Auto-selected ${filteredAccounts.length} compatible platform(s)`, tone: "info" });
        }
      }

      // Build base item; carousel gets a carouselSlides array seeded with this first slide
      const baseExtra: Partial<BulkItemBase> = {
        postType: composerModeForContentType(contentType),
        contentType,
        carouselMediaMode: contentType === "carousel" ? carouselMediaMode : undefined,
      };
      if (contentType === "carousel") {
        const firstSlide: BulkCarouselSlide = {
          id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          previewUrl,
          url: previewUrl,
          kind: kind === "video" ? "video" : "image",
          name: file.name,
          size: file.size,
          mimeType: file.type || (kind === "video" ? "video/mp4" : "image/jpeg"),
          uploadStatus: "uploading" as const,
        };
        baseExtra.carouselSlides = [firstSlide];
      }
      if (contentType === "document") {
        baseExtra.documentTitle = file.name.replace(/\.[^.]+$/, "");
        (baseExtra as BulkItemBase).documentPageCount = null;
      }
      if (contentType === "trial_reel") {
        baseExtra.trialMode = "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED";
        adv.instagram = {
          ...(adv.instagram ?? {}),
          instagram_media_type: "REELS",
          instagram_share_mode: "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED",
        };
      }
      if (contentType === "short_video") {
        adv.instagram = { ...(adv.instagram ?? {}), instagram_media_type: "REELS" };
        adv.facebook = { ...(adv.facebook ?? {}), facebook_media_type: "REELS" };
      } else if (contentType === "long_video") {
        adv.facebook = { ...(adv.facebook ?? {}), facebook_media_type: "VIDEO" };
      } else if (contentType === "story") {
        adv.instagram = { ...(adv.instagram ?? {}), instagram_media_type: "STORIES" };
        adv.facebook = { ...(adv.facebook ?? {}), facebook_media_type: "STORIES" };
      }

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        source: "upload",
        file,
        previewUrl,
        url: previewUrl,
        kind,
        name: file.name,
        size: file.size,
        caption: "",
        scheduledAt: slot.scheduledAt,
        scheduledDate: slot.date,
        scheduledTime: slot.time,
        accountIds: filteredAccounts,
        postIn: contentType === "story" ? "story" : "feed",
        youtubeTitle: "",
        youtubeTags: "",
        pinterestBoard: pinterestBoardId ?? "",
        autoAddMusic: false,
        community: false,
        profile: "Default",
        hashtags: [],
        uploadStatus: "uploading",
        firstComment: "",
        altText: "",
        tagUsers: "",
        advancedByPlatform: adv,
        ...baseExtra,
      } as UploadedBulkItem);
      counter++;
    }
    if (skipped.length > 0) {
      toast({
        title: "Skipped files",
        description: skipped.slice(0, 3).join("\n"),
        tone: "warning",
      });
    }
    if (newItems.length === 0) return;
    setItems((prev) => [...prev, ...newItems]);

    // Probe video metadata client-side immediately
    for (const item of newItems) {
      if (item.kind === "video" && item.file) {
        probeVideoMetadataClient(item.file)
          .then((meta) => {
            setItems((prev) =>
              prev.map((it) => {
                if (it.id !== item.id) return it;
                const autoAdv = { ...((it as BulkItemBase).advancedByPlatform ?? {}) } as Record<string, Record<string, unknown>>;
                if (meta.aspectRatio === "9:16" || meta.orientation === "vertical") {
                  if (it.accountIds.includes("instagram")) {
                    autoAdv.instagram = { ...(autoAdv.instagram ?? {}), instagram_media_type: "REELS" };
                  }
                  if (it.accountIds.includes("facebook")) {
                    autoAdv.facebook = { ...(autoAdv.facebook ?? {}), facebook_media_type: "REELS" };
                  }
                } else if (meta.orientation === "horizontal" || meta.aspectRatio === "16:9") {
                  if (it.accountIds.includes("facebook")) {
                    autoAdv.facebook = { ...(autoAdv.facebook ?? {}), facebook_media_type: "VIDEO" };
                  }
                }
                return {
                  ...it,
                  mediaMetadata: meta,
                  advancedByPlatform: autoAdv,
                } as BulkItem;
              })
            );
          })
          .catch(() => {});
      }
    }

    const CONCURRENCY = 3;
    let cursor = 0;
    async function worker() {
      while (cursor < newItems.length) {
        const idx = cursor++;
        const item = newItems[idx];
        const result = await uploadFile(item.file);
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== item.id) return it;
            if (it.source !== "upload") return it;
            const base = it as BulkItemBase;
            // Keep carousel first slide in sync with the main item's CDN url
            let nextSlides = base.carouselSlides;
            if (base.postType === "carousel" && nextSlides && nextSlides.length > 0) {
              nextSlides = nextSlides.map((s, idx) =>
                idx === 0
                  ? { ...s, url: result?.url ?? s.previewUrl, uploadStatus: (result ? "ready" : "error"), storedPath: result?.storedPath }
                  : s
              );
            }
            return {
              ...it,
              url: result?.url ?? it.previewUrl,
              storedPath: result?.storedPath,
              uploadStatus: result ? "ready" : "error",
              uploadError: result ? undefined : "CDN upload failed",
              ...(nextSlides ? { carouselSlides: nextSlides } : {}),
            };
          })
        );
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, newItems.length) }, () => worker()));
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const target = prev[idx];
      // Do NOT revoke blob here — keep it for undo. Store a revivable entry: if it's an uploaded item
      // the File is retained, so undo can recreate the blob URL when needed.
      setUndoStack((s) => [...s, { kind: "remove", item: target, index: idx }]);
      return prev.filter((i) => i.id !== id);
    });
  }

  function undoRemove() {
    setUndoStack((s) => {
      if (s.length === 0) return s;
      const last = s[s.length - 1];
      setItems((prev) => {
        const next = [...prev];
        let itemToRestore: BulkItem = last.item;
        // Blob URL was kept alive while in undo stack, but if something revoked it, recreate from File.
        if (itemToRestore.source === "upload") {
          try {
            // Probe whether previewUrl is still valid by checking if it starts with blob: and attempting to fetch would be heavy.
            // Recreate only if we detect it was revoked — simple heuristic: if previewUrl is a blob: URL that may have been revoked,
            // re-create a fresh one from the stored File so the image renders again.
            const preview = (itemToRestore as UploadedBulkItem).previewUrl;
            // If the caller had revoked it externally, preview will be a dangling blob. Recreate unconditionally from File
            // to guarantee a live URL — the old one remains harmless.
            // We keep the File reference, so we can always revive.
            if ((itemToRestore as UploadedBulkItem).file) {
              const fresh = URL.createObjectURL((itemToRestore as UploadedBulkItem).file);
              itemToRestore = { ...itemToRestore, previewUrl: fresh } as BulkItem;
            } else if (preview.startsWith("blob:")) {
              // No File (edge), keep as is.
            }
          } catch {}
        }
        // Clamp index to current length to avoid out-of-range splice after prior removals.
        const idx = Math.min(Math.max(0, last.index), next.length);
        next.splice(idx, 0, itemToRestore);
        return next;
      });
      return s.slice(0, -1);
    });
  }

  function updateItem(id: string, patch: Partial<BulkItem>) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, ...patch } as BulkItem;
        if (patch.scheduledDate !== undefined || patch.scheduledTime !== undefined) {
          const date = (patch.scheduledDate ?? (i as BulkItemBase).scheduledDate) as string;
          const time = (patch.scheduledTime ?? (i as BulkItemBase).scheduledTime) as string;
          const utc = wallClockToUTC(date, time, timezone);
          if (utc) {
            (updated as BulkItemBase).scheduledAt = utc.toISOString();
          } else {
            // Keep the previous scheduledAt and surface feedback — don't silently store a timezone-naive string.
            toast({ title: "Invalid date/time", description: `Could not interpret ${date} ${time} in ${timezone}.`, tone: "error" });
          }
        }
        // Keep top-level Pinterest board in sync with advanced panel's board id
        if ((patch as BulkItemBase).pinterestBoard !== undefined) {
          const board = (patch as BulkItemBase).pinterestBoard as string;
          const adv = ((updated as BulkItemBase).advancedByPlatform ?? {}) as Record<string, Record<string, unknown>>;
          const pAdv = { ...(adv.pinterest ?? {}) } as Record<string, unknown>;
          if (board) pAdv.pinterest_board_id = board;
          else delete pAdv.pinterest_board_id;
          // keep other pinterest advanced fields if present
          adv.pinterest = pAdv;
          (updated as BulkItemBase).advancedByPlatform = adv;
          // If Pinterest not selected, clear board to avoid ghost requirement
          if (!(updated as BulkItemBase).accountIds.includes("pinterest" as PlatformId)) {
            (updated as BulkItemBase).pinterestBoard = "";
          }
        }
        return updated;
      })
    );
  }

  const applyBatchAdvanced = useCallback((platform: PlatformId, next: PlatformAdvancedOptions) => {
    setBatchAdvancedByPlatform((prev) => ({ ...prev, [platform]: next }));
    setItems((prev) =>
      prev.map((it) => {
        const base = it as BulkItemBase;
        const currentAdv = (base.advancedByPlatform ?? {}) as Record<string, Record<string, unknown>>;
        const mergedPlatformAdv = { ...(currentAdv[platform] ?? {}), ...(next as Record<string, unknown>) };
        const updatedAdv = { ...currentAdv, [platform]: mergedPlatformAdv };
        const updated: BulkItemBase = { ...base, advancedByPlatform: updatedAdv as BulkItem["advancedByPlatform"] };

        if (platform === "pinterest") {
          const boardId = (next as Record<string, unknown>).pinterest_board_id;
          if (boardId) updated.pinterestBoard = String(boardId);
        }
        if (platform === "instagram") {
          const shareMode = (next as Record<string, unknown>).instagram_share_mode as TrialReelMode | undefined;
          if (shareMode) updated.trialMode = shareMode;
        }
        return updated as BulkItem;
      })
    );
    const targetCount = items.filter((it) => it.accountIds.includes(platform)).length;
    toast({
      title: `Updated ${getPlatform(platform)?.name ?? platform} options`,
      description: `Applied automatically to ${targetCount} post(s)`,
      tone: "success",
    });
  }, [items, toast]);

  const applyPinterestBoardToAll = useCallback(
    (boardId: string) => {
      setBatchAdvancedByPlatform((prev) => {
        const cur = (prev.pinterest ?? getDefaultOptions("pinterest")) as Record<string, unknown>;
        return { ...prev, pinterest: { ...cur, pinterest_board_id: boardId } };
      });
      setItems((prev) =>
        prev.map((it) => {
          const base = it as BulkItemBase;
          const currentAdv = (base.advancedByPlatform ?? {}) as Record<string, Record<string, unknown>>;
          const pinterestAdv = { ...(currentAdv.pinterest ?? {}), pinterest_board_id: boardId };
          const updatedAdv = { ...currentAdv, pinterest: pinterestAdv };
          return {
            ...it,
            pinterestBoard: boardId,
            advancedByPlatform: updatedAdv as BulkItem["advancedByPlatform"],
          } as BulkItem;
        })
      );
      const boardLabel = destinationOptions.boards.find((b) => b.value === boardId)?.label ?? boardId;
      const targetCount = items.filter((it) => it.accountIds.includes("pinterest")).length;
      toast({
        title: `Pinterest board set to "${boardLabel}"`,
        description: `Applied automatically to ${targetCount} post(s)`,
        tone: "success",
      });
    },
    [destinationOptions.boards, items, toast]
  );

  const applySmartLinkToAll = useCallback(
    (url: string, options: { instagramCta: boolean; customCtaText?: string }) => {
      const cleanUrl = url.trim().match(/^https?:\/\//i) ? url.trim() : `https://${url.trim()}`;
      if (!cleanUrl || cleanUrl === "https://") return;

      const igCta = options.customCtaText?.trim() || "👇 Link in the comments below!";

      // Update batch options for pinterest link
      setBatchAdvancedByPlatform((prev) => {
        const cur = (prev.pinterest ?? getDefaultOptions("pinterest")) as Record<string, unknown>;
        return { ...prev, pinterest: { ...cur, pinterest_link: cleanUrl } };
      });

      setItems((prev) =>
        prev.map((it) => {
          const base = it as BulkItemBase;
          const currentAdv = (base.advancedByPlatform ?? {}) as Record<string, Record<string, unknown>>;
          const targetIds = it.accountIds;

          // 1. Pinterest: set destination link in advanced options
          const pinterestAdv = { ...(currentAdv.pinterest ?? {}), pinterest_link: cleanUrl };
          const updatedAdv = { ...currentAdv, pinterest: pinterestAdv };

          // 2. Instagram: First Comment gets the link
          let nextFirstComment = base.firstComment;
          if (targetIds.includes("instagram")) {
            nextFirstComment = `🔗 Link: ${cleanUrl}`;
          }

          // 3. Caption routing for direct-preview platforms (LinkedIn, FB, X, Threads, Bluesky, YouTube, Reddit, Discord, Telegram)
          let nextCaption = it.caption;
          const captionTargets = targetIds.filter((p) =>
            ["linkedin", "facebook", "twitter", "threads", "bluesky", "youtube", "reddit", "discord", "telegram"].includes(p)
          );

          if (captionTargets.length > 0) {
            if (!nextCaption.includes(cleanUrl)) {
              nextCaption = nextCaption.trim() ? `${nextCaption.trim()}\n\n${cleanUrl}` : cleanUrl;
            }
          }

          // 4. Per-platform captions if customized or for Instagram CTA
          const currentPlatformCaps = { ...(it.captionByPlatform ?? {}) };
          for (const pid of targetIds) {
            if (pid === "instagram" && options.instagramCta) {
              const currentIgCap = currentPlatformCaps.instagram ?? it.caption;
              if (!currentIgCap.includes(igCta)) {
                currentPlatformCaps.instagram = currentIgCap.trim() ? `${currentIgCap.trim()}\n\n${igCta}` : igCta;
              }
            } else if (captionTargets.includes(pid)) {
              if (currentPlatformCaps[pid] && !currentPlatformCaps[pid].includes(cleanUrl)) {
                currentPlatformCaps[pid] = `${currentPlatformCaps[pid].trim()}\n\n${cleanUrl}`;
              }
            }
          }

          return {
            ...it,
            caption: nextCaption,
            firstComment: nextFirstComment,
            captionByPlatform: currentPlatformCaps,
            advancedByPlatform: updatedAdv as BulkItem["advancedByPlatform"],
          } as BulkItem;
        })
      );

      toast({
        title: "Smart Link applied to all posts",
        description: `Auto-routed across ${items.length} post(s) (First Comment for IG, Destination Pin for Pinterest, and Captions for LinkedIn/FB/X)`,
        tone: "success",
      });
    },
    [items, toast]
  );

  function updateAdvanced(id: string, platform: PlatformId, next: PlatformAdvancedOptions) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const cur = (it as BulkItemBase).advancedByPlatform ?? {};
        const updated = { ...it, advancedByPlatform: { ...cur, [platform]: next } } as BulkItem;
        // Sync Pinterest board id from advanced back to top-level field so both stay consistent
        if (platform === "pinterest") {
          const boardId = (next as Record<string, unknown>).pinterest_board_id as string | undefined;
          (updated as BulkItemBase).pinterestBoard = boardId ? String(boardId) : "";
        }
        if (platform === "facebook") {
          const pageId = (next as Record<string, unknown>).facebook_page_id as string | undefined;
          // no top-level field for FB page, but keep advanced in sync; top-level not needed
          if (!pageId) {
            // leave as is
          }
        }
        return updated;
      })
    );
  }

  function applySchedule() {
    if (items.length === 0) {
      toast({ title: "No items to schedule", tone: "warning" });
      return;
    }
    const firstSlot = scheduledSlot(0);
    if (!firstSlot) {
      toast({ title: "Invalid date or time", description: `Check Start Date/Time and timezone (${timezone}).`, tone: "error" });
      return;
    }
    // Guard: if any computed slot is in the past, warn and push to next valid future slot.
    const nowMs = Date.now();
    let hasPast = false;
    let pastCount = 0;
    const preview = items.map((_, idx) => scheduledSlot(idx));
    for (const s of preview) {
      if (!s) continue;
      if (Date.parse(s.scheduledAt) <= nowMs + 60_000) {
        hasPast = true;
        pastCount++;
      }
    }
    if (hasPast) {
      toast({ title: `Schedule pushed ${pastCount} past slot(s) will still be blocked`, description: "Pick a future Start Date/Time — past times can't be scheduled.", tone: "warning" });
    }
    setItems((prev) => {
      return prev.map((item, idx) => {
        const slot = scheduledSlot(idx);
        return slot
          ? { ...item, scheduledAt: slot.scheduledAt, scheduledDate: slot.date, scheduledTime: slot.time }
          : item;
      });
    });
    toast({ title: hasPast ? "Schedule applied (some slots still in the past)" : "Schedule applied to all items", tone: hasPast ? "warning" : "success" });
  }

  function applyAccountsToAll() {
    if (accounts.size === 0) {
      toast({ title: "Pick at least one account first", tone: "warning" });
      return;
    }
    const advTemplate: Record<string, Record<string, unknown>> = {};
    for (const pid of accounts) {
      const def = getDefaultOptions(pid);
      const batchSaved = (batchAdvancedByPlatform[pid] ?? {}) as Record<string, unknown>;
      advTemplate[pid] = { ...def, ...batchSaved };
      if (pid === "pinterest" && destinationOptions.boards[0] && !advTemplate[pid]?.pinterest_board_id) {
        advTemplate[pid] = { ...advTemplate[pid], pinterest_board_id: destinationOptions.boards[0].value };
      }
      if (pid === "facebook" && destinationOptions.pages[0] && !advTemplate[pid]?.facebook_page_id) {
        advTemplate[pid] = { ...advTemplate[pid], facebook_page_id: destinationOptions.pages[0].value };
      }
    }
    const boardFromTemplate = (advTemplate.pinterest as Record<string, unknown> | undefined)?.pinterest_board_id as string | undefined;
    setItems((prev) =>
      prev.map((item) => {
        const base = item as BulkItemBase;
        let filtered = filterAccountsForKind(base.kind as BulkItem["kind"], Array.from(accounts));
        filtered = filterAccountsForPostType((base.postType ?? "standard") as ComposerMode, filtered);
        const filteredAdv: Record<string, Record<string, unknown>> = {};
        for (const pid of filtered) {
          if (advTemplate[pid]) filteredAdv[pid] = advTemplate[pid];
          else if ((base.advancedByPlatform as Record<string, Record<string, unknown>> | undefined)?.[pid]) {
            filteredAdv[pid] = (base.advancedByPlatform as Record<string, Record<string, unknown>>)[pid];
          }
        }
        const willHavePinterest = filtered.includes("pinterest" as PlatformId);
        const finalBoard = willHavePinterest
          ? (base.pinterestBoard || boardFromTemplate || "") as string
          : "";
        return {
          ...item,
          accountIds: filtered,
          pinterestBoard: finalBoard as string,
          advancedByPlatform: { ...filteredAdv } as BulkItem["advancedByPlatform"],
        } as BulkItem;
      })
    );
    toast({ title: "Accounts applied to all items", tone: "success" });
  }

  async function scheduleSingle(itemId: string) {
    const target = items.find((i) => i.id === itemId);
    if (!target) return;
    const issues = validateItems([target]);
    if (issues.length > 0) {
      toast({
        title: "Can't schedule this post yet",
        description: issues[0].message,
        tone: "error",
      });
      return;
    }
    setScheduleBusy(true);
    const idempotencyKey = crypto.randomUUID();
    try {
      const idToken = await getIdToken();
      const baseT = target as BulkItemBase;
      const ptT = (baseT.postType ?? "standard") as ComposerMode;
      const intentT = baseT.contentType;
      let mediaUrlsT: string[] = [];
      let extraT: Record<string, unknown> = {};
      let advT = { ...(baseT.advancedByPlatform ?? {}) } as Record<string, Record<string, unknown>>;
      if (intentT === "text" || intentT === "community") {
        mediaUrlsT = [];
      } else if (ptT === "carousel") {
        const slides = baseT.carouselSlides ?? [];
        mediaUrlsT = slides.length > 0 ? slides.map((s) => s.url).filter((u) => !!u && u.startsWith("https://")) : target.url ? [target.url] : [];
        if (slides.length > 0) extraT.carouselItems = slides.map((s) => ({ url: s.url }));
      } else if (ptT === "trial_reel") {
        mediaUrlsT = target.url ? [target.url] : [];
        const trialModeT = baseT.trialMode ?? "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED";
        advT = { ...advT, instagram: { ...(advT.instagram ?? {}), instagram_media_type: "REELS", instagram_share_mode: trialModeT } };
        extraT.trialReel = { url: target.url };
      } else if (ptT === "document") {
        mediaUrlsT = target.url ? [target.url] : [];
        const titleT = baseT.documentTitle?.trim() || baseT.name.replace(/\.[^.]+$/, "") || "Document";
        advT = { ...advT, linkedin: { ...(advT.linkedin ?? {}), linkedin_document_title: titleT } };
        extraT.document = { url: target.url, title: titleT, mimeType: (target as UploadedBulkItem).file?.type ?? "application/pdf" };
        extraT.documentTitle = titleT;
      } else {
        mediaUrlsT = target.url ? [target.url] : [];
      }
      if (intentT === "short_video") {
        if (target.accountIds.includes("instagram")) advT = { ...advT, instagram: { ...(advT.instagram ?? {}), instagram_media_type: "REELS" } };
        if (target.accountIds.includes("facebook")) advT = { ...advT, facebook: { ...(advT.facebook ?? {}), facebook_media_type: "REELS" } };
      } else if (intentT === "long_video" && target.accountIds.includes("facebook")) {
        advT = { ...advT, facebook: { ...(advT.facebook ?? {}), facebook_media_type: "VIDEO" } };
      } else if (intentT === "community") {
        advT = {
          ...advT,
          twitter: {
            ...(advT.twitter ?? {}),
            twitter_community: (advT.twitter ?? {}).twitter_community ?? xCommunityId,
            twitter_share_with_followers: (advT.twitter ?? {}).twitter_share_with_followers ?? shareCommunityWithFollowers,
          },
        };
      }
      if (baseT.postIn === "story") {
        if (target.accountIds.includes("instagram")) advT = { ...advT, instagram: { ...(advT.instagram ?? {}), instagram_media_type: "STORIES" } };
        if (target.accountIds.includes("facebook")) advT = { ...advT, facebook: { ...(advT.facebook ?? {}), facebook_media_type: "STORIES" } };
      }
      const payload = {
        items: [
          {
            caption: target.caption,
            platforms: target.accountIds,
            mediaUrls: mediaUrlsT,
            scheduledAt: new Date(target.scheduledAt).toISOString(),
            hashtags: target.hashtags ?? [],
            status: "scheduled" as const,
            postIn: target.postIn,
            youtubeTitle: target.youtubeTitle || undefined,
            youtubeTags: target.youtubeTags || undefined,
            pinterestBoard: target.pinterestBoard || undefined,
            autoAddMusic: target.autoAddMusic,
            community: target.community ? "community" : undefined,
            profile: target.profile,
            firstComment: (target as BulkItemBase).firstComment || undefined,
            altText: (target as BulkItemBase).altText ? [(target as BulkItemBase).altText as string] : undefined,
            tagUsers: (target as BulkItemBase).tagUsers || undefined,
            advancedByPlatform: advT,
            captionsByPlatform: (target as BulkItemBase).captionByPlatform,
            postType: ptT,
            ...extraT,
          },
        ],
      };
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          ...getOverrideHeaders(),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? body.error ?? `HTTP ${res.status}`);
      }
      setItems((prev) => {
        const target2 = prev.find((p) => p.id === itemId);
        if (target2?.source === "upload") {
          try { URL.revokeObjectURL(target2.previewUrl); } catch {}
        }
        return prev.filter((p) => p.id !== itemId);
      });
      // Also remove any undo entries for this id to avoid reviving a scheduled post.
      setUndoStack((prev) => prev.filter((e) => e.item.id !== itemId));
      toast({ title: "Post scheduled", tone: "success" });
    } catch (e) {
      toast({
        title: "Schedule failed",
        description: e instanceof Error ? e.message : undefined,
        tone: "error",
      });
    } finally {
      setScheduleBusy(false);
    }
  }

  function applyMetadataRules(caption: string): string {
    if (!metadataRules.enabled) return caption;
    const now = new Date().toISOString().slice(0, 10);
    if (metadataRules.startDate && now < metadataRules.startDate) return caption;
    if (metadataRules.endDate && now > metadataRules.endDate) return caption;
    const tagStr = metadataRules.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
    const cta = metadataRules.ctaLine.trim();
    const parts: string[] = [];
    if (metadataRules.mode === "prioritize") {
      if (tagStr) parts.push(tagStr);
      if (cta) parts.push(cta);
      parts.push(caption);
    } else {
      parts.push(caption);
      if (cta) parts.push(cta);
      if (tagStr) parts.push(tagStr);
    }
    return parts.filter(Boolean).join("\n\n");
  }

  function applyRulesToAllCaptions() {
    if (items.length === 0) {
      toast({ title: "No items to apply rules to", tone: "warning" });
      return;
    }
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        caption: applyMetadataRules(it.caption),
      }))
    );
    toast({ title: "Campaign rules applied to all captions", tone: "success" });
  }

  function applyHashtagsToAll(tags: string[]) {
    if (tags.length === 0 || items.length === 0) return;
    setItems((prev) =>
      prev.map((it) => {
        const current = it.caption;
        const tagText = tags.join(" ");
        const nextCaption = current.trim() ? `${current.trim()} ${tagText}` : tagText;
        const nextTags = Array.from(new Set([...(it.hashtags ?? []), ...tags.map((t) => t.replace(/^#/, ""))]));
        return { ...it, caption: nextCaption, hashtags: nextTags };
      })
    );
    toast({ title: `Applied ${tags.length} hashtag(s) to all posts`, tone: "success" });
  }

  function applyFirstCommentToAll(comment: string) {
    if (!comment || items.length === 0) return;
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        firstComment: comment,
      }))
    );
    toast({ title: "First comment applied to all posts", tone: "success" });
  }

  function applyTagUsersToAll(tagUsers: string) {
    if (!tagUsers || items.length === 0) return;
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        tagUsers: tagUsers,
      }))
    );
    toast({ title: "Tagged users applied to all posts", tone: "success" });
  }

  async function handleExternalImport(importedFiles: ImportedFile[]) {
    if (importedFiles.length === 0) return;
    toast({
      title: `Importing ${importedFiles.length} file${importedFiles.length > 1 ? "s" : ""}…`,
      tone: "info",
    });
    const fetched: File[] = [];
    const failures: string[] = [];
    await Promise.all(
      importedFiles.map(async (item) => {
        try {
          const res = await fetch(item.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const mime = item.mimeType || blob.type || "image/jpeg";
          fetched.push(new File([blob], item.name, { type: mime }));
        } catch {
          failures.push(item.name);
        }
      })
    );
    if (failures.length > 0) {
      toast({
        title: `${failures.length} import${failures.length === 1 ? "" : "s"} failed`,
        description: failures.slice(0, 3).join(", ") + (failures.length > 3 ? "…" : ""),
        tone: "warning",
      });
    }
    if (fetched.length > 0) await handleFiles(fetched);
  }

  async function applyCroppedImage(dataUrl: string, itemId: string) {
    const file = dataUrlToFile(dataUrl, `cropped_${Date.now()}.jpg`);
    const uploadToastId = toast({
      title: "Uploading cropped image…",
      tone: "info",
    });
    const result = await uploadFile(file);
    if (result) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                url: result.url,
                previewUrl: result.url,
                storedPath: result.storedPath,
                uploadStatus: "ready",
              }
            : it
        )
      );
      toast({ title: "Crop applied", tone: "success" });
    }
  }

  async function applyFrameCover(dataUrl: string, itemId: string) {
    const file = dataUrlToFile(dataUrl, `frame_${Date.now()}.jpg`);
    const uploadToastId = toast({
      title: "Uploading cover frame…",
      tone: "info",
    });
    const result = await uploadFile(file);
    if (result) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                frameCoverUrl: result.url,
              }
            : it
        )
      );
      toast({ title: "Video cover frame applied", tone: "success" });
    }
  }

  function handlePickCustomCover(itemId: string) {
    customCoverTargetItemId.current = itemId;
    customCoverInputRef.current?.click();
  }

  function handleSaveCollaborators(itemId: string, list: string[]) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              collaborators: list,
            }
          : it
      )
    );
    toast({
      title: list.length === 0 ? "Collaborators cleared" : `${list.length} collaborator${list.length > 1 ? "s" : ""} saved`,
      tone: "success",
    });
  }

  function handleAutoFitAllOverLimit() {
    let count = 0;
    setItems((prev) =>
      prev.map((it) => {
        let changed = false;
        const nextCaptionByPlatform = { ...(it.captionByPlatform ?? {}) };
        for (const pid of it.accountIds) {
          const lim = getPlatformLimit(pid);
          const currentCap = nextCaptionByPlatform[pid] ?? it.caption;
          if (currentCap.length > lim) {
            nextCaptionByPlatform[pid] = fitCaptionForPlatform(it.caption, pid);
            changed = true;
            count++;
          }
        }
        return changed ? { ...it, captionByPlatform: nextCaptionByPlatform } : it;
      })
    );
    if (count > 0) {
      toast({
        title: `Auto-fitted ${count} platform caption${count > 1 ? "s" : ""} to exact limits!`,
        description: "All character limit warnings have been resolved.",
        tone: "success",
      });
    } else {
      toast({ title: "All platform captions are already within limits!", tone: "info" });
    }
  }

  async function aiGenerateForAll(opts?: {
    tone: string;
    includeHashtags: boolean;
    useEmojis: boolean;
    multiPlatform?: boolean;
    extra: string;
  }) {
    const options = opts ?? {
      tone: "default",
      includeHashtags: true,
      useEmojis: true,
      multiPlatform: true,
      extra: "",
    };
    const itemsToProcess = items.filter((item) => !item.caption.trim());
    if (itemsToProcess.length === 0) {
      toast({ title: "All captions already filled", tone: "info" });
      return;
    }
    setGenerating(true);
    let success = 0;
    const failed: string[] = [];
    const CONCURRENCY = 3;
    let cursor = 0;
    async function worker() {
      while (cursor < itemsToProcess.length) {
        const idx = cursor++;
        const item = itemsToProcess[idx];
        try {
          let imageUrl: string | undefined;
          let videoTitle: string | undefined;
          // Works for any content type: image → vision via data URI, video → title, others → filename
          if (item.kind === "image") {
            if (item.source === "upload" && (item as UploadedBulkItem).file) {
              const file = (item as UploadedBulkItem).file;
              try {
                if (file.size <= 4 * 1024 * 1024) {
                  imageUrl = await fileToDataUri(file);
                } else {
                  imageUrl = item.url.startsWith("https://") ? item.url : undefined;
                }
              } catch {
                imageUrl = item.url.startsWith("https://") ? item.url : undefined;
              }
              if (!imageUrl) imageUrl = item.url.startsWith("https://") ? item.url : undefined;
              if (!imageUrl) videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
            } else if ((item as CsvBulkItem).mediaUrl) {
              imageUrl = (item as CsvBulkItem).mediaUrl;
              if (!imageUrl) videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
            } else {
              videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
            }
          } else {
            videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
          }
          // Fallback: if still no context, use filename + hashtags as videoTitle
          if (!imageUrl && !videoTitle) {
            videoTitle = [item.name.replace(/\.[^.]+$/, ""), ...(item.hashtags ?? []).join(" ")].join(" ").trim() || "social media post";
          }
          const idToken = await getIdToken();
          const platformsCtx = item.accountIds.map((pid) => {
            const meta = PLATFORMS.find((p) => p.id === pid);
            return { id: pid, name: meta?.name ?? pid, charLimit: meta?.charLimit ?? 280 };
          });
          const extraCtx = [
            options.extra,
            item.name !== "CSV row 2" ? `File: ${item.name}` : null,
            (item.hashtags ?? []).length > 0 ? `Hashtags: ${(item.hashtags ?? []).join(" ")}` : null,
          ]
            .filter(Boolean)
            .join(" | ");
          const res = await fetch("/api/ai/caption", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getOverrideHeaders(),
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({
              tone: options.tone,
              includeHashtags: options.includeHashtags,
              useEmojis: options.useEmojis,
              multiPlatform: options.multiPlatform ?? true,
              extra: extraCtx,
              imageUrl,
              videoTitle,
              platforms: platformsCtx,
            }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            caption?: string;
            captionsByPlatform?: Record<string, string>;
            error?: string;
          };
          if (res.ok && data.ok && data.caption) {
            const baseCaption = data.caption.trim();
            const returnedByPlatform = data.captionsByPlatform ?? {};
            const finalByPlatform: Partial<Record<PlatformId, string>> = {};
            for (const pid of item.accountIds) {
              finalByPlatform[pid] = returnedByPlatform[pid]?.trim() || fitCaptionForPlatform(baseCaption, pid);
            }
            setItems((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? {
                      ...it,
                      caption: baseCaption,
                      captionByPlatform: finalByPlatform,
                    }
                  : it
              )
            );
            success++;
          } else {
            failed.push(`${item.name}: ${data.error ?? `HTTP ${res.status}`}`);
          }
        } catch (err) {
          failed.push(`${item.name}: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, itemsToProcess.length) }, () => worker()));
    setGenerating(false);
    setBatchAiOpen(false);
    toast({
      title: t("posts.bulkSchedule.ai_generated", { n: success, m: itemsToProcess.length }),
      description: failed.length > 0 ? `Failed: ${failed.slice(0, 3).join("; ")}` : "Platform-tailored variations applied in 1 call per post!",
      tone: failed.length > 0 ? "warning" : "success",
    });
  }

  async function aiGenerateForItem(item: BulkItem, opts: { tone: string; includeHashtags: boolean; useEmojis: boolean; multiPlatform?: boolean; extra: string }) {
    setAiGeneratingItemId(item.id);
    try {
      let imageUrl: string | undefined;
      let videoTitle: string | undefined;
      // Handle any content type: image via data URI vision, video via title, fallback via filename
      if (item.kind === "image") {
        if (item.source === "upload" && (item as UploadedBulkItem).file) {
          const file = (item as UploadedBulkItem).file;
          try {
            if (file.size <= 4 * 1024 * 1024) imageUrl = await fileToDataUri(file);
            else imageUrl = item.url.startsWith("https://") ? item.url : undefined;
          } catch {
            imageUrl = item.url.startsWith("https://") ? item.url : undefined;
          }
          if (!imageUrl) imageUrl = item.url.startsWith("https://") ? item.url : undefined;
          if (!imageUrl) videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
        } else {
          imageUrl = (item as CsvBulkItem).mediaUrl || undefined;
          if (!imageUrl) videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
        }
      } else {
        videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
      }
      if (!imageUrl && !videoTitle) {
        videoTitle = [item.name.replace(/\.[^.]+$/, ""), ...(item.hashtags ?? []).join(" ")].join(" ").trim() || "social media post";
      }
      const idToken = await getIdToken();
      const platformsCtx = item.accountIds.map((pid) => {
        const meta = PLATFORMS.find((p) => p.id === pid);
        return { id: pid, name: meta?.name ?? pid, charLimit: meta?.charLimit ?? 280 };
      });
      // Merge caller extra with file context so vision fallback still has hints
      const mergedExtra = [opts.extra, `File: ${item.name}`, (item.hashtags ?? []).length ? `Hashtags: ${(item.hashtags ?? []).join(" ")}` : null].filter(Boolean).join(" | ");
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getOverrideHeaders(),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          tone: opts.tone,
          includeHashtags: opts.includeHashtags,
          useEmojis: opts.useEmojis,
          multiPlatform: opts.multiPlatform ?? true,
          extra: mergedExtra,
          imageUrl,
          videoTitle,
          platforms: platformsCtx,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        caption?: string;
        captionsByPlatform?: Record<string, string>;
        error?: string;
      };
      if (res.ok && data.ok && data.caption) {
        const baseCaption = data.caption.trim();
        const returnedByPlatform = data.captionsByPlatform ?? {};
        const finalByPlatform: Partial<Record<PlatformId, string>> = {};
        for (const pid of item.accountIds) {
          finalByPlatform[pid] = returnedByPlatform[pid]?.trim() || fitCaptionForPlatform(baseCaption, pid);
        }
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  caption: baseCaption,
                  captionByPlatform: finalByPlatform,
                }
              : it
          )
        );
        toast({
          title: "Platform-optimized captions generated",
          description: "All platform limits matched in 1 single call!",
          tone: "success",
        });
        setAiTarget(null);
      } else {
        toast({ title: "Generation failed", description: data.error ?? `HTTP ${res.status}`, tone: "error" });
      }
    } catch (e) {
      toast({ title: "Generation failed", description: e instanceof Error ? e.message : "Network error", tone: "error" });
    } finally {
      setAiGeneratingItemId(null);
    }
  }

  function clearAll() {
    // Revoke all live blob URLs (including those in undo stack) to free memory.
    setItems((prev) => {
      for (const it of prev) {
        if (it.source === "upload") {
          try { URL.revokeObjectURL(it.previewUrl); } catch {}
        }
      }
      return [];
    });
    setUndoStack((prev) => {
      for (const entry of prev) {
        if (entry.item.source === "upload") {
          try { URL.revokeObjectURL((entry.item as UploadedBulkItem).previewUrl); } catch {}
        }
      }
      return [];
    });
    // Keep platform selection — users usually want to keep the same accounts after clearing media.
    clearPersistedDraft();
    toast({ title: "Cleared all items", tone: "info" });
  }

  function downloadCsvTemplate() {
    const template = [
      "caption,platforms,scheduledAt,hashtags,mediaUrl,contentType,placement,documentTitle",
      '"A caption-only product update","linkedin,twitter,facebook,threads",2026-09-01T09:00,"#launch,#updates",,text,feed,',
      '"Swipe to read our step-by-step strategy guide ➡️","instagram,facebook,threads,linkedin,pinterest",2026-09-02T10:30,"#strategy,#guide","https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe,https://images.unsplash.com/photo-1579783902614-a3fb3927b675",carousel,feed,',
      '"Behind the scenes today at the studio! ✨","instagram,facebook",2026-09-03T12:00,"#bts,#story",https://images.unsplash.com/photo-1579783902614-a3fb3927b675,story,story,',
      '"Read our 2026 Social Media Industry Benchmark Report","linkedin",2026-09-04T15:00,"#report,#b2b",https://example.com/reports/benchmark-2026.pdf,document,feed,"2026 Social Media Industry Benchmark Report"',
    ].join("\n");
    const blob = new Blob([template], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-schedule-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const accountsArr = useMemo(() => Array.from(accounts), [accounts]);
  const totalIssues = useMemo(() => validateItems(items), [items]);
  const readyCount = items.length - new Set(totalIssues.map((i) => i.itemId)).size;
  const blockedCount = items.length - readyCount;

  return (
    <div className="min-h-0 flex-1 bg-[#fcfcfc] dark:bg-zinc-950">
      <div className={cn("max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4", items.length > 0 && "pb-24")}>
        {/* ── Pro Header — linked to ecosystem ── */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
            <div className="flex gap-3 min-w-0">
              <span className="hidden sm:inline-flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm shrink-0">
                <Layers className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-zinc-900 leading-none">{t("posts.bulkSchedule.page_title")}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold tracking-widest px-2 py-0.5 uppercase">
                    <Sparkles className="size-3" /> Pro
                  </span>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border", items.length === 0 ? "bg-zinc-100 text-zinc-600 border-zinc-200" : blockedCount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                    <ListChecks className="size-3.5" />
                    {items.length === 0 ? "Ready to bulk" : `${readyCount}/${items.length} ready`}
                  </span>
                </div>
                <p className="text-[13px] sm:text-sm text-zinc-500 mt-1 max-w-[720px] leading-relaxed">
                  {t("posts.bulkSchedule.page_subtitle")} <span className="hidden sm:inline">• Linked to <Link href="/dashboard/posts/create" className="underline decoration-dotted hover:text-zinc-700">Create Post</Link> • <Link href="/dashboard/queue" className="underline decoration-dotted hover:text-zinc-700">Queue</Link> • <Link href="/dashboard/calendar" className="underline decoration-dotted hover:text-zinc-700">Calendar</Link> • <Link href="/dashboard/posts/history" className="underline decoration-dotted hover:text-zinc-700">History</Link></span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setMatrixModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 shadow-xs cursor-pointer"
              >
                <Sparkles className="size-3.5 text-zinc-900" /> Platform Feature Matrix
              </button>
              <Link href="/dashboard/calendar" className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs">
                <Calendar className="size-3.5" /> Calendar
              </Link>
              <Link href="/dashboard/queue" className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs">
                <ListChecks className="size-3.5" /> Queue
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-2.5 py-1 font-bold">Bulk Schedule</span>
            <Link href="/dashboard/assets" className="hidden sm:inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white border border-transparent hover:border-zinc-200 px-2.5 py-1 font-medium text-zinc-600">Media Library</Link>
            <Link href="/dashboard/hashtags" className="hidden sm:inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">Hashtags</Link>
            <span className="text-zinc-400 hidden sm:inline">• Auto-scheduler + per-post advanced controls</span>
            {(() => {
              const cfg = getHelpConfig("posts/bulk-schedule");
              if (!cfg) return null;
              return <PageHelp config={cfg} align="left" buttonClassName="rounded-full" />;
            })()}
          </div>
        </div>

        {/* ── Pro Scheduler Bar — double-bezel soft */}
        <div className="rounded-[16px] border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-2 sm:p-3">
          <div className="flex flex-wrap items-end gap-2">
            <SchedulerField label={t("posts.bulkSchedule.start_date")}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={todayISO()}
                max="2030-12-31"
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </SchedulerField>
            <SchedulerField label={t("posts.bulkSchedule.time")}>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </SchedulerField>
            <SchedulerField label={t("posts.bulkSchedule.posts_per_day")}>
              <select
                value={postsPerDay}
                onChange={(e) => setPostsPerDay(parseInt(e.target.value, 10))}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </SchedulerField>
            <SchedulerField label={t("posts.bulkSchedule.interval")}>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {INTERVALS.map((i) => (
                  <option key={i.id} value={i.id}>
                    {t(`posts.bulkSchedule.interval_${i.id === "1d" ? "daily" : i.id === "3d" ? "3days" : i.id === "7d" ? "weekly" : i.id === "14d" ? "2weeks" : "monthly"}`)}
                  </option>
                ))}
              </select>
            </SchedulerField>
            <SchedulerField label={t("posts.bulkSchedule.timezone")}>
              <div className="relative" ref={tzRef}>
                <button
                  type="button"
                  onClick={() => setTzOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={tzOpen}
                  className="inline-flex items-center gap-1.5 h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50"
                >
                  <Timer className="size-3.5 text-zinc-500" />
                  <span>{timezone}</span>
                  <ChevronDown className="size-3.5 text-zinc-500" />
                </button>
                {tzOpen ? (
                  <ul role="listbox" className="absolute right-0 top-full mt-2 z-30 w-[220px] max-h-[260px] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg p-1">
                    {(() => {
                      const list = TIMEZONES.some((tz) => tz.id === timezone) ? TIMEZONES : [{ id: timezone, label: timezone }, ...TIMEZONES];
                      return list.map((tz) => (
                      <li key={tz.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setTimezone(tz.id);
                            setTzOpen(false);
                          }}
                          className={cn("w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-zinc-100 font-medium", tz.id === timezone && "bg-zinc-900 text-white hover:bg-zinc-900")}
                        >
                          {tz.label}
                        </button>
                      </li>
                    ));
                    })()}
                  </ul>
                ) : null}
              </div>
            </SchedulerField>
            <button
              type="button"
              onClick={applySchedule}
              disabled={items.length === 0}
              className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white px-4 h-9 text-xs font-bold disabled:opacity-50 shadow-sm"
            >
              <Clock className="size-3.5" />
              {t("posts.bulkSchedule.apply")}
            </button>
            {totalIssues.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 text-xs font-bold">
                <AlertCircle className="size-3.5" /> {blockedCount} blocked • {readyCount} ready
              </span>
            )}
            {totalIssues.length === 0 && items.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 text-xs font-bold">
                <CheckCircle2 className="size-3.5" /> All ready
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 hidden sm:block">Start date sets slot 1. We auto-space posts in your timezone ({timezone}), 30 min apart per day. <Link href="/dashboard/calendar" className="underline decoration-dotted hover:text-zinc-700">View in Calendar</Link> after scheduling.</p>
        </div>

        {/* ── Global Platform Selector Bar (Parity with Create Post) ── */}
        <div className="rounded-[16px] border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <PlatformTileBar
              selected={accounts}
              onToggle={toggleAccount}
              getPreviewProps={(id) => ({
                caption: items[0]?.captionByPlatform?.[id] ?? items[0]?.caption ?? "",
                mediaUrl: items[0]?.url ?? null,
                mediaKind: items[0]?.kind === "document" ? null : (items[0]?.kind as "image" | "video" | null) ?? null,
              })}
            />
            <div className="flex items-center gap-2 text-xs font-semibold pl-2 border-l border-zinc-200">
              <button
                type="button"
                onClick={() => {
                  const compatible = platformsForBulkContent(contentType, carouselMediaMode);
                  setAccounts(new Set(compatible));
                }}
                className="text-zinc-600 hover:text-zinc-900 underline-offset-2 hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-zinc-300">•</span>
              <button
                type="button"
                onClick={() => setAccounts(new Set())}
                className="text-zinc-600 hover:text-zinc-900 underline-offset-2 hover:underline cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyAccountsToAll}
              disabled={accounts.size === 0 || items.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 text-zinc-900 px-3.5 h-9 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Apply to All ({items.length}) Posts
            </button>
          </div>
        </div>

        {/* ── Content type planner ── */}
        <div className="rounded-[16px] border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-2 sm:p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[280px]">
            <BulkContentTypeSelector
              value={contentType}
              carouselMode={carouselMediaMode}
              onChange={handleContentTypeChange}
              onCarouselModeChange={handleCarouselMediaModeChange}
            />
            {contentType === "community" ? (
              <div className="mt-3 grid gap-2 rounded-xl border border-sky-200 bg-sky-50/70 p-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="text-[11px] font-bold text-sky-950">
                  X Community ID
                  <input
                    value={xCommunityId}
                    onChange={(event) => setXCommunityId(event.target.value.trim())}
                    placeholder="e.g. 1493446837214187523"
                    className="mt-1 block h-9 w-full rounded-lg border border-sky-200 bg-white px-3 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-sky-200 bg-white px-3 text-xs font-semibold text-sky-950">
                  <input
                    type="checkbox"
                    checked={shareCommunityWithFollowers}
                    onChange={(event) => setShareCommunityWithFollowers(event.target.checked)}
                  />
                  Share with followers
                </label>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setMatrixModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 px-3 h-9 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="size-3.5 text-zinc-900" />
              Feature Matrix
            </button>
            <button
              type="button"
              onClick={applyComposerModeToAll}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 text-zinc-900 px-3.5 h-9 text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Layers className="size-3.5 text-zinc-600" />
              Apply format to All ({items.length})
            </button>
          </div>
        </div>

        {/* ── AI + Campaign Rules + Undo bar ── */}
        {items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setBatchAiOpen(true)}
                  disabled={generating}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-black disabled:opacity-50 text-white px-4 h-9 text-xs font-bold shadow-sm"
                >
                  <Sparkles className="size-4" />
                  {generating ? t("posts.bulkSchedule.generating") : t("posts.bulkSchedule.generate_ai_captions", { n: items.length })}
                </button>
                <button
                  type="button"
                  onClick={() => setRulesOpen((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border px-3 h-9 text-xs font-semibold shadow-sm transition-colors",
                    metadataRules.enabled
                      ? "bg-zinc-900 text-white border-zinc-900 hover:bg-black"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  <Hash className="size-3.5" />
                  Campaign Rules
                  {metadataRules.enabled && (
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  <Zap className="size-3.5 text-amber-500" /> Per-post AI with tone & platform adaptation
                </span>
              </div>
              <div className="flex items-center gap-2">
                {undoStack.length > 0 ? (
                  <button
                    type="button"
                    onClick={undoRemove}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold hover:bg-zinc-50 shadow-sm"
                  >
                    <Undo2 className="size-3.5" />
                    Undo remove ({undoStack.length})
                  </button>
                ) : null}
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-2.5 py-1 text-[11px] font-bold">{items.length}/{MAX_FILES} files</span>
              </div>
            </div>

            {/* Campaign Rules expandable panel */}
            {rulesOpen && (
              <div className="p-4 rounded-[16px] border border-zinc-200 bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Hash className="size-3.5 text-zinc-600" /> Global Campaign & CTA Rules
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Auto-merge hashtags or call-to-action lines across all posts in your bulk batch.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={applyRulesToAllCaptions}
                    disabled={!metadataRules.enabled}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black disabled:opacity-50 text-white px-3 h-8 text-xs font-bold shadow-sm"
                  >
                    <CheckCircle2 className="size-3.5" /> Apply Rules to All Posts
                  </button>
                </div>
                <MetadataRulesPanel
                  rules={metadataRules}
                  onChange={setMetadataRules}
                />
              </div>
            )}
          </div>
        ) : null}

        {/* ── Main Content Area: Unified Hero Uploader when empty, 2-column studio when populated ── */}
        {items.length === 0 ? (
          <EmptyUploaderState
            onDrop={onDrop}
            dragging={dragging}
            pickFiles={pickFiles}
            setUnsplashOpen={setUnsplashOpen}
            setCanvaOpen={setCanvaOpen}
            setDriveOpen={setDriveOpen}
            setDropboxOpen={setDropboxOpen}
            downloadCsvTemplate={downloadCsvTemplate}
            pickCsvFile={pickCsvFile}
            csvBusy={csvBusy}
            onOpenMatrixModal={() => setMatrixModalOpen(true)}
            contentType={contentType}
            addTextPost={addTextPost}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
            {/* Left: Media Hub */}
            <div className="space-y-4 lg:sticky lg:top-4">
              <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                    <div className="flex items-center gap-2">
                      <span className="size-7 inline-flex items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
                        <ImageIcon className="size-3.5" />
                      </span>
                      <h3 className="text-sm font-bold tracking-tight">{t("posts.bulkSchedule.media_files_title")}</h3>
                      <span className="text-xs font-mono text-zinc-500">
                        {items.length}/{MAX_FILES}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={contentType === "text" || contentType === "community" ? addTextPost : pickMoreFiles}
                        className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 h-7 text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
                      >
                        <Plus className="size-3" />
                        {contentType === "text" || contentType === "community" ? "Add post" : t("posts.bulkSchedule.add_more")}
                      </button>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="inline-flex items-center gap-1 px-2 h-7 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-full cursor-pointer"
                      >
                        <Trash2 className="size-3" />
                        {t("posts.bulkSchedule.clear_all")}
                      </button>
                    </div>
                  </div>

                  {/* Cloud and stock integrations buttons */}
                  <div className="mb-3">
                    <p className="text-[11px] font-semibold text-zinc-600 mb-1.5">Import from Cloud & Stock</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setUnsplashOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-700 shadow-sm cursor-pointer"
                      >
                        <BrandIcons.unsplash size={14} /> Unsplash
                      </button>
                      <button
                        type="button"
                        onClick={() => setCanvaOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-700 shadow-sm cursor-pointer"
                      >
                        <BrandIcons.canva size={14} /> Canva
                      </button>
                      <button
                        type="button"
                        onClick={() => setDriveOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-700 shadow-sm cursor-pointer"
                      >
                        <BrandIcons.googledrive size={14} /> Drive
                      </button>
                      <button
                        type="button"
                        onClick={() => setDropboxOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-700 shadow-sm cursor-pointer"
                      >
                        <BrandIcons.dropbox size={14} /> Dropbox
                      </button>
                    </div>
                  </div>

                  {/* Selected media items list */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
                      <ImageIcon className="size-3.5" /> {t("posts.bulkSchedule.selected_media")}
                    </span>
                    <span className="text-zinc-500">{t("posts.bulkSchedule.manage_uploads")}</span>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto -mx-1 px-1 space-y-1.5">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-2.5 p-2 rounded-xl border transition-colors",
                          item.uploadStatus === "error" ? "bg-red-50 border-red-200" : "bg-white border-zinc-200 hover:border-zinc-300"
                        )}
                      >
                        <div className="relative size-10 flex-shrink-0 rounded-lg bg-zinc-100 overflow-hidden border border-zinc-200">
                          {item.kind === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.source === "upload" ? item.previewUrl : item.url} alt={item.name} className="w-full h-full object-cover" />
                          ) : item.kind === "video" ? (
                            <video src={item.source === "upload" ? item.previewUrl : item.url} className="w-full h-full object-cover" />
                          ) : item.kind === "document" ? (
                            <span className="flex h-full w-full items-center justify-center"><FileText className="size-5 text-zinc-500" /></span>
                          ) : (
                            <span className="flex h-full w-full items-center justify-center"><MessageSquare className="size-5 text-zinc-500" /></span>
                          )}
                          {item.source === "upload" && item.uploadStatus === "uploading" ? (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            </div>
                          ) : null}
                          {item.source === "upload" && item.uploadStatus === "error" ? (
                            <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                              <X className="size-3.5 text-white" />
                            </div>
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{item.name}</p>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                            {item.source === "upload" && item.uploadStatus === "uploading" ? (
                              <span className="inline-flex items-center gap-1 text-amber-600">
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" /> Uploading…
                              </span>
                            ) : item.source === "upload" && item.uploadStatus === "error" ? (
                              <span className="text-red-600">Upload failed</span>
                            ) : (
                              item.kind === "text" ? "No media" : formatBytes(item.size)
                            )}
                            <span>•</span> {item.kind === "image" ? "Image" : item.kind === "video" ? "Video" : item.kind === "document" ? "Document" : "Text"} #{idx + 1}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="size-7 inline-flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 shrink-0 cursor-pointer"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      setDragging(false);
                    }}
                    onDrop={onAddMoreDrop}
                    onClick={contentType === "text" || contentType === "community" ? addTextPost : pickMoreFiles}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (contentType === "text" || contentType === "community") addTextPost();
                        else pickMoreFiles();
                      }
                    }}
                    className={cn(
                      "mt-3 rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors flex flex-col items-center gap-1",
                      dragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    {contentType === "text" || contentType === "community" ? <MessageSquare className="size-4 text-zinc-400" /> : <ImagePlus className="size-4 text-zinc-400" />}
                    <p className="text-xs font-semibold text-zinc-700">{contentType === "text" || contentType === "community" ? "Add another text post" : "Drop to add more media files"}</p>
                    <p className="text-[11px] text-zinc-500">
                      Add to your existing {items.length} file{items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Post Cards List */}
            <PostsList
              items={items}
              accountsCount={accountsArr.length}
              onToggleAccount={(itemId, platformId) => {
                setItems((prev) =>
                  prev.map((it) => {
                    if (it.id !== itemId) return it;
                    const has = it.accountIds.includes(platformId);
                    // Guard: image posts cannot go to video-only platforms (YouTube)
                    if (!has && (it as BulkItemBase).kind === "image" && isVideoOnlyPlatform(platformId)) {
                      toast({ title: "YouTube is video-only", description: "This post is an image — YouTube requires video. Upload a video to enable YouTube.", tone: "warning" });
                      return it;
                    }
                    // Guard: post-type platform restrictions
                    if (!has) {
                      const pt = ((it as BulkItemBase).postType ?? "standard") as ComposerMode;
                      const allowed = allowedPlatformsForItem(it as BulkItemBase);
                      if (allowed && !allowed.includes(platformId)) {
                        const label = pt === "carousel" ? "This Carousel format" : pt === "trial_reel" ? "Trial Reel (Instagram only)" : pt === "document" ? "Document (LinkedIn only)" : pt;
                        toast({ title: `${label} not supported on ${PLATFORMS.find((p) => p.id === platformId)?.name ?? platformId}`, description: "Check the Platform Feature Matrix for supported formats.", tone: "warning" });
                        return it;
                      }
                    }
                    const nextIds = has ? it.accountIds.filter((a) => a !== platformId) : [...it.accountIds, platformId];
                    // sync advanced defaults for newly added platform
                    let adv = (it as BulkItemBase).advancedByPlatform ?? {};
                    if (!has) {
                      const def = getDefaultOptions(platformId);
                      adv = { ...adv, [platformId]: { ...def, ...(platformId === "pinterest" && destinationOptions.boards[0] ? { pinterest_board_id: destinationOptions.boards[0].value } : {}), ...(platformId === "facebook" && destinationOptions.pages[0] ? { facebook_page_id: destinationOptions.pages[0].value } : {}) } };
                    } else {
                      const { [platformId]: _omit, ...rest } = adv;
                      adv = rest;
                    }
                    return {
                      ...it,
                      accountIds: nextIds,
                      advancedByPlatform: adv,
                    } as BulkItem;
                  })
                );
              }}
              accounts={accounts}
              onUpdateItem={updateItem}
              onRemove={removeItem}
              onApplyAccountsToAll={applyAccountsToAll}
              onScheduleSingle={scheduleSingle}
              onOpenAI={(item) => setAiTarget(item)}
              onOpenCrop={(item) => setCropTarget(item)}
              onOpenCover={(item) => setCoverTarget(item)}
              onPickCustomCover={handlePickCustomCover}
              onOpenCollaborators={(item) => setCollaboratorsTarget(item)}
              onApplyHashtagsToAll={applyHashtagsToAll}
              onApplyFirstCommentToAll={applyFirstCommentToAll}
              onApplyTagUsersToAll={applyTagUsersToAll}
              onAutoFitAllOverLimit={handleAutoFitAllOverLimit}
              batchAdvancedByPlatform={batchAdvancedByPlatform}
              onApplyBatchAdvanced={applyBatchAdvanced}
              onApplyPinterestBoardToAll={applyPinterestBoardToAll}
              onApplySmartLinkToAll={applySmartLinkToAll}
              contentType={contentType}
              destinationOptions={destinationOptions}
              aiGeneratingItemId={aiGeneratingItemId}
              timezone={timezone}
              onChangePostType={handleChangePostType}
              onAddCarouselSlides={handleAddCarouselSlides}
              onRemoveCarouselSlide={handleRemoveCarouselSlide}
              onReorderCarousel={handleReorderCarousel}
              onDocumentTitleChange={handleDocumentTitleChange}
              onDocumentFile={handleDocumentFile}
              onTrialModeChange={handleTrialModeChange}
              onReplaceTrialVideo={handleReplaceTrialVideo}
              onSwitchContentType={handleContentTypeChange}
            />
          </div>
        )}

        {/* Hidden inputs — accept changes with Post Type */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={bulkAcceptForContentType(contentType, carouselMediaMode)}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) handleFiles(files);
            e.target.value = "";
          }}
        />
        <input
          ref={addMoreInputRef}
          type="file"
          multiple
          accept={bulkAcceptForContentType(contentType, carouselMediaMode)}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) handleFiles(files);
            e.target.value = "";
          }}
        />
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCsvFile(file);
            e.target.value = "";
          }}
        />

        {/* Sticky bottom bar */}
        {items.length > 0 ? (
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 h-[64px] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="hidden sm:inline-flex size-8 items-center justify-center rounded-full bg-zinc-900 text-white">
                  <Layers className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-none">{t("posts.bulkSchedule.posts_ready", { n: items.length })} • {readyCount} ready</p>
                  <p className="text-xs text-zinc-500 hidden sm:block">
                    {blockedCount > 0 ? `${blockedCount} need attention — fix captions & required fields` : "All posts validated"} • <Link href="/dashboard/queue" className="underline decoration-dotted hover:text-zinc-700">View Queue</Link>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleScheduleAll}
                disabled={scheduleBusy || readyCount === 0}
                title={readyCount === 0 && blockedCount > 0 ? "Fix blocked posts (see red badges) to enable scheduling" : undefined}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 h-10 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Calendar className="size-4" />
                {scheduleBusy
                  ? t("posts.bulkSchedule.scheduling")
                  : readyCount > 0 && blockedCount > 0
                    ? `Schedule ${readyCount} ready`
                    : t("posts.bulkSchedule.schedule_all")}
                <span className="hidden sm:inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-white/20 text-[11px] px-1.5">{readyCount > 0 && blockedCount > 0 ? `${readyCount}/${items.length}` : items.length}</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Batch AI dialog */}
        <AICaptionsDialog
          open={batchAiOpen}
          onClose={() => setBatchAiOpen(false)}
          isGenerating={generating}
          batchCount={items.length}
          imageUrl={
            items[0]?.kind === "image"
              ? items[0]?.source === "upload"
                ? (items[0] as UploadedBulkItem)?.previewUrl || items[0]?.url
                : (items[0] as CsvBulkItem)?.mediaUrl
              : null
          }
          videoTitle={items[0]?.kind === "video" ? items[0]?.name.replace(/\.[^.]+$/, "") : null}
          onGenerate={(opts) => void aiGenerateForAll(opts)}
        />

        {/* Per-item AI dialog */}
        <AICaptionsDialog
          open={!!aiTarget}
          onClose={() => setAiTarget(null)}
          isGenerating={!!aiGeneratingItemId}
          imageUrl={
            aiTarget?.kind === "image"
              ? aiTarget?.source === "upload"
                ? (aiTarget as UploadedBulkItem)?.previewUrl || aiTarget?.url
                : (aiTarget as CsvBulkItem)?.mediaUrl
              : null
          }
          videoTitle={aiTarget?.kind === "video" ? aiTarget?.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() ?? null : null}
          onGenerate={(opts) => {
            if (aiTarget) void aiGenerateForItem(aiTarget, opts);
          }}
        />

        {/* External Cloud media dialogs */}
        <UnsplashDialog
          open={unsplashOpen}
          onClose={() => setUnsplashOpen(false)}
          onImport={handleExternalImport}
        />
        <CanvaDialog
          open={canvaOpen}
          onClose={() => setCanvaOpen(false)}
          onImport={handleExternalImport}
        />
        <GoogleDriveDialog
          open={driveOpen}
          onClose={() => setDriveOpen(false)}
          onImport={handleExternalImport}
        />
        <DropboxDialog
          open={dropboxOpen}
          onClose={() => setDropboxOpen(false)}
          onImport={handleExternalImport}
        />

        {/* Media editing modals */}
        <CropModal
          open={!!cropTarget}
          onClose={() => setCropTarget(null)}
          imageUrl={cropTarget ? (cropTarget.source === "upload" ? cropTarget.previewUrl : cropTarget.url) : null}
          onApply={(dataUrl) => {
            if (cropTarget) void applyCroppedImage(dataUrl, cropTarget.id);
            setCropTarget(null);
          }}
        />
        <CoverImageModal
          open={!!coverTarget}
          onClose={() => setCoverTarget(null)}
          videoUrl={coverTarget ? (coverTarget.source === "upload" ? coverTarget.previewUrl : coverTarget.url) : null}
          onApply={(dataUrl) => {
            if (coverTarget) void applyFrameCover(dataUrl, coverTarget.id);
            setCoverTarget(null);
          }}
        />
        <CollaboratorsModal
          open={!!collaboratorsTarget}
          onClose={() => setCollaboratorsTarget(null)}
          collaborators={collaboratorsTarget?.collaborators ?? []}
          onSave={(list) => {
            if (collaboratorsTarget) handleSaveCollaborators(collaboratorsTarget.id, list);
            setCollaboratorsTarget(null);
          }}
        />

        {/* Platform Feature Matrix Modal */}
        <PlatformFeatureMatrixModal
          open={matrixModalOpen}
          onClose={() => setMatrixModalOpen(false)}
        />

        {/* Hidden custom cover input for video thumbnails */}
        <input
          ref={customCoverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            const targetId = customCoverTargetItemId.current;
            if (file && targetId) {
              const res = await uploadFile(file);
              if (res) {
                setItems((prev) =>
                  prev.map((it) =>
                    it.id === targetId
                      ? {
                          ...it,
                          customCoverUrl: res.url,
                        }
                      : it
                  )
                );
                toast({ title: "Custom cover uploaded", tone: "success" });
              }
            }
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function SchedulerField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

function EmptyUploaderState({
  onDrop,
  dragging,
  pickFiles,
  setUnsplashOpen,
  setCanvaOpen,
  setDriveOpen,
  setDropboxOpen,
  downloadCsvTemplate,
  pickCsvFile,
  csvBusy,
  onOpenMatrixModal,
  contentType,
  addTextPost,
}: {
  onDrop: (e: React.DragEvent) => void;
  dragging: boolean;
  pickFiles: () => void;
  setUnsplashOpen: (v: boolean) => void;
  setCanvaOpen: (v: boolean) => void;
  setDriveOpen: (v: boolean) => void;
  setDropboxOpen: (v: boolean) => void;
  downloadCsvTemplate: () => void;
  pickCsvFile: () => void;
  csvBusy: boolean;
  onOpenMatrixModal: () => void;
  contentType: BulkContentType;
  addTextPost: () => void;
}) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-4">
      {/* Unified Hero Uploader Card */}
      <div className="rounded-[20px] border border-zinc-200 bg-white shadow-sm p-6 sm:p-10 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="mx-auto size-12 rounded-[16px] bg-zinc-900 text-white flex items-center justify-center shadow-md">
            <UploadCloud className="size-6" />
          </span>
          <h3 className="text-xl font-bold tracking-tight text-zinc-900">
            {t("posts.bulkSchedule.empty_title")}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
            {t("posts.bulkSchedule.empty_subtitle")}
          </p>
          <div className="pt-1 flex items-center justify-center gap-2 text-xs flex-wrap">
            <button
              type="button"
              onClick={onOpenMatrixModal}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 font-semibold text-zinc-800 hover:bg-zinc-50 shadow-xs cursor-pointer"
            >
              <Sparkles className="size-3.5 text-zinc-900" /> Platform Feature Matrix
            </button>
            <Link
              href="/dashboard/assets"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs"
            >
              <Eye className="size-3.5" /> Media Library
            </Link>
          </div>
        </div>

        {/* Central Large Drag & Drop Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={onDrop}
          onClick={contentType === "text" || contentType === "community" ? addTextPost : pickFiles}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (contentType === "text" || contentType === "community") addTextPost();
              else pickFiles();
            }
          }}
          className={cn(
            "rounded-[16px] border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-2",
            dragging
              ? "border-zinc-900 bg-zinc-50 scale-[1.01]"
              : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/50"
          )}
        >
          <div className="size-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-700 mb-1 shadow-xs">
            {contentType === "text" || contentType === "community" ? <MessageSquare className="size-7" /> : <UploadCloud className="size-7" />}
          </div>
          <p className="text-base font-bold text-zinc-900">
            {contentType === "community" ? "Add an X Community post" : contentType === "text" ? "Add a text post" : t("posts.bulkSchedule.drop_zone")}
          </p>
          <p className="text-xs text-zinc-500 max-w-sm">
            {contentType === "community"
              ? "Create the post now, then write its caption and confirm the X Community ID."
              : contentType === "text"
                ? "Create caption-only posts without uploading placeholder media."
                : t("posts.bulkSchedule.drop_zone_desc", { max: MAX_FILES })}
          </p>
          {contentType !== "text" && contentType !== "community" ? (
            <p className="text-[11px] text-zinc-400 font-medium">
              {t("posts.bulkSchedule.drop_zone_footnote", {
                maxSize: Math.round(MAX_FILE_BYTES / 1024 / 1024),
              })}
            </p>
          ) : null}
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-black">
            <Plus className="size-3.5" /> {contentType === "text" || contentType === "community" ? "Add Post" : "Browse Files"}
          </span>
        </div>

        {/* Cloud & CSV Integrations Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Cloud sources */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2.5">
            <p className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <Upload className="size-3.5 text-zinc-500" /> Import from Cloud & Stock
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setUnsplashOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-xs cursor-pointer"
              >
                <BrandIcons.unsplash size={14} /> Unsplash
              </button>
              <button
                type="button"
                onClick={() => setCanvaOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-xs cursor-pointer"
              >
                <BrandIcons.canva size={14} /> Canva
              </button>
              <button
                type="button"
                onClick={() => setDriveOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-xs cursor-pointer"
              >
                <BrandIcons.googledrive size={14} /> Drive
              </button>
              <button
                type="button"
                onClick={() => setDropboxOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-xs cursor-pointer"
              >
                <BrandIcons.dropbox size={14} /> Dropbox
              </button>
            </div>
          </div>

          {/* CSV Bulk */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2.5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <FileText className="size-3.5 text-zinc-500" /> CSV Bulk Upload
              </p>
              <p className="text-xs text-zinc-500 mt-1">{t("posts.bulkSchedule.csv_hint")}</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 h-8 text-xs font-semibold hover:bg-zinc-50 shadow-xs cursor-pointer"
              >
                <Download className="size-3.5" /> Template
              </button>
              <button
                type="button"
                onClick={pickCsvFile}
                disabled={csvBusy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 text-white px-3.5 h-8 text-xs font-bold hover:bg-black disabled:opacity-50 shadow-xs cursor-pointer"
              >
                <Upload className="size-3.5" />
                {csvBusy ? t("posts.bulkSchedule.reading") : t("posts.bulkSchedule.upload_csv")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Step Workflow guidance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-[16px] border border-zinc-200 bg-white p-4 space-y-2 shadow-xs">
          <span className="size-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
            1
          </span>
          <h4 className="text-xs font-bold text-zinc-900">{t("posts.bulkSchedule.empty_step1_title")}</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">{t("posts.bulkSchedule.empty_step1_desc")}</p>
        </div>
        <div className="rounded-[16px] border border-zinc-200 bg-white p-4 space-y-2 shadow-xs">
          <span className="size-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
            2
          </span>
          <h4 className="text-xs font-bold text-zinc-900">{t("posts.bulkSchedule.empty_step2_title")}</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">{t("posts.bulkSchedule.empty_step2_desc", { max: MAX_FILES })}</p>
        </div>
        <div className="rounded-[16px] border border-zinc-200 bg-white p-4 space-y-2 shadow-xs">
          <span className="size-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
            3
          </span>
          <h4 className="text-xs font-bold text-zinc-900">{t("posts.bulkSchedule.empty_step3_title")}</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">{t("posts.bulkSchedule.empty_step3_desc")}</p>
        </div>
      </div>

      {/* Feature perks banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-[16px] border border-zinc-200 bg-white p-4 flex items-start gap-3 shadow-xs">
          <div className="size-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Clock className="size-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-900">Use the Date Scheduler</h5>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              Set start date, posts per day, and intervals. Then click Apply to automatically assign date & time to all your posts at once.
            </p>
          </div>
        </div>
        <div className="rounded-[16px] border border-zinc-200 bg-white p-4 flex items-start gap-3 shadow-xs">
          <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-900">AI Caption Generation</h5>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              Generate captions for all posts using AI after uploading your media files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PostsListProps {
  items: BulkItem[];
  accountsCount: number;
  accounts: Set<PlatformId>;
  onToggleAccount: (itemId: string, platformId: PlatformId) => void;
  onUpdateItem: (id: string, patch: Partial<BulkItem>) => void;
  onRemove: (id: string) => void;
  onApplyAccountsToAll: () => void;
  onScheduleSingle: (itemId: string) => void;
  onOpenAI: (item: BulkItem) => void;
  onOpenCrop: (item: BulkItem) => void;
  onOpenCover: (item: BulkItem) => void;
  onPickCustomCover: (itemId: string) => void;
  onOpenCollaborators: (item: BulkItem) => void;
  onApplyHashtagsToAll: (tags: string[]) => void;
  onApplyFirstCommentToAll: (comment: string) => void;
  onApplyTagUsersToAll: (tagUsers: string) => void;
  onAutoFitAllOverLimit: () => void;
  batchAdvancedByPlatform: Partial<Record<PlatformId, PlatformAdvancedOptions>>;
  onApplyBatchAdvanced: (platform: PlatformId, options: PlatformAdvancedOptions) => void;
  onApplyPinterestBoardToAll: (boardId: string) => void;
  onApplySmartLinkToAll: (url: string, options: { instagramCta: boolean; customCtaText?: string }) => void;
  contentType: BulkContentType;
  destinationOptions: { boards: Array<{ value: string; label: string }>; pages: Array<{ value: string; label: string }> };
  aiGeneratingItemId: string | null;
  timezone: string;
  onChangePostType: (itemId: string, mode: ComposerMode) => void;
  onAddCarouselSlides: (itemId: string, files: File[]) => void;
  onRemoveCarouselSlide: (itemId: string, slideId: string) => void;
  onReorderCarousel: (itemId: string, from: number, to: number) => void;
  onDocumentTitleChange: (itemId: string, title: string) => void;
  onDocumentFile: (itemId: string, file: File) => void;
  onTrialModeChange: (itemId: string, mode: TrialReelMode) => void;
  onReplaceTrialVideo: (itemId: string, file: File) => void;
  onSwitchContentType?: (type: BulkContentType) => void;
}

function PostsList({
  items,
  accountsCount,
  accounts,
  onToggleAccount,
  onUpdateItem,
  onRemove,
  onApplyAccountsToAll,
  onScheduleSingle,
  onOpenAI,
  onOpenCrop,
  onOpenCover,
  onPickCustomCover,
  onOpenCollaborators,
  onApplyHashtagsToAll,
  onApplyFirstCommentToAll,
  onApplyTagUsersToAll,
  onAutoFitAllOverLimit,
  batchAdvancedByPlatform,
  onApplyBatchAdvanced,
  onApplyPinterestBoardToAll,
  onApplySmartLinkToAll,
  contentType,
  destinationOptions,
  aiGeneratingItemId,
  timezone,
  onChangePostType,
  onAddCarouselSlides,
  onRemoveCarouselSlide,
  onReorderCarousel,
  onDocumentTitleChange,
  onDocumentFile,
  onTrialModeChange,
  onReplaceTrialVideo,
  onSwitchContentType,
}: PostsListProps) {
  const t = useTranslations("dashboard");
  const [firstCommentPrompt, setFirstCommentPrompt] = useState("");
  const [showFirstCommentInput, setShowFirstCommentInput] = useState(false);
  const [tagUsersPrompt, setTagUsersPrompt] = useState("");
  const [showTagUsersInput, setShowTagUsersInput] = useState(false);
  const [showBatchAdvanced, setShowBatchAdvanced] = useState(false);
  const [selectedPlatformTab, setSelectedPlatformTab] = useState<PlatformId | null>(null);

  // Smart Link Input State
  const [showSmartLinkInput, setShowSmartLinkInput] = useState(false);
  const [smartLinkUrl, setSmartLinkUrl] = useState("");
  const [smartLinkIgCta, setSmartLinkIgCta] = useState(true);

  const activePlatformIds = useMemo(() => {
    const set = new Set<PlatformId>();
    for (const item of items) {
      for (const pid of item.accountIds) {
        set.add(pid);
      }
    }
    // Also add accounts selected at top level if not already present
    if (accounts) {
      for (const pid of accounts) {
        set.add(pid);
      }
    }
    return Array.from(set);
  }, [items, accounts]);

  const hasPinterestActive = useMemo(() => {
    return activePlatformIds.includes("pinterest") || items.some((it) => it.accountIds.includes("pinterest"));
  }, [activePlatformIds, items]);

  const currentBatchPinterestBoard = useMemo(() => {
    const fromBatch = (batchAdvancedByPlatform.pinterest as Record<string, unknown> | undefined)?.pinterest_board_id as string | undefined;
    if (fromBatch) return fromBatch;
    const firstWithBoard = items.find((it) => (it as BulkItemBase).pinterestBoard)?.pinterestBoard;
    if (firstWithBoard) return firstWithBoard;
    return destinationOptions.boards[0]?.value ?? "";
  }, [batchAdvancedByPlatform, items, destinationOptions.boards]);

  useEffect(() => {
    if (activePlatformIds.length > 0) {
      if (!selectedPlatformTab || !activePlatformIds.includes(selectedPlatformTab)) {
        setSelectedPlatformTab(activePlatformIds[0]);
      }
    }
  }, [activePlatformIds, selectedPlatformTab]);

  const bulkMediaKind = useMemo((): MediaKind => {
    if (contentType === "long_video" || contentType === "short_video" || contentType === "trial_reel") return "video";
    if (items.some((it) => it.kind === "video")) return "video";
    if (contentType === "document" || items.some((it) => it.kind === "document")) return "text";
    return "image";
  }, [contentType, items]);

  return (
    <div className="space-y-3 pb-6">
      <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <ProStatIcon tint="blue" size={28}>
              <Layers className="size-3.5" />
            </ProStatIcon>
            {t("posts.bulkSchedule.posts_ready", { n: items.length })}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">{t("posts.bulkSchedule.customize_subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onAutoFitAllOverLimit}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 h-8 text-xs font-bold shadow-sm"
          >
            <Zap className="size-3.5 text-amber-600" /> Auto-Fit Over-Limit
          </button>
          <HashtagsDropdown
            onInsert={onApplyHashtagsToAll}
            align="right"
            size="sm"
            className="rounded-full font-bold shadow-sm"
          />

          {/* Smart Link Tool Button */}
          <button
            type="button"
            onClick={() => {
              setShowSmartLinkInput((v) => !v);
              setShowFirstCommentInput(false);
              setShowTagUsersInput(false);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 h-8 text-xs font-bold shadow-sm transition-all cursor-pointer",
              showSmartLinkInput
                ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20"
                : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <Link2 className={cn("size-3.5", showSmartLinkInput ? "text-white" : "text-blue-600")} />
            <span>Smart Link</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowFirstCommentInput((v) => !v);
              setShowSmartLinkInput(false);
              setShowTagUsersInput(false);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 h-8 text-xs font-semibold shadow-sm transition-all cursor-pointer",
              showFirstCommentInput
                ? "bg-zinc-900 text-white border-zinc-900"
                : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <MessageSquare className="size-3.5" /> First comment
          </button>
          <button
            type="button"
            onClick={() => {
              setShowTagUsersInput((v) => !v);
              setShowSmartLinkInput(false);
              setShowFirstCommentInput(false);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 h-8 text-xs font-semibold shadow-sm transition-all cursor-pointer",
              showTagUsersInput
                ? "bg-zinc-900 text-white border-zinc-900"
                : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <Users className="size-3.5" /> Tag users
          </button>

          {/* Pinterest Board Selector — automatically applies to all posts */}
          {hasPinterestActive && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/80 hover:bg-red-100/70 text-red-950 px-3 h-8 text-xs font-bold shadow-sm transition-all">
              <ProPlatformIcon platform="pinterest" size={14} />
              <span className="text-[11px] text-red-800 shrink-0">Board:</span>
              <select
                value={currentBatchPinterestBoard}
                onChange={(e) => onApplyPinterestBoardToAll(e.target.value)}
                className="bg-transparent text-xs font-bold text-red-950 focus:outline-none cursor-pointer pr-1 truncate max-w-[150px]"
              >
                <option value="" disabled={destinationOptions.boards.length > 0}>
                  {destinationOptions.boards.length > 0 ? "Select Board..." : "No boards found"}
                </option>
                {destinationOptions.boards.map((b) => (
                  <option key={b.value} value={b.value} className="text-zinc-900 bg-white font-medium">
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onApplyAccountsToAll}
            disabled={accountsCount === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 h-8 text-xs font-bold hover:bg-zinc-50 disabled:opacity-50 shadow-sm"
          >
            <Users className="size-3.5" />
            {t("posts.bulkSchedule.apply_accounts_all")}
          </button>
          <button
            type="button"
            onClick={() => setShowBatchAdvanced((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 h-8 text-xs font-bold shadow-sm transition-all cursor-pointer",
              showBatchAdvanced
                ? "bg-zinc-950 text-white border-zinc-950 shadow-md ring-2 ring-zinc-950/20"
                : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300"
            )}
          >
            <Settings2 className={cn("size-3.5", showBatchAdvanced ? "text-white" : "text-zinc-700")} />
            Advanced for each platform
            <span
              className={cn(
                "ml-0.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold border",
                showBatchAdvanced
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-zinc-100 text-zinc-700 border-zinc-200"
              )}
            >
              {activePlatformIds.length}
            </span>
            <ChevronDown className={cn("size-3.5 transition-transform", showBatchAdvanced && "rotate-180")} />
          </button>
        </div>
      </div>

      {showBatchAdvanced && (
        <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="size-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs shrink-0">
                <Settings2 className="size-4" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-zinc-900">Advanced Platform Settings (Applied to All Posts)</h4>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="size-3" /> Auto-applied to all {items.length} post(s)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Customize publishing preferences for each platform. Changes are instantly applied to all matching posts in your queue.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBatchAdvanced(false)}
              className="inline-flex items-center justify-center size-7 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {activePlatformIds.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              No platforms currently selected on your posts. Select platforms to configure their advanced options.
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Platform tabs — wraps cleanly so ALL platforms are visible */}
              <div className="flex flex-wrap items-center gap-2">
                {activePlatformIds.map((pid) => {
                  const meta = getPlatform(pid);
                  const isTabActive = selectedPlatformTab === pid;
                  const postCount = items.filter((it) => it.accountIds.includes(pid)).length;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => setSelectedPlatformTab(pid)}
                      className={cn(
                        "inline-flex items-center gap-2 px-3.5 h-9 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer",
                        isTabActive
                          ? "bg-zinc-950 text-white border-zinc-950 shadow-sm ring-2 ring-zinc-950/20"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
                      )}
                    >
                      <ProPlatformIcon platform={pid} size={15} />
                      <span>{meta?.name ?? pid}</span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                          isTabActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {postCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active platform panel */}
              {selectedPlatformTab && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ProPlatformIcon platform={selectedPlatformTab} size={16} />
                      <span className="text-xs font-bold text-zinc-900">
                        {getPlatform(selectedPlatformTab)?.name ?? selectedPlatformTab} Options
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        • Updating {items.filter((it) => it.accountIds.includes(selectedPlatformTab)).length} post(s)
                      </span>
                    </div>
                  </div>

                  <AdvancedOptionsPanel
                    platform={selectedPlatformTab}
                    platformName={getPlatform(selectedPlatformTab)?.name ?? selectedPlatformTab}
                    mediaKind={bulkMediaKind}
                    value={
                      batchAdvancedByPlatform[selectedPlatformTab] ??
                      items.find((it) => it.accountIds.includes(selectedPlatformTab))?.advancedByPlatform?.[selectedPlatformTab] ??
                      getDefaultOptions(selectedPlatformTab)
                    }
                    onChange={(next) => onApplyBatchAdvanced(selectedPlatformTab, next)}
                    selectOptions={
                      selectedPlatformTab === "pinterest" && destinationOptions.boards.length > 0
                        ? { pinterest_board_id: destinationOptions.boards }
                        : selectedPlatformTab === "facebook" && destinationOptions.pages.length > 0
                          ? { facebook_page_id: destinationOptions.pages }
                          : undefined
                    }
                    collapsible={false}
                    defaultOpen={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showSmartLinkInput && (
        <div className="rounded-[16px] border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 p-4 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-100/80">
            <div className="flex items-center gap-2.5">
              <span className="size-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Link2 className="size-4" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-zinc-900">Smart Multi-Platform Link Routing</h4>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
                    Auto-Applied to All {items.length} Posts
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Distributes your link according to each platform&apos;s native capabilities: First Comment for Instagram, Destination Pin for Pinterest, and direct Clickable Captions for LinkedIn, Facebook, X, and Threads.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSmartLinkInput(false)}
              className="inline-flex items-center justify-center size-7 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer self-end sm:self-center"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 min-w-0">
              <input
                type="url"
                value={smartLinkUrl}
                onChange={(e) => setSmartLinkUrl(e.target.value)}
                placeholder="Enter destination URL (e.g. https://yourbrand.com/sale)..."
                className="w-full h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <label className="flex items-center gap-2 px-3 h-9 rounded-xl bg-white border border-zinc-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={smartLinkIgCta}
                  onChange={(e) => setSmartLinkIgCta(e.target.checked)}
                  className="size-3.5 text-purple-600 rounded"
                />
                <span className="text-xs font-medium text-zinc-700">
                  Instagram caption CTA (<span className="text-purple-700 font-semibold">👇 Link in comments</span>)
                </span>
              </label>
              <button
                type="button"
                disabled={!smartLinkUrl.trim()}
                onClick={() => {
                  onApplySmartLinkToAll(smartLinkUrl.trim(), { instagramCta: smartLinkIgCta });
                  setShowSmartLinkInput(false);
                }}
                className="px-4 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all"
              >
                Apply to All ({items.length}) Posts
              </button>
              <button
                type="button"
                onClick={() => setShowSmartLinkInput(false)}
                className="px-3 h-9 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-semibold hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Platform distribution matrix preview chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Routing Engine:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 font-semibold">
              <ProPlatformIcon platform="instagram" size={13} /> Instagram → 💬 First Comment
            </span>
            {hasPinterestActive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                <ProPlatformIcon platform="pinterest" size={13} /> Pinterest → 📌 Destination Pin Link
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              <ProPlatformIcon platform="linkedin" size={13} />
              <ProPlatformIcon platform="facebook" size={13} />
              <ProPlatformIcon platform="twitter" size={13} />
              <ProPlatformIcon platform="threads" size={13} />
              <ProPlatformIcon platform="youtube" size={13} />
              <ProPlatformIcon platform="bluesky" size={13} />
              <span>Direct Link in Caption (Rich Preview)</span>
            </span>
          </div>
        </div>
      )}

      {showFirstCommentInput && (
        <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center gap-2">
          <input
            type="text"
            value={firstCommentPrompt}
            onChange={(e) => setFirstCommentPrompt(e.target.value)}
            placeholder="Enter first comment to apply to all posts..."
            className="flex-1 h-8 rounded-lg border border-zinc-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <button
            type="button"
            onClick={() => {
              onApplyFirstCommentToAll(firstCommentPrompt);
              setShowFirstCommentInput(false);
              setFirstCommentPrompt("");
            }}
            className="px-3 h-8 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-black"
          >
            Apply to All
          </button>
          <button
            type="button"
            onClick={() => setShowFirstCommentInput(false)}
            className="px-2 h-8 rounded-lg text-xs font-medium text-zinc-500 hover:bg-zinc-200"
          >
            Cancel
          </button>
        </div>
      )}

      {showTagUsersInput && (
        <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center gap-2">
          <input
            type="text"
            value={tagUsersPrompt}
            onChange={(e) => setTagUsersPrompt(e.target.value)}
            placeholder="Enter tagged users (e.g. @user1, @user2) for all posts..."
            className="flex-1 h-8 rounded-lg border border-zinc-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <button
            type="button"
            onClick={() => {
              onApplyTagUsersToAll(tagUsersPrompt);
              setShowTagUsersInput(false);
              setTagUsersPrompt("");
            }}
            className="px-3 h-8 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-black"
          >
            Apply to All
          </button>
          <button
            type="button"
            onClick={() => setShowTagUsersInput(false)}
            className="px-2 h-8 rounded-lg text-xs font-medium text-zinc-500 hover:bg-zinc-200"
          >
            Cancel
          </button>
        </div>
      )}

      {items.map((item, idx) => (
        <PostRow
          key={item.id}
          item={item}
          index={idx}
          contentType={contentType}
          onUpdate={(patch) => onUpdateItem(item.id, patch)}
          onRemove={() => onRemove(item.id)}
          onScheduleSingle={() => onScheduleSingle(item.id)}
          onOpenAI={() => onOpenAI(item)}
          onOpenCrop={() => onOpenCrop(item)}
          onOpenCover={() => onOpenCover(item)}
          onPickCustomCover={() => onPickCustomCover(item.id)}
          onOpenCollaborators={() => onOpenCollaborators(item)}
          destinationOptions={destinationOptions}
          aiGenerating={aiGeneratingItemId === item.id}
          timezone={timezone}
          onAddCarouselSlides={(files) => onAddCarouselSlides(item.id, files)}
          onRemoveCarouselSlide={(sid) => onRemoveCarouselSlide(item.id, sid)}
          onReorderCarousel={(f, t) => onReorderCarousel(item.id, f, t)}
          onDocumentTitleChange={(title) => onDocumentTitleChange(item.id, title)}
          onDocumentFile={(file) => onDocumentFile(item.id, file)}
          onTrialModeChange={(mode) => onTrialModeChange(item.id, mode)}
          onReplaceTrialVideo={(file) => onReplaceTrialVideo(item.id, file)}
          onSwitchContentType={onSwitchContentType}
        />
      ))}
    </div>
  );
}

function ReadinessBadgePopover({
  readiness,
  item,
  onAutoFitPlatform,
}: {
  readiness: ReadinessReport;
  item: BulkItem;
  onAutoFitPlatform: (pid: PlatformId) => void;
}) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Aggregate issues
  const issuesList = useMemo(() => {
    const list: {
      platform: PlatformId;
      severity: "blocked" | "warning";
      code: string;
      message: string;
    }[] = [];
    for (const p of readiness.perPlatform) {
      for (const iss of p.issues) {
        list.push({
          platform: p.platform as PlatformId,
          severity: iss.severity,
          code: iss.code,
          message: iss.message,
        });
      }
    }
    return list;
  }, [readiness]);

  const isBlocked = readiness.overall === "blocked";
  const isWarning = readiness.overall === "warning";
  const isReady = readiness.overall === "ready";

  return (
    <div className="relative ml-auto" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all shadow-xs cursor-pointer select-none",
          isBlocked
            ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            : isWarning
              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
        )}
        title="Click to view platform readiness details"
      >
        {isBlocked ? (
          <AlertCircle className="size-3 text-red-600" />
        ) : isWarning ? (
          <AlertTriangle className="size-3 text-amber-600" />
        ) : (
          <CheckCircle2 className="size-3 text-emerald-600" />
        )}
        <span>
          {isBlocked
            ? `${readiness.blockedCount} blocked`
            : isWarning
              ? `${readiness.warningCount} warning${readiness.warningCount > 1 ? "s" : ""}`
              : "Ready"}
        </span>
        <ChevronDown className={cn("size-3 opacity-60 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-40 w-72 sm:w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl space-y-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100">
            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              {isReady ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-600" /> All Platforms Ready
                </>
              ) : (
                <>
                  <AlertCircle className="size-3.5 text-red-600" /> Platform Requirements ({issuesList.length})
                </>
              )}
            </span>
            <span className="text-[10px] font-medium text-zinc-400">
              {item.accountIds.length} network{item.accountIds.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isReady ? (
            <p className="text-xs text-zinc-600 py-1">
              All {item.accountIds.length} connected platform{item.accountIds.length !== 1 ? "s" : ""} meet caption and media requirements.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {issuesList.map((iss, i) => {
                const pMeta = PLATFORMS.find((p) => p.id === iss.platform);
                const isCharLimit = iss.code.includes("char_limit") || iss.code.includes("length") || iss.message.includes("characters");
                return (
                  <div
                    key={`${iss.platform}-${iss.code}-${i}`}
                    className={cn(
                      "p-2 rounded-lg border text-xs flex items-start justify-between gap-2",
                      iss.severity === "blocked"
                        ? "bg-red-50/60 border-red-200/80 text-red-900"
                        : "bg-amber-50/60 border-amber-200/80 text-amber-900"
                    )}
                  >
                    <div className="flex items-start gap-1.5 min-w-0">
                      <ProPlatformIcon platform={iss.platform} size={14} className="mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-[11px]">
                          {pMeta?.name ?? iss.platform}
                        </div>
                        <div className="text-[11px] leading-tight text-zinc-700 mt-0.5">
                          {iss.message}
                        </div>
                      </div>
                    </div>
                    {isCharLimit && (
                      <button
                        type="button"
                        onClick={() => {
                          onAutoFitPlatform(iss.platform);
                        }}
                        className="shrink-0 px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] uppercase tracking-wider shadow-xs"
                      >
                        ⚡ Auto-Fit
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PostRow({
  item,
  index,
  contentType,
  onUpdate,
  onRemove,
  onScheduleSingle,
  onOpenAI,
  onOpenCrop,
  onOpenCover,
  onPickCustomCover,
  onOpenCollaborators,
  destinationOptions,
  aiGenerating,
  timezone,
  onAddCarouselSlides,
  onRemoveCarouselSlide,
  onReorderCarousel,
  onDocumentTitleChange,
  onDocumentFile,
  onTrialModeChange,
  onReplaceTrialVideo,
  onSwitchContentType,
}: {
  item: BulkItem;
  index: number;
  contentType: BulkContentType;
  onUpdate: (patch: Partial<BulkItem>) => void;
  onRemove: () => void;
  onScheduleSingle: () => void;
  onOpenAI: () => void;
  onOpenCrop: () => void;
  onOpenCover: () => void;
  onPickCustomCover: () => void;
  onOpenCollaborators: () => void;
  destinationOptions: { boards: Array<{ value: string; label: string }>; pages: Array<{ value: string; label: string }> };
  aiGenerating: boolean;
  timezone: string;
  onAddCarouselSlides: (files: File[]) => void;
  onRemoveCarouselSlide: (slideId: string) => void;
  onReorderCarousel: (from: number, to: number) => void;
  onDocumentTitleChange: (title: string) => void;
  onDocumentFile: (file: File) => void;
  onTrialModeChange: (mode: TrialReelMode) => void;
  onReplaceTrialVideo: (file: File) => void;
  onSwitchContentType?: (type: BulkContentType) => void;
}) {
  const t = useTranslations("dashboard");
  const { toast } = useToast();
  const hasYouTube = item.accountIds.includes("youtube");
  const hasPinterest = item.accountIds.includes("pinterest");
  const hasInstagram = item.accountIds.includes("instagram");
  const hasFacebook = item.accountIds.includes("facebook");
  const hasX = item.accountIds.includes("twitter");
  const captionLen = item.caption.length;
  const ytTitleLen = item.youtubeTitle.length;
  const ytTagsLen = item.youtubeTags.length;
  const charLimit = pickCharLimitFor(item);
  const overLimit = captionLen > charLimit;
  const previewSrc =
    item.kind === "image" && item.customCoverUrl
      ? item.customCoverUrl
      : item.kind === "video" && item.customCoverUrl
        ? item.customCoverUrl
        : item.frameCoverUrl || item.url || (item.source === "upload" ? item.previewUrl : "");

  const readiness = useMemo(() => buildReadinessForItem(item), [item]);
  const hasValidationErrors = readiness.blockedCount > 0;

  const effectiveContentType: BulkContentType =
    (item as BulkItemBase).contentType ||
    ((item as BulkItemBase).postType === "trial_reel"
      ? "trial_reel"
      : (item as BulkItemBase).postType === "carousel"
        ? "carousel"
        : (item as BulkItemBase).postType === "document"
          ? "document"
          : contentType);

  const isVerticalPhoneView =
    effectiveContentType === "short_video" ||
    effectiveContentType === "story" ||
    effectiveContentType === "trial_reel" ||
    (item as BulkItemBase).postType === "trial_reel";

  const [extraOpen, setExtraOpen] = useState(false);
  const [customPlatformOpen, setCustomPlatformOpen] = useState(false);

  const handleAutoFitPlatform = useCallback(
    (pid: PlatformId) => {
      const currentCap = item.captionByPlatform?.[pid] ?? item.caption;
      const fitted = fitCaptionForPlatform(currentCap, pid);
      const effectiveLim = getEffectiveLimit(pid, item);
      if (effectiveLim > 280 && pid === "twitter") {
        const curLen = Array.from(currentCap).length;
        if (curLen <= effectiveLim && curLen > 280) {
          toast({ title: `Caption already within limit for ${PLATFORMS.find((pl) => pl.id === pid)?.name ?? pid} (long post enabled)`, tone: "info" });
          return;
        }
      }
      onUpdate({
        captionByPlatform: {
          ...(item.captionByPlatform ?? {}),
          [pid]: fitted,
        },
      } as Partial<BulkItem>);
      const pMeta = PLATFORMS.find((pl) => pl.id === pid);
      toast({ title: `Auto-fitted caption for ${pMeta?.name ?? pid}`, tone: "success" });
    },
    [item.captionByPlatform, item.caption, item, onUpdate, toast]
  );

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white shadow-xs transition-all overflow-hidden",
        hasValidationErrors ? "border-red-200 ring-1 ring-red-100" : "border-zinc-200 hover:border-zinc-300"
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="size-6 rounded-md bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
            #{index + 1}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {item.accountIds.slice(0, 5).map((pid) => (
              <ProPlatformIcon key={pid} platform={pid} size={22} />
            ))}
            {item.accountIds.length > 5 && <ProOverflowBadge count={item.accountIds.length - 5} size={22} />}
            <span className="text-xs text-zinc-500 font-medium">
              {item.accountIds.length} {item.accountIds.length === 1 ? "platform" : "platforms"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ReadinessBadgePopover
            readiness={readiness}
            item={item}
            onAutoFitPlatform={handleAutoFitPlatform}
          />

          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove post"
            className="size-7 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
        {/* Media + Schedule */}
        <div className="p-3 space-y-3 bg-zinc-50/30">
          {effectiveContentType === "carousel" ? (
            (() => {
              const slides = (item as BulkItemBase).carouselSlides ?? [];
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    {slides.map((slide, sidx) => (
                      <div
                        key={slide.id}
                        className="relative group rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 aspect-square"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", String(sidx))}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
                          if (!Number.isNaN(from) && from !== sidx) onReorderCarousel(from, sidx);
                        }}
                      >
                        {slide.kind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={slide.url} alt={slide.name} className="w-full h-full object-cover" />
                        ) : (
                          <video src={slide.url} className="w-full h-full object-cover" />
                        )}
                        <span className="absolute top-1 left-1 size-5 rounded-full bg-zinc-900/80 text-white text-[10px] font-bold flex items-center justify-center">
                          {sidx + 1}
                        </span>
                        {slide.uploadStatus === "uploading" && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveCarouselSlide(slide.id)}
                          className="absolute -top-1 -right-1 size-5 rounded-full bg-zinc-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 shadow"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    {slides.length < 10 && (
                      <label className="rounded-lg border-2 border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer">
                        <input
                          type="file"
                          accept={bulkAcceptForContentType("carousel", (item as BulkItemBase).carouselMediaMode ?? "images")}
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            if (files.length) onAddCarouselSlides(files);
                            e.target.value = "";
                          }}
                        />
                        <ImageIcon className="size-5 text-zinc-400" />
                        <span className="text-[10px] font-semibold text-zinc-600">Add</span>
                      </label>
                    )}
                  </div>
                  <p className={cn("text-[11px]", slides.length < 2 ? "text-amber-600 font-medium" : "text-zinc-500")}>
                    {slides.length < 2
                      ? "⚠️ Carousel needs at least 2 slides"
                      : `${slides.length}/10 slides • ${(item as BulkItemBase).carouselMediaMode ?? "images"}`}
                  </p>
                </div>
              );
            })()
          ) : effectiveContentType === "document" ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="size-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{item.name}</p>
                    <p className="text-[10px] text-zinc-500">{formatBytes(item.size)} • {(item as BulkItemBase).documentPageCount ? `${(item as BulkItemBase).documentPageCount} pages` : "PDF/DOC"}</p>
                  </div>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold border", item.uploadStatus === "ready" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : item.uploadStatus === "uploading" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200")}>
                    {item.uploadStatus}
                  </span>
                </div>
                {item.uploadStatus === "uploading" && <div className="h-1 bg-zinc-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 animate-pulse w-full" /></div>}
              </div>
              <label className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 p-3 cursor-pointer">
                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onDocumentFile(f); e.target.value = ""; }} />
                <Upload className="size-3.5 text-zinc-500" /> <span className="text-xs font-semibold text-zinc-700">Replace document</span>
              </label>
            </div>
          ) : isVerticalPhoneView ? (
            <div className="space-y-2">
              {/* Unified Realistic Vertical Phone Frame for Shorts, Reels, Stories & Trial Reels */}
              <div className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-[9/16] max-h-64 w-full border border-zinc-200 shadow-xs">
                {item.kind === "video" ? (
                  <video src={previewSrc} className="w-full h-full object-contain" controls />
                ) : item.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt={item.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-400">
                    <MessageSquare className="size-8" />
                    <span className="text-[11px] font-bold">Text Post</span>
                  </div>
                )}

                {/* Uploading Spinner Overlay */}
                {item.source === "upload" && item.uploadStatus === "uploading" && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                    <span className="size-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span className="text-[10px] text-white font-medium">Uploading…</span>
                  </div>
                )}

                {/* Top Badge */}
                {effectiveContentType === "trial_reel" ? (
                  <span className="absolute top-2 left-2 text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                    <Zap className="size-3" /> Trial Reel
                  </span>
                ) : effectiveContentType === "story" ? (
                  <span className="absolute top-2 left-2 text-[10px] bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                    <Sparkles className="size-3" /> Story (24h)
                  </span>
                ) : (
                  <span className="absolute top-2 left-2 text-[10px] bg-gradient-to-r from-pink-500 to-rose-600 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                    <Video className="size-3" /> Reel / Short
                  </span>
                )}

                {/* Bottom Metadata Pill */}
                {item.kind === "video" && item.mediaMetadata ? (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                    <Video className="size-3 text-zinc-300" />
                    <span className={cn(
                      item.mediaMetadata.aspectRatio === "9:16" ? "text-emerald-400" : item.mediaMetadata.aspectRatio === "16:9" ? "text-sky-300" : "text-zinc-200"
                    )}>
                      {item.mediaMetadata.aspectRatio}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span>{item.mediaMetadata.formattedDuration}</span>
                  </div>
                ) : null}
              </div>

              {/* Trial Reel specific dropdown & replace */}
              {effectiveContentType === "trial_reel" && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-700">Trial Reel mode (Instagram)</label>
                    <select
                      value={(item as BulkItemBase).trialMode ?? "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED"}
                      onChange={(e) => onTrialModeChange(e.target.value as TrialReelMode)}
                      className="mt-1 h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    >
                      <option value="TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED">Auto-share if engagement high (recommended)</option>
                      <option value="TRIAL_REELS_ALWAYS_SHARE_TO_FOLLOWERS">Always share to followers</option>
                      <option value="TRIAL_REELS_DO_NOT_SHARE_TO_FOLLOWERS">Non-followers only (isolated trial)</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 p-2.5 cursor-pointer">
                    <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onReplaceTrialVideo(f); e.target.value = ""; }} />
                    <Upload className="size-3.5 text-zinc-500" /> <span className="text-xs font-semibold text-zinc-700">Replace video</span>
                  </label>
                </>
              )}

              {/* Quick-Fix Toolkit for vertical phone modes */}
              {item.kind === "video" && item.mediaMetadata ? (
                (() => {
                  const meta = item.mediaMetadata;
                  const isHorizontal = meta.aspectRatio === "16:9" || meta.orientation === "horizontal";
                  const isYTShortsOver = hasYouTube && effectiveContentType === "short_video" && meta.durationSec > 180;
                  const isFBReelsOver = item.accountIds.includes("facebook") && effectiveContentType === "short_video" && meta.durationSec > 90;
                  const isLinkedInRatioInvalid = item.accountIds.includes("linkedin") && (meta.isLinkedInRatioValid === false || meta.isExtremeVertical);

                  // 1. Format Mismatch (16:9 uploaded for vertical formats)
                  if (isHorizontal || isYTShortsOver) {
                    const presetName =
                      effectiveContentType === "story"
                        ? "Stories"
                        : effectiveContentType === "trial_reel"
                          ? "Trial Reel"
                          : "Shorts/Reels";
                    return (
                      <div className="rounded-xl border border-red-200 bg-red-50/80 p-2.5 space-y-2 text-left animate-in fade-in duration-150">
                        <div className="flex items-start gap-1.5 text-red-800">
                          <AlertCircle className="size-3.5 mt-0.5 shrink-0 text-red-600" />
                          <div className="text-[11px] leading-tight">
                            <span className="font-bold">Format Mismatch:</span>{" "}
                            {isHorizontal
                              ? `16:9 (horizontal) video uploaded for ${presetName} (needs 9:16 vertical).`
                              : `Duration (${meta.formattedDuration}) exceeds YouTube Shorts limit (3m).`}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={onOpenCrop}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            <Crop className="size-3" /> Launch Cropper (9:16)
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onSwitchContentType) {
                                onSwitchContentType("long_video");
                              } else {
                                const compatible = platformsForBulkContent("long_video", "images");
                                const nextAccounts = item.accountIds.filter((id) => compatible.includes(id));
                                onUpdate({
                                  contentType: "long_video",
                                  postType: "standard",
                                  accountIds: nextAccounts.length > 0 ? nextAccounts : compatible,
                                } as Partial<BulkItem>);
                              }
                              toast({ title: "Switched to Long-Form Video", description: "Post type and platform requirements adjusted for 16:9.", tone: "success" });
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-100/50 text-red-900 px-2 py-1 text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            <RefreshCw className="size-3" /> Switch to Long Video
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // 2. Facebook Reels Over 90s Warning & 1-Click Deselection
                  if (isFBReelsOver) {
                    return (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/85 p-2.5 space-y-2 text-left animate-in fade-in duration-150">
                        <div className="flex items-start gap-1.5 text-amber-900">
                          <AlertCircle className="size-3.5 mt-0.5 shrink-0 text-amber-600" />
                          <div className="text-[11px] leading-tight">
                            <span className="font-bold">Facebook Reels Limit:</span>{" "}
                            Facebook Reels caps at 90s (your video is {meta.formattedDuration}).
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const nextAccounts = item.accountIds.filter((id) => id !== "facebook");
                              onUpdate({ accountIds: nextAccounts } as Partial<BulkItem>);
                              toast({ title: "Deselected Facebook", description: "Post remains active for other ready platforms.", tone: "info" });
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            <X className="size-3" /> Deselect Facebook
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // 3. LinkedIn Unsupported Aspect Ratio
                  if (isLinkedInRatioInvalid) {
                    return (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/85 p-2.5 space-y-2 text-left animate-in fade-in duration-150">
                        <div className="flex items-start gap-1.5 text-amber-900">
                          <AlertCircle className="size-3.5 mt-0.5 shrink-0 text-amber-600" />
                          <div className="text-[11px] leading-tight">
                            <span className="font-bold">LinkedIn Ratio Limit:</span>{" "}
                            LinkedIn does not support extreme aspect ratios outside 1:2.4–2.4:1.
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const nextAccounts = item.accountIds.filter((id) => id !== "linkedin");
                              onUpdate({ accountIds: nextAccounts } as Partial<BulkItem>);
                              toast({ title: "Deselected LinkedIn", description: "Post remains active for other ready platforms.", tone: "info" });
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            <X className="size-3" /> Deselect LinkedIn
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()
              ) : null}

              {(item.frameCoverUrl || item.customCoverUrl) && (
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-zinc-200 text-[10px] font-medium text-emerald-700">
                  <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                  <span className="truncate">{item.customCoverUrl ? "Custom cover set" : "Frame cover set"}</span>
                </div>
              )}

              {/* Media actions */}
              {item.kind === "video" ? (
                <div className="grid grid-cols-2 gap-1 pt-1">
                  <button
                    type="button"
                    onClick={onOpenCover}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="size-3 text-zinc-500" /> Frame
                  </button>
                  <button
                    type="button"
                    onClick={onPickCustomCover}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm cursor-pointer"
                  >
                    <Upload className="size-3 text-zinc-500" /> Cover
                  </button>
                  <button
                    type="button"
                    onClick={onOpenCollaborators}
                    className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm cursor-pointer"
                  >
                    <Users className="size-3 text-zinc-500" /> Collaborators {item.collaborators?.length ? `(${item.collaborators.length})` : ""}
                  </button>
                </div>
              ) : item.kind === "image" ? (
                <button
                  type="button"
                  onClick={onOpenCrop}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm cursor-pointer"
                >
                  <Crop className="size-3 text-zinc-500" /> Crop image
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Standard Landscape / Image / Text Preview */}
              <div
                className={cn(
                  "relative rounded-xl overflow-hidden border border-zinc-200 shadow-xs transition-all",
                  effectiveContentType === "image" || (item.kind === "image" && item.mediaMetadata?.aspectRatio === "1:1")
                    ? "aspect-square max-h-64 w-full bg-zinc-100"
                    : "aspect-video w-full bg-zinc-900"
                )}
              >
                {item.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt={item.name} className="w-full h-full object-cover" />
                ) : item.kind === "video" ? (
                  <video src={previewSrc} className="w-full h-full object-contain" controls />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-500">
                    <MessageSquare className="size-8" />
                    <span className="text-[11px] font-bold">{effectiveContentType === "community" ? "X Community post" : "Text post"}</span>
                  </div>
                )}

                {item.source === "upload" && item.uploadStatus === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                    <span className="size-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span className="text-[10px] text-white font-medium">Uploading…</span>
                  </div>
                )}

                {effectiveContentType === "long_video" && (
                  <span className="absolute top-2 left-2 text-[10px] bg-zinc-900/90 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                    <Video className="size-3" /> Long Video
                  </span>
                )}

                {effectiveContentType === "image" && (
                  <span className="absolute top-2 left-2 text-[10px] bg-zinc-900/80 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                    <ImageIcon className="size-3" /> Image Post
                  </span>
                )}

                {item.kind === "video" && item.mediaMetadata ? (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                    <Video className="size-3 text-zinc-300" />
                    <span className={cn(
                      item.mediaMetadata.aspectRatio === "9:16" ? "text-emerald-400" : item.mediaMetadata.aspectRatio === "16:9" ? "text-sky-300" : "text-zinc-200"
                    )}>
                      {item.mediaMetadata.aspectRatio}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span>{item.mediaMetadata.formattedDuration}</span>
                  </div>
                ) : null}
              </div>

              {/* Long Video Notice if vertical <= 3 min */}
              {effectiveContentType === "long_video" && item.kind === "video" && item.mediaMetadata && (item.mediaMetadata.aspectRatio === "9:16" || item.mediaMetadata.orientation === "vertical" || item.mediaMetadata.aspectRatio === "1:1") && item.mediaMetadata.durationSec <= 180 && (
                <div className="rounded-xl border border-sky-200 bg-sky-50/85 p-2.5 space-y-2 text-left animate-in fade-in duration-150">
                  <div className="flex items-start gap-1.5 text-sky-900">
                    <Info className="size-3.5 mt-0.5 shrink-0 text-sky-600" />
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold">Vertical Video in Long Video:</span>{" "}
                      {hasYouTube
                        ? "YouTube will auto-classify this as a Short (custom thumbnails ignored). Facebook will be set to Page Video."
                        : "This vertical video will publish as standard Page Video on selected platforms."}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSwitchContentType) {
                          onSwitchContentType("short_video");
                        } else {
                          const compatible = platformsForBulkContent("short_video", "images");
                          const nextAccounts = item.accountIds.filter((id) => compatible.includes(id));
                          onUpdate({
                            contentType: "short_video",
                            postType: "standard",
                            accountIds: nextAccounts.length > 0 ? nextAccounts : compatible,
                          } as Partial<BulkItem>);
                        }
                        toast({ title: "Switched to Shorts & Reels", description: "Configured for vertical short-form placements.", tone: "success" });
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-2 py-1 text-[10px] font-bold shadow-xs cursor-pointer"
                    >
                      <RefreshCw className="size-3" /> Switch to Shorts & Reels
                    </button>
                  </div>
                </div>
              )}

              {(item.frameCoverUrl || item.customCoverUrl) && (
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-zinc-200 text-[10px] font-medium text-emerald-700">
                  <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                  <span className="truncate">{item.customCoverUrl ? "Custom cover set" : "Frame cover set"}</span>
                </div>
              )}

              {/* Media actions */}
              {item.kind !== "text" ? (
                <div className="space-y-1.5 pt-1">
                  {item.kind === "image" ? (
                    <button
                      type="button"
                      onClick={onOpenCrop}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm cursor-pointer"
                    >
                      <Crop className="size-3 text-zinc-500" /> Crop image
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={onOpenCover}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm cursor-pointer"
                      >
                        <RefreshCw className="size-3 text-zinc-500" /> Frame
                      </button>
                      <button
                        type="button"
                        onClick={onPickCustomCover}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm cursor-pointer"
                      >
                        <Upload className="size-3 text-zinc-500" /> Cover
                      </button>
                      <button
                        type="button"
                        onClick={onOpenCollaborators}
                        className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm cursor-pointer"
                      >
                        <Users className="size-3 text-zinc-500" /> Collaborators {item.collaborators?.length ? `(${item.collaborators.length})` : ""}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-zinc-200">
            <h4 className="text-xs font-bold flex items-center gap-1.5">
              <Clock className="size-3.5 text-zinc-500" /> Schedule
            </h4>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={item.scheduledDate}
                min={todayISO()}
                onChange={(e) => onUpdate({ scheduledDate: e.target.value })}
                className="mt-1 h-8 w-full rounded-xl border border-zinc-200 bg-white px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Time</label>
              <input
                type="time"
                value={item.scheduledTime}
                onChange={(e) => onUpdate({ scheduledTime: e.target.value })}
                className="mt-1 h-8 w-full rounded-xl border border-zinc-200 bg-white px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                <Timer className="size-3" /> {timezone} • {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Caption + Advanced */}
        <div className="p-3 sm:p-4 space-y-3 min-w-0">
          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Hash className="size-3.5 text-zinc-500" /> Caption <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <HashtagsDropdown
                  onInsert={(tags) => {
                    const current = item.caption;
                    const next = current.trim() ? `${current.trim()} ${tags.join(" ")}` : tags.join(" ");
                    onUpdate({ caption: next });
                  }}
                  size="sm"
                  className="rounded-full shadow-sm"
                />
                <button
                  type="button"
                  onClick={onOpenAI}
                  disabled={aiGenerating}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-900 hover:bg-black disabled:opacity-50 text-white px-2.5 py-1 text-[11px] font-bold"
                >
                  <Sparkles className="size-3" /> {aiGenerating ? "Generating…" : "AI Caption"}
                </button>
                <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded-full border", overLimit ? "bg-red-50 text-red-600 border-red-200" : "bg-zinc-50 text-zinc-500 border-zinc-200")}>
                  {captionLen}/{charLimit}
                </span>
              </div>
            </div>
            <textarea
              value={item.caption}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              placeholder={t("posts.bulkSchedule.caption_placeholder")}
              rows={4}
              maxLength={63206}
              className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 resize-none leading-relaxed"
            />
            {/* Per-platform character limits pill badges with inline 1-click Auto-Fit */}
            {item.accountIds.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                {item.accountIds.map((pid) => {
                  const pMeta = PLATFORMS.find((pl) => pl.id === pid);
                  const pidCaption = item.captionByPlatform?.[pid] ?? item.caption;
                  const pidLen = Array.from(pidCaption).length;
                  const lim = getEffectiveLimit(pid, item);
                  const isPidOver = pidLen > lim;
                  const isOverridden = !!item.captionByPlatform?.[pid] && item.captionByPlatform[pid] !== item.caption;
                  return (
                    <span
                      key={pid}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border transition-colors",
                        isPidOver
                          ? "bg-red-50 text-red-700 border-red-200"
                          : isOverridden
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200"
                      )}
                    >
                      <ProPlatformIcon platform={pid} size={12} />
                      {pMeta?.name ?? pid}: {pidLen}/{lim}
                      {isOverridden && !isPidOver && (
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Tailored</span>
                      )}
                      {isPidOver && (
                        <button
                          type="button"
                          onClick={() => handleAutoFitPlatform(pid)}
                          className="ml-0.5 px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] uppercase tracking-wider shadow-xs"
                          title={`Auto-fit caption for ${pMeta?.name ?? pid}`}
                        >
                          ⚡ Auto-Fit
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Custom per-platform caption override accordion */}
            {item.accountIds.length > 1 && (
              <div className="mt-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setCustomPlatformOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900"
                >
                  <ChevronDown className={cn("size-3.5 transition-transform", customPlatformOpen && "rotate-180")} />
                  {customPlatformOpen ? "Hide platform overrides" : "Customize caption per platform"}
                  {Object.keys(item.captionByPlatform ?? {}).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-zinc-900 text-white text-[10px] font-bold">
                      {Object.keys(item.captionByPlatform ?? {}).length} custom
                    </span>
                  )}
                </button>

                {customPlatformOpen && (
                  <div className="mt-2 space-y-2 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                    <p className="text-[11px] text-zinc-500 mb-1">
                      Customize captions for specific networks (e.g. keeping 280 chars for X/Bluesky while Instagram has the full caption).
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {item.accountIds.map((pid) => {
                        const pMeta = PLATFORMS.find((pl) => pl.id === pid);
                        const val = item.captionByPlatform?.[pid] ?? item.caption;
                        const lim = getEffectiveLimit(pid, item);
                        const isOver = Array.from(val).length > lim;
                        return (
                          <div key={pid} className="space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold flex items-center gap-1.5 text-zinc-800">
                                <ProPlatformIcon platform={pid} size={14} /> {pMeta?.name ?? pid}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const fitted = fitCaptionForPlatform(val, pid);
                                    onUpdate({
                                      captionByPlatform: {
                                        ...(item.captionByPlatform ?? {}),
                                        [pid]: fitted,
                                      },
                                    } as Partial<BulkItem>);
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                                >
                                  ⚡ Smart-Fit
                                </button>
                                <span className={cn("text-[10px] font-mono", isOver ? "text-red-600 font-bold" : "text-zinc-500")}>
                                  {Array.from(val).length}/{lim}
                                </span>
                              </div>
                            </div>
                            <textarea
                              value={val}
                              onChange={(e) => {
                                onUpdate({
                                  captionByPlatform: {
                                    ...(item.captionByPlatform ?? {}),
                                    [pid]: e.target.value,
                                  },
                                } as Partial<BulkItem>);
                              }}
                              rows={2}
                              maxLength={63206}
                              className="w-full rounded-md border border-zinc-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
                              placeholder={`Caption specifically for ${pMeta?.name ?? pid}...`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {hasYouTube && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold flex items-center gap-1">
                  YouTube Title <span className="text-red-500">*</span> <span className={cn("ml-auto text-[10px] font-mono", ytTitleLen > 100 ? "text-red-600" : "text-zinc-500")}>{ytTitleLen}/100</span>
                </label>
                <input
                  type="text"
                  value={item.youtubeTitle}
                  onChange={(e) => onUpdate({ youtubeTitle: e.target.value.slice(0, 100) })}
                  placeholder="Enter video title for YouTube..."
                  className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold flex items-center gap-1">
                  YouTube Tags <span className={cn("ml-auto text-[10px] font-mono", ytTagsLen > 500 ? "text-red-600" : "text-zinc-500")}>{ytTagsLen}/500</span>
                </label>
                <input
                  type="text"
                  value={item.youtubeTags}
                  onChange={(e) => onUpdate({ youtubeTags: e.target.value.slice(0, 500) })}
                  placeholder="social, youtube, video, tag"
                  className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
            </div>
          )}

          {/* Collapsible extra */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setExtraOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-left"
            >
              <span className="text-xs font-bold flex items-center gap-1.5">
                <MessageSquare className="size-3.5" /> Extra · First comment, hashtags & tagging
              </span>
              <ChevronDown className={cn("size-4 text-zinc-500 transition-transform", extraOpen && "rotate-180")} />
            </button>
            {extraOpen && (
              <div className="p-3 space-y-3 bg-white">
                <div>
                  <label className="text-[11px] font-semibold">First comment (optional)</label>
                  <input
                    type="text"
                    value={(item as BulkItemBase).firstComment ?? ""}
                    onChange={(e) => onUpdate({ firstComment: e.target.value } as Partial<BulkItem>)}
                    placeholder="Add a first comment for Instagram/Facebook..."
                    className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold flex items-center gap-1">
                      <Hash className="size-3" /> Hashtags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={(item.hashtags ?? []).join(", ")}
                      onChange={(e) => onUpdate({ hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } as unknown as Partial<BulkItem>)}
                      placeholder="#cats, #cute"
                      className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold flex items-center gap-1">
                      <Users className="size-3" /> Tag users (comma separated)
                    </label>
                    <input
                      type="text"
                      value={(item as BulkItemBase).tagUsers ?? ""}
                      onChange={(e) => onUpdate({ tagUsers: e.target.value } as Partial<BulkItem>)}
                      placeholder="@user1, @user2"
                      className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold">Alt text (accessibility)</label>
                  <input
                    type="text"
                    value={(item as BulkItemBase).altText ?? ""}
                    onChange={(e) => onUpdate({ altText: e.target.value } as Partial<BulkItem>)}
                    placeholder="Describe the image for screen readers"
                    className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                {hasX && (
                  <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-2.5 space-y-2">
                    <label className="text-[11px] font-semibold text-sky-950">
                      X Community ID <span className="font-normal text-sky-700">(optional for regular posts)</span>
                      <input
                        type="text"
                        value={String(((item as BulkItemBase).advancedByPlatform?.twitter as Record<string, unknown> | undefined)?.twitter_community ?? "")}
                        onChange={(event) => {
                          const currentAdv = (item as BulkItemBase).advancedByPlatform ?? {};
                          const twitterAdv = (currentAdv.twitter ?? getDefaultOptions("twitter")) as PlatformAdvancedOptions;
                          onUpdate({
                            advancedByPlatform: {
                              ...currentAdv,
                              twitter: { ...twitterAdv, twitter_community: event.target.value },
                            },
                          } as Partial<BulkItem>);
                        }}
                        placeholder="Community ID"
                        className="mt-1 h-8 w-full rounded-lg border border-sky-200 bg-white px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-sky-950">
                      <input
                        type="checkbox"
                        checked={Boolean(((item as BulkItemBase).advancedByPlatform?.twitter as Record<string, unknown> | undefined)?.twitter_share_with_followers)}
                        onChange={(event) => {
                          const currentAdv = (item as BulkItemBase).advancedByPlatform ?? {};
                          const twitterAdv = (currentAdv.twitter ?? getDefaultOptions("twitter")) as PlatformAdvancedOptions;
                          onUpdate({
                            advancedByPlatform: {
                              ...currentAdv,
                              twitter: { ...twitterAdv, twitter_share_with_followers: event.target.checked },
                            },
                          } as Partial<BulkItem>);
                        }}
                      />
                      Share community post with followers
                    </label>
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-semibold">Profile</label>
                  <select
                    value={item.profile}
                    onChange={(e) => onUpdate({ profile: e.target.value })}
                    className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="Default">Default</option>
                    <option value="Personal">Personal</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onScheduleSingle}
              disabled={item.uploadStatus === "uploading" || readiness.overall === "blocked"}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white h-9 text-xs font-bold disabled:opacity-50 shadow-sm"
            >
              <Calendar className="size-3.5" />
              Schedule this post
            </button>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-500">
              <Eye className="size-3" /> Linked to <Link href="/dashboard/queue" className="underline decoration-dotted hover:text-zinc-700">Queue</Link>
            </span>
          </div>
        </div>
      </div>

      {item.accountIds.length === 0 ? (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5" /> {t("posts.bulkSchedule.no_accounts_warning")}
        </div>
      ) : null}
    </div>
  );
}
