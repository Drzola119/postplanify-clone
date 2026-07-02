import type { Metadata } from "next";
import { TikTokEngagementCalculatorClient } from "./TikTokEngagementCalculatorClient";

export const metadata: Metadata = {
  title: "TikTok Engagement Rate Calculator — Free | PostPlanify",
  description:
    "Calculate your TikTok engagement rate instantly. Enter likes, comments, shares, and views or followers to measure your content performance against 2026 industry benchmarks.",
  openGraph: {
    title: "TikTok Engagement Rate Calculator — Free | PostPlanify",
    description:
      "Calculate your TikTok engagement rate instantly. Enter likes, comments, shares, and views or followers to measure your content performance against 2026 industry benchmarks.",
    images: ["/seo/postplanify-og-image.png"],
  },
};

export default function Page() {
  return <TikTokEngagementCalculatorClient />;
}
