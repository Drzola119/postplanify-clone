/**
 * video-render-worker.ts
 * Background worker that processes videoJobs from Firestore.
 *
 * Workflow dispatch:
 *   cartoon   → single-clip generation, this worker uploads the result to Bunny.
 *   whiteboard → multi-clip generation; this worker renders N clips then
 *                transitions the job to `waiting_compose`. The FFmpeg VPS
 *                worker (src/lib/queue/ffmpeg-compose-worker.ts) picks it
 *                up from there, concatenates the clips, and writes
 *                `finalAssets` back.
 */
import "server-only";
import { adminDb } from "../firebase/admin";
import { generateVideo } from "../video-gen/router";
import { persistGeneratedVideo } from "../video-gen/asset-saver";
import { buildCartoonPrompt } from "../video-gen/workflows/cartoon";
import { runWhiteboardWorkflow } from "../video-gen/workflows/whiteboard";
import { runRealEstateWorkflow } from "../video-gen/workflows/real-estate";
import { createLogger } from "../log";
import type {
  VideoGenerateInput,
  VideoGenerateOutput,
  VideoJobDoc,
  VideoWorkflow,
} from "../video-gen/types";
import type { CartoonRequest, ViralRequest } from "../validation/video-gen";
import { FieldValue } from "firebase-admin/firestore";
import { syncVideoProjectFromJob } from "../video-gen/project-service";

const logger = createLogger("video-render-worker");

const MAX_RETRIES = 3;
let manualRunInProgress = false;

export async function runVideoRenderTick(workspaceId?: string): Promise<{ scanned: number }> {
  if (manualRunInProgress) return { scanned: 0 };
  manualRunInProgress = true;
  try {
    return await runVideoRenderTickInternal(workspaceId);
  } finally {
    manualRunInProgress = false;
  }
}

async function runVideoRenderTickInternal(workspaceId?: string): Promise<{ scanned: number }> {
  const db = adminDb;
  if (!db) {
    logger.warn("adminDb not initialised — skipping video worker tick");
    return { scanned: 0 };
  }

  let snapshot;
  try {
    const query = workspaceId
      ? db.collection("workspaces").doc(workspaceId).collection("videoJobs")
      : db.collectionGroup("videoJobs");
    snapshot = await query
      .where("status", "==", "queued")
      .orderBy("createdAt", "asc")
      .limit(5)
      .get();
  } catch (err) {
    logger.error("Failed to query videoJobs", { error: err });
    return { scanned: 0 };
  }

  if (snapshot.empty) return { scanned: 0 };

  logger.info("Video render worker: found queued jobs", {
    count: snapshot.size,
  });

  for (const jobSnap of snapshot.docs) {
    await processJob(jobSnap.ref, jobSnap.data() as VideoJobDoc & { request: unknown; retryCount?: number });
  }
  return { scanned: snapshot.size };
}

async function processJob(
  jobRef: FirebaseFirestore.DocumentReference,
  job: VideoJobDoc & { request: unknown; retryCount?: number }
): Promise<void> {
  const db = jobRef.firestore;
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

  try {
    if (job.workflow === "whiteboard") {
      // Whiteboard handles its own status transitions:
      //   queued → generating_clips → waiting_compose
      // The FFmpeg worker takes over from `waiting_compose`.
      await runWhiteboardWorkflow({ jobRef, job });
      await syncVideoProjectFromJob({ db, jobRef });
      logger.info("Whiteboard job handed off to FFmpeg composer", { jobId });
      return;
    }

    if (job.workflow === "real-estate") {
      // Real Estate handles its own status transitions:
      //   queued → (ai-gen only: generating_images →) generating_clips → waiting_compose
      // The FFmpeg worker takes over from `waiting_compose`. We don't have
      // access to the originating request headers from this polling context,
      // so we pass undefined — the worker falls back to env-only resolution
      // (production-safe). The ElevenLabs key is provisioned in env.
      await runRealEstateWorkflow({ jobRef, job });
      await syncVideoProjectFromJob({ db, jobRef });
      logger.info("Real Estate job handed off to FFmpeg composer", { jobId });
      return;
    }

    await jobRef.update({
      status: "generating_clips",
      updatedAt: FieldValue.serverTimestamp(),
    });
    await syncVideoProjectFromJob({ db, jobRef });

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
    await syncVideoProjectFromJob({ db, jobRef });

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
): Promise<VideoGenerateOutput> {
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

  if (workflow === "viral") {
    const req = request as ViralRequest;
    const prompt = [
      `Create a ${req.pacing === "fast-cut" ? "fast-cut" : "single-take"} short-form social video for ${req.platformTarget}.`,
      `Open immediately with this hook: "${req.hookLine}".`,
      req.captionStyle === "bold" ? "Use bold, high-contrast caption moments." : "Do not add on-screen captions.",
      req.voiceoverMode === "auto" ? "Include a clear, energetic voiceover." : "Use visual storytelling without voiceover.",
      "No watermarks or logos.",
    ].join(" ");
    return generateVideo({
      workspaceId: job.workspaceId,
      provider: req.provider,
      mode: "text-to-video",
      prompt,
      durationSec: req.durationSec,
      aspectRatios: req.aspectRatios as VideoGenerateInput["aspectRatios"],
      generateAudio: req.voiceoverMode === "auto",
      context: { workflow: "viral", styleId: req.styleId, jobGroupId: jobId },
    });
  }

  throw new Error(`Workflow "${workflow}" is not yet supported`);
}

export function startVideoRenderWorker(): void {
  logger.info("automatic video worker disabled; use the manual run action");
}

export function stopVideoRenderWorker(): void {
  // Kept for API compatibility with existing operational tooling.
}
