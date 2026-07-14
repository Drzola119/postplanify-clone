import "server-only";
import { adminDb } from "@/lib/db";

export type AccountHealthStatus = "healthy" | "needs_reauth" | "stale" | "disconnected";

export interface CachedAccount {
  id: string;
  profileUsername: string;
  platform: string;
  handle: string;
  displayName: string | null;
  img: string | null;
  reauthRequired: boolean;
}

export interface AccountHealthEntry {
  accountId: string;
  platform: string;
  handle: string;
  status: AccountHealthStatus;
  lastCheckedAt: string;
  reason?: string;
}

export interface AccountHealthSnapshot {
  total: number;
  healthy: number;
  needsReauth: number;
  stale: number;
  disconnected: number;
  accounts: AccountHealthEntry[];
  lastCheckedAt: string;
  isStale: boolean;
}

const STALE_AFTER_MS = 1000 * 60 * 60 * 24; // 24h
const SNAPSHOT_KEY = "uploadPostCache";

export interface CachedSnapshot {
  accounts: CachedAccount[];
  profiles: { username: string; redirectUrl: string | null; blocked: boolean; createdAt: string | null }[];
  plan: string | null;
  limit: number | null;
  fetchedAt: string;
}

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.doc(`workspaces/${workspaceId}`);
}

export async function readCache(workspaceId: string): Promise<CachedSnapshot | null> {
  if (!adminDb) return null;
  const snap = await collection(workspaceId).get();
  const data = snap.data() ?? {};
  const settings = (data.settings ?? {}) as Record<string, unknown>;
  const cached = settings[SNAPSHOT_KEY] as CachedSnapshot | undefined;
  return cached ?? null;
}

export async function writeCache(
  workspaceId: string,
  snapshot: Omit<CachedSnapshot, "fetchedAt">,
): Promise<void> {
  if (!adminDb) return;
  await collection(workspaceId).set(
    {
      settings: { [SNAPSHOT_KEY]: { ...snapshot, fetchedAt: new Date().toISOString() } },
      updatedAt: new Date(),
    },
    { merge: true },
  );
}

export function deriveHealth(snapshot: CachedSnapshot | null): AccountHealthSnapshot {
  if (!snapshot || !snapshot.accounts?.length) {
    return {
      total: 0,
      healthy: 0,
      needsReauth: 0,
      stale: 0,
      disconnected: 0,
      accounts: [],
      lastCheckedAt: snapshot?.fetchedAt ?? new Date().toISOString(),
      isStale: !snapshot,
    };
  }

  const ageMs = Date.now() - new Date(snapshot.fetchedAt).getTime();
  const fetchIsStale = ageMs > STALE_AFTER_MS;

  const accounts: AccountHealthEntry[] = snapshot.accounts.map((a) => {
    const base = {
      accountId: a.id,
      platform: a.platform,
      handle: a.handle,
    };
    if (!a.handle) {
      return { ...base, status: "disconnected", lastCheckedAt: snapshot.fetchedAt, reason: "no handle" };
    }
    if (a.reauthRequired) {
      return {
        ...base,
        status: "needs_reauth",
        lastCheckedAt: snapshot.fetchedAt,
        reason: "reauth_required",
      };
    }
    if (fetchIsStale) {
      return { ...base, status: "stale", lastCheckedAt: snapshot.fetchedAt, reason: "snapshot stale" };
    }
    return { ...base, status: "healthy", lastCheckedAt: snapshot.fetchedAt };
  });

  const counts = { healthy: 0, needsReauth: 0, stale: 0, disconnected: 0 };
  for (const a of accounts) {
    if (a.status === "healthy") counts.healthy++;
    else if (a.status === "needs_reauth") counts.needsReauth++;
    else if (a.status === "stale") counts.stale++;
    else if (a.status === "disconnected") counts.disconnected++;
  }

  return {
    total: accounts.length,
    healthy: counts.healthy,
    needsReauth: counts.needsReauth,
    stale: counts.stale,
    disconnected: counts.disconnected,
    accounts,
    lastCheckedAt: snapshot.fetchedAt,
    isStale: fetchIsStale,
  };
}