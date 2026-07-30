/**
 * video-gen/workflows/whiteboard.ts
 * Server-side entry point for the Whiteboard Explainer workflow.
 *
 * Called from src/lib/queue/video-render-worker.ts when a queued videoJob
 * has `workflow: "whiteboard"`. The whiteboard job document must already
 * carry a populated `script` field (the route sets it at creation time).
 *
 * Responsibilities:
 *   1. Iterate every script phase in parallel (Promise.allSettled).
 *   2. Submit each phase as a single-provider text-to-video call via
 *      `generateVideo()` (which handles fallback chain + polling).
 *   3. Retry each clip up to 3 times with exponential backoff (1s, 2s, 4s).
 *   4. Persist every clip URL to Firestore as it lands.
 *   5. Once every clip has succeeded, transition the job to
 *      `waiting_compose` — the separate FFmpeg VPS worker picks it up
 *      from there.
 *
 * The FFmpeg composer is NOT invoked here. Cross-VPS coordination happens
 * via Firestore status field + a polling worker on the FFmpeg machine
 * (see src/lib/queue/ffmpeg-compose-worker.ts).
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
import type { WhiteboardScript } from "../whiteboard/types";
import { buildMotionPrompt } from "../whiteboard/motion-prompt";
import { generateVideo } from "../router";
import { createLogger } from "../../log";

const logger = createLogger("video-gen:whiteboard");

const MAX_CLIP_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface RunWhiteboardArgs {
  /** Reference to `workspaces/{wsId}/videoJobs/{jobId}` — used to stream clip progress. */
  jobRef: FirebaseFirestore.DocumentReference;
  /** Snapshot of the job at dispatch time. */
  job: VideoJobDoc & { request?: unknown };
}

export interface RunWhiteboardResult {
  /** Concatenated final .mp4 asset URL once composition finishes — undefined here, set by FFmpeg worker. */
  finalAssetUrl?: string;
  /** Sum of per-clip cost in USD. */
  totalCostUsd: number;
  /** Number of clips that succeeded. */
  clipsSucceeded: number;
  /** Number of clips that ultimately failed after retries. */
  clipsFailed: number;
}

/**
 * Run the multi-clip generation phase of the whiteboard workflow.
 * Throws on fatal (non-retryable) errors so the caller can mark the job failed.
 */
export async function runWhiteboardWorkflow({
  jobRef,
  job,
}: RunWhiteboardArgs): Promise<RunWhiteboardResult> {
  const db = jobRef.firestore;
  const provider = job.provider as VideoProviderId;
  const aspectRatio = job.aspectRatio ?? "16:9";
  const script = job.script as WhiteboardScript | undefined;

  if (!script || !Array.isArray(script.phases) || script.phases.length === 0) {
    throw new Error("Whiteboard job is missing a generated script");
  }
  if (!provider) {
    throw new Error("Whiteboard job is missing a resolved provider");
  }

  await jobRef.update({
    status: "generating_clips",
    updatedAt: FieldValue.serverTimestamp(),
  });

  const initialClips: VideoClipRecord[] = script.phases.map((phase) => ({
    index: phase.index,
    providerJobId: "",
    provider,
    status: "pending",
  }));
  await jobRef.update({ clips: initialClips, updatedAt: FieldValue.serverTimestamp() });

  const settled = await Promise.allSettled(
    script.phases.map((phase) =>
      generateOneClip({
        jobRef,
        db,
        job,
        provider,
        aspectRatio,
        phase,
      })
    )
  );

  const clipsSnapshot = await jobRef.get();
  const finalClips: VideoClipRecord[] = clipsSnapshot.data()?.clips ?? initialClips;
  const succeeded = finalClips.filter((c) => c.status === "complete").length;
  const failed = finalClips.filter((c) => c.status === "failed").length;
  const totalCost = finalClips.reduce((sum, c) => sum + (c.costUsd ?? 0), 0);

  logger.info("Whiteboard clip phase complete", {
    jobId: jobRef.id,
    succeeded,
    failed,
    totalCost,
  });

  if (failed > 0) {
    await jobRef.update({
      status: "failed",
      error: `${failed}/${finalClips.length} clips failed after ${MAX_CLIP_RETRIES} retries each`,
      totalCostUsd: totalCost,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { totalCostUsd: totalCost, clipsSucceeded: succeeded, clipsFailed: failed };
  }

  await jobRef.update({
    status: "waiting_compose",
    totalCostUsd: totalCost,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { totalCostUsd: totalCost, clipsSucceeded: succeeded, clipsFailed: 0 };
}

interface GenerateOneClipArgs {
  jobRef: FirebaseFirestore.DocumentReference;
  db: FirebaseFirestore.Firestore;
  job: VideoJobDoc;
  provider: VideoProviderId;
  aspectRatio: NonNullable<VideoJobDoc["aspectRatio"]>;
  phase: WhiteboardScript["phases"][number];
}

async function generateOneClip({
  jobRef,
  phase,
  provider,
  aspectRatio,
  job,
}: GenerateOneClipArgs): Promise<VideoGenerateOutput> {
  const prompt = buildMotionPrompt(phase, provider);
  const input: VideoGenerateInput = {
    workspaceId: job.workspaceId,
    provider,
    mode: "text-to-video",
    prompt,
    durationSec: phase.durationSec,
    aspectRatios: [aspectRatio],
    context: {
      workflow: "whiteboard",
      styleId: job.styleId,
      jobGroupId: jobRef.id,
    },
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_CLIP_RETRIES; attempt++) {
    try {
      const output = await generateVideo(input);
      const update: Partial<VideoClipRecord> = {
        index: phase.index,
        providerJobId: "", // router doesn't expose provider job id here; left blank for now
        provider,
        status: "complete",
        assetUrl: output.assetUrl,
        assetId: output.assetId,
        costUsd: output.costUsd,
      };
      await patchClip(jobRef, phase.index, update);
      logger.info("Whiteboard clip succeeded", {
        jobId: jobRef.id,
        index: phase.index,
        attempt,
        costUsd: output.costUsd,
      });
      return output;
    } catch (err) {
      lastError = err;
      logger.warn("Whiteboard clip attempt failed", {
        jobId: jobRef.id,
        index: phase.index,
        attempt,
        error: err instanceof Error ? err.message : String(err),
      });
      if (attempt < MAX_CLIP_RETRIES) {
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 4_000);
      }
    }
  }

  await patchClip(jobRef, phase.index, {
    index: phase.index,
    provider,
    status: "failed",
    errorMessage: lastError instanceof Error ? lastError.message : String(lastError),
  });
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function patchClip(
  jobRef: FirebaseFirestore.DocumentReference,
  index: number,
  patch: Partial<VideoClipRecord>
): Promise<void> {
  // Firestore doesn't support array element update by predicate directly —
  // read-modify-write on the `clips` array. Acceptable because this worker
  // owns the doc and writes are serial within a single job.
  const snap = await jobRef.get();
  const clips: VideoClipRecord[] = snap.data()?.clips ?? [];
  const next = clips.map((c) => (c.index === index ? { ...c, ...patch } : c));
  await jobRef.update({ clips: next, updatedAt: FieldValue.serverTimestamp() });
}
