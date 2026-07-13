import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFirestore, type MockFirestore } from "../fixtures/firestore-mock";

const g = globalThis as unknown as { __mockFs?: MockFirestore };
g.__mockFs = createMockFirestore();
const mockFs = g.__mockFs;

// Provide a 32-byte base64 key for the encryption module.
process.env.API_KEY_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

vi.mock("@/lib/firebase/admin", () => ({
  adminApp: { name: "mock" },
  adminAuth: null,
  adminDb: (globalThis as unknown as { __mockFs: MockFirestore }).__mockFs,
  SESSION_COOKIE: "pp_session",
  SESSION_MAX_AGE_MS: 432000000,
  createSessionCookie: vi.fn(async () => null),
  verifySessionCookie: vi.fn(async () => null),
  getCurrentUser: vi.fn(async () => null),
}));

beforeEach(() => {
  mockFs.reset();
});

describe("db/api-keys - createKey + listKeys + revealToken", () => {
  it("creates a key with encrypted at-rest storage and returns the plaintext once", async () => {
    const { createKey, listKeys, revealToken } = await import("@/lib/db/api-keys");
    const result = await createKey("ws1", { name: "Production", scopes: ["read:posts"] });
    expect(result.token).toMatch(/^ppk_/);
    expect(result.prefix).toHaveLength(8);
    expect(result.id).toBeTruthy();

    // List should not leak the token.
    const items = await listKeys("ws1");
    expect(items.length).toBe(1);
    expect(items[0].name).toBe("Production");
    expect((items[0] as { token?: string }).token).toBeUndefined();

    // revealToken roundtrips the plaintext.
    const revealed = await revealToken("ws1", result.id);
    expect(revealed).toBe(result.token);
  });

  it("revokeKey sets revokedAt", async () => {
    const { createKey, revokeKey, listKeys } = await import("@/lib/db/api-keys");
    const { id } = await createKey("ws1", { name: "X", scopes: ["read:posts"] });
    await revokeKey("ws1", id);
    const items = await listKeys("ws1");
    expect(items[0].revokedAt).toBeTruthy();
  });

  it("markKeyUsed sets lastUsedAt", async () => {
    const { createKey, markKeyUsed, listKeys } = await import("@/lib/db/api-keys");
    const { id } = await createKey("ws1", { name: "X", scopes: ["read:posts"] });
    await markKeyUsed("ws1", id);
    const items = await listKeys("ws1");
    expect(items[0].lastUsedAt).toBeTruthy();
  });
});

describe("encryption/api-key-crypto - encrypt/decrypt roundtrip", () => {
  it("decrypts to the same plaintext", async () => {
    const { encryptToken, decryptToken } = await import("@/lib/encryption/api-key-crypto");
    const plain = "ppk_roundtrip_test";
    const enc = encryptToken(plain);
    expect(enc.ciphertext).toBeTruthy();
    expect(enc.iv).toBeTruthy();
    expect(enc.tag).toBeTruthy();
    expect(decryptToken(enc)).toBe(plain);
  });

  it("hashToken is deterministic", async () => {
    const { hashToken } = await import("@/lib/encryption/api-key-crypto");
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("xyz"));
  });
});
