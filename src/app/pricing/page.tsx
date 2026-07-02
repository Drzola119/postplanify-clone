"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ChevronRight, Check } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { PLANS, COMPARE_CATEGORIES, COMMUNITY_ITEMS } from "@/data/pricing";

const PLAN_HEADERS = [
  { name: "Growth", price: "$129/mo", cta: "Try for free", href: "/signup?show_first_signup_message=true" },
  { name: "Premium", price: "$249/mo", cta: "Try for free", href: "/signup?show_first_signup_message=true" },
  { name: "Scale", price: "$399/mo", cta: "Try for free", href: "/signup?show_first_signup_message=true" },
  { name: "Enterprise", price: "Custom", cta: "Book a demo", href: "https://cal.com/hasancagli/postplanify-demo-call" },
];

const PROFILE_AVATARS = [
  "/images/pricing/testimonials/frank-benton.jpeg",
  "/images/pricing/testimonials/sam-cranq.avif",
  "/images/pricing/testimonials/aleksandr-heinlaid.avif",
  "/images/pricing/testimonials/shaheer.jpg",
  "/images/pricing/testimonials/monta.jpg",
  "/images/pricing/testimonials/oguz-doruk.jpg",
  "/images/pricing/testimonials/hasan-cagli-postplanify.webp",
];

const PLATFORM_ICONS: { name: string; color: string; svg: React.ReactNode }[] = [
  {
    name: "TikTok",
    color: "text-black dark:text-white",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    color: "text-pink-500",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    color: "text-blue-500",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z" />
      </svg>
    ),
  },
  {
    name: "X",
    color: "text-black dark:text-white",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    color: "text-red-500",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    color: "text-blue-600",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    name: "Threads",
    color: "text-black dark:text-white",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12.18 2c5.69 0 9.82 4.27 9.82 9.95 0 5.91-4.18 10.05-10.02 10.05-2.79 0-5.18-1.05-6.99-2.83l1.4-1.45c1.43 1.43 3.4 2.27 5.59 2.27 4.83 0 8.03-3.4 8.03-8.04 0-4.5-3.39-7.95-8.03-7.95-3.55 0-6.13 1.99-7.27 4.42l1.55 1.05c.95-2.06 2.94-3.48 5.72-3.48zm-.06 4.34c2.91 0 5.05 2.16 5.05 5.36 0 3.2-2.16 5.36-5.05 5.36-1.69 0-3.06-.76-3.85-2.06l1.43-.99c.55.93 1.43 1.46 2.42 1.46 1.84 0 3.05-1.46 3.05-3.77 0-2.32-1.21-3.78-3.05-3.78-1.16 0-2.13.65-2.55 1.78l-1.5-.81c.69-1.62 2.18-2.55 4.05-2.55z" />
      </svg>
    ),
  },
  {
    name: "Pinterest",
    color: "text-red-500",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.86.4 1.55 1.26 1.55 1.49 0 2.64-1.61 2.64-3.92 0-2.04-1.49-3.45-3.61-3.45-2.47 0-3.91 1.84-3.91 3.74 0 .74.28 1.55.63 1.96.06.08.06.17.06.29-.06.23-.17.86-.23.97-.06.17-.17.23-.4.11-1.49-.69-2.41-2.87-2.41-4.6 0-3.74 2.7-7.14 7.79-7.14 4.08 0 7.27 2.92 7.27 6.81 0 4.08-2.58 7.36-6.13 7.36-1.21 0-2.35-.63-2.7-1.32l-.74 2.81c-.28.97-1 2.18-1.49 2.96" />
      </svg>
    ),
  },
  {
    name: "Bluesky",
    color: "text-[#0085ff]",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M5.202 4.066c-.967.643-1.4 1.685-1.4 2.916 0 1.34.518 2.39 1.616 3.196.836.6 1.916.898 2.916.898.4 0 .798-.046 1.193-.137-.246.49-.557.93-.93 1.318-.745.77-1.728 1.293-2.795 1.293-.74 0-1.428-.21-2.058-.587v2.236c.69.318 1.46.516 2.275.516 1.575 0 3.058-.715 4.144-1.857 1.085-1.142 1.713-2.7 1.713-4.337 0-1.31-.518-2.36-1.616-3.165-.836-.6-1.916-.898-2.916-.898-.4 0-.798.046-1.193.137.246-.49.557-.93.93-1.318.745-.77 1.728-1.293 2.795-1.293.74 0 1.428.21 2.058.587V2.65c-.69-.318-1.46-.516-2.275-.516-1.575 0-3.058.715-4.144 1.857-.36.379-.685.79-.965 1.227.31-.426.674-.815 1.092-1.152zM12 11.13c-.45 0-.885-.06-1.305-.165-.42.105-.855.165-1.305.165-2.485 0-4.5-2.015-4.5-4.5S6.905 2.13 9.39 2.13c.45 0 .885.06 1.305.165.42-.105.855-.165 1.305-.165 2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5z" />
      </svg>
    ),
  },
  {
    name: "YouTube-alt",
    color: "text-black dark:text-white",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
      </svg>
    ),
  },
];

const CTA_FEATURES = [
  { name: "Content Calendar", Icon: Check },
  { name: "Full Analytics", Icon: Check },
  { name: "Social Inbox", Icon: Check },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="min-h-screen bg-white">
        {/* Hero + Plan cards */}
        <section id="pricing" className="py-12 overflow-x-hidden scroll-mt-10">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="space-y-10">
              {/* Heading */}
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">Choose Your Plan</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Start with a 7-day free trial. Cancel anytime.
                </p>
                <div className="pt-2">
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
                    <div className="flex-shrink-0">
                      <div className="flex flex-col md:flex-row items-center justify-center lg:justify-start gap-4 mt-2 max-w-none">
                        <div className="flex -space-x-3">
                          {PROFILE_AVATARS.map((src, i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-muted shadow-sm">
                              <Image src={src} alt="User profile" width={36} height={36} className="object-cover w-full h-full" />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="size-5 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="ml-2 text-sm font-medium text-foreground">Trusted by 2150+ businesses</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 flex items-center justify-center">
                    <div className="inline-flex items-center rounded-full border bg-card p-1">
                      <button
                        type="button"
                        onClick={() => setBilling("monthly")}
                        className={
                          "px-6 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors " +
                          (billing === "monthly" ? "bg-black text-white" : "text-muted-foreground hover:text-foreground")
                        }
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBilling("yearly")}
                        className={
                          "px-6 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors " +
                          (billing === "yearly" ? "bg-black text-white" : "text-muted-foreground hover:text-foreground")
                        }
                      >
                        Yearly (save 20%)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan cards */}
              <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4">
                {PLANS.map((plan) => (
                  <PlanCard key={plan.name} plan={plan} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Compare plans table */}
        <section className="py-12">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">Compare Plans</h3>
            <div className="hidden sm:block border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="sticky top-16 z-10">
                  <tr className="border-b bg-gray-50">
                    <th className="text-left text-base font-medium text-muted-foreground py-4 px-5 w-[28%] bg-gray-50">Feature</th>
                    {PLAN_HEADERS.map((h) => (
                      <th key={h.name} className="text-center py-4 px-5 w-[18%] bg-gray-50">
                        <div className="text-base font-semibold">{h.name}</div>
                        <div className="text-sm text-muted-foreground font-normal">{h.price}</div>
                        <a
                          href={h.href}
                          target={h.href.startsWith("http") ? "_blank" : undefined}
                          rel={h.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          {h.cta}
                        </a>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Supported Platforms row with platform icons */}
                  <tr className="border-t">
                    <td className="text-base py-3 px-5 text-foreground/80">Supported Platforms</td>
                    <td colSpan={4} className="py-3 px-5">
                      <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-2">
                        {PLATFORM_ICONS.map((p) => (
                          <div key={p.name} className={"transition-all duration-200 hover:opacity-80 " + p.color}>
                            {p.svg}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* Category rows */}
                  {COMPARE_CATEGORIES.map((cat) => (
                    <CategoryRows key={cat.name} cat={cat} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile-only compare cards */}
            <div className="sm:hidden space-y-6">
              {/* Supported platforms card */}
              <div className="border rounded-xl overflow-hidden border-blue-100">
                <div className="px-4 py-3 border-b bg-blue-50 border-blue-100">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-blue-700">Supported Platforms</h4>
                </div>
                <div className="border-t px-4 py-3">
                  <div className="flex flex-wrap justify-center items-center gap-4">
                    {PLATFORM_ICONS.map((p) => (
                      <div key={p.name} className={"transition-all duration-200 " + p.color}>
                        {p.svg}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {COMPARE_CATEGORIES.map((cat) => (
                <MobileCategoryCard key={cat.name} cat={cat} />
              ))}
            </div>
          </div>
        </section>

        {/* More from the community */}
        <section className="py-4 md:py-12 bg-muted/5">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-8 px-4 sm:px-6">More from the community.</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMMUNITY_ITEMS.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3"
                >
                  <div className={"flex items-center justify-center w-12 h-12 rounded-full " + (item.platform === "producthunt" ? "bg-orange-100 text-orange-600" : item.platform === "twitter" ? "bg-sky-100 text-sky-600" : "bg-blue-100 text-blue-600")}>
                    {item.platform === "producthunt" && (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M13.337 1c-1.572 0-2.85 1.278-2.85 2.85v6.302H8.488V1H1v22h7.488v-7.484h2.847c.034 1.213.105 2.394.213 3.5.117 1.214.351 2.288.7 3.224.464 1.252 1.16 2.183 2.092 2.797.93.612 2.092.92 3.483.92 1.225 0 2.314-.221 3.265-.66.953-.443 1.732-1.078 2.34-1.91.605-.832 1.054-1.832 1.346-3 .292-1.166.439-2.479.439-3.937v-.852c0-1.46-.147-2.773-.44-3.94-.291-1.166-.74-2.166-1.345-3-.609-.832-1.388-1.467-2.34-1.907-.95-.443-2.04-.664-3.265-.664h-.07V1h-3.337zm5.038 11.04c.66.13 1.183.382 1.572.752.388.372.666.86.834 1.467.166.605.25 1.357.25 2.252v.852c0 .896-.084 1.65-.25 2.256-.168.604-.446 1.092-.834 1.463-.39.373-.913.62-1.572.748-.66.13-1.474.196-2.443.196-.766 0-1.413-.072-1.94-.218-.527-.144-.96-.378-1.296-.7-.337-.32-.585-.738-.747-1.252-.16-.515-.275-1.144-.343-1.886-.07-.74-.105-1.616-.105-2.625v-.852c0-1.01.034-1.886.105-2.629.068-.74.184-1.367.343-1.882.162-.515.41-.93.747-1.252.337-.323.769-.557 1.296-.7.527-.143 1.174-.215 1.94-.215.97 0 1.783.067 2.443.195z" />
                      </svg>
                    )}
                    {item.platform === "twitter" && (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    )}
                    {item.platform === "web" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.text}</p>
                  <span className="text-xs text-muted-foreground">View source →</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA card */}
        <section>
          <div className="rounded-xl bg-card text-card-foreground shadow my-6 p-6 border-black border-4 max-w-2xl mx-4 sm:mx-auto">
            <div className="text-center space-y-5">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <Image src="/images/pricing/logo.png" alt="PostPlanify logo" width={24} height={24} className="rounded-full" />
                  <span className="text-md font-semibold">PostPlanify</span>
                </div>
                <p className="text-xl font-semibold">Manage All Your Clients From One Dashboard</p>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  Schedule, collaborate, and report across all platforms. Your whole team, one price.
                </p>
              </div>
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-2 my-4 mx-4">
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-2">
                  {PLATFORM_ICONS.map((p) => (
                    <div key={"cta-" + p.name} className={"transition-all duration-200 hover:opacity-80 " + p.color}>
                      {p.svg}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-start gap-1">
                  {CTA_FEATURES.map((f) => (
                    <div key={f.name} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-green-600" />
                      <span className="text-foreground">{f.name}</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-1">Trusted by 2150+ businesses</p>
                </div>
              </div>
              <a
                href="/signup?show_first_signup_message=true"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Start 7-day Free Trial
                <ChevronRight className="size-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function PlanCard({ plan }: { plan: typeof PLANS[number] }) {
  return (
    <div
      className={
        "relative w-full rounded-2xl border p-4 flex flex-col md:p-5 " +
        (plan.isPopular
          ? "border-2 border-green-600 bg-green-50/30 shadow-lg"
          : "border-border bg-card")
      }
    >
      {plan.isPopular && (
        <span className="absolute -top-3 right-6 px-3 py-1 bg-green-700 text-white text-[11px] font-semibold uppercase tracking-wider rounded-full shadow-md whitespace-nowrap">
          Most Popular
        </span>
      )}
      <div className="flex flex-col flex-grow">
        <div className="space-y-2 flex-grow">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{plan.tagline}</p>
          </div>
          <div className="space-y-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[1.9rem] font-bold">{plan.price}</span>
              {plan.priceSuffix && <span className="text-muted-foreground">{plan.priceSuffix}</span>}
            </div>
            <div className="flex items-center justify-between -mt-1">
              {plan.savingsBadge ? (
                <span className="px-2 py-0.5 rounded-full bg-green-600/10 text-green-700 text-xs font-medium">{plan.savingsBadge}</span>
              ) : (
                <span />
              )}
              {plan.billedYearly && <span className="text-xs text-muted-foreground">{plan.billedYearly}</span>}
            </div>
          </div>
          <div>
            <a
              href={plan.ctaHref}
              target={plan.ctaHref.startsWith("http") ? "_blank" : undefined}
              rel={plan.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
              className="block"
            >
              <button
                type="button"
                className={
                  "w-full inline-flex items-center justify-center gap-2 rounded-md px-8 py-6 text-base font-medium shadow-lg transition-colors " +
                  (plan.ctaClass || "bg-primary text-primary-foreground hover:bg-primary/90")
                }
              >
                {plan.ctaText}
                <span className="ml-2 w-6 h-6 rounded-full flex items-center justify-center bg-white/20">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            </a>
          </div>
          {plan.everythingIn && (
            <p className="text-md font-semibold text-foreground pt-2">Everything in {plan.everythingIn}, plus:</p>
          )}
          <div className="space-y-1 pt-1">
            {plan.features.map((f, j) => (
              <div key={j} className="flex items-center space-x-3">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500/10 text-green-600 flex-shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between flex-1 min-w-0 gap-2">
                  <p className="text-sm text-foreground">
                    {f.value !== undefined && f.value !== "" && f.value !== null && <span>{f.value}</span>}
                    {f.value !== undefined && f.value !== "" && f.value !== null && " "}
                    {f.label}
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md text-xs h-6 w-6 p-0 hover:bg-muted/50 text-muted-foreground/40"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m1 15h-2v-6h2zm0-8h-2V7h2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryRows({ cat }: { cat: typeof COMPARE_CATEGORIES[number] }) {
  return (
    <>
      <tr>
        <td colSpan={5} className={"text-sm font-bold uppercase tracking-wider py-3.5 px-5 " + cat.bgClass}>
          {cat.name}
        </td>
      </tr>
      {cat.rows.map((row, i) => (
        <tr key={i} className="border-t">
          <td className="text-base py-3 px-5 text-foreground/80">{row.label}</td>
          {row.values.map((v, j) => (
            <td key={j} className="text-center py-3 px-5">
              {v ? v : <Check className="inline-block w-4 h-4 text-green-600" />}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function MobileCategoryCard({ cat }: { cat: typeof COMPARE_CATEGORIES[number] }) {
  // Color variants per category (e.g., blue-100 border + blue-700 text)
  const colorMap: Record<string, { border: string; bg: string; text: string }> = {
    "Platform & Limits": { border: "border-blue-100", bg: "bg-blue-50", text: "text-blue-700" },
    "Scheduling": { border: "border-violet-100", bg: "bg-violet-50", text: "text-violet-700" },
    "Content": { border: "border-teal-100", bg: "bg-teal-50", text: "text-teal-700" },
    "AI": { border: "border-amber-100", bg: "bg-amber-50", text: "text-amber-700" },
    "Analytics & Reporting": { border: "border-emerald-100", bg: "bg-emerald-50", text: "text-emerald-700" },
    "Collaboration": { border: "border-rose-100", bg: "bg-rose-50", text: "text-rose-700" },
    "Inbox": { border: "border-cyan-100", bg: "bg-cyan-50", text: "text-cyan-700" },
    "Integrations": { border: "border-orange-100", bg: "bg-orange-50", text: "text-orange-700" },
    "Support & Extras": { border: "border-pink-100", bg: "bg-pink-50", text: "text-pink-700" },
  };
  const colors = colorMap[cat.name] || { border: "border-gray-100", bg: "bg-gray-50", text: "text-gray-700" };
  const PLAN_NAMES = ["Growth", "Premium", "Scale", "Enterprise"];
  return (
    <div className={"border rounded-xl overflow-hidden " + colors.border}>
      <div className={"px-4 py-3 border-b " + colors.bg + " " + colors.border}>
        <h4 className={"text-sm font-bold uppercase tracking-wider " + colors.text}>{cat.name}</h4>
      </div>
      {cat.rows.map((row, i) => (
        <div key={i} className="border-t px-4 py-3 space-y-2">
          <p className="text-base font-medium">{row.label}</p>
          <div className="grid grid-cols-4 gap-2">
            {row.values.map((v, j) => (
              <div key={j} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{PLAN_NAMES[j]}</p>
                {v ? (
                  <span className="text-base font-medium">{v}</span>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}