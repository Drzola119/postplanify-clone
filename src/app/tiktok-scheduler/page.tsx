import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { tiktokScheduler } from "@/data/marketing-pages";

export const metadata = {
  title: "Schedule TikTok Posts and Videos | TikTok Scheduler by PostPlanify",
  description:
    "Schedule TikTok videos in advance. Bulk upload, best-time-to-post, analytics, and unified inbox built in.",
};

export default function TiktokSchedulerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={tiktokScheduler} />
      </main>
      <Footer />
    </>
  );
}