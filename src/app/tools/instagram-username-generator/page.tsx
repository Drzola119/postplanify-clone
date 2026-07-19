import type { Metadata } from "next";
import { InstagramUsernameGeneratorClient } from "./InstagramUsernameGeneratorClient";

export const metadata: Metadata = {
  title: "Free Instagram Username Generator — AI Usernames (2026)",
  description:
    "Free AI-powered Instagram username generator. Generate creative, aesthetic Instagram usernames in seconds. No signup required.",
  openGraph: {
    title: "Free Instagram Username Generator — AI Usernames (2026)",
    description:
      "Free AI-powered Instagram username generator. Generate creative, aesthetic Instagram usernames in seconds.",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <InstagramUsernameGeneratorClient />;
}
