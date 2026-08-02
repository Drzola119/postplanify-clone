/**
 * carousel-gen/palette.ts
 *
 * Pure color-theory math for the M2 Palette Builder. Deterministic
 * HSL rotations — no AI, no network calls — so the wizard can run
 * the math on every keystroke if needed.
 *
 * Each harmony returns 4 swatch variations the user can flip through
 * with arrow buttons. All four come from the same base color so the
 * picker feels like "find the right variant of this color" rather
 * than "pick a new color from scratch four times."
 *
 * Accessibility: validatePaletteContrast() in palette-contrast.ts can
 * warn if a generated palette fails the WCAG delta checks at submit
 * time. The math here is conservative (background = near-white tint
 * of base, primary = dark version of base) so most combos pass.
 */

export type PaletteHarmony =
  | "complementary"
  | "analogous"
  | "triadic"
  | "monochromatic";

export interface CarouselPalette {
  /** Primary brand color — used for headlines / dominant text. */
  primary: string;
  /** Canvas background — always a near-white tint of base. */
  background: string;
  /** Accent — the harmony pivot, used sparingly for emphasis only. */
  accent: string;
}

export interface PaletteSwatch extends CarouselPalette {
  /** Human-readable label for the variant chip ("Triadic +120" etc.). */
  label: string;
}

/**
 * Build 4 palette variants for a base color + harmony. Variants differ
 * in accent hue offset, saturation, or lightness — enough range that
 * one of them will feel right without forcing the user to start over.
 */
export function buildPaletteVariants(
  baseHex: string,
  harmony: PaletteHarmony
): PaletteSwatch[] {
  const base = hexToHsl(baseHex);
  switch (harmony) {
    case "complementary":
      return [
        buildSwatch(base, 180, 70, 55, "Complementary · 180°"),
        buildSwatch(base, 165, 70, 55, "Split-complementary · 165°"),
        buildSwatch(base, 195, 65, 55, "Split-complementary · 195°"),
        buildSwatch(base, 180, 80, 50, "Complementary · punchy"),
      ];
    case "analogous":
      return [
        buildSwatch(base, 30, 65, 55, "Analogous · +30°"),
        buildSwatch(base, -30, 65, 55, "Analogous · −30°"),
        buildSwatch(base, 60, 70, 55, "Analogous · +60°"),
        buildSwatch(base, -60, 70, 55, "Analogous · −60°"),
      ];
    case "triadic":
      return [
        buildSwatch(base, 120, 70, 55, "Triadic · +120°"),
        buildSwatch(base, -120, 70, 55, "Triadic · −120°"),
        buildSwatch(base, 120, 55, 60, "Triadic muted · +120°"),
        buildSwatch(base, -120, 55, 60, "Triadic muted · −120°"),
      ];
    case "monochromatic":
      return [
        buildSwatch(base, 0, 80, 55, "Mono · bold accent"),
        buildSwatch(base, 0, 65, 50, "Mono · strong accent"),
        buildSwatch(base, 0, 90, 60, "Mono · soft accent"),
        buildSwatch(base, 0, 70, 45, "Mono · deep accent"),
      ];
  }
}

function buildSwatch(
  base: HSL,
  accentOffset: number,
  accentSat: number,
  accentLight: number,
  label: string
): PaletteSwatch {
  const background = hslToHex({
    h: base.h,
    s: clamp(base.s * 0.2, 6, 18),
    l: 97,
  });
  const primary = hslToHex({
    h: base.h,
    s: clamp(base.s, 30, 90),
    l: 16,
  });
  const accent = hslToHex({
    h: (base.h + accentOffset + 360) % 360,
    s: clamp(accentSat, 30, 95),
    l: clamp(accentLight, 40, 65),
  });
  return { primary, background, accent, label };
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): HSL {
  const cleaned = hex.replace(/^#/, "");
  if (cleaned.length !== 3 && cleaned.length !== 6) return { h: 0, s: 0, l: 50 };
  const expanded =
    cleaned.length === 3
      ? cleaned.split("").map((c) => c + c).join("")
      : cleaned;
  const n = Number.parseInt(expanded, 16);
  if (Number.isNaN(n)) return { h: 0, s: 0, l: 50 };
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex({ h, s, l }: HSL): string {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Friendly label for each harmony value — shown in the harmony dropdown.
 * Kept here (and not in i18n) so the picker can render server-side and
 * client-side identically when a harmony is in use.
 */
export const HARMONY_OPTIONS: ReadonlyArray<{
  id: PaletteHarmony;
  label: string;
  description: string;
}> = [
  {
    id: "complementary",
    label: "Complementary",
    description: "Accent sits 180° from base — high contrast, bold.",
  },
  {
    id: "analogous",
    label: "Analogous",
    description: "Accent sits ±30°–60° from base — calm, cohesive.",
  },
  {
    id: "triadic",
    label: "Triadic",
    description: "Two accents 120° apart — playful but balanced.",
  },
  {
    id: "monochromatic",
    label: "Monochromatic",
    description: "Same hue, varied lightness — quietest, safest.",
  },
];
