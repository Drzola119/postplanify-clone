import "server-only";
import { adminDb } from "@/lib/db";
import type { ApiKeyDoc } from "@/lib/db/schema";
import { toIso } from "@/lib/db/date-utils";
import {
  encryptToken,
  decryptToken,
  hashToken,
  generateToken,
} from "@/lib/encryption/api-key-crypto";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/apiKeys`);
}

export interface ApiKeyItem {
  id: string;
  name: string;
  scopes: string[];
  lastUsedAt?: string;
  createdAt: string;
  revokedAt?: string;
  /** First 8 chars of the token for display (not the secret itself). */
  prefix: string;
}

export interface CreateApiKeyResult {
  id: string;
  token: string;
  prefix: string;
}

export async function listKeys(workspaceId: string): Promise<ApiKeyItem[]> {
  const snap = await collection(workspaceId).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => {
    const data = d.data() as ApiKeyDoc;
    return {
      id: d.id,
      name: data.name,
      scopes: data.scopes ?? [],
      lastUsedAt: data.lastUsedAt ? toIso(data.lastUsedAt) : undefined,
      createdAt: toIso(data.createdAt),
      revokedAt: data.revokedAt ? toIso(data.revokedAt) : undefined,
      prefix: data.hashedToken.slice(0, 8),
    };
  });
}

export async function createKey(
  workspaceId: string,
  input: { name: string; scopes: string[] }
): Promise<CreateApiKeyResult> {
  const token = generateToken();
  const hashed = hashToken(token);
  const encrypted = encryptToken(token);
  const ref = collection(workspaceId).doc();
  await ref.set({
    name: input.name,
    hashedToken: hashed,
    encryptedToken: JSON.stringify(encrypted),
    scopes: input.scopes,
    createdAt: SERVER_TIMESTAMP,
  });
  return { id: ref.id, token, prefix: hashed.slice(0, 8) };
}

export async function revokeKey(workspaceId: string, id: string): Promise<void> {
  await collection(workspaceId).doc(id).update({ revokedAt: SERVER_TIMESTAMP });
}

export async function markKeyUsed(workspaceId: string, id: string): Promise<void> {
  await collection(workspaceId).doc(id).update({ lastUsedAt: SERVER_TIMESTAMP });
}

/** Returns the decrypted token. Used by tests only — never expose this in API responses. */
export async function revealToken(workspaceId: string, id: string): Promise<string | null> {
  const snap = await collection(workspaceId).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as ApiKeyDoc;
  if (!data.encryptedToken) return null;
  try {
    return decryptToken(JSON.parse(data.encryptedToken));
  } catch {
    return null;
  }
}


