import type { Metadata } from "next";
import { InstagramHashtagGeneratorClient } from "./InstagramHashtagGeneratorClient";

export const metadata: Metadata = {
  title: "Free Instagram Hashtag Generator — AI Hashtags (2026)",
  description:
    "Free AI-powered Instagram hashtag generator. Generate relevant, trending hashtags for your Instagram posts in seconds. No signup required.",
  openGraph: {
    title: "Free Instagram Hashtag Generator — AI Hashtags (2026)",
    description:
      "Free AI-powered Instagram hashtag generator. Generate relevant, trending hashtags in seconds.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <InstagramHashtagGeneratorClient />;
}