import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { UseCasesHero } from "@/components/sections/use-cases/Hero";
import { CategorySection } from "@/components/sections/use-cases/CategorySection";
import { BrowseByCategory } from "@/components/sections/use-cases/BrowseByCategory";
import { OneTool } from "@/components/sections/use-cases/OneTool";
import { FindYourWorkflow } from "@/components/sections/use-cases/FindYourWorkflow";
import { CATEGORIES } from "@/data/use-cases";

export const metadata: Metadata = {
  title: "Social Media Management for Every Role & Business Type | PostPlanify",
  description:
    "Whether you are a solo creator scheduling your first posts or an agency managing dozens of client accounts — PostPlanify adapts to your workflow. Find your role below and see how it works for you.",
  alternates: { canonical: "/use-cases" },
  openGraph: {
    title: "Social Media Management for Every Role & Business Type | PostPlanify",
    description:
      "Whether you are a solo creator scheduling your first posts or an agency managing dozens of client accounts — PostPlanify adapts to your workflow.",
    type: "website",
    url: "/use-cases",
  },
};

export default function UseCasesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <UseCasesHero />
        <div className="space-y-16">
          {CATEGORIES.map((cat) => (
            <CategorySection key={cat.id} category={cat} />
          ))}
        </div>
        <BrowseByCategory />
        <OneTool />
        <FindYourWorkflow />
      </main>
      <Footer />
    </>
  );
}
