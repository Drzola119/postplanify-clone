import type { Metadata } from "next";
import { YouTubeEngagementCalculatorClient } from "./YouTubeEngagementCalculatorClient";

export const metadata: Metadata = {
  title: "YouTube Engagement Rate Calculator — Free | PostPlanify",
  description:
    "Calculate your YouTube engagement rate instantly. Enter likes, comments, shares, and views or subscribers to measure your video performance against 2026 industry benchmarks.",
  openGraph: {
    title: "YouTube Engagement Rate Calculator — Free | PostPlanify",
    description:
      "Calculate your YouTube engagement rate instantly. Enter likes, comments, shares, and views or subscribers to measure your video performance against 2026 industry benchmarks.",
    images: ["/seo/postplanify-og-image.png"],
  },
};

export default function Page() {
  return <YouTubeEngagementCalculatorClient />;
}