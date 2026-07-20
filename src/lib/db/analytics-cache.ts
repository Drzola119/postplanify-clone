import "server-only";
import { adminDb } from "@/lib/db";
import { createLogger } from "@/lib/log";
import type {
  NormalizedPlatformAnalytics,
  UnifiedAnalytics,
} from "@/types/analytics";

const log = createLogger("analytics-cache");

const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes
const COLLECTION = "analyticsCache";

export interface AnalyticsCacheDoc {
  uid: string;
  workspaceId: string;
  profileUsername: string;
  platform: string;
  rangeKey: string;
  payload: unknown;
  fetchedAt: string;
  expiresAt: string;
  status: string;
  errorMessage: string | null;
}

function cacheKey(platform: string, rangeKey: string): string {
  return `${platform}__${rangeKey}`;
}

function rangeKeyFromDates(from: Date, to: Date): string {
  return `${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}`;
}

function isExpired(doc: AnalyticsCacheDoc): boolean {
  return Date.now() > Date.parse(doc.expiresAt);
}

async function readDoc(
  workspaceId: string,
  profileUsername: string,
  key: string,
): Promise<AnalyticsCacheDoc | null> {
  if (!adminDb) return null;
  try {
    const snap = await adminDb
      .doc(`workspaces/${workspaceId}/${COLLECTION}/${profileUsername}/entries/${key}`)
      .get();
    if (!snap.exists) return null;
    return snap.data() as AnalyticsCacheDoc;
  } catch (err) {
    log.warn("analytics cache read failed", { error: String(err) });
    return null;
  }
}

async function writeDoc(doc: AnalyticsCacheDoc): Promise<void> {
  if (!adminDb) return;
  try {
    await adminDb
      .doc(`workspaces/${doc.workspaceId}/${COLLECTION}/${doc.profileUsername}/entries/${cacheKey(doc.platform, doc.rangeKey)}`)
      .set(doc, { merge: true });
  } catch (err) {
    log.warn("analytics cache write failed", { error: String(err) });
  }
}

export async function getCachedUnified(
  workspaceId: string,
  profileUsername: string,
  from: Date,
  to: Date,
): Promise<UnifiedAnalytics | null> {
  const doc = await readDoc(workspaceId, profileUsername, cacheKey("unified", rangeKeyFromDates(from, to)));
  if (!doc || isExpired(doc)) return null;
  return doc.payload as UnifiedAnalytics;
}

export async function setCachedUnified(
  uid: string,
  workspaceId: string,
  profileUsername: string,
  from: Date,
  to: Date,
  payload: UnifiedAnalytics,
): Promise<void> {
  const now = new Date();
  const expires = new Date(now.getTime() + CACHE_TTL_MS);
  await writeDoc({
    uid,
    workspaceId,
    profileUsername,
    platform: "unified",
    rangeKey: rangeKeyFromDates(from, to),
    payload,
    fetchedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    status: payload.status,
    errorMessage: payload.errorMessage,
  });
}

export async function getCachedPlatform(
  workspaceId: string,
  profileUsername: string,
  platform: string,
  from: Date,
  to: Date,
): Promise<NormalizedPlatformAnalytics | null> {
  const doc = await readDoc(workspaceId, profileUsername, cacheKey(platform, rangeKeyFromDates(from, to)));
  if (!doc || isExpired(doc)) return null;
  return doc.payload as NormalizedPlatformAnalytics;
}

export async function setCachedPlatform(
  uid: string,
  workspaceId: string,
  profileUsername: string,
  platform: string,
  from: Date,
  to: Date,
  payload: NormalizedPlatformAnalytics,
): Promise<void> {
  const now = new Date();
  const expires = new Date(now.getTime() + CACHE_TTL_MS);
  await writeDoc({
    uid,
    workspaceId,
    profileUsername,
    platform,
    rangeKey: rangeKeyFromDates(from, to),
    payload,
    fetchedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    status: payload.status,
    errorMessage: payload.errorMessage,
  });
}

/** Invalidate all cached analytics for a workspace/profile (used by manual sync). */
export async function invalidateAnalyticsCache(
  workspaceId: string,
  profileUsername: string,
): Promise<void> {
  if (!adminDb) return;
  try {
    const parent = adminDb.doc(`workspaces/${workspaceId}/${COLLECTION}/${profileUsername}`);
    const entries = await parent.collection("entries").get();
    const batch = adminDb.batch();
    entries.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    log.warn("analytics cache invalidate failed", { error: String(err) });
  }
}

export { CACHE_TTL_MS };
