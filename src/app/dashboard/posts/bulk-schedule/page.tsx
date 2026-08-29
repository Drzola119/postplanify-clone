"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Upload,
  UploadCloud,
  Calendar,
  X,
  Sparkles,
  ChevronDown,
  Plus,
  ImagePlus,
  Undo2,
  Download,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORMS, getPlatform, type PlatformId } from "@/lib/platforms";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import { parseCsv, normalizePlatforms, normalizeHashtags } from "@/lib/bulk-schedule/csv";
import { zonedDateTimeToDate } from "@/lib/datetime/zoned";

type BulkItemSource = "upload" | "csv";

type BulkItemBase = {
  id: string;
  url: string;
  kind: "image" | "video";
  name: string;
  size: number;
  caption: string;
  scheduledAt: string;
  scheduledDate: string;
  scheduledTime: string;
  accountIds: PlatformId[];
  postIn: "feed" | "story";
  youtubeTitle: string;
  youtubeTags: string;
  pinterestBoard: string;
  autoAddMusic: boolean;
  community: boolean;
  profile: string;
  hashtags: string[];
  uploadStatus: "uploading" | "ready" | "error";
  uploadError?: string;
  uploadProgress?: number;
};

type UploadedBulkItem = BulkItemBase & {
  source: "upload";
  file: File;
  /** Local object URL for preview; revoked on remove/unmount. */
  previewUrl: string;
  /** Stored path on CDN, used for cleanup. */
  storedPath?: string;
};

type CsvBulkItem = BulkItemBase & {
  source: "csv";
  /** Remote media URL from the CSV's mediaurl column. */
  mediaUrl: string;
};

type BulkItem = UploadedBulkItem | CsvBulkItem;

const MAX_FILES = 20;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_BULK_PAYLOAD_FILES = 100;
const MAX_FUTURE_DAYS = 365;
const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

const TIMEZONES = [
  { id: "Africa/Lagos", label: "Africa/Lagos" },
  { id: "America/New_York", label: "America/New_York" },
  { id: "America/Los_Angeles", label: "America/Los_Angeles" },
  { id: "Europe/London", label: "Europe/London" },
  { id: "Europe/Paris", label: "Europe/Paris" },
  { id: "Asia/Dubai", label: "Asia/Dubai" },
  { id: "Asia/Tokyo", label: "Asia/Tokyo" },
  { id: "UTC", label: "UTC" },
];

const INTERVALS = [
  { id: "1d", label: "Daily" },
  { id: "3d", label: "Every 3 days" },
  { id: "7d", label: "Weekly" },
  { id: "14d", label: "Every 2 weeks" },
  { id: "30d", label: "Monthly" },
];

const STORAGE_KEY = "pp.bulk-schedule.draft.v1";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultTime(): string {
  return "08:00";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function splitDateTime(dt: string): { date: string; time: string } {
  if (!dt || !dt.includes("T")) return { date: todayISO(), time: "08:00" };
  const [date, time] = dt.split("T");
  return { date: date || todayISO(), time: (time || "08:00").slice(0, 5) };
}

/**
 * Convert a wall-clock date+time in the chosen timezone to a UTC Date.
 * The browser has no direct timezone-conversion API, so we round-trip via
 * `toLocaleString` to read the offset and flip the local fields to UTC.
 */
function wallClockToUTC(date: string, time: string, timezone: string): Date | null {
  const [hh, mm] = time.split(":").map((s) => parseInt(s, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const [y, m, d] = date.split("-").map((s) => parseInt(s, 10));
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return zonedDateTimeToDate({ year: y, month: m, day: d, hour: hh, minute: mm }, timezone);
}

function pickCharLimitFor(item: BulkItem): number {
  // Pick the strictest limit among selected platforms (matches upload-post behaviour).
  let min = 2200;
  for (const id of item.accountIds) {
    const p = PLATFORMS.find((pl) => pl.id === id);
    if (p && p.charLimit < min) min = p.charLimit;
  }
  return min;
}

interface ValidationIssue {
  itemId: string;
  message: string;
}

function validateItems(items: BulkItem[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const now = Date.now();
  for (const it of items) {
    if (!it.caption.trim()) {
      issues.push({ itemId: it.id, message: "Caption is required" });
    }
    if (it.accountIds.length === 0) {
      issues.push({ itemId: it.id, message: "No platforms selected" });
    }
    if (it.accountIds.includes("youtube") && !it.youtubeTitle.trim()) {
      issues.push({ itemId: it.id, message: "YouTube title is required" });
    }
    if (it.accountIds.includes("pinterest") && !it.pinterestBoard.trim()) {
      issues.push({ itemId: it.id, message: "Pinterest board is required" });
    }
    if (it.source === "upload" && it.uploadStatus !== "ready") {
      issues.push({ itemId: it.id, message: "Still uploading to CDN" });
    }
    if (it.source === "upload" && !it.url.startsWith("https://")) {
      issues.push({ itemId: it.id, message: "Media not on CDN" });
    }
    const scheduled = Date.parse(it.scheduledAt);
    if (Number.isNaN(scheduled)) {
      issues.push({ itemId: it.id, message: "Invalid scheduled time" });
    } else if (scheduled <= now + 60_000) {
      issues.push({ itemId: it.id, message: "Scheduled time must be in the future" });
    } else if (scheduled - now > MAX_FUTURE_DAYS * 24 * 60 * 60 * 1000) {
      issues.push({ itemId: it.id, message: `More than ${MAX_FUTURE_DAYS} days ahead` });
    }
  }
  return issues;
}

/** Persist only CSV items + scheduler settings — uploaded files aren't serializable. */
interface PersistedDraft {
  csvItems: CsvBulkItem[];
  accounts: PlatformId[];
  startDate: string;
  startTime: string;
  postsPerDay: number;
  interval: string;
  timezone: string;
}

function loadPersistedDraft(): PersistedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedDraft) : null;
  } catch {
    return null;
  }
}

function savePersistedDraft(draft: PersistedDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Quota / private mode — ignore.
  }
}

function clearPersistedDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function BulkSchedulePage() {
  const t = useTranslations("dashboard");
  const { toast } = useToast();
  const { getIdToken } = useAuth();
  const [items, setItems] = useState<BulkItem[]>([]);
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [startTime, setStartTime] = useState<string>(defaultTime());
  const [postsPerDay, setPostsPerDay] = useState<number>(1);
  const [interval, setInterval] = useState<string>("1d");
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const [tzOpen, setTzOpen] = useState(false);
  const [accounts, setAccounts] = useState<Set<PlatformId>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [undoStack, setUndoStack] = useState<Array<{ kind: "remove"; item: BulkItem; index: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const tzRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  function scheduledSlot(index: number): { scheduledAt: string; date: string; time: string } | null {
    const [year, month, day] = startDate.split("-").map(Number);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    if ([year, month, day, startHour, startMinute].some((value) => !Number.isInteger(value))) return null;
    const perDay = Math.max(1, postsPerDay);
    const intervalDays = parseInt(interval, 10) || 1;
    const dayOffset = Math.floor(index / perDay) * intervalDays;
    const slotOffsetMinutes = (index % perDay) * 30;
    // Use UTC setters only as timezone-neutral calendar arithmetic. The final
    // wall-clock fields are then converted in the user's selected timezone.
    const wall = new Date(Date.UTC(year, month - 1, day + dayOffset, startHour, startMinute + slotOffsetMinutes));
    const localYear = wall.getUTCFullYear();
    const localMonth = wall.getUTCMonth() + 1;
    const localDay = wall.getUTCDate();
    const localHour = wall.getUTCHours();
    const localMinute = wall.getUTCMinutes();
    const instant = zonedDateTimeToDate({
      year: localYear,
      month: localMonth,
      day: localDay,
      hour: localHour,
      minute: localMinute,
    }, timezone);
    if (!instant) return null;
    return {
      scheduledAt: instant.toISOString(),
      date: `${localYear}-${String(localMonth).padStart(2, "0")}-${String(localDay).padStart(2, "0")}`,
      time: `${String(localHour).padStart(2, "0")}:${String(localMinute).padStart(2, "0")}`,
    };
  }

  // Auto-detect timezone on first mount; fall back to a value from the list
  // so the dropdown's label matches the user's wall-clock.
  useEffect(() => {
    try {
      const guess = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (guess && TIMEZONES.some((tz) => tz.id === guess)) {
        setTimezone(guess);
      } else {
        setTimezone("America/New_York");
      }
    } catch {
      setTimezone("America/New_York");
    }
  }, []);

  // Restore persisted CSV draft + scheduler settings (uploaded files are not
  // serializable since their preview URL is a blob: tied to the File object).
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const persisted = loadPersistedDraft();
    if (!persisted) return;
    setStartDate(persisted.startDate);
    setStartTime(persisted.startTime);
    setPostsPerDay(persisted.postsPerDay);
    setInterval(persisted.interval);
    setTimezone(persisted.timezone);
    setAccounts(new Set(persisted.accounts));
    if (persisted.csvItems.length > 0) {
      setItems(persisted.csvItems);
    }
  }, []);

  // Persist on changes (skip the very first render to avoid clobbering).
  useEffect(() => {
    if (!hydratedRef.current) return;
    savePersistedDraft({
      csvItems: items.filter((it): it is CsvBulkItem => it.source === "csv"),
      accounts: Array.from(accounts),
      startDate,
      startTime,
      postsPerDay,
      interval,
      timezone,
    });
  }, [items, accounts, startDate, startTime, postsPerDay, interval, timezone]);

  // Close TZ dropdown on outside click + Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTzOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) {
        setTzOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  // Revoke blob URLs on unmount so we don't leak memory across navigations.
  useEffect(() => {
    return () => {
      setItems((prev) => {
        for (const it of prev) {
          if (it.source === "upload") URL.revokeObjectURL(it.previewUrl);
        }
        return prev;
      });
    };
  }, []);

  const toggleAccount = useCallback((id: PlatformId) => {
    setAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const pickFiles = () => fileInputRef.current?.click();
  const pickMoreFiles = () => addMoreInputRef.current?.click();
  const pickCsvFile = () => csvInputRef.current?.click();

  /**
   * Upload a single file to the CDN. Returns the CDN URL (or null on failure).
   * Surfaces errors via toast so silent skips are no longer possible.
   */
  async function uploadFile(file: File): Promise<{ url: string; storedPath?: string } | null> {
    const idToken = await getIdToken();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "posts");
    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: fd,
        headers: {
          ...getOverrideHeaders(),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        storedPath?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      return { url: data.url, storedPath: data.storedPath };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: `${file.name}: ${msg}`, tone: "error" });
      return null;
    }
  }

  async function handleCsvFile(file: File) {
    setCsvBusy(true);
    try {
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      if (headers.length === 0 || rows.length === 0) {
        toast({ title: t("posts.bulkSchedule.csv_empty"), tone: "error" });
        return;
      }
      const capIdx = headers.indexOf("caption");
      const platformsIdx = headers.indexOf("platforms");
      const scheduledIdx = headers.indexOf("scheduledat");
      const hashtagsIdx = headers.indexOf("hashtags");
      const mediaIdx = headers.indexOf("mediaurl");
      if (capIdx < 0) {
        toast({ title: t("posts.bulkSchedule.csv_missing_column"), tone: "error" });
        return;
      }
      const newItems: CsvBulkItem[] = [];
      const errors: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const caption = (r[capIdx] ?? "").trim();
        if (!caption) {
          errors.push(`Row ${i + 2}: missing caption`);
          continue;
        }
        let platforms: PlatformId[] = (platformsIdx >= 0
          ? (normalizePlatforms(r[platformsIdx] ?? "") as PlatformId[])
          : []);
        if (platforms.length === 0) platforms = Array.from(accounts);
        if (platforms.length === 0) {
          errors.push(`Row ${i + 2}: no platforms (add a "platforms" column or select accounts above)`);
          continue;
        }
        const rawScheduled = (scheduledIdx >= 0 ? r[scheduledIdx] : "").trim();
        const fallbackSlot = scheduledSlot(items.length + newItems.length);
        let scheduledAt = fallbackSlot?.scheduledAt ?? "";
        let date = fallbackSlot?.date ?? todayISO();
        let time = fallbackSlot?.time ?? defaultTime();
        if (rawScheduled) {
          const rawParts = splitDateTime(rawScheduled);
          const hasExplicitOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(rawScheduled);
          const parsedDate = hasExplicitOffset
            ? new Date(rawScheduled)
            : wallClockToUTC(rawParts.date, rawParts.time, timezone);
          if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
            errors.push(`Row ${i + 2}: invalid scheduledAt "${rawScheduled}"`);
            continue;
          }
          scheduledAt = parsedDate.toISOString();
          date = rawParts.date;
          time = rawParts.time;
        }
        const hashtags = hashtagsIdx >= 0 ? normalizeHashtags(r[hashtagsIdx] ?? "") : [];
        const mediaUrl = mediaIdx >= 0 ? (r[mediaIdx] ?? "").trim() : "";
        if (mediaUrl && !/^https?:\/\//i.test(mediaUrl)) {
          errors.push(`Row ${i + 2}: mediaurl must be http(s) (got "${mediaUrl.slice(0, 40)}")`);
          continue;
        }
        newItems.push({
          id: `csv-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          source: "csv",
          url: mediaUrl,
          mediaUrl,
          kind: "image",
          name: `CSV row ${i + 2}`,
          size: 0,
          caption,
          scheduledAt,
          scheduledDate: date,
          scheduledTime: time,
          accountIds: platforms,
          postIn: "feed",
          youtubeTitle: "",
          youtubeTags: "",
          pinterestBoard: "",
          autoAddMusic: false,
          community: false,
          profile: "Default",
          hashtags,
          uploadStatus: mediaUrl ? "ready" : "error",
          uploadError: mediaUrl ? undefined : "Add a mediaurl column or upload media files",
        });
      }
      setItems((prev) => {
        const remaining = Math.max(0, MAX_FILES - prev.length);
        return [...prev, ...newItems.slice(0, remaining)];
      });
      const inserted = Math.min(newItems.length, MAX_FILES);
      if (errors.length > 0) {
        toast({
          title: t("posts.bulkSchedule.csv_imported_skipped", { n: inserted, m: errors.length }),
          description: errors.slice(0, 3).join("\n"),
          tone: "warning",
        });
      } else if (inserted > 0) {
        toast({
          title: t("posts.bulkSchedule.csv_imported", { n: inserted }),
          tone: "success",
        });
      }
    } catch (e) {
      toast({
        title: t("posts.bulkSchedule.csv_read_error"),
        description: e instanceof Error ? e.message : String(e),
        tone: "error",
      });
    } finally {
      setCsvBusy(false);
    }
  }

  async function handleScheduleAll() {
    if (items.length === 0 || scheduleBusy) return;
    const issues = validateItems(items);
    if (issues.length > 0) {
      toast({
        title: "Can't schedule yet",
        description: `${issues.length} item(s) need attention: ${issues.slice(0, 3).map((i) => i.message).join("; ")}`,
        tone: "error",
      });
      return;
    }
    const readyItems = items.slice(0, MAX_BULK_PAYLOAD_FILES);
    setScheduleBusy(true);
    const idempotencyKey = crypto.randomUUID();
    try {
      const idToken = await getIdToken();
      const payload = {
        items: readyItems.map((it) => ({
          caption: it.caption,
          platforms: it.accountIds,
          mediaUrls: it.url ? [it.url] : [],
          scheduledAt: it.scheduledAt ? new Date(it.scheduledAt).toISOString() : undefined,
          hashtags: it.hashtags ?? [],
          status: "scheduled" as const,
          postIn: it.postIn,
          youtubeTitle: it.youtubeTitle || undefined,
          youtubeTags: it.youtubeTags || undefined,
          pinterestBoard: it.pinterestBoard || undefined,
          autoAddMusic: it.autoAddMusic,
          community: it.community || undefined,
          profile: it.profile,
        })),
      };
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          ...getOverrideHeaders(),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? body.error ?? `Bulk schedule failed (${res.status})`);
      }
      const data = (await res.json()) as { count?: number; ids?: string[]; ok?: boolean };
      const n = data.count ?? readyItems.length;
      // Revoke local blob URLs before clearing state.
      setItems((prev) => {
        for (const it of prev) {
          if (it.source === "upload") URL.revokeObjectURL(it.previewUrl);
        }
        return [];
      });
      toast({ title: t("posts.bulkSchedule.scheduled_n", { n }), tone: "success" });
      clearPersistedDraft();
    } catch (e) {
      toast({
        title: t("posts.bulkSchedule.bulk_failed"),
        description: e instanceof Error ? e.message : undefined,
        tone: "error",
      });
    } finally {
      setScheduleBusy(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length > 0) handleFiles(files);
  }

  function onAddMoreDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length > 0) handleFiles(files);
  }

  async function handleFiles(files: File[]) {
    const remaining = Math.max(0, MAX_FILES - items.length);
    if (files.length > remaining) {
      toast({
        title: "Too many files",
        description: `You can only add ${remaining} more file(s) (limit is ${MAX_FILES}).`,
        tone: "warning",
      });
    }
    const accepted = files.slice(0, remaining);
    const skipped: string[] = [];
    const newItems: UploadedBulkItem[] = [];
    let counter = 0;
    for (const file of accepted) {
      if (file.size > MAX_FILE_BYTES) {
        skipped.push(`${file.name} (${formatBytes(file.size)} > ${MAX_FILE_BYTES / 1024 / 1024}MB)`);
        continue;
      }
      if (file.type && !ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
        skipped.push(`${file.name} (unsupported type: ${file.type})`);
        continue;
      }
      const isVideo = file.type.startsWith("video/");
      const kind: "image" | "video" = isVideo ? "video" : "image";
      const slot = scheduledSlot(items.length + counter);
      if (!slot) {
        skipped.push(`${file.name} (invalid schedule date, time, or timezone)`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        source: "upload",
        file,
        previewUrl,
        url: previewUrl,
        kind,
        name: file.name,
        size: file.size,
        caption: "",
        scheduledAt: slot.scheduledAt,
        scheduledDate: slot.date,
        scheduledTime: slot.time,
        accountIds: Array.from(accounts),
        postIn: "feed",
        youtubeTitle: "",
        youtubeTags: "",
        pinterestBoard: "",
        autoAddMusic: false,
        community: false,
        profile: "Default",
        hashtags: [],
        uploadStatus: "uploading",
      });
      counter++;
    }
    if (skipped.length > 0) {
      toast({
        title: "Skipped files",
        description: skipped.slice(0, 3).join("\n"),
        tone: "warning",
      });
    }
    if (newItems.length === 0) return;
    setItems((prev) => [...prev, ...newItems]);
    // Upload each to the CDN in parallel (cap concurrency to 3).
    const CONCURRENCY = 3;
    let cursor = 0;
    async function worker() {
      while (cursor < newItems.length) {
        const idx = cursor++;
        const item = newItems[idx];
        const result = await uploadFile(item.file);
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== item.id) return it;
            if (it.source !== "upload") return it;
            return {
              ...it,
              url: result?.url ?? it.previewUrl,
              storedPath: result?.storedPath,
              uploadStatus: result ? "ready" : "error",
              uploadError: result ? undefined : "CDN upload failed",
            };
          })
        );
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, newItems.length) }, () => worker()));
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const target = prev[idx];
      if (target.source === "upload") URL.revokeObjectURL(target.previewUrl);
      setUndoStack((s) => [...s, { kind: "remove", item: target, index: idx }]);
      return prev.filter((i) => i.id !== id);
    });
  }

  function undoRemove() {
    setUndoStack((s) => {
      if (s.length === 0) return s;
      const last = s[s.length - 1];
      setItems((prev) => {
        const next = [...prev];
        next.splice(last.index, 0, last.item);
        return next;
      });
      return s.slice(0, -1);
    });
  }

  function updateItem(id: string, patch: Partial<BulkItem>) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, ...patch } as BulkItem;
        if (patch.scheduledDate !== undefined || patch.scheduledTime !== undefined) {
          const date = (patch.scheduledDate ?? i.scheduledDate) as string;
          const time = (patch.scheduledTime ?? i.scheduledTime) as string;
          const utc = wallClockToUTC(date, time, timezone);
          (updated as BulkItemBase).scheduledAt = utc ? utc.toISOString() : `${date}T${time.slice(0, 5)}`;
        }
        return updated;
      })
    );
  }

  function applySchedule() {
    if (items.length === 0) {
      toast({ title: "No items to schedule", tone: "warning" });
      return;
    }
    if (!scheduledSlot(0)) {
      toast({ title: "Invalid date or time", tone: "error" });
      return;
    }
    setItems((prev) => {
      return prev.map((item, idx) => {
        const slot = scheduledSlot(idx);
        return slot
          ? { ...item, scheduledAt: slot.scheduledAt, scheduledDate: slot.date, scheduledTime: slot.time }
          : item;
      });
    });
    toast({ title: "Schedule applied to all items", tone: "success" });
  }

  function applyAccountsToAll() {
    if (accounts.size === 0) {
      toast({ title: "Pick at least one account first", tone: "warning" });
      return;
    }
    setItems((prev) => prev.map((item) => ({ ...item, accountIds: Array.from(accounts) })));
    toast({ title: "Accounts applied to all items", tone: "success" });
  }

  async function scheduleSingle(itemId: string) {
    const target = items.find((i) => i.id === itemId);
    if (!target) return;
    const issues = validateItems([target]);
    if (issues.length > 0) {
      toast({
        title: "Can't schedule this post yet",
        description: issues[0].message,
        tone: "error",
      });
      return;
    }
    setScheduleBusy(true);
    const idempotencyKey = crypto.randomUUID();
    try {
      const idToken = await getIdToken();
      const payload = {
        items: [
          {
            caption: target.caption,
            platforms: target.accountIds,
            mediaUrls: target.url ? [target.url] : [],
            scheduledAt: new Date(target.scheduledAt).toISOString(),
            hashtags: target.hashtags ?? [],
            status: "scheduled" as const,
            postIn: target.postIn,
            youtubeTitle: target.youtubeTitle || undefined,
            youtubeTags: target.youtubeTags || undefined,
            pinterestBoard: target.pinterestBoard || undefined,
            autoAddMusic: target.autoAddMusic,
            community: target.community || undefined,
            profile: target.profile,
          },
        ],
      };
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          ...getOverrideHeaders(),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? body.error ?? `HTTP ${res.status}`);
      }
      // Remove the scheduled item from the local list.
      setItems((prev) => {
        const target2 = prev.find((p) => p.id === itemId);
        if (target2?.source === "upload") URL.revokeObjectURL(target2.previewUrl);
        return prev.filter((p) => p.id !== itemId);
      });
      toast({ title: "Post scheduled", tone: "success" });
    } catch (e) {
      toast({
        title: "Schedule failed",
        description: e instanceof Error ? e.message : undefined,
        tone: "error",
      });
    } finally {
      setScheduleBusy(false);
    }
  }

  async function aiGenerateForAll() {
    const itemsToProcess = items.filter((item) => !item.caption.trim());
    if (itemsToProcess.length === 0) {
      toast({ title: "All captions already filled", tone: "info" });
      return;
    }
    setGenerating(true);
    let success = 0;
    const failed: string[] = [];
    const CONCURRENCY = 3;
    let cursor = 0;
    async function worker() {
      while (cursor < itemsToProcess.length) {
        const idx = cursor++;
        const item = itemsToProcess[idx];
        try {
          let imageUrl: string | undefined;
          let videoTitle: string | undefined;
          if (item.kind === "image") {
            // For uploaded items, send the CDN URL directly so the AI route
            // can fetch it. For CSV items without a mediaUrl, fall back to the
            // filename as a hint.
            if (item.source === "upload") {
              imageUrl = item.url.startsWith("https://") ? item.url : undefined;
            } else if (item.mediaUrl) {
              imageUrl = item.mediaUrl;
            }
          } else {
            videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
          }
          const idToken = await getIdToken();
          const res = await fetch("/api/ai/caption", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getOverrideHeaders(),
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({
              tone: "default",
              includeHashtags: true,
              useEmojis: true,
              extra: "",
              imageUrl,
              videoTitle,
            }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            caption?: string;
            error?: string;
          };
          if (res.ok && data.ok && data.caption) {
            setItems((prev) =>
              prev.map((it) => (it.id === item.id ? { ...it, caption: data.caption!.trim() } : it))
            );
            success++;
          } else {
            failed.push(`${item.name}: ${data.error ?? `HTTP ${res.status}`}`);
          }
        } catch (err) {
          failed.push(`${item.name}: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, itemsToProcess.length) }, () => worker()));
    setGenerating(false);
    toast({
      title: t("posts.bulkSchedule.ai_generated", { n: success, m: itemsToProcess.length }),
      description: failed.length > 0 ? `Failed: ${failed.slice(0, 3).join("; ")}` : undefined,
      tone: failed.length > 0 ? "warning" : "success",
    });
  }

  function clearAll() {
    setItems((prev) => {
      for (const it of prev) {
        if (it.source === "upload") URL.revokeObjectURL(it.previewUrl);
      }
      return [];
    });
    setAccounts(new Set());
    setUndoStack([]);
    clearPersistedDraft();
    toast({ title: "Cleared all items", tone: "info" });
  }

  function downloadCsvTemplate() {
    const template = [
      "caption,platforms,scheduledAt,hashtags,mediaUrl",
      '"Hello world from Instagram!","instagram,facebook",2026-09-01T09:00,"#hello,#world",https://cdn.example.com/photo.jpg',
      '"Check out our latest","twitter,linkedin",2026-09-02T10:30,"#launch",',
    ].join("\n");
    const blob = new Blob([template], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-schedule-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const accountsArr = useMemo(() => Array.from(accounts), [accounts]);

  return (
    <div className="p-6 pb-40">
      {/* Header row: title + Learn (left) + Date Scheduler (right) */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-bold leading-[36px] tracking-tight">{t("posts.bulkSchedule.page_title")}</h1>
            {(() => {
              const cfg = getHelpConfig("posts/bulk-schedule");
              if (!cfg) return null;
              return <PageHelp config={cfg} align="left" buttonClassName="rounded-full" />;
            })()}
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            {t("posts.bulkSchedule.page_subtitle")}
          </p>
        </div>

        {/* Date Scheduler bar */}
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-white/60 p-2 backdrop-blur-sm">
          <SchedulerField label={t("posts.bulkSchedule.start_date")}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-7 w-full rounded-md border border-zinc-200 bg-white/50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            />
          </SchedulerField>
          <SchedulerField label={t("posts.bulkSchedule.time")}>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-7 w-full rounded-md border border-zinc-200 bg-white/50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            />
          </SchedulerField>
          <SchedulerField label={t("posts.bulkSchedule.posts_per_day")}>
            <select
              value={postsPerDay}
              onChange={(e) => setPostsPerDay(parseInt(e.target.value, 10))}
              className="h-7 w-full rounded-md border border-zinc-200 bg-white/50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </SchedulerField>
          <SchedulerField label={t("posts.bulkSchedule.interval")}>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="h-7 w-full rounded-md border border-zinc-200 bg-white/50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            >
              {INTERVALS.map((i) => (
                <option key={i.id} value={i.id}>{t(`posts.bulkSchedule.interval_${i.id === "1d" ? "daily" : i.id === "3d" ? "3days" : i.id === "7d" ? "weekly" : i.id === "14d" ? "2weeks" : "monthly"}`)}</option>
              ))}
            </select>
          </SchedulerField>
          <SchedulerField label={t("posts.bulkSchedule.timezone")}>
            <div className="relative" ref={tzRef}>
              <button
                type="button"
                onClick={() => setTzOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={tzOpen}
                className="inline-flex items-center gap-1 h-7 rounded-md border border-zinc-200 bg-white/50 px-2 text-xs hover:bg-white"
              >
                <span>{timezone}</span>
                <ChevronDown className="size-3.5 text-zinc-500" />
              </button>
              {tzOpen ? (
                <ul
                  role="listbox"
                  className="absolute right-0 top-full mt-1 z-30 w-[220px] max-h-[260px] overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg p-1"
                >
                  {TIMEZONES.map((tz) => (
                    <li key={tz.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setTimezone(tz.id);
                          setTzOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-2 py-1.5 text-xs rounded hover:bg-zinc-100",
                          tz.id === timezone && "bg-zinc-100 font-medium"
                        )}
                      >
                        {tz.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </SchedulerField>
          <button
            type="button"
            onClick={applySchedule}
            disabled={items.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white px-3 h-7 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="size-3.5" />
            {t("posts.bulkSchedule.apply")}
          </button>
        </div>
      </div>

      {/* AI Captions top button */}
      {items.length > 0 ? (
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={aiGenerateForAll}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 h-10 text-sm font-medium"
          >
            <Sparkles className="size-4" />
            {generating ? t("posts.bulkSchedule.generating") : t("posts.bulkSchedule.generate_ai_captions", { n: items.length })}
          </button>
          {undoStack.length > 0 ? (
            <button
              type="button"
              onClick={undoRemove}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 h-9 text-xs font-medium hover:bg-zinc-50"
            >
              <Undo2 className="size-3.5" />
              Undo remove ({undoStack.length})
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
        {/* Left column */}
        <div className="space-y-4">
          {/* Accounts card */}
          <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-6 inline-flex items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-semibold">1</span>
                <h3 className="text-base font-semibold leading-none">{t("posts.bulkSchedule.accounts_title")}</h3>
              </div>
              <div className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-1">
                {PLATFORMS.map((p) => {
                  const isSel = accounts.has(p.id);
                  return (
                    <label
                      key={p.id}
                      className={cn(
                        "flex items-center gap-2 w-full p-1.5 rounded-lg cursor-pointer transition-colors",
                        isSel ? "bg-emerald-50" : "hover:bg-accent"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleAccount(p.id)}
                        className="size-4 rounded-sm border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                      />
                      <PlatformAvatar platform={p} size={28} rounded="full" />
                      <span className="text-sm font-medium truncate">{p.handle}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Media Files card */}
          <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="size-6 inline-flex items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-semibold">2</span>
                  <h3 className="text-base font-semibold leading-none">{t("posts.bulkSchedule.media_files_title")}</h3>
                  <span className="text-xs text-zinc-500">
                    {items.length}/{MAX_FILES}
                  </span>
                </div>
                {items.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={pickMoreFiles}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 h-7 text-xs font-medium hover:bg-zinc-50"
                    >
                      <Plus className="size-3" />
                      {t("posts.bulkSchedule.add_more")}
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex items-center gap-1 px-2 h-7 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="size-3" />
                      {t("posts.bulkSchedule.clear_all")}
                    </button>
                  </div>
                ) : null}
              </div>

              {items.length === 0 ? (
                <>
                  <div className="text-sm font-medium">{t("posts.bulkSchedule.drop_zone")}</div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={(e) => {
                      // Only flip off when the cursor actually leaves the drop target.
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      setDragging(false);
                    }}
                    onDrop={onDrop}
                    onClick={pickFiles}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        pickFiles();
                      }
                    }}
                    className={cn(
                      "rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
                      dragging ? "border-blue-500 bg-blue-50/40" : "border-zinc-300 hover:bg-zinc-50"
                    )}
                  >
                    <UploadCloud className="size-7 mx-auto text-zinc-400" />
                    <p className="mt-2 text-xs font-medium text-zinc-700">
                      {t("posts.bulkSchedule.drop_zone_desc", { max: MAX_FILES })}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {t("posts.bulkSchedule.drop_zone_footnote", { maxSize: Math.round(MAX_FILE_BYTES / 1024 / 1024) })}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-zinc-50/50 px-3 py-2 flex-wrap">
                    <p className="text-xs text-zinc-600 flex-1 min-w-0">
                      <span className="font-medium">{t("posts.bulkSchedule.csv_hint")}</span>
                    </p>
                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 h-7 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      <Download className="size-3.5" />
                      Template
                    </button>
                    <button
                      type="button"
                      onClick={pickCsvFile}
                      disabled={csvBusy}
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 h-7 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      <Upload className="size-3.5" />
                      {csvBusy ? t("posts.bulkSchedule.reading") : t("posts.bulkSchedule.upload_csv")}
                    </button>
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCsvFile(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700">{t("posts.bulkSchedule.selected_media")}</span>
                    <span className="text-zinc-500">{t("posts.bulkSchedule.manage_uploads")}</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-1">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-50",
                          item.uploadStatus === "error" && "bg-red-50/50"
                        )}
                      >
                        <div className="relative size-9 flex-shrink-0 rounded bg-zinc-100 overflow-hidden">
                          {item.kind === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element -- CDN URL or local blob preview
                            <img src={item.source === "upload" ? item.previewUrl : item.url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <video src={item.source === "upload" ? item.previewUrl : item.url} className="w-full h-full object-cover" />
                          )}
                          {item.source === "upload" && item.uploadStatus === "uploading" ? (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            </div>
                          ) : null}
                          {item.source === "upload" && item.uploadStatus === "error" ? (
                            <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                              <X className="size-3.5 text-white" />
                            </div>
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{item.name}</p>
                          <p className="text-[10px] text-zinc-500">
                            {item.source === "upload" && item.uploadStatus === "uploading"
                              ? "Uploading…"
                              : item.source === "upload" && item.uploadStatus === "error"
                              ? "Upload failed"
                              : null}
                            {item.source === "upload" && item.uploadStatus === "ready" ? formatBytes(item.size) : ""}
                            {item.source === "csv" ? "CSV" : ""}
                            {" • "}
                            {item.kind === "image" ? "Image" : "Video"} #{idx + 1}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="size-6 inline-flex items-center justify-center rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex-shrink-0"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      setDragging(false);
                    }}
                    onDrop={onAddMoreDrop}
                    onClick={pickMoreFiles}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        pickMoreFiles();
                      }
                    }}
                    className={cn(
                      "rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
                      dragging ? "border-blue-500 bg-blue-50/40" : "border-zinc-300 hover:bg-zinc-50"
                    )}
                  >
                    <ImagePlus className="size-5 mx-auto text-zinc-400" />
                    <p className="mt-1 text-xs font-medium text-zinc-700">Drop to add more media files</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      Add to your existing {items.length} file{items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_MIME_TYPES.join(",")}
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 0) handleFiles(files);
                  e.target.value = "";
                }}
              />
              <input
                ref={addMoreInputRef}
                type="file"
                multiple
                accept={ACCEPTED_MIME_TYPES.join(",")}
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 0) handleFiles(files);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <PostsList
            items={items}
            accountsCount={accountsArr.length}
            onToggleAccount={(itemId, platformId) => {
              setItems((prev) =>
                prev.map((it) => {
                  if (it.id !== itemId) return it;
                  const has = it.accountIds.includes(platformId);
                  return {
                    ...it,
                    accountIds: has ? it.accountIds.filter((a) => a !== platformId) : [...it.accountIds, platformId],
                  };
                })
              );
            }}
            onUpdateItem={updateItem}
            onRemove={removeItem}
            onApplyAccountsToAll={applyAccountsToAll}
            onScheduleSingle={scheduleSingle}
          />
        )}
      </div>

      {/* Sticky bottom action bar */}
      {items.length > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto max-w-[1600px] px-6 h-16 flex items-center justify-between gap-4">
            <span className="text-sm font-medium">
              {t("posts.bulkSchedule.posts_ready", { n: items.length })}
            </span>
            <button
              type="button"
              onClick={handleScheduleAll}
              disabled={scheduleBusy}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-4 h-10 text-sm font-medium disabled:opacity-50"
            >
              <Calendar className="size-4" />
              {scheduleBusy ? t("posts.bulkSchedule.scheduling") : t("posts.bulkSchedule.schedule_all")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SchedulerField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium tracking-wide text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("dashboard");
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
        <div className="p-12 text-center">
          <div className="size-12 rounded-full bg-zinc-100 inline-flex items-center justify-center mx-auto">
            <Upload className="size-6 text-zinc-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{t("posts.bulkSchedule.empty_title")}</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
            {t("posts.bulkSchedule.empty_subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StepCard
          n={1}
          title={t("posts.bulkSchedule.empty_step1_title")}
          desc={t("posts.bulkSchedule.empty_step1_desc")}
        />
        <StepCard
          n={2}
          title={t("posts.bulkSchedule.empty_step2_title")}
          desc={t("posts.bulkSchedule.empty_step2_desc", { max: 20 })}
        />
        <StepCard
          n={3}
          title={t("posts.bulkSchedule.empty_step3_title")}
          desc={t("posts.bulkSchedule.empty_step3_desc")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TipCard
          icon={<Calendar className="size-4 text-blue-600" />}
          title={t("posts.bulkSchedule.tip_scheduler_title")}
          desc={t("posts.bulkSchedule.tip_scheduler_desc")}
        />
        <TipCard
          icon={<Sparkles className="size-4 text-violet-600" />}
          title={t("posts.bulkSchedule.tip_ai_title")}
          desc={t("posts.bulkSchedule.tip_ai_desc")}
        />
      </div>
    </div>
  );
}

function StepCard({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm p-5">
      <div className="size-8 inline-flex items-center justify-center rounded-full bg-zinc-900 text-white text-sm font-semibold mb-3">
        {n}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function TipCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm p-4 flex items-start gap-3">
      <div className="size-8 rounded-lg bg-zinc-100 inline-flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

interface PostsListProps {
  items: BulkItem[];
  accountsCount: number;
  onToggleAccount: (itemId: string, platformId: PlatformId) => void;
  onUpdateItem: (id: string, patch: Partial<BulkItem>) => void;
  onRemove: (id: string) => void;
  onApplyAccountsToAll: () => void;
  onScheduleSingle: (itemId: string) => void;
}

function PostsList({
  items,
  accountsCount,
  onToggleAccount,
  onUpdateItem,
  onRemove,
  onApplyAccountsToAll,
  onScheduleSingle,
}: PostsListProps) {
  const t = useTranslations("dashboard");
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
        <div className="p-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold leading-none">{t("posts.bulkSchedule.posts_ready", { n: items.length })}</h3>
            <p className="text-xs text-zinc-500 mt-1">{t("posts.bulkSchedule.customize_subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onApplyAccountsToAll}
            disabled={accountsCount === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
          >
            {t("posts.bulkSchedule.apply_accounts_all")}
          </button>
        </div>
      </div>

      {items.map((item, idx) => (
        <PostRow
          key={item.id}
          item={item}
          index={idx}
          onToggleAccount={(id) => onToggleAccount(item.id, id)}
          onUpdate={(patch) => onUpdateItem(item.id, patch)}
          onRemove={() => onRemove(item.id)}
          onScheduleSingle={() => onScheduleSingle(item.id)}
        />
      ))}
    </div>
  );
}

function PostRow({
  item,
  index,
  onToggleAccount,
  onUpdate,
  onRemove,
  onScheduleSingle,
}: {
  item: BulkItem;
  index: number;
  onToggleAccount: (id: PlatformId) => void;
  onUpdate: (patch: Partial<BulkItem>) => void;
  onRemove: () => void;
  onScheduleSingle: () => void;
}) {
  const t = useTranslations("dashboard");
  const hasYouTube = item.accountIds.includes("youtube");
  const hasPinterest = item.accountIds.includes("pinterest");
  const hasInstagram = item.accountIds.includes("instagram");
  const hasFacebook = item.accountIds.includes("facebook");
  const hasX = item.accountIds.includes("twitter");
  const captionLen = item.caption.length;
  const ytTitleLen = item.youtubeTitle.length;
  const ytTagsLen = item.youtubeTags.length;
  const charLimit = pickCharLimitFor(item);
  const overLimit = captionLen > charLimit;
  const previewSrc = item.source === "upload" ? item.previewUrl : item.url;

  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[100px_minmax(0,180px)_minmax(0,140px)_minmax(0,1fr)] divide-y md:divide-y-0 md:divide-x divide-zinc-200">
        {/* Column 1: Media preview */}
        <div className="relative bg-zinc-100 aspect-square md:aspect-auto">
          {item.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- CDN URL or local blob preview
            <img src={previewSrc} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <video src={previewSrc} className="w-full h-full object-cover" />
          )}
          <span className="absolute top-1 left-1 inline-flex items-center justify-center size-6 rounded bg-zinc-900/80 text-white text-[11px] font-semibold">
            #{index + 1}
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove"
            className="absolute top-1 right-1 size-6 inline-flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            <X className="size-3.5" />
          </button>
          <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white">
            <p className="font-medium truncate">{item.name}</p>
            <p className="opacity-80">
              {item.source === "upload" ? formatBytes(item.size) : "CSV import"}
              {item.source === "upload" && item.uploadStatus === "uploading" ? " • Uploading…" : ""}
              {item.source === "upload" && item.uploadStatus === "error" ? " • Upload failed" : ""}
            </p>
          </div>
        </div>

        {/* Column 2: Platforms */}
        <div className="p-3 min-w-0">
          <h4 className="text-xs font-semibold tracking-wide text-zinc-700 mb-2">
            {t("posts.bulkSchedule.platforms_selected", { n: item.accountIds.length })}
          </h4>
          <div className="space-y-0.5">
            {PLATFORMS.map((p) => {
              const isSel = item.accountIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={cn(
                    "flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer text-xs",
                    isSel ? "bg-emerald-50" : "hover:bg-zinc-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => onToggleAccount(p.id)}
                    className="size-3.5 rounded-sm border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                  />
                  <PlatformAvatar platform={p} size={16} rounded="full" />
                  <span className="truncate flex-1 text-[11px]">{p.handle}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Column 3: Schedule */}
        <div className="p-3 min-w-0">
          <h4 className="text-xs font-semibold tracking-wide text-zinc-700 mb-2">{t("posts.bulkSchedule.schedule_header")}</h4>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-zinc-500">{t("posts.bulkSchedule.date_label")}</label>
              <input
                type="date"
                value={item.scheduledDate}
                onChange={(e) => onUpdate({ scheduledDate: e.target.value })}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500">{t("posts.bulkSchedule.time_label")}</label>
              <input
                type="time"
                value={item.scheduledTime}
                onChange={(e) => onUpdate({ scheduledTime: e.target.value })}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
              />
            </div>
          </div>
        </div>

        {/* Column 4: Caption + Platform-specific fields */}
        <div className="p-3 space-y-2 min-w-0">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold tracking-wide text-zinc-700">{t("posts.bulkSchedule.caption_label")}</label>
              <span className={cn("text-[10px]", overLimit ? "text-red-600 font-medium" : "text-zinc-500")}>
                {captionLen}/{charLimit}
              </span>
            </div>
            <textarea
              value={item.caption}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              placeholder={t("posts.bulkSchedule.caption_placeholder")}
              rows={3}
              maxLength={2200}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300 resize-none"
            />
          </div>

          {/* Post in: Feed/Story */}
          <div>
            <label className="text-[10px] font-medium text-zinc-700">{t("posts.bulkSchedule.post_in")}</label>
            <div className="mt-1 flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`post-in-${item.id}`}
                  checked={item.postIn === "feed"}
                  onChange={() => onUpdate({ postIn: "feed" })}
                  className="size-3.5 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs">{t("posts.bulkSchedule.feed")}</span>
              </label>
              <label className={cn(
                "flex items-center gap-1.5",
                hasInstagram || hasFacebook ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              )}>
                <input
                  type="radio"
                  name={`post-in-${item.id}`}
                  checked={item.postIn === "story"}
                  onChange={() => onUpdate({ postIn: "story" })}
                  disabled={!(hasInstagram || hasFacebook)}
                  className="size-3.5 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs">{t("posts.bulkSchedule.story")}</span>
              </label>
            </div>
            {!(hasInstagram || hasFacebook) ? (
              <p className="mt-0.5 text-[10px] text-zinc-500">{t("posts.bulkSchedule.stories_note")}</p>
            ) : null}
          </div>

          {/* YouTube Video Title */}
          {hasYouTube ? (
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] font-medium text-zinc-700">
                  {t("posts.bulkSchedule.youtube_title")} <span className="text-red-500">{t("posts.bulkSchedule.required")}</span>
                </label>
                <span className={cn("text-[10px]", ytTitleLen > 100 ? "text-red-600" : "text-zinc-500")}>
                  {ytTitleLen} / 100
                </span>
              </div>
              <input
                type="text"
                value={item.youtubeTitle}
                onChange={(e) => onUpdate({ youtubeTitle: e.target.value.slice(0, 100) })}
                placeholder="Enter video title for YouTube..."
                className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
              />
            </div>
          ) : null}

          {/* YouTube Tags */}
          {hasYouTube ? (
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] font-medium text-zinc-700">{t("posts.bulkSchedule.youtube_tags")}</label>
                <span className={cn("text-[10px]", ytTagsLen > 500 ? "text-red-600" : "text-zinc-500")}>
                  {ytTagsLen} / 500
                </span>
              </div>
              <input
                type="text"
                value={item.youtubeTags}
                onChange={(e) => onUpdate({ youtubeTags: e.target.value.slice(0, 500) })}
                placeholder="social, youtube, video, tag"
                className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
              />
            </div>
          ) : null}

          {/* Pinterest Board */}
          {hasPinterest ? (
            <div>
              <label className="text-[10px] font-medium text-zinc-700 mb-0.5 block">
                {t("posts.bulkSchedule.pinterest_board")} <span className="text-red-500">{t("posts.bulkSchedule.required")}</span>
              </label>
              <select
                value={item.pinterestBoard}
                onChange={(e) => onUpdate({ pinterestBoard: e.target.value })}
                className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
              >
                <option value="">{t("posts.bulkSchedule.select_board")}</option>
                <option value="default">Default Board</option>
                <option value="inspiration">Inspiration</option>
                <option value="products">Products</option>
              </select>
            </div>
          ) : null}

          {/* Auto add music */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={item.autoAddMusic}
              onChange={(e) => onUpdate({ autoAddMusic: e.target.checked })}
              className="size-3.5 rounded-sm border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs">{t("posts.bulkSchedule.auto_music")}</span>
          </label>

          {/* X Community */}
          {hasX ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={item.community}
                onChange={(e) => onUpdate({ community: e.target.checked })}
                className="size-3.5 rounded-sm border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs">{t("posts.bulkSchedule.community")}</span>
              <span className="text-[10px] text-zinc-500">{t("posts.bulkSchedule.optional")}</span>
            </label>
          ) : null}

          {/* Profile */}
          <div>
            <label className="text-[10px] font-medium text-zinc-700 mb-0.5 block">{t("posts.bulkSchedule.profile")}</label>
            <select
              value={item.profile}
              onChange={(e) => onUpdate({ profile: e.target.value })}
              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            >
              <option value="Default">Default</option>
              <option value="Personal">Personal</option>
              <option value="Business">Business</option>
            </select>
          </div>

          {/* Per-row schedule */}
          <button
            type="button"
            onClick={onScheduleSingle}
            disabled={item.uploadStatus === "uploading"}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
          >
            <Calendar className="size-3" />
            Schedule this post
          </button>
        </div>
      </div>

      {item.accountIds.length === 0 ? (
        <div className="border-t border-zinc-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          {t("posts.bulkSchedule.no_accounts_warning")}
        </div>
      ) : null}
    </div>
  );
}
