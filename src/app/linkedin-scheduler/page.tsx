import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { linkedinScheduler } from "@/data/marketing-pages";

export const metadata = {
  title: "Schedule Your LinkedIn Posts | PostPlanify",
  description:
    "Schedule LinkedIn posts, carousels, and articles for personal profiles and company pages. Analytics and inbox included.",
};

export default function LinkedinSchedulerPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={linkedinScheduler} />
      </main>
      <Footer />
    </>
  );
}