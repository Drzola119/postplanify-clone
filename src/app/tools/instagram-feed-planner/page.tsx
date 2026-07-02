import type { Metadata } from "next";
import { InstagramFeedPlannerClient } from "./InstagramFeedPlannerClient";

export const metadata: Metadata = {
  title: "Free Instagram Feed Planner — Visual Grid Preview (2026)",
  description:
    "Free Instagram feed planner. Plan and preview your Instagram grid before posting. Upload images, drag to reorder, and see exactly how your feed will look. No signup required.",
  openGraph: {
    title: "Free Instagram Feed Planner — Visual Grid Preview (2026)",
    description:
      "Free Instagram feed planner. Plan and preview your Instagram grid before posting.",
    images: ["/seo/postplanify-og-image.png"],
  },
};

export default function Page() {
  return <InstagramFeedPlannerClient />;
}
