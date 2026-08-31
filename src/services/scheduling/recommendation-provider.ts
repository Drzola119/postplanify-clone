import type { PlatformId } from "@/lib/platforms";
import {
  type CountryConfig,
  type DayOfWeek,
  type PlatformDaySchedule,
  getCountryBenchmarks,
} from "@/data/scheduling/countries";

export interface RecommendationContext {
  country: CountryConfig;
  platforms: PlatformId[];
  date: string; // "YYYY-MM-DD"
  contentType?: string;
  postsPerDay: number;
}

export interface RecommendationProvider {
  getRecommendations(ctx: RecommendationContext): Promise<PlatformDaySchedule[]>;
  getRecommendationsSync(ctx: RecommendationContext): PlatformDaySchedule[];
}

const DOW_MAP: Record<string, DayOfWeek> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

export function getDayOfWeekInTimezone(dateStr: string, timezone: string): DayOfWeek {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "mon";
  // Create a UTC noon timestamp for the given calendar date to avoid boundary shifts before formatting
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
    });
    const weekdayStr = formatter.format(utcDate);
    return DOW_MAP[weekdayStr] ?? "mon";
  } catch {
    const dayIdx = utcDate.getUTCDay(); // 0 = Sun, 1 = Mon ...
    const fallbackMap: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return fallbackMap[dayIdx] ?? "mon";
  }
}

export class BenchmarkProvider implements RecommendationProvider {
  getRecommendationsSync(ctx: RecommendationContext): PlatformDaySchedule[] {
    const allBenchmarks = getCountryBenchmarks(ctx.country.id);
    const dayOfWeek = getDayOfWeekInTimezone(ctx.date, ctx.country.timezone);
    const platformSet = new Set(ctx.platforms);

    const matches = allBenchmarks.filter(
      (b) => b.day === dayOfWeek && (platformSet.size === 0 || platformSet.has(b.platform))
    );

    return matches;
  }

  async getRecommendations(ctx: RecommendationContext): Promise<PlatformDaySchedule[]> {
    return this.getRecommendationsSync(ctx);
  }
}

export const defaultBenchmarkProvider = new BenchmarkProvider();
