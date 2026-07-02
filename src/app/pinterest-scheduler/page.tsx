import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { pinterestScheduler } from "@/data/marketing-pages";

export const metadata = {
  title: "Schedule Your Pinterest Posts | PostPlanify",
  description:
    "Schedule Pinterest pins in advance. Bulk upload, analytics, and cross-platform calendar in one dashboard.",
};

export default function PinterestSchedulerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={pinterestScheduler} />
      </main>
      <Footer />
    </>
  );
}