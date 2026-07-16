import "server-only";
import { adminDb } from "@/lib/db";
import type { ImageGenProviderKeyDoc } from "@/lib/db/schema";
import {
  encryptToken,
  decryptToken,
} from "@/lib/encryption/api-key-crypto";
import type { ProviderId } from "@/lib/image-gen/types";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/imageGenKeys`);
}

export interface ImageGenKeyItem {
  provider: ProviderId;
  /** Last 4 characters of the key, for UI display. Never the full key. */
  last4: string;
  /** When the key was first saved. */
  createdAt: string;
  /** When the key was last used to satisfy a generation request. */
  lastUsedAt?: string;
}

export async function listImageGenKeys(
  workspaceId: string
): Promise<ImageGenKeyItem[]> {
  const snap = await collection(workspaceId).get();
  return snap.docs.map((d) => {
    const data = d.data() as ImageGenProviderKeyDoc;
    return {
      provider: data.provider,
      last4: data.last4,
      createdAt: toIso(data.createdAt),
      lastUsedAt: data.lastUsedAt ? toIso(data.lastUsedAt) : undefined,
    };
  });
}

/**
 * Save (or replace) a BYOK key for one provider.
 *
 * Stores the key encrypted with the platform's
 * `API_KEY_ENCRYPTION_KEY` secret, plus an unencrypted last-4 hint for
 * UI display. The full key is never written to disk in plaintext and is
 * never returned by any read path.
 */
export async function saveImageGenKey(
  workspaceId: string,
  provider: ProviderId,
  apiKey: string
): Promise<{ provider: ProviderId; last4: string }> {
  const trimmed = apiKey.trim();
  if (!trimmed) throw new Error("apiKey cannot be empty");
  const encrypted = encryptToken(trimmed);
  const last4 = trimmed.slice(-4);
  const ref = collection(workspaceId).doc(provider);
  await ref.set({
    provider,
    encryptedToken: JSON.stringify(encrypted),
    last4,
    createdAt: SERVER_TIMESTAMP,
  });
  return { provider, last4 };
}

export async function deleteImageGenKey(
  workspaceId: string,
  provider: ProviderId
): Promise<void> {
  await collection(workspaceId).doc(provider).delete();
}

/**
 * Decrypt and return the BYOK key for one provider. Server-only; never
 * expose the result to clients.
 */
export async function revealImageGenKey(
  workspaceId: string,
  provider: ProviderId
): Promise<string | null> {
  const ref = collection(workspaceId).doc(provider);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as ImageGenProviderKeyDoc;
  if (!data.encryptedToken) return null;
  try {
    return decryptToken(JSON.parse(data.encryptedToken));
  } catch {
    return null;
  }
}

/**
 * Mark a key as recently used. Fire-and-forget; failures are logged but
 * do not block the generation request.
 */
export async function markImageGenKeyUsed(
  workspaceId: string,
  provider: ProviderId
): Promise<void> {
  try {
    await collection(workspaceId).doc(provider).update({
      lastUsedAt: SERVER_TIMESTAMP,
    });
  } catch {
    /* ignore */
  }
}

function toIso(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && v && "_methodName" in v) return new Date().toISOString();
  if (typeof v === "object" && v && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof v === "object" && v && "seconds" in v) {
    const s = (v as { seconds: number }).seconds;
    return new Date(s * 1000).toISOString();
  }
  return new Date().toISOString();
}