import "server-only";
import { adminDb, FieldValue, isDbAvailable } from "@/lib/db";
import { createLogger } from "@/lib/log";

const log = createLogger("image-gen/usage");

/**
 * Per-workspace usage counter for the AI Infographic Generator.
 *
 * After every successful generation, `recordImageGenUsage` bumps two
 * fields on the workspace doc:
 *
 *   - `imageGenUsedLifetime` — total successful generations, never reset.
 *   - `imageGenUsedThisMonth` — same counter, scoped to the current
 *     YYYY-MM bucket. A scheduled function (out of scope here) resets
 *     this monthly to match each plan's included quota + overage window.
 *
 * Both fields use Firestore `FieldValue.increment(1)`, so concurrent
 * generations are safe — no read-modify-write race.
 *
 * The fire-and-forget pattern mirrors the existing
 * `src/lib/image-gen/generation-log.ts`: failures are swallowed so a
 * billing hiccup never blocks the user-visible response. We log to
 * stderr so the issue is still observable.
 */

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

export function currentMonthKey(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export interface RecordUsageInput {
  workspaceId: string;
  uid: string;
  provider: string;
  costUsd: number;
}

/**
 * Atomically increment the workspace's imageGen counters. Safe to call
 * concurrently — Firestore handles the contention server-side.
 */
export async function recordImageGenUsage(input: RecordUsageInput): Promise<void> {
  if (!isDbAvailable() || !adminDb) return;
  try {
    const month = currentMonthKey();
    const ref = adminDb.collection("workspaces").doc(input.workspaceId);
    await ref.set(
      {
        imageGenUsedLifetime: FieldValue.increment(1),
        imageGenUsedThisMonth: FieldValue.increment(1),
        imageGenMonth: month,
        imageGenLastUsedAt: SERVER_TIMESTAMP,
        imageGenLastProvider: input.provider,
        imageGenLastCostUsd: input.costUsd,
      },
      { merge: true }
    );
  } catch (err) {
    log.warn("recordImageGenUsage failed (non-fatal)", {
      workspaceId: input.workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Read-only helper for the dashboard's "generations used this month"
 * widget. Returns zeros if the workspace has never generated.
 */
export interface ImageGenUsageSnapshot {
  lifetime: number;
  thisMonth: number;
  month: string;
}

export async function readImageGenUsage(workspaceId: string): Promise<ImageGenUsageSnapshot> {
  const fallback: ImageGenUsageSnapshot = { lifetime: 0, thisMonth: 0, month: currentMonthKey() };
  if (!isDbAvailable() || !adminDb) return fallback;
  try {
    const snap = await adminDb.collection("workspaces").doc(workspaceId).get();
    const data = snap.data() as Record<string, unknown> | undefined;
    if (!data) return fallback;
    return {
      lifetime: typeof data.imageGenUsedLifetime === "number" ? data.imageGenUsedLifetime : 0,
      thisMonth: typeof data.imageGenUsedThisMonth === "number" ? data.imageGenUsedThisMonth : 0,
      month: typeof data.imageGenMonth === "string" ? data.imageGenMonth : fallback.month,
    };
  } catch {
    return fallback;
  }
}