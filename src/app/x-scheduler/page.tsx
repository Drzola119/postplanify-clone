import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { xScheduler } from "@/data/marketing-pages";

export const metadata = {
  title: "Schedule X (Twitter) Posts and Tweets | X Scheduler by PostPlanify",
  description:
    "Schedule X posts, threads, and replies. Auto-publish, analytics, and a unified social inbox.",
};

export default function XSchedulerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={xScheduler} />
      </main>
      <Footer />
    </>
  );
}