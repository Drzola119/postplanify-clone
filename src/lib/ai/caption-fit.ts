import type { PlatformId } from "@/lib/platforms";

export const PLATFORM_LIMITS: Record<PlatformId, number> = {
  twitter: 280,
  bluesky: 300,
  threads: 500,
  pinterest: 500,
  google_business: 1500,
  discord: 2000,
  instagram: 2200,
  tiktok: 2200,
  linkedin: 3000,
  telegram: 4096,
  youtube: 5000,
  reddit: 40000,
  facebook: 63206,
};

export function getPlatformLimit(platform: PlatformId): number {
  return PLATFORM_LIMITS[platform] ?? 2200;
}

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

export function lengthFor(platform: PlatformId, text: string): number {
  return platform === "twitter" ? xLength(text) : Array.from(text).length;
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_-]+/gu);
  return matches ? Array.from(new Set(matches)) : [];
}

function removeTrailingHashtags(text: string): string {
  return text
    .replace(/(?:\s+#[\p{L}\p{N}_-]+)+\s*$/gu, "")
    .trim();
}

/**
 * Fit a generated caption to the platform without another model request.
 * The algorithm keeps the opening hook, ends on a complete sentence
 * whenever possible, and re-attaches 1-2 hashtags if room permits.
 */
export function fitCaptionForPlatform(caption: string, platform: PlatformId): string {
  const limit = PLATFORM_LIMITS[platform] ?? 2200;
  const source = caption.trim();
  if (lengthFor(platform, source) <= limit) return source;

  const tags = extractHashtags(source);
  const withoutTags = removeTrailingHashtags(source);

  // If removing trailing hashtags made it fit, return it directly
  if (lengthFor(platform, withoutTags) <= limit) return withoutTags;

  // Try fitting words
  const words = withoutTags.split(/\s+/);
  let best = "";
  for (const word of words) {
    const next = best ? `${best} ${word}` : word;
    if (lengthFor(platform, next) > limit) break;
    best = next;
  }

  // Check if we can end on a clean sentence
  const sentenceMatches = [...best.matchAll(/.*?[.!?](?:\s|$)/g)].map((m) => m[0].trim());
  const sentence = sentenceMatches.at(-1) ?? "";
  let baseTrimmed = sentence && lengthFor(platform, sentence) >= Math.min(24, Math.floor(limit * 0.4))
    ? sentence
    : best;

  if (!baseTrimmed) {
    const ellipsis = "…";
    let trimmed = withoutTags;
    while (trimmed && lengthFor(platform, `${trimmed}${ellipsis}`) > limit) {
      trimmed = trimmed.slice(0, -1).trimEnd();
    }
    baseTrimmed = trimmed ? `${trimmed}${ellipsis}` : "";
  }

  // Try appending 1 or 2 relevant tags back if there is space
  if (tags.length > 0 && baseTrimmed) {
    const candidateWithTag = `${baseTrimmed} ${tags[0]}`;
    if (lengthFor(platform, candidateWithTag) <= limit) {
      if (tags.length > 1) {
        const candidateWith2Tags = `${baseTrimmed} ${tags[0]} ${tags[1]}`;
        if (lengthFor(platform, candidateWith2Tags) <= limit) {
          return candidateWith2Tags;
        }
      }
      return candidateWithTag;
    }
  }

  return baseTrimmed;
}
