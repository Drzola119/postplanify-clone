/**
 * video-gen/usage.ts
 * Records and reads video generation usage on the workspace Firestore doc.
 * Tracks seconds + cost (not just a flat count) — mirrors image-gen/usage.ts
 * but with finer-grained metrics appropriate to variable-duration video.
 */
import "server-only";
import { adminDb } from "../firebase/admin";
import { createLogger } from "../log";

const logger = createLogger("video-gen:usage");

export interface VideoUsageRecord {
  durationSec: number;
  costUsd: number;
  provider: string;
  workflow: string;
  workspaceId: string;
  uid: string;
  jobId: string;
  timestamp: Date;
}

/**
 * Atomically increment video generation usage counters on the workspace doc.
 * Called once per clip that successfully persists.
 */
export async function recordVideoGenUsage(record: VideoUsageRecord): Promise<void> {
  try {
    const db = adminDb;
    if (!db) throw new Error("adminDb not initialised");
    const wsRef = db.collection("workspaces").doc(record.workspaceId);
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    await db.runTransaction(async (tx) => {
      const wsSnap = await tx.get(wsRef);
      const data = wsSnap.data() ?? {};

      const storedMonthKey: string = data.videoGenMonth ?? "";
      const resetMonth = storedMonthKey !== monthKey;

      tx.update(wsRef, {
        videoGenUsedLifetime: (data.videoGenUsedLifetime ?? 0) + 1,
        videoGenSecondsThisMonth: resetMonth
          ? record.durationSec
          : (data.videoGenSecondsThisMonth ?? 0) + record.durationSec,
        videoGenCostThisMonthUsd: resetMonth
          ? record.costUsd
          : (data.videoGenCostThisMonthUsd ?? 0) + record.costUsd,
        videoGenMonth: monthKey,
        videoGenLastUsedAt: now,
        videoGenLastProvider: record.provider,
      });
    });

    logger.info("Video usage recorded", {
      workspaceId: record.workspaceId,
      durationSec: record.durationSec,
      costUsd: record.costUsd,
      provider: record.provider,
    });
  } catch (err) {
    logger.error("Failed to record video gen usage", { error: err });
    // Non-fatal — don't throw, usage failure shouldn't break the generation
  }
}

/**
 * Read current month video usage for a workspace.
 * Used by the wizard cost estimator and quota enforcement.
 */
export async function readVideoGenUsage(workspaceId: string): Promise<{
  secondsThisMonth: number;
  costThisMonthUsd: number;
  usedLifetime: number;
}> {
  const db = adminDb;
  if (!db) throw new Error("adminDb not initialised");
  const wsSnap = await db.collection("workspaces").doc(workspaceId).get();
  const data = wsSnap.data() ?? {};
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isSameMonth = (data.videoGenMonth ?? "") === monthKey;

  return {
    secondsThisMonth: isSameMonth ? (data.videoGenSecondsThisMonth ?? 0) : 0,
    costThisMonthUsd: isSameMonth ? (data.videoGenCostThisMonthUsd ?? 0) : 0,
    usedLifetime: data.videoGenUsedLifetime ?? 0,
  };
}
