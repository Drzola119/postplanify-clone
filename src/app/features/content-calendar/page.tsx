import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { contentCalendar } from "@/data/marketing-pages";

export const metadata = {
  title: "Social Media Content Calendar & Scheduler | PostPlanify",
  description:
    "Drag-and-drop social media content calendar. Schedule posts across 10 platforms, bulk upload, and auto-publish. Try PostPlanify free.",
};

export default function ContentCalendarPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={contentCalendar} />
      </main>
      <Footer />
    </>
  );
}