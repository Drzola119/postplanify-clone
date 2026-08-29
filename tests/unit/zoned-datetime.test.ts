import { describe, expect, it } from "vitest";
import { zonedDateTimeToDate } from "@/lib/datetime/zoned";

describe("zonedDateTimeToDate", () => {
  it("converts Lagos wall-clock time without depending on the host timezone", () => {
    expect(zonedDateTimeToDate({ year: 2026, month: 8, day: 30, hour: 9, minute: 0 }, "Africa/Lagos")?.toISOString())
      .toBe("2026-08-30T08:00:00.000Z");
  });

  it("uses daylight-saving time for New York in August", () => {
    expect(zonedDateTimeToDate({ year: 2026, month: 8, day: 30, hour: 9, minute: 0 }, "America/New_York")?.toISOString())
      .toBe("2026-08-30T13:00:00.000Z");
  });

  it("uses standard time for New York in January", () => {
    expect(zonedDateTimeToDate({ year: 2026, month: 1, day: 30, hour: 9, minute: 0 }, "America/New_York")?.toISOString())
      .toBe("2026-01-30T14:00:00.000Z");
  });

  it("rejects invalid timezone identifiers", () => {
    expect(zonedDateTimeToDate({ year: 2026, month: 8, day: 30, hour: 9, minute: 0 }, "Not/AZone"))
      .toBeNull();
  });
});
