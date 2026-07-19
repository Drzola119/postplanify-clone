"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

type Plan = {
  name: string;
  tag?: string;
  description: string;
  monthly: number | "Custom";
  yearly: number | "Custom";
  features: string[];
  highlight?: boolean;
  cta: string;
  href: string;
};

const PLANS: Plan[] = [
  {
    name: "Growth",
    description: "For small teams and solo agency owners managing a few accounts.",
    monthly: 79,
    yearly: 948,
    features: [
      "15 Social Accounts",
      "5 Workspaces",
      "3 Users",
      "Unlimited Posts",
      "Analytics",
      "Reply to Comments + DMs",
      "Bulk Schedule",
      "Media Library",
      "Shared Calendar",
      "Link in Bio",
      "Full API + MCP Access",
      "AI Assistant",
      "Custom Integrations*",
    ],
    cta: "Get Started",
    href: "/signup",
  },
  {
    name: "Premium",
    tag: "Most Popular",
    description: "For growing agencies with full team collaboration features.",
    monthly: 159,
    yearly: 1908,
    features: [
      "Everything in Growth, plus:",
      "30 Social Accounts",
      "15 Workspaces",
      "6 Users",
      "Advanced Analytics",
      "Reports",
      "Post Approvals",
      "Team Comments / @Mentions",
      "Roles & Permissions",
      "AI Training & Knowledge",
      "400 AI Images / mo",
    ],
    highlight: true,
    cta: "Get Started",
    href: "/signup",
  },
  {
    name: "Scale",
    description: "For established agencies managing dozens of clients + need white-label.",
    monthly: 239,
    yearly: 2868,
    features: [
      "Everything in Premium, plus:",
      "100 Social Accounts",
      "50 Workspaces",
      "12 Users",
      "White-Label PDF Reports",
      "800 AI Images / mo",
      "Priority Human Support",
      "Dedicated Onboarding & Migration",
    ],
    cta: "Get Started",
    href: "/signup",
  },
  {
    name: "Enterprise",
    description: "For larger agencies needing SSO and custom contracts.",
    monthly: "Custom",
    yearly: "Custom",
    features: [
      "Everything in Scale, plus:",
      "Custom Social Accounts",
      "Unlimited Workspaces",
      "Unlimited Users",
      "Unlimited AI Images / mo",
      "1:1 Onboarding Call",
      "Priority Feature Requests",
      "Private WhatsApp Support",
    ],
    cta: "Book a Demo",
    href: "https://cal.com/hasancagli/postplanify-demo-call",
  },
];

const AVATARS = [
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Ffrank_benton.jpeg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fsam_cranq.avif_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Faleksandr_heinlaid.avif_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fshaheer.jpg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fmonta.jpg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Foguz_doruk.jpg_w_96_q_75",
];

function formatPrice(n: number | "Custom") {
  if (n === "Custom") return "Custom";
  return `$${n.toLocaleString()}`;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="py-12 overflow-x-hidden scroll-mt-10">
      <Container>
        <div className="space-y-10">
          {/* Heading */}
          <div className="text-center space-y-4">
            <SectionHeading>Choose Your Plan</SectionHeading>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Start with a 7-day free trial. Cancel anytime.
            </p>

            {/* Social proof */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex -space-x-3">
                {AVATARS.map((src, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-muted shadow-sm">
                    <Image src={src} alt="User" width={36} height={36} className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-500">
                <span className="text-amber-500">★★★★★</span>
                <span className="text-foreground/80 font-medium">{process.env.NEXT_PUBLIC_STATS_RATING ?? "4.9/5"} from 500+ happy customers</span>
              </div>
            </div>

            {/* Toggle */}
            <div className="flex justify-center pt-2">
              <div className="inline-flex rounded-full border bg-muted/30 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setYearly(false)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    !yearly ? "bg-background shadow font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setYearly(true)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    yearly ? "bg-background shadow font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Yearly{" "}
                  <span className="ml-1 inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((plan) => {
              const price = yearly ? plan.yearly : plan.monthly;
              const savings =
                typeof plan.monthly === "number" && typeof plan.yearly === "number"
                  ? plan.monthly * 12 - plan.yearly
                  : null;

              return (
                <Card
                  key={plan.name}
                  hover
                  className={`relative p-6 flex flex-col ${
                    plan.highlight
                      ? "bg-gradient-to-b from-indigo-50/40 to-background border-indigo-200 shadow-xl ring-1 ring-indigo-200"
                      : ""
                  }`}
                >
                  {plan.tag && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-indigo-600 text-white text-xs font-semibold px-3 py-1 shadow">
                      <Sparkles className="size-3" />
                      {plan.tag}
                    </div>
                  )}

                  <h3 className="text-2xl font-bold leading-tight">{plan.name}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>

                  {/* Price */}
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight">{formatPrice(price)}</span>
                      {price !== "Custom" && (
                        <span className="text-sm text-muted-foreground">{yearly ? "/year" : "/month"}</span>
                      )}
                    </div>
                    {savings !== null && savings > 0 && (
                      <p className="mt-1 text-xs font-medium text-emerald-600">
                        Save ${savings.toLocaleString()}/yr
                      </p>
                    )}
                    {plan.monthly === "Custom" && (
                      <p className="mt-1 text-xs text-muted-foreground">Custom billed yearly · Save 20%</p>
                    )}
                  </div>

                  {/* CTA */}
                  <CTAButton
                    href={plan.href}
                    external={plan.href.startsWith("http")}
                    className={`mt-5 w-full ${
                      plan.highlight
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white [&]:bg-emerald-700 [&]:hover:bg-emerald-800"
                        : plan.name === "Enterprise"
                          ? "bg-blue-800 hover:bg-blue-900 text-white [&]:bg-blue-800 [&]:hover:bg-blue-900"
                          : ""
                    }`}
                  >
                    {plan.cta}
                  </CTAButton>

                  {/* Features */}
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {f.startsWith("Everything in") ? (
                          <span className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mt-0.5">★</span>
                        ) : (
                          <Check className={`size-4 shrink-0 mt-0.5 ${plan.highlight ? "text-indigo-600" : "text-emerald-600"}`} />
                        )}
                        <span className={f.startsWith("Everything in") ? "text-xs uppercase tracking-wide font-semibold text-muted-foreground" : ""}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
