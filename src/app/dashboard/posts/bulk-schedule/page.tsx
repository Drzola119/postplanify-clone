"use client";

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
import { PLATFORMS, type PlatformId } from "@/lib/platforms";

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

export default function BulkSchedulePage() {
  const [items, setItems] = useState<BulkItem[]>([]);
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [startTime, setStartTime] = useState<string>(defaultTime());
  const [postsPerDay, setPostsPerDay] = useState<number>(1);
  const [interval, setInterval] = useState<string>("1d");
  const [timezone, setTimezone] = useState<string>("Africa/Lagos");
  const [tzOpen, setTzOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [accounts, setAccounts] = useState<Set<PlatformId>>(new Set());
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setTzOpen(false);
        setLearnOpen(false);
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

  function aiGenerateForAll() {
    const sample = [
      "Behind the scenes ✨",
      "Launch day is here 🚀",
      "New product, who dis?",
      "Friday motivation 💪",
      "Stay tuned for more",
      "Crafted with care.",
      "Your daily dose of inspiration.",
      "Tap the link in bio for more!",
    ];
    setItems((prev) =>
      prev.map((item, idx) => ({
        ...item,
        caption: item.caption || sample[idx % sample.length],
      }))
    );
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
            <h1 className="text-[30px] font-bold leading-[36px] tracking-tight">Bulk Schedule Posts</h1>
            <div className="relative">
              <button
                type="button"
                onClick={() => setLearnOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={learnOpen}
                aria-label="Learn"
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
              >
                <span aria-hidden>📚</span>
                Learn
                <ChevronDown className="size-3.5 text-zinc-500" />
              </button>
              {learnOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-9 z-30 w-[260px] rounded-md border border-zinc-200 bg-white shadow-lg p-1"
                >
                  <a
                    href="#"
                    role="menuitem"
                    className="block px-3 py-2 rounded-md hover:bg-zinc-100"
                  >
                    <p className="text-sm font-medium">Bulk Scheduling</p>
                    <p className="text-xs text-zinc-500">Schedule dozens of posts at once.</p>
                  </a>
                  <a
                    href="#"
                    role="menuitem"
                    className="block px-3 py-2 rounded-md hover:bg-zinc-100"
                  >
                    <p className="text-sm font-medium">Troubleshooting Failed Posts</p>
                    <p className="text-xs text-zinc-500">Diagnose common publishing issues.</p>
                  </a>
                </div>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Upload multiple images and videos to schedule them all at once with individual settings.
          </p>
        </div>

        {/* Date Scheduler bar */}
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-white/60 p-2 backdrop-blur-sm">
          <SchedulerField label="START DATE">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-7 w-full rounded-md border border-zinc-200 bg-white/50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            />
          </SchedulerField>
          <SchedulerField label="TIME">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-7 w-full rounded-md border border-zinc-200 bg-white/50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            />
          </SchedulerField>
          <SchedulerField label="POSTS/DAY">
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
          <SchedulerField label="INTERVAL">
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="h-7 w-full rounded-md border border-zinc-200 bg-white/50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            >
              {INTERVALS.map((i) => (
                <option key={i.id} value={i.id}>{i.id}</option>
              ))}
            </select>
          </SchedulerField>
          <SchedulerField label="TIMEZONE">
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
            Apply
          </button>
        </div>
      </div>

      {/* AI Captions top button */}
      {items.length > 0 ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={aiGenerateForAll}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white px-4 h-10 text-sm font-medium"
          >
            <Sparkles className="size-4" />
            Generate AI Captions for {items.length} Post{items.length === 1 ? "" : "s"}
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
                <h3 className="text-base font-semibold leading-none">Accounts</h3>
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
                      <span
                        className="size-7 rounded-full bg-zinc-100 inline-flex items-center justify-center text-sm flex-shrink-0"
                      >
                        {p.icon}
                      </span>
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
                  <h3 className="text-base font-semibold leading-none">Media Files</h3>
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
                      Add More
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex items-center gap-1 px-2 h-7 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Clear All
                    </button>
                  </div>
                ) : null}
              </div>

              {items.length === 0 ? (
                <>
                  <div className="text-sm font-medium">Upload your media files</div>
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
                      Drag and drop up to {MAX_FILES} image or video files, or click to browse
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Supports MP4, MOV, JPG, PNG • Max {Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB per file
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700">Selected Media Files</span>
                    <span className="text-zinc-500">Manage your uploads</span>
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
              {items.length} post{items.length === 1 ? "" : "s"} ready
            </span>
            <button
              type="button"
              onClick={() => alert("This would schedule all posts. Not implemented in this clone.")}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-4 h-10 text-sm font-medium"
            >
              <Calendar className="size-4" />
              Schedule All Posts
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
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
        <div className="p-12 text-center">
          <div className="size-12 rounded-full bg-zinc-100 inline-flex items-center justify-center mx-auto">
            <Upload className="size-6 text-zinc-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Ready to Schedule Multiple Posts?</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
            Upload your media files to get started. Each file will become a customizable post with individual settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StepCard
          n={1}
          title="Select Workspace & Accounts"
          desc="Choose your brand and default social platforms on the left"
        />
        <StepCard
          n={2}
          title="Upload Media Files"
          desc="Drag & drop up to 20 images or videos at once"
        />
        <StepCard
          n={3}
          title="Customize & Schedule"
          desc="Set captions, times, and schedule all posts together"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TipCard
          icon={<Calendar className="size-4 text-blue-600" />}
          title="Use the Date Scheduler"
          desc='Set start date, posts per day, and intervals. Then click "Apply" to automatically assign date & time to all your posts at once.'
        />
        <TipCard
          icon={<Sparkles className="size-4 text-violet-600" />}
          title="AI Caption Generation"
          desc="Generate captions for all posts using AI after uploading your media files."
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
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
        <div className="p-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold leading-none">{items.length} post{items.length > 1 ? "s" : ""} ready</h3>
            <p className="text-xs text-zinc-500 mt-1">Customize captions, accounts, and times for each.</p>
          </div>
          <button
            type="button"
            onClick={onApplyAccountsToAll}
            disabled={accountsCount === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
          >
            Apply accounts to all
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
            Platforms ({item.accountIds.length} selected)
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
                  <span className="size-4 rounded-full bg-zinc-100 inline-flex items-center justify-center text-[10px] flex-shrink-0">
                    {p.icon}
                  </span>
                  <span className="truncate flex-1 text-[11px]">{p.handle}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Column 3: Schedule */}
        <div className="p-3 min-w-0">
          <h4 className="text-xs font-semibold tracking-wide text-zinc-700 mb-2">Schedule</h4>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-zinc-500">Date</label>
              <input
                type="date"
                value={item.scheduledDate}
                onChange={(e) => onUpdate({ scheduledDate: e.target.value })}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500">Time</label>
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
              <label className="text-xs font-semibold tracking-wide text-zinc-700">Caption</label>
              <span className="text-[10px] text-zinc-500">{captionLen}/280</span>
            </div>
            <textarea
              value={item.caption}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              placeholder="Write your caption for this post..."
              rows={3}
              maxLength={2000}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300 resize-none"
            />
          </div>

          {/* Post in: Feed/Story */}
          <div>
            <label className="text-[10px] font-medium text-zinc-700">Post in:</label>
            <div className="mt-1 flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`post-in-${item.id}`}
                  checked={item.postIn === "feed"}
                  onChange={() => onUpdate({ postIn: "feed" })}
                  className="size-3.5 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs">Feed</span>
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
                <span className="text-xs">Story</span>
              </label>
            </div>
            {!(hasInstagram || hasFacebook) ? (
              <p className="mt-0.5 text-[10px] text-zinc-500">Stories are only available for FB and IG.</p>
            ) : null}
          </div>

          {/* YouTube Video Title */}
          {hasYouTube ? (
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] font-medium text-zinc-700">
                  YouTube Video Title <span className="text-red-500">*</span>
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
                <label className="text-[10px] font-medium text-zinc-700">YouTube Tags</label>
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
                Pinterest Board <span className="text-red-500">*</span>
              </label>
              <select
                value={item.pinterestBoard}
                onChange={(e) => onUpdate({ pinterestBoard: e.target.value })}
                className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
              >
                <option value="">Select a Pinterest board...</option>
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
            <span className="text-xs">Auto add music</span>
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
              <span className="text-xs">Community</span>
              <span className="text-[10px] text-zinc-500">(optional)</span>
            </label>
          ) : null}

          {/* Profile */}
          <div>
            <label className="text-[10px] font-medium text-zinc-700 mb-0.5 block">Your Profile</label>
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
          No accounts selected — this post won&apos;t publish anywhere.
        </div>
      ) : null}
    </div>
  );
}
