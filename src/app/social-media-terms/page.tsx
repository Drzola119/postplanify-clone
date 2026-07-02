"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Star, ChevronRight } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { TERMS_BY_LETTER, LETTERS } from "@/data/terms";

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
  { name: "TikTok", color: "text-black dark:text-white", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg> },
  { name: "Instagram", color: "text-pink-500", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" /></svg> },
  { name: "Facebook", color: "text-blue-500", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z" /></svg> },
  { name: "X", color: "text-black dark:text-white", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
  { name: "YouTube", color: "text-red-500", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" /></svg> },
  { name: "LinkedIn", color: "text-blue-600", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg> },
  { name: "Threads", color: "text-black dark:text-white", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12.18 2c5.69 0 9.82 4.27 9.82 9.95 0 5.91-4.18 10.05-10.02 10.05-2.79 0-5.18-1.05-6.99-2.83l1.4-1.45c1.43 1.43 3.4 2.27 5.59 2.27 4.83 0 8.03-3.4 8.03-8.04 0-4.5-3.39-7.95-8.03-7.95-3.55 0-6.13 1.99-7.27 4.42l1.55 1.05c.95-2.06 2.94-3.48 5.72-3.48zm-.06 4.34c2.91 0 5.05 2.16 5.05 5.36 0 3.2-2.16 5.36-5.05 5.36-1.69 0-3.06-.76-3.85-2.06l1.43-.99c.55.93 1.43 1.46 2.42 1.46 1.84 0 3.05-1.46 3.05-3.77 0-2.32-1.21-3.78-3.05-3.78-1.16 0-2.13.65-2.55 1.78l-1.5-.81c.69-1.62 2.18-2.55 4.05-2.55z" /></svg> },
  { name: "Pinterest", color: "text-red-500", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.86.4 1.55 1.26 1.55 1.49 0 2.64-1.61 2.64-3.92 0-2.04-1.49-3.45-3.61-3.45-2.47 0-3.91 1.84-3.91 3.74 0 .74.28 1.55.63 1.96.06.08.06.17.06.29-.06.23-.17.86-.23.97-.06.17-.17.23-.4.11-1.49-.69-2.41-2.87-2.41-4.6 0-3.74 2.7-7.14 7.79-7.14 4.08 0 7.27 2.92 7.27 6.81 0 4.08-2.58 7.36-6.13 7.36-1.21 0-2.35-.63-2.7-1.32l-.74 2.81c-.28.97-1 2.18-1.49 2.96" /></svg> },
  { name: "Bluesky", color: "text-[#0085ff]", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M5.202 4.066c-.967.643-1.4 1.685-1.4 2.916 0 1.34.518 2.39 1.616 3.196.836.6 1.916.898 2.916.898.4 0 .798-.046 1.193-.137-.246.49-.557.93-.93 1.318-.745.77-1.728 1.293-2.795 1.293-.74 0-1.428-.21-2.058-.587v2.236c.69.318 1.46.516 2.275.516 1.575 0 3.058-.715 4.144-1.857 1.085-1.142 1.713-2.7 1.713-4.337 0-1.31-.518-2.36-1.616-3.165-.836-.6-1.916-.898-2.916-.898-.4 0-.798.046-1.193.137.246-.49.557-.93.93-1.318.745-.77 1.728-1.293 2.795-1.293.74 0 1.428.21 2.058.587V2.65c-.69-.318-1.46-.516-2.275-.516-1.575 0-3.058.715-4.144 1.857-.36.379-.685.79-.965 1.227.31-.426.674-.815 1.092-1.152zM12 11.13c-.45 0-.885-.06-1.305-.165-.42.105-.855.165-1.305.165-2.485 0-4.5-2.015-4.5-4.5S6.905 2.13 9.39 2.13c.45 0 .885.06 1.305.165.42-.105.855-.165 1.305-.165 2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5z" /></svg> },
  { name: "YouTube-alt", color: "text-black dark:text-white", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" /></svg> },
];

type QuotePart = { text: string; highlight?: boolean };
type Testimonial = {
  name: string;
  avatar: string;
  source: "producthunt" | "twitter" | "external" | "none";
  href?: string;
  quote: QuotePart[];
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Frank Benton",
    avatar: "/images/pricing/testimonials/frank-benton.jpeg",
    source: "producthunt",
    href: "https://www.producthunt.com/products/postplanify/launches/postplanify",
    quote: [
      { text: "It is a " },
      { text: "huge time saver.", highlight: true },
      { text: " I love that I can access my Canva designs without needing to download anything." },
    ],
  },
  {
    name: "Monta",
    avatar: "/images/pricing/testimonials/monta.jpg",
    source: "none",
    quote: [
      { text: "The " },
      { text: "customer service", highlight: true },
      { text: " is absolutely awesome. I manage over 13 accounts and some of the videos reachover 500,000 views!" },
    ],
  },
  {
    name: "AprovaLeges",
    avatar: "/images/pricing/testimonials/aprovaleges.jpg",
    source: "external",
    href: "https://aprovaleges.com.br/",
    quote: [
      { text: "PostPlanify has " },
      { text: "transformed our social media management", highlight: true },
      { text: ". The interface is intuitive, and the scheduling works with precision, allowing the AprovaLeges team to focus on what truly matters: producing quality content." },
    ],
  },
  {
    name: "Shaheer",
    avatar: "/images/pricing/testimonials/shaheer.jpg",
    source: "twitter",
    href: "https://x.com/shaheerui/status/1956329991114744184",
    quote: [
      { text: "postplanify is the " },
      { text: "best ive seen so far", highlight: true },
      { text: ", has all the features i need." },
    ],
  },
  {
    name: "Aleksandr Heinlaid",
    avatar: "/images/pricing/testimonials/aleksandr-heinlaid.avif",
    source: "producthunt",
    href: "https://www.producthunt.com/products/postplanify/launches/postplanify",
    quote: [
      { text: "PostPlanify mixes AI captions, multi-platform scheduling, and Canva templates. Overall a " },
      { text: "massive time saver", highlight: true },
      { text: " for agencies." },
    ],
  },
  {
    name: "Tintin",
    avatar: "/images/pricing/testimonials/tintin.jpg",
    source: "twitter",
    href: "https://x.com/HsanC_/status/1954873218004561950",
    quote: [
      { text: "We're loving PostPlanify. I've been using scheduling tools for years and it's " },
      { text: "by far the best one", highlight: true },
      { text: "." },
    ],
  },
  {
    name: "Andreas",
    avatar: "/images/pricing/testimonials/reddit-man-avatar.jpg",
    source: "none",
    quote: [
      { text: "Really " },
      { text: "helped me manage my time better", highlight: true },
      { text: " and keep all my posts organized in one place." },
    ],
  },
  {
    name: "Sam",
    avatar: "/images/pricing/testimonials/sam-cranq.avif",
    source: "producthunt",
    href: "https://www.producthunt.com/products/postplanify/launches/postplanify",
    quote: [
      { text: "It's looking great!! " },
      { text: "Just what I needed", highlight: true },
      { text: " to make my SM game up to the next level." },
    ],
  },
  {
    name: "PostPlanify User",
    avatar: "/images/pricing/testimonials/reddit-man-avatar.jpg",
    source: "none",
    quote: [
      { text: "I love it! I " },
      { text: "fired my social media manager", highlight: true },
      { text: " and now just use postplanify." },
    ],
  },
  {
    name: "Oguz Doruk",
    avatar: "/images/pricing/testimonials/oguz-doruk.jpg",
    source: "twitter",
    href: "https://x.com/oguzbuilds",
    quote: [
      { text: "Been on the $79 plan for 2 months. " },
      { text: "API access and MCP support", highlight: true },
      { text: " is something most alternatives don't have. Didn't think I'd pay $80/mo just to post on social media, but it " },
      { text: "saves a lot of time", highlight: true },
      { text: "." },
    ],
  },
];

function SourceIcon({ source, href }: { source: Testimonial["source"]; href?: string }) {
  if (source === "none") return null;
  const inner =
    source === "producthunt" ? (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26.245 26.256" width={24} height={24} className="w-6 h-6">
        <path d="M26.254 13.128c0 7.253-5.875 13.128-13.128 13.128S-.003 20.382-.003 13.128 5.872 0 13.125 0s13.128 5.875 13.128 13.128" fill="#da552f" />
        <path d="M14.876 13.128h-3.72V9.2h3.72c1.083 0 1.97.886 1.97 1.97s-.886 1.97-1.97 1.97m0-6.564H8.53v13.128h2.626v-3.938h3.72c2.538 0 4.595-2.057 4.595-4.595s-2.057-4.595-4.595-4.595" fill="#fff" />
      </svg>
    ) : source === "twitter" ? (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-900">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted-foreground">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    );
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
      title={source === "producthunt" ? "View on ProductHunt" : source === "twitter" ? "View on X" : "View on External"}
    >
      {inner}
    </a>
  );
}

export default function SocialMediaTermsPage() {
  const [query, setQuery] = useState("");

  const filteredByLetter = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result: Record<string, typeof TERMS_BY_LETTER[string]> = {};
    for (const letter of LETTERS) {
      const terms = TERMS_BY_LETTER[letter] || [];
      if (!q) {
        result[letter] = terms;
      } else {
        result[letter] = terms.filter(
          (t) =>
            t.term.toLowerCase().includes(q) ||
            t.desc.toLowerCase().includes(q),
        );
      }
    }
    return result;
  }, [query]);

  const hasAnyMatch = LETTERS.some(
    (l) => (filteredByLetter[l] || []).length > 0,
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Social Media Terms and Definitions
            </h1>
            <p className="text-gray-600 max-w-3xl mx-auto mb-4">
              The most comprehensive dictionary of social media terms and
              definitions with 391+ entries. Learn essential terminology for
              Instagram, TikTok, Facebook, LinkedIn, X (Twitter), YouTube,
              Pinterest, and Threads. Perfect for marketers, content creators,
              social media managers, and digital marketing professionals.
            </p>
            <p className="text-gray-500 max-w-3xl mx-auto mb-8 text-sm">
              From algorithm updates and engagement metrics to Gen Z slang and
              platform-specific features — this A-Z glossary covers every social
              media term you need to know in 2026. Whether you&apos;re scheduling
              posts, analyzing campaign performance, or building your
              brand&apos;s online presence, use this reference guide to stay
              ahead.
            </p>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search social media terms..."
              className="w-full max-w-2xl px-6 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Alphabet nav */}
          <div className="flex flex-wrap justify-center gap-4 mb-12 pb-8 border-b">
            {LETTERS.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => {
                  const el = document.getElementById(`letter-${letter}`);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="w-10 h-10 flex items-center justify-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Letter sections */}
          {!hasAnyMatch ? (
            <div className="text-center py-16 text-gray-500">
              No terms match &ldquo;{query}&rdquo;. Try a different search.
            </div>
          ) : (
            LETTERS.map((letter) => {
              const terms = filteredByLetter[letter] || [];
              if (terms.length === 0) return null;
              return (
                <div key={letter} id={`letter-${letter}`} className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    {letter}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {terms.map((t, i) => (
                      <div
                        key={`${letter}-${i}`}
                        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {t.term}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {t.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* More from the community (testimonials + CTA bar) */}
        <section className="py-4 md:py-12 bg-muted/5">
          <div className="w-full space-y-12">
            <div className="text-center mb-8 px-4 sm:px-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                More from the community.
              </h2>
            </div>
            <div className="columns-1 sm:columns-2 lg:columns-5 gap-4 px-4 sm:px-6 max-w-7xl mx-auto">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="break-inside-avoid mb-4">
                  <div className="flex flex-col gap-2 bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <Image
                            src={t.avatar}
                            alt={t.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {t.name}
                          </span>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className="size-4 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <SourceIcon source={t.source} href={t.href} />
                    </div>
                    <p className="text-md leading-relaxed text-gray-700">
                      {t.quote.map((p, j) =>
                        p.highlight ? (
                          <span
                            key={j}
                            className="bg-yellow-100 px-1 rounded font-medium text-primary"
                          >
                            {p.text}
                          </span>
                        ) : (
                          <span key={j}>{p.text}</span>
                        ),
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* CTA bar */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href="/signup?show_first_signup_message=true"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 text-base px-8 py-6 rounded-full shadow-lg shadow-primary/20"
              >
                Try for Free
                <span className="ml-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </a>
              <a
                href="/signup?show_first_signup_message=true&provider=google"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 text-base px-8 py-6 rounded-full"
              >
                <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA card */}
        <section>
          <div className="rounded-xl bg-card text-card-foreground shadow p-6 my-12 border-black border-4 max-w-2xl mx-4 sm:mx-auto">
            <div className="text-center space-y-5">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <Image src="/images/pricing/logo.png" alt="PostPlanify logo" width={24} height={24} className="rounded-full" />
                  <span className="text-md font-semibold">PostPlanify</span>
                </div>
                <p className="text-xl font-semibold">Manage All Your Social Accounts Without the Chaos</p>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  Schedule posts, track performance, and collaborate with your team.
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
              </div>
              <div className="flex flex-col gap-3 justify-center items-center">
                <a
                  href="/signup?show_first_signup_message=true"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 rounded-lg shadow-lg min-w-[240px] text-base font-semibold"
                >
                  Start 7-day Free Trial
                  <ChevronRight className="size-4" />
                </a>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-green-600">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <path d="M22 4 12 14.01l-3-3" />
                    </svg>
                    <span>Content Calendar</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-green-600">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <path d="M22 4 12 14.01l-3-3" />
                    </svg>
                    <span>Full Analytics</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-green-600">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <path d="M22 4 12 14.01l-3-3" />
                    </svg>
                    <span>Social Inbox</span>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-2 max-w-none">
                  <div className="flex -space-x-3">
                    {PROFILE_AVATARS.map((src, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-muted shadow-sm">
                        <Image src={src} alt="User profile" width={36} height={36} className="object-cover w-full h-full" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="size-5 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground font-medium mt-0.5">Trusted by 2150+ businesses</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}