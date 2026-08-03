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
  youtube: "youtube",
  yt: "youtube",
  linkedin: "linkedin",
  threads: "threads",
  pinterest: "pinterest",
  bluesky: "bluesky",
  bsky: "bluesky",
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
