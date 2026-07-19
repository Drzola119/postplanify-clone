import type { Metadata } from "next";
import { YouTubeShortsSafeZoneCheckerClient } from "./YouTubeShortsSafeZoneCheckerClient";

export const metadata: Metadata = {
  title: "YouTube Shorts Safe Zone Checker — Free Overlay Tool (2026)",
  description:
    "Free YouTube Shorts safe zone overlay tool. See exactly where text, captions & UI buttons overlap on Shorts. Instant preview, no signup. Works for all video formats.",
  openGraph: {
    title: "YouTube Shorts Safe Zone Checker — Free Overlay Tool (2026)",
    description:
      "Free YouTube Shorts safe zone overlay tool. See exactly where text, captions & UI buttons overlap on Shorts. Instant preview, no signup. Works for all video formats.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <YouTubeShortsSafeZoneCheckerClient />;
}