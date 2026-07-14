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
  type MediaRequirement,
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

export interface MediaMeta {
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number;
}

export interface RequirementsInput {
  captionByPlatform: Record<PlatformId, string>;
  media: MediaMeta[];
  /** Per-platform advanced options (Feature 1). */
  advancedByPlatform?: Partial<Record<PlatformId, PlatformAdvancedOptions>>;
  /** Pre-computed media kind for the post (mixed → prefer video). */
  composerMediaKind: MediaKind;
  /** Count of posts already published in the rolling 24h window per platform. */
  recent24hCounts?: Partial<Record<PlatformId, number>>;
  /** Override the system date for testing. */
  now?: Date;
}

const charCount = (s: string) => Array.from(s).length;

function checkMediaForPlatform(
  platform: PlatformId,
  media: MediaMeta[]
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const cap = getCapability(platform);

  // 0 items
  if (media.length === 0) {
    issues.push({
      code: "missing_media",
      severity: "blocked",
      message: `${cap.displayName} requires at least one media file.`,
      actionLabel: "Add media",
    });
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
    for (const m of media) {
      if (m.kind !== kind) continue;
      if (m.sizeBytes > req.maxBytes) badBytes++;
      if (req.formats.length > 0 && !req.formats.includes(m.mimeType)) badMime++;
      if (kind === "video") {
        if (req.minDurationSec != null && (m.durationSec ?? 0) < req.minDurationSec) badDuration++;
        if (req.maxDurationSec != null && (m.durationSec ?? 0) > req.maxDurationSec) badDuration++;
      }
    }
    if (badBytes > 0) {
      issues.push({
        code: `${kind}_too_large`,
        severity: "blocked",
        message: `${badBytes} ${kind} file${badBytes === 1 ? " exceeds" : "s exceed"} ${cap.displayName}'s size limit.`,
        actionLabel: "Re-encode media",
      });
    }
    if (badMime > 0) {
      issues.push({
        code: `${kind}_wrong_format`,
        severity: "blocked",
        message: `${badBytes} ${kind} file${badMime === 1 ? "" : "s"} use${badMime === 1 ? "s" : ""} an unsupported format. Allowed: ${req.formats.join(", ")}.`,
        actionLabel: "Convert media",
      });
    }
    if (badDuration > 0) {
      const min = req.minDurationSec ?? 0;
      const max = req.maxDurationSec ?? Infinity;
      const durText = min > 0 && Number.isFinite(max)
        ? `${min}s–${max}s`
        : min > 0 ? `at least ${min}s`
        : Number.isFinite(max) ? `at most ${max}s` : "";
      issues.push({
        code: `${kind}_bad_duration`,
        severity: "blocked",
        message: `${cap.displayName} requires video duration of ${durText}.`,
        actionLabel: "Re-edit video",
      });
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
  const len = charCount(caption);
  if (len === 0) return issues; // "missing caption" handled at the composer level
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

    issues.push(...checkMediaForPlatform(platform, input.media));
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