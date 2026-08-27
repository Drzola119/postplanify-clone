import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { listPosts, listScheduledDue, claimPost, markPublished, markFailed, resetStuckClaims, updatePost } from "@/lib/db/posts";
import { resolvers } from "@/lib/security/server-config";
import { deliverWebhook } from "@/lib/webhooks/delivery";
import { ensureProfile, readProfile } from "@/lib/db/upload-post-profiles";
import { createLogger } from "@/lib/log";
import { evaluateAlertRules } from "@/lib/alerts/evaluate";
import { buildPublishPayload, resolveCaptionsForPayload } from "@/lib/publishing/payload";
import { getUploadPostStatus, publishToUploadPost } from "@/lib/uploadpost/publisher";

const log = createLogger("queue-worker");

const DEFAULT_INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 30_000);
const STUCK_CLAIM_MS = Number(process.env.WORKER_STUCK_CLAIM_MS ?? 5 * 60_000);

interface TickResult {
  scanned: number;
  published: number;
  failed: number;
  reaped: number;
  error?: string;
}

let interval: NodeJS.Timeout | null = null;
let running = false;
let lastTickAt: Date | null = null;
let lastResult: TickResult | null = null;

// Per-workspace profile cache so we don't re-fetch from upload-post.com every
// tick. Cache for the lifetime of the process; ensureProfile is itself
// idempotent against our Firestore cache.
//
// NOTE: This is an in-memory cache stored in a module-level Map. It is lost on
// every server restart (e.g., Vercel cold start, redeploy, process restart).
// On a cold start every workspace will miss the cache and re-fetch from
// upload-post.com once per workspace before the TTL kicks in. If this becomes
// a bottleneck, migrate to a persistent cache (e.g., Redis or Firestore).
const profileCache = new Map<string, { username: string; ts: number }>();
const PROFILE_CACHE_TTL_MS = 5 * 60_000;

async function resolveUploadPostUsername(workspaceId: string, apiKey: string): Promise<string> {
  const cached = profileCache.get(workspaceId);
  if (cached && Date.now() - cached.ts < PROFILE_CACHE_TTL_MS) {
    return cached.username;
  }
  // Try cached profile first; only call upload-post.com to create one if missing.
  const local = await readProfile(workspaceId);
  if (local?.username) {
    profileCache.set(workspaceId, { username: local.username, ts: Date.now() });
    return local.username;
  }
  try {
    const profile = await ensureProfile(workspaceId, apiKey);
    profileCache.set(workspaceId, { username: profile.username, ts: Date.now() });
    return profile.username;
  } catch (err) {
    log.warn("ensureProfile failed; falling back to workspaceId", { workspaceId, err: (err as Error).message });
    profileCache.set(workspaceId, { username: workspaceId, ts: Date.now() });
    return workspaceId;
  }
}

async function tickOnce(): Promise<TickResult> {
  const result: TickResult = { scanned: 0, published: 0, failed: 0, reaped: 0 };
  if (!adminDb) return result;

  // Persist heartbeat so System Health can detect a stale worker.
  try {
    await adminDb.collection("adminStats").doc("worker").set(
      { lastCronRun: new Date().toISOString() },
      { merge: true }
    );
  } catch {
    // heartbeat is best-effort
  }

  try {
    result.reaped = await resetStuckClaimsForAllWorkspaces(STUCK_CLAIM_MS);
  } catch (err) {
    log.error(err, { step: "reap" });
  }

  const due = await collectDuePosts();
  result.scanned = due.length;

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(new Headers());
  } catch (err) {
    result.error = err instanceof Error ? err.message : "Missing required env (UPLOAD_POST_API_KEY)";
    return result;
  }

  const reconciled = await reconcilePendingUploads(apiKey).catch((err) => {
    log.error(err, { step: "reconcile-uploadpost" });
    return { published: 0, failed: 0 };
  });
  result.published += reconciled.published;
  result.failed += reconciled.failed;
  if (due.length === 0) return result;

  for (const { workspaceId, postId } of due) {
    const claimed = await claimPost(workspaceId, postId, process.pid.toString());
    if (!claimed) continue;
    const doc = await adminDb.doc(`workspaces/${workspaceId}/posts/${postId}`).get();
    const data = doc.data() ?? {};
    const uploadPostUsername = await resolveUploadPostUsername(workspaceId, apiKey);
    // Resolve captions with legacy fallback
    const resolvedCaptions = resolveCaptionsForPayload({
      caption: data.caption,
      captionsByPlatform: data.captionsByPlatform,
      sameForAll: data.sameForAll,
      platforms: data.platforms,
    });
    try {
      const publishPayload = buildPublishPayload({
        postId,
        userId: data.authorUid,
        uploadPostUsername,
        platforms: data.platforms ?? [],
        caption: resolvedCaptions.caption,
        captionsByPlatform: resolvedCaptions.captionsByPlatform,
        sameForAll: resolvedCaptions.sameForAll ?? data.sameForAll,
        mediaUrls: data.mediaUrls ?? [],
        scheduledAt: null,
        advancedByPlatform: data.advancedByPlatform as Record<string, unknown> | undefined,
        firstComment: data.firstComment,
        firstCommentByPlatform: data.firstCommentByPlatform,
        altTextByPlatform: data.altTextByPlatform,
        feedType: data.feedType,
        carouselItems: data.carouselItems,
        trialReel: data.trialReel,
        document: data.document,
        collaborators: Array.isArray(data.collaborators) ? data.collaborators.map((c: { handle?: string }) => c.handle ?? "") : undefined,
        frameCoverUrl: data.frameCoverUrl,
        customCoverUrl: data.customCoverUrl,
        tagUsers: data.tagUsers,
        quoteTweetUrl: data.quoteTweetUrl,
        community: data.community,
        hashtags: Array.isArray(data.hashtags) ? data.hashtags.join(" ") : undefined,
      });
      const uploadResult = await publishToUploadPost({
        apiKey,
        username: uploadPostUsername,
        platforms: (publishPayload.platforms as string[]) ?? [],
        caption: String(publishPayload.caption ?? ""),
        captionsByPlatform: publishPayload.captionsByPlatform as Record<string, string> | undefined,
        mediaUrls: (publishPayload.mediaUrls as string[]) ?? [],
        mediaType: data.mediaType,
        advancedByPlatform: publishPayload.advancedByPlatform as Record<string, Record<string, unknown>> | undefined,
        firstComment: publishPayload.firstComment as string | undefined,
        firstCommentByPlatform: publishPayload.firstCommentByPlatform as Record<string, string> | undefined,
        document: data.document,
        frameCoverUrl: data.frameCoverUrl,
        customCoverUrl: data.customCoverUrl,
        requestId: postId,
        externalId: postId,
      });
      if (uploadResult.deliveryConfirmed) {
        await markPublished(workspaceId, postId);
        result.published++;
        void deliverWebhook(workspaceId, {
          event: "post.published",
          workspaceId,
          data: { postId, authorUid: data.authorUid, platforms: data.platforms ?? [] },
        });
      } else if (uploadResult.results) {
        const failures = Object.entries(uploadResult.results)
          .filter(([, platformResult]) => !platformResult.ok)
          .map(([platform, platformResult]) => `${platform}: ${platformResult.error || "failed"}`);
        await markFailed(workspaceId, postId, failures.join("; ") || "UploadPost did not confirm delivery");
        result.failed++;
        void deliverWebhook(workspaceId, {
          event: "post.failed",
          workspaceId,
          data: { postId, reason: failures.join("; ") },
        });
      } else {
        // UploadPost owns the async job now. Keep it publishing and persist
        // the request id instead of lying that an HTTP acknowledgement means
        // the social platform has the post.
        await updatePost(workspaceId, postId, {
          status: "publishing",
          uploadPostRequestId: uploadResult.requestId,
          uploadPostJobId: uploadResult.jobId,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      await markFailed(workspaceId, postId, msg).catch(() => undefined);
      result.failed++;
    }
  }

  // Evaluate alert rules on every tick so the alert system stays live.
  try {
    await evaluateAlertRules();
  } catch {
    // Evaluation is best-effort; tick continues regardless.
  }

  return result;
}

async function collectDuePosts(): Promise<Array<{ workspaceId: string; postId: string }>> {
  if (!adminDb) return [];
  const workspacesSnap = await adminDb.collection("workspaces").limit(50).get();
  const out: Array<{ workspaceId: string; postId: string }> = [];
  for (const ws of workspacesSnap.docs) {
    const due = await listScheduledDue(ws.id, new Date());
    for (const p of due) {
      out.push({ workspaceId: ws.id, postId: p.id });
    }
  }
  return out;
}

async function reconcilePendingUploads(apiKey: string): Promise<{ published: number; failed: number }> {
  const totals = { published: 0, failed: 0 };
  if (!adminDb) return totals;
  const workspacesSnap = await adminDb.collection("workspaces").limit(50).get();
  for (const workspace of workspacesSnap.docs) {
    const pending = await listPosts(workspace.id, { status: ["publishing", "scheduled"], pageSize: 100 });
    for (const post of pending.items) {
      if (!post.uploadPostRequestId && !post.uploadPostJobId) continue;
      try {
        const status = await getUploadPostStatus({
          apiKey,
          requestId: post.uploadPostRequestId,
          jobId: post.uploadPostJobId,
          platforms: post.platforms,
        });
        if (!status.final) continue;
        const succeeded = status.results ? Object.values(status.results).filter((entry) => entry.ok).length : 0;
        const failures = status.results
          ? Object.entries(status.results).filter(([, entry]) => !entry.ok)
          : [];
        if (status.status === "completed" && succeeded === post.platforms.length) {
          await markPublished(workspace.id, post.id);
          totals.published++;
        } else {
          const reason = failures.length
            ? failures.map(([platform, entry]) => `${platform}: ${entry.error || "failed"}`).join("; ")
            : `UploadPost job ended with status ${status.status}`;
          await updatePost(workspace.id, post.id, {
            status: succeeded > 0 ? "partially_published" : "failed",
            publishedAt: succeeded > 0 ? new Date() : undefined,
            failureReason: reason,
          });
          totals.failed++;
        }
      } catch (err) {
        log.warn("UploadPost status reconciliation failed", { workspaceId: workspace.id, postId: post.id, err });
      }
    }
  }
  return totals;
}

async function resetStuckClaimsForAllWorkspaces(olderThanMs: number): Promise<number> {
  if (!adminDb) return 0;
  const workspacesSnap = await adminDb.collection("workspaces").limit(50).get();
  let total = 0;
  for (const ws of workspacesSnap.docs) {
    total += await resetStuckClaims(ws.id, olderThanMs);
  }
  return total;
}

export function startQueueWorker(intervalMs = DEFAULT_INTERVAL_MS): void {
  if (interval) return;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      lastTickAt = new Date();
      lastResult = await tickOnce();
    } catch (err) {
      log.error(err, { step: "tick" });
      lastResult = { scanned: 0, published: 0, failed: 0, reaped: 0, error: err instanceof Error ? err.message : "unknown" };
    } finally {
      running = false;
    }
  };
  // Reconcile accepted UploadPost jobs as soon as the server boots. Waiting
  // for the first interval left every job pending forever on short-lived hosts.
  void run();
  interval = setInterval(run, intervalMs);
  interval.unref?.();
  log.info(`started (interval=${intervalMs}ms)`);
}

export function stopQueueWorker(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

export function getWorkerStatus(): {
  running: boolean;
  lastTickAt: string | null;
  lastResult: TickResult | null;
} {
  return {
    running,
    lastTickAt: lastTickAt?.toISOString() ?? null,
    lastResult,
  };
}

export { tickOnce as runQueueTick };
