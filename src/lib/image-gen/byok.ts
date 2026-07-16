import "server-only";
import type { ProviderId } from "./types";

/**
 * Resolves which API key a given provider should use for a workspace:
 *
 *   1. If the caller passed `apiKeyOverride` directly, use it (the wizard
 *      may have read it from a per-request BYOK form).
 *   2. Otherwise, look up a workspace-saved BYOK key for the provider.
 *   3. Otherwise, fall back to the platform's own env-var key.
 *
 * Returns `{ apiKey, source }` so the caller can attribute cost correctly
 * (BYOK = zero platform cost; platform key = tracked against workspace).
 */
export interface ResolvedKey {
  apiKey: string | null;
  source: "override" | "byok" | "platform" | "missing";
  /** Last-4 hint of the key, for display purposes. Never the full key. */
  hint?: string;
}

/**
 * The mapping from a `ProviderId` to the env-var that holds the
 * platform-shared key for that provider. BYOK saves go through
 * `/api/image-gen/keys` and live in Firestore.
 */
export const PLATFORM_KEY_ENV: Record<ProviderId, string> = {
  "gemini-flash-lite-image": "OPENROUTER_API_KEY",
  "gemini-flash-image": "OPENROUTER_API_KEY",
  "gpt-image-2": "OPENAI_API_KEY",
  "ideogram-4": "IDEOGRAM_API_KEY",
};

export function platformKeyEnv(providerId: ProviderId): string {
  return PLATFORM_KEY_ENV[providerId];
}

export function platformKey(providerId: ProviderId): string | undefined {
  const envName = PLATFORM_KEY_ENV[providerId];
  const value = process.env[envName]?.trim();
  return value ? value : undefined;
}

/**
 * Hint formatter: returns "...abcd" for the last 4 chars of a key, so the
 * UI can show "saved ✓" without exposing the secret.
 */
export function keyHint(key: string): string {
  if (key.length <= 4) return "****";
  return `…${key.slice(-4)}`;
}