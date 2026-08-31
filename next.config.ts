import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Short aliases for tools — the page components live at the long “-calculator / -checker”
// paths (e.g. /tools/instagram-engagement-calculator). These rewrites let the
// short forms resolve without creating duplicate page folders.
const TOOL_ALIASES: Record<string, string> = {
  "/tools/instagram-engagement": "/tools/instagram-engagement-calculator",
  "/tools/instagram-grid": "/tools/instagram-grid-maker",
  "/tools/tiktok-engagement": "/tools/tiktok-engagement-calculator",
  "/tools/youtube-engagement": "/tools/youtube-engagement-calculator",
  "/tools/linkedin-engagement": "/tools/linkedin-engagement-calculator",
  "/tools/tiktok-safe-zone": "/tools/tiktok-safe-zone-checker",
  "/tools/instagram-safe-zone": "/tools/instagram-safe-zone-checker",
  "/tools/youtube-shorts-safe-zone": "/tools/youtube-shorts-safe-zone-checker",
  "/tools/tiktok-money": "/tools/tiktok-money-calculator",
};

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
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
        // No-store for app pages only — exclude static SEO/data assets so CDN can cache them
        source: "/((?!api|_next|static|sitemap\\.xml|robots\\.txt|.*\\..*$).*)",
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
      { source: "/dashboard/drafts", destination: "/dashboard/posts/drafts", permanent: true },
      { source: "/dashboard/social-inbox", destination: "/dashboard/inbox", permanent: true },
      { source: "/dashboard/media", destination: "/dashboard/assets", permanent: true },
      { source: "/dashboard/workspaces", destination: "/dashboard/brands", permanent: true },
      { source: "/dashboard/posting-queue", destination: "/dashboard/queue", permanent: true },
    ];
  },
  async rewrites() {
    return [
      // Note: `/_next/image` is handled in middleware.ts because Next.js's
      // built-in handler intercepts rewrites before they can match.
      { source: "/_next/static/chunks/:path*", destination: "/api/chunks/:path*" },
      // Link in Bio public page: /@username → /username (Next.js App Router
      // reserves `@` for parallel route slots, so we use a rewrite).
      { source: "/@:username", destination: "/:username" },
      // Short tool aliases → real page folders (no duplicate pages)
      ...Object.entries(TOOL_ALIASES).map(([source, destination]) => ({ source, destination })),
    ];
  },
};

export default withNextIntl(nextConfig);
