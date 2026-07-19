"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, Building2, ChevronDown, Check, ChevronUp } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const WORKSPACES = ["zack", "Personal", "Marketing", "Brand 2"];

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type DayKey = typeof DAY_KEYS[number];

const ALL_DAYS_SELECTED: Record<DayKey, boolean> = {
  Mon: true,
  Tue: true,
  Wed: true,
  Thu: true,
  Fri: true,
  Sat: true,
  Sun: true,
};

// 30-minute intervals from 00:00 to 23:30 — matches live site
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

interface PostingTime {
  id: number;
  time: string | null;
  days: Record<DayKey, boolean>;
}

interface PostingScheduleModalProps {
  open: boolean;
  onClose: () => void;
}

export function PostingScheduleModal({ open, onClose }: PostingScheduleModalProps) {
  const [workspace, setWorkspace] = useState("zack");
  const [times, setTimes] = useState<PostingTime[]>([]);
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  function addTime() {
    setTimes((prev) => [
      ...prev,
      { id: Date.now(), time: null, days: { ...ALL_DAYS_SELECTED } },
    ]);
  }

  function removeTime(id: number) {
    setTimes((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTime(id: number, patch: Partial<PostingTime>) {
    setTimes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function toggleDay(id: number, day: DayKey) {
    setTimes((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, days: { ...t.days, [day]: !t.days[day] } } : t
      )
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Posting Schedule"
      description="Setup your weekly posting times"
      maxWidth="sm:max-w-[800px]"
    >
      <div className="space-y-6 py-4">
        {/* Workspace + Timezone row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Workspace</label>
            <Combobox
              value={workspace}
              options={WORKSPACES}
              onChange={setWorkspace}
              icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Timezone</label>
            <div className="h-9 px-3 py-1 border rounded-md bg-muted flex items-center text-sm">
              {timezone}
            </div>
            <p className="text-xs text-muted-foreground">Times will be set in your timezone</p>
          </div>
        </div>

        {/* Weekly posting times */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Weekly posting times</label>
          <div className="border rounded-lg p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {/* Header */}
            <div className="grid grid-cols-[140px_1fr_40px] gap-3 pb-2 border-b">
              <div className="text-xs font-medium text-muted-foreground">Time</div>
              <div className="flex gap-2 justify-center">
                {DAY_KEYS.map((d) => (
                  <div key={d} className="text-xs font-medium text-muted-foreground w-8 text-center">
                    {d}
                  </div>
                ))}
              </div>
              <div />
            </div>

            {/* Rows */}
            {times.map((t) => (
              <PostingTimeRow
                key={t.id}
                postingTime={t}
                onTimeChange={(newTime) => updateTime(t.id, { time: newTime })}
                onDayToggle={(d) => toggleDay(t.id, d)}
                onRemove={() => removeTime(t.id)}
              />
            ))}

            {/* Add posting time */}
            <button
              type="button"
              onClick={addTime}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 rounded-md px-3 text-xs w-full text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add posting time
            </button>
          </div>
          <div className="flex items-start gap-1.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
            <div className="text-amber-600 text-xs">⚠</div>
            <p className="text-xs text-amber-700">
              Editing your schedule won&apos;t affect posts that are already scheduled.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
        >
          Save changes
        </button>
      </div>
    </Dialog>
  );
}

function PostingTimeRow({
  postingTime,
  onTimeChange,
  onDayToggle,
  onRemove,
}: {
  postingTime: PostingTime;
  onTimeChange: (time: string) => void;
  onDayToggle: (day: DayKey) => void;
  onRemove: () => void;
}) {
  const hasTime = postingTime.time !== null;

  return (
    <div className="grid grid-cols-[140px_1fr_40px] gap-3 items-center">
      {/* Time cell — "Select time" placeholder or actual time button */}
      <TimeSelectButton
        value={postingTime.time}
        onChange={onTimeChange}
        options={TIME_OPTIONS}
      />

      {/* Days cell — placeholder hint or day toggles */}
      {hasTime ? (
        <div className="flex gap-2 justify-center">
          {DAY_KEYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDayToggle(d)}
              className={cn(
                "w-8 h-8 rounded-md text-xs font-medium transition-colors flex items-center justify-center",
                postingTime.days[d]
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground border border-input hover:bg-accent"
              )}
              aria-label={`Toggle ${d}`}
              aria-pressed={postingTime.days[d]}
            >
              {postingTime.days[d] ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                d.slice(0, 1)
              )}
            </button>
          ))}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground text-center">
          All days will be selected
        </span>
      )}

      {/* Remove cell */}
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent rounded-md h-7 w-7 p-0 text-destructive hover:text-destructive"
        aria-label="Remove time"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function TimeSelectButton({
  value,
  onChange,
  options,
}: {
  value: string | null;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between whitespace-nowrap rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm",
          "focus:outline-none focus:ring-1 focus:ring-ring h-9",
          value ? "border-input" : "border-input"
        )}
      >
        <span className={cn(value ? "" : "text-muted-foreground")}>
          {value ?? "Select time"}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 opacity-50 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        )}
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1 z-50 max-h-[220px] w-[120px] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {options.map((t) => (
            <button
              key={t}
              type="button"
              role="option"
              aria-selected={value === t}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                value === t && "bg-accent/50 font-medium"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Combobox({
  value,
  options,
  onChange,
  icon,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setManageMode(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        setManageMode(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const radixId = useRef(`radix-${Math.random().toString(36).slice(2)}`);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-controls={radixId.current}
        aria-expanded={open}
        aria-autocomplete="none"
        dir="ltr"
        data-state={open ? "open" : "closed"}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center justify-between whitespace-nowrap rounded-md border-input bg-transparent px-3 py-2 text-sm shadow-sm",
          "data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-full h-9 border-2"
        )}
      >
        <span style={{ pointerEvents: "none" }}>
          <span className="flex items-center gap-2">
            {icon}
            {value}
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 opacity-50 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        )}
      </button>
      {open ? (
        <div
          id={radixId.current}
          role="listbox"
          className="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {!manageMode ? (
            <>
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={value === opt}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left",
                    value === opt && "bg-accent/50 font-medium"
                  )}
                >
                  <span className="flex-1">{opt}</span>
                  {value === opt ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : null}
                </button>
              ))}
              <div className="border-t">
                <button
                  type="button"
                  onClick={() => setManageMode(true)}
                  className="flex w-full items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-500/10 cursor-pointer text-left font-medium"
                >
                  Manage Workspaces
                </button>
              </div>
            </>
          ) : (
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Manage workspaces</p>
              <button
                type="button"
                onClick={() => {
                  setManageMode(false);
                  setOpen(false);
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}