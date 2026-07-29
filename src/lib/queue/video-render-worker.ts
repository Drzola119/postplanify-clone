/**
 * video-render-worker.ts
 * Background worker that processes videoJobs from Firestore.
 * Started from src/instrumentation.ts alongside the existing workers.
 *
 * Tick responsibilities (mirrors worker.ts pattern):
 *   1. Query videoJobs where status == "queued" for this workspace
 *   2. Pick up queued jobs, call generateVideo() for each clip
 *   3. Persist the result via persistGeneratedVideo()
 *   4. Update the videoJob doc to "complete" (or "failed" after MAX_RETRIES)
 *
 * M1 scope: Cartoon workflow only — single clip, no composition step needed.
 * Multi-clip composition (Real Estate/Whiteboard/Viral) comes in M2/M3.
 *
 * INSTRUMENTATION HOOK:
 * In src/instrumentation.ts, add after the existing worker starts:
 *
 *   const { startVideoRenderWorker } = await import("./lib/queue/video-render-worker");
 *   startVideoRenderWorker();
 */
import "server-only";
import { getAdminFirestore } from "../firebase/admin";
import { generateVideo } from "../video-gen/router";
import { persistGeneratedVideo } from "../video-gen/asset-saver";
import { buildCartoonPrompt } from "../video-gen/workflows/cartoon";
import { createLogger } from "../logging";
import type {
  VideoGenerateInput,
  VideoJobDoc,
  VideoWorkflow,
} from "../video-gen/types";
import type { CartoonRequest } from "../validation/video-gen";
import { FieldValue } from "firebase-admin/firestore";

const logger = createLogger("video-render-worker");

const WORKER_INTERVAL_MS = Number(process.env.VIDEO_WORKER_INTERVAL_MS ?? 15_000);
const MAX_RETRIES = 3;

let workerTimer: ReturnType<typeof setInterval> | null = null;

async function processPendingJobs(): Promise<void> {
  const db = getAdminFirestore();

  // Collect all workspaces with queued jobs (collectionGroup query)
  let snapshot;
  try {
    snapshot = await db
      .collectionGroup("videoJobs")
      .where("status", "==", "queued")
      .orderBy("createdAt", "asc")
      .limit(5) // process up to 5 jobs per tick
      .get();
  } catch (err) {
    logger.error("Failed to query videoJobs", { error: err });
    return;
  }

  if (snapshot.empty) return;

  logger.info("Video render worker: found queued jobs", {
    count: snapshot.size,
  });

  for (const jobSnap of snapshot.docs) {
    await processJob(jobSnap.ref, jobSnap.data() as VideoJobDoc & { request: unknown; retryCount?: number });
  }
}

async function processJob(
  jobRef: FirebaseFirestore.DocumentReference,
  job: VideoJobDoc & { request: unknown; retryCount?: number }
): Promise<void> {
  const jobId = jobRef.id;
  const retryCount = job.retryCount ?? 0;

  if (retryCount >= MAX_RETRIES) {
    logger.warn("Job exceeded max retries, marking failed", { jobId });
    await jobRef.update({
      status: "failed",
      error: "Max retries exceeded",
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  // Claim the job atomically
  await jobRef.update({
    status: "generating_clips",
    updatedAt: FieldValue.serverTimestamp(),
  });

  try {
    const output = await dispatchWorkflow(job.workflow, job.request, job, jobId);

    // Fetch video buffer from provider URL for CDN upload
    const videoRes = await fetch(output.assetUrl);
    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video from provider: ${videoRes.status}`);
    }
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const { assetId, assetUrl } = await persistGeneratedVideo({
      workspaceId: job.workspaceId,
      uid: job.uid,
      jobId,
      workflow: job.workflow,
      styleId: job.styleId,
      output,
      videoBuffer,
      tags: [job.workflow, job.styleId],
    });

    await jobRef.update({
      status: "complete",
      finalAssets: [
        {
          aspectRatio: "16:9", // default for M1 Cartoon single-clip
          assetId,
          assetUrl,
        },
      ],
      totalCostUsd: output.costUsd,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("Video job completed", {
      jobId,
      assetId,
      costUsd: output.costUsd,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error("Video job failed", { jobId, error: errorMsg, retryCount });

    // Reset to queued for retry, unless max retries exceeded
    await jobRef.update({
      status: retryCount + 1 >= MAX_RETRIES ? "failed" : "queued",
      retryCount: retryCount + 1,
      error: errorMsg,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

async function dispatchWorkflow(
  workflow: VideoWorkflow,
  request: unknown,
  job: VideoJobDoc,
  jobId: string
) {
  if (workflow === "cartoon") {
    const req = request as CartoonRequest;
    const { prompt, mode } = buildCartoonPrompt({
      topic: req.topic,
      subStyle: req.subStyle,
      durationSec: req.durationSec as 5 | 8 | 10 | 15,
      dialogueLine: req.dialogueLine,
      sourceImageUrl: req.sourceImageUrl,
    });

    const input: VideoGenerateInput = {
      workspaceId: job.workspaceId,
      provider: req.provider,
      mode,
      prompt,
      sourceImageUrl: req.sourceImageUrl,
      durationSec: req.durationSec,
      aspectRatios: req.aspectRatios as VideoGenerateInput["aspectRatios"],
      context: {
        workflow: "cartoon",
        styleId: req.styleId,
        jobGroupId: jobId,
      },
    };

    return generateVideo(input);
  }

  throw new Error(`Workflow "${workflow}" is not yet supported in M1`);
}

export function startVideoRenderWorker(): void {
  if (workerTimer) return; // already running

  logger.info("Starting video render worker", {
    intervalMs: WORKER_INTERVAL_MS,
  });

  // Run immediately on boot, then on interval
  processPendingJobs().catch((err) =>
    logger.error("Initial video worker tick failed", { error: err })
  );

  workerTimer = setInterval(() => {
    processPendingJobs().catch((err) =>
      logger.error("Video worker tick failed", { error: err })
    );
  }, WORKER_INTERVAL_MS);
}

export function stopVideoRenderWorker(): void {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
    logger.info("Video render worker stopped");
  }
}
