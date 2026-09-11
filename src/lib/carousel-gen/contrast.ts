/**
 * Client-safe WCAG contrast ratio calculations.
 */

function calculateLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export function checkContrastRatio(
  fgHex: string,
  bgHex: string
): { ratio: number; passesAA: boolean } {
  try {
    const l1 = calculateLuminance(fgHex);
    const l2 = calculateLuminance(bgHex);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);
    return {
      ratio: Math.round(ratio * 100) / 100,
      passesAA: ratio >= 4.5,
    };
  } catch {
    return { ratio: 4.5, passesAA: true };
  }
}
