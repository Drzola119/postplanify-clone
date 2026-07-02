import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { analytics } from "@/data/marketing-pages";

export const metadata = {
  title: "Social Media Analytics Dashboard | PostPlanify",
  description:
    "Track reach, engagement, and growth across all 10 platforms. Best-time-to-post, custom date ranges, and white-label reports.",
};

export default function AnalyticsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={analytics} />
      </main>
      <Footer />
    </>
  );
}