import type { Metadata } from "next";
import { LinkedInEngagementCalculatorClient } from "./LinkedInEngagementCalculatorClient";

export const metadata: Metadata = {
  title: "LinkedIn Engagement Rate Calculator — Free | PostPlanify",
  description:
    "Calculate your LinkedIn engagement rate instantly. Enter reactions, comments, shares, and impressions to measure your professional content performance against 2026 industry benchmarks.",
  openGraph: {
    title: "LinkedIn Engagement Rate Calculator — Free | PostPlanify",
    description:
      "Calculate your LinkedIn engagement rate instantly. Enter reactions, comments, shares, and impressions to measure your professional content performance against 2026 industry benchmarks.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <LinkedInEngagementCalculatorClient />;
}