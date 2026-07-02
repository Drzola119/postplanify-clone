import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { automation } from "@/data/marketing-pages";

export const metadata = {
  title: "Workflow Automation | PostPlanify",
  description:
    "Automate publishing, inbox routing, approvals, and reporting. Set up rules once and let PostPlanify run them.",
};

export default function AutomationPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={automation} />
      </main>
      <Footer />
    </>
  );
}