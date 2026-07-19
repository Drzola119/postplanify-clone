"use client";

import { Sparkles, Check, Star, Info } from "lucide-react";
import { CTAButton } from "@/components/ui/cta-button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading, SectionSubtitle } from "@/components/ui/section-heading";
import { useState } from "react";
import Link from "next/link";

type Plan = {
  name: string;
  description: string;
  monthly: number | "Custom";
  yearly: number | "Custom";
  yearlyTotal?: number;
  features: string[];
  cta: string;
  href: string;
  tag?: string;
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Growth",
    description: "For small teams and solo agency owners managing a few accounts.",
    monthly: 79,
    yearly: 63,
    yearlyTotal: 756,
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
    cta: "Try for Free Now",
    href: "/signup",
  },
  {
    name: "Premium",
    tag: "Most Popular",
    description: "For growing agencies with full team collaboration features.",
    monthly: 159,
    yearly: 127,
    yearlyTotal: 1524,
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
    cta: "Try for Free Now",
    href: "/signup",
  },
  {
    name: "Scale",
    description: "For established agencies managing dozens of clients + need white-label.",
    monthly: 239,
    yearly: 191,
    yearlyTotal: 2292,
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
    cta: "Try for Free Now",
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

function formatPrice(n: number | "Custom") {
  if (n === "Custom") return "Custom";
  return `$${n.toLocaleString()}`;
}

export function PricingToggle() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  return (
    <section id="pricing" className="py-12">
      <Container>
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Start with a 7-day free trial. Cancel anytime.
          </p>

          {/* Trusted by row */}
          <div className="pt-2">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-2 max-w-none">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-10 w-10 rounded-full border-2 border-background overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-500 shadow-sm"
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">Trusted by {process.env.NEXT_PUBLIC_STATS_USERS_COUNT ?? "2,150+"} businesses</span>
            </div>
          </div>

          {/* Monthly / Yearly toggle */}
          <div className="flex justify-center pt-4">
            <div className="inline-flex items-center gap-1 rounded-full border bg-card p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  billing === "monthly"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                  billing === "yearly"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 text-xs font-semibold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 max-w-7xl mx-auto mt-10">
          {PLANS.map((plan) => {
            const price = billing === "monthly" ? plan.monthly : plan.yearly;
            const monthlyPrice = typeof plan.monthly === "number" ? plan.monthly : 0;
            const yearlyPrice = typeof plan.yearly === "number" ? plan.yearly : 0;
            const savings = (monthlyPrice * 12) - (yearlyPrice * 12);
            return (
              <Card
                key={plan.name}
                hover
                className={`relative p-4 md:p-5 flex flex-col ${
                  plan.highlight
                    ? "bg-gradient-to-b from-indigo-50/40 to-background border-green-700 shadow-xl ring-1 ring-green-700"
                    : ""
                }`}
              >
                {plan.tag && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-green-700 text-white text-xs font-semibold px-3 py-1 shadow">
                    <Sparkles className="size-3" />
                    {plan.tag}
                  </div>
                )}
                <h3 className="text-2xl font-bold leading-tight">{plan.name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">{formatPrice(price)}</span>
                    {price !== "Custom" && <span className="text-sm text-muted-foreground">/month</span>}
                  </div>
                  {billing === "yearly" && price !== "Custom" && savings > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Save ${savings}/yr
                      </span>
                      {plan.yearlyTotal && (
                        <p className="text-xs text-muted-foreground">${plan.yearlyTotal.toLocaleString()} billed yearly</p>
                      )}
                    </div>
                  )}
                  {billing === "yearly" && price === "Custom" && (
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">Custom billed yearly</p>
                      <span className="inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Save 20%
                      </span>
                    </div>
                  )}
                </div>
                <a
                  href={plan.href}
                  target={plan.href.startsWith("http") ? "_blank" : undefined}
                  rel={plan.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`mt-5 inline-flex w-full h-12 px-6 items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap rounded-md ${
                    plan.highlight
                      ? "bg-green-700 text-white hover:bg-green-800"
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >
                  {plan.cta}
                  <span className="ml-1 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </a>
                <ul className="mt-6 space-y-1 text-sm">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 leading-5 py-0.5">
                      <span className="flex items-center gap-3">
                        {f.startsWith("Everything in") ? (
                          <span className="font-semibold text-foreground">{f}</span>
                        ) : (
                          <>
                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-500 flex-shrink-0">
                              <Check className="w-4 h-4" />
                            </span>
                            <span>{f}</span>
                          </>
                        )}
                      </span>
                      <Info className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
        <div className="!mt-4 flex flex-col sm:flex-row items-center sm:justify-between gap-2 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>$0 today • 7-day free trial • 14-day money back guarantee*</span>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            *Google Drive, Canva, Unsplash and Dropbox
          </p>
        </div>
        <div className="!mt-6 max-w-7xl mx-auto px-4 sm:px-6">
          <Link
            href="https://cal.com/hasancagli/postplanify-demo-call"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col sm:flex-row items-center justify-center gap-y-1 sm:gap-x-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-100"
          >
            <span>Want a quick walkthrough first?</span>
            <span className="inline-flex items-center gap-1">
              <span className="underline underline-offset-2 group-hover:text-blue-700 transition-colors">Schedule a demo</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}