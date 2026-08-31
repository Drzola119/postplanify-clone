import type { PlatformId } from "@/lib/platforms";
import {
  type CountryConfig,
  type DayOfWeek,
  type RecommendedSlot,
  type PlatformDaySchedule,
  getCountryBenchmarks,
} from "@/data/scheduling/countries";
import {
  type RecommendationProvider,
  defaultBenchmarkProvider,
  getDayOfWeekInTimezone,
} from "./recommendation-provider";
import { zonedDateTimeToDate, dateToZonedDateTime } from "@/lib/datetime/zoned";

export type SmartStrategy = "per_platform" | "shared";

export interface ScheduledContentDescriptor {
  id: string;
  targetPlatforms?: PlatformId[];
}

export interface SmartScheduleRequest {
  startDate: string; // "YYYY-MM-DD"
  days?: number;
  postsPerDay: number;
  intervalDays?: number; // default 1
  intraDayGapMinutes?: number; // default 30
  platforms?: PlatformId[];
  country: CountryConfig;
  displayTimezone?: string; // Publishing clock timezone override (e.g. "America/New_York")
  strategy?: SmartStrategy; // default "per_platform"
  schedulingMode?: "smart" | "manual"; // default "smart"
  manualTime?: string; // default "08:00"
  /**
   * Optional item-level descriptors for end-to-end traceability.
   * When provided, exactly one slot is generated per item preserving upload order.
   */
  items?: ScheduledContentDescriptor[];
}

export interface ScheduledItemSlot {
  itemId?: string;
  platform: PlatformId;
  isoTimestamp: string;
  date: string; // "YYYY-MM-DD" (in displayTimezone / country timezone)
  time: string; // "HH:mm" (in displayTimezone / country timezone)
  audienceDate: string; // "YYYY-MM-DD" in audience country timezone
  audienceTime: string; // "HH:mm" in audience country timezone
  dayOfWeek: DayOfWeek;
  sourceSlot: RecommendedSlot | null;
  fallbackTier?: "exact_benchmark" | "country_platform_avg" | "global_generic" | "manual_fallback";
}

export interface SmartScheduleResult {
  items: ScheduledItemSlot[];
  strategy: SmartStrategy;
  warnings: string[];
}

function parseTimeMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesTime(minutes: number): string {
  const total = (minutes + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addDaysToDateString(startDate: string, daysToAdd: number): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + daysToAdd));
  const newY = date.getUTCFullYear();
  const newM = String(date.getUTCMonth() + 1).padStart(2, "0");
  const newD = String(date.getUTCDate()).padStart(2, "0");
  return `${newY}-${newM}-${newD}`;
}

/**
 * 4-tier fallback hierarchy resolver for platform slots:
 * 1. Exact platform + exact day benchmark
 * 2. Platform-level average across days for that country
 * 3. Global generic benchmark
 * 4. Manual fallback
 */
function resolvePlatformSlots(
  countryId: string,
  platform: PlatformId,
  calendarDate: string,
  day: DayOfWeek,
  provider: RecommendationProvider,
  country: CountryConfig,
  postsPerDay: number,
  intraDayGap: number,
  manualTime: string
): { slots: RecommendedSlot[]; tier: "exact_benchmark" | "country_platform_avg" | "global_generic" | "manual_fallback" } {
  // Tier 1: Exact platform + day benchmark
  const exact = provider.getRecommendationsSync({
    country,
    platforms: [platform],
    date: calendarDate,
    postsPerDay,
  });

  const matchingSched = exact.find((s) => s.platform === platform && s.day === day);
  if (matchingSched && matchingSched.slots.length > 0) {
    const sorted = matchingSched.slots.slice().sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return parseTimeMinutes(a.time) - parseTimeMinutes(b.time);
    });
    return { slots: sorted, tier: "exact_benchmark" };
  }

  // Tier 2: Country platform average across all 7 days
  const allCountryBenchmarks = getCountryBenchmarks(countryId);
  const platformAllDays = allCountryBenchmarks.filter((b) => b.platform === platform);
  if (platformAllDays.length > 0) {
    const timeFreq = new Map<string, { rankSum: number; count: number }>();
    for (const d of platformAllDays) {
      for (const s of d.slots) {
        const curr = timeFreq.get(s.time) || { rankSum: 0, count: 0 };
        curr.rankSum += s.rank;
        curr.count += 1;
        timeFreq.set(s.time, curr);
      }
    }
    const averaged = Array.from(timeFreq.entries())
      .map(([time, data]) => ({
        time,
        rank: data.rankSum / data.count,
        confidence: "medium" as const,
      }))
      .sort((a, b) => a.rank - b.rank)
      .map((s, idx) => ({ time: s.time, confidence: s.confidence, rank: idx + 1 }));

    if (averaged.length > 0) {
      return { slots: averaged, tier: "country_platform_avg" };
    }
  }

  // Tier 3: Global generic benchmark
  const genericSlots: RecommendedSlot[] = [
    { time: "09:00", confidence: "low", rank: 1 },
    { time: "14:00", confidence: "low", rank: 2 },
    { time: "19:00", confidence: "low", rank: 3 },
  ];
  return { slots: genericSlots, tier: "global_generic" };
}

/**
 * Single source of truth for generating scheduled timestamps.
 *
 * Guarantees:
 * 1. Global Content Cadence: N content items generate exactly N slots (no platform multiplication).
 * 2. Item-Level Traceability: Output slots map 1:1 to item IDs when provided.
 * 3. Audience Geography vs Publishing Clock: Optimizes for audience peak in country.timezone,
 *    then renders display timestamps in displayTimezone.
 * 4. 4-Tier Fallback Hierarchy.
 */
export function generateSmartSchedule(
  req: SmartScheduleRequest,
  provider: RecommendationProvider = defaultBenchmarkProvider
): SmartScheduleResult {
  const strategy: SmartStrategy = req.strategy ?? "per_platform";
  const schedulingMode = req.schedulingMode ?? "smart";
  const intervalDays = req.intervalDays && req.intervalDays > 0 ? req.intervalDays : 1;
  const postsPerDay = Math.max(1, req.postsPerDay);
  const intraDayGap = req.intraDayGapMinutes && req.intraDayGapMinutes > 0 ? req.intraDayGapMinutes : 30;
  const manualTime = req.manualTime || "08:00";
  const warnings: string[] = [];
  const items: ScheduledItemSlot[] = [];

  const audienceTimezone = req.country?.timezone || "Africa/Algiers";
  const displayTimezone = req.displayTimezone || audienceTimezone;
  const globalPlatforms = req.platforms && req.platforms.length > 0 ? req.platforms : ["instagram" as PlatformId];

  // Determine total items to schedule
  const totalItemsCount = req.items && req.items.length > 0
    ? req.items.length
    : Math.max(1, (req.days || 1) * postsPerDay);

  for (let itemIdx = 0; itemIdx < totalItemsCount; itemIdx++) {
    const itemDescriptor = req.items ? req.items[itemIdx] : undefined;
    const itemId = itemDescriptor?.id;
    const targetPlatforms = itemDescriptor?.targetPlatforms && itemDescriptor.targetPlatforms.length > 0
      ? itemDescriptor.targetPlatforms
      : globalPlatforms;

    const dayIndex = Math.floor(itemIdx / postsPerDay);
    const slotInDayIdx = itemIdx % postsPerDay;

    const audienceCalendarDate = addDaysToDateString(req.startDate, dayIndex * intervalDays);
    const dayOfWeek = getDayOfWeekInTimezone(audienceCalendarDate, audienceTimezone);

    let audienceClockTime: string;
    let sourceSlot: RecommendedSlot | null = null;
    let fallbackTier: ScheduledItemSlot["fallbackTier"] = "exact_benchmark";
    const primaryPlatform = targetPlatforms[0] || "instagram";

    if (schedulingMode === "manual") {
      const baseMinutes = parseTimeMinutes(manualTime);
      const slotMinutes = baseMinutes + slotInDayIdx * intraDayGap;
      audienceClockTime = formatMinutesTime(slotMinutes);
      fallbackTier = "manual_fallback";
    } else if (strategy === "per_platform" && targetPlatforms.length === 1) {
      // Single target platform: pick from that platform's ranked slots
      const res = resolvePlatformSlots(
        req.country.id,
        primaryPlatform,
        audienceCalendarDate,
        dayOfWeek,
        provider,
        req.country,
        postsPerDay,
        intraDayGap,
        manualTime
      );
      fallbackTier = res.tier;
      if (slotInDayIdx < res.slots.length) {
        sourceSlot = res.slots[slotInDayIdx];
        audienceClockTime = sourceSlot.time;
      } else {
        const lastTime = res.slots[res.slots.length - 1]?.time || "12:00";
        audienceClockTime = formatMinutesTime(parseTimeMinutes(lastTime) + (slotInDayIdx - res.slots.length + 1) * intraDayGap);
        sourceSlot = { time: audienceClockTime, confidence: "low", rank: slotInDayIdx + 1 };
        warnings.push(`Padded slot for ${primaryPlatform} on ${dayOfWeek} (${audienceClockTime})`);
      }
    } else {
      // Multi-platform or shared consensus strategy:
      // Aggregate candidate slots across target platforms, sort by average rank, tie-break by earlier time
      const allPlatformSlots: RecommendedSlot[] = [];
      for (const p of targetPlatforms) {
        const res = resolvePlatformSlots(
          req.country.id,
          p,
          audienceCalendarDate,
          dayOfWeek,
          provider,
          req.country,
          postsPerDay,
          intraDayGap,
          manualTime
        );
        for (const s of res.slots) {
          allPlatformSlots.push(s);
        }
      }

      const timeAggregation = new Map<string, { totalRank: number; count: number; bestConf: "high" | "medium" | "low" }>();
      for (const s of allPlatformSlots) {
        const existing = timeAggregation.get(s.time) || { totalRank: 0, count: 0, bestConf: s.confidence };
        existing.totalRank += s.rank;
        existing.count += 1;
        if (s.confidence === "high") existing.bestConf = "high";
        timeAggregation.set(s.time, existing);
      }

      const consensus = Array.from(timeAggregation.entries())
        .map(([time, data]) => ({
          time,
          avgRank: data.totalRank / data.count,
          confidence: data.bestConf,
        }))
        .sort((a, b) => {
          if (Math.abs(a.avgRank - b.avgRank) > 0.01) return a.avgRank - b.avgRank;
          return parseTimeMinutes(a.time) - parseTimeMinutes(b.time);
        });

      if (slotInDayIdx < consensus.length) {
        sourceSlot = {
          time: consensus[slotInDayIdx].time,
          confidence: consensus[slotInDayIdx].confidence,
          rank: slotInDayIdx + 1,
        };
        audienceClockTime = sourceSlot.time;
      } else {
        const lastTime = consensus[consensus.length - 1]?.time || "12:00";
        audienceClockTime = formatMinutesTime(parseTimeMinutes(lastTime) + (slotInDayIdx - consensus.length + 1) * intraDayGap);
        sourceSlot = { time: audienceClockTime, confidence: "low", rank: slotInDayIdx + 1 };
      }
    }

    // Convert audience wall-clock time in audienceTimezone to absolute UTC instant
    const [audY, audM, audD] = audienceCalendarDate.split("-").map(Number);
    const [audH, audMin] = audienceClockTime.split(":").map(Number);
    const instant = zonedDateTimeToDate(
      { year: audY, month: audM, day: audD, hour: audH, minute: audMin },
      audienceTimezone
    );
    const isoTimestamp = instant ? instant.toISOString() : `${audienceCalendarDate}T${audienceClockTime}:00Z`;

    // Format display date and time in displayTimezone (publishing clock)
    let displayDate = audienceCalendarDate;
    let displayTime = audienceClockTime;
    if (instant && displayTimezone !== audienceTimezone) {
      const displayZoned = dateToZonedDateTime(instant, displayTimezone);
      if (displayZoned) {
        displayDate = displayZoned.date;
        displayTime = displayZoned.time;
      }
    }

    items.push({
      itemId,
      platform: primaryPlatform,
      isoTimestamp,
      date: displayDate,
      time: displayTime,
      audienceDate: audienceCalendarDate,
      audienceTime: audienceClockTime,
      dayOfWeek,
      sourceSlot,
      fallbackTier,
    });
  }

  return {
    items,
    strategy,
    warnings,
  };
}
