import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";
import { resolvers } from "@/lib/security/server-config";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const KEY_LEN = 32;

function getKey(): Buffer {
  const raw = resolvers.apiKeyEncryptionKey(new Headers());
  if (!raw) throw new Error("API_KEY_ENCRYPTION_KEY not configured");
  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    key = Buffer.from(raw, "utf8");
  }
  if (key.length === KEY_LEN) return key;
  // Derive a 32-byte key from arbitrary-length input via SHA-256.
  return createHash("sha256").update(key).digest();
}

export interface EncryptedToken {
  ciphertext: string;
  iv: string;
  tag: string;
}

export function encryptToken(plain: string): EncryptedToken {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext: ct.toString("base64"), iv: iv.toString("base64"), tag: tag.toString("base64") };
}

export function decryptToken(payload: EncryptedToken): string {
  const key = getKey();
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ct = Buffer.from(payload.ciphertext, "base64");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

export function hashToken(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

export function generateToken(): string {
  return `ppk_${randomBytes(32).toString("base64url")}`;
}
