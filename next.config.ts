import type { NextConfig } from "next";

const TOOL_ALIASES: Record<string, string> = {
  "/tools/instagram-engagement-calculator": "/tools/instagram-engagement",
  "/tools/instagram-grid-maker": "/tools/instagram-grid",
  "/tools/tiktok-engagement-calculator": "/tools/tiktok-engagement",
  "/tools/youtube-engagement-calculator": "/tools/youtube-engagement",
  "/tools/linkedin-engagement-calculator": "/tools/linkedin-engagement",
  "/tools/tiktok-safe-zone-checker": "/tools/tiktok-safe-zone",
  "/tools/instagram-safe-zone-checker": "/tools/instagram-safe-zone",
  "/tools/youtube-shorts-safe-zone-checker": "/tools/youtube-shorts-safe-zone",
  "/tools/tiktok-money-calculator": "/tools/tiktok-money",
};

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
      {
        source: "/((?!api|_next|static|.*\\..*$).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy dashboard slugs → current paths (kept for bookmarks + external links).
      { source: "/dashboard/calendar", destination: "/dashboard/posts", permanent: true },
      { source: "/dashboard/drafts", destination: "/dashboard/posts/drafts", permanent: true },
      { source: "/dashboard/social-inbox", destination: "/dashboard/inbox", permanent: true },
      { source: "/dashboard/media", destination: "/dashboard/assets", permanent: true },
      { source: "/dashboard/workspaces", destination: "/dashboard/brands", permanent: true },
      { source: "/dashboard/posting-queue", destination: "/dashboard/queue", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/tools/instagram-engagement-calculator", destination: "/tools/instagram-engagement" },
      { source: "/tools/instagram-grid-maker", destination: "/tools/instagram-grid" },
      { source: "/tools/tiktok-engagement-calculator", destination: "/tools/tiktok-engagement" },
      { source: "/tools/youtube-engagement-calculator", destination: "/tools/youtube-engagement" },
      { source: "/tools/linkedin-engagement-calculator", destination: "/tools/linkedin-engagement" },
      { source: "/tools/tiktok-safe-zone-checker", destination: "/tools/tiktok-safe-zone" },
      { source: "/tools/instagram-safe-zone-checker", destination: "/tools/instagram-safe-zone" },
      { source: "/tools/youtube-shorts-safe-zone-checker", destination: "/tools/youtube-shorts-safe-zone" },
      { source: "/tools/tiktok-money-calculator", destination: "/tools/tiktok-money" },
    ];
  },
};

export default nextConfig;
