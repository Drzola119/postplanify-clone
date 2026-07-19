"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";
import { Card } from "@/components/ui/card";
import { SectionHeading, SectionSubtitle } from "@/components/ui/section-heading";

const FAQ_ITEMS = [
  {
    q: "What social platforms does PostPlanify support?",
    a: "We support all major social platforms: TikTok, Instagram, Facebook, LinkedIn, X (Twitter), YouTube, Threads, Pinterest, Google My Business and Bluesky!",
  },
  {
    q: "Will using PostPlanify hurt my reach or get my account flagged?",
    a: "No. PostPlanify uses official platform APIs and publishes posts natively, just like manual posting.",
  },
  {
    q: "Is it safe to connect my social media accounts?",
    a: "Yes. We use secure OAuth connections and never store or ask for your social media passwords. PostPlanify is also verified by Meta, LinkedIn, TikTok, X and many other platforms.",
  },
  {
    q: "Do I need to enter my credit card to try PostPlanify?",
    a: "Yes, a credit card is required for the 7-day free trial. This helps us prevent abuse and spam accounts, which is very common with scheduling tools. You won't be charged during the trial, and you can cancel anytime before it ends.",
  },
  {
    q: "How many social accounts can I connect?",
    a: "It depends on your plan: Growth supports 15 accounts, Premium supports 30, and Scale supports 100. Enterprise is tailored for unique needs — book a demo to discuss your requirements.",
  },
  {
    q: "What's the difference between plans?",
    a: "Growth ($99/mo) covers 15 accounts with analytics, social inbox, 3 team members, approval workflows, and unlimited posts. Premium ($199/mo) adds 6 team members, white-label PDF reports, and shared calendar for 30 accounts. Scale ($299/mo) supports 100 accounts, 12 team members, and 800 AI images/mo. Enterprise is tailored for organizations with unique needs — book a demo for 1:1 onboarding, priority feature requests, and WhatsApp support.",
  },
  {
    q: "Can my team collaborate on posts?",
    a: "Yes. On the Premium plan ($199/mo), you get 6 team members with shared calendars, role-based access, and multi-approver approval workflows. The Scale plan ($299/mo) includes 12 team members, and Enterprise offers unlimited team members tailored to your needs. You can also invite clients with a dedicated Client role for external review.",
  },
  {
    q: "How is PostPlanify different from Hootsuite or Buffer?",
    a: "PostPlanify uses flat-rate pricing instead of per-seat or per-channel fees. A 5-person team on PostPlanify costs $199/mo. The same team on Hootsuite costs $1,245+/mo, and on Buffer around $120+/mo with limited features. You also get analytics, social inbox, approval workflows, and white-label reports included.",
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

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-background">
      <Container>
        {/* Heading */}
        <div className="text-center mb-10">
          <SectionHeading>Frequently Asked Questions</SectionHeading>
          <SectionSubtitle>
            Everything you need to know about the platform and how it works
          </SectionSubtitle>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Accordion */}
          <div className="lg:col-span-2 divide-y rounded-2xl border bg-card">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 py-4 px-5 text-left hover:bg-accent/40 transition-colors"
                  >
                    <span className="text-base font-normal">{item.q}</span>
                    <ChevronDown
                      className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: CTA card */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-3">Still have questions?</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Can&apos;t find the answer you&apos;re looking for? Get started with a free trial or chat with our team.
              </p>
              <div className="flex flex-col gap-2">
                <CTAButton Icon={Sparkles} href="/signup">Try for Free</CTAButton>
                <CTAButton variant="outline" href="/signup">
                  <GoogleIcon className="size-4" />
                  Sign up with Google
                </CTAButton>
              </div>
            </Card>

            {/* Trust card */}
            <Card bordered={false} className="bg-muted/30 p-6">
              <div className="flex -space-x-2 mb-3">
                {AVATARS.map((src, i) => (
                  <div key={i} className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-background">
                    <Image src={src} alt="User" fill className="object-cover" sizes="40px" />
                  </div>
                ))}
              </div>
              <p className="font-semibold text-sm leading-tight">Trusted by 2150+ businesses</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex -space-x-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="size-3.5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span>{process.env.NEXT_PUBLIC_STATS_RATING ?? "4.9/5"} average rating</span>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}
