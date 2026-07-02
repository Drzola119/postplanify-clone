import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";
import { Card } from "@/components/ui/card";
import { SectionHeading, SectionSubtitle } from "@/components/ui/section-heading";
import { ALTERNATIVES } from "@/data/alternatives";

export const metadata: Metadata = {
  title: "Best Social Media Scheduler Alternatives for 2026 | PostPlanify vs Everyone",
  description:
    "Compare PostPlanify against 32 of the most popular social media management tools. Side-by-side comparisons of pricing, features, workflow speed, and platform support.",
};

const CATEGORIES = [
  {
    title: "Established enterprise platforms",
    tools: ["Hootsuite", "Sprout Social", "Sprinklr", "Zoho Social", "AgoraPulse"],
  },
  {
    title: "Indie & creator-first schedulers",
    tools: ["Buffer", "Later", "Planoly", "Pallyy", "Iconosquare", "Hopper HQ"],
  },
  {
    title: "Affordable alternatives",
    tools: ["Postbridge", "Postiz", "Metricool", "Publer", "SocialPilot", "Tailwind"],
  },
  {
    title: "Team collaboration focused",
    tools: ["Planable", "Loomly", "Sendible", "CoSchedule", "HeyOrca", "NapoleonCat"],
  },
  {
    title: "AI-first or automation heavy",
    tools: ["SocialBee", "MeetEdgar", "RecurPost", "Post Planner", "Kontentino"],
  },
  {
    title: "Specialty / niche players",
    tools: ["Sked Social", "Statusbrew", "eClincher", "Vista Social"],
  },
];

export default function AlternativesIndexPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                All Alternatives
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Compare PostPlanify to 32 social media tools
              </h1>
              <p className="text-lg text-muted-foreground">
                Side-by-side comparisons of PostPlanify against the most popular social media
                schedulers. Pricing, features, team collaboration, AI tools, bulk scheduling — see
                exactly how we differ before you switch.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
                <CTAButton href="/signup">Try PostPlanify Free</CTAButton>
                <CTAButton href="/pricing" variant="outline">
                  See Pricing
                </CTAButton>
              </div>
            </div>
          </Container>
        </section>

        {/* Why switch at a glance */}
        <section className="py-12 bg-muted/30">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Why teams switch to PostPlanify
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  "Flat pricing ($79-$239/mo) vs per-channel",
                  "Bulk schedule up to 20 posts at once",
                  "Team collaboration on every plan",
                  "AI captions + AI image generation",
                  "Multi-brand workspaces built-in",
                  "White-label PDF reports",
                  "API + MCP (Claude, ChatGPT, Gemini, Copilot)",
                  "10 platforms incl. Bluesky & Google Business",
                  "7-day free trial + 14-day money-back",
                ].map((benefit, i) => (
                  <Card key={i} className="p-4 flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{benefit}</span>
                  </Card>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Category groups */}
        <section className="py-16 lg:py-20">
          <Container>
            <SectionHeading>Browse alternatives by category</SectionHeading>
            <SectionSubtitle>
              Jump to the comparison that matches the tool you currently use.
            </SectionSubtitle>
            <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CATEGORIES.map((cat, i) => (
                <Card key={i} className="p-6">
                  <h3 className="font-semibold mb-3">{cat.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {cat.tools.map((tool) => {
                      const alt = ALTERNATIVES.find((a) => a.tool === tool);
                      if (!alt) return null;
                      return (
                        <Link
                          key={alt.slug}
                          href={`/alternative-to-${alt.slug}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {alt.tool}
                        </Link>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Full grid */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <SectionHeading>All 32 alternatives</SectionHeading>
            <SectionSubtitle>
              Click any tool for a detailed comparison with PostPlanify.
            </SectionSubtitle>
            <div className="mt-10 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ALTERNATIVES.map((alt) => (
                <Link
                  key={alt.slug}
                  href={`/alternative-to-${alt.slug}`}
                  className="group"
                >
                  <Card className="p-5 h-full transition-shadow hover:shadow-md">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      PostPlanify vs {alt.tool}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {alt.description}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm text-primary">
                      See comparison
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* Final CTA */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-3">Ready to switch?</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Join agencies and teams who upgraded to PostPlanify. 7-day free trial, no credit
                card required.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <CTAButton href="/signup">Try PostPlanify Free</CTAButton>
                <CTAButton
                  href="https://cal.com/hasancagli/postplanify-demo-call"
                  variant="outline"
                >
                  Book a Demo
                </CTAButton>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}