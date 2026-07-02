import type { Metadata } from "next";
import { Shield, Lock, Eye, Server, KeyRound, FileCheck } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { CTAButton } from "@/components/ui/cta-button";
import { SectionHeading, SectionSubtitle } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Security | PostPlanify",
  description:
    "How PostPlanify protects your data — encryption, compliance, access controls, and infrastructure.",
};

const MEASURES = [
  {
    icon: Lock,
    title: "Encryption everywhere",
    body: "TLS 1.2+ in transit, AES-256 at rest. OAuth tokens are stored in a dedicated, encrypted vault with strict access controls.",
  },
  {
    icon: KeyRound,
    title: "Granular access controls",
    body: "Role-based permissions, mandatory 2FA on team plans, SSO available on Scale. Session timeouts and IP allow-lists on request.",
  },
  {
    icon: Server,
    title: "Hardened infrastructure",
    body: "Hosted on SOC 2 Type II certified infrastructure (AWS). Automated patching, isolated workloads, WAF, and DDoS protection.",
  },
  {
    icon: Eye,
    title: "Continuous monitoring",
    body: "24/7 intrusion detection, anomaly alerting, audit logs for every account, and immutable activity history for compliance reviews.",
  },
  {
    icon: FileCheck,
    title: "Compliance & audits",
    body: "GDPR compliant. SOC 2 Type II in progress. Annual third-party penetration tests. Data Processing Agreements available on request.",
  },
  {
    icon: Shield,
    title: "Backup & recovery",
    body: "Daily encrypted backups, point-in-time recovery, multi-region redundancy. Recovery Time Objective under 4 hours for publishing pipeline.",
  },
];

const CERTS = ["SOC 2 Type II", "GDPR", "CCPA", "ISO 27001 (in progress)", "HIPAA-ready (Enterprise)"];

export default function SecurityPage() {
  return (
    <>
      <Header />
      <main>
        <section className="py-16 lg:py-20">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                Security
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Your social accounts and data are safe with PostPlanify
              </h1>
              <p className="text-lg text-muted-foreground">
                We treat security as a first-class concern — from encryption to access controls to
                ongoing audits. Here&apos;s exactly how we protect your team.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
                <CTAButton href="mailto:hasan@postplanify.com?subject=Security%20question">
                  Contact Security
                </CTAButton>
                <CTAButton href="/gdpr" variant="outline">
                  GDPR Information
                </CTAButton>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <SectionHeading>Security measures</SectionHeading>
            <SectionSubtitle>
              Engineering, infrastructure, and process controls that keep your data safe.
            </SectionSubtitle>
            <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MEASURES.map((m, i) => (
                <Card key={i} className="p-6">
                  <m.icon className="size-6 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{m.title}</h3>
                  <p className="text-sm text-muted-foreground">{m.body}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-16 lg:py-20">
          <Container>
            <SectionHeading>Compliance & certifications</SectionHeading>
            <SectionSubtitle>
              PostPlanify is built to meet the bar set by enterprise security teams.
            </SectionSubtitle>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
              {CERTS.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium"
                >
                  <Shield className="size-4 text-primary" />
                  {c}
                </span>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-3">Need our security pack?</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Request our SOC 2 report, pen-test summary, DPA, and architecture overview.
              </p>
              <CTAButton href="mailto:hasan@postplanify.com?subject=Security%20pack%20request">
                Request Security Pack
              </CTAButton>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}