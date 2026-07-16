/**
 * platform-ratios.ts — Single source of truth for platform→ratio on the
 * trustiify.agency side. Hard-coded so the composer can decide whether
 * outpainting is needed without a network round-trip to the engine.
 *
 * Mirrors the engine's `platformMap.ts` after the 2026-07-15 spec change:
 *   4:5  (1080x1350) — Instagram, TikTok, Facebook, Threads
 *   1:1  (1080x1080) — LinkedIn, Reddit, Bluesky, YouTube, Discord, Telegram, Google Business
 *   16:9 (1600x900)  — X (Twitter)
 *   2:3  (1000x1500) — Pinterest
 *
 * NOTE: trustiify uses "twitter" as the UI platform id (matches the
 * Twitter/X rebrand), while the engine uses "x". The `toEnginePlatform`
 * helper does the rename before forwarding to the engine.
 */

export type RatioKey = "1x1" | "4x5" | "16x9" | "2x3";

export interface PlatformSpec {
  width: number;
  height: number;
  ratio: string;
  ratioKey: RatioKey;
}

export interface RatioGroup {
  ratioKey: RatioKey;
  ratio: string;
  width: number;
  height: number;
  platforms: string[];
}

export const PLATFORM_SPECS: Record<string, PlatformSpec> = {
  // 4:5
  instagram: { width: 1080, height: 1350, ratio: "4:5", ratioKey: "4x5" },
  tiktok:    { width: 1080, height: 1350, ratio: "4:5", ratioKey: "4x5" },
  facebook:  { width: 1080, height: 1350, ratio: "4:5", ratioKey: "4x5" },
  threads:   { width: 1080, height: 1350, ratio: "4:5", ratioKey: "4x5" },
  // 1:1
  linkedin:        { width: 1080, height: 1080, ratio: "1:1", ratioKey: "1x1" },
  reddit:          { width: 1080, height: 1080, ratio: "1:1", ratioKey: "1x1" },
  bluesky:         { width: 1000, height: 1000, ratio: "1:1", ratioKey: "1x1" },
  youtube:         { width: 1080, height: 1080, ratio: "1:1", ratioKey: "1x1" },
  discord:         { width: 1080, height: 1080, ratio: "1:1", ratioKey: "1x1" },
  telegram:        { width: 1080, height: 1080, ratio: "1:1", ratioKey: "1x1" },
  google_business: { width: 1080, height: 1080, ratio: "1:1", ratioKey: "1x1" },
  // 16:9
  twitter:  { width: 1600, height: 900,  ratio: "16:9", ratioKey: "16x9" },
  // 2:3
  pinterest:{ width: 1000, height: 1500, ratio: "2:3",  ratioKey: "2x3" },
};

export const RATIO_GROUPS: RatioGroup[] = [
  { ratioKey: "4x5",  ratio: "4:5",  width: 1080, height: 1350, platforms: ["instagram", "tiktok", "facebook", "threads"] },
  { ratioKey: "1x1",  ratio: "1:1",  width: 1080, height: 1080, platforms: ["linkedin", "reddit", "bluesky", "youtube", "discord", "telegram", "google_business"] },
  { ratioKey: "16x9", ratio: "16:9", width: 1600, height: 900,  platforms: ["twitter"] },
  { ratioKey: "2x3",  ratio: "2:3",  width: 1000, height: 1500, platforms: ["pinterest"] },
];

const _groupByKey = new Map<string, RatioGroup>(RATIO_GROUPS.map((g) => [g.ratioKey, g]));
const _specByPlatform = new Map<string, PlatformSpec>(
  Object.entries(PLATFORM_SPECS).map(([k, v]) => [k, v])
);

/**
 * Returns the ratio group for a given ratio key, or undefined.
 */
export function getRatioGroup(ratioKey: string): RatioGroup | undefined {
  return _groupByKey.get(ratioKey);
}

/**
 * Returns the PlatformSpec for a given trustiify platform id, or undefined.
 * Accepts the trustiify UI id (e.g. "twitter", "instagram").
 */
export function getPlatformSpec(platform: string): PlatformSpec | undefined {
  return _specByPlatform.get(platform.toLowerCase().trim());
}

/**
 * Returns the ratio key for a given trustiify platform id, or null.
 */
export function getRatioKeyForPlatform(platform: string): RatioKey | null {
  const spec = getPlatformSpec(platform);
  return spec ? spec.ratioKey : null;
}

/**
 * Returns all supported trustiify platform ids.
 */
export function getSupportedPlatforms(): string[] {
  return Object.keys(PLATFORM_SPECS);
}

/**
 * True if the platform is supported for outpainting.
 */
export function isSupportedPlatform(platform: string): boolean {
  return _specByPlatform.has(platform.toLowerCase().trim());
}

/**
 * Filters a list of platform ids to those that are supported, returning
 * the deduplicated valid list and the unsupported extras.
 */
export function filterValidPlatforms(requested: string[]): {
  valid: string[];
  unsupported: string[];
} {
  const valid: string[] = [];
  const unsupported: string[] = [];
  for (const p of requested) {
    const norm = p.toLowerCase().trim();
    if (isSupportedPlatform(norm)) valid.push(norm);
    else unsupported.push(p);
  }
  return { valid: [...new Set(valid)], unsupported };
}

/**
 * Given a list of trustiify platform ids, return the unique ratio groups
 * needed for AI generation. Deduplicates automatically.
 */
export function getRatioGroupsForPlatforms(platforms: string[]): RatioGroup[] {
  const needed = new Set<string>();
  for (const p of platforms) {
    const key = getRatioKeyForPlatform(p);
    if (key) needed.add(key);
  }
  return RATIO_GROUPS.filter((g) => needed.has(g.ratioKey));
}

/**
 * Returns true if the selected platforms span more than one distinct
 * ratio group — i.e. the composer MUST trigger outpainting before
 * publishing. When false, the existing single-shot publish can be used.
 */
export function needsOutpainting(platforms: string[]): boolean {
  return getRatioGroupsForPlatforms(platforms).length > 1;
}

/**
 * Returns the delivery dimensions for a given platform. Bluesky gets
 * a 1000x1000 crop of the 1:1 variant.
 */
export function getDeliveryDimensions(platform: string): { width: number; height: number } {
  const spec = getPlatformSpec(platform);
  return spec ? { width: spec.width, height: spec.height } : { width: 1080, height: 1080 };
}

/**
 * Translate a trustiify platform id to the engine's canonical name.
 * Currently: "twitter" → "x". Identity for all others.
 */
export function toEnginePlatform(trustiifyId: string): string {
  const norm = trustiifyId.toLowerCase().trim();
  if (norm === "twitter") return "x";
  return norm;
}

/**
 * Translate a list of trustiify platform ids to their engine equivalents.
 */
export function toEnginePlatforms(trustiifyIds: string[]): string[] {
  return trustiifyIds.map(toEnginePlatform);
}

/**
 * Inverse of `toEnginePlatform`. Used when reading engine responses.
 */
export function fromEnginePlatform(engineId: string): string {
  const norm = engineId.toLowerCase().trim();
  if (norm === "x") return "twitter";
  return norm;
}