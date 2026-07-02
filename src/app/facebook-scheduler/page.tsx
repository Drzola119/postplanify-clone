import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { facebookScheduler } from "@/data/marketing-pages";

export const metadata = {
  title: "Schedule Facebook Posts, Reels and Videos Automatically | PostPlanify",
  description:
    "Schedule Facebook page posts, group posts, and Reels. Analytics, inbox, and bulk upload built in.",
};

export default function FacebookSchedulerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={facebookScheduler} />
      </main>
      <Footer />
    </>
  );
}