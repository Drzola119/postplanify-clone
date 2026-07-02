import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { api } from "@/data/marketing-pages";

export const metadata = {
  title: "API & MCP for Developers | PostPlanify",
  description:
    "REST API + MCP server for Claude, ChatGPT, Gemini, and Copilot. Build integrations, power AI agents, and ship on top of PostPlanify.",
};

export default function ApiPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={api} />
      </main>
      <Footer />
    </>
  );
}