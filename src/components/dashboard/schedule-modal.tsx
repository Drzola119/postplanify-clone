"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Globe, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

const TIMEZONES = [
  { id: "UTC", label: "(UTC+00:00) Coordinated Universal Time" },
  { id: "America/New_York", label: "(UTC-05:00) Eastern Time (US & Canada)" },
  { id: "America/Los_Angeles", label: "(UTC-08:00) Pacific Time (US & Canada)" },
  { id: "Europe/London", label: "(UTC+00:00) London" },
  { id: "Europe/Paris", label: "(UTC+01:00) Paris" },
  { id: "Asia/Dubai", label: "(UTC+04:00) Dubai" },
  { id: "Asia/Tokyo", label: "(UTC+09:00) Tokyo" },
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toLocalISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalTimeString(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; date: Date | null }> = [];
  for (let i = 0; i < startDay; i++) cells.push({ day: null, date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, month, d) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, date: null });
  return cells;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ScheduleModal({ open, onClose, onConfirm }: ScheduleModalProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("09:00");
  const [timezone, setTimezone] = useState("America/New_York");
  const [view, setView] = useState({ year: 0, month: 0 });

  useEffect(() => {
    if (!open) return;
    const d = new Date();
    setNow(d);
    const tomorrow = new Date(d);
    tomorrow.setDate(d.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setDate(tomorrow);
    setView({ year: tomorrow.getFullYear(), month: tomorrow.getMonth() });
    setTime("09:00");
  }, [open]);

  const cells = (() => {
    if (!view.year) return [];
    return buildCalendar(view.year, view.month);
  })();

  function isSameDay(a: Date, b: Date | null) {
    if (!b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function isPast(d: Date) {
    if (!now) return false;
    return d.getTime() < now.getTime();
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      let m = v.month + delta;
      let y = v.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  }

  function quickPick(kind: "tomorrow-morning" | "tomorrow-evening" | "next-monday" | "next-week") {
    if (!now) return;
    const d = new Date(now);
    if (kind === "tomorrow-morning" || kind === "tomorrow-evening") {
      d.setDate(d.getDate() + 1);
      d.setHours(kind === "tomorrow-morning" ? 9 : 18, 0, 0, 0);
    } else if (kind === "next-monday") {
      const day = d.getDay();
      const diff = (8 - day) % 7 || 7;
      d.setDate(d.getDate() + diff);
      d.setHours(9, 0, 0, 0);
    } else {
      d.setDate(d.getDate() + 7);
      d.setHours(9, 0, 0, 0);
    }
    setDate(d);
    setTime(toLocalTimeString(d));
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  function confirm() {
    if (!date) return;
    const [hh, mm] = time.split(":").map((s) => parseInt(s, 10));
    const combined = new Date(date);
    combined.setHours(hh, mm, 0, 0);
    onConfirm(combined);
  }

  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Calendar className="size-4 text-zinc-500" />
          Schedule post
        </span>
      }
      description="Choose when you want this post to publish to your selected accounts."
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 h-9 text-sm font-medium hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!date}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-9 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="size-3.5" />
            Schedule post
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Quick picks */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quick pick</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => quickPick("tomorrow-morning")} className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50">
              Tomorrow morning
            </button>
            <button type="button" onClick={() => quickPick("tomorrow-evening")} className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50">
              Tomorrow evening
            </button>
            <button type="button" onClick={() => quickPick("next-monday")} className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50">
              Next Monday
            </button>
            <button type="button" onClick={() => quickPick("next-week")} className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50">
              Next week
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Calendar */}
          <div className="space-y-2">
            <label className="text-sm font-medium inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 text-zinc-500" />
              Date
            </label>
            <div className="rounded-md border border-zinc-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-600"
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <span className="text-sm font-semibold">
                  {MONTHS[view.month]} {view.year}
                </span>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-600"
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {dayLabels.map((d) => (
                  <div key={d} className="text-center text-[10px] font-medium text-zinc-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((c, i) => {
                  if (c.day === null || c.date === null) {
                    return <div key={i} className="aspect-square" />;
                  }
                  const selected = isSameDay(c.date, date);
                  const past = isPast(c.date);
                  const today = now ? isSameDay(c.date, now) : false;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => !past && setDate(c.date)}
                      disabled={past}
                      className={cn(
                        "aspect-square inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors",
                        selected
                          ? "bg-zinc-950 text-white"
                          : past
                          ? "text-zinc-300 cursor-not-allowed"
                          : "hover:bg-zinc-100 text-zinc-700",
                        today && !selected && "ring-1 ring-inset ring-zinc-300"
                      )}
                    >
                      {c.day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time + Timezone */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-zinc-500" />
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium inline-flex items-center gap-1.5">
                <Globe className="size-3.5 text-zinc-500" />
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.id} value={tz.id}>{tz.label}</option>
                ))}
              </select>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs space-y-1">
              <p className="text-zinc-500">Selected</p>
              <p className="font-medium text-zinc-900">
                {date ? date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"}
              </p>
              <p className="text-zinc-600">
                {time} {TIMEZONES.find((t) => t.id === timezone)?.label.match(/\(UTC[+-]\d{2}:\d{2}\)/)?.[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Hidden raw date input as fallback */}
        <input
          type="date"
          value={date ? toLocalISODate(date) : ""}
          onChange={(e) => {
            if (!e.target.value) return;
            const [y, m, d] = e.target.value.split("-").map((s) => parseInt(s, 10));
            setDate((prev) => {
              const next = new Date(prev ?? new Date());
              next.setFullYear(y, m - 1, d);
              return next;
            });
            setView({ year: y, month: m - 1 });
          }}
          className="sr-only"
          aria-hidden
          tabIndex={-1}
        />
      </div>
    </Modal>
  );
}
