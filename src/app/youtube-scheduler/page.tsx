import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { youtubeScheduler } from "@/data/marketing-pages";

export const metadata = {
  title: "Schedule YouTube Videos and Shorts | YouTube Scheduler by PostPlanify",
  description:
    "Schedule YouTube Shorts and long-form videos. Auto-publish, analytics, and cross-platform calendar in one dashboard.",
};

export default function YoutubeSchedulerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={youtubeScheduler} />
      </main>
      <Footer />
    </>
  );
}