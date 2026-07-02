// ToolsPageTemplate.tsx — shared template for /tools/* pages.

import * as React from "react";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";
import { Card } from "@/components/ui/card";
import { SectionHeading, SectionSubtitle } from "@/components/ui/section-heading";
import { ToolRunner, ToolInfoCard } from "@/components/tools/ToolRunner";
import type { ToolData, ToolKind } from "@/data/tools";

const INTERACTIVE: ToolKind[] = [
  "engagement",
  "caption",
  "hashtag",
  "bio",
  "username",
  "money",
  "utm",
  "handle",
];

export function ToolsPageTemplate({ data }: { data: ToolData }) {
  const isInteractive = INTERACTIVE.includes(data.kind);

  return (
    <main>
      {/* Hero */}
      <section className="py-16 lg:py-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
              Free Tool · {data.category}
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {data.name}
            </h1>
            <p className="text-lg text-muted-foreground">{data.description}</p>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <CTAButton href="/signup">Try PostPlanify Free</CTAButton>
              <CTAButton href="/tools" variant="outline">
                More Free Tools
              </CTAButton>
            </div>
          </div>
        </Container>
      </section>

      {/* Tool runner / info card */}
      <section className="py-12 bg-muted/30">
        <Container>
          <div className="max-w-3xl mx-auto">
            {isInteractive && data.fields ? (
              <ToolRunner kind={data.kind as "caption" | "bio" | "username" | "hashtag" | "engagement" | "utm" | "money" | "handle"} fields={data.fields} />
            ) : (
              <ToolInfoCard
                title={data.name}
                description={data.description}
                bullets={data.benefits || [
                  "Free, no signup required",
                  "Works on any device",
                  "Bookmark this page to come back anytime",
                ]}
              />
            )}
          </div>
        </Container>
      </section>

      {/* How to use */}
      <section className="py-16 lg:py-20">
        <Container>
          <SectionHeading>How to use this tool</SectionHeading>
          <SectionSubtitle>Three quick steps to get the answer you need.</SectionSubtitle>
          <div className="mt-10 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: 1, title: "Enter your data", body: "Fill in the inputs above with your account details or content topic." },
              { step: 2, title: "Get instant results", body: "The tool calculates or generates results in real-time — no signup required." },
              { step: 3, title: "Use and improve", body: "Apply the results to your social strategy. Bookmark this page to come back anytime." },
            ].map((s) => (
              <Card key={s.step} className="p-6">
                <span className="inline-flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-semibold mb-3">
                  {s.step}
                </span>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <Container>
          <SectionHeading>Why this tool is worth bookmarking</SectionHeading>
          <div className="mt-10 grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {(data.benefits || [
              "Free, no signup required",
              "Works on any device",
              "Calculations run in your browser",
              "Bookmark this page to come back anytime",
            ]).map((b, i) => (
              <Card key={i} className="p-4 flex items-start gap-2">
                <Check className="size-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{b}</span>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ-lite */}
      <section className="py-16 lg:py-20">
        <Container>
          <SectionHeading>Common questions</SectionHeading>
          <div className="mt-10 max-w-3xl mx-auto space-y-3">
            {[
              { q: "Is this tool free?", a: "Yes — all PostPlanify free tools are 100% free with no signup required." },
              { q: "Do you store my input data?", a: "No — calculations run entirely in your browser. We never see your input." },
              { q: "Can I use this on mobile?", a: "Yes — the tool is fully responsive and works on any device." },
              { q: "What's next after this?", a: "Use the result directly, or try PostPlanify to plan, schedule, and analyze posts across 10 social platforms." },
            ].map((f, i) => (
              <details key={i} className="rounded-lg border bg-card p-4 group">
                <summary className="cursor-pointer font-medium flex items-center justify-between gap-2 list-none">
                  <span>{f.q}</span>
                  <span className="text-muted-foreground transition-transform group-open:rotate-90">›</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-3">Need a full social media workflow?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              PostPlanify includes planning, scheduling, analytics, AI captions, and team
              collaboration — all in one place.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <CTAButton href="/signup">Try PostPlanify Free</CTAButton>
              <CTAButton href="/pricing" variant="outline">
                See Pricing
              </CTAButton>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}