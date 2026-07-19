"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Upload,
  UploadCloud,
  Calendar,
  X,
  Sparkles,
  ChevronDown,
  Plus,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORMS, getPlatform, type PlatformId } from "@/lib/platforms";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { PageHelp } from "@/components/dashboard/help/page-help";
import { getHelpConfig } from "@/lib/help/content";

type BulkItem = {
  id: string;
  file: File;
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
};

const MAX_FILES = 20;
const MAX_FILE_BYTES = 100 * 1024 * 1024;

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

function nowLocalDateTime(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setSeconds(0, 0);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function splitDateTime(dt: string): { date: string; time: string } {
  if (!dt || !dt.includes("T")) return { date: todayISO(), time: "08:00" };
  const [date, time] = dt.split("T");
  return { date: date || todayISO(), time: (time || "08:00").slice(0, 5) };
}

/**
 * Minimal RFC4180-ish CSV parser. Supports quoted fields with embedded
 * commas/newlines and `""` escapes. Returns { headers, rows }.
 */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
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
        if (c === "\r" && text[i + 1] === "\n") i++;
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

const PLATFORM_ALIASES: Record<string, PlatformId> = {
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

function normalizePlatforms(raw: string): PlatformId[] {
  const out = new Set<PlatformId>();
  for (const tok of raw.split(/[,|/;]/).map((s) => s.trim().toLowerCase()).filter(Boolean)) {
    const mapped = PLATFORM_ALIASES[tok];
    if (mapped) out.add(mapped);
  }
  return Array.from(out);
}

function normalizeHashtags(raw: string): string[] {
  return raw
    .split(/[,|;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => (s.startsWith("#") ? s : `#${s}`));
}

export default function BulkSchedulePage() {
  const t = useTranslations("dashboard");
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Close dropdowns on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setTzOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleAccount(id: PlatformId) {
    setAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pickFiles() {
    fileInputRef.current?.click();
  }

  function pickMoreFiles() {
    addMoreInputRef.current?.click();
  }

  function pickCsvFile() {
    csvInputRef.current?.click();
  }

  async function handleCsvFile(file: File) {
    setCsvBusy(true);
    try {
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      const errors: string[] = [];
      if (headers.length === 0 || rows.length === 0) {
        window.alert(t("posts.bulkSchedule.csv_empty"));
        return;
      }
      const capIdx = headers.indexOf("caption");
      const platformsIdx = headers.indexOf("platforms");
      const scheduledIdx = headers.indexOf("scheduledat");
      const hashtagsIdx = headers.indexOf("hashtags");
      const mediaIdx = headers.indexOf("mediaurl");
      if (capIdx < 0) {
        window.alert(t("posts.bulkSchedule.csv_missing_column"));
        return;
      }
      const newItems: BulkItem[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const caption = (r[capIdx] ?? "").trim();
        if (!caption) {
          errors.push(`Row ${i + 2}: missing caption`);
          continue;
        }
        let platforms = platformsIdx >= 0 ? normalizePlatforms(r[platformsIdx] ?? "") : [];
        if (platforms.length === 0) platforms = Array.from(accounts);
        if (platforms.length === 0) {
          errors.push(`Row ${i + 2}: no platforms (add a "platforms" column or select accounts above)`);
          continue;
        }
        const scheduledAt = (scheduledIdx >= 0 ? r[scheduledIdx] : "").trim() || nowLocalDateTime(i);
        const { date, time } = splitDateTime(scheduledAt);
        const hashtags = hashtagsIdx >= 0 ? normalizeHashtags(r[hashtagsIdx] ?? "") : [];
        const mediaUrl = mediaIdx >= 0 ? (r[mediaIdx] ?? "").trim() : "";
        newItems.push({
          id: `csv-${Date.now()}-${i}`,
          file: undefined as unknown as File,
          url: mediaUrl,
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
        } as BulkItem & { hashtags?: string[] });
      }
      setItems((prev) => {
        const remaining = Math.max(0, MAX_FILES - prev.length);
        return [...prev, ...newItems.slice(0, remaining)];
      });
      const inserted = Math.min(newItems.length, MAX_FILES);
      if (errors.length > 0) {
        window.alert(t("posts.bulkSchedule.csv_imported_skipped", { n: inserted, m: errors.length }));
      } else if (inserted > 0) {
        window.alert(t("posts.bulkSchedule.csv_imported", { n: inserted }));
      }
    } catch (e) {
      window.alert(t("posts.bulkSchedule.csv_read_error", { error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setCsvBusy(false);
    }
  }

  async function handleScheduleAll() {
    if (items.length === 0 || scheduleBusy) return;
    setScheduleBusy(true);
    try {
      const itemsToSend = items
        .filter((it) => Array.isArray(it.accountIds) && it.accountIds.length > 0 && it.caption.trim())
        .slice(0, 100);
      if (itemsToSend.length === 0) {
        window.alert(t("posts.bulkSchedule.none_ready"));
        return;
      }
      const payload = {
        items: itemsToSend.map((it) => ({
          caption: it.caption,
          platforms: it.accountIds,
          mediaUrls: it.url ? [it.url] : [],
          scheduledAt: it.scheduledAt ? new Date(it.scheduledAt).toISOString() : undefined,
          hashtags: (it as BulkItem & { hashtags?: string[] }).hashtags ?? [],
          status: "scheduled" as const,
        })),
      };
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Bulk schedule failed (${res.status})`);
      }
      const data = (await res.json()) as { count?: number; ids?: string[] };
      window.alert(t("posts.bulkSchedule.scheduled_n", { n: data.count ?? itemsToSend.length }));
      setItems([]);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t("posts.bulkSchedule.bulk_failed"));
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

  function handleFiles(files: File[]) {
    const remaining = Math.max(0, MAX_FILES - items.length);
    const accepted = files.slice(0, remaining);
    const newItems: BulkItem[] = [];
    for (const file of accepted) {
      if (file.size > MAX_FILE_BYTES) continue;
      const isVideo = file.type.startsWith("video/");
      const kind: "image" | "video" = isVideo ? "video" : "image";
      const dt = nowLocalDateTime(newItems.length === 0 ? 0 : Math.floor(newItems.length / Math.max(1, postsPerDay)));
      const { date, time } = splitDateTime(dt);
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        url: URL.createObjectURL(file),
        kind,
        name: file.name,
        size: file.size,
        caption: "",
        scheduledAt: dt,
        scheduledDate: date,
        scheduledTime: time,
        accountIds: [],
        postIn: "feed",
        youtubeTitle: "",
        youtubeTags: "",
        pinterestBoard: "",
        autoAddMusic: false,
        community: false,
        profile: "Default",
      });
    }
    if (newItems.length === 0) return;
    setItems((prev) => [...prev, ...newItems]);
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((i) => i.id !== id);
    });
  }

  function updateItem(id: string, patch: Partial<BulkItem>) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, ...patch };
        if (patch.scheduledDate !== undefined || patch.scheduledTime !== undefined) {
          updated.scheduledAt = `${patch.scheduledDate ?? i.scheduledDate}T${(patch.scheduledTime ?? i.scheduledTime).slice(0, 5)}`;
        }
        return updated;
      })
    );
  }

  function applySchedule() {
    setItems((prev) => {
      const ppd = Math.max(1, postsPerDay);
      const intervalDays = parseInt(interval, 10) || 1;
      return prev.map((item, idx) => {
        const dayOffset = Math.floor(idx / ppd) * intervalDays;
        const slotOffset = idx % ppd;
        const d = new Date(`${startDate}T${startTime}`);
        d.setDate(d.getDate() + dayOffset);
        d.setMinutes(d.getMinutes() + slotOffset * 30);
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, "0");
        const day = d.getDate().toString().padStart(2, "0");
        const hh = d.getHours().toString().padStart(2, "0");
        const mm = d.getMinutes().toString().padStart(2, "0");
        const dt = `${y}-${m}-${day}T${hh}:${mm}`;
        const { date, time } = splitDateTime(dt);
        return { ...item, scheduledAt: dt, scheduledDate: date, scheduledTime: time };
      });
    });
  }

  function applyAccountsToAll() {
    setItems((prev) => prev.map((item) => ({ ...item, accountIds: Array.from(accounts) })));
  }

  async function aiGenerateForAll() {
    const itemsToProcess = items.filter((item) => !item.caption.trim());
    if (itemsToProcess.length === 0) return;

    setGenerating(true);
    let success = 0;
    for (const item of itemsToProcess) {
      try {
        let imageUrl: string | undefined;
        let videoTitle: string | undefined;

        if (item.kind === "image") {
          const blob = await fetch(item.url).then((r) => r.blob());
          imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          videoTitle = item.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
        }

        const res = await fetch("/api/ai/caption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
            prev.map((it) =>
              it.id === item.id ? { ...it, caption: data.caption!.trim() } : it
            )
          );
          success++;
        }
      } catch {
        // skip failed items
      }
    }
    setGenerating(false);
    window.alert(t("posts.bulkSchedule.ai_generated", { n: success, m: itemsToProcess.length }));
  }

  function clearAll() {
    items.forEach((i) => URL.revokeObjectURL(i.url));
    setItems([]);
    setAccounts(new Set());
  }

  const accountsArr = useMemo(() => Array.from(accounts), [accounts]);

  return (
    <div className="p-6 pb-32">
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
            <div className="relative">
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
                  className="absolute right-0 top-full mt-1 z-30 w-[200px] max-h-[260px] overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg p-1"
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
        <div className="mb-4">
          <button
            type="button"
            onClick={aiGenerateForAll}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 h-10 text-sm font-medium"
          >
            <Sparkles className="size-4" />
            {generating ? t("posts.bulkSchedule.generating") : t("posts.bulkSchedule.generate_ai_captions", { n: items.length })}
          </button>
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
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={pickFiles}
                    role="button"
                    tabIndex={0}
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
                  <div className="mt-3 flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50/50 px-3 py-2">
                    <p className="text-xs text-zinc-600">
                      <span className="font-medium">{t("posts.bulkSchedule.csv_hint")}</span>
                    </p>
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
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-50"
                      >
                        <div className="relative size-9 flex-shrink-0 rounded bg-zinc-100 overflow-hidden">
                          {item.kind === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded object URL
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <video src={item.url} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{item.name}</p>
                          <p className="text-[10px] text-zinc-500">
                            {formatBytes(item.size)} • Image #{idx + 1}
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
                    onDragLeave={() => setDragging(false)}
                    onDrop={onAddMoreDrop}
                    onClick={pickMoreFiles}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors",
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
                accept="image/jpeg,image/png,video/mp4,video/quicktime"
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
                accept="image/jpeg,image/png,video/mp4,video/quicktime"
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

function TipCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
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
}

function PostsList({
  items,
  accountsCount,
  onToggleAccount,
  onUpdateItem,
  onRemove,
  onApplyAccountsToAll,
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
}: {
  item: BulkItem;
  index: number;
  onToggleAccount: (id: PlatformId) => void;
  onUpdate: (patch: Partial<BulkItem>) => void;
  onRemove: () => void;
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

  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[100px_180px_120px_240px] divide-y md:divide-y-0 md:divide-x divide-zinc-200">
        {/* Column 1: Media preview */}
        <div className="relative bg-zinc-100 aspect-square md:aspect-auto">
          {item.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded object URL
            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <video src={item.url} className="w-full h-full object-cover" />
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
            <p className="opacity-80">{formatBytes(item.size)}</p>
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
              <span className="text-[10px] text-zinc-500">{t("posts.bulkSchedule.char_count", { max: 280 })}</span>
            </div>
            <textarea
              value={item.caption}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              placeholder={t("posts.bulkSchedule.caption_placeholder")}
              rows={3}
              maxLength={2000}
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
                <span className="text-[10px] text-zinc-500">{ytTitleLen} / 100</span>
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
                <span className="text-[10px] text-zinc-500">{ytTagsLen} / 500</span>
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
