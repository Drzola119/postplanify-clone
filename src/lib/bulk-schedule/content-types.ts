import type { PlatformId } from "@/lib/platforms";

export type BulkContentType =
  | "text"
  | "image"
  | "long_video"
  | "short_video"
  | "story"
  | "trial_reel"
  | "carousel"
  | "document"
  | "community";

export type CarouselMediaMode = "images" | "videos" | "mixed";

const TEXT_PLATFORMS: PlatformId[] = [
  "linkedin",
  "twitter",
  "facebook",
  "threads",
  "reddit",
  "bluesky",
  "discord",
  "telegram",
  "google_business",
];

const IMAGE_PLATFORMS: PlatformId[] = [
  "instagram",
  "tiktok",
  "pinterest",
  "twitter",
  "linkedin",
  "threads",
  "facebook",
  "bluesky",
  "discord",
  "telegram",
  "reddit",
  "google_business",
];

const ALL_VIDEO_PLATFORMS: PlatformId[] = [
  "youtube",
  "facebook",
  "instagram",
  "tiktok",
  "twitter",
  "linkedin",
  "threads",
  "pinterest",
  "reddit",
  "bluesky",
  "telegram",
  "discord",
  "google_business",
];

const LONG_VIDEO_PLATFORMS: PlatformId[] = [
  "youtube",
  "facebook",
  "instagram",
  "tiktok",
  "twitter",
  "linkedin",
  "threads",
  "pinterest",
  "reddit",
  "bluesky",
  "telegram",
  "discord",
];

const SHORT_VIDEO_PLATFORMS: PlatformId[] = ALL_VIDEO_PLATFORMS;
const STORY_PLATFORMS: PlatformId[] = ["instagram", "facebook"];

const IMAGE_CAROUSEL_PLATFORMS: PlatformId[] = [
  "instagram",
  "tiktok",
  "facebook",
  "linkedin",
  "twitter",
  "threads",
  "pinterest",
  "bluesky",
  "discord",
  "telegram",
  "google_business",
];

// Upload-Post currently accepts video files inside the photo/carousel endpoint
// only for Instagram and Threads. That covers both video-only and mixed sets.
const VIDEO_CAROUSEL_PLATFORMS: PlatformId[] = ["instagram", "threads"];

export const BULK_CONTENT_PLATFORM_MAP: Record<Exclude<BulkContentType, "carousel">, PlatformId[]> = {
  text: TEXT_PLATFORMS,
  image: IMAGE_PLATFORMS,
  long_video: LONG_VIDEO_PLATFORMS,
  short_video: SHORT_VIDEO_PLATFORMS,
  story: STORY_PLATFORMS,
  trial_reel: ["instagram"],
  document: ["linkedin"],
  community: ["twitter"],
};

export function platformsForBulkContent(
  contentType: BulkContentType,
  carouselMode: CarouselMediaMode = "images",
): PlatformId[] {
  if (contentType !== "carousel") return [...BULK_CONTENT_PLATFORM_MAP[contentType]];
  if (carouselMode === "images") return [...IMAGE_CAROUSEL_PLATFORMS];
  return [...VIDEO_CAROUSEL_PLATFORMS];
}

export function acceptsMediaKind(
  contentType: BulkContentType,
  kind: "image" | "video" | "document",
  carouselMode: CarouselMediaMode = "images",
): boolean {
  if (contentType === "text" || contentType === "community") return false;
  if (contentType === "image") return kind === "image";
  if (contentType === "long_video" || contentType === "short_video" || contentType === "trial_reel") return kind === "video";
  if (contentType === "story") return kind === "image" || kind === "video";
  if (contentType === "document") return kind === "document";
  if (carouselMode === "images") return kind === "image";
  if (carouselMode === "videos") return kind === "video";
  return kind === "image" || kind === "video";
}

export function normalizeBulkContentType(value: string): BulkContentType | null {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, BulkContentType> = {
    text: "text",
    text_post: "text",
    image: "image",
    image_post: "image",
    video: "long_video",
    long_video: "long_video",
    shorts: "short_video",
    reels: "short_video",
    shorts_reels: "short_video",
    short_video: "short_video",
    story: "story",
    stories: "story",
    trial_reel: "trial_reel",
    trial_reels: "trial_reel",
    trial: "trial_reel",
    carousel: "carousel",
    document: "document",
    community: "community",
    x_community: "community",
  };
  return aliases[normalized] ?? null;
}
