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
  Send,
  Clock,
  Layers,
  Image as ImageIcon,
  Video,
  FileText,
  Eye,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Settings2,
  MessageSquare,
  Hash,
  Users,
  ArrowUpRight,
  Timer,
  History as HistoryIcon,
  ListChecks,
  Zap,
  Crop,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PLATFORMS, getPlatform, type PlatformId } from "@/lib/platforms";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { ProPlatformIcon, ProOverflowBadge } from "@/components/dashboard/pro-platform-icon";
import { ProStatIcon } from "@/components/dashboard/pro-stat-icon";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import { parseCsv, normalizePlatforms, normalizeHashtags } from "@/lib/bulk-schedule/csv";
import { zonedDateTimeToDate } from "@/lib/datetime/zoned";
import { AdvancedOptionsPanel } from "@/components/dashboard/advanced-options-panel";
import { AICaptionsDialog } from "@/components/dashboard/ai-captions-dialog";
import { fitCaptionForPlatform, PLATFORM_LIMITS, getPlatformLimit } from "@/lib/ai/caption-fit";
import { UnsplashDialog } from "@/components/dashboard/unsplash-dialog";
import { CanvaDialog, type ImportedFile } from "@/components/dashboard/canva-dialog";
import { GoogleDriveDialog } from "@/components/dashboard/google-drive-dialog";
import { DropboxDialog } from "@/components/dashboard/dropbox-dialog";
import { CropModal } from "@/components/dashboard/crop-modal";
import { CoverImageModal } from "@/components/dashboard/cover-image-modal";
import { CollaboratorsModal } from "@/components/dashboard/collaborators-modal";
import { HashtagsDropdown } from "@/components/dashboard/hashtags-dropdown";
import { MetadataRulesPanel, type MetadataRules } from "@/components/dashboard/metadata-rules-panel";
import { BrandIcons } from "@/components/dashboard/brand-icons";
import { checkRequirements, type MediaMeta, type ReadinessReport } from "@/lib/publishing/requirements";
import { getDefaultOptions, type PlatformAdvancedOptions } from "@/lib/publishing/advanced-options";
import type { MediaKind } from "@/lib/publishing/capability-matrix";

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
  // ── Full-fidelity extensions (parity with Create Post) ──
  captionByPlatform?: Partial<Record<PlatformId, string>>;
  firstComment?: string;
  altText?: string;
  tagUsers?: string;
  customCoverUrl?: string | null;
  frameCoverUrl?: string | null;
  collaborators?: string[];
  advancedByPlatform?: Partial<Record<PlatformId, PlatformAdvancedOptions>>;
  // per-item media kind override for advanced panel
  mediaKind?: MediaKind;
};

type UploadedBulkItem = BulkItemBase & {
  source: "upload";
  file: File;
  previewUrl: string;
  storedPath?: string;
};

type CsvBulkItem = BulkItemBase & {
  source: "csv";
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

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string, fallbackName: string): File {
  const [meta, b64] = dataUrl.split(",");
  const mimeMatch = meta.match(/data:([^;]+)(?:;base64)?/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const isBase64 = /;base64/.test(meta);
  const ext = mime.includes("png")
    ? "png"
    : mime.includes("webp")
    ? "webp"
    : mime.includes("gif")
    ? "gif"
    : "jpg";
  const name = /\.([a-z0-9]{2,5})$/i.test(fallbackName)
    ? fallbackName
    : `${fallbackName.replace(/\.[^.]+$/, "")}.${ext}`;
  if (isBase64) {
    const binary = atob(b64 ?? "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], name, { type: mime });
  }
  const decoded = decodeURIComponent(b64 ?? "");
  const bytes = new TextEncoder().encode(decoded);
  return new File([bytes], name, { type: mime });
}

function splitDateTime(dt: string): { date: string; time: string } {
  if (!dt || !dt.includes("T")) return { date: todayISO(), time: "08:00" };
  const [date, time] = dt.split("T");
  return { date: date || todayISO(), time: (time || "08:00").slice(0, 5) };
}

function wallClockToUTC(date: string, time: string, timezone: string): Date | null {
  const [hh, mm] = time.split(":").map((s) => parseInt(s, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const [y, m, d] = date.split("-").map((s) => parseInt(s, 10));
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return zonedDateTimeToDate({ year: y, month: m, day: d, hour: hh, minute: mm }, timezone);
}

function pickCharLimitFor(item: BulkItem): number {
  if (item.accountIds.length === 0) return 2200;
  let min = Infinity;
  for (const id of item.accountIds) {
    const p = PLATFORMS.find((pl) => pl.id === id);
    if (p && p.charLimit < min) min = p.charLimit;
  }
  return min === Infinity ? 2200 : min;
}

function getMediaKindForItem(item: BulkItem): MediaKind {
  return item.kind === "video" ? "video" : "image";
}

function isVideoOnlyPlatform(id: PlatformId): boolean {
  return !!PLATFORMS.find((p) => p.id === id)?.videoOnly;
}

function filterAccountsForKind(kind: BulkItem["kind"], ids: PlatformId[]): PlatformId[] {
  if (kind === "image") return ids.filter((id) => !isVideoOnlyPlatform(id));
  return ids;
}

function buildReadinessForItem(item: BulkItem, timezone: string) {
  const mediaKind = getMediaKindForItem(item);
  const fakeMime = item.kind === "video" ? "video/mp4" : "image/jpeg";
  const media: MediaMeta[] = [
    {
      kind: mediaKind,
      mimeType: fakeMime,
      sizeBytes: item.size || 1024 * 500,
    },
  ];
  const captionByPlatform: Partial<Record<PlatformId, string>> = {};
  for (const pid of item.accountIds) {
    captionByPlatform[pid] = item.captionByPlatform?.[pid] ?? item.caption;
  }
  // Ensure youtube/pinterest required targets have sensible defaults if empty — validator will flag missing.
  return checkRequirements(item.accountIds, {
    captionByPlatform,
    media,
    advancedByPlatform: item.advancedByPlatform ?? {},
    composerMediaKind: mediaKind,
  });
}

interface ValidationIssue {
  itemId: string;
  message: string;
}

function validateItems(items: BulkItem[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const now = Date.now();
  for (const it of items) {
    const readiness = buildReadinessForItem(it, "UTC");
    // Deduplicate caption per item (one global caption field, not per-platform)
    const hasMissingCaption = readiness.perPlatform.some((per) =>
      per.issues.some((iss) => iss.code === "missing_caption" && iss.severity === "blocked")
    );
    if (hasMissingCaption) {
      issues.push({ itemId: it.id, message: "Caption is required" });
    }
    // Other blocked issues — one per distinct code per item (avoid 9x duplication)
    const seenCodes = new Set<string>();
    for (const per of readiness.perPlatform) {
      for (const iss of per.issues) {
        if (iss.severity !== "blocked") continue;
        if (iss.code === "missing_caption") continue; // already handled globally
        // Pinterest board: top-level field satisfies requirement; don't double-report
        if (iss.code === "missing_target_pinterest_board_id" && it.pinterestBoard.trim()) continue;
        const key = iss.code;
        if (seenCodes.has(key)) continue;
        seenCodes.add(key);
        issues.push({ itemId: it.id, message: iss.message });
      }
    }
    // Explicit YouTube/Pinterest top-level checks (not covered by capability matrix)
    if (it.accountIds.includes("youtube" as PlatformId) && !it.youtubeTitle.trim()) {
      if (!seenCodes.has("youtube_title")) {
        issues.push({ itemId: it.id, message: "YouTube title is required" });
      }
    }
    if (it.accountIds.includes("pinterest" as PlatformId) && !it.pinterestBoard.trim()) {
      const advBoard = (it.advancedByPlatform?.pinterest as Record<string, unknown> | undefined)?.pinterest_board_id;
      if (!advBoard) {
        issues.push({ itemId: it.id, message: "Pinterest board is required" });
      }
    }
    if (it.accountIds.length === 0) {
      issues.push({ itemId: it.id, message: "No platforms selected" });
    }
    // Fallback simple checks for upload status & time
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
  // Final dedup
  const seen = new Set<string>();
  return issues.filter((i) => {
    const key = `${i.itemId}:${i.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  const [timezone, setTimezone] = useState<string>("Africa/Lagos");
  const [tzOpen, setTzOpen] = useState(false);
  const [accounts, setAccounts] = useState<Set<PlatformId>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [undoStack, setUndoStack] = useState<Array<{ kind: "remove"; item: BulkItem; index: number }>>([]);
  const [aiTarget, setAiTarget] = useState<BulkItem | null>(null);
  const [aiGeneratingItemId, setAiGeneratingItemId] = useState<string | null>(null);
  const [batchAiOpen, setBatchAiOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<BulkItem | null>(null);
  const [coverTarget, setCoverTarget] = useState<BulkItem | null>(null);
  const [collaboratorsTarget, setCollaboratorsTarget] = useState<BulkItem | null>(null);
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const [canvaOpen, setCanvaOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [dropboxOpen, setDropboxOpen] = useState(false);
  const [metadataRules, setMetadataRules] = useState<MetadataRules>({
    enabled: false,
    hashtags: [],
    ctaLine: "",
    mode: "append",
    startDate: "",
    endDate: "",
  });
  const [rulesOpen, setRulesOpen] = useState(false);
  const [destinationOptions, setDestinationOptions] = useState<{
    boards: Array<{ value: string; label: string }>;
    pages: Array<{ value: string; label: string }>;
  }>({ boards: [], pages: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const customCoverInputRef = useRef<HTMLInputElement>(null);
  const customCoverTargetItemId = useRef<string | null>(null);
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
    const wall = new Date(Date.UTC(year, month - 1, day + dayOffset, startHour, startMinute + slotOffsetMinutes));
    const localYear = wall.getUTCFullYear();
    const localMonth = wall.getUTCMonth() + 1;
    const localDay = wall.getUTCDate();
    const localHour = wall.getUTCHours();
    const localMinute = wall.getUTCMinutes();
    const instant = zonedDateTimeToDate(
      {
        year: localYear,
        month: localMonth,
        day: localDay,
        hour: localHour,
        minute: localMinute,
      },
      timezone
    );
    if (!instant) return null;
    return {
      scheduledAt: instant.toISOString(),
      date: `${localYear}-${String(localMonth).padStart(2, "0")}-${String(localDay).padStart(2, "0")}`,
      time: `${String(localHour).padStart(2, "0")}:${String(localMinute).padStart(2, "0")}`,
    };
  }

  // Auto-detect timezone on first mount
  useEffect(() => {
    try {
      const guess = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (guess) setTimezone(guess);
    } catch {
      setTimezone("Africa/Lagos");
    }
  }, []);

  // Fetch connected platforms + destinations for advanced options (Pinterest boards, FB pages)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/social-accounts/list", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          ok?: boolean;
          accounts?: { platform: string }[];
          destinations?: { boards?: { id: string; name: string }[]; pages?: { id: string; name: string }[] };
        };
        if (!data.ok || cancelled) return;
        const pids = new Set<PlatformId>();
        for (const a of data.accounts ?? []) {
          if (PLATFORMS.some((p) => p.id === a.platform)) pids.add(a.platform as PlatformId);
        }
        // Don't override if user already picked accounts via persisted draft
        if (pids.size > 0 && accounts.size === 0 && !hydratedRef.current) {
          // let persisted restore win; otherwise set default to connected
          // we set after hydration check below
        }
        setDestinationOptions({
          boards: (data.destinations?.boards ?? []).map((b) => ({ value: b.id, label: b.name })),
          pages: (data.destinations?.pages ?? []).map((p) => ({ value: p.id, label: p.name })),
        });
        if (pids.size > 0) {
          setAccounts((prev) => (prev.size === 0 ? pids : prev));
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Restore persisted CSV draft + scheduler settings
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
      // Rehydrate with defaults for new fields
      const rehydrated = persisted.csvItems.map((it) => ({
        ...it,
        firstComment: (it as unknown as { firstComment?: string }).firstComment ?? "",
        tagUsers: (it as unknown as { tagUsers?: string }).tagUsers ?? "",
        altText: (it as unknown as { altText?: string }).altText ?? "",
        advancedByPlatform: (it as unknown as { advancedByPlatform?: Record<string, unknown> }).advancedByPlatform ?? {},
      })) as CsvBulkItem[];
      setItems(rehydrated);
    }
  }, []);

  // Persist on changes
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

  // Revoke blob URLs on unmount
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

  // Auto-fix: image posts must not target video-only platforms (e.g. YouTube). Fixes persisted bad state from before.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const needsFix = items.some((it) => (it as BulkItemBase).kind === "image" && (it as BulkItemBase).accountIds.includes("youtube" as PlatformId));
    if (!needsFix) return;
    setItems((prev) =>
      prev.map((it) => {
        const base = it as BulkItemBase;
        if (base.kind === "image" && base.accountIds.includes("youtube" as PlatformId)) {
          const filtered = filterAccountsForKind("image", base.accountIds as PlatformId[]);
          const adv = { ...(base.advancedByPlatform ?? {}) } as Record<string, Record<string, unknown>>;
          delete adv.youtube;
          const next: BulkItemBase = { ...base, accountIds: filtered, advancedByPlatform: adv };
          // keep top-level youtube fields empty
          next.youtubeTitle = "";
          next.youtubeTags = "";
          return next as BulkItem;
        }
        return it;
      })
    );
  }, [items]);

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
        let platforms: PlatformId[] = (platformsIdx >= 0 ? (normalizePlatforms(r[platformsIdx] ?? "") as PlatformId[]) : []);
        if (platforms.length === 0) platforms = Array.from(accounts);
        if (platforms.length === 0) {
          errors.push(`Row ${i + 2}: no platforms (add a "platforms" column or select accounts above)`);
          continue;
        }
        // Auto-filter video-only platforms for image rows (CSV defaults to image)
        platforms = filterAccountsForKind("image", platforms);
        if (platforms.length === 0) {
          errors.push(`Row ${i + 2}: no compatible platforms after filtering video-only for image`);
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
          const parsedDate = hasExplicitOffset ? new Date(rawScheduled) : wallClockToUTC(rawParts.date, rawParts.time, timezone);
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
        // Build default advanced options for selected platforms so Pinterest board / FB page are pre-filled
        const adv: Record<string, Record<string, unknown>> = {};
        for (const pid of platforms) {
          const def = getDefaultOptions(pid);
          if (Object.keys(def).length > 0) adv[pid] = { ...def };
          if (pid === "pinterest" && destinationOptions.boards[0] && !adv[pid]?.pinterest_board_id) {
            adv[pid] = { ...def, pinterest_board_id: destinationOptions.boards[0].value };
          }
          if (pid === "facebook" && destinationOptions.pages[0] && !adv[pid]?.facebook_page_id) {
            adv[pid] = { ...def, facebook_page_id: destinationOptions.pages[0].value };
          }
        }
        const csvPinterestBoardId = (adv.pinterest as Record<string, unknown> | undefined)?.pinterest_board_id as string | undefined;
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
          pinterestBoard: csvPinterestBoardId ?? "",
          autoAddMusic: false,
          community: false,
          profile: "Default",
          hashtags,
          uploadStatus: mediaUrl ? "ready" : "error",
          uploadError: mediaUrl ? undefined : "Add a mediaurl column or upload media files",
          firstComment: "",
          altText: "",
          tagUsers: "",
          advancedByPlatform: adv,
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
      const grouped = issues.reduce((acc, cur) => {
        acc[cur.message] = (acc[cur.message] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const summary = Object.entries(grouped)
        .map(([msg, n]) => (n > 1 ? `${msg} ×${n}` : msg))
        .slice(0, 3)
        .join("; ");
      toast({
        title: "Can't schedule yet",
        description: `${issues.length} issue(s): ${summary}`,
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
          community: it.community ? "community" : undefined,
          profile: it.profile,
          firstComment: it.firstComment || undefined,
          altText: it.altText ? [it.altText] : undefined,
          tagUsers: it.tagUsers || undefined,
          advancedByPlatform: it.advancedByPlatform,
          captionsByPlatform: it.captionByPlatform,
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
        const msg = body.error?.message ?? body.error ?? (Array.isArray(body.issues) ? body.issues.map((i: { message: string }) => i.message).join("; ") : `Bulk schedule failed (${res.status})`);
        throw new Error(msg);
      }
      const data = (await res.json()) as { count?: number; ids?: string[]; ok?: boolean };
      const n = data.count ?? readyItems.length;
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
      const filteredAccounts = filterAccountsForKind(kind, Array.from(accounts));
      const adv: Record<string, Record<string, unknown>> = {};
      for (const pid of filteredAccounts) {
        const def = getDefaultOptions(pid);
        if (Object.keys(def).length > 0) adv[pid] = { ...def };
        if (pid === "pinterest" && destinationOptions.boards[0] && !adv[pid]?.pinterest_board_id) {
          adv[pid] = { ...(adv[pid] ?? def), pinterest_board_id: destinationOptions.boards[0].value };
        }
        if (pid === "facebook" && destinationOptions.pages[0] && !adv[pid]?.facebook_page_id) {
          adv[pid] = { ...(adv[pid] ?? def), facebook_page_id: destinationOptions.pages[0].value };
        }
      }
      const pinterestBoardId = (adv.pinterest as Record<string, unknown> | undefined)?.pinterest_board_id as string | undefined;
      // Inform once if we auto-dropped YouTube for image
      if (kind === "image" && accounts.has("youtube" as PlatformId) && !filteredAccounts.includes("youtube" as PlatformId)) {
        // toast only once per batch
        if (counter === 0) toast({ title: "YouTube auto-removed for images", description: "YouTube only accepts video — auto-deselected for image posts. Add video to enable YouTube.", tone: "info" });
      }
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
        accountIds: filteredAccounts,
        postIn: "feed",
        youtubeTitle: "",
        youtubeTags: "",
        pinterestBoard: pinterestBoardId ?? "",
        autoAddMusic: false,
        community: false,
        profile: "Default",
        hashtags: [],
        uploadStatus: "uploading",
        firstComment: "",
        altText: "",
        tagUsers: "",
        advancedByPlatform: adv,
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
          const date = (patch.scheduledDate ?? (i as BulkItemBase).scheduledDate) as string;
          const time = (patch.scheduledTime ?? (i as BulkItemBase).scheduledTime) as string;
          const utc = wallClockToUTC(date, time, timezone);
          (updated as BulkItemBase).scheduledAt = utc ? utc.toISOString() : `${date}T${time.slice(0, 5)}`;
        }
        // Keep top-level Pinterest board in sync with advanced panel's board id
        if ((patch as BulkItemBase).pinterestBoard !== undefined) {
          const board = (patch as BulkItemBase).pinterestBoard as string;
          const adv = ((updated as BulkItemBase).advancedByPlatform ?? {}) as Record<string, Record<string, unknown>>;
          const pAdv = { ...(adv.pinterest ?? {}) } as Record<string, unknown>;
          if (board) pAdv.pinterest_board_id = board;
          else delete pAdv.pinterest_board_id;
          // keep other pinterest advanced fields if present
          adv.pinterest = pAdv;
          (updated as BulkItemBase).advancedByPlatform = adv;
          // If Pinterest not selected, clear board to avoid ghost requirement
          if (!(updated as BulkItemBase).accountIds.includes("pinterest" as PlatformId)) {
            (updated as BulkItemBase).pinterestBoard = "";
          }
        }
        return updated;
      })
    );
  }

  function updateAdvanced(id: string, platform: PlatformId, next: PlatformAdvancedOptions) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const cur = (it as BulkItemBase).advancedByPlatform ?? {};
        const updated = { ...it, advancedByPlatform: { ...cur, [platform]: next } } as BulkItem;
        // Sync Pinterest board id from advanced back to top-level field so both stay consistent
        if (platform === "pinterest") {
          const boardId = (next as Record<string, unknown>).pinterest_board_id as string | undefined;
          (updated as BulkItemBase).pinterestBoard = boardId ? String(boardId) : "";
        }
        if (platform === "facebook") {
          const pageId = (next as Record<string, unknown>).facebook_page_id as string | undefined;
          // no top-level field for FB page, but keep advanced in sync; top-level not needed
          if (!pageId) {
            // leave as is
          }
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
    const advTemplate: Record<string, Record<string, unknown>> = {};
    for (const pid of accounts) {
      const def = getDefaultOptions(pid);
      advTemplate[pid] = { ...def };
      if (pid === "pinterest" && destinationOptions.boards[0] && !advTemplate[pid]?.pinterest_board_id) {
        advTemplate[pid] = { ...advTemplate[pid], pinterest_board_id: destinationOptions.boards[0].value };
      }
      if (pid === "facebook" && destinationOptions.pages[0] && !advTemplate[pid]?.facebook_page_id) {
        advTemplate[pid] = { ...advTemplate[pid], facebook_page_id: destinationOptions.pages[0].value };
      }
    }
    const boardFromTemplate = (advTemplate.pinterest as Record<string, unknown> | undefined)?.pinterest_board_id as string | undefined;
    setItems((prev) =>
      prev.map((item) => {
        const base = item as BulkItemBase;
        const filtered = filterAccountsForKind(base.kind as BulkItem["kind"], Array.from(accounts));
        const filteredAdv: Record<string, Record<string, unknown>> = {};
        for (const pid of filtered) {
          if (advTemplate[pid]) filteredAdv[pid] = advTemplate[pid];
          else if ((base.advancedByPlatform as Record<string, Record<string, unknown>> | undefined)?.[pid]) {
            filteredAdv[pid] = (base.advancedByPlatform as Record<string, Record<string, unknown>>)[pid];
          }
        }
        const willHavePinterest = filtered.includes("pinterest" as PlatformId);
        const finalBoard = willHavePinterest
          ? (base.pinterestBoard || boardFromTemplate || "") as string
          : "";
        return {
          ...item,
          accountIds: filtered,
          pinterestBoard: finalBoard as string,
          advancedByPlatform: { ...filteredAdv } as BulkItem["advancedByPlatform"],
        } as BulkItem;
      })
    );
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
            community: target.community ? "community" : undefined,
            profile: target.profile,
            firstComment: (target as BulkItemBase).firstComment || undefined,
            altText: (target as BulkItemBase).altText ? [(target as BulkItemBase).altText as string] : undefined,
            tagUsers: (target as BulkItemBase).tagUsers || undefined,
            advancedByPlatform: (target as BulkItemBase).advancedByPlatform,
            captionsByPlatform: (target as BulkItemBase).captionByPlatform,
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

  function applyMetadataRules(caption: string): string {
    if (!metadataRules.enabled) return caption;
    const now = new Date().toISOString().slice(0, 10);
    if (metadataRules.startDate && now < metadataRules.startDate) return caption;
    if (metadataRules.endDate && now > metadataRules.endDate) return caption;
    const tagStr = metadataRules.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
    const cta = metadataRules.ctaLine.trim();
    const parts: string[] = [];
    if (metadataRules.mode === "prioritize") {
      if (tagStr) parts.push(tagStr);
      if (cta) parts.push(cta);
      parts.push(caption);
    } else {
      parts.push(caption);
      if (cta) parts.push(cta);
      if (tagStr) parts.push(tagStr);
    }
    return parts.filter(Boolean).join("\n\n");
  }

  function applyRulesToAllCaptions() {
    if (items.length === 0) {
      toast({ title: "No items to apply rules to", tone: "warning" });
      return;
    }
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        caption: applyMetadataRules(it.caption),
      }))
    );
    toast({ title: "Campaign rules applied to all captions", tone: "success" });
  }

  function applyHashtagsToAll(tags: string[]) {
    if (tags.length === 0 || items.length === 0) return;
    setItems((prev) =>
      prev.map((it) => {
        const current = it.caption;
        const tagText = tags.join(" ");
        const nextCaption = current.trim() ? `${current.trim()} ${tagText}` : tagText;
        const nextTags = Array.from(new Set([...(it.hashtags ?? []), ...tags.map((t) => t.replace(/^#/, ""))]));
        return { ...it, caption: nextCaption, hashtags: nextTags };
      })
    );
    toast({ title: `Applied ${tags.length} hashtag(s) to all posts`, tone: "success" });
  }

  function applyFirstCommentToAll(comment: string) {
    if (!comment || items.length === 0) return;
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        firstComment: comment,
      }))
    );
    toast({ title: "First comment applied to all posts", tone: "success" });
  }

  function applyTagUsersToAll(tagUsers: string) {
    if (!tagUsers || items.length === 0) return;
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        tagUsers: tagUsers,
      }))
    );
    toast({ title: "Tagged users applied to all posts", tone: "success" });
  }

  async function handleExternalImport(importedFiles: ImportedFile[]) {
    if (importedFiles.length === 0) return;
    toast({
      title: `Importing ${importedFiles.length} file${importedFiles.length > 1 ? "s" : ""}…`,
      tone: "info",
    });
    const fetched: File[] = [];
    const failures: string[] = [];
    await Promise.all(
      importedFiles.map(async (item) => {
        try {
          const res = await fetch(item.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const mime = item.mimeType || blob.type || "image/jpeg";
          fetched.push(new File([blob], item.name, { type: mime }));
        } catch {
          failures.push(item.name);
        }
      })
    );
    if (failures.length > 0) {
      toast({
        title: `${failures.length} import${failures.length === 1 ? "" : "s"} failed`,
        description: failures.slice(0, 3).join(", ") + (failures.length > 3 ? "…" : ""),
        tone: "warning",
      });
    }
    if (fetched.length > 0) await handleFiles(fetched);
  }

  async function applyCroppedImage(dataUrl: string, itemId: string) {
    const file = dataUrlToFile(dataUrl, `cropped_${Date.now()}.jpg`);
    const uploadToastId = toast({
      title: "Uploading cropped image…",
      tone: "info",
    });
    const result = await uploadFile(file);
    if (result) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                url: result.url,
                previewUrl: result.url,
                storedPath: result.storedPath,
                uploadStatus: "ready",
              }
            : it
        )
      );
      toast({ title: "Crop applied", tone: "success" });
    }
  }

  async function applyFrameCover(dataUrl: string, itemId: string) {
    const file = dataUrlToFile(dataUrl, `frame_${Date.now()}.jpg`);
    const uploadToastId = toast({
      title: "Uploading cover frame…",
      tone: "info",
    });
    const result = await uploadFile(file);
    if (result) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                frameCoverUrl: result.url,
              }
            : it
        )
      );
      toast({ title: "Video cover frame applied", tone: "success" });
    }
  }

  function handlePickCustomCover(itemId: string) {
    customCoverTargetItemId.current = itemId;
    customCoverInputRef.current?.click();
  }

  function handleSaveCollaborators(itemId: string, list: string[]) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              collaborators: list,
            }
          : it
      )
    );
    toast({
      title: list.length === 0 ? "Collaborators cleared" : `${list.length} collaborator${list.length > 1 ? "s" : ""} saved`,
      tone: "success",
    });
  }

  function handleAutoFitAllOverLimit() {
    let count = 0;
    setItems((prev) =>
      prev.map((it) => {
        let changed = false;
        const nextCaptionByPlatform = { ...(it.captionByPlatform ?? {}) };
        for (const pid of it.accountIds) {
          const lim = getPlatformLimit(pid);
          const currentCap = nextCaptionByPlatform[pid] ?? it.caption;
          if (currentCap.length > lim) {
            nextCaptionByPlatform[pid] = fitCaptionForPlatform(it.caption, pid);
            changed = true;
            count++;
          }
        }
        return changed ? { ...it, captionByPlatform: nextCaptionByPlatform } : it;
      })
    );
    if (count > 0) {
      toast({
        title: `Auto-fitted ${count} platform caption${count > 1 ? "s" : ""} to exact limits!`,
        description: "All character limit warnings have been resolved.",
        tone: "success",
      });
    } else {
      toast({ title: "All platform captions are already within limits!", tone: "info" });
    }
  }

  async function aiGenerateForAll(opts?: {
    tone: string;
    includeHashtags: boolean;
    useEmojis: boolean;
    multiPlatform?: boolean;
    extra: string;
  }) {
    const options = opts ?? {
      tone: "default",
      includeHashtags: true,
      useEmojis: true,
      multiPlatform: true,
      extra: "",
    };
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
          // Works for any content type: image → vision via data URI, video → title, others → filename
          if (item.kind === "image") {
            if (item.source === "upload" && (item as UploadedBulkItem).file) {
              const file = (item as UploadedBulkItem).file;
              try {
                if (file.size <= 4 * 1024 * 1024) {
                  imageUrl = await fileToDataUri(file);
                } else {
                  imageUrl = item.url.startsWith("https://") ? item.url : undefined;
                }
              } catch {
                imageUrl = item.url.startsWith("https://") ? item.url : undefined;
              }
              if (!imageUrl) imageUrl = item.url.startsWith("https://") ? item.url : undefined;
              if (!imageUrl) videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
            } else if ((item as CsvBulkItem).mediaUrl) {
              imageUrl = (item as CsvBulkItem).mediaUrl;
              if (!imageUrl) videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
            } else {
              videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
            }
          } else {
            videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
          }
          // Fallback: if still no context, use filename + hashtags as videoTitle
          if (!imageUrl && !videoTitle) {
            videoTitle = [item.name.replace(/\.[^.]+$/, ""), ...(item.hashtags ?? []).join(" ")].join(" ").trim() || "social media post";
          }
          const idToken = await getIdToken();
          const platformsCtx = item.accountIds.map((pid) => {
            const meta = PLATFORMS.find((p) => p.id === pid);
            return { id: pid, name: meta?.name ?? pid, charLimit: meta?.charLimit ?? 280 };
          });
          const extraCtx = [
            options.extra,
            item.name !== "CSV row 2" ? `File: ${item.name}` : null,
            (item.hashtags ?? []).length > 0 ? `Hashtags: ${(item.hashtags ?? []).join(" ")}` : null,
          ]
            .filter(Boolean)
            .join(" | ");
          const res = await fetch("/api/ai/caption", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getOverrideHeaders(),
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({
              tone: options.tone,
              includeHashtags: options.includeHashtags,
              useEmojis: options.useEmojis,
              multiPlatform: options.multiPlatform ?? true,
              extra: extraCtx,
              imageUrl,
              videoTitle,
              platforms: platformsCtx,
            }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            caption?: string;
            captionsByPlatform?: Record<string, string>;
            error?: string;
          };
          if (res.ok && data.ok && data.caption) {
            const baseCaption = data.caption.trim();
            const returnedByPlatform = data.captionsByPlatform ?? {};
            const finalByPlatform: Partial<Record<PlatformId, string>> = {};
            for (const pid of item.accountIds) {
              finalByPlatform[pid] = returnedByPlatform[pid]?.trim() || fitCaptionForPlatform(baseCaption, pid);
            }
            setItems((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? {
                      ...it,
                      caption: baseCaption,
                      captionByPlatform: finalByPlatform,
                    }
                  : it
              )
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
    setBatchAiOpen(false);
    toast({
      title: t("posts.bulkSchedule.ai_generated", { n: success, m: itemsToProcess.length }),
      description: failed.length > 0 ? `Failed: ${failed.slice(0, 3).join("; ")}` : "Platform-tailored variations applied in 1 call per post!",
      tone: failed.length > 0 ? "warning" : "success",
    });
  }

  async function aiGenerateForItem(item: BulkItem, opts: { tone: string; includeHashtags: boolean; useEmojis: boolean; multiPlatform?: boolean; extra: string }) {
    setAiGeneratingItemId(item.id);
    try {
      let imageUrl: string | undefined;
      let videoTitle: string | undefined;
      // Handle any content type: image via data URI vision, video via title, fallback via filename
      if (item.kind === "image") {
        if (item.source === "upload" && (item as UploadedBulkItem).file) {
          const file = (item as UploadedBulkItem).file;
          try {
            if (file.size <= 4 * 1024 * 1024) imageUrl = await fileToDataUri(file);
            else imageUrl = item.url.startsWith("https://") ? item.url : undefined;
          } catch {
            imageUrl = item.url.startsWith("https://") ? item.url : undefined;
          }
          if (!imageUrl) imageUrl = item.url.startsWith("https://") ? item.url : undefined;
          if (!imageUrl) videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
        } else {
          imageUrl = (item as CsvBulkItem).mediaUrl || undefined;
          if (!imageUrl) videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
        }
      } else {
        videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
      }
      if (!imageUrl && !videoTitle) {
        videoTitle = [item.name.replace(/\.[^.]+$/, ""), ...(item.hashtags ?? []).join(" ")].join(" ").trim() || "social media post";
      }
      const idToken = await getIdToken();
      const platformsCtx = item.accountIds.map((pid) => {
        const meta = PLATFORMS.find((p) => p.id === pid);
        return { id: pid, name: meta?.name ?? pid, charLimit: meta?.charLimit ?? 280 };
      });
      // Merge caller extra with file context so vision fallback still has hints
      const mergedExtra = [opts.extra, `File: ${item.name}`, (item.hashtags ?? []).length ? `Hashtags: ${(item.hashtags ?? []).join(" ")}` : null].filter(Boolean).join(" | ");
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getOverrideHeaders(),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          tone: opts.tone,
          includeHashtags: opts.includeHashtags,
          useEmojis: opts.useEmojis,
          multiPlatform: opts.multiPlatform ?? true,
          extra: mergedExtra,
          imageUrl,
          videoTitle,
          platforms: platformsCtx,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        caption?: string;
        captionsByPlatform?: Record<string, string>;
        error?: string;
      };
      if (res.ok && data.ok && data.caption) {
        const baseCaption = data.caption.trim();
        const returnedByPlatform = data.captionsByPlatform ?? {};
        const finalByPlatform: Partial<Record<PlatformId, string>> = {};
        for (const pid of item.accountIds) {
          finalByPlatform[pid] = returnedByPlatform[pid]?.trim() || fitCaptionForPlatform(baseCaption, pid);
        }
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  caption: baseCaption,
                  captionByPlatform: finalByPlatform,
                }
              : it
          )
        );
        toast({
          title: "Platform-optimized captions generated",
          description: "All platform limits matched in 1 single call!",
          tone: "success",
        });
        setAiTarget(null);
      } else {
        toast({ title: "Generation failed", description: data.error ?? `HTTP ${res.status}`, tone: "error" });
      }
    } catch (e) {
      toast({ title: "Generation failed", description: e instanceof Error ? e.message : "Network error", tone: "error" });
    } finally {
      setAiGeneratingItemId(null);
    }
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
  const totalIssues = useMemo(() => validateItems(items), [items]);
  const readyCount = items.length - new Set(totalIssues.map((i) => i.itemId)).size;
  const blockedCount = items.length - readyCount;

  return (
    <div className="min-h-0 flex-1 bg-[#fcfcfc] dark:bg-zinc-950">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4">
        {/* ── Pro Header — linked to ecosystem ── */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
            <div className="flex gap-3 min-w-0">
              <span className="hidden sm:inline-flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm shrink-0">
                <Layers className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-zinc-900 leading-none">{t("posts.bulkSchedule.page_title")}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold tracking-widest px-2 py-0.5 uppercase">
                    <Sparkles className="size-3" /> Pro
                  </span>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border", items.length === 0 ? "bg-zinc-100 text-zinc-600 border-zinc-200" : blockedCount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                    <ListChecks className="size-3.5" />
                    {items.length === 0 ? "Ready to bulk" : `${readyCount}/${items.length} ready`}
                  </span>
                </div>
                <p className="text-[13px] sm:text-sm text-zinc-500 mt-1 max-w-[720px] leading-relaxed">
                  {t("posts.bulkSchedule.page_subtitle")} <span className="hidden sm:inline">• Linked to <Link href="/dashboard/posts/create" className="underline decoration-dotted hover:text-zinc-700">Create Post</Link> • <Link href="/dashboard/queue" className="underline decoration-dotted hover:text-zinc-700">Queue</Link> • <Link href="/dashboard/calendar" className="underline decoration-dotted hover:text-zinc-700">Calendar</Link> • <Link href="/dashboard/posts/history" className="underline decoration-dotted hover:text-zinc-700">History</Link></span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/dashboard/calendar" className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm">
                <Calendar className="size-3.5" /> Calendar
              </Link>
              <Link href="/dashboard/queue" className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm">
                <ListChecks className="size-3.5" /> Queue
              </Link>
              <Link href="/dashboard/posts/create" className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white px-4 h-9 text-xs font-bold shadow-sm">
                <Plus className="size-3.5" /> Create Post <ArrowUpRight className="size-3 opacity-70 hidden sm:block" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-2.5 py-1 font-bold">Bulk Schedule</span>
            <Link href="/dashboard/posts/create" className="inline-flex items-center gap-1 rounded-full bg-white border border-zinc-200 px-2.5 py-1 font-medium text-zinc-600 hover:bg-zinc-50">Single Post <ExternalLink className="size-3 opacity-50" /></Link>
            <Link href="/dashboard/assets" className="hidden sm:inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-white border border-transparent hover:border-zinc-200 px-2.5 py-1 font-medium text-zinc-600">Media Library</Link>
            <Link href="/dashboard/hashtags" className="hidden sm:inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">Hashtags</Link>
            <span className="text-zinc-400 hidden sm:inline">• Auto-scheduler + per-post advanced controls</span>
            {(() => {
              const cfg = getHelpConfig("posts/bulk-schedule");
              if (!cfg) return null;
              return <PageHelp config={cfg} align="left" buttonClassName="rounded-full" />;
            })()}
          </div>
        </div>

        {/* ── Pro Scheduler Bar — double-bezel soft */}
        <div className="rounded-[16px] border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-2 sm:p-3">
          <div className="flex flex-wrap items-end gap-2">
            <SchedulerField label={t("posts.bulkSchedule.start_date")}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </SchedulerField>
            <SchedulerField label={t("posts.bulkSchedule.time")}>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </SchedulerField>
            <SchedulerField label={t("posts.bulkSchedule.posts_per_day")}>
              <select
                value={postsPerDay}
                onChange={(e) => setPostsPerDay(parseInt(e.target.value, 10))}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </SchedulerField>
            <SchedulerField label={t("posts.bulkSchedule.interval")}>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {INTERVALS.map((i) => (
                  <option key={i.id} value={i.id}>
                    {t(`posts.bulkSchedule.interval_${i.id === "1d" ? "daily" : i.id === "3d" ? "3days" : i.id === "7d" ? "weekly" : i.id === "14d" ? "2weeks" : "monthly"}`)}
                  </option>
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
                  className="inline-flex items-center gap-1.5 h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50"
                >
                  <Timer className="size-3.5 text-zinc-500" />
                  <span>{timezone}</span>
                  <ChevronDown className="size-3.5 text-zinc-500" />
                </button>
                {tzOpen ? (
                  <ul role="listbox" className="absolute right-0 top-full mt-2 z-30 w-[220px] max-h-[260px] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg p-1">
                    {TIMEZONES.map((tz) => (
                      <li key={tz.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setTimezone(tz.id);
                            setTzOpen(false);
                          }}
                          className={cn("w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-zinc-100 font-medium", tz.id === timezone && "bg-zinc-900 text-white hover:bg-zinc-900")}
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
              className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white px-4 h-9 text-xs font-bold disabled:opacity-50 shadow-sm"
            >
              <Clock className="size-3.5" />
              {t("posts.bulkSchedule.apply")}
            </button>
            {totalIssues.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 text-xs font-bold">
                <AlertCircle className="size-3.5" /> {blockedCount} blocked • {readyCount} ready
              </span>
            )}
            {totalIssues.length === 0 && items.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 text-xs font-bold">
                <CheckCircle2 className="size-3.5" /> All ready
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 hidden sm:block">Start date sets slot 1. We auto-space posts in your timezone ({timezone}), 30 min apart per day. <Link href="/dashboard/calendar" className="underline decoration-dotted hover:text-zinc-700">View in Calendar</Link> after scheduling.</p>
        </div>

        {/* ── AI + Campaign Rules + Undo bar ── */}
        {items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setBatchAiOpen(true)}
                  disabled={generating}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-black disabled:opacity-50 text-white px-4 h-9 text-xs font-bold shadow-sm"
                >
                  <Sparkles className="size-4" />
                  {generating ? t("posts.bulkSchedule.generating") : t("posts.bulkSchedule.generate_ai_captions", { n: items.length })}
                </button>
                <button
                  type="button"
                  onClick={() => setRulesOpen((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border px-3 h-9 text-xs font-semibold shadow-sm transition-colors",
                    metadataRules.enabled
                      ? "bg-zinc-900 text-white border-zinc-900 hover:bg-black"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  <Hash className="size-3.5" />
                  Campaign Rules
                  {metadataRules.enabled && (
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  <Zap className="size-3.5 text-amber-500" /> Per-post AI with tone & platform adaptation
                </span>
              </div>
              <div className="flex items-center gap-2">
                {undoStack.length > 0 ? (
                  <button
                    type="button"
                    onClick={undoRemove}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-9 text-xs font-semibold hover:bg-zinc-50 shadow-sm"
                  >
                    <Undo2 className="size-3.5" />
                    Undo remove ({undoStack.length})
                  </button>
                ) : null}
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-2.5 py-1 text-[11px] font-bold">{items.length}/{MAX_FILES} files</span>
              </div>
            </div>

            {/* Campaign Rules expandable panel */}
            {rulesOpen && (
              <div className="p-4 rounded-[16px] border border-zinc-200 bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Hash className="size-3.5 text-zinc-600" /> Global Campaign & CTA Rules
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Auto-merge hashtags or call-to-action lines across all posts in your bulk batch.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={applyRulesToAllCaptions}
                    disabled={!metadataRules.enabled}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black disabled:opacity-50 text-white px-3 h-8 text-xs font-bold shadow-sm"
                  >
                    <CheckCircle2 className="size-3.5" /> Apply Rules to All Posts
                  </button>
                </div>
                <MetadataRulesPanel
                  rules={metadataRules}
                  onChange={setMetadataRules}
                />
              </div>
            )}
          </div>
        ) : null}

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
          {/* Left */}
          <div className="space-y-4 lg:sticky lg:top-4">
            {/* Accounts */}
            <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="size-7 inline-flex items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">1</span>
                  <h3 className="text-sm font-bold tracking-tight">{t("posts.bulkSchedule.accounts_title")}</h3>
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600">{accounts.size} selected</span>
                </div>
                <div className="max-h-[320px] overflow-y-auto -mx-1 px-1 space-y-1">
                  {PLATFORMS.map((p) => {
                    const isSel = accounts.has(p.id);
                    return (
                      <label
                        key={p.id}
                        className={cn(
                          "flex items-center gap-2.5 w-full p-2 rounded-xl cursor-pointer transition-colors border",
                          isSel ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleAccount(p.id)}
                          className="sr-only"
                        />
                        <span className={cn("size-[18px] rounded-[6px] border-2 flex items-center justify-center shrink-0", isSel ? "bg-white border-white text-zinc-900" : "bg-white border-zinc-300")}>
                          {isSel && <CheckCircle2 className="size-3 fill-zinc-900 text-white" />}
                        </span>
                        <ProPlatformIcon platform={p.id} size={24} />
                        <span className={cn("text-xs font-semibold truncate", isSel ? "text-white" : "text-zinc-700")}>{p.handle}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">Default for new uploads. Use “Apply to all” to overwrite each post’s platforms. <Link href="/dashboard/accounts" className="underline decoration-dotted hover:text-zinc-700">Manage connections</Link></p>
              </div>
            </div>

            {/* Media Files */}
            <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-7 inline-flex items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">2</span>
                    <h3 className="text-sm font-bold tracking-tight">{t("posts.bulkSchedule.media_files_title")}</h3>
                    <span className="text-xs font-mono text-zinc-500">
                      {items.length}/{MAX_FILES}
                    </span>
                  </div>
                  {items.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={pickMoreFiles}
                        className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 h-7 text-xs font-semibold hover:bg-zinc-50"
                      >
                        <Plus className="size-3" />
                        {t("posts.bulkSchedule.add_more")}
                      </button>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="inline-flex items-center gap-1 px-2 h-7 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="size-3" />
                        {t("posts.bulkSchedule.clear_all")}
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Cloud and stock integrations buttons */}
                <div className="mb-3">
                  <p className="text-[11px] font-semibold text-zinc-600 mb-1.5">Import from Cloud & Stock</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setUnsplashOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-700 shadow-sm"
                    >
                      <BrandIcons.unsplash size={14} /> Unsplash
                    </button>
                    <button
                      type="button"
                      onClick={() => setCanvaOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-700 shadow-sm"
                    >
                      <BrandIcons.canva size={14} /> Canva
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriveOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-700 shadow-sm"
                    >
                      <BrandIcons.googledrive size={14} /> Drive
                    </button>
                    <button
                      type="button"
                      onClick={() => setDropboxOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-700 shadow-sm"
                    >
                      <BrandIcons.dropbox size={14} /> Dropbox
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <>
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
                        "rounded-[14px] border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
                        dragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
                      )}
                    >
                      <span className="mx-auto size-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
                        <UploadCloud className="size-5" />
                      </span>
                      <p className="mt-3 text-sm font-semibold text-zinc-900">{t("posts.bulkSchedule.drop_zone")}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {t("posts.bulkSchedule.drop_zone_desc", { max: MAX_FILES })}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        {t("posts.bulkSchedule.drop_zone_footnote", { maxSize: Math.round(MAX_FILE_BYTES / 1024 / 1024) })}
                      </p>
                    </div>
                    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 flex flex-col gap-2">
                      <p className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                        <FileText className="size-3.5" /> CSV bulk? We got you.
                      </p>
                      <p className="text-xs text-zinc-600">{t("posts.bulkSchedule.csv_hint")}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={downloadCsvTemplate}
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 h-7 text-xs font-semibold hover:bg-zinc-50"
                        >
                          <Download className="size-3.5" />
                          Template
                        </button>
                        <button
                          type="button"
                          onClick={pickCsvFile}
                          disabled={csvBusy}
                          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 text-white px-3 h-7 text-xs font-bold hover:bg-black disabled:opacity-50"
                        >
                          <Upload className="size-3.5" />
                          {csvBusy ? t("posts.bulkSchedule.reading") : t("posts.bulkSchedule.upload_csv")}
                        </button>
                      </div>
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
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
                        <ImageIcon className="size-3.5" /> {t("posts.bulkSchedule.selected_media")}
                      </span>
                      <span className="text-zinc-500">{t("posts.bulkSchedule.manage_uploads")}</span>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto -mx-1 px-1 space-y-1.5">
                      {items.map((item, idx) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-2.5 p-2 rounded-xl border transition-colors",
                            item.uploadStatus === "error" ? "bg-red-50 border-red-200" : "bg-white border-zinc-200 hover:border-zinc-300"
                          )}
                        >
                          <div className="relative size-10 flex-shrink-0 rounded-lg bg-zinc-100 overflow-hidden border border-zinc-200">
                            {item.kind === "image" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.source === "upload" ? item.previewUrl : item.url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <video src={item.source === "upload" ? item.previewUrl : item.url} className="w-full h-full object-cover" />
                            )}
                            {item.source === "upload" && item.uploadStatus === "uploading" ? (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              </div>
                            ) : null}
                            {item.source === "upload" && item.uploadStatus === "error" ? (
                              <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                                <X className="size-3.5 text-white" />
                              </div>
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate">{item.name}</p>
                            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                              {item.source === "upload" && item.uploadStatus === "uploading" ? (
                                <span className="inline-flex items-center gap-1 text-amber-600">
                                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" /> Uploading…
                                </span>
                              ) : item.source === "upload" && item.uploadStatus === "error" ? (
                                <span className="text-red-600">Upload failed</span>
                              ) : (
                                formatBytes(item.size)
                              )}
                              <span>•</span> {item.kind === "image" ? "Image" : "Video"} #{idx + 1}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="size-7 inline-flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 shrink-0"
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
                        "mt-3 rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors flex flex-col items-center gap-1",
                        dragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:bg-zinc-50"
                      )}
                    >
                      <ImagePlus className="size-4 text-zinc-400" />
                      <p className="text-xs font-semibold text-zinc-700">Drop to add more media files</p>
                      <p className="text-[11px] text-zinc-500">
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

          {/* Right */}
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
                    // Guard: image posts cannot go to video-only platforms (YouTube)
                    if (!has && (it as BulkItemBase).kind === "image" && isVideoOnlyPlatform(platformId)) {
                      toast({ title: "YouTube is video-only", description: "This post is an image — YouTube requires video. Upload a video to enable YouTube.", tone: "warning" });
                      return it;
                    }
                    const nextIds = has ? it.accountIds.filter((a) => a !== platformId) : [...it.accountIds, platformId];
                    // sync advanced defaults for newly added platform
                    let adv = (it as BulkItemBase).advancedByPlatform ?? {};
                    if (!has) {
                      const def = getDefaultOptions(platformId);
                      adv = { ...adv, [platformId]: { ...def, ...(platformId === "pinterest" && destinationOptions.boards[0] ? { pinterest_board_id: destinationOptions.boards[0].value } : {}), ...(platformId === "facebook" && destinationOptions.pages[0] ? { facebook_page_id: destinationOptions.pages[0].value } : {}) } };
                    } else {
                      const { [platformId]: _omit, ...rest } = adv;
                      adv = rest;
                    }
                    return {
                      ...it,
                      accountIds: nextIds,
                      advancedByPlatform: adv,
                    } as BulkItem;
                  })
                );
              }}
              onUpdateItem={updateItem}
              onUpdateAdvanced={updateAdvanced}
              onRemove={removeItem}
              onApplyAccountsToAll={applyAccountsToAll}
              onScheduleSingle={scheduleSingle}
              onOpenAI={(item) => setAiTarget(item)}
              onOpenCrop={(item) => setCropTarget(item)}
              onOpenCover={(item) => setCoverTarget(item)}
              onPickCustomCover={handlePickCustomCover}
              onOpenCollaborators={(item) => setCollaboratorsTarget(item)}
              onApplyHashtagsToAll={applyHashtagsToAll}
              onApplyFirstCommentToAll={applyFirstCommentToAll}
              onApplyTagUsersToAll={applyTagUsersToAll}
              onAutoFitAllOverLimit={handleAutoFitAllOverLimit}
              destinationOptions={destinationOptions}
              aiGeneratingItemId={aiGeneratingItemId}
              timezone={timezone}
            />
          )}
        </div>

        {/* Sticky bottom bar */}
        {items.length > 0 ? (
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 h-[64px] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="hidden sm:inline-flex size-8 items-center justify-center rounded-full bg-zinc-900 text-white">
                  <Layers className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-none">{t("posts.bulkSchedule.posts_ready", { n: items.length })} • {readyCount} ready</p>
                  <p className="text-xs text-zinc-500 hidden sm:block">
                    {blockedCount > 0 ? `${blockedCount} need attention — fix captions & required fields` : "All posts validated"} • <Link href="/dashboard/queue" className="underline decoration-dotted hover:text-zinc-700">View Queue</Link>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleScheduleAll}
                disabled={scheduleBusy || blockedCount > 0}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 h-10 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Calendar className="size-4" />
                {scheduleBusy ? t("posts.bulkSchedule.scheduling") : t("posts.bulkSchedule.schedule_all")}
                <span className="hidden sm:inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-white/20 text-[11px] px-1.5">{items.length}</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Batch AI dialog */}
        <AICaptionsDialog
          open={batchAiOpen}
          onClose={() => setBatchAiOpen(false)}
          isGenerating={generating}
          batchCount={items.length}
          imageUrl={
            items[0]?.kind === "image"
              ? items[0]?.source === "upload"
                ? (items[0] as UploadedBulkItem)?.previewUrl || items[0]?.url
                : (items[0] as CsvBulkItem)?.mediaUrl
              : null
          }
          videoTitle={items[0]?.kind === "video" ? items[0]?.name.replace(/\.[^.]+$/, "") : null}
          onGenerate={(opts) => void aiGenerateForAll(opts)}
        />

        {/* Per-item AI dialog */}
        <AICaptionsDialog
          open={!!aiTarget}
          onClose={() => setAiTarget(null)}
          isGenerating={!!aiGeneratingItemId}
          imageUrl={
            aiTarget?.kind === "image"
              ? aiTarget?.source === "upload"
                ? (aiTarget as UploadedBulkItem)?.previewUrl || aiTarget?.url
                : (aiTarget as CsvBulkItem)?.mediaUrl
              : null
          }
          videoTitle={aiTarget?.kind === "video" ? aiTarget?.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() ?? null : null}
          onGenerate={(opts) => {
            if (aiTarget) void aiGenerateForItem(aiTarget, opts);
          }}
        />

        {/* External Cloud media dialogs */}
        <UnsplashDialog
          open={unsplashOpen}
          onClose={() => setUnsplashOpen(false)}
          onImport={handleExternalImport}
        />
        <CanvaDialog
          open={canvaOpen}
          onClose={() => setCanvaOpen(false)}
          onImport={handleExternalImport}
        />
        <GoogleDriveDialog
          open={driveOpen}
          onClose={() => setDriveOpen(false)}
          onImport={handleExternalImport}
        />
        <DropboxDialog
          open={dropboxOpen}
          onClose={() => setDropboxOpen(false)}
          onImport={handleExternalImport}
        />

        {/* Media editing modals */}
        <CropModal
          open={!!cropTarget}
          onClose={() => setCropTarget(null)}
          imageUrl={cropTarget ? (cropTarget.source === "upload" ? cropTarget.previewUrl : cropTarget.url) : null}
          onApply={(dataUrl) => {
            if (cropTarget) void applyCroppedImage(dataUrl, cropTarget.id);
            setCropTarget(null);
          }}
        />
        <CoverImageModal
          open={!!coverTarget}
          onClose={() => setCoverTarget(null)}
          videoUrl={coverTarget ? (coverTarget.source === "upload" ? coverTarget.previewUrl : coverTarget.url) : null}
          onApply={(dataUrl) => {
            if (coverTarget) void applyFrameCover(dataUrl, coverTarget.id);
            setCoverTarget(null);
          }}
        />
        <CollaboratorsModal
          open={!!collaboratorsTarget}
          onClose={() => setCollaboratorsTarget(null)}
          collaborators={collaboratorsTarget?.collaborators ?? []}
          onSave={(list) => {
            if (collaboratorsTarget) handleSaveCollaborators(collaboratorsTarget.id, list);
            setCollaboratorsTarget(null);
          }}
        />

        {/* Hidden custom cover input for video thumbnails */}
        <input
          ref={customCoverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            const targetId = customCoverTargetItemId.current;
            if (file && targetId) {
              const res = await uploadFile(file);
              if (res) {
                setItems((prev) =>
                  prev.map((it) =>
                    it.id === targetId
                      ? {
                          ...it,
                          customCoverUrl: res.url,
                        }
                      : it
                  )
                );
                toast({ title: "Custom cover uploaded", tone: "success" });
              }
            }
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function SchedulerField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("dashboard");
  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm p-8 sm:p-12 text-center">
        <span className="mx-auto size-12 rounded-[14px] bg-zinc-900 text-white flex items-center justify-center shadow-sm">
          <Upload className="size-6" />
        </span>
        <h3 className="mt-4 text-lg font-bold tracking-tight">{t("posts.bulkSchedule.empty_title")}</h3>
        <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
          {t("posts.bulkSchedule.empty_subtitle")}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
          <Link href="/dashboard/posts/create" className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 text-white px-3 py-1.5 font-bold">
            <Plus className="size-3.5" /> Create single post
          </Link>
          <Link href="/dashboard/assets" className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 font-semibold hover:bg-zinc-50">
            <Eye className="size-3.5" /> Media Library
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StepCard n={1} title={t("posts.bulkSchedule.empty_step1_title")} desc={t("posts.bulkSchedule.empty_step1_desc")} />
        <StepCard n={2} title={t("posts.bulkSchedule.empty_step2_title")} desc={t("posts.bulkSchedule.empty_step2_desc", { max: 20 })} />
        <StepCard n={3} title={t("posts.bulkSchedule.empty_step3_title")} desc={t("posts.bulkSchedule.empty_step3_desc")} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TipCard icon={<Clock className="size-4 text-blue-600" />} title={t("posts.bulkSchedule.tip_scheduler_title")} desc={t("posts.bulkSchedule.tip_scheduler_desc")} />
        <TipCard icon={<Sparkles className="size-4 text-violet-600" />} title={t("posts.bulkSchedule.tip_ai_title")} desc={t("posts.bulkSchedule.tip_ai_desc")} />
      </div>
    </div>
  );
}

function StepCard({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm p-5">
      <div className="size-8 inline-flex items-center justify-center rounded-full bg-zinc-900 text-white text-sm font-bold mb-3">
        {n}
      </div>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function TipCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm p-4 flex items-start gap-3">
      <div className="size-8 rounded-xl bg-zinc-100 inline-flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
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
  onUpdateAdvanced: (id: string, platform: PlatformId, next: PlatformAdvancedOptions) => void;
  onRemove: (id: string) => void;
  onApplyAccountsToAll: () => void;
  onScheduleSingle: (itemId: string) => void;
  onOpenAI: (item: BulkItem) => void;
  onOpenCrop: (item: BulkItem) => void;
  onOpenCover: (item: BulkItem) => void;
  onPickCustomCover: (itemId: string) => void;
  onOpenCollaborators: (item: BulkItem) => void;
  onApplyHashtagsToAll: (tags: string[]) => void;
  onApplyFirstCommentToAll: (comment: string) => void;
  onApplyTagUsersToAll: (tagUsers: string) => void;
  onAutoFitAllOverLimit: () => void;
  destinationOptions: { boards: Array<{ value: string; label: string }>; pages: Array<{ value: string; label: string }> };
  aiGeneratingItemId: string | null;
  timezone: string;
}

function PostsList({
  items,
  accountsCount,
  onToggleAccount,
  onUpdateItem,
  onUpdateAdvanced,
  onRemove,
  onApplyAccountsToAll,
  onScheduleSingle,
  onOpenAI,
  onOpenCrop,
  onOpenCover,
  onPickCustomCover,
  onOpenCollaborators,
  onApplyHashtagsToAll,
  onApplyFirstCommentToAll,
  onApplyTagUsersToAll,
  onAutoFitAllOverLimit,
  destinationOptions,
  aiGeneratingItemId,
  timezone,
}: PostsListProps) {
  const t = useTranslations("dashboard");
  const [firstCommentPrompt, setFirstCommentPrompt] = useState("");
  const [showFirstCommentInput, setShowFirstCommentInput] = useState(false);
  const [tagUsersPrompt, setTagUsersPrompt] = useState("");
  const [showTagUsersInput, setShowTagUsersInput] = useState(false);

  return (
    <div className="space-y-3 pb-6">
      <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <ProStatIcon tint="blue" size={28}>
              <Layers className="size-3.5" />
            </ProStatIcon>
            {t("posts.bulkSchedule.posts_ready", { n: items.length })}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">{t("posts.bulkSchedule.customize_subtitle")} • Advanced per-platform controls inside each card.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onAutoFitAllOverLimit}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 h-8 text-xs font-bold shadow-sm"
          >
            <Zap className="size-3.5 text-amber-600" /> Auto-Fit Over-Limit
          </button>
          <HashtagsDropdown
            onInsert={onApplyHashtagsToAll}
            align="right"
            size="sm"
            className="rounded-full font-bold shadow-sm"
          />
          <button
            type="button"
            onClick={() => setShowFirstCommentInput((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 h-8 text-xs font-semibold hover:bg-zinc-50 shadow-sm"
          >
            <MessageSquare className="size-3.5" /> First comment
          </button>
          <button
            type="button"
            onClick={() => setShowTagUsersInput((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 h-8 text-xs font-semibold hover:bg-zinc-50 shadow-sm"
          >
            <Users className="size-3.5" /> Tag users
          </button>
          <button
            type="button"
            onClick={onApplyAccountsToAll}
            disabled={accountsCount === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 h-8 text-xs font-bold hover:bg-zinc-50 disabled:opacity-50 shadow-sm"
          >
            <Users className="size-3.5" />
            {t("posts.bulkSchedule.apply_accounts_all")}
          </button>
        </div>
      </div>

      {showFirstCommentInput && (
        <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center gap-2">
          <input
            type="text"
            value={firstCommentPrompt}
            onChange={(e) => setFirstCommentPrompt(e.target.value)}
            placeholder="Enter first comment to apply to all posts..."
            className="flex-1 h-8 rounded-lg border border-zinc-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <button
            type="button"
            onClick={() => {
              onApplyFirstCommentToAll(firstCommentPrompt);
              setShowFirstCommentInput(false);
              setFirstCommentPrompt("");
            }}
            className="px-3 h-8 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-black"
          >
            Apply to All
          </button>
          <button
            type="button"
            onClick={() => setShowFirstCommentInput(false)}
            className="px-2 h-8 rounded-lg text-xs font-medium text-zinc-500 hover:bg-zinc-200"
          >
            Cancel
          </button>
        </div>
      )}

      {showTagUsersInput && (
        <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center gap-2">
          <input
            type="text"
            value={tagUsersPrompt}
            onChange={(e) => setTagUsersPrompt(e.target.value)}
            placeholder="Enter tagged users (e.g. @user1, @user2) for all posts..."
            className="flex-1 h-8 rounded-lg border border-zinc-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <button
            type="button"
            onClick={() => {
              onApplyTagUsersToAll(tagUsersPrompt);
              setShowTagUsersInput(false);
              setTagUsersPrompt("");
            }}
            className="px-3 h-8 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-black"
          >
            Apply to All
          </button>
          <button
            type="button"
            onClick={() => setShowTagUsersInput(false)}
            className="px-2 h-8 rounded-lg text-xs font-medium text-zinc-500 hover:bg-zinc-200"
          >
            Cancel
          </button>
        </div>
      )}

      {items.map((item, idx) => (
        <PostRow
          key={item.id}
          item={item}
          index={idx}
          onToggleAccount={(id) => onToggleAccount(item.id, id)}
          onUpdate={(patch) => onUpdateItem(item.id, patch)}
          onUpdateAdvanced={(pid, next) => onUpdateAdvanced(item.id, pid, next)}
          onRemove={() => onRemove(item.id)}
          onScheduleSingle={() => onScheduleSingle(item.id)}
          onOpenAI={() => onOpenAI(item)}
          onOpenCrop={() => onOpenCrop(item)}
          onOpenCover={() => onOpenCover(item)}
          onPickCustomCover={() => onPickCustomCover(item.id)}
          onOpenCollaborators={() => onOpenCollaborators(item)}
          destinationOptions={destinationOptions}
          aiGenerating={aiGeneratingItemId === item.id}
          timezone={timezone}
        />
      ))}
    </div>
  );
}

function ReadinessBadgePopover({
  readiness,
  item,
  onAutoFitPlatform,
}: {
  readiness: ReadinessReport;
  item: BulkItem;
  onAutoFitPlatform: (pid: PlatformId) => void;
}) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Aggregate issues
  const issuesList = useMemo(() => {
    const list: {
      platform: PlatformId;
      severity: "blocked" | "warning";
      code: string;
      message: string;
    }[] = [];
    for (const p of readiness.perPlatform) {
      for (const iss of p.issues) {
        list.push({
          platform: p.platform as PlatformId,
          severity: iss.severity,
          code: iss.code,
          message: iss.message,
        });
      }
    }
    return list;
  }, [readiness]);

  const isBlocked = readiness.overall === "blocked";
  const isWarning = readiness.overall === "warning";
  const isReady = readiness.overall === "ready";

  return (
    <div className="relative ml-auto" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all shadow-xs cursor-pointer select-none",
          isBlocked
            ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            : isWarning
              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
        )}
        title="Click to view platform readiness details"
      >
        {isBlocked ? (
          <AlertCircle className="size-3 text-red-600" />
        ) : isWarning ? (
          <AlertTriangle className="size-3 text-amber-600" />
        ) : (
          <CheckCircle2 className="size-3 text-emerald-600" />
        )}
        <span>
          {isBlocked
            ? `${readiness.blockedCount} blocked`
            : isWarning
              ? `${readiness.warningCount} warning${readiness.warningCount > 1 ? "s" : ""}`
              : "Ready"}
        </span>
        <ChevronDown className={cn("size-3 opacity-60 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-40 w-72 sm:w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl space-y-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100">
            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              {isReady ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-600" /> All Platforms Ready
                </>
              ) : (
                <>
                  <AlertCircle className="size-3.5 text-red-600" /> Platform Requirements ({issuesList.length})
                </>
              )}
            </span>
            <span className="text-[10px] font-medium text-zinc-400">
              {item.accountIds.length} network{item.accountIds.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isReady ? (
            <p className="text-xs text-zinc-600 py-1">
              All {item.accountIds.length} connected platform{item.accountIds.length !== 1 ? "s" : ""} meet caption and media requirements.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {issuesList.map((iss, i) => {
                const pMeta = PLATFORMS.find((p) => p.id === iss.platform);
                const isCharLimit = iss.code.includes("char_limit") || iss.code.includes("length") || iss.message.includes("characters");
                return (
                  <div
                    key={`${iss.platform}-${iss.code}-${i}`}
                    className={cn(
                      "p-2 rounded-lg border text-xs flex items-start justify-between gap-2",
                      iss.severity === "blocked"
                        ? "bg-red-50/60 border-red-200/80 text-red-900"
                        : "bg-amber-50/60 border-amber-200/80 text-amber-900"
                    )}
                  >
                    <div className="flex items-start gap-1.5 min-w-0">
                      <ProPlatformIcon platform={iss.platform} size={14} className="mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-[11px]">
                          {pMeta?.name ?? iss.platform}
                        </div>
                        <div className="text-[11px] leading-tight text-zinc-700 mt-0.5">
                          {iss.message}
                        </div>
                      </div>
                    </div>
                    {isCharLimit && (
                      <button
                        type="button"
                        onClick={() => {
                          onAutoFitPlatform(iss.platform);
                        }}
                        className="shrink-0 px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] uppercase tracking-wider shadow-xs"
                      >
                        ⚡ Auto-Fit
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PostRow({
  item,
  index,
  onToggleAccount,
  onUpdate,
  onUpdateAdvanced,
  onRemove,
  onScheduleSingle,
  onOpenAI,
  onOpenCrop,
  onOpenCover,
  onPickCustomCover,
  onOpenCollaborators,
  destinationOptions,
  aiGenerating,
  timezone,
}: {
  item: BulkItem;
  index: number;
  onToggleAccount: (id: PlatformId) => void;
  onUpdate: (patch: Partial<BulkItem>) => void;
  onUpdateAdvanced: (platform: PlatformId, next: PlatformAdvancedOptions) => void;
  onRemove: () => void;
  onScheduleSingle: () => void;
  onOpenAI: () => void;
  onOpenCrop: () => void;
  onOpenCover: () => void;
  onPickCustomCover: () => void;
  onOpenCollaborators: () => void;
  destinationOptions: { boards: Array<{ value: string; label: string }>; pages: Array<{ value: string; label: string }> };
  aiGenerating: boolean;
  timezone: string;
}) {
  const t = useTranslations("dashboard");
  const { toast } = useToast();
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
  const mediaKind: MediaKind = item.kind === "video" ? "video" : "image";
  const readiness = useMemo(() => buildReadinessForItem(item, timezone), [item, timezone]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [customPlatformOpen, setCustomPlatformOpen] = useState(false);

  const handleAutoFitPlatform = useCallback(
    (pid: PlatformId) => {
      const currentCap = item.captionByPlatform?.[pid] ?? item.caption;
      const fitted = fitCaptionForPlatform(currentCap, pid);
      onUpdate({
        captionByPlatform: {
          ...(item.captionByPlatform ?? {}),
          [pid]: fitted,
        },
      } as Partial<BulkItem>);
      const pMeta = PLATFORMS.find((pl) => pl.id === pid);
      toast({ title: `Auto-fitted caption for ${pMeta?.name ?? pid}`, tone: "success" });
    },
    [item.captionByPlatform, item.caption, onUpdate, toast]
  );

  return (
    <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Card header with media + platforms summary */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-zinc-200 bg-zinc-50/50">
        <span className="inline-flex items-center justify-center size-7 rounded-full bg-zinc-900 text-white text-xs font-bold">#{index + 1}</span>
        <div className="flex items-center gap-1 flex-wrap">
          {item.accountIds.slice(0, 5).map((pid) => (
            <ProPlatformIcon key={pid} platform={pid} size={22} />
          ))}
          {item.accountIds.length > 5 && <ProOverflowBadge count={item.accountIds.length - 5} size={22} />}
          <span className="text-xs font-semibold text-zinc-700 ml-1">
            {item.accountIds.length} platform{item.accountIds.length !== 1 ? "s" : ""}
          </span>
        </div>
        <ReadinessBadgePopover
          readiness={readiness}
          item={item}
          onAutoFitPlatform={handleAutoFitPlatform}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="size-7 inline-flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
        {/* Media + Schedule + Platforms */}
        <div className="p-3 space-y-3 bg-zinc-50/30">
          <div className="relative rounded-xl overflow-hidden bg-zinc-100 aspect-[4/3] border border-zinc-200">
            {item.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewSrc} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <video src={previewSrc} className="w-full h-full object-cover" />
            )}
            <div className="absolute bottom-1 left-1 right-1 rounded-lg bg-black/60 backdrop-blur px-2 py-1">
              <p className="text-[10px] font-semibold text-white truncate">{item.name}</p>
              <p className="text-[10px] text-white/80 flex items-center gap-1">
                {item.kind === "image" ? <ImageIcon className="size-3" /> : <Video className="size-3" />} {formatBytes(item.size)}
                {item.source === "upload" && item.uploadStatus === "uploading" ? " • Uploading…" : ""}
                {item.source === "upload" && item.uploadStatus === "error" ? " • Failed" : ""}
              </p>
            </div>
          </div>

          {/* Media tools buttons */}
          <div className="space-y-1.5">
            {item.kind === "image" ? (
              <button
                type="button"
                onClick={onOpenCrop}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm"
              >
                <Crop className="size-3 text-zinc-500" /> Crop image
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={onOpenCover}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm"
                >
                  <RefreshCw className="size-3 text-zinc-500" /> Frame
                </button>
                <button
                  type="button"
                  onClick={onPickCustomCover}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm"
                >
                  <Upload className="size-3 text-zinc-500" /> Cover
                </button>
              </div>
            )}

            {(item.frameCoverUrl || item.customCoverUrl) && (
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-zinc-200 text-[10px] font-medium text-emerald-700">
                <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                <span className="truncate">{item.customCoverUrl ? "Custom cover set" : "Frame cover set"}</span>
              </div>
            )}

            {hasInstagram && (
              <button
                type="button"
                onClick={onOpenCollaborators}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm"
              >
                <Users className="size-3 text-zinc-500" />
                Collaborators {item.collaborators?.length ? `(${item.collaborators.length})` : ""}
              </button>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold flex items-center gap-1.5">
              <Settings2 className="size-3.5 text-zinc-500" /> Platforms
            </h4>
            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
              {PLATFORMS.map((p) => {
                const isSel = item.accountIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer text-xs border transition-colors",
                      isSel ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    <span className={cn("size-4 rounded-[6px] border-2 flex items-center justify-center shrink-0", isSel ? "bg-white border-white text-zinc-900" : "bg-white border-zinc-300")}>
                      {isSel && <CheckCircle2 className="size-3 fill-zinc-900 text-white" />}
                    </span>
                    <ProPlatformIcon platform={p.id} size={18} />
                    <span className={cn("truncate flex-1 text-[11px] font-semibold", isSel ? "text-white" : "text-zinc-700")}>{p.handle}</span>
                    <input type="checkbox" checked={isSel} onChange={() => onToggleAccount(p.id)} className="sr-only" />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-200">
            <h4 className="text-xs font-bold flex items-center gap-1.5">
              <Clock className="size-3.5 text-zinc-500" /> Schedule
            </h4>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={item.scheduledDate}
                onChange={(e) => onUpdate({ scheduledDate: e.target.value })}
                className="mt-1 h-8 w-full rounded-xl border border-zinc-200 bg-white px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Time</label>
              <input
                type="time"
                value={item.scheduledTime}
                onChange={(e) => onUpdate({ scheduledTime: e.target.value })}
                className="mt-1 h-8 w-full rounded-xl border border-zinc-200 bg-white px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                <Timer className="size-3" /> {timezone} • {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Caption + Advanced */}
        <div className="p-3 sm:p-4 space-y-3 min-w-0">
          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Hash className="size-3.5 text-zinc-500" /> Caption <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <HashtagsDropdown
                  onInsert={(tags) => {
                    const current = item.caption;
                    const next = current.trim() ? `${current.trim()} ${tags.join(" ")}` : tags.join(" ");
                    onUpdate({ caption: next });
                  }}
                  size="sm"
                  className="rounded-full shadow-sm"
                />
                <button
                  type="button"
                  onClick={onOpenAI}
                  disabled={aiGenerating}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-900 hover:bg-black disabled:opacity-50 text-white px-2.5 py-1 text-[11px] font-bold"
                >
                  <Sparkles className="size-3" /> {aiGenerating ? "Generating…" : "AI Caption"}
                </button>
                <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded-full border", overLimit ? "bg-red-50 text-red-600 border-red-200" : "bg-zinc-50 text-zinc-500 border-zinc-200")}>
                  {captionLen}/{charLimit}
                </span>
              </div>
            </div>
            <textarea
              value={item.caption}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              placeholder={t("posts.bulkSchedule.caption_placeholder")}
              rows={4}
              maxLength={63206}
              className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 resize-none leading-relaxed"
            />
            {/* Per-platform character limits pill badges with inline 1-click Auto-Fit */}
            {item.accountIds.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                {item.accountIds.map((pid) => {
                  const pMeta = PLATFORMS.find((pl) => pl.id === pid);
                  const pidCaption = item.captionByPlatform?.[pid] ?? item.caption;
                  const pidLen = pidCaption.length;
                  const lim = pMeta?.charLimit ?? 2200;
                  const isPidOver = pidLen > lim;
                  const isOverridden = !!item.captionByPlatform?.[pid] && item.captionByPlatform[pid] !== item.caption;
                  return (
                    <span
                      key={pid}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border transition-colors",
                        isPidOver
                          ? "bg-red-50 text-red-700 border-red-200"
                          : isOverridden
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200"
                      )}
                    >
                      <ProPlatformIcon platform={pid} size={12} />
                      {pMeta?.name ?? pid}: {pidLen}/{lim}
                      {isOverridden && !isPidOver && (
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Tailored</span>
                      )}
                      {isPidOver && (
                        <button
                          type="button"
                          onClick={() => handleAutoFitPlatform(pid)}
                          className="ml-0.5 px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] uppercase tracking-wider shadow-xs"
                          title={`Auto-fit caption for ${pMeta?.name ?? pid}`}
                        >
                          ⚡ Auto-Fit
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Custom per-platform caption override accordion */}
            {item.accountIds.length > 1 && (
              <div className="mt-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setCustomPlatformOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900"
                >
                  <ChevronDown className={cn("size-3.5 transition-transform", customPlatformOpen && "rotate-180")} />
                  {customPlatformOpen ? "Hide platform overrides" : "Customize caption per platform"}
                  {Object.keys(item.captionByPlatform ?? {}).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-zinc-900 text-white text-[10px] font-bold">
                      {Object.keys(item.captionByPlatform ?? {}).length} custom
                    </span>
                  )}
                </button>

                {customPlatformOpen && (
                  <div className="mt-2 space-y-2 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                    <p className="text-[11px] text-zinc-500 mb-1">
                      Customize captions for specific networks (e.g. keeping 280 chars for X/Bluesky while Instagram has the full caption).
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {item.accountIds.map((pid) => {
                        const pMeta = PLATFORMS.find((pl) => pl.id === pid);
                        const val = item.captionByPlatform?.[pid] ?? item.caption;
                        const lim = pMeta?.charLimit ?? 2200;
                        const isOver = val.length > lim;
                        return (
                          <div key={pid} className="space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold flex items-center gap-1.5 text-zinc-800">
                                <ProPlatformIcon platform={pid} size={14} /> {pMeta?.name ?? pid}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const fitted = fitCaptionForPlatform(val, pid);
                                    onUpdate({
                                      captionByPlatform: {
                                        ...(item.captionByPlatform ?? {}),
                                        [pid]: fitted,
                                      },
                                    } as Partial<BulkItem>);
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                                >
                                  ⚡ Smart-Fit
                                </button>
                                <span className={cn("text-[10px] font-mono", isOver ? "text-red-600 font-bold" : "text-zinc-500")}>
                                  {val.length}/{lim}
                                </span>
                              </div>
                            </div>
                            <textarea
                              value={val}
                              onChange={(e) => {
                                onUpdate({
                                  captionByPlatform: {
                                    ...(item.captionByPlatform ?? {}),
                                    [pid]: e.target.value,
                                  },
                                } as Partial<BulkItem>);
                              }}
                              rows={2}
                              maxLength={63206}
                              className="w-full rounded-md border border-zinc-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
                              placeholder={`Caption specifically for ${pMeta?.name ?? pid}...`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick platform fields kept for speed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-50 border border-zinc-200">
              <label className="text-xs font-semibold flex items-center gap-1.5">
                <Send className="size-3.5 text-zinc-500" /> Post in
              </label>
              <label className="flex items-center gap-1 cursor-pointer ml-auto">
                <input type="radio" name={`post-in-${item.id}`} checked={item.postIn === "feed"} onChange={() => onUpdate({ postIn: "feed" })} className="size-3.5" />
                <span className="text-xs font-medium">{t("posts.bulkSchedule.feed")}</span>
              </label>
              <label className={cn("flex items-center gap-1", hasInstagram || hasFacebook ? "cursor-pointer" : "opacity-50")}>
                <input type="radio" name={`post-in-${item.id}`} checked={item.postIn === "story"} onChange={() => onUpdate({ postIn: "story" })} disabled={!(hasInstagram || hasFacebook)} className="size-3.5" />
                <span className="text-xs font-medium">{t("posts.bulkSchedule.story")}</span>
              </label>
            </div>
            <label className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200 cursor-pointer">
              <input type="checkbox" checked={item.autoAddMusic} onChange={(e) => onUpdate({ autoAddMusic: e.target.checked })} className="size-3.5" />
              <span className="text-xs font-semibold">{t("posts.bulkSchedule.auto_music")}</span>
            </label>
          </div>

          {hasYouTube && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold flex items-center gap-1">
                  YouTube Title <span className="text-red-500">*</span> <span className={cn("ml-auto text-[10px] font-mono", ytTitleLen > 100 ? "text-red-600" : "text-zinc-500")}>{ytTitleLen}/100</span>
                </label>
                <input
                  type="text"
                  value={item.youtubeTitle}
                  onChange={(e) => onUpdate({ youtubeTitle: e.target.value.slice(0, 100) })}
                  placeholder="Enter video title for YouTube..."
                  className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold flex items-center gap-1">
                  YouTube Tags <span className={cn("ml-auto text-[10px] font-mono", ytTagsLen > 500 ? "text-red-600" : "text-zinc-500")}>{ytTagsLen}/500</span>
                </label>
                <input
                  type="text"
                  value={item.youtubeTags}
                  onChange={(e) => onUpdate({ youtubeTags: e.target.value.slice(0, 500) })}
                  placeholder="social, youtube, video, tag"
                  className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
            </div>
          )}

          {hasPinterest && (
            <div>
              <label className="text-[11px] font-bold block mb-1">
                {t("posts.bulkSchedule.pinterest_board")} <span className="text-red-500">*</span>
              </label>
              <select
                value={item.pinterestBoard}
                onChange={(e) => onUpdate({ pinterestBoard: e.target.value })}
                className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                <option value="">{t("posts.bulkSchedule.select_board")}</option>
                {destinationOptions.boards.length > 0 ? (
                  destinationOptions.boards.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="default">Default Board</option>
                    <option value="inspiration">Inspiration</option>
                    <option value="products">Products</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Collapsible extra */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setExtraOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-left"
            >
              <span className="text-xs font-bold flex items-center gap-1.5">
                <MessageSquare className="size-3.5" /> Extra · First comment, hashtags & tagging
              </span>
              <ChevronDown className={cn("size-4 text-zinc-500 transition-transform", extraOpen && "rotate-180")} />
            </button>
            {extraOpen && (
              <div className="p-3 space-y-3 bg-white">
                <div>
                  <label className="text-[11px] font-semibold">First comment (optional)</label>
                  <input
                    type="text"
                    value={(item as BulkItemBase).firstComment ?? ""}
                    onChange={(e) => onUpdate({ firstComment: e.target.value } as Partial<BulkItem>)}
                    placeholder="Add a first comment for Instagram/Facebook..."
                    className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold flex items-center gap-1">
                      <Hash className="size-3" /> Hashtags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={(item.hashtags ?? []).join(", ")}
                      onChange={(e) => onUpdate({ hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } as unknown as Partial<BulkItem>)}
                      placeholder="#cats, #cute"
                      className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold flex items-center gap-1">
                      <Users className="size-3" /> Tag users (comma separated)
                    </label>
                    <input
                      type="text"
                      value={(item as BulkItemBase).tagUsers ?? ""}
                      onChange={(e) => onUpdate({ tagUsers: e.target.value } as Partial<BulkItem>)}
                      placeholder="@user1, @user2"
                      className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold">Alt text (accessibility)</label>
                  <input
                    type="text"
                    value={(item as BulkItemBase).altText ?? ""}
                    onChange={(e) => onUpdate({ altText: e.target.value } as Partial<BulkItem>)}
                    placeholder="Describe the image for screen readers"
                    className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                {hasX && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={item.community} onChange={(e) => onUpdate({ community: e.target.checked })} className="size-3.5" />
                    <span className="text-xs font-semibold">{t("posts.bulkSchedule.community")}</span>
                    <span className="text-[10px] text-zinc-500">{t("posts.bulkSchedule.optional")}</span>
                  </label>
                )}
                <div>
                  <label className="text-[11px] font-semibold">Profile</label>
                  <select
                    value={item.profile}
                    onChange={(e) => onUpdate({ profile: e.target.value })}
                    className="mt-1 h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="Default">Default</option>
                    <option value="Personal">Personal</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Advanced per-platform — FULL parity with Create Post */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-zinc-50 text-left"
            >
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Settings2 className="size-3.5" /> Advanced for each platform • {item.accountIds.length} selected
                <span className={cn("ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border", readiness.blockedCount > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                  {readiness.blockedCount > 0 ? `${readiness.blockedCount} blocked` : "Ready"}
                </span>
              </span>
              <ChevronDown className={cn("size-4 text-zinc-500 transition-transform", advancedOpen && "rotate-180")} />
            </button>
            {advancedOpen && (
              <div className="p-3 space-y-3 bg-zinc-50/40 border-t border-zinc-200">
                {item.accountIds.length === 0 ? (
                  <p className="text-xs text-zinc-500">Select platforms to see advanced options.</p>
                ) : (
                  item.accountIds.map((pid) => {
                    const meta = getPlatform(pid);
                    const val = (item as BulkItemBase).advancedByPlatform?.[pid] ?? getDefaultOptions(pid);
                    const destOpts =
                      pid === "pinterest" && destinationOptions.boards.length > 0
                        ? { pinterest_board_id: destinationOptions.boards }
                        : pid === "facebook" && destinationOptions.pages.length > 0
                          ? { facebook_page_id: destinationOptions.pages }
                          : undefined;
                    return (
                      <AdvancedOptionsPanel
                        key={pid}
                        platform={pid}
                        platformName={meta?.name ?? pid}
                        mediaKind={mediaKind}
                        value={val}
                        onChange={(next) => onUpdateAdvanced(pid, next)}
                        selectOptions={destOpts as never}
                        defaultOpen={false}
                      />
                    );
                  })
                )}
              </div>
            )}
          </div>



          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onScheduleSingle}
              disabled={item.uploadStatus === "uploading" || readiness.overall === "blocked"}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white h-9 text-xs font-bold disabled:opacity-50 shadow-sm"
            >
              <Calendar className="size-3.5" />
              Schedule this post
            </button>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-500">
              <Eye className="size-3" /> Linked to <Link href="/dashboard/queue" className="underline decoration-dotted hover:text-zinc-700">Queue</Link>
            </span>
          </div>
        </div>
      </div>

      {item.accountIds.length === 0 ? (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5" /> {t("posts.bulkSchedule.no_accounts_warning")}
        </div>
      ) : null}
    </div>
  );
}
