import "server-only";
import type { ProviderId } from "./types";

/**
 * Default fallback order — the user-facing "Auto — best available"
 * option walks providers in this sequence.
 *
 * Order rationale:
 *   1. Gemini Flash Lite Image — cheapest, fastest, ~$0.002/image.
 *   2. GPT Image 2 — best typography; falls in next because it costs
 *      ~10× more per image than Gemini Lite.
 *   3. Gemini 2.5 Flash Image — original Nano Banana, kept as a
 *      secondary fallback for when both top providers fail.
 *   4. Ideogram 4 — only used last because it requires JSON prompts
 *      and has the highest flat per-image cost.
 */
export const DEFAULT_FALLBACK_CHAIN: ProviderId[] = [
  "gemini-flash-lite-image",
  "gpt-image-2",
  "gemini-flash-image",
  "ideogram-4",
];

/**
 * Resolves the ordered list of providers to try for a request.
 * If the caller explicitly named a provider, the chain starts there and
 * falls back to the rest of the default chain. If `auto`, the chain is
 * the default list verbatim.
 */
export function resolveFallbackChain(
  requested: ProviderId | "auto"
): ProviderId[] {
  if (requested === "auto") return [...DEFAULT_FALLBACK_CHAIN];
  const idx = DEFAULT_FALLBACK_CHAIN.indexOf(requested);
  if (idx === -1) return [...DEFAULT_FALLBACK_CHAIN];
  return [
    requested,
    ...DEFAULT_FALLBACK_CHAIN.filter((p) => p !== requested),
  ];
}