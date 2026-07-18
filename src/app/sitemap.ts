import { type MetadataRoute } from "next";

const BASE = "https://postplanify.com";

const STATIC_ROUTES = [
  "",
  "/pricing",
  "/features",
  "/integrations",
  "/help",
  "/changelog",
  "/blog",
  "/templates",
  "/use-cases",
  "/alternatives",
  "/login",
  "/signup",
  "/affiliates",
  "/social-media-holidays",
  "/social-media-terms",
  "/tools",
  "/dashboard",
  "/compare",
];

const SCHEDULER_PAGES = [
  "instagram-scheduler",
  "facebook-scheduler",
  "twitter-scheduler",
  "linkedin-scheduler",
  "tiktok-scheduler",
  "youtube-scheduler",
  "threads-scheduler",
  "pinterest-scheduler",
  "bluesky-scheduler",
  "google-business-scheduler",
  "x-scheduler",
];

const ALTERNATIVE_PAGES = [
  "agorapulse",
  "buffer",
  "coschedule",
  "eclincher",
  "heyorca",
  "hootsuite",
  "hopperhq",
  "iconosquare",
  "kontentino",
  "later",
  "loomly",
  "meetedgar",
  "metricool",
  "napoleoncat",
  "pallyy",
  "planable",
  "planoly",
  "postbridge",
  "postiz",
  "postplanner",
  "publer",
  "recurpost",
  "sendible",
  "skedsocial",
  "socialbee",
  "socialpilot",
  "sprinklr",
  "sprout-social",
  "statusbrew",
  "tailwind",
  "vista-social",
  "zoho-social",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = STATIC_ROUTES.map((r) => ({
    url: `${BASE}${r}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: r === "" ? 1 : 0.8,
  }));

  const schedulerEntries = SCHEDULER_PAGES.map((s) => ({
    url: `${BASE}/${s}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const alternativeEntries = ALTERNATIVE_PAGES.map((a) => ({
    url: `${BASE}/alternative-to-${a}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [...staticEntries, ...schedulerEntries, ...alternativeEntries];
}
