import type { Metadata } from "next";
import { LinkedinCaptionGeneratorClient } from "./LinkedinCaptionGeneratorClient";

export const metadata: Metadata = {
  title: "Free LinkedIn Post Generator — AI Posts + Hooks (2026)",
  description:
    "Free AI-powered LinkedIn post generator. Create professional, engaging posts for thought leadership, career updates, and business content in seconds.",
  openGraph: {
    title: "Free LinkedIn Post Generator — AI Posts + Hooks (2026)",
    description:
      "Free AI-powered LinkedIn post generator. Create professional, engaging posts in seconds.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <LinkedinCaptionGeneratorClient />;
}