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
