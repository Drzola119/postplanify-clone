/**
 * video-gen/types.ts
 * Mirror of src/lib/image-gen/types.ts — extended for async video generation.
 * Do NOT import from here on the client — server-only.
 */

import type { Timestamp } from "firebase-admin/firestore";

// ─── Provider IDs ────────────────────────────────────────────────────────────

export type VideoProviderId =
  | "seedance-2-fast"
  | "seedance-2"
  | "veo-3.1-lite"
  | "veo-3.1"
  | "gemini-omni-flash"
  | "higgsfield";

export type VideoProviderIdOrAuto = VideoProviderId | "auto";

// ─── Aspect ratios ───────────────────────────────────────────────────────────

export type VideoAspectRatio = "9:16" | "1:1" | "16:9" | "4:3" | "3:4" | "21:9";

// ─── Workflow types ───────────────────────────────────────────────────────────

export type VideoWorkflow = "real-estate" | "whiteboard" | "cartoon" | "viral";

export type VideoMode = "text-to-video" | "image-to-video" | "reference-to-video";

// ─── Generation input ────────────────────────────────────────────────────────

export interface VideoGenerateInput {
  workspaceId: string;
  provider: VideoProviderIdOrAuto;
  mode: VideoMode;
  /** Final, server-built prompt — never trust client prompt directly */
  prompt: string;
  sourceImageUrl?: string;
  durationSec: number;
  aspectRatios: VideoAspectRatio[];
  context: {
    workflow: VideoWorkflow;
    styleId: string;
    /** Groups N clips belonging to the same render job */
    jobGroupId: string;
  };
}

// ─── Generation output (per clip) ────────────────────────────────────────────

export interface VideoGenerateOutput {
  provider: VideoProviderId;
  model: string;
  assetId: string;
  assetUrl: string;
  mime: "video/mp4";
  durationSec: number;
  width: number;
  height: number;
  costUsd: number;
  /** Wall-clock ms from submit to result */
  durationMs: number;
  fellBackFrom?: VideoProviderId;
}

// ─── Provider interface ───────────────────────────────────────────────────────

export interface VideoGenProvider {
  id: VideoProviderId;
  displayName: string;
  /** Submit a generation job; returns a provider-specific job handle */
  submit(input: VideoGenerateInput): Promise<string>;
  /** Poll job status — returns "pending" | "complete" | "failed" */
  pollStatus(providerJobId: string): Promise<"pending" | "complete" | "failed">;
  /** Fetch the final video URL once pollStatus returns "complete" */
  fetchResult(providerJobId: string): Promise<{
    videoUrl: string;
    durationSec: number;
    width: number;
    height: number;
    model: string;
  }>;
  estimateCostUsd(durationSec: number, aspectRatio: VideoAspectRatio): number;
}

// ─── Firestore VideoJob doc ───────────────────────────────────────────────────

export type VideoJobStatus =
  | "queued"
  | "scripting"
  | "generating_clips"
  | "waiting_compose"
  | "composing"
  | "complete"
  | "failed";

export interface VideoClipRecord {
  index: number;
  providerJobId: string;
  provider: VideoProviderId;
  status: "pending" | "complete" | "failed";
  assetUrl?: string;
  assetId?: string;
  costUsd?: number;
  errorMessage?: string;
}

export interface VideoFinalAsset {
  aspectRatio: VideoAspectRatio;
  assetId: string;
  assetUrl: string;
}

export interface VideoJobDoc {
  workspaceId: string;
  uid: string;
  workflow: VideoWorkflow;
  status: VideoJobStatus;
  provider: VideoProviderIdOrAuto;
  styleId: string;
  clips: VideoClipRecord[];
  finalAssets: VideoFinalAsset[];
  totalCostUsd: number;
  error?: string;
  /** Whiteboard workflow only — populated at job creation with the script returned by Groq. */
  script?: import("./whiteboard/types").WhiteboardScript;
  /** Whiteboard workflow only — locks the rendered aspect ratio across all clips. */
  aspectRatio?: VideoAspectRatio;
  /** Whiteboard workflow only — total target duration (30 or 60s). */
  durationSec?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Pricing table (USD per second of output video) ──────────────────────────
// Verify against live provider pricing at implementation time — these are estimates.

export const VIDEO_PROVIDER_PRICING: Record<
  VideoProviderId,
  { costPerSecUsd: number; flatMinCostUsd: number; displayLabel: string }
> = {
  "seedance-2-fast": {
    costPerSecUsd: 0.005,
    flatMinCostUsd: 0.04,
    displayLabel: "Seedance 2 Fast",
  },
  "seedance-2": {
    costPerSecUsd: 0.008,
    flatMinCostUsd: 0.06,
    displayLabel: "Seedance 2 Standard",
  },
  "veo-3.1-lite": {
    costPerSecUsd: 0.01,
    flatMinCostUsd: 0.08,
    displayLabel: "Veo 3.1 Lite",
  },
  "veo-3.1": {
    costPerSecUsd: 0.025,
    flatMinCostUsd: 0.2,
    displayLabel: "Veo 3.1",
  },
  "gemini-omni-flash": {
    costPerSecUsd: 0.004,
    flatMinCostUsd: 0.03,
    displayLabel: "Gemini Omni Flash",
  },
  "higgsfield": {
    costPerSecUsd: 0.05,
    flatMinCostUsd: 0.4,
    displayLabel: "Higgsfield DoP Turbo",
  },
};

// ─── Provider key env-var mapping (mirrors resolution.ts PLATFORM_KEY_ENV) ────

export const VIDEO_PROVIDER_KEY_ENV: Record<VideoProviderId, string> = {
  "seedance-2-fast": "FAL_API_KEY",
  "seedance-2": "FAL_API_KEY",
  "veo-3.1-lite": "GEMINI_API_KEY",
  "veo-3.1": "GEMINI_API_KEY",
  "gemini-omni-flash": "GEMINI_API_KEY",
  "higgsfield": "HIGGSFIELD_API_KEY",
};
