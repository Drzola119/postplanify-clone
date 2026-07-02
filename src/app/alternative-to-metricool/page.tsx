import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { AlternativePageTemplate } from "@/components/marketing/AlternativePageTemplate";
import { ALTERNATIVES } from "@/data/alternatives";

const data = ALTERNATIVES.find((a) => a.slug === "metricool")!;

export const metadata: Metadata = {
  title: `Best ${data.tool} Alternative for 2026 | PostPlanify vs ${data.tool}`,
  description: data.description,
};

export default function Page() {
  return (
    <>
      <Header />
      <AlternativePageTemplate data={data} />
      <Footer />
    </>
  );
}
