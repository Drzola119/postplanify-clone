import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { googleBusinessScheduler } from "@/data/marketing-pages";

export const metadata = {
  title: "Schedule Google Business Profile Posts | PostPlanify",
  description:
    "Schedule Google Business Profile posts, offers, and events. Local SEO analytics and cross-platform calendar in one dashboard.",
};

export default function GoogleBusinessSchedulerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={googleBusinessScheduler} />
      </main>
      <Footer />
    </>
  );
}