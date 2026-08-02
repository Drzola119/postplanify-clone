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

/**
 * Estimate the USD cost of generating one full carousel (one image per
 * slide). Defaults to the locked 5-slide skeleton + the GPT-Image-2
 * pricing snapshot, which is what the carousel workflow actually uses
 * today. Surfaces the estimate in the wizard before the user commits
 * so they can decide whether the spend is worth it.
 *
 * Naive by design: real cost varies by prompt length and provider
 * fallback, and we don't know either at this point. Surfaced as a
 * hint, not a guarantee.
 */
export function estimateCarouselCostUsd(
  slideCount: number = 5,
  providerId: ProviderId = "gpt-image-2"
): number {
  // Approximate the GPT-Image-2 cost at 1 image / prompt — the per-image
  // rate isn't a published number for Image 2 specifically, so we use a
  // flat $0.10 per slide based on the spec memory's "$0.05–0.10 per
  // slide" range (mid-point, rounded up for safety margin).
  const perSlide = providerId === "ideogram-4" ? 0.08 : 0.1;
  return round4(Math.max(1, slideCount) * perSlide);
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}