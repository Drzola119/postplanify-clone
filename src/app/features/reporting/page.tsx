import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { reporting } from "@/data/marketing-pages";

export const metadata = {
  title: "White-Label Social Media Reports | PostPlanify",
  description:
    "Auto-generated branded PDF reports and shareable live links. Cross-platform metrics, custom branding, scheduled delivery.",
};

export default function ReportingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={reporting} />
      </main>
      <Footer />
    </>
  );
}