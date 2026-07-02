import type { Metadata } from "next";
import { InstagramSafeZoneCheckerClient } from "./InstagramSafeZoneCheckerClient";

export const metadata: Metadata = {
  title: "Instagram Safe Zone Checker — Free Overlay Tool (2026)",
  description:
    "Free Instagram safe zone overlay tool. See exactly where text, captions & UI buttons overlap on Reels and Stories. Instant preview, no signup. Works for all video formats.",
  openGraph: {
    title: "Instagram Safe Zone Checker — Free Overlay Tool (2026)",
    description:
      "Free Instagram safe zone overlay tool. See exactly where text, captions & UI buttons overlap on Reels and Stories. Instant preview, no signup. Works for all video formats.",
    images: ["/seo/postplanify-og-image.png"],
  },
};

export default function Page() {
  return <InstagramSafeZoneCheckerClient />;
}
