// Per-platform publishing requirements / readiness checker.
//
// Pure function over the composer state + capability matrix. Returns one
// ReadinessResult per selected platform with a severity (ready/warning/blocked),
// a short summary, and a list of actionable issues. Consumed by:
//   - the requirements panel in the composer (Feature 2)
//   - the publish button gate (disabled when any platform is blocked)
//
// Client-safe: no server-only imports.

import type { PlatformId } from "@/lib/platforms";
import {
  CAPABILITY_MATRIX,
  getCapability,
  type MediaKind,
} from "@/lib/publishing/capability-matrix";
import type { PlatformAdvancedOptions } from "@/lib/publishing/advanced-options";

export type ReadinessSeverity = "ready" | "warning" | "blocked";

export interface ReadinessIssue {
  /** Machine-readable issue code. */
  code: string;
  /** Severity for the parent platform aggregate. */
  severity: "warning" | "blocked";
  /** Short user-facing message. */
  message: string;
  /** When non-null, a label for a field/control the user can act on. */
  actionLabel?: string;
}

export interface PlatformReadiness {
  platform: PlatformId;
  severity: ReadinessSeverity;
  summary: string;
  issues: ReadinessIssue[];
  /** Issues that would be unblocked by taking the suggested action. */
  fixable: boolean;
}

export interface ReadinessReport {
  perPlatform: PlatformReadiness[];
  overall: ReadinessSeverity;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
}

import type { ClassifiedAspectRatio, VideoOrientation } from "@/lib/media/video-metadata";

export type VideoMetadataStatus = "loading" | "ready" | "error" | "unknown";

export interface MediaMeta {
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number;
  width?: number;
  height?: number;
  aspectRatio?: ClassifiedAspectRatio;
  aspectRatioValue?: number;
  orientation?: VideoOrientation;
  isLinkedInRatioValid?: boolean;
  isExtremeVertical?: boolean;
  /** False while browser metadata probe is still running; undefined = probe not started / not applicable. */
  metadataLoaded?: boolean;
  /** Error string when metadata probe failed. */
  metadataError?: string;
  /** Explicit status override; when provided takes precedence over boolean fields. */
  metadataStatus?: VideoMetadataStatus;
}

export interface RequirementsInput {
  captionByPlatform: Partial<Record<PlatformId, string>>;
  media: MediaMeta[];
  postType?: string;
  contentType?: string;
  /** Per-platform advanced options (Feature 1). */
  advancedByPlatform?: Partial<Record<PlatformId, PlatformAdvancedOptions>>;
  /** Pre-computed media kind for the post (mixed → prefer video). */
  composerMediaKind?: MediaKind;
  /** Count of posts already published in the rolling 24h window per platform. */
  recent24hCounts?: Partial<Record<PlatformId, number>>;
  /** Override the system date for testing. */
  now?: Date;
}

const charCount = (s: string) => Array.from(s).length;

function checkMediaForPlatform(
  platform: PlatformId,
  media: MediaMeta[],
  options?: PlatformAdvancedOptions,
  input?: RequirementsInput
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const cap = getCapability(platform);

  // 0 items — only block if the platform does NOT support text-only posts
  if (media.length === 0) {
    if (!cap.supportsText) {
      issues.push({
        code: "missing_media",
        severity: "blocked",
        message: `${cap.displayName} requires at least one media file.`,
        actionLabel: "Add media",
      });
    }
    return issues;
  }

  // Bucket by kind
  const counts = { image: 0, video: 0 };
  for (const m of media) {
    if (m.kind === "image") counts.image++;
    else if (m.kind === "video") counts.video++;
  }

  // Per-kind limits
  for (const kind of ["image", "video"] as const) {
    const req = cap.media[kind];
    if (!req) {
      // Platform doesn't accept this kind — but only flag if present.
      if (counts[kind] > 0) {
        issues.push({
          code: `${kind}_not_supported`,
          severity: "blocked",
          message: `${cap.displayName} does not accept ${kind} files.`,
          actionLabel: "Remove media",
        });
      }
      continue;
    }
    if (req.maxItems && counts[kind] > req.maxItems) {
      issues.push({
        code: `${kind}_too_many`,
        severity: "blocked",
        message: `${cap.displayName} accepts at most ${req.maxItems} ${kind}${req.maxItems === 1 ? "" : "s"} per post (you have ${counts[kind]}).`,
        actionLabel: "Remove media",
      });
    }
    // Byte + mime + duration checks
    let badBytes = 0;
    let badMime = 0;
    let badDuration = 0;
    const hasDurationRequirement = req.minDurationSec != null || (req.maxDurationSec != null && req.maxDurationSec > 0 && Number.isFinite(req.maxDurationSec));
    let badAspect = 0;
    let badAspectMsg = "";
    for (const m of media) {
      if (m.kind !== kind) continue;
      if (m.sizeBytes > req.maxBytes) badBytes++;
      if (req.formats.length > 0 && !req.formats.includes(m.mimeType)) badMime++;
      if (kind === "video") {
        const status = resolveMetadataStatus(m);
        if (status === "loading") continue;
        if (status === "error" || status === "unknown") continue;
        // status === "ready": validate normally. If metadataStatus is undefined but duration present, treat as ready.
        // Guard: if duration is still undefined after ready, treat as unknown (handled separately)
        if (m.durationSec != null) {
          if (req.minDurationSec != null && m.durationSec < req.minDurationSec) badDuration++;
          if (req.maxDurationSec != null && m.durationSec > req.maxDurationSec) badDuration++;
        }
        // Aspect ratio & platform-specific placement checks
        const igType = options?.instagram_media_type;
        const fbType = options?.facebook_media_type;

        // Facebook Reels 90s ceiling & Stories 60s ceiling
        if (platform === "facebook" && m.durationSec != null) {
          if (fbType === "REELS" && m.durationSec > 90) {
            badDuration++;
          } else if (fbType === "STORIES" && m.durationSec > 60) {
            badDuration++;
          }
        }

        // LinkedIn aspect ratio constraints (1:2.4 to 2.4:1)
        if (platform === "linkedin" && m.aspectRatioValue != null) {
          if (m.aspectRatioValue < 0.40 || m.aspectRatioValue > 2.45) {
            issues.push({
              code: "linkedin_aspect_ratio_out_of_bounds",
              severity: "blocked",
              message: `LinkedIn rejects videos outside 1:2.4–2.4:1 ratio (got ${m.aspectRatio || m.aspectRatioValue}).`,
              actionLabel: "Deselect LinkedIn",
            });
          }
        }

        // YouTube auto-Short notice for vertical/square <= 180s (only when in long video or standard preset)
        if (
          platform === "youtube" &&
          m.durationSec != null &&
          m.durationSec <= 180 &&
          input?.contentType !== "short_video" &&
          input?.postType !== "story" &&
          input?.postType !== "trial_reel"
        ) {
          if (m.orientation === "vertical" || m.aspectRatio === "9:16" || m.aspectRatio === "1:1") {
            issues.push({
              code: "youtube_auto_short_notice",
              severity: "warning",
              message: "Vertical or square video (≤ 3 min) will auto-publish as a YouTube Short (custom thumbnails are ignored on Shorts).",
              actionLabel: "Switch to Shorts & Reels",
            });
          }
        }

        if (m.aspectRatio && m.orientation) {
          const isHorizontal = m.orientation === "horizontal" || m.aspectRatio === "16:9";
          if (platform === "instagram" && (igType === "REELS" || igType === "STORIES") && isHorizontal) {
            badAspect++;
            badAspectMsg = `Instagram Reels & Stories require a 9:16 vertical video (got ${m.aspectRatio}).`;
          } else if (platform === "facebook" && (fbType === "REELS" || fbType === "STORIES") && isHorizontal) {
            badAspect++;
            badAspectMsg = `Facebook Reels & Stories require a 9:16 vertical video (got ${m.aspectRatio}).`;
          } else if (platform === "tiktok" && isHorizontal) {
            badAspect++;
            badAspectMsg = `TikTok feed requires a 9:16 vertical video (got ${m.aspectRatio}).`;
          }
        }
      }
    }
    if (badAspect > 0) {
      issues.push({
        code: "aspect_ratio_mismatch",
        severity: "blocked",
        message: badAspectMsg || `${badAspect} video file(s) have an invalid aspect ratio for ${cap.displayName}.`,
        actionLabel: "Crop to 9:16",
      });
    }
    if (badBytes > 0) {
      issues.push({
        code: `${kind}_too_large`,
        severity: "blocked",
        message: `${badBytes} ${kind} file${badBytes === 1 ? " exceeds" : "s exceed"} ${cap.displayName}'s size limit (${Math.round(req.maxBytes / (1024 * 1024))} MB).`,
        actionLabel: "Re-encode media",
      });
    }
    if (badMime > 0) {
      issues.push({
        code: `${kind}_wrong_format`,
        severity: "blocked",
        message: `${badMime} ${kind} file${badMime === 1 ? "" : "s"} use${badMime === 1 ? "s" : ""} an unsupported format. Allowed: ${req.formats.join(", ")}.`,
        actionLabel: "Convert media",
      });
    }
    if (badDuration > 0) {
      const fbType = options?.facebook_media_type;
      let durText = "";
      if (platform === "facebook" && fbType === "REELS") {
        durText = "at most 90s for Facebook Reels";
      } else if (platform === "facebook" && fbType === "STORIES") {
        durText = "at most 60s for Facebook Stories";
      } else {
        const min = req.minDurationSec ?? 0;
        const max = req.maxDurationSec ?? Infinity;
        durText = min > 0 && Number.isFinite(max)
          ? `${min}s–${max}s`
          : min > 0 ? `at least ${min}s`
          : Number.isFinite(max) ? `at most ${max}s` : "";
      }
      issues.push({
        code: `${kind}_bad_duration`,
        severity: "blocked",
        message: `${cap.displayName} requires video duration of ${durText}.`,
        actionLabel: platform === "facebook" && (fbType === "REELS" || fbType === "STORIES") ? "Deselect Facebook" : "Re-edit video",
      });
    }
    // Handle video metadata states: loading / error / unknown
    const metas = media.filter((m) => m.kind === kind);
    const loadingCount = metas.filter((m) => resolveMetadataStatus(m) === "loading").length;
    const errorCount = metas.filter((m) => resolveMetadataStatus(m) === "error").length;
    const unknownCount = metas.filter((m) => resolveMetadataStatus(m) === "unknown").length;
    if (loadingCount > 0) {
      if (hasDurationRequirement) {
        issues.push({
          code: `${kind}_metadata_loading`,
          severity: "blocked",
          message: `${loadingCount} video${loadingCount === 1 ? "'s" : "s'"} metadata is still loading. Duration cannot be validated yet.`,
          actionLabel: "Wait for metadata",
        });
      } else {
        issues.push({
          code: `${kind}_metadata_loading`,
          severity: "warning",
          message: `${loadingCount} video${loadingCount === 1 ? "'s" : "s'"} metadata is still loading. Duration will be validated once ready.`,
        });
      }
    }
    if (errorCount > 0) {
      // Metadata probe failed: block if duration is required
      if (hasDurationRequirement) {
        issues.push({
          code: `${kind}_metadata_error`,
          severity: "blocked",
          message: `${errorCount} video${errorCount === 1 ? "" : "s"} failed to load metadata. Duration is unknown.`,
          actionLabel: "Replace video",
        });
      } else {
        issues.push({
          code: `${kind}_metadata_error`,
          severity: "warning",
          message: `${errorCount} video${errorCount === 1 ? "" : "s"} metadata failed to load.`,
          actionLabel: "Replace video",
        });
      }
    } else if (unknownCount > 0) {
      if (hasDurationRequirement) {
        issues.push({
          code: `${kind}_metadata_unknown`,
          severity: "blocked",
          message: `${unknownCount} video${unknownCount === 1 ? "" : "s"} has unknown duration. Add or re-upload the video.`,
          actionLabel: "Replace video",
        });
      }
    }
  }

  return issues;
}

function checkCaption(
  platform: PlatformId,
  caption: string
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const cap = getCapability(platform);
  const trimmed = caption.trim();
  const len = charCount(trimmed);

  // BUG 2 fix: missing captions are a blocking issue per platform.
  if (len === 0) {
    issues.push({
      code: "missing_caption",
      severity: "blocked",
      message: `${cap.displayName} requires a caption.`,
      actionLabel: "Write caption",
    });
    return issues;
  }

  if (len > cap.maxCaptionLength) {
    issues.push({
      code: "caption_too_long",
      severity: "blocked",
      message: `Caption is ${len} characters; ${cap.displayName} allows up to ${cap.maxCaptionLength}.`,
      actionLabel: "Trim caption",
    });
  } else if (len > cap.maxCaptionLength * 0.9) {
    issues.push({
      code: "caption_near_limit",
      severity: "warning",
      message: `Caption is ${len}/${cap.maxCaptionLength} characters.`,
      actionLabel: "Trim caption",
    });
  }
  return issues;
}

function checkRequiredTargets(
  platform: PlatformId,
  options: PlatformAdvancedOptions | undefined
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const cap = getCapability(platform);
  for (const target of cap.requiredTargets) {
    const value = options?.[target.optionKey];
    if (!value || (typeof value === "string" && value.trim().length === 0)) {
      issues.push({
        code: `missing_target_${target.optionKey}`,
        severity: "blocked",
        message: `${target.label} is required for ${cap.displayName}.`,
        actionLabel: `Set ${target.label.toLowerCase()}`,
      });
    }
  }
  return issues;
}

function checkHardCap(
  platform: PlatformId,
  recent24h: number | undefined
): ReadinessIssue[] {
  if (recent24h == null) return [];
  const cap = getCapability(platform);
  if (recent24h >= cap.hardCapPer24h) {
    return [{
      code: "hard_cap_reached",
      severity: "blocked",
      message: `${cap.displayName} allows ${cap.hardCapPer24h} posts per 24h. You've reached ${recent24h}.`,
      actionLabel: "Try later",
    }];
  }
  if (recent24h >= cap.hardCapPer24h * 0.8) {
    return [{
      code: "hard_cap_near",
      severity: "warning",
      message: `${recent24h}/${cap.hardCapPer24h} posts used in the last 24h on ${cap.displayName}.`,
      actionLabel: "Spread posts",
    }];
  }
  return [];
}

export function checkRequirements(
  platforms: PlatformId[],
  input: RequirementsInput
): ReadinessReport {
  const perPlatform: PlatformReadiness[] = [];
  let blockedCount = 0;
  let warningCount = 0;
  let readyCount = 0;

  for (const platform of platforms) {
    const issues: ReadinessIssue[] = [];
    const caption = input.captionByPlatform[platform] ?? "";
    const options = input.advancedByPlatform?.[platform];

    issues.push(...checkMediaForPlatform(platform, input.media, options, input));
    issues.push(...checkCaption(platform, caption));
    issues.push(...checkRequiredTargets(platform, options));
    issues.push(...checkHardCap(platform, input.recent24hCounts?.[platform]));

    const hasBlock = issues.some((i) => i.severity === "blocked");
    const hasWarn = issues.some((i) => i.severity === "warning");
    const severity: ReadinessSeverity = hasBlock ? "blocked" : hasWarn ? "warning" : "ready";

    if (hasBlock) blockedCount++;
    else if (hasWarn) warningCount++;
    else readyCount++;

    perPlatform.push({
      platform,
      severity,
      summary: hasBlock
        ? `${blockedReason(issues)}`
        : hasWarn
          ? `${warningReason(issues)}`
          : `Ready to publish to ${CAPABILITY_MATRIX[platform].displayName}.`,
      issues,
      fixable: issues.length > 0 && issues.every((i) => !!i.actionLabel),
    });
  }

  const overall: ReadinessSeverity =
    blockedCount > 0 ? "blocked" : warningCount > 0 ? "warning" : "ready";

  return { perPlatform, overall, blockedCount, warningCount, readyCount };
}

function resolveMetadataStatus(m: MediaMeta): VideoMetadataStatus {
  if (m.metadataStatus) return m.metadataStatus;
  if (m.metadataError) return "error";
  if (m.metadataLoaded === false) return "loading";
  if (m.metadataLoaded === true) {
    // If we claim ready but have no duration and no error, treat as error/unknown
    if (m.durationSec == null) return "error";
    return "ready";
  }
  // metadataLoaded undefined
  if (m.durationSec != null) return "ready";
  // No metadata info at all: unknown (legacy restored without reprobe)
  return "unknown";
}

function blockedReason(issues: ReadinessIssue[]): string {
  return issues.find((i) => i.severity === "blocked")?.message ?? "Has issues.";
}
function warningReason(issues: ReadinessIssue[]): string {
  return issues.find((i) => i.severity === "warning")?.message ?? "Has warnings.";
}

// Convenience: which platforms can publish right now?
export function publishablePlatforms(
  report: ReadinessReport
): PlatformId[] {
  return report.perPlatform.filter((p) => p.severity !== "blocked").map((p) => p.platform);
}