import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/db";
import { globalGrokRateLimiter } from "@/lib/ai/rate-limiter";
import { getCaptionWorkerStatus } from "@/lib/queue/caption-worker";
import type { CaptionJobDoc } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;

  if (!adminDb) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const jobsSnap = await adminDb.collection("captionJobs").limit(300).get();
    const now = Date.now();

    const depthByStatus: Record<string, number> = {
      pending: 0,
      ready_to_run: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      retrying: 0,
      cancelled: 0,
    };

    let oldestPendingAgeMs = 0;
    let within30m = 0;
    let within10m = 0;

    for (const doc of jobsSnap.docs) {
      const data = doc.data() as CaptionJobDoc;
      const status = data.status || "pending";
      depthByStatus[status] = (depthByStatus[status] || 0) + 1;

      if (["pending", "ready_to_run", "retrying"].includes(status)) {
        if (data.createdAt) {
          const createdMs = new Date(data.createdAt).getTime();
          const age = Math.max(0, now - createdMs);
          if (age > oldestPendingAgeMs) {
            oldestPendingAgeMs = age;
          }
        }

        if (data.scheduledAt) {
          const scheduledMs = new Date(data.scheduledAt).getTime();
          const timeUntilPublishMs = scheduledMs - now;
          if (timeUntilPublishMs <= 30 * 60_000 && timeUntilPublishMs > 0) {
            within30m++;
          }
          if (timeUntilPublishMs <= 10 * 60_000 && timeUntilPublishMs > 0) {
            within10m++;
          }
        }
      }
    }

    const depth = (depthByStatus.pending || 0) + (depthByStatus.ready_to_run || 0) + (depthByStatus.retrying || 0);
    const limiterStatus = globalGrokRateLimiter.getStatus();
    const workerStatus = getCaptionWorkerStatus();

    return NextResponse.json({
      ok: true,
      depth,
      depthByStatus,
      oldestPendingAgeSec: Math.round(oldestPendingAgeMs / 1000),
      within30m,
      within10m,
      limiterStatus,
      workerStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
