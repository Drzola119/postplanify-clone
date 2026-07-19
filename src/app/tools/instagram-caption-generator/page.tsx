import type { Metadata } from "next";
import { InstagramCaptionGeneratorClient } from "./InstagramCaptionGeneratorClient";

export const metadata: Metadata = {
  title: "Free Instagram Caption Generator — AI Captions + Hashtags (2026)",
  description:
    "Free AI-powered Instagram caption generator. Get scroll-stopping captions with strategic hashtag suggestions in seconds. No signup required.",
  openGraph: {
    title: "Free Instagram Caption Generator — AI Captions + Hashtags (2026)",
    description:
      "Free AI-powered Instagram caption generator. Get scroll-stopping captions with strategic hashtag suggestions in seconds.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <InstagramCaptionGeneratorClient />;
}
