import type { PlatformId } from "@/lib/platforms";

const PLATFORM_LIMITS: Partial<Record<PlatformId, number>> = {
  bluesky: 300,
  pinterest: 500,
  twitter: 280,
  threads: 500,
};

function xCharacterWeight(char: string): number {
  // X counts URLs as 23 characters and most non-ASCII/emoji characters as 2.
  return /[\u0000-\u007f]/.test(char) ? 1 : 2;
}

function xLength(text: string): number {
  return text.replace(/https?:\/\/[^\s]+/gi, "xxxxxxxxxxxxxxxxxxxxxxx").split("").reduce(
    (total, char) => total + xCharacterWeight(char),
    0,
  );
}

function lengthFor(platform: PlatformId, text: string): number {
  return platform === "twitter" ? xLength(text) : Array.from(text).length;
}

function removeTrailingHashtags(text: string): string {
  return text
    .replace(/(?:\s+#[\p{L}\p{N}_-]+)+\s*$/gu, "")
    .trim();
}

/**
 * Fit a generated caption to the platform without another model request.
 * The algorithm keeps the opening content and ends on a complete sentence
 * whenever possible, removing trailing hashtags before body text.
 */
export function fitCaptionForPlatform(caption: string, platform: PlatformId): string {
  const limit = PLATFORM_LIMITS[platform];
  const source = caption.trim();
  if (!limit || lengthFor(platform, source) <= limit) return source;

  const withoutTags = removeTrailingHashtags(source);
  const candidates = [withoutTags, source].filter(Boolean);
  for (const candidate of candidates) {
    if (lengthFor(platform, candidate) <= limit) return candidate;
  }

  const words = withoutTags.split(/\s+/);
  let best = "";
  for (const word of words) {
    const next = best ? `${best} ${word}` : word;
    if (lengthFor(platform, next) > limit) break;
    best = next;
  }

  const sentenceMatches = [...best.matchAll(/.*?[.!?](?:\s|$)/g)].map((m) => m[0].trim());
  const sentence = sentenceMatches.at(-1) ?? "";
  if (sentence && lengthFor(platform, sentence) >= 24) return sentence;

  const ellipsis = "…";
  let trimmed = best;
  while (trimmed && lengthFor(platform, `${trimmed}${ellipsis}`) > limit) {
    trimmed = trimmed.slice(0, -1).trimEnd();
  }
  return trimmed ? `${trimmed}${ellipsis}` : "";
}
