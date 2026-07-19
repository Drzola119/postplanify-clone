import type { Metadata } from "next";
import { InstagramBioGeneratorClient } from "./InstagramBioGeneratorClient";

export const metadata: Metadata = {
  title: "Free Instagram Bio Generator — AI Bios (2026)",
  description:
    "Free AI-powered Instagram bio generator. Create the perfect Instagram bio in seconds — 150 characters, ready to copy and paste. No signup required.",
  openGraph: {
    title: "Free Instagram Bio Generator — AI Bios (2026)",
    description:
      "Free AI-powered Instagram bio generator. Create the perfect Instagram bio in seconds.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <InstagramBioGeneratorClient />;
}
