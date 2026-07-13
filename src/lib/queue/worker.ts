import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { listScheduledDue, claimPost, markPublished, markFailed, resetStuckClaims } from "@/lib/db/posts";
import { resolvers } from "@/lib/security/server-config";

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

async function tickOnce(): Promise<TickResult> {
  const result: TickResult = { scanned: 0, published: 0, failed: 0, reaped: 0 };
  if (!adminDb) return result;

  try {
    result.reaped = await resetStuckClaimsForAllWorkspaces(STUCK_CLAIM_MS);
  } catch (err) {
    console.error("[queue-worker] reap failed:", err);
  }

  const due = await collectDuePosts();
  result.scanned = due.length;
  if (due.length === 0) return result;

  let n8nUrl: string;
  try {
    n8nUrl = resolvers.n8nWebhookUrl(new Headers());
  } catch (err) {
    result.error = err instanceof Error ? err.message : "N8N_WEBHOOK_URL not configured";
    return result;
  }

  for (const { workspaceId, postId } of due) {
    const claimed = await claimPost(workspaceId, postId, process.pid.toString());
    if (!claimed) continue;
    const doc = await adminDb.doc(`workspaces/${workspaceId}/posts/${postId}`).get();
    const data = doc.data() ?? {};
    try {
      const res = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          userId: data.authorUid,
          uploadPostUsername: process.env.UPLOAD_POST_DEFAULT_USERNAME ?? "trustiify_test",
          platforms: data.platforms ?? [],
          caption: data.caption ?? "",
          mediaUrls: data.mediaUrls ?? [],
          scheduledAt: null,
        }),
      });
      if (res.ok) {
        await markPublished(workspaceId, postId);
        result.published++;
      } else {
        await markFailed(workspaceId, postId, `n8n ${res.status}`);
        result.failed++;
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
      console.error("[queue-worker] tick error:", err);
      lastResult = { scanned: 0, published: 0, failed: 0, reaped: 0, error: err instanceof Error ? err.message : "unknown" };
    } finally {
      running = false;
    }
  }, intervalMs);
  interval.unref?.();
  console.log(`[queue-worker] started (interval=${intervalMs}ms)`);
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