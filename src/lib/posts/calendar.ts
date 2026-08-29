import type { PostStatus, PlatformId } from "@/lib/db/schema";
import { postStatusSchema, platformIdSchema } from "@/lib/validation/posts";

export type CalendarStatus = PostStatus;
export type CalendarPlatform = PlatformId;

/** Public shape returned by /api/posts (after serialization). */
export interface CalendarPost {
  id: string;
  workspaceId?: string;
  status: CalendarStatus;
  caption: string;
  platforms: CalendarPlatform[];
  mediaUrls: string[];
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  hashtags?: string[];
  labels?: string[];
  firstComment?: string;
  community?: string;
  quoteTweetUrl?: string;
  threadRootId?: string;
  postIn?: "feed" | "story";
  youtubeTitle?: string;
  youtubeTags?: string;
  pinterestBoard?: string;
  autoAddMusic?: boolean;
  profile?: string;
  failureReason?: string;
}

const KNOWN_STATUSES = new Set<CalendarStatus>([
  "draft",
  "queued",
  "scheduled",
  "publishing",
  "published",
  "partially_published",
  "failed",
  "archived",
  "paused",
]);

const KNOWN_PLATFORMS = new Set<CalendarPlatform>([
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
  "google_business",
]);

/**
 * Defensive normalizer for API payloads. Drops unknown statuses/platforms
 * instead of throwing so one malformed doc can't crash the calendar lookup.
 */
export function normalizeStatus(value: unknown): CalendarStatus {
  if (typeof value !== "string") return "draft";
  if (KNOWN_STATUSES.has(value as CalendarStatus)) return value as CalendarStatus;
  const parsed = postStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "draft";
}

export function normalizePlatforms(value: unknown): CalendarPlatform[] {
  if (!Array.isArray(value)) return [];
  const out: CalendarPlatform[] = [];
  const seen = new Set<CalendarPlatform>();
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    if (!KNOWN_PLATFORMS.has(raw as CalendarPlatform)) continue;
    const id = raw as CalendarPlatform;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export interface PostFilters {
  search?: string;
  mediaKind?: "any" | "text" | "image" | "video";
  status?: CalendarStatus | "all";
  platform?: CalendarPlatform | "all";
  /** ISO date YYYY-MM-DD inclusive lower bound on scheduledAt / publishedAt. */
  fromDate?: string;
  /** ISO date YYYY-MM-DD inclusive upper bound on scheduledAt / publishedAt. */
  toDate?: string;
}

function mediaKindOfUrl(u: string): "image" | "video" | "other" {
  const lower = u.toLowerCase();
  // Handle CDN URLs without extensions (e.g. Bunny ?format=, signed URLs)
  // by checking both path extension and common query hints.
  if (lower.includes(".mp4") || lower.includes(".mov") || lower.includes(".webm") || lower.includes(".m4v") || lower.includes("video")) return "video";
  if (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".gif") ||
    lower.includes(".webp") ||
    lower.includes(".heic") ||
    lower.includes(".heif") ||
    lower.includes("image")
  )
    return "image";
  // Fallback to strict extension check
  if (/\.(jpe?g|png|gif|webp|bmp|heic|heif)(\?|$)/i.test(u)) return "image";
  if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(u)) return "video";
  return "other";
}

export function postMatchesFilters(post: CalendarPost, f: PostFilters, timeZone = "UTC"): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const haystack = [post.caption, ...(post.hashtags ?? []), ...(post.labels ?? []), post.firstComment ?? "", post.profile ?? "", post.youtubeTitle ?? "", post.community ?? ""].join(" ").toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (f.status && f.status !== "all" && post.status !== f.status) return false;
  if (f.platform && f.platform !== "all" && !post.platforms.includes(f.platform)) return false;
  if (f.mediaKind && f.mediaKind !== "any") {
    const urls = post.mediaUrls ?? [];
    const kinds = urls.map(mediaKindOfUrl);
    const hasImage = kinds.includes("image");
    const hasVideo = kinds.includes("video");
    if (f.mediaKind === "image" && !hasImage) return false;
    if (f.mediaKind === "video" && !hasVideo) return false;
    if (f.mediaKind === "text" && urls.length > 0) return false;
  }
  if (f.fromDate || f.toDate) {
    const stamp = post.scheduledAt ?? post.publishedAt ?? post.createdAt;
    if (!stamp) return false;
    // Use timezone-aware date, not UTC slice, so "Any date" in Africa/Lagos
    // matches what the user sees in the calendar grid.
    const { date: zonedDate } = formatInZone(stamp, timeZone);
    const iso = zonedDate || stamp.slice(0, 10);
    if (f.fromDate && iso < f.fromDate) return false;
    if (f.toDate && iso > f.toDate) return false;
  }
  return true;
}

/** Sort newest-first by (scheduledAt || publishedAt || createdAt). */
export function comparePostsChronologically(a: CalendarPost, b: CalendarPost): number {
  const ta = Date.parse(a.scheduledAt ?? a.publishedAt ?? a.createdAt ?? "") || 0;
  const tb = Date.parse(b.scheduledAt ?? b.publishedAt ?? b.createdAt ?? "") || 0;
  return tb - ta;
}

export function groupPostsByDay(posts: CalendarPost[], timeZone = "UTC"): Record<string, CalendarPost[]> {
  const out: Record<string, CalendarPost[]> = {};
  for (const p of posts) {
    const stamp = p.scheduledAt ?? p.publishedAt ?? p.createdAt;
    if (!stamp) continue;
    const { date } = formatInZone(stamp, timeZone);
    const day = date || stamp.slice(0, 10);
    if (!out[day]) out[day] = [];
    out[day].push(p);
  }
  return out;
}

/** Returns [start, end) YYYY-MM-DD pair for the week containing `d`, Monday-first. */
export function weekBounds(d: Date): { start: Date; end: Date } {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = start.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  start.setDate(start.getDate() + offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

export function monthGridStart(d: Date): Date {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const dow = first.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const out = new Date(first);
  out.setDate(first.getDate() + offset);
  return out;
}

export function fmtISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Map a UTC ISO instant + timezone → { date, time } strings in that timezone.
 * Falls back to UTC when the timezone is unknown.
 */
export function formatInZone(iso: string | undefined, timeZone: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** Parse YYYY-MM-DD into a local-time Date. Returns null on malformed input. */
export function parseISODate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}
