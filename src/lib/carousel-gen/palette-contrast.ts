/**
 * carousel-gen/palette-contrast.ts
 *
 * WCAG-style palette contrast math for CarouselStyle. Pure functions,
 * no server context, safe to import from Client Components (the live
 * StyleBuilder uses this to warn the user before submit; the API
 * route reuses it on commit to enforce the same rule).
 *
 * The threshold (0.15 luminance delta for accent vs neighbours, 0.40
 * for primary vs background) is the spec §3 "squint test" — accent
 * must read as a distinct pop, primary must read as readable text.
 */

import type { CarouselStyle } from "./types";

/**
 * Cheap, deterministic WCAG relative-luminance-based check. Returns
 * a list of human-readable warnings; callers can surface them or
 * treat them as hard rejections (the API route at
 * `src/app/api/carousels/route.ts` rejects 400 when any warning fires).
 */
export function validatePaletteContrast(style: CarouselStyle): string[] {
  const warnings: string[] = [];
  const lBg = relativeLuminance(style.colors.background);
  const lPrimary = relativeLuminance(style.colors.primary);
  const lAccent = relativeLuminance(style.colors.accent);
  const delta = (a: number, b: number) => Math.abs(a - b);
  if (delta(lAccent, lBg) < 0.15) {
    warnings.push(
      `Accent (${style.colors.accent}) is too close to background (${style.colors.background}) — will not be visible.`
    );
  }
  if (delta(lAccent, lPrimary) < 0.15) {
    warnings.push(
      `Accent (${style.colors.accent}) is too close to primary (${style.colors.primary}) — will clash or vanish.`
    );
  }
  if (delta(lPrimary, lBg) < 0.4) {
    warnings.push(
      `Primary (${style.colors.primary}) and background (${style.colors.background}) are too close in luminance — text will be unreadable.`
    );
  }
  return warnings;
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace(/^#/, "");
  if (cleaned.length !== 6 && cleaned.length !== 3) return null;
  const expand = (s: string) =>
    cleaned.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const full = expand(cleaned);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}