import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { socialInbox } from "@/data/marketing-pages";

export const metadata = {
  title: "Social Media Inbox — Manage Comments in One Place | PostPlanify",
  description:
    "Unified social inbox for comments, DMs, and mentions. AI reply suggestions, assign to teammates, label, and never miss a customer.",
};

export default function SocialInboxPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={socialInbox} />
      </main>
      <Footer />
    </>
  );
}