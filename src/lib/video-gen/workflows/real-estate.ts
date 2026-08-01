/**
 * video-gen/workflows/real-estate.ts
 * Real Estate Video Studio workflow — Stage 2 (keyframe-to-video clips)
 * + optional Stage 1 (image generation, only for ai-generated mode).
 *
 * Structural mirror of workflows/whiteboard.ts:
 *   - Parallel clip generation via Promise.allSettled
 *   - 3 retries per clip with exponential backoff
 *   - patchClip pattern for streaming progress into Firestore
 *   - Job ends in `waiting_compose` so the same FFmpeg VPS worker
 *     picks it up — no changes needed there.
 *
 * Status machine:
 *   queued
 *     ├─ my-photos mode  → generating_clips
 *     └─ ai-gen mode     → generating_images (image-plan-runner) → generating_clips
 *   generating_clips  → waiting_compose → composing (FFmpeg) → complete / failed
 *
 * Narration is generated natively by the video model on each clip (see
 * real-estate/motion-prompt.ts → withRealEstateNarrationInstruction) —
 * no separate TTS step. The optional burned-in caption overlay is added
 * by the FFmpeg compose worker from per-job fields on the videoJobs doc.
 */

import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import type {
  VideoClipRecord,
  VideoGenerateInput,
  VideoGenerateOutput,
  VideoJobDoc,
  VideoProviderId,
} from "../types";
import {
  KEYFRAME_CLIP_DURATION_DEFAULT_SEC,
  clampKeyframeClipDuration,
} from "../types";
import type { PropertyShotPlan, PropertyTransition, CameraDirection } from "../real-estate/types";
import { runImagePlan } from "../real-estate/image-plan-runner";
import { withRealEstateNarrationInstruction } from "../real-estate/motion-prompt";
import { generateVideo } from "../router";
import { createLogger } from "../../log";

const logger = createLogger("video-gen:real-estate");

const MAX_CLIP_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface RunRealEstateArgs {
  jobRef: FirebaseFirestore.DocumentReference;
  job: VideoJobDoc & { request?: unknown };
}

export interface RunRealEstateResult {
  totalCostUsd: number;
  transitionsSucceeded: number;
  transitionsFailed: number;
}

/**
 * Phrase appended to every keyframe-to-video prompt — the "how to
 * interpolate" instruction. Camera direction is concatenated on top of
 * this in buildTransitionPrompt().
 */
const KEYFRAME_BASE_INSTRUCTION =
  "Smoothly blend from the first image into the second, keep the camera stable, " +
  "seamless continuous motion, no cuts, no flash frames, photorealistic architectural walkthrough. " +
  "Preserve the exact same property — same walls, same materials, same palette.";

const CAMERA_DIRECTION_PROMPT: Record<CameraDirection, string> = {
  forward: "the camera walks steadily forward into the next room",
  backward: "the camera steps back to reveal more of the previous space",
  "turn-left": "the camera turns smoothly to the left as it moves",
  "turn-right": "the camera turns smoothly to the right as it moves",
  "tilt-up": "the camera tilts upward to reveal the next space from above",
  "tilt-down": "the camera tilts downward as it moves into the next space",
};

export function buildTransitionPrompt(direction: CameraDirection): string {
  return `${CAMERA_DIRECTION_PROMPT[direction]}. ${KEYFRAME_BASE_INSTRUCTION}`;
}

/**
 * Build the final per-transition prompt. If a voiceoverLine is attached
 * to the transition, run it through the narration helper so the video
 * model narrates the line aloud in the job's selected language. The
 * caller also sets `generateAudio: true` on the input — the helper only
 * adds the prompt instruction; the audio flag is what actually enables
 * output audio on providers that support it.
 */
function buildTransitionPromptWithNarration(
  transition: PropertyTransition,
  language: PropertyShotPlan["language"]
): string {
  const visual = buildTransitionPrompt(transition.cameraDirection);
  if (!transition.voiceoverLine) return visual;
  return withRealEstateNarrationInstruction(visual, transition.voiceoverLine, language);
}

/**
 * Run the full Real Estate workflow for a queued job. Throws on fatal
 * (non-retryable) errors so the video-render-worker can mark the job failed.
 */
export async function runRealEstateWorkflow({
  jobRef,
  job,
}: RunRealEstateArgs): Promise<RunRealEstateResult> {
  const plan = job.shotPlan as PropertyShotPlan | undefined;
  if (!plan || !Array.isArray(plan.shots) || plan.shots.length < 2) {
    throw new Error("Real Estate job is missing a usable shotPlan");
  }
  const provider = (job.provider === "auto" ? "seedance-2-fast" : job.provider) as VideoProviderId;
  const aspectRatio = job.aspectRatio ?? "16:9";

  // ─── Stage 1 (ai-generated mode only): sequential reference-chained images ─
  if (plan.mode === "ai-generated") {
    const needsImageStage = plan.shots.some((s) => s.status !== "complete" || !s.imageUrl);
    if (needsImageStage) {
      logger.info("Real Estate Stage 1: generating images", {
        jobId: jobRef.id,
        shotCount: plan.shots.length,
      });
      const stage1 = await runImagePlan({
        jobRef,
        workspaceId: job.workspaceId,
        uid: job.uid,
        plan,
      });
      if (stage1.shotsFailed > 0) {
        // image-plan-runner already wrote "failed" status.
        return {
          totalCostUsd: stage1.totalCostUsd,
          transitionsSucceeded: 0,
          transitionsFailed: plan.transitions.length,
        };
      }
    }
    // Re-read plan with populated imageUrls.
    const refreshed = await jobRef.get();
    const refreshedPlan = refreshed.data()?.shotPlan as PropertyShotPlan | undefined;
    if (!refreshedPlan) throw new Error("Real Estate job lost its shot plan after Stage 1");
    return await runStage2({
      jobRef,
      job,
      plan: refreshedPlan,
      provider,
      aspectRatio,
    });
  }

  // ─── my-photos mode: images already exist, go straight to Stage 2 ─────────
  return await runStage2({ jobRef, job, plan, provider, aspectRatio });
}

interface RunStage2Args {
  jobRef: FirebaseFirestore.DocumentReference;
  job: VideoJobDoc;
  plan: PropertyShotPlan;
  provider: VideoProviderId;
  aspectRatio: NonNullable<VideoJobDoc["aspectRatio"]>;
}

async function runStage2({
  jobRef,
  job,
  plan,
  provider,
  aspectRatio,
}: RunStage2Args): Promise<RunRealEstateResult> {
  await jobRef.update({
    status: "generating_clips",
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Seed clips[] with the index/provider skeleton so the wizard has something to poll.
  const initialClips: VideoClipRecord[] = plan.transitions.map((t) => ({
    index: t.index,
    providerJobId: "",
    provider,
    status: "pending",
  }));
  await jobRef.update({ clips: initialClips, updatedAt: FieldValue.serverTimestamp() });

  await Promise.allSettled(
    plan.transitions.map((transition) =>
      generateOneTransitionClip({
        jobRef,
        job,
        plan,
        transition,
        provider,
        aspectRatio,
      })
    )
  );

  const clipsSnapshot = await jobRef.get();
  const finalClips: VideoClipRecord[] = clipsSnapshot.data()?.clips ?? initialClips;
  const succeeded = finalClips.filter((c) => c.status === "complete").length;
  const failed = finalClips.filter((c) => c.status === "failed").length;
  const totalCost = finalClips.reduce((sum, c) => sum + (c.costUsd ?? 0), 0);

  logger.info("Real Estate clip phase complete", {
    jobId: jobRef.id,
    succeeded,
    failed,
    totalCost,
  });

  if (failed > 0) {
    await jobRef.update({
      status: "failed",
      error: `${failed}/${finalClips.length} transitions failed after ${MAX_CLIP_RETRIES} retries each`,
      totalCostUsd: totalCost,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return {
      totalCostUsd: totalCost,
      transitionsSucceeded: succeeded,
      transitionsFailed: failed,
    };
  }

  await jobRef.update({
    status: "waiting_compose",
    totalCostUsd: totalCost,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    totalCostUsd: totalCost,
    transitionsSucceeded: succeeded,
    transitionsFailed: 0,
  };
}

export interface GenerateOneTransitionArgs {
  jobRef: FirebaseFirestore.DocumentReference;
  job: VideoJobDoc;
  plan: PropertyShotPlan;
  transition: PropertyTransition;
  provider: VideoProviderId;
  aspectRatio: NonNullable<VideoJobDoc["aspectRatio"]>;
  /** Override per-clip duration (used by the regenerate endpoint). */
  clipDurationSec?: number;
}

export async function generateOneTransitionClip({
  jobRef,
  job,
  plan,
  transition,
  provider,
  aspectRatio,
  clipDurationSec,
}: GenerateOneTransitionArgs): Promise<VideoGenerateOutput> {
  const fromShot = plan.shots[transition.fromShotIndex];
  const toShot = plan.shots[transition.toShotIndex];
  if (!fromShot?.imageUrl || !toShot?.imageUrl) {
    throw new Error(
      `Transition ${transition.index}: missing source or target image (from ${transition.fromShotIndex} → ${transition.toShotIndex})`
    );
  }

  const duration = clampKeyframeClipDuration(clipDurationSec ?? KEYFRAME_CLIP_DURATION_DEFAULT_SEC);
  const prompt = buildTransitionPromptWithNarration(transition, plan.language);
  const hasNarration = !!transition.voiceoverLine;

  const input: VideoGenerateInput = {
    workspaceId: job.workspaceId,
    provider,
    mode: "keyframe-to-video",
    prompt,
    sourceImageUrl: fromShot.imageUrl,
    endImageUrl: toShot.imageUrl,
    durationSec: duration,
    aspectRatios: [aspectRatio],
    generateAudio: hasNarration,
    context: {
      workflow: "real-estate",
      styleId: plan.styleId,
      jobGroupId: jobRef.id,
    },
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_CLIP_RETRIES; attempt++) {
    try {
      const output = await generateVideo(input);
      const update: Partial<VideoClipRecord> = {
        index: transition.index,
        providerJobId: "",
        provider,
        status: "complete",
        assetUrl: output.assetUrl,
        assetId: output.assetId,
        costUsd: output.costUsd,
      };
      await patchTransition(jobRef, transition.index, { status: "complete", assetUrl: output.assetUrl, assetId: output.assetId, costUsd: output.costUsd });
      await patchClip(jobRef, transition.index, update);
      logger.info("Real Estate transition clip succeeded", {
        jobId: jobRef.id,
        index: transition.index,
        attempt,
        costUsd: output.costUsd,
      });
      return output;
    } catch (err) {
      lastError = err;
      logger.warn("Real Estate transition clip attempt failed", {
        jobId: jobRef.id,
        index: transition.index,
        attempt,
        error: err instanceof Error ? err.message : String(err),
      });
      if (attempt < MAX_CLIP_RETRIES) {
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 4_000);
      }
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  await patchTransition(jobRef, transition.index, { status: "failed", errorMessage });
  await patchClip(jobRef, transition.index, {
    index: transition.index,
    provider,
    status: "failed",
    errorMessage,
  });
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function patchClip(
  jobRef: FirebaseFirestore.DocumentReference,
  index: number,
  patch: Partial<VideoClipRecord>
): Promise<void> {
  const snap = await jobRef.get();
  const clips: VideoClipRecord[] = snap.data()?.clips ?? [];
  const next = clips.map((c) => (c.index === index ? { ...c, ...patch } : c));
  await jobRef.update({ clips: next, updatedAt: FieldValue.serverTimestamp() });
}

async function patchTransition(
  jobRef: FirebaseFirestore.DocumentReference,
  index: number,
  patch: Partial<PropertyTransition>
): Promise<void> {
  const snap = await jobRef.get();
  const plan = snap.data()?.shotPlan as PropertyShotPlan | undefined;
  if (!plan) return;
  const nextTransitions = plan.transitions.map((t) =>
    t.index === index ? { ...t, ...patch } : t
  );
  await jobRef.update({
    shotPlan: { ...plan, transitions: nextTransitions },
    updatedAt: FieldValue.serverTimestamp(),
  });
}
