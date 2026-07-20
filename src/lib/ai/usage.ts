import "server-only";
import { adminDb, FieldValue, isDbAvailable } from "@/lib/db";
import { createLogger } from "@/lib/log";

const log = createLogger("ai/usage");

export interface RecordTextUsageInput {
  workspaceId: string;
  uid: string;
  feature: string;
  costUsd: number;
}

export async function recordTextGenUsage(input: RecordTextUsageInput): Promise<void> {
  if (!isDbAvailable() || !adminDb) return;
  try {
    const ref = adminDb.collection("workspaces").doc(input.workspaceId);
    await ref.set(
      {
        textGenUsedLifetime: FieldValue.increment(1),
        textGenUsedThisMonth: FieldValue.increment(1),
        textGenLastFeature: input.feature,
        textGenLastCostUsd: input.costUsd,
      },
      { merge: true }
    );
  } catch (err) {
    log.warn("recordTextGenUsage failed (non-fatal)", {
      workspaceId: input.workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
