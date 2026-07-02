import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { teamCollaboration } from "@/data/marketing-pages";

export const metadata = {
  title: "Team Collaboration for Social Media | PostPlanify",
  description:
    "Shared calendar, approvals, comments, and role-based permissions. Flat pricing for agencies and in-house teams.",
};

export default function TeamCollaborationPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={teamCollaboration} />
      </main>
      <Footer />
    </>
  );
}