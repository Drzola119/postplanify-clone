import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { ToolsPageTemplate } from "@/components/tools/ToolsPageTemplate";
import { TOOLS } from "@/data/tools";

const data = TOOLS.find((t) => t.slug === "instagram-character-counter")!;

export const metadata: Metadata = {
  title: data.name + " | Free PostPlanify Tool",
  description: data.description,
};

export default function Page() {
  return (
    <>
      <Header />
      <ToolsPageTemplate data={data} />
      <Footer />
    </>
  );
}
