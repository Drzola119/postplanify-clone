// Pure helpers for the posting queue UI.
// Kept separate from the page component so they can be unit-tested.

export type ScheduleBucket =
  | "today"
  | "tomorrow"
  | "this-week"
  | "later"
  | "past"
  | "paused"
  | "unscheduled";

export interface ScheduleFormatting {
  label: string;
  rel: ScheduleBucket;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function fmtScheduled(iso: string | undefined, now: Date = new Date()): ScheduleFormatting {
  if (!iso) return { label: "Unscheduled", rel: "unscheduled" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { label: "Unscheduled", rel: "unscheduled" };
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekEnd = addDays(todayStart, 7);
  const diffMs = d.getTime() - now.getTime();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (diffMs < 0) {
    return {
      label: `Was ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${time}`,
      rel: "past",
    };
  }
  if (d >= todayStart && d < tomorrowStart) {
    return { label: `Today ${time}`, rel: "today" };
  }
  if (d >= tomorrowStart && d < addDays(tomorrowStart, 1)) {
    return { label: `Tomorrow ${time}`, rel: "tomorrow" };
  }
  if (d >= addDays(tomorrowStart, 1) && d < weekEnd) {
    return {
      label: `${d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} ${time}`,
      rel: "this-week",
    };
  }
  const fmt: Intl.DateTimeFormatOptions =
    d.getFullYear() === now.getFullYear()
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" };
  return { label: `${d.toLocaleDateString(undefined, fmt)} ${time}`, rel: "later" };
}

export function bucketLabel(bucket: ScheduleBucket): string {
  switch (bucket) {
    case "today": return "Today";
    case "tomorrow": return "Tomorrow";
    case "this-week": return "This week";
    case "later": return "Later";
    case "past": return "Past due";
    case "paused": return "Paused";
    case "unscheduled": return "Unscheduled";
  }
}