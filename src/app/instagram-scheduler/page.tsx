import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { instagramScheduler } from "@/data/marketing-pages";

export const metadata = {
  title: "Schedule Instagram Posts, Reels and Stories | PostPlanify",
  description:
    "Best Instagram scheduler. Schedule Reels, carousels, and Stories. Built-in analytics, social inbox, and bulk upload. Try free.",
};

export default function InstagramSchedulerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={instagramScheduler} />
      </main>
      <Footer />
    </>
  );
}