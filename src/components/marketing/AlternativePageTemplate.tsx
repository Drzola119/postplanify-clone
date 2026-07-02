// AlternativePageTemplate.tsx — shared template for /alternative-to-{tool} pages.
// Mirrors the MarketingPageTemplate pattern: data-driven, single component.

import * as React from "react";
import Link from "next/link";
import { Check, X, ChevronRight, Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";
import { Card } from "@/components/ui/card";
import { SectionHeading, SectionSubtitle } from "@/components/ui/section-heading";

export type AlternativeData = {
  slug: string;
  tool: string; // "Buffer"
  category: string; // "Social Media Scheduler"
  description: string; // 1-line description of the tool
  verdict: {
    chooseOther: string[]; // reasons to choose the other tool
    chooseUs: string[]; // reasons to choose PostPlanify
  };
  prosCons: { tool: string[]; us: string[] };
  whySwitch: { title: string; description: string }[];
  comparisonTable: { feature: string; other: string; us: string }[];
  faq: { q: string; a: string }[];
};

export function AlternativePageTemplate({ data }: { data: AlternativeData }) {
  return (
    <main>
      {/* Hero */}
      <section className="py-16 lg:py-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
              {data.category} Comparison
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Best {data.tool} Alternative for Agencies &amp; Teams
            </h1>
            <p className="text-lg text-muted-foreground">
              {data.description}
            </p>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <CTAButton href="/signup">Try PostPlanify Free</CTAButton>
              <CTAButton href="/pricing" variant="outline">See Pricing</CTAButton>
            </div>
          </div>
        </Container>
      </section>

      {/* TL;DR */}
      <section className="py-12 bg-muted/30">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">{data.tool} vs PostPlanify: TL;DR</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-3">Choose {data.tool} if you...</h3>
                <ul className="space-y-2 text-sm">
                  {data.verdict.chooseOther.map((r, i) => (
                    <li key={i} className="flex gap-2"><ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />{r}</li>
                  ))}
                </ul>
              </Card>
              <Card className="p-5 border-primary">
                <h3 className="font-semibold mb-3">Choose PostPlanify if you...</h3>
                <ul className="space-y-2 text-sm">
                  {data.verdict.chooseUs.map((r, i) => (
                    <li key={i} className="flex gap-2"><Check className="size-4 text-primary shrink-0 mt-0.5" />{r}</li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Pros & Cons */}
      <section className="py-16 lg:py-20">
        <Container>
          <SectionHeading>{data.tool} vs PostPlanify: Pros &amp; Cons</SectionHeading>
          <div className="mt-10 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">{data.tool}</h3>
              <ul className="space-y-2 text-sm">
                {data.prosCons.tool.map((p, i) => (
                  <li key={i} className="flex gap-2"><X className="size-4 text-muted-foreground shrink-0 mt-0.5" />{p}</li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 border-primary">
              <h3 className="text-lg font-semibold mb-4">PostPlanify</h3>
              <ul className="space-y-2 text-sm">
                {data.prosCons.us.map((p, i) => (
                  <li key={i} className="flex gap-2"><Check className="size-4 text-primary shrink-0 mt-0.5" />{p}</li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </section>

      {/* Why users switch */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <Container>
          <SectionHeading>Why users switch from {data.tool}</SectionHeading>
          <SectionSubtitle>The most common reasons teams move to PostPlanify.</SectionSubtitle>
          <div className="mt-10 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {data.whySwitch.map((w, i) => (
              <Card key={i} className="p-6">
                <h3 className="font-semibold mb-2">{w.title}</h3>
                <p className="text-sm text-muted-foreground">{w.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Comparison table */}
      <section className="py-16 lg:py-20">
        <Container>
          <SectionHeading>{data.tool} vs PostPlanify: Features &amp; Pricing Comparison</SectionHeading>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Feature</th>
                  <th className="text-left py-3 px-4 font-semibold">{data.tool}</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary">PostPlanify</th>
                </tr>
              </thead>
              <tbody>
                {data.comparisonTable.map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-3 px-4 font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.other}</td>
                    <td className="py-3 px-4">{row.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <Container>
          <SectionHeading>Frequently Asked Questions</SectionHeading>
          <div className="mt-10 max-w-3xl mx-auto space-y-3">
            {data.faq.map((f, i) => (
              <details key={i} className="rounded-lg border bg-card p-4 group">
                <summary className="cursor-pointer font-medium flex items-center justify-between gap-2 list-none">
                  <span>{f.q}</span>
                  <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-3">Ready to switch from {data.tool}?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Join agencies and teams who upgraded to PostPlanify. 7-day free trial, no credit card required.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <CTAButton href="/signup">Try PostPlanify Free</CTAButton>
              <CTAButton href="https://cal.com/hasancagli/postplanify-demo-call" variant="outline">Book a Demo</CTAButton>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}