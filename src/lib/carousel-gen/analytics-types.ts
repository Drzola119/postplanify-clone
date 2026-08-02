/**
 * carousel-gen/analytics-types.ts
 *
 * Shared types for the Phase-2 management-hub features that hang off the
 * existing carousel doc:
 *   - Per-carousel performance metrics (Feature A)
 *   - Revision history subcollection (Feature B)
 *   - A/B variant tracking (Feature C)
 *
 * These types are imported by the list endpoint, the new API routes,
 * the wizard (for version triggers), and the hub UI. They live in
 * `carousel-gen/` because the deck metadata shape (slide.text,
 * slide.backgroundImageUrl) is the same one the wizard already writes.
 */

import type { PlatformKey } from "@/types/analytics";

/**
 * Per-carousel live-metrics snapshot, populated by the sync route and
 * written back onto `workspaces/{wsId}/carousels/{carouselId}`.
 * `lastSyncedAt` is the driver of the "stale > 6h" sync-button rule.
 */
export interface CarouselPerformance {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  /** Computed (likes+comments+shares+saves) / impressions * 100, rounded to 2dp. */
  engagementRate: number;
  /** UNIX ms when the sync ran. */
  lastSyncedAt: number;
  /** Which platform the metrics came from (single source of truth per carousel). */
  platform: PlatformKey | null;
}

/**
 * What /api/carousels/sync-performance returns when it cannot find
 * a linked post yet — the wizard will surface a friendlier message
 * than a hard 404.
 */
export type CarouselSyncResult =
  | { ok: true; performance: CarouselPerformance; postId: string | null }
  | { ok: false; reason: "no-post" | "fetch-failed" | "unconfigured"; message: string };

/** Why a metric sync came back empty / was rejected. */
export type CarouselSyncFailureReason = "no-post" | "fetch-failed" | "unconfigured";

/* ============================================================
 * Feature B — Revision history (subcollection)
 * ============================================================ */

/**
 * Stored at `workspaces/{wsId}/carousels/{carouselId}/versions/{versionId}`.
 * One document per material change to the script.
 */
export type CarouselVersionEditType =
  | "initial-generate"
  | "ai-regenerate"
  | "translate"
  | "manual-edit";

export interface CarouselVersionSlide {
  /** Index in the version's `slides[]` array (same as the slide's index in the deck). */
  slideIndex: number;
  /** Verbatim text rendered on this slide at the time of the version. */
  text: string;
  /** Background image URL, if F6 was used on this slide. */
  backgroundImageUrl?: string;
}

export interface CarouselVersion {
  versionId: string;
  /** UNIX ms. */
  createdAt: number;
  editType: CarouselVersionEditType;
  /** Always matches the version's `slides.length`. */
  slideCount: number;
  slides: CarouselVersionSlide[];
  /** When `editType === "ai-regenerate"`, which slide the regen targeted. */
  editedBySlideIndex?: number;
  /** Optional human label (e.g. "Restored from Mar 4, 14:21"). */
  label?: string;
}

/* ============================================================
 * Feature C — A/B variant tracking (top-level carousel fields)
 * ============================================================ */

/** "A" is always the original; "B" is the duplicate created from "Create B Version". */
export type CarouselVariantLabel = "A" | "B";

/**
 * The shape the list endpoint already returns. We extend it with the
 * A/B + performance + post-link fields so the hub card can render
 * everything in one pass without a second fetch.
 */
export interface CarouselRecord {
  id: string;
  jobId: string;
  title: string;
  status: "scheduled" | "draft" | "published";
  mediaUrls: string[];
  styleId: string | null;
  slideCount: number;
  costUsd: number;
  scheduledAt: number | null;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
  /** F4 back-link: the post doc that scheduled this carousel, if any. */
  postId?: string | null;
  /** A: snapshot of live metrics (Feature A). */
  performance?: CarouselPerformance | null;
  /** A/B: shared id between A and B. Null = standalone deck. */
  variantGroupId?: string | null;
  /** A/B: this deck's role within its group. Null = no group. */
  variantLabel?: CarouselVariantLabel | null;
  /** A/B: true once a sync has determined this variant is winning (>100 imp each). */
  variantWinner?: boolean | null;
}

/** 6 hours in ms — used by the hub to decide whether to show the "Sync Stats" button. */
export const PERFORMANCE_STALE_MS = 6 * 60 * 60 * 1000;

/** Minimum impressions on BOTH variants before we declare a winner. */
export const AB_MIN_IMPRESSIONS = 100;
