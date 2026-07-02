import type { Metadata } from "next";
import { TikTokMoneyCalculatorClient } from "./TikTokMoneyCalculatorClient";

export const metadata: Metadata = {
  title: "TikTok Money Calculator — Free Earnings Estimator (2026)",
  description:
    "Free TikTok Money Calculator. Estimate how much TikTokers make per post, per 1,000 views, and monthly. Data-backed earnings calculator for creators, influencers, and brands. No signup required.",
  openGraph: {
    title: "TikTok Money Calculator — Free Earnings Estimator (2026)",
    description:
      "Free TikTok Money Calculator. Estimate how much TikTokers make per post, per 1,000 views, and monthly. Data-backed earnings calculator for creators, influencers, and brands.",
    images: ["/seo/postplanify-og-image.png"],
  },
};

export default function Page() {
  return <TikTokMoneyCalculatorClient />;
}