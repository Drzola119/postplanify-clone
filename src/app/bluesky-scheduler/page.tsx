import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { blueskyScheduler } from "@/data/marketing-pages";

export const metadata = {
  title: "Bluesky Scheduler for Creators and Agencies | PostPlanify",
  description:
    "Schedule Bluesky posts in advance. Cross-platform calendar, analytics, and unified inbox.",
};

export default function BlueskySchedulerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={blueskyScheduler} />
      </main>
      <Footer />
    </>
  );
}