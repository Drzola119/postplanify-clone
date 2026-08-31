import type { PlatformId } from "@/lib/platforms";
import {
  type CountryConfig,
  type DayOfWeek,
  type RecommendedSlot,
  type PlatformDaySchedule,
} from "@/data/scheduling/countries";
import {
  type RecommendationProvider,
  defaultBenchmarkProvider,
  getDayOfWeekInTimezone,
} from "./recommendation-provider";
import { zonedDateTimeToDate } from "@/lib/datetime/zoned";

export type SmartStrategy = "per_platform" | "shared";

export interface SmartScheduleRequest {
  startDate: string; // "YYYY-MM-DD"
  days: number;
  postsPerDay: number;
  intervalDays?: number; // default 1
  intraDayGapMinutes?: number; // default 30
  platforms: PlatformId[];
  country: CountryConfig;
  strategy?: SmartStrategy; // default "per_platform"
  schedulingMode?: "smart" | "manual"; // default "smart"
  manualTime?: string; // default "08:00"
}

export interface ScheduledItemSlot {
  platform: PlatformId;
  isoTimestamp: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  dayOfWeek: DayOfWeek;
  sourceSlot: RecommendedSlot | null;
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
 * Single source of truth for generating scheduled timestamps
 * in both the UI preview and the final Apply action.
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

  const timezone = req.country?.timezone || "Africa/Algiers";
  const daysCount = Math.max(1, req.days);
  const platforms = req.platforms.length > 0 ? req.platforms : ["instagram" as PlatformId];

  for (let dayIndex = 0; dayIndex < daysCount; dayIndex++) {
    const calendarDate = addDaysToDateString(req.startDate, dayIndex * intervalDays);
    const dayOfWeek = getDayOfWeekInTimezone(calendarDate, timezone);

    if (schedulingMode === "manual") {
      // Manual mode: Start at manualTime, subsequent slots spaced by intraDayGap
      const baseMinutes = parseTimeMinutes(manualTime);
      for (let postIdx = 0; postIdx < postsPerDay; postIdx++) {
        const slotMinutes = baseMinutes + postIdx * intraDayGap;
        const clockTime = formatMinutesTime(slotMinutes);
        const [y, m, d] = calendarDate.split("-").map(Number);
        const [h, min] = clockTime.split(":").map(Number);
        const instant = zonedDateTimeToDate(
          { year: y, month: m, day: d, hour: h, minute: min },
          timezone
        );

        items.push({
          platform: platforms[0],
          isoTimestamp: instant ? instant.toISOString() : `${calendarDate}T${clockTime}:00Z`,
          date: calendarDate,
          time: clockTime,
          dayOfWeek,
          sourceSlot: null,
        });
      }
      continue;
    }

    // Smart Best Times mode
    const recs = provider.getRecommendationsSync({
      country: req.country,
      platforms,
      date: calendarDate,
      postsPerDay,
    });

    if (strategy === "per_platform") {
      // Platform-specific slot calculation
      const recsByPlatform = new Map<PlatformId, PlatformDaySchedule>();
      for (const r of recs) {
        recsByPlatform.set(r.platform, r);
      }

      for (const pid of platforms) {
        const sched = recsByPlatform.get(pid);
        const availableSlots = (sched?.slots ?? []).slice().sort((a, b) => {
          if (a.rank !== b.rank) return a.rank - b.rank;
          return parseTimeMinutes(a.time) - parseTimeMinutes(b.time);
        });

        const chosenSlots: RecommendedSlot[] = [];

        for (let postIdx = 0; postIdx < postsPerDay; postIdx++) {
          if (postIdx < availableSlots.length) {
            chosenSlots.push(availableSlots[postIdx]);
          } else {
            // Padded slot
            const lastTime = chosenSlots[chosenSlots.length - 1]?.time || "12:00";
            const paddedMinutes = parseTimeMinutes(lastTime) + intraDayGap;
            const paddedTime = formatMinutesTime(paddedMinutes);
            chosenSlots.push({
              time: paddedTime,
              confidence: "low",
              rank: postIdx + 1,
            });
            const warnMsg = `Padded slot for ${pid} on ${dayOfWeek} (${paddedTime})`;
            if (!warnings.includes(warnMsg)) warnings.push(warnMsg);
          }
        }

        // Sort chosen slots chronologically for the day
        chosenSlots.sort((a, b) => parseTimeMinutes(a.time) - parseTimeMinutes(b.time));

        for (const slot of chosenSlots) {
          const [y, m, d] = calendarDate.split("-").map(Number);
          const [h, min] = slot.time.split(":").map(Number);
          const instant = zonedDateTimeToDate(
            { year: y, month: m, day: d, hour: h, minute: min },
            timezone
          );

          items.push({
            platform: pid,
            isoTimestamp: instant ? instant.toISOString() : `${calendarDate}T${slot.time}:00Z`,
            date: calendarDate,
            time: slot.time,
            dayOfWeek,
            sourceSlot: slot,
          });
        }
      }
    } else {
      // Shared consensus schedule
      const candidateSlots: RecommendedSlot[] = [];
      for (const r of recs) {
        for (const s of r.slots) {
          candidateSlots.push(s);
        }
      }

      // Group candidate slots and sort by average rank and earlier time
      const timeToSlots = new Map<string, { totalRank: number; count: number; bestConf: "high" | "medium" | "low" }>();
      for (const s of candidateSlots) {
        const existing = timeToSlots.get(s.time);
        if (!existing) {
          timeToSlots.set(s.time, { totalRank: s.rank, count: 1, bestConf: s.confidence });
        } else {
          existing.totalRank += s.rank;
          existing.count += 1;
          if (s.confidence === "high") existing.bestConf = "high";
        }
      }

      const consensus = Array.from(timeToSlots.entries())
        .map(([time, data]) => ({
          time,
          avgRank: data.totalRank / data.count,
          confidence: data.bestConf,
        }))
        .sort((a, b) => {
          if (Math.abs(a.avgRank - b.avgRank) > 0.01) return a.avgRank - b.avgRank;
          return parseTimeMinutes(a.time) - parseTimeMinutes(b.time); // tie-break earlier time
        });

      const chosenShared: RecommendedSlot[] = [];
      for (let postIdx = 0; postIdx < postsPerDay; postIdx++) {
        if (postIdx < consensus.length) {
          chosenShared.push({
            time: consensus[postIdx].time,
            confidence: consensus[postIdx].confidence,
            rank: postIdx + 1,
          });
        } else {
          const lastTime = chosenShared[chosenShared.length - 1]?.time || "12:00";
          const paddedMinutes = parseTimeMinutes(lastTime) + intraDayGap;
          const paddedTime = formatMinutesTime(paddedMinutes);
          chosenShared.push({
            time: paddedTime,
            confidence: "low",
            rank: postIdx + 1,
          });
        }
      }

      chosenShared.sort((a, b) => parseTimeMinutes(a.time) - parseTimeMinutes(b.time));

      for (const slot of chosenShared) {
        const [y, m, d] = calendarDate.split("-").map(Number);
        const [h, min] = slot.time.split(":").map(Number);
        const instant = zonedDateTimeToDate(
          { year: y, month: m, day: d, hour: h, minute: min },
          timezone
        );

        items.push({
          platform: platforms[0],
          isoTimestamp: instant ? instant.toISOString() : `${calendarDate}T${slot.time}:00Z`,
          date: calendarDate,
          time: slot.time,
          dayOfWeek,
          sourceSlot: slot,
        });
      }
    }
  }

  return {
    items,
    strategy,
    warnings,
  };
}
