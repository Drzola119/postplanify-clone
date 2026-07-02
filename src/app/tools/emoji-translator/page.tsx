import type { Metadata } from "next";
import { EmojiTranslatorClient } from "./EmojiTranslatorClient";

export const metadata: Metadata = {
  title: "Free Emoji Translator — Text to Emoji & Emoji to Text (2026)",
  description:
    "Free AI-powered emoji translator. Convert text to emojis or decode emoji messages to text instantly. No signup required.",
  openGraph: {
    title: "Free Emoji Translator — Text to Emoji & Emoji to Text (2026)",
    description:
      "Free AI-powered emoji translator. Convert text to emojis or decode emoji messages to text instantly.",
    images: ["/seo/postplanify-og-image.png"],
  },
};

export default function Page() {
  return <EmojiTranslatorClient />;
}
