import type { Metadata } from "next";
import { InstagramImageResizerClient } from "./InstagramImageResizerClient";

export const metadata: Metadata = {
  title: "Free Instagram Image Resizer — Square, Story, Reel (2026)",
  description:
    "Free Instagram image resizer. Resize images to perfect dimensions for Instagram posts, Stories, Reels, and profile pictures. No signup required.",
  openGraph: {
    title: "Free Instagram Image Resizer — Square, Story, Reel (2026)",
    description:
      "Free Instagram image resizer. Resize images to perfect dimensions for Instagram posts, Stories, Reels, and profile pictures.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <InstagramImageResizerClient />;
}
