"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Edit,
  Copy,
  Calendar,
  ArrowRight,
  Star,
  TrendingUp,
  Eye,
  Heart,
  ChevronDown,
} from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { TEMPLATES } from "@/data/templates";

const FILTERS = [
  "All types",
  "Engagement",
  "Questions",
  "UGC & proof",
  "How-to",
  "Lists",
  "Educational",
  "Promotions",
  "Announcements",
  "Hiring",
  "Storytelling",
  "Behind the scenes",
  "Inspirational",
];

const FAQ_ITEMS = [
  {
    q: "What are social media post templates?",
    a: "Social media post templates are ready-made, fill-in-the-blank post formats you can copy, customize with your own details, and publish. They cover common post types — engagement questions, promotions, how-tos, announcements, and more — so you never start from a blank page.",
  },
  {
    q: "Are these templates free?",
    a: "Yes. Every template here is completely free. No account or signup is needed to browse, copy, and use them — whether or not you use PostPlanify to schedule.",
  },
  {
    q: "How do I use a post template?",
    a: "Find a template that fits your goal, click Copy, then paste it into your post and replace the [BRACKETED PLACEHOLDERS] with your own brand details. Tweak the wording to match your voice, then publish or schedule.",
  },
  {
    q: "Which platforms do these templates work for?",
    a: "All of them. The templates work for Instagram, TikTok, X (Twitter), LinkedIn, Facebook, Threads, Pinterest, and YouTube. Each template lists the platforms it fits best, and you can filter by platform.",
  },
  {
    q: "Can these templates help with post ideas?",
    a: "Yes. Beyond ready-to-use copy, the library doubles as a source of social media post ideas. Browse by category — engagement, storytelling, promotions, educational, and more — to spark your next post.",
  },
  {
    q: "Can I schedule posts made from these templates?",
    a: "Yes. Copy a template, then schedule it across all your platforms with PostPlanify so it publishes automatically at the right time. One template, every channel, no manual posting.",
  },
];

export default function TemplatesPage() {
  const [activeFilter, setActiveFilter] = useState("All types");
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchFilter = activeFilter === "All types" || t.category === activeFilter;
      const q = search.toLowerCase().trim();
      const matchSearch = !q || t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [activeFilter, search]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
          {/* Decorative platform icons (md+) */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden select-none md:block">
            {/* Left side */}
            <span className="absolute left-[4%] top-[14%] -rotate-[14deg] text-pink-500 opacity-80">
              <InstagramIcon />
            </span>
            <span className="absolute left-[13%] top-[30%] rotate-[10deg] text-blue-600 opacity-70">
              <LinkedInIcon />
            </span>
            <span className="absolute left-[7%] top-[50%] rotate-[8deg] text-blue-500 opacity-80">
              <FacebookIcon />
            </span>
            <span className="absolute left-[3%] top-[70%] rotate-[16deg] text-black opacity-75">
              <TikTokIcon />
            </span>
            <span className="absolute left-[16%] top-[68%] -rotate-[8deg] text-red-500 opacity-70">
              <YouTubeIcon />
            </span>
            {/* Right side */}
            <span className="absolute right-[5%] top-[16%] rotate-[14deg] text-black opacity-80">
              <XIcon />
            </span>
            <span className="absolute right-[15%] top-[28%] rotate-[6deg] text-sky-500 opacity-75">
              <TwitterIcon />
            </span>
            <span className="absolute right-[8%] top-[46%] -rotate-[12deg] text-red-500 opacity-80">
              <PinterestIcon />
            </span>
            <span className="absolute right-[4%] top-[68%] rotate-[10deg] text-black opacity-75">
              <TikTokIcon />
            </span>
            <span className="absolute right-[16%] top-[64%] -rotate-[14deg] opacity-80">
              <BlueskyIcon />
            </span>
          </div>

          <div className="container relative z-10 mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 sm:py-14">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <Edit className="size-7" />
            </div>
            <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Free Social Media Post Templates
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
              85+ copy-and-paste templates for every platform and post type. Fill in the blanks, customize to your brand, and schedule across every channel.
            </p>
            <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Edit className="size-5 text-blue-600" />
                Pick a template
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Copy className="size-5 text-blue-600" />
                Copy & customize
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="size-5 text-blue-600" />
                Schedule it
              </div>
            </div>
          </div>
        </section>

        {/* Templates grid */}
        <section className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Browse free social media post templates
                </h2>
                <p className="mt-1.5 text-sm text-gray-600">
                  Filter by post type, then open any template to copy and customize it.
                </p>
              </div>
              <div className="relative w-full shrink-0 sm:w-72">
                <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates…"
                  className="w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {FILTERS.map((f) => {
                const active = activeFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={
                      "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors " +
                      (active
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300")
                    }
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-400">
              {filtered.length === TEMPLATES.length ? "85 templates" : `${filtered.length} template${filtered.length === 1 ? "" : "s"}`}
            </p>

            {/* Cards grid */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t, idx) => (
                <button
                  key={`${t.title}-${idx}`}
                  type="button"
                  className="flex w-full items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-sm"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${t.emojiBg} ${t.emojiColor}`}
                  >
                    {t.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold leading-tight text-gray-900">
                      {t.title}
                    </h3>
                    <div className="mt-0.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.pillBg} ${t.pillColor}`}
                      >
                        {t.category}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-gray-600">
                      {t.body}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-gray-400">
                      <span className="font-medium text-gray-500">Why it works:</span> {t.why}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="not-prose relative my-8 overflow-hidden rounded-2xl bg-blue-800 shadow-sm">
            <div className="flex flex-col gap-10 p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-8 lg:p-10">
              <div className="flex-1 lg:max-w-[44%]">
                <div className="mb-4 flex items-center gap-2">
                  <Image
                    src="/images/templates/logo.png"
                    alt="PostPlanify logo"
                    width={22}
                    height={22}
                    className="rounded-full bg-white"
                  />
                  <span className="text-sm font-semibold text-white">PostPlanify</span>
                </div>
                <h3 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                  Turn a template into a scheduled post
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-blue-50/90">
                  Copy any template, customize it, and schedule it across 10 platforms from one calendar. PostPlanify publishes it automatically — right on time.
                </p>
                <div className="mt-6 flex flex-col gap-4">
                  <a
                    href="/signup?show_first_signup_message=true"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 text-base font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:w-auto sm:self-start"
                  >
                    Get started free
                    <ArrowRight className="size-4" />
                  </a>
                  <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="size-5 fill-yellow-300 text-yellow-300" />
                      ))}
                    </div>
                    <span className="text-xs text-blue-50/90">
                      Trusted by 2,150+ agencies and teams
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative flex-1 lg:-my-2">
                <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/20">
                  <Image
                    src="/images/templates/postplanify-dashboard.png"
                    alt="PostPlanify dashboard"
                    width={1200}
                    height={685}
                    className="h-auto w-full"
                  />
                </div>
                <div className="pointer-events-none absolute -right-3 -top-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg sm:-right-4 sm:px-3.5 sm:py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <TrendingUp className="size-5" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[10px] font-medium text-gray-500">Engagement</p>
                    <p className="text-sm font-bold text-gray-900">+18%</p>
                  </div>
                </div>
                <div className="pointer-events-none absolute -right-3 bottom-6 flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 shadow-lg sm:-right-4 sm:px-3.5 sm:py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Eye className="size-5" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[10px] font-medium text-gray-500">Views</p>
                    <p className="text-sm font-bold text-gray-900">52.8k</p>
                  </div>
                </div>
                <div className="pointer-events-none absolute -left-3 top-1/2 flex -translate-y-1/2 items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 shadow-lg sm:-left-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Heart className="size-5" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-gray-900">+1.2k likes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold md:text-4xl">FAQ</h2>
            </div>
            <div className="w-full space-y-4">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.q} className="border rounded-lg px-4">
                    <h3 className="flex">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        className="flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all text-left hover:no-underline"
                      >
                        <span className="text-base font-medium">{item.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </h3>
                    {isOpen && (
                      <div className="overflow-hidden text-sm">
                        <div className="pb-4 pt-0 text-muted-foreground">{item.a}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg className="h-10 w-10" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
      <path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="h-8 w-8" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
      <path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-10 w-10" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
      <path fill="currentColor" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" width="40" height="40" className="h-10 w-10">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg className="h-8 w-8" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
      <path fill="currentColor" d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-10 w-10" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
      <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="h-8 w-8" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg className="h-10 w-10" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
      <path fill="currentColor" d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.86.4 1.55 1.26 1.55 1.49 0 2.64-1.61 2.64-3.92 0-2.04-1.49-3.45-3.61-3.45-2.47 0-3.91 1.84-3.91 3.74 0 .74.28 1.55.63 1.96.06.08.06.17.06.29-.06.23-.17.86-.23.97-.06.17-.17.23-.4.11-1.49-.69-2.41-2.87-2.41-4.6 0-3.74 2.7-7.14 7.79-7.14 4.08 0 7.27 2.92 7.27 6.81 0 4.08-2.58 7.36-6.13 7.36-1.21 0-2.35-.63-2.7-1.32l-.74 2.81c-.28.97-1 2.18-1.49 2.96" />
    </svg>
  );
}

function BlueskyIcon() {
  return (
    <svg className="h-8 w-8" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
      <path fill="currentColor" d="M5.202 4.066c-.967.643-1.4 1.685-1.4 2.916 0 1.34.518 2.39 1.616 3.196.836.6 1.916.898 2.916.898.4 0 .798-.046 1.193-.137-.246.49-.557.93-.93 1.318-.745.77-1.728 1.293-2.795 1.293-.74 0-1.428-.21-2.058-.587v2.236c.69.318 1.46.516 2.275.516 1.575 0 3.058-.715 4.144-1.857 1.085-1.142 1.713-2.7 1.713-4.337 0-1.31-.518-2.36-1.616-3.165-.836-.6-1.916-.898-2.916-.898-.4 0-.798.046-1.193.137.246-.49.557-.93.93-1.318.745-.77 1.728-1.293 2.795-1.293.74 0 1.428.21 2.058.587V2.65c-.69-.318-1.46-.516-2.275-.516-1.575 0-3.058.715-4.144 1.857-.36.379-.685.79-.965 1.227.31-.426.674-.815 1.092-1.152zM12 11.13c-.45 0-.885-.06-1.305-.165-.42.105-.855.165-1.305.165-2.485 0-4.5-2.015-4.5-4.5S6.905 2.13 9.39 2.13c.45 0 .885.06 1.305.165.42-.105.855-.165 1.305-.165 2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5z" />
    </svg>
  );
}
