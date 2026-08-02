/**
 * carousel-gen/manual-styles.ts
 *
 * Client-side persistence for M2 user-built styles. Backed by
 * localStorage so a workspace can have many manual brand styles
 * without a server round-trip. Each saved style carries its full
 * CarouselStyle fields so the server can validate them at commit
 * time (it never trusts the client but it will accept the snapshot).
 *
 * Also re-exports the curated font palette the wizard renders —
 * kept here rather than in styles.ts so the picker UI can import
 * both lists from one place.
 */

import type { CarouselStyle } from "./types";

export const DISPLAY_FONTS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "Archivo Black", label: "Archivo Black — heavy condensed" },
  { value: "Bebas Neue", label: "Bebas Neue — tall condensed" },
  { value: "Anton", label: "Anton — bold condensed" },
  { value: "Space Grotesk", label: "Space Grotesk — geometric" },
  { value: "Playfair Display", label: "Playfair Display — serif" },
  { value: "DM Serif Display", label: "DM Serif Display — high-contrast serif" },
];

export const BODY_FONTS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "Inter", label: "Inter — neutral workhorse" },
  { value: "Manrope", label: "Manrope — modern geometric" },
  { value: "IBM Plex Sans", label: "IBM Plex Sans — editorial" },
  { value: "Source Sans 3", label: "Source Sans 3 — classic" },
  { value: "Work Sans", label: "Work Sans — friendly" },
  { value: "Lora", label: "Lora — serif body" },
];

const STORAGE_KEY = "postplanify.carouselStyles.v1";

/**
 * What the wizard saves. Mirrors CarouselStyle + the user-facing name
 * and a timestamp for the picker UI. `label` in CarouselStyle is the
 * internal descriptor; the UI shows `name`.
 */
export interface SavedCarouselStyle extends CarouselStyle {
  /** User-typed name, shown in the picker. */
  name: string;
  /** UNIX ms when saved. */
  savedAt: number;
}

export function loadUserStyles(): SavedCarouselStyle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is SavedCarouselStyle =>
        typeof s === "object" &&
        s !== null &&
        typeof s.id === "string" &&
        typeof s.name === "string" &&
        typeof s.colors === "object" &&
        typeof s.fonts === "object" &&
        typeof s.layouts === "object"
    );
  } catch {
    return [];
  }
}

export function saveUserStyle(style: SavedCarouselStyle): void {
  if (typeof window === "undefined") return;
  const existing = loadUserStyles();
  const next = [...existing.filter((s) => s.id !== style.id), style];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function deleteUserStyle(id: string): void {
  if (typeof window === "undefined") return;
  const next = loadUserStyles().filter((s) => s.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/**
 * Build a stable id for a user-style. Hash-based so re-saving with
 * the same name + colors doesn't create duplicates and so the wizard
 * can dedupe across sessions.
 */
export function deriveStyleId(input: {
  name: string;
  colors: CarouselStyle["colors"];
}): string {
  const seed = `${input.name}|${input.colors.primary}|${input.colors.background}|${input.colors.accent}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return `palette-${(hash >>> 0).toString(36)}`;
}
