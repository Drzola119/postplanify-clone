import type { Metadata } from "next";
import { TikTokSafeZoneCheckerClient } from "./TikTokSafeZoneCheckerClient";

export const metadata: Metadata = {
  title: "TikTok Safe Zone Checker — Free Overlay Tool (2026)",
  description:
    "Free TikTok safe zone overlay tool. See exactly where text, captions & UI buttons overlap. Instant preview, no signup. Works for all video formats.",
  openGraph: {
    title: "TikTok Safe Zone Checker — Free Overlay Tool (2026)",
    description:
      "Free TikTok safe zone overlay tool. See exactly where text, captions & UI buttons overlap. Instant preview, no signup. Works for all video formats.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <TikTokSafeZoneCheckerClient />;
}
