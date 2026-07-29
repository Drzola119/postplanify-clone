/**
 * video-render-worker.ts
 * Background worker that processes videoJobs from Firestore.
 */
import "server-only";
import { adminDb } from "../firebase/admin";
import { generateVideo } from "../video-gen/router";
import { persistGeneratedVideo } from "../video-gen/asset-saver";
import { buildCartoonPrompt } from "../video-gen/workflows/cartoon";
import { createLogger } from "../log";
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
  const db = adminDb;
  if (!db) {
    logger.warn("adminDb not initialised — skipping video worker tick");
    return;
  }

  let snapshot;
  try {
    snapshot = await db
      .collectionGroup("videoJobs")
      .where("status", "==", "queued")
      .orderBy("createdAt", "asc")
      .limit(5)
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

  await jobRef.update({
    status: "generating_clips",
    updatedAt: FieldValue.serverTimestamp(),
  });

  try {
    const output = await dispatchWorkflow(job.workflow, job.request, job, jobId);

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
          aspectRatio: "16:9",
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
  if (workerTimer) return;

  logger.info("Starting video render worker", {
    intervalMs: WORKER_INTERVAL_MS,
  });

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
