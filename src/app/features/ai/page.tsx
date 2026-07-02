import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { aiAssistant } from "@/data/marketing-pages";

export const metadata = {
  title: "AI Assistant – Captions, Images & Insights | PostPlanify",
  description:
    "Built-in AI for captions, images, and content ideas. Trained on your brand voice. Generate a week of posts in seconds.",
};

export default function AiPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={aiAssistant} />
      </main>
      <Footer />
    </>
  );
}