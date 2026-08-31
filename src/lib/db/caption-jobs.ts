import "server-only";
import { adminDb, FieldValue } from "@/lib/db";
import { toIso } from "@/lib/db/date-utils";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";
import { calculateCaptionDeadlines, calculatePriorityScore } from "@/lib/ai/fair-scheduler";
import { calculateCaptionFingerprint } from "@/lib/ai/fingerprint";
import type { CaptionJobDoc, CaptionJobInputSnapshot, CaptionJobUsage, PostDoc } from "@/lib/db/schema";

const SERVER_TIMESTAMP = FieldValue.serverTimestamp();

function collection() {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection("captionJobs");
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

/**
 * Creates a persistent CaptionGenerationJob in Firestore.
 * Automatically computes deadlines, priority scores, and deterministic content fingerprints.
 */
export async function createCaptionJob(params: {
  workspaceId: string;
  userId: string;
  postId: string;
  scheduledAt: Date | string;
  inputSnapshot: CaptionJobInputSnapshot;
  isManualGenerateNow?: boolean;
}): Promise<string> {
  if (!adminDb) throw new Error("adminDb not configured");

  const coll = collection();
  const now = new Date();

  const deadlines = calculateCaptionDeadlines(params.scheduledAt);
  const { contentHash, generationConfigHash, fingerprint } = calculateCaptionFingerprint({
    inputSnapshot: params.inputSnapshot,
  });

  const priorityScore = calculatePriorityScore(
    params.scheduledAt,
    now,
    0,
    !!params.isManualGenerateNow
  );

  const idempotencyKey = `${params.postId}_${fingerprint}`;

  // Check if an active/completed job already exists for this post & fingerprint
  const existingSnap = await coll
    .where("postId", "==", params.postId)
    .where("fingerprint", "==", fingerprint)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    const existing = existingSnap.docs[0];
    const data = existing.data() as CaptionJobDoc;
    if (data.status !== "failed" && data.status !== "cancelled") {
      return existing.id;
    }
  }

  const jobDoc: Omit<CaptionJobDoc, "id"> = {
    workspaceId: params.workspaceId,
    userId: params.userId,
    postId: params.postId,
    status: "pending",
    priorityScore,
    scheduledAt: deadlines.scheduledAt.toISOString(),
    generationRecommendedAt: deadlines.generationRecommendedAt.toISOString(),
    generationDeadline: deadlines.generationDeadline.toISOString(),
    emergencyDeadline: deadlines.emergencyDeadline.toISOString(),
    attempts: 0,
    maxAttempts: CAPTION_CONFIG.MAX_ATTEMPTS,
    provider: "xai",
    model: CAPTION_CONFIG.XAI_MODEL,
    idempotencyKey,
    promptVersion: CAPTION_CONFIG.PROMPT_VERSION,
    generationConfigHash,
    contentHash,
    fingerprint,
    inputSnapshot: params.inputSnapshot,
    createdAt: now,
    updatedAt: now,
  };

  const ref = coll.doc();
  await ref.set(stripUndefined(jobDoc as unknown as Record<string, unknown>));

  // Sync post status with job reference
  try {
    await adminDb.doc(`workspaces/${params.workspaceId}/posts/${params.postId}`).update({
      captionJobId: ref.id,
      captionJobStatus: "pending",
      captionGenerationMode: "automatic",
      updatedAt: SERVER_TIMESTAMP,
    });
  } catch (err) {
    console.warn(`[createCaptionJob] Could not link captionJobId to post ${params.postId}:`, err);
  }

  return ref.id;
}

/**
 * Retrieves a caption job by ID.
 */
export async function getCaptionJob(jobId: string): Promise<CaptionJobDoc | null> {
  if (!adminDb) return null;
  const doc = await collection().doc(jobId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as CaptionJobDoc) };
}

/**
 * Searches for a reusable completed caption with the exact same fingerprint.
 */
export async function findReusableCaption(fingerprint: string): Promise<{ caption: string; captionsByPlatform?: Record<string, string> } | null> {
  if (!adminDb) return null;
  try {
    const snap = await collection()
      .where("fingerprint", "==", fingerprint)
      .where("status", "==", "completed")
      .limit(1)
      .get();

    if (snap.empty) return null;
    const data = snap.docs[0].data() as CaptionJobDoc;
    if (data.generatedCaption) {
      return {
        caption: data.generatedCaption,
        captionsByPlatform: data.generatedCaptionsByPlatform,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Lists eligible caption jobs that are ready to run or overdue.
 */
export async function listEligibleCaptionJobs(limitCount = 50): Promise<CaptionJobDoc[]> {
  if (!adminDb) return [];
  const coll = collection();
  const now = new Date();
  const nowIso = now.toISOString();

  // Query pending / retrying / ready_to_run jobs
  const snap = await coll
    .where("status", "in", ["pending", "ready_to_run", "retrying"])
    .limit(200)
    .get();

  const candidates: CaptionJobDoc[] = [];

  for (const d of snap.docs) {
    const data = d.data() as CaptionJobDoc;

    // Check if nextAttemptAt delay is satisfied
    if (data.nextAttemptAt) {
      const nextMs = new Date(data.nextAttemptAt).getTime();
      if (nextMs > now.getTime()) continue;
    }

    // Check if generation start window has arrived (or emergency)
    const recMs = new Date(data.generationRecommendedAt || data.scheduledAt).getTime();
    if (recMs <= now.getTime() || snap.size >= 50) {
      candidates.push({ id: d.id, ...data });
    }
  }

  // Recalculate priority dynamically with current timestamp
  for (const job of candidates) {
    job.priorityScore = calculatePriorityScore(
      job.scheduledAt,
      job.createdAt,
      job.attempts
    );
  }

  return candidates.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, limitCount);
}

/**
 * Atomically claims a caption job for processing using a Firestore transaction.
 */
export async function claimCaptionJob(jobId: string, workerId: string): Promise<boolean> {
  if (!adminDb) return false;
  const ref = collection().doc(jobId);

  return adminDb.runTransaction(async (t) => {
    const doc = await t.get(ref);
    if (!doc.exists) return false;
    const data = doc.data() as CaptionJobDoc;

    if (data.status !== "pending" && data.status !== "ready_to_run" && data.status !== "retrying") {
      return false;
    }

    t.update(ref, {
      status: "processing",
      workerId,
      claimedAt: SERVER_TIMESTAMP,
      startedAt: SERVER_TIMESTAMP,
      updatedAt: SERVER_TIMESTAMP,
    });

    return true;
  });
}

/**
 * Atomically marks a caption job as COMPLETED and updates the target PostDoc in Firestore.
 */
export async function completeCaptionJob(params: {
  jobId: string;
  workspaceId: string;
  postId: string;
  caption: string;
  captionsByPlatform?: Record<string, string>;
  provider: "xai" | "groq";
  model: string;
  usage?: CaptionJobUsage;
}): Promise<void> {
  if (!adminDb) return;
  const now = new Date();
  const jobRef = collection().doc(params.jobId);
  const postRef = adminDb.doc(`workspaces/${params.workspaceId}/posts/${params.postId}`);

  await adminDb.runTransaction(async (t) => {
    const postSnap = await t.get(postRef);

    // Verify post still exists and hasn't had manual caption override
    if (postSnap.exists) {
      const postData = postSnap.data() as PostDoc;
      if (!postData.deletedAt) {
        // If the user already wrote a manual caption while job was running, do not overwrite it
        const hasManualOverride = postData.caption && postData.caption.trim().length > 0 && postData.captionGenerationMode === "manual";
        if (!hasManualOverride) {
          t.update(postRef, {
            caption: params.caption,
            captionsByPlatform: params.captionsByPlatform ?? postData.captionsByPlatform ?? {},
            captionJobStatus: "ready",
            updatedAt: SERVER_TIMESTAMP,
          });
        }
      }
    }

    t.update(jobRef, {
      status: "completed",
      generatedCaption: params.caption,
      generatedCaptionsByPlatform: params.captionsByPlatform ?? {},
      provider: params.provider,
      model: params.model,
      usage: params.usage ?? {},
      completedAt: now,
      updatedAt: SERVER_TIMESTAMP,
    });
  });
}

/**
 * Updates a caption job after a failure (marks RETRYING with exponential backoff or FAILED if max attempts exhausted).
 */
export async function failCaptionJob(params: {
  jobId: string;
  workspaceId: string;
  postId: string;
  errorCode: string;
  errorMessage: string;
  retryable: boolean;
  attempts: number;
}): Promise<{ status: "retrying" | "failed"; nextAttemptAt?: string }> {
  if (!adminDb) return { status: "failed" };
  const now = Date.now();
  const jobRef = collection().doc(params.jobId);
  const postRef = adminDb.doc(`workspaces/${params.workspaceId}/posts/${params.postId}`);

  const nextAttempts = params.attempts + 1;
  const canRetry = params.retryable && nextAttempts < CAPTION_CONFIG.MAX_ATTEMPTS;

  if (canRetry) {
    // Exponential backoff + jitter
    const backoffMs = Math.min(
      CAPTION_CONFIG.MAX_BACKOFF_MS,
      CAPTION_CONFIG.BASE_BACKOFF_MS * Math.pow(2, nextAttempts) + Math.random() * 1_000
    );
    const nextAttemptAt = new Date(now + backoffMs).toISOString();

    await jobRef.update({
      status: "retrying",
      attempts: nextAttempts,
      nextAttemptAt,
      lastErrorCode: params.errorCode,
      lastErrorMessage: params.errorMessage,
      workerId: null,
      claimedAt: null,
      updatedAt: SERVER_TIMESTAMP,
    });

    try {
      await postRef.update({
        captionJobStatus: "generating",
        updatedAt: SERVER_TIMESTAMP,
      });
    } catch {}

    return { status: "retrying", nextAttemptAt };
  }

  // Exhausted retries or non-retryable error
  await jobRef.update({
    status: "failed",
    attempts: nextAttempts,
    failedAt: new Date(now),
    lastErrorCode: params.errorCode,
    lastErrorMessage: params.errorMessage,
    workerId: null,
    claimedAt: null,
    updatedAt: SERVER_TIMESTAMP,
  });

  try {
    await postRef.update({
      captionJobStatus: "failed",
      updatedAt: SERVER_TIMESTAMP,
    });
  } catch {}

  return { status: "failed" };
}

/**
 * Cancels pending caption jobs associated with a scheduled post (e.g. when post is deleted or cancelled).
 */
export async function cancelCaptionJobForPost(workspaceId: string, postId: string): Promise<void> {
  if (!adminDb) return;
  try {
    const snap = await collection()
      .where("postId", "==", postId)
      .where("status", "in", ["pending", "ready_to_run", "retrying"])
      .get();

    const batch = adminDb.batch();
    for (const d of snap.docs) {
      batch.update(d.ref, {
        status: "cancelled",
        updatedAt: SERVER_TIMESTAMP,
      });
    }
    if (!snap.empty) await batch.commit();
  } catch (err) {
    console.warn(`[cancelCaptionJobForPost] Failed for postId ${postId}:`, err);
  }
}

/**
 * Reclaims jobs that have been stuck in 'processing' state past the lease timeout.
 */
export async function resetStuckCaptionJobClaims(olderThanMs = CAPTION_CONFIG.PROCESSING_TIMEOUT_MS): Promise<number> {
  if (!adminDb) return 0;
  try {
    const threshold = new Date(Date.now() - olderThanMs);
    const snap = await collection()
      .where("status", "==", "processing")
      .where("claimedAt", "<=", threshold)
      .limit(100)
      .get();

    const batch = adminDb.batch();
    let count = 0;

    for (const d of snap.docs) {
      batch.update(d.ref, {
        status: "ready_to_run",
        workerId: null,
        claimedAt: null,
        updatedAt: SERVER_TIMESTAMP,
      });
      count++;
    }

    if (count > 0) await batch.commit();
    return count;
  } catch (err) {
    console.error("[resetStuckCaptionJobClaims error]", err);
    return 0;
  }
}
