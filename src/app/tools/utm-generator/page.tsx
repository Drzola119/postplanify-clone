import type { Metadata } from "next";
import { UtmGeneratorClient } from "./UtmGeneratorClient";

export const metadata: Metadata = {
  title: "Free UTM Generator — Build Tracking URLs Instantly (2026)",
  description:
    "Free UTM generator for marketers. Create Google Analytics-ready tracking URLs with utm_source, utm_medium, and utm_campaign in seconds. No signup.",
  openGraph: {
    title: "Free UTM Generator — Build Tracking URLs Instantly (2026)",
    description:
      "Free UTM generator for marketers. Create Google Analytics-ready tracking URLs with utm_source, utm_medium, and utm_campaign in seconds.",
    images: ["/seo/postplanify-og-image.png"],
  },
};

export default function Page() {
  return <UtmGeneratorClient />;
}