import { describe, expect, it } from "vitest";
import {
  ALGERIA_CONFIG,
  ALGERIA_BENCHMARKS,
  getCountryConfig,
  listSupportedCountries,
  type CountryConfig,
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

describe("generateSmartSchedule Engine (v3 Refinements)", () => {
  const provider = new BenchmarkProvider();

  it("v3 Refinement 1: Strict Global Content Cadence — never multiplies content by platform count", () => {
    const all13Platforms: PlatformId[] = [
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

    // 10 content items uploaded, postsPerDay = 3, targeting ALL 13 platforms
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i + 1}`,
      targetPlatforms: all13Platforms,
    }));

    const req: SmartScheduleRequest = {
      startDate: "2026-10-10", // Saturday
      postsPerDay: 3,
      intervalDays: 1,
      country: ALGERIA_CONFIG,
      strategy: "shared",
      schedulingMode: "smart",
      items,
    };

    const res = generateSmartSchedule(req, provider);

    // MUST generate exactly 10 slots (1:1 with content items, NOT 10 * 13 = 130 slots!)
    expect(res.items.length).toBe(10);

    // Day 1 (10/10): 3 items
    expect(res.items[0].date).toBe("2026-10-10");
    expect(res.items[1].date).toBe("2026-10-10");
    expect(res.items[2].date).toBe("2026-10-10");

    // Day 2 (10/11): 3 items
    expect(res.items[3].date).toBe("2026-10-11");
    expect(res.items[4].date).toBe("2026-10-11");
    expect(res.items[5].date).toBe("2026-10-11");

    // Day 3 (10/12): 3 items
    expect(res.items[6].date).toBe("2026-10-12");
    expect(res.items[7].date).toBe("2026-10-12");
    expect(res.items[8].date).toBe("2026-10-12");

    // Day 4 (10/13): 1 item
    expect(res.items[9].date).toBe("2026-10-13");
  });

  it("v3 Refinement 2: Item-Level Traceability — binds each slot to its exact item ID", () => {
    const items = [
      { id: "post-alpha", targetPlatforms: ["instagram" as PlatformId] },
      { id: "post-beta", targetPlatforms: ["tiktok" as PlatformId] },
      { id: "post-gamma", targetPlatforms: ["linkedin" as PlatformId] },
    ];

    const req: SmartScheduleRequest = {
      startDate: "2026-10-10",
      postsPerDay: 1,
      country: ALGERIA_CONFIG,
      strategy: "per_platform",
      items,
    };

    const res = generateSmartSchedule(req, provider);
    expect(res.items[0].itemId).toBe("post-alpha");
    expect(res.items[1].itemId).toBe("post-beta");
    expect(res.items[2].itemId).toBe("post-gamma");
  });

  it("v3 Refinement 3: Audience Geography vs Publishing Clock — converts audience peak time into publishing clock", () => {
    // Audience in Algeria (UTC+1). Saturday peak for Instagram is 11:00 AM Africa/Algiers.
    // User viewing in New York (America/New_York, EDT is UTC-4 in October).
    // 11:00 AM UTC+1 is 10:00 AM UTC = 06:00 AM EDT (America/New_York).
    const req: SmartScheduleRequest = {
      startDate: "2026-10-10",
      postsPerDay: 1,
      platforms: ["instagram"],
      country: ALGERIA_CONFIG, // Audience: Africa/Algiers
      displayTimezone: "America/New_York", // Publisher: America/New_York
      strategy: "per_platform",
      schedulingMode: "smart",
    };

    const res = generateSmartSchedule(req, provider);
    const slot = res.items[0];

    expect(slot.audienceDate).toBe("2026-10-10");
    expect(slot.audienceTime).toBe("11:00"); // Peak time in Algeria
    expect(slot.date).toBe("2026-10-10");
    expect(slot.time).toBe("06:00"); // Converted display time in New York
    expect(slot.isoTimestamp).toBe("2026-10-10T10:00:00.000Z"); // Absolute UTC instant
  });

  it("v3 Refinement 4: Fallback Hierarchy — falls back cleanly when day or country is unknown", () => {
    const dummyCountry: CountryConfig = {
      id: "XX",
      name: "Unknown Country",
      localizedName: "Unknown Country",
      isoCode: "XX",
      flagEmoji: "🌐",
      timezone: "UTC",
      utcOffsetMinutes: 0,
      observesDST: false,
      supported: false,
      locale: "en-US",
    };

    const req: SmartScheduleRequest = {
      startDate: "2026-10-10",
      postsPerDay: 1,
      platforms: ["instagram"],
      country: dummyCountry,
      schedulingMode: "smart",
    };

    const res = generateSmartSchedule(req, provider);
    expect(res.items.length).toBe(1);
    expect(res.items[0].fallbackTier).toBe("global_generic");
    expect(res.items[0].time).toBe("09:00");
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
    expect(res.items[0].fallbackTier).toBe("manual_fallback");
  });
});
