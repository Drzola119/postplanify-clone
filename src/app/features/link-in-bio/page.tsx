import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { linkInBio } from "@/data/marketing-pages";

export const metadata = {
  title: "Link in Bio Page Builder | PostPlanify",
  description:
    "Fully customizable link-in-bio pages with built-in analytics, unlimited blocks, custom domains, and zero branding.",
};

export default function LinkInBioPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={linkInBio} />
      </main>
      <Footer />
    </>
  );
}