import { describe, expect, it } from "vitest";
import {
  ALGERIA_CONFIG,
  ALGERIA_BENCHMARKS,
  getCountryConfig,
  listSupportedCountries,
} from "@/data/scheduling/countries";
import {
  BenchmarkProvider,
  getDayOfWeekInTimezone,
} from "@/services/scheduling/recommendation-provider";
import {
  generateSmartSchedule,
  type SmartScheduleRequest,
} from "@/services/scheduling/generate-smart-schedule";
import type { PlatformId } from "@/lib/platforms";

describe("Country Config and Algeria Dataset", () => {
  it("loads Algeria configuration correctly", () => {
    expect(ALGERIA_CONFIG.id).toBe("DZ");
    expect(ALGERIA_CONFIG.timezone).toBe("Africa/Algiers");
    expect(ALGERIA_CONFIG.utcOffsetMinutes).toBe(60);
    expect(ALGERIA_CONFIG.supported).toBe(true);
  });

  it("finds Algeria in the country registry", () => {
    const dz = getCountryConfig("DZ");
    expect(dz).toBeDefined();
    expect(dz?.name).toBe("Algeria");

    const supported = listSupportedCountries();
    expect(supported.length).toBeGreaterThanOrEqual(1);
    expect(supported.some((c) => c.id === "DZ")).toBe(true);
  });

  it("contains benchmark schedules for all 13 platforms across 7 days", () => {
    const platforms: PlatformId[] = [
      "bluesky",
      "instagram",
      "tiktok",
      "youtube",
      "pinterest",
      "twitter",
      "linkedin",
      "threads",
      "facebook",
      "discord",
      "telegram",
      "reddit",
      "google_business",
    ];
    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    for (const p of platforms) {
      for (const d of days) {
        const found = ALGERIA_BENCHMARKS.find((b) => b.platform === p && b.day === d);
        expect(found, `Missing benchmark for ${p} on ${d}`).toBeDefined();
        expect(found?.slots.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("Day of Week in Timezone", () => {
  it("resolves day of week in Africa/Algiers correctly", () => {
    // 2026-10-10 is a Saturday
    const dow = getDayOfWeekInTimezone("2026-10-10", "Africa/Algiers");
    expect(dow).toBe("sat");

    // 2026-10-11 is Sunday
    expect(getDayOfWeekInTimezone("2026-10-11", "Africa/Algiers")).toBe("sun");
    // 2026-10-12 is Monday
    expect(getDayOfWeekInTimezone("2026-10-12", "Africa/Algiers")).toBe("mon");
  });
});

describe("generateSmartSchedule Engine", () => {
  const provider = new BenchmarkProvider();

  it("generates per-platform schedule for 1 post/day", () => {
    const req: SmartScheduleRequest = {
      startDate: "2026-10-10", // Saturday
      days: 1,
      postsPerDay: 1,
      platforms: ["instagram", "tiktok"],
      country: ALGERIA_CONFIG,
      strategy: "per_platform",
      schedulingMode: "smart",
    };

    const res = generateSmartSchedule(req, provider);
    expect(res.items.length).toBe(2);

    const ig = res.items.find((i) => i.platform === "instagram");
    const tt = res.items.find((i) => i.platform === "tiktok");

    expect(ig).toBeDefined();
    expect(tt).toBeDefined();
    expect(ig?.time).toBe("11:00"); // Saturday rank 1 slot
    expect(tt?.time).toBe("13:30"); // Saturday rank 1 slot
    expect(ig?.isoTimestamp).toContain("2026-10-10T10:00:00.000Z"); // 11:00 UTC+1 is 10:00 UTC
  });

  it("generates multi-day cadence with interval", () => {
    const req: SmartScheduleRequest = {
      startDate: "2026-10-10",
      days: 3,
      postsPerDay: 1,
      intervalDays: 2, // Every 2 days: 10/10, 10/12, 10/14
      platforms: ["facebook"],
      country: ALGERIA_CONFIG,
      strategy: "per_platform",
      schedulingMode: "smart",
    };

    const res = generateSmartSchedule(req, provider);
    expect(res.items.length).toBe(3);
    expect(res.items[0].date).toBe("2026-10-10");
    expect(res.items[1].date).toBe("2026-10-12");
    expect(res.items[2].date).toBe("2026-10-14");
  });

  it("generates shared consensus schedule across platforms", () => {
    const req: SmartScheduleRequest = {
      startDate: "2026-10-10",
      days: 1,
      postsPerDay: 2,
      platforms: ["instagram", "facebook", "twitter"],
      country: ALGERIA_CONFIG,
      strategy: "shared",
      schedulingMode: "smart",
    };

    const res = generateSmartSchedule(req, provider);
    expect(res.strategy).toBe("shared");
    expect(res.items.length).toBe(2);
    expect(res.items[0].time).toBeDefined();
    expect(res.items[1].time).toBeDefined();
    expect(res.items[0].time).not.toEqual(res.items[1].time);
  });

  it("preserves manual mode regression behavior", () => {
    const req: SmartScheduleRequest = {
      startDate: "2026-10-10",
      days: 1,
      postsPerDay: 3,
      platforms: ["instagram"],
      country: ALGERIA_CONFIG,
      schedulingMode: "manual",
      manualTime: "08:00",
      intraDayGapMinutes: 30,
    };

    const res = generateSmartSchedule(req, provider);
    expect(res.items.length).toBe(3);
    expect(res.items[0].time).toBe("08:00");
    expect(res.items[1].time).toBe("08:30");
    expect(res.items[2].time).toBe("09:00");
  });
});
