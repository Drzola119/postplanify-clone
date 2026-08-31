export interface WallClockDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
}

function offsetAt(instantMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instantMs));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return representedAsUtc - instantMs;
}

/** Convert a wall-clock value in an IANA timezone into an absolute Date. */
export function zonedDateTimeToDate(value: WallClockDateTime, timeZone: string): Date | null {
  const fields = [value.year, value.month, value.day, value.hour, value.minute, value.second ?? 0];
  if (fields.some((field) => !Number.isInteger(field))) return null;
  if (value.month < 1 || value.month > 12 || value.day < 1 || value.day > 31) return null;
  if (value.hour < 0 || value.hour > 23 || value.minute < 0 || value.minute > 59) return null;

  const wallClockAsUtc = Date.UTC(
    value.year,
    value.month - 1,
    value.day,
    value.hour,
    value.minute,
    value.second ?? 0,
    0,
  );
  try {
    let instant = wallClockAsUtc - offsetAt(wallClockAsUtc, timeZone);
    // Re-evaluate at the candidate instant so daylight-saving boundaries use
    // the offset in effect at the requested local time.
    instant = wallClockAsUtc - offsetAt(instant, timeZone);
    const result = new Date(instant);
    return Number.isNaN(result.getTime()) ? null : result;
  } catch {
    return null;
  }
}

/** Convert an absolute Date into its wall-clock parts and formatted strings in an IANA timezone. */
export function dateToZonedDateTime(date: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  date: string;
  time: string;
} | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const year = Number(v.year);
    const month = Number(v.month);
    const day = Number(v.day);
    const hour = Number(v.hour);
    const minute = Number(v.minute);
    return {
      year,
      month,
      day,
      hour,
      minute,
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    };
  } catch {
    return null;
  }
}
