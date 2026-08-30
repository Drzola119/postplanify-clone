/**
 * Minimal RFC4180-ish CSV parser used by the bulk-schedule page.
 * Supports quoted fields with embedded commas/newlines and `""` escapes.
 * Strips UTF-8 BOM. Returns { headers, rows } where headers is a lowercased
 * array of column names and rows is an array of string arrays (one per data row).
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  // Strip BOM if present so the first header doesn't get a stray ﻿.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n" || c === "\r") {
        if (cur !== "" || row.length > 0) {
          row.push(cur);
          rows.push(row);
          row = [];
          cur = "";
        }
        if (c === "\r" && src[i + 1] === "\n") i++;
      } else {
        cur += c;
      }
    }
  }
  if (cur !== "" || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  const headers = (rows.shift() ?? []).map((h) => h.trim().toLowerCase());
  return { headers, rows: rows.filter((r) => r.some((c) => c.trim() !== "")) };
}

const PLATFORM_ALIASES: Record<string, string> = {
  twitter: "twitter",
  x: "twitter",
  instagram: "instagram",
  ig: "instagram",
  facebook: "facebook",
  fb: "facebook",
  tiktok: "tiktok",
  tt: "tiktok",
  youtube: "youtube",
  yt: "youtube",
  linkedin: "linkedin",
  li: "linkedin",
  threads: "threads",
  th: "threads",
  pinterest: "pinterest",
  pin: "pinterest",
  bluesky: "bluesky",
  bsky: "bluesky",
  reddit: "reddit",
  rd: "reddit",
  google_business: "google_business",
  googlebusiness: "google_business",
  google: "google_business",
  gmb: "google_business",
  gbp: "google_business",
  telegram: "telegram",
  tg: "telegram",
  discord: "discord",
  dc: "discord",
};

export function normalizePlatforms(raw: string): string[] {
  const out = new Set<string>();
  for (const tok of raw.split(/[,|/;]/).map((s) => s.trim().toLowerCase()).filter(Boolean)) {
    const mapped = PLATFORM_ALIASES[tok];
    if (mapped) out.add(mapped);
  }
  return Array.from(out);
}

export function normalizeHashtags(raw: string): string[] {
  return raw
    .split(/[,|;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => (s.startsWith("#") ? s : `#${s}`));
}

/**
 * Parses one or multiple media URLs from a CSV cell.
 * Supports pipe `|`, semicolon `;`, newline `\n`, or comma-separated lists of URLs.
 */
export function normalizeMediaUrls(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  const parts = raw
    .split(/(?:[\r\n|;]+|,(?=https?:\/\/))/g)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
  return Array.from(new Set(parts));
}

export function normalizePostType(raw: string): "standard" | "carousel" | "trial_reel" | "document" {
  const clean = (raw || "").trim().toLowerCase().replace(/[-_\s]+/g, "");
  if (clean.includes("carousel") || clean.includes("gallery") || clean.includes("album")) return "carousel";
  if (clean.includes("trial") || clean.includes("trialreel")) return "trial_reel";
  if (clean.includes("document") || clean.includes("pdf") || clean.includes("doc")) return "document";
  return "standard";
}

export function normalizePlacement(raw: string): "feed" | "story" {
  const clean = (raw || "").trim().toLowerCase();
  if (clean.includes("story") || clean.includes("stories")) return "story";
  return "feed";
}
