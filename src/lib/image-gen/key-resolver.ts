import "server-only";
import { revealImageGenKey } from "@/lib/db/image-gen-keys";
import { platformKey, type ResolvedKey } from "./byok";
import type { ProviderId } from "./types";

export type { ResolvedKey };

/**
 * Resolve which API key the router should use for a given provider, in
 * priority order: explicit override → workspace BYOK → platform env key.
 *
 * The key is decrypted server-side only; the caller must never persist
 * or echo it back to the client.
 */
export async function resolveImageGenKey(args: {
  workspaceId: string;
  provider: ProviderId;
  override?: string;
}): Promise<ResolvedKey> {
  if (args.override && args.override.trim().length > 0) {
    return { apiKey: args.override.trim(), source: "override" };
  }

  const byok = await revealImageGenKey(args.workspaceId, args.provider);
  if (byok) {
    return {
      apiKey: byok,
      source: "byok",
      hint: byok.length <= 4 ? "****" : `…${byok.slice(-4)}`,
    };
  }

  const env = platformKey(args.provider);
  if (env) {
    return {
      apiKey: env,
      source: "platform",
      hint: env.length <= 4 ? "****" : `…${env.slice(-4)}`,
    };
  }

  return { apiKey: null, source: "missing" };
}