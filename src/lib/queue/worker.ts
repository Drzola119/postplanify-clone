import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { listScheduledDue, claimPost, markPublished, markFailed, resetStuckClaims } from "@/lib/db/posts";
import { resolvers } from "@/lib/security/server-config";
import { deliverWebhook } from "@/lib/webhooks/delivery";
import { ensureProfile, readProfile } from "@/lib/db/upload-post-profiles";
import { createLogger } from "@/lib/log";

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
  if (due.length === 0) return result;

  let n8nUrl: string;
  let apiKey: string;
  try {
    n8nUrl = resolvers.n8nWebhookUrl(new Headers());
    apiKey = resolvers.uploadPostApiKey(new Headers());
  } catch (err) {
    result.error = err instanceof Error ? err.message : "Missing required env (N8N_WEBHOOK_URL or UPLOAD_POST_API_KEY)";
    return result;
  }

  for (const { workspaceId, postId } of due) {
    const claimed = await claimPost(workspaceId, postId, process.pid.toString());
    if (!claimed) continue;
    const doc = await adminDb.doc(`workspaces/${workspaceId}/posts/${postId}`).get();
    const data = doc.data() ?? {};
    const uploadPostUsername = await resolveUploadPostUsername(workspaceId, apiKey);
    try {
      const res = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          userId: data.authorUid,
          uploadPostUsername,
          platforms: data.platforms ?? [],
          caption: data.caption ?? "",
          mediaUrls: data.mediaUrls ?? [],
          scheduledAt: null,
        }),
      });
      if (res.ok) {
        await markPublished(workspaceId, postId);
        result.published++;
        void deliverWebhook(workspaceId, {
          event: "post.published",
          workspaceId,
          data: { postId, authorUid: data.authorUid, platforms: data.platforms ?? [] },
        });
      } else {
        await markFailed(workspaceId, postId, `n8n ${res.status}`);
        result.failed++;
        void deliverWebhook(workspaceId, {
          event: "post.failed",
          workspaceId,
          data: { postId, reason: `n8n ${res.status}` },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      await markFailed(workspaceId, postId, msg).catch(() => undefined);
      result.failed++;
    }
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
  interval = setInterval(async () => {
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
  }, intervalMs);
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