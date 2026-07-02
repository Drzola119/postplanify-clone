import type { Metadata } from "next";
import { TiktokCaptionGeneratorClient } from "./TiktokCaptionGeneratorClient";

export const metadata: Metadata = {
  title: "Free TikTok Caption Generator — AI Captions + Hashtags (2026)",
  description:
    "Free AI-powered TikTok caption generator. Get viral, FYP-ready captions with trending hashtag suggestions in seconds. No signup required.",
  openGraph: {
    title: "Free TikTok Caption Generator — AI Captions + Hashtags (2026)",
    description:
      "Free AI-powered TikTok caption generator. Get viral, FYP-ready captions with trending hashtag suggestions in seconds.",
    images: ["/seo/postplanify-og-image.png"],
  },
};

export default function Page() {
  return <TiktokCaptionGeneratorClient />;
}