import type { PlatformId } from "@/lib/platforms";

export interface CountryConfig {
  id: string;
  name: string;
  localizedName?: string;
  isoCode: string;
  flagEmoji: string;
  timezone: string;
  utcOffsetMinutes: number;
  observesDST: boolean;
  supported: boolean;
  locale: string;
}

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface RecommendedSlot {
  time: string; // "HH:mm" in 24-hour format
  confidence: "high" | "medium" | "low";
  rank: number; // 1 = highest recommended slot
}

export interface PlatformDaySchedule {
  platform: PlatformId;
  day: DayOfWeek;
  slots: RecommendedSlot[];
  sourceType: "benchmark" | "account_analytics" | "hybrid";
  lastUpdated: string;
}

export const ALGERIA_CONFIG: CountryConfig = {
  id: "DZ",
  name: "Algeria",
  localizedName: "الجزائر",
  isoCode: "DZ",
  flagEmoji: "🇩🇿",
  timezone: "Africa/Algiers",
  utcOffsetMinutes: 60,
  observesDST: false,
  supported: true,
  locale: "ar-DZ",
};

const LAST_UPDATED = "2026-08-31";

// ─── Benchmarks for Algeria (Africa/Algiers, UTC+1) ───
// Derived from regional engagement peaks across social media in North Africa / MENA.
export const ALGERIA_BENCHMARKS: PlatformDaySchedule[] = [
  // ── Instagram ──
  {
    platform: "instagram",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "18:00", confidence: "high", rank: 2 },
      { time: "21:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "instagram",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "17:30", confidence: "high", rank: 2 },
      { time: "21:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "instagram",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:30", confidence: "high", rank: 1 },
      { time: "18:00", confidence: "high", rank: 2 },
      { time: "22:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "instagram",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:00", confidence: "high", rank: 1 },
      { time: "19:00", confidence: "high", rank: 2 },
      { time: "22:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "instagram",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "14:30", confidence: "high", rank: 1 },
      { time: "19:30", confidence: "high", rank: 2 },
      { time: "23:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "instagram",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "11:00", confidence: "high", rank: 1 },
      { time: "18:00", confidence: "high", rank: 2 },
      { time: "21:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "instagram",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:00", confidence: "high", rank: 1 },
      { time: "18:00", confidence: "high", rank: 2 },
      { time: "21:00", confidence: "medium", rank: 3 },
    ],
  },

  // ── TikTok ──
  {
    platform: "tiktok",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "13:00", confidence: "high", rank: 1 },
      { time: "20:00", confidence: "high", rank: 2 },
      { time: "22:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "tiktok",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "12:30", confidence: "high", rank: 1 },
      { time: "20:30", confidence: "high", rank: 2 },
      { time: "23:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "tiktok",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "13:00", confidence: "high", rank: 1 },
      { time: "21:00", confidence: "high", rank: 2 },
      { time: "23:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "tiktok",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "14:00", confidence: "high", rank: 1 },
      { time: "21:30", confidence: "high", rank: 2 },
      { time: "23:45", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "tiktok",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "15:00", confidence: "high", rank: 1 },
      { time: "21:00", confidence: "high", rank: 2 },
      { time: "23:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "tiktok",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "13:30", confidence: "high", rank: 1 },
      { time: "20:00", confidence: "high", rank: 2 },
      { time: "22:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "tiktok",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "12:00", confidence: "high", rank: 1 },
      { time: "19:30", confidence: "high", rank: 2 },
      { time: "22:00", confidence: "medium", rank: 3 },
    ],
  },

  // ── Facebook ──
  {
    platform: "facebook",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "13:00", confidence: "high", rank: 2 },
      { time: "19:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "facebook",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "13:00", confidence: "high", rank: 2 },
      { time: "19:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "facebook",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:30", confidence: "high", rank: 1 },
      { time: "14:00", confidence: "high", rank: 2 },
      { time: "20:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "facebook",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:00", confidence: "high", rank: 1 },
      { time: "14:30", confidence: "high", rank: 2 },
      { time: "20:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "facebook",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "14:00", confidence: "high", rank: 1 },
      { time: "18:00", confidence: "high", rank: 2 },
      { time: "21:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "facebook",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:30", confidence: "high", rank: 1 },
      { time: "15:00", confidence: "high", rank: 2 },
      { time: "19:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "facebook",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "13:30", confidence: "high", rank: 2 },
      { time: "19:00", confidence: "medium", rank: 3 },
    ],
  },

  // ── YouTube ──
  {
    platform: "youtube",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "15:00", confidence: "high", rank: 1 },
      { time: "18:00", confidence: "medium", rank: 2 },
      { time: "20:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "youtube",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "15:00", confidence: "high", rank: 1 },
      { time: "18:30", confidence: "medium", rank: 2 },
      { time: "20:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "youtube",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "15:30", confidence: "high", rank: 1 },
      { time: "19:00", confidence: "high", rank: 2 },
      { time: "21:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "youtube",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "14:00", confidence: "high", rank: 1 },
      { time: "17:30", confidence: "high", rank: 2 },
      { time: "21:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "youtube",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "11:30", confidence: "high", rank: 1 },
      { time: "15:00", confidence: "high", rank: 2 },
      { time: "20:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "youtube",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "11:00", confidence: "high", rank: 1 },
      { time: "16:00", confidence: "high", rank: 2 },
      { time: "20:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "youtube",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "14:00", confidence: "high", rank: 1 },
      { time: "18:00", confidence: "medium", rank: 2 },
      { time: "20:30", confidence: "medium", rank: 3 },
    ],
  },

  // ── X (Twitter) ──
  {
    platform: "twitter",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "08:30", confidence: "high", rank: 1 },
      { time: "12:30", confidence: "high", rank: 2 },
      { time: "18:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "twitter",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "08:30", confidence: "high", rank: 1 },
      { time: "12:30", confidence: "high", rank: 2 },
      { time: "19:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "twitter",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "13:00", confidence: "high", rank: 2 },
      { time: "19:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "twitter",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "13:30", confidence: "high", rank: 2 },
      { time: "20:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "twitter",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:00", confidence: "high", rank: 1 },
      { time: "15:00", confidence: "high", rank: 2 },
      { time: "21:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "twitter",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:30", confidence: "medium", rank: 1 },
      { time: "16:00", confidence: "medium", rank: 2 },
      { time: "20:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "twitter",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "08:30", confidence: "high", rank: 1 },
      { time: "12:30", confidence: "high", rank: 2 },
      { time: "18:00", confidence: "medium", rank: 3 },
    ],
  },

  // ── LinkedIn ──
  {
    platform: "linkedin",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "08:00", confidence: "high", rank: 1 },
      { time: "11:30", confidence: "high", rank: 2 },
      { time: "16:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "linkedin",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "08:00", confidence: "high", rank: 1 },
      { time: "10:30", confidence: "high", rank: 2 },
      { time: "15:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "linkedin",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "08:30", confidence: "high", rank: 1 },
      { time: "11:00", confidence: "high", rank: 2 },
      { time: "16:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "linkedin",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "08:30", confidence: "high", rank: 1 },
      { time: "10:30", confidence: "high", rank: 2 },
      { time: "15:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "linkedin",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "medium", rank: 1 },
      { time: "11:30", confidence: "medium", rank: 2 },
      { time: "14:30", confidence: "low", rank: 3 },
    ],
  },
  {
    platform: "linkedin",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:00", confidence: "low", rank: 1 },
      { time: "14:00", confidence: "low", rank: 2 },
      { time: "18:00", confidence: "low", rank: 3 },
    ],
  },
  {
    platform: "linkedin",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "medium", rank: 1 },
      { time: "12:00", confidence: "medium", rank: 2 },
      { time: "17:00", confidence: "medium", rank: 3 },
    ],
  },

  // ── Threads ──
  {
    platform: "threads",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:30", confidence: "high", rank: 1 },
      { time: "18:30", confidence: "high", rank: 2 },
      { time: "21:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "threads",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:30", confidence: "high", rank: 1 },
      { time: "18:00", confidence: "high", rank: 2 },
      { time: "21:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "threads",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:00", confidence: "high", rank: 1 },
      { time: "19:00", confidence: "high", rank: 2 },
      { time: "22:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "threads",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:30", confidence: "high", rank: 1 },
      { time: "19:30", confidence: "high", rank: 2 },
      { time: "22:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "threads",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "14:30", confidence: "high", rank: 1 },
      { time: "20:00", confidence: "high", rank: 2 },
      { time: "23:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "threads",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "11:30", confidence: "high", rank: 1 },
      { time: "18:30", confidence: "medium", rank: 2 },
      { time: "22:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "threads",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:00", confidence: "high", rank: 1 },
      { time: "18:00", confidence: "high", rank: 2 },
      { time: "21:30", confidence: "medium", rank: 3 },
    ],
  },

  // ── Pinterest ──
  {
    platform: "pinterest",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "14:00", confidence: "medium", rank: 1 },
      { time: "20:00", confidence: "high", rank: 2 },
      { time: "22:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "pinterest",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "14:00", confidence: "medium", rank: 1 },
      { time: "20:30", confidence: "high", rank: 2 },
      { time: "22:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "pinterest",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "15:00", confidence: "medium", rank: 1 },
      { time: "20:30", confidence: "high", rank: 2 },
      { time: "23:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "pinterest",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "15:00", confidence: "high", rank: 1 },
      { time: "21:00", confidence: "high", rank: 2 },
      { time: "23:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "pinterest",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "16:00", confidence: "high", rank: 1 },
      { time: "21:30", confidence: "high", rank: 2 },
      { time: "23:45", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "pinterest",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "14:30", confidence: "high", rank: 1 },
      { time: "20:00", confidence: "high", rank: 2 },
      { time: "22:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "pinterest",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "14:00", confidence: "medium", rank: 1 },
      { time: "20:00", confidence: "high", rank: 2 },
      { time: "22:00", confidence: "high", rank: 3 },
    ],
  },

  // ── Bluesky ──
  {
    platform: "bluesky",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "medium", rank: 1 },
      { time: "13:00", confidence: "medium", rank: 2 },
      { time: "19:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "bluesky",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "medium", rank: 1 },
      { time: "13:00", confidence: "medium", rank: 2 },
      { time: "19:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "bluesky",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:30", confidence: "medium", rank: 1 },
      { time: "13:30", confidence: "medium", rank: 2 },
      { time: "20:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "bluesky",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:30", confidence: "medium", rank: 1 },
      { time: "14:00", confidence: "medium", rank: 2 },
      { time: "20:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "bluesky",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "11:00", confidence: "medium", rank: 1 },
      { time: "16:00", confidence: "medium", rank: 2 },
      { time: "21:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "bluesky",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "11:30", confidence: "medium", rank: 1 },
      { time: "16:30", confidence: "medium", rank: 2 },
      { time: "20:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "bluesky",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "medium", rank: 1 },
      { time: "13:00", confidence: "medium", rank: 2 },
      { time: "19:00", confidence: "high", rank: 3 },
    ],
  },

  // ── Telegram ──
  {
    platform: "telegram",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "08:30", confidence: "high", rank: 1 },
      { time: "13:00", confidence: "high", rank: 2 },
      { time: "20:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "telegram",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "08:30", confidence: "high", rank: 1 },
      { time: "13:00", confidence: "high", rank: 2 },
      { time: "20:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "telegram",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "13:30", confidence: "high", rank: 2 },
      { time: "21:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "telegram",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "14:00", confidence: "high", rank: 2 },
      { time: "21:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "telegram",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "11:00", confidence: "high", rank: 1 },
      { time: "15:30", confidence: "high", rank: 2 },
      { time: "21:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "telegram",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:30", confidence: "high", rank: 1 },
      { time: "16:00", confidence: "high", rank: 2 },
      { time: "20:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "telegram",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "08:30", confidence: "high", rank: 1 },
      { time: "13:00", confidence: "high", rank: 2 },
      { time: "20:00", confidence: "high", rank: 3 },
    ],
  },

  // ── Discord ──
  {
    platform: "discord",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "17:00", confidence: "medium", rank: 1 },
      { time: "20:30", confidence: "high", rank: 2 },
      { time: "23:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "discord",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "17:00", confidence: "medium", rank: 1 },
      { time: "20:30", confidence: "high", rank: 2 },
      { time: "23:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "discord",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "17:30", confidence: "medium", rank: 1 },
      { time: "21:00", confidence: "high", rank: 2 },
      { time: "23:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "discord",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "18:00", confidence: "high", rank: 1 },
      { time: "21:30", confidence: "high", rank: 2 },
      { time: "23:45", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "discord",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "16:00", confidence: "high", rank: 1 },
      { time: "21:00", confidence: "high", rank: 2 },
      { time: "23:45", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "discord",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "14:00", confidence: "medium", rank: 1 },
      { time: "19:00", confidence: "high", rank: 2 },
      { time: "23:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "discord",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "16:00", confidence: "medium", rank: 1 },
      { time: "20:00", confidence: "high", rank: 2 },
      { time: "22:30", confidence: "medium", rank: 3 },
    ],
  },

  // ── Reddit ──
  {
    platform: "reddit",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "12:00", confidence: "high", rank: 1 },
      { time: "18:00", confidence: "high", rank: 2 },
      { time: "22:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "reddit",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "12:00", confidence: "high", rank: 1 },
      { time: "18:30", confidence: "high", rank: 2 },
      { time: "22:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "reddit",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "12:30", confidence: "high", rank: 1 },
      { time: "19:00", confidence: "high", rank: 2 },
      { time: "22:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "reddit",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "13:00", confidence: "high", rank: 1 },
      { time: "19:30", confidence: "high", rank: 2 },
      { time: "22:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "reddit",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "13:30", confidence: "high", rank: 1 },
      { time: "17:00", confidence: "high", rank: 2 },
      { time: "22:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "reddit",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "11:00", confidence: "medium", rank: 1 },
      { time: "16:00", confidence: "high", rank: 2 },
      { time: "21:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "reddit",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "12:00", confidence: "high", rank: 1 },
      { time: "18:00", confidence: "high", rank: 2 },
      { time: "21:30", confidence: "medium", rank: 3 },
    ],
  },

  // ── Google Business Profile ──
  {
    platform: "google_business",
    day: "mon",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "12:30", confidence: "high", rank: 2 },
      { time: "16:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "google_business",
    day: "tue",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "12:30", confidence: "high", rank: 2 },
      { time: "16:30", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "google_business",
    day: "wed",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:30", confidence: "high", rank: 1 },
      { time: "13:00", confidence: "high", rank: 2 },
      { time: "17:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "google_business",
    day: "thu",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:30", confidence: "high", rank: 1 },
      { time: "13:00", confidence: "high", rank: 2 },
      { time: "17:30", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "google_business",
    day: "fri",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "medium", rank: 1 },
      { time: "11:00", confidence: "high", rank: 2 },
      { time: "15:00", confidence: "high", rank: 3 },
    ],
  },
  {
    platform: "google_business",
    day: "sat",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "10:00", confidence: "high", rank: 1 },
      { time: "13:30", confidence: "high", rank: 2 },
      { time: "17:00", confidence: "medium", rank: 3 },
    ],
  },
  {
    platform: "google_business",
    day: "sun",
    sourceType: "benchmark",
    lastUpdated: LAST_UPDATED,
    slots: [
      { time: "09:00", confidence: "high", rank: 1 },
      { time: "12:30", confidence: "high", rank: 2 },
      { time: "16:00", confidence: "medium", rank: 3 },
    ],
  },
];
