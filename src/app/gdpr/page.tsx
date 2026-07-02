import type { Metadata } from "next";
import { Globe, FileText, Mail, ShieldCheck } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { CTAButton } from "@/components/ui/cta-button";
import { SectionHeading, SectionSubtitle } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "GDPR Compliance | PostPlanify",
  description:
    "How PostPlanify complies with the EU General Data Protection Regulation (GDPR).",
};

const COMMITMENTS = [
  {
    icon: ShieldCheck,
    title: "Lawful basis & transparency",
    body: "We process personal data under the lawful bases defined in Article 6 GDPR. Our Privacy Policy discloses what we collect and why in plain language.",
  },
  {
    icon: Mail,
    title: "Data subject rights",
    body: "Right to access, rectify, erase, restrict processing, port, and object — all exercisable from your account or by emailing hasan@postplanify.com. We respond within 30 days.",
  },
  {
    icon: Globe,
    title: "International transfers",
    body: "EU/UK personal data is primarily stored in EU/UK regions. Cross-border transfers to the US are covered by Standard Contractual Clauses (2021/914).",
  },
  {
    icon: FileText,
    title: "Data Processing Agreement",
    body: "We sign DPAs with all customers on request, including EU SCCs where transfers occur. Available at no cost — contact us.",
  },
];

export default function GdprPage() {
  return (
    <>
      <Header />
      <main>
        <section className="py-16 lg:py-20">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                GDPR
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                PostPlanify is GDPR compliant
              </h1>
              <p className="text-lg text-muted-foreground">
                We respect the rights of EU and UK data subjects and operate in line with the EU
                General Data Protection Regulation. Here&apos;s what that means in practice.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
                <CTAButton href="mailto:hasan@postplanify.com?subject=DPA%20request">
                  Request DPA
                </CTAButton>
                <CTAButton href="/privacy-policy" variant="outline">
                  Privacy Policy
                </CTAButton>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <SectionHeading>Our GDPR commitments</SectionHeading>
            <SectionSubtitle>
              Concrete, actionable steps we take to protect personal data of EU/UK residents.
            </SectionSubtitle>
            <div className="mt-10 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {COMMITMENTS.map((c, i) => (
                <Card key={i} className="p-6">
                  <c.icon className="size-6 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.body}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-16 lg:py-20">
          <Container>
            <SectionHeading>Data processing in detail</SectionHeading>
            <div className="mt-10 max-w-3xl mx-auto space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Data controller vs processor</h3>
                <p className="text-sm text-muted-foreground">
                  You (the customer) are the data controller for content you publish through
                  PostPlanify. We are the data processor, processing personal data on your behalf
                  to deliver the Service.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Sub-processors</h3>
                <p className="text-sm text-muted-foreground">
                  We use a small set of vetted sub-processors including AWS (hosting), Stripe
                  (billing), Resend (email), and Sentry (error monitoring). A full list is
                  available on request.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Breach notification</h3>
                <p className="text-sm text-muted-foreground">
                  We notify affected customers without undue delay, and in any case within 72
                  hours of becoming aware of a personal data breach, in line with Article 33 GDPR.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Data Protection Officer</h3>
                <p className="text-sm text-muted-foreground">
                  For GDPR inquiries, contact our DPO at hasan@postplanify.com with subject line
                  &ldquo;GDPR inquiry.&rdquo; We respond within 5 business days.
                </p>
              </Card>
            </div>
          </Container>
        </section>

        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-3">Questions about GDPR?</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Reach out to our team — we&apos;re happy to walk through our compliance posture.
              </p>
              <CTAButton href="mailto:hasan@postplanify.com?subject=GDPR%20question">
                Email Privacy Team
              </CTAButton>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}