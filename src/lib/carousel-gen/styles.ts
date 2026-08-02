/**
 * carousel-gen/styles.ts
 *
 * One hard-coded default CarouselStyle for M1. The Palette Builder (M2)
 * and Brand Analyzer (M3) ship more — until then every carousel runs
 * against the same default.
 *
 * Style defaults are deliberately restrained: heavy display + plain body,
 * exactly 3 color roles, no gradients. That keeps GPT-Image-2 prompt
 * guidance short enough to actually hold style across all 5 reference-
 * chained slides.
 *
 * Spec reference: §3 — Brand system; §3.3 (typography default pairing);
 * §3.4 (layout variants per slide role).
 */

import "server-only";
import type { CarouselStyle, LayoutVariant } from "./types";

/**
 * Standard set of layout variants. A style assigns one to each role.
 * The Hook variant carries `requiresSafeZone: true` — the prompt builder
 * uses that flag to bake the grid-thumbnail safe-zone instruction into
 * the Hook slide's prompt only.
 */
export const LAYOUT_HEADLINE_ONLY: LayoutVariant = {
  id: "headline-only",
  label: "Headline only",
  description:
    "A single large headline centred on the slide, no supporting copy, no other elements.",
};

export const LAYOUT_HEADLINE_CALLOUT: LayoutVariant = {
  id: "headline-callout",
  label: "Headline + callout",
  description:
    "Large headline at top with one short supporting line beneath it, plenty of negative space below.",
};

export const LAYOUT_HEADLINE_SUPPORTING: LayoutVariant = {
  id: "headline-supporting",
  label: "Headline + supporting line",
  description:
    "Headline fills the upper half; one short supporting line beneath it; no other elements.",
};

export const LAYOUT_HOOK_SAFE_ZONE: LayoutVariant = {
  id: "hook-thumbnail-safe",
  label: "Headline only (grid-safe)",
  description:
    "Single large headline vertically centered in the middle band of the frame so it survives Instagram's grid crop.",
  requiresSafeZone: true,
};

/**
 * The full catalogue of layout variants the M2 manual style picker
 * can choose from. Exposed so the picker UI can render a dropdown per
 * slide role.
 */
export const LAYOUT_VARIANTS: ReadonlyArray<LayoutVariant> = [
  LAYOUT_HEADLINE_ONLY,
  LAYOUT_HEADLINE_CALLOUT,
  LAYOUT_HEADLINE_SUPPORTING,
  LAYOUT_HOOK_SAFE_ZONE,
];

/**
 * The single M1 default style. Hard-coded values — not picked by the
 * user yet (that comes with the manual Palette Builder in M2).
 */
export const DEFAULT_CAROUSEL_STYLE: CarouselStyle = {
  id: "default-zinc",
  label: "Default — Zinc / Archivo",
  colors: {
    primary: "#18181b", // zinc-900 — headlines
    background: "#fafafa", // zinc-50 — canvas
    accent: "#f59e0b", // amber-500 — one small emphasis pop only
  },
  fonts: {
    display: "Archivo Black",
    body: "Inter",
  },
  layouts: {
    // Hook uses the grid-safe variant — spec §2.
    hook: LAYOUT_HOOK_SAFE_ZONE,
    stakes: LAYOUT_HEADLINE_ONLY,
    value: LAYOUT_HEADLINE_SUPPORTING,
    receipts: LAYOUT_HEADLINE_CALLOUT,
    cta: LAYOUT_HEADLINE_ONLY,
  },
  source: "manual",
};

/**
 * Every style the wizard is allowed to pick right now. M1 ships one; the
 * list shape is fixed so adding M2/M3 styles is a one-line change here.
 */
export const CAROUSEL_STYLES: CarouselStyle[] = [DEFAULT_CAROUSEL_STYLE];

/**
 * Resolve a style id to its definition. Throws if unknown — the API route
 * validates this before any generation happens, so an unknown id here is
 * a programmer error.
 */
export function getCarouselStyle(id: string): CarouselStyle {
  const found = CAROUSEL_STYLES.find((s) => s.id === id);
  if (!found) {
    throw new Error(
      `Unknown carousel style "${id}". Known styles: ${CAROUSEL_STYLES.map((s) => s.id).join(", ")}`
    );
  }
  return found;
}
