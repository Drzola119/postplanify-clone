import { getPlatform, type PlatformId } from "@/lib/platforms";

export type DraftMediaKind = "image" | "video" | "none";

export interface DraftAccount {
  id: string;
  /** Display handle for the connected account. Empty when the workspace has no
   *  account resolved for this platform yet — surfaces as `null` in the UI. */
  handle: string;
  platform: PlatformId;
}

export interface DraftRow {
  id: string;
  mediaType: DraftMediaKind;
  mediaUrl?: string;
  caption: string;
  accounts: DraftAccount[];
  /** ISO 8601 timestamp. All sorts use this directly. */
  updatedAt: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** Number of media items (0 = text-only). */
  mediaCount: number;
}

export type DraftSortKey = "recent" | "oldest" | "az";

/**
 * Inputs accepted by `draftToRow`. The local shape (`DraftRecord`) is what
 * lives in `localStorage`; the API shape is what the server returns from
 * `/api/drafts`. Both produce the same `DraftRow` so the table renders a
 * single source of truth.
 */
export interface DraftRecordLike {
  id: string;
  updatedAt: number | string;
  createdAt?: number | string;
  caption?: string;
  captions?: Record<string, string>;
  selected?: PlatformId[];
  platforms?: PlatformId[];
  mediaItems?: Array<{ kind?: "image" | "video"; type?: "image" | "video"; cdnUrl?: string; remoteUrl?: string; url?: string }>;
  tagUsers?: string | string[];
}

const KNOWN_PLATFORMS = new Set<PlatformId>([
  "bluesky",
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "twitter",
  "linkedin",
  "threads",
  "facebook",
  "discord",
  "telegram",
  "reddit",
  "google_business",
]);

/** Pick a sensible primary caption from a local record. Prefer the longest
 *  per-platform caption so the table shows the most fleshed-out content; only
 *  fall back to the tag-user noise when no caption was ever typed. */
function pickPrimaryCaption(rec: DraftRecordLike): string {
  const captions = rec.captions ?? {};
  let best = "";
  for (const v of Object.values(captions)) {
    if (typeof v === "string" && v.length > best.length) best = v;
  }
  if (best) return best;
  if (rec.caption && rec.caption.length > 0) return rec.caption;
  // Last resort: tag-users string is *not* a caption — return empty so the
  // table shows the empty-state placeholder instead of misleading the user.
  return "";
}

function toPlatformIds(rec: DraftRecordLike): PlatformId[] {
  const candidates: unknown[] = (rec.selected && rec.selected.length > 0)
    ? rec.selected
    : (rec.platforms ?? []);
  const out: PlatformId[] = [];
  const seen = new Set<PlatformId>();
  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    if (!KNOWN_PLATFORMS.has(raw as PlatformId)) continue;
    const id = raw as PlatformId;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function firstMedia(rec: DraftRecordLike): { kind: DraftMediaKind; url?: string } {
  const items = rec.mediaItems ?? [];
  for (const m of items) {
    const url = m.cdnUrl ?? m.remoteUrl ?? m.url;
    if (url) return { kind: m.kind ?? m.type ?? "image", url };
  }
  return { kind: "none" };
}

function toIso(value: number | string | undefined, fallback: string): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return fallback;
    return new Date(value).toISOString();
  }
  if (typeof value === "string") {
    const t = Date.parse(value);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }
  return fallback;
}

/** Convert either a local record or an API payload into a single `DraftRow`. */
export function draftToRow(rec: DraftRecordLike): DraftRow {
  const now = new Date().toISOString();
  const updatedAt = toIso(rec.updatedAt, now);
  const createdAt = toIso(rec.createdAt ?? rec.updatedAt, now);
  const platforms = toPlatformIds(rec);
  const media = firstMedia(rec);
  return {
    id: rec.id,
    mediaType: media.kind,
    mediaUrl: media.url,
    caption: pickPrimaryCaption(rec),
    accounts: platforms.map((p, i) => ({
      id: `${rec.id}-${p}-${i}`,
      handle: getPlatform(p)?.handle ?? "",
      platform: p,
    })),
    updatedAt,
    createdAt,
    mediaCount: (rec.mediaItems ?? []).length,
  };
}

/** Case-insensitive match across caption text, account handles, and platform
 *  display names. Empty/whitespace queries match everything. */
export function matchesSearch(row: DraftRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (row.caption.toLowerCase().includes(q)) return true;
  for (const acc of row.accounts) {
    if (acc.handle.toLowerCase().includes(q)) return true;
    const name = getPlatform(acc.platform)?.name ?? "";
    if (name.toLowerCase().includes(q)) return true;
  }
  return false;
}

/** Sort by `updatedAt` ISO timestamp. Stable, locale-independent. */
export function sortDrafts(rows: DraftRow[], key: DraftSortKey): DraftRow[] {
  const out = rows.slice();
  if (key === "az") {
    out.sort((a, b) => a.caption.localeCompare(b.caption));
  } else {
    out.sort((a, b) => {
      const ta = Date.parse(a.updatedAt) || 0;
      const tb = Date.parse(b.updatedAt) || 0;
      return key === "recent" ? tb - ta : ta - tb;
    });
  }
  return out;
}

/** Format an ISO timestamp as a short date + 24h time pair in a given locale. */
export function formatRowDateTime(iso: string, locale: string = "en-US"): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "" };
  return {
    date: d.toLocaleDateString(locale, { month: "short", day: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}
