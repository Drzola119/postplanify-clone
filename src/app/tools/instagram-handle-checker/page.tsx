import type { Metadata } from "next";
import { InstagramHandleCheckerClient } from "./InstagramHandleCheckerClient";

export const metadata: Metadata = {
  title: "Free Instagram Handle Checker — Check Username Availability (2026)",
  description:
    "Free Instagram handle checker. Validate format, find alternatives, and check Instagram username availability instantly. No signup required.",
  openGraph: {
    title: "Free Instagram Handle Checker — Check Username Availability (2026)",
    description:
      "Free Instagram handle checker. Validate format, find alternatives, and check Instagram username availability instantly.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <InstagramHandleCheckerClient />;
}
