import "server-only";
import { PROVIDER_PRICING, type ProviderId } from "./types";

/**
 * Estimate the USD cost of a single generation given provider, token
 * counts (where priced), and the number of images produced. For providers
 * with a flat per-image price (Ideogram) tokens are ignored.
 */
export function estimateCost(
  providerId: ProviderId,
  usage: { inputTokens?: number; outputTokens?: number; images?: number }
): number {
  const pricing = PROVIDER_PRICING[providerId];
  if (pricing.flatPerImage !== undefined) {
    const images = Math.max(1, usage.images ?? 1);
    return round4(pricing.flatPerImage * images);
  }
  const inputCost =
    ((usage.inputTokens ?? 0) / 1_000_000) * pricing.inputPerMTokens;
  const outputCost =
    ((usage.outputTokens ?? 0) / 1_000_000) * pricing.outputPerMTokens;
  return round4(inputCost + outputCost);
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}