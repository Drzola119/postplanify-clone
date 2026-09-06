import "server-only";
import { adminDb } from "@/lib/db";
import type { InboxSyncDoc, PlatformId } from "@/lib/db/schema";

/**
 * Durable sync scheduling (spec §8).
 * Adaptive tiers (grill decision): hot (activity ≤7d) ~15min, warm (8–30d)
 * ~2h, cold (>30d) ~24h. Paused/disconnected accounts never schedule.
 * Manual refresh is throttled + coalesced via `claimDue`.
 */

export const SYNC_INTERVALS_MS = {
  hot: 15 * 60 * 1000,
  warm: 2 * 60 * 60 * 1000,
  cold: 24 * 60 * 60 * 1000,
} as const;

export const MANUAL_REFRESH_MIN_MS = 60 * 1000;

function coll(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/inboxSync`);
}

export function tierFor(lastActivityAt: Date | null, now = new Date()): "hot" | "warm" | "cold" {
  if (!lastActivityAt) return "cold";
  const age = now.getTime() - lastActivityAt.getTime();
  if (Number.isNaN(age)) return "cold";
  if (age <= 7 * 24 * 60 * 60 * 1000) return "hot";
  if (age <= 30 * 24 * 60 * 60 * 1000) return "warm";
  return "cold";
}

export async function readSyncState(
  workspaceId: string,
  scope: string
): Promise<(InboxSyncDoc & { id: string }) | null> {
  const snap = await coll(workspaceId).doc(scope).get().catch(() => null);
  if (!snap?.exists) return null;
  return { id: snap.id, ...(snap.data() as InboxSyncDoc) };
}

export async function upsertSyncState(
  workspaceId: string,
  scope: string,
  patch: Partial<InboxSyncDoc> & { accountKey: string; platform: PlatformId }
): Promise<void> {
  await coll(workspaceId)
    .doc(scope)
    .set({ ...patch, scope, updatedAt: new Date() }, { merge: true });
}

/**
 * Claim a scope for sync if it is due. Returns false when another worker
 * holds it (concurrency protection) or when throttled.
 */
export async function claimDue(
  workspaceId: string,
  scope: string,
  opts: { accountKey: string; platform: PlatformId; force?: boolean; now?: Date }
): Promise<boolean> {
  const now = opts.now ?? new Date();
  const ref = coll(workspaceId).doc(scope);
  const snap = await ref.get().catch(() => null);
  const data = snap?.exists ? (snap.data() as InboxSyncDoc) : null;
  const nextRun = data?.nextRunAt instanceof Date ? data.nextRunAt.getTime() : 0;
  if (!opts.force && nextRun > now.getTime()) return false;
  // Manual refresh throttle: at most one manual claim per minute per scope.
  const lastAttempt = data?.lastAttemptAt instanceof Date ? data.lastAttemptAt.getTime() : 0;
  if (opts.force && now.getTime() - lastAttempt < MANUAL_REFRESH_MIN_MS) return false;
  const tier = data?.tier ?? "warm";
  const interval = SYNC_INTERVALS_MS[tier];
  await ref.set(
    {
      scope,
      accountKey: opts.accountKey,
      platform: opts.platform,
      tier,
      lastAttemptAt: now,
      nextRunAt: new Date(now.getTime() + interval),
      updatedAt: now,
    },
    { merge: true }
  );
  return true;
}

export async function recordSyncSuccess(
  workspaceId: string,
  scope: string,
  patch: { cursor?: string | null; tier?: InboxSyncDoc["tier"]; externalPostId?: string }
): Promise<void> {
  const tier = patch.tier ?? "warm";
  const now = new Date();
  await coll(workspaceId)
    .doc(scope)
    .set(
      {
        scope,
        lastSuccessAt: now,
        lastAttemptAt: now,
        nextRunAt: new Date(now.getTime() + SYNC_INTERVALS_MS[tier]),
        consecutiveFailures: 0,
        lastError: null,
        cursor: patch.cursor ?? null,
        tier,
        ...(patch.externalPostId ? { externalPostId: patch.externalPostId } : {}),
        updatedAt: now,
      },
      { merge: true }
    );
}

export async function recordSyncFailure(
  workspaceId: string,
  scope: string,
  error: { code: string; message: string }
): Promise<void> {
  const ref = coll(workspaceId).doc(scope);
  const snap = await ref.get().catch(() => null);
  const prev = snap?.exists ? ((snap.data() as InboxSyncDoc).consecutiveFailures ?? 0) : 0;
  const failures = prev + 1;
  // Backoff with ceiling: 2^n minutes capped at 6h (jitter added by the worker).
  const backoffMs = Math.min(2 ** Math.min(failures, 8) * 60 * 1000, 6 * 60 * 60 * 1000);
  const now = new Date();
  await ref.set(
    {
      scope,
      lastAttemptAt: now,
      nextRunAt: new Date(now.getTime() + backoffMs),
      consecutiveFailures: failures,
      lastError: error,
      updatedAt: now,
    },
    { merge: true }
  );
}

/** Account scope id — stable per workspace/account/platform. */
export function accountScope(accountKey: string, platform: string): string {
  return `account:${accountKey}:${platform}`;
}

export function postScope(accountKey: string, platform: string, externalPostId: string): string {
  return `post:${accountKey}:${platform}:${externalPostId}`;
}
