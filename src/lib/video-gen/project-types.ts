import type { VideoAspectRatio, VideoWorkflow, VideoJobStatus } from "./types";

export type VideoProjectLifecycle = "draft" | "active" | "archived";
export type VideoRenderSummary = "idle" | "queued" | "rendering" | "complete" | "failed";
export type VideoReviewSummary =
  | "none"
  | "in_review"
  | "changes_requested"
  | "partially_approved"
  | "approved";
export type VideoPublishingSummary = "not_published" | "scheduled" | "published";

export interface VideoVariantSummary {
  id: string;
  aspectRatio: VideoAspectRatio;
  assetId?: string;
  assetUrl?: string;
  status: "pending" | "rendering" | "complete" | "failed";
}

export interface VideoProjectSummary {
  id: string;
  title: string;
  description: string;
  workflow: VideoWorkflow;
  thumbnailUrl?: string;
  lifecycle: VideoProjectLifecycle;
  renderStatus: VideoRenderSummary;
  reviewStatus: VideoReviewSummary;
  publishingStatus: VideoPublishingSummary;
  ownerUid: string;
  brandKitId?: string | null;
  tags: string[];
  variants: VideoVariantSummary[];
  legacyJobId?: string;
  legacyStatus?: VideoJobStatus;
  createdAt: string | null;
  updatedAt: string | null;
  lastOpenedAt: string | null;
}

export interface VideoProjectDraft {
  workflow: VideoWorkflow;
  title: string;
  description?: string;
  inputs: Record<string, unknown>;
  scenes: Array<Record<string, unknown>>;
  aspectRatios: VideoAspectRatio[];
  brandKitId?: string | null;
  tags?: string[];
}
