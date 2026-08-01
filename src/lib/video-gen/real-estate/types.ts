/**
 * video-gen/real-estate/types.ts
 * Shared shapes for the Real Estate Video Studio workflow.
 * Server-only — the wizard receives serialized JSON, never imports these directly.
 *
 * Two input modes converge on the same Stage 2 (keyframe-to-video):
 *   - "ai-generated": shot plan + N reference-chained images come from the LLM + Nano Banana.
 *   - "my-photos":    user uploads 6–12 real listing photos; they ARE the shot sequence.
 */

export type CameraDirection =
  | "forward"
  | "backward"
  | "turn-left"
  | "turn-right"
  | "tilt-up"
  | "tilt-down";

export interface PropertyShot {
  index: number;
  /** User-facing room label ("Front Exterior", "Kitchen Hero", …). */
  roomLabel: string;
  /** Full Nano Banana prompt for this shot — continuity language baked in by shot-plan.ts. */
  imagePrompt: string;
  /**
   * 0-based indexes into `shots` of the prior images this one must match.
   * Empty for shot 0; usually [index-1]; sometimes [index-1, index-2]
   * for the multi-anchor shots in the tutorial prompt document.
   */
  referenceShotIndexes: number[];
  imageUrl?: string;
  assetId?: string;
  status: "pending" | "generating" | "complete" | "failed";
  errorMessage?: string;
}

export interface PropertyTransition {
  /** 0-based; N-1 transitions for N shots. */
  index: number;
  fromShotIndex: number;
  toShotIndex: number;
  /**
   * Camera direction for the clip bridging fromShotIndex → toShotIndex.
   * Fixed enum (not free text) so the wizard can override per-clip
   * without the user writing a prompt themselves.
   */
  cameraDirection: CameraDirection;
  status: "pending" | "generating" | "complete" | "failed";
  assetUrl?: string;
  assetId?: string;
  costUsd?: number;
  errorMessage?: string;
}

export interface PropertyShotPlan {
  mode: "ai-generated" | "my-photos";
  /** PROPERTY_STYLES id; only meaningful for ai-generated mode. */
  styleId: string;
  shots: PropertyShot[];
  transitions: PropertyTransition[];
  /** Voiceover plan; absent when voiceover is disabled. */
  voiceover?: {
    enabled: boolean;
    language: "fr" | "en" | "ar";
    /** Optional ElevenLabs voice id; falls back to language default in tts/elevenlabs. */
    voiceId?: string;
    script?: string;
    audioUrl?: string;
    durationSec?: number;
  };
}
