import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { threadsScheduler } from "@/data/marketing-pages";

export const metadata = {
  title: "Schedule Threads Posts | PostPlanify Threads Scheduler",
  description:
    "Schedule Threads posts in advance. Cross-platform calendar, analytics, and unified inbox.",
};

export default function ThreadsSchedulerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={threadsScheduler} />
      </main>
      <Footer />
    </>
  );
}