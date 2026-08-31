import "server-only";
import { adminDb } from "@/lib/db";
import { createLogger } from "@/lib/log";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";
import { selectFairBatch } from "@/lib/ai/fair-scheduler";
import { generateCaptionViaGateway } from "@/lib/ai/grok-gateway";
import {
  claimCaptionJob,
  completeCaptionJob,
  failCaptionJob,
  findReusableCaption,
  listEligibleCaptionJobs,
  resetStuckCaptionJobClaims,
} from "@/lib/db/caption-jobs";
import type { CaptionJobDoc, PostDoc } from "@/lib/db/schema";

const log = createLogger("caption-worker");

export interface CaptionTickResult {
  scanned: number;
  claimed: number;
  completed: number;
  failed: number;
  reaped: number;
  cached: number;
  skipped: number;
  error?: string;
}

let interval: NodeJS.Timeout | null = null;
let running = false;
let lastTickAt: Date | null = null;
let lastResult: CaptionTickResult | null = null;

const WORKER_ID = `caption-worker-${process.pid}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * Executes a single tick of the asynchronous caption generation worker.
 */
export async function runCaptionWorkerTick(): Promise<CaptionTickResult> {
  const result: CaptionTickResult = {
    scanned: 0,
    claimed: 0,
    completed: 0,
    failed: 0,
    reaped: 0,
    cached: 0,
    skipped: 0,
  };

  if (!adminDb) return result;
  lastTickAt = new Date();

  // 1. Reap stuck processing claims
  try {
    result.reaped = await resetStuckCaptionJobClaims(CAPTION_CONFIG.PROCESSING_TIMEOUT_MS);
  } catch (err) {
    log.error(err, { step: "reap-caption-jobs" });
  }

  // 2. Fetch candidate eligible jobs
  let eligibleJobs: CaptionJobDoc[] = [];
  try {
    eligibleJobs = await listEligibleCaptionJobs(50);
    result.scanned = eligibleJobs.length;
  } catch (err) {
    log.error(err, { step: "list-eligible-jobs" });
    result.error = (err as Error).message;
    lastResult = result;
    return result;
  }

  if (eligibleJobs.length === 0) {
    lastResult = result;
    return result;
  }

  // 3. Apply tenant fairness & round-robin bucket selection
  const batch = selectFairBatch(eligibleJobs, CAPTION_CONFIG.MAX_GLOBAL_CONCURRENCY);

  // 4. Process selected batch with bounded concurrency
  const CONCURRENCY = Math.min(CAPTION_CONFIG.MAX_GLOBAL_CONCURRENCY, 5);
  let cursor = 0;

  async function processWorker() {
    while (cursor < batch.length) {
      const idx = cursor++;
      const job = batch[idx];
      if (!job.id) continue;

      // Atomically claim the job
      const claimed = await claimCaptionJob(job.id, WORKER_ID);
      if (!claimed) continue;
      result.claimed++;

      try {
        // Fetch target post to verify status & prevent race condition overwrites
        const postRef = adminDb!.doc(`workspaces/${job.workspaceId}/posts/${job.postId}`);
        const postSnap = await postRef.get();

        if (!postSnap.exists) {
          // Post was deleted — mark job cancelled
          await completeCaptionJob({
            jobId: job.id,
            workspaceId: job.workspaceId,
            postId: job.postId,
            caption: "",
            provider: "xai",
            model: CAPTION_CONFIG.XAI_MODEL,
          });
          result.skipped++;
          continue;
        }

        const postData = postSnap.data() as PostDoc;
        if (postData.deletedAt) {
          result.skipped++;
          continue;
        }

        // Check manual override: if user wrote a manual caption, preserve it and skip AI call
        if (postData.caption && postData.caption.trim().length > 0 && postData.captionGenerationMode === "manual") {
          await completeCaptionJob({
            jobId: job.id,
            workspaceId: job.workspaceId,
            postId: job.postId,
            caption: postData.caption,
            captionsByPlatform: postData.captionsByPlatform,
            provider: "xai",
            model: CAPTION_CONFIG.XAI_MODEL,
          });
          result.skipped++;
          continue;
        }

        // Check cache / deduplication: reuse existing caption if identical fingerprint was already generated
        const cached = await findReusableCaption(job.fingerprint);
        if (cached && cached.caption) {
          await completeCaptionJob({
            jobId: job.id,
            workspaceId: job.workspaceId,
            postId: job.postId,
            caption: cached.caption,
            captionsByPlatform: cached.captionsByPlatform,
            provider: "xai",
            model: CAPTION_CONFIG.XAI_MODEL,
          });
          result.completed++;
          result.cached++;
          continue;
        }

        // Call Grok Gateway
        const genResult = await generateCaptionViaGateway({
          userId: job.userId,
          snapshot: job.inputSnapshot,
        });

        if (genResult.ok && genResult.caption) {
          await completeCaptionJob({
            jobId: job.id,
            workspaceId: job.workspaceId,
            postId: job.postId,
            caption: genResult.caption,
            captionsByPlatform: genResult.captionsByPlatform,
            provider: genResult.provider,
            model: genResult.model,
            usage: genResult.usage,
          });
          result.completed++;
        } else {
          // Failure handling with exponential backoff & classification
          const errCode = genResult.error?.code ?? "UNKNOWN";
          const errMsg = genResult.error?.message ?? "Caption generation failed";
          const retryable = genResult.error?.retryable ?? true;

          await failCaptionJob({
            jobId: job.id,
            workspaceId: job.workspaceId,
            postId: job.postId,
            errorCode: errCode,
            errorMessage: errMsg,
            retryable,
            attempts: job.attempts,
          });
          result.failed++;
        }
      } catch (err: unknown) {
        log.error(err, { step: "process-caption-job", jobId: job.id });
        await failCaptionJob({
          jobId: job.id,
          workspaceId: job.workspaceId,
          postId: job.postId,
          errorCode: "WORKER_EXCEPTION",
          errorMessage: (err as Error)?.message ?? "Internal worker exception",
          retryable: true,
          attempts: job.attempts,
        });
        result.failed++;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, batch.length) }, () => processWorker())
  );

  lastResult = result;
  return result;
}

export function startCaptionWorker(intervalMs = CAPTION_CONFIG.WORKER_POLL_INTERVAL_MS): void {
  if (interval || running) return;
  running = true;
  void runCaptionWorkerTick();
  interval = setInterval(() => {
    void runCaptionWorkerTick();
  }, intervalMs);
}

export function stopCaptionWorker(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  running = false;
}

export function getCaptionWorkerStatus(): {
  running: boolean;
  intervalMs: number;
  lastTickAt: string | null;
  lastResult: CaptionTickResult | null;
} {
  return {
    running,
    intervalMs: CAPTION_CONFIG.WORKER_POLL_INTERVAL_MS,
    lastTickAt: lastTickAt ? lastTickAt.toISOString() : null,
    lastResult,
  };
}
