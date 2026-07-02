import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Mail, TrendingUp, Eye, Heart, Star, ArrowRight } from "lucide-react";
import {
  InstagramIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
  FacebookIcon,
  LinkedInIcon,
  PinterestIcon,
  ThreadsIcon,
  BlueskyIcon,
  GoogleBusinessIcon,
} from "@/data/platform-icons";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { NewsletterForm } from "./NewsletterForm";

export const metadata: Metadata = {
  title: "Integrations — Connect Your Tools to PostPlanify",
  description:
    "Connect Canva, Google Drive, Unsplash, Dropbox, Claude, ChatGPT, and more to PostPlanify. Bring your media in and schedule everywhere from one place.",
  alternates: { canonical: "/integrations" },
};

const POSTPLANIFY_LOGO =
  "/images/postplanify/https___postplanify.com__next_image_url__2Flogo.png_w_64_q_75";

type Integration = {
  name: string;
  description: string;
  category: string;
  categoryBg: string;
  categoryText: string;
  href: string;
  logo: ReactNode;
  logoBg?: string;
};

const INTEGRATIONS: Integration[] = [
  {
    name: "Canva",
    description: "Import your Canva designs straight into your posts.",
    category: "Design",
    categoryBg: "bg-violet-100",
    categoryText: "text-violet-700",
    href: "/integrations/canva",
    logo: (
      <img src="/images/integrations/canva-logo.svg" alt="Canva" className="h-8 w-8" />
    ),
  },
  {
    name: "ChatGPT",
    description: "Manage and schedule your social media from ChatGPT.",
    category: "AI assistants",
    categoryBg: "bg-fuchsia-100",
    categoryText: "text-fuchsia-700",
    href: "/integrations/chatgpt",
    logo: (
      <Image
        src="/images/integrations/chatgpt-logo.svg"
        alt="ChatGPT"
        width={32}
        height={32}
        className="h-8 w-8"
      />
    ),
  },
  {
    name: "Unsplash",
    description: "Add free Unsplash stock photos to your posts.",
    category: "Stock Photos",
    categoryBg: "bg-emerald-100",
    categoryText: "text-emerald-700",
    href: "/integrations/unsplash",
    logo: (
      <img src="/images/integrations/unsplash-logo.svg" alt="Unsplash" className="h-8 w-8" />
    ),
  },
  {
    name: "Claude",
    description: "Create and schedule social posts with Claude, in plain English.",
    category: "AI assistants",
    categoryBg: "bg-fuchsia-100",
    categoryText: "text-fuchsia-700",
    href: "/integrations/claude",
    logo: (
      <Image
        src="/images/integrations/claude-logo.svg"
        alt="Claude"
        width={32}
        height={32}
        className="h-8 w-8"
      />
    ),
  },
  {
    name: "Google Drive",
    description: "Pull images and files from Google Drive into your posts.",
    category: "Media & Storage",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/integrations/google-drive",
    logo: (
      <img
        src="/images/integrations/google-drive-logo.svg"
        alt="Google Drive"
        className="h-8 w-8"
      />
    ),
  },
  {
    name: "Dropbox",
    description: "Import images and videos from Dropbox into your posts.",
    category: "Media & Storage",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/integrations/dropbox",
    logo: (
      <img src="/images/integrations/dropbox-logo.svg" alt="Dropbox" className="h-8 w-8" />
    ),
  },
  {
    name: "Pinterest",
    description: "Schedule pins to your Pinterest boards from PostPlanify.",
    category: "Social networks",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/pinterest-scheduler",
    logo: <PinterestIcon className="h-8 w-8 text-[#E60023]" />,
  },
  {
    name: "LinkedIn",
    description: "Schedule posts to your LinkedIn profile and company pages.",
    category: "Social networks",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/linkedin-scheduler",
    logo: <LinkedInIcon className="h-8 w-8 text-[#0A66C2]" />,
  },
  {
    name: "X (Twitter)",
    description: "Post and schedule tweets and threads to X.",
    category: "Social networks",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/x-scheduler",
    logo: <XIcon className="h-8 w-8 text-black" />,
  },
  {
    name: "Facebook",
    description: "Publish to your Facebook Pages and groups on a schedule.",
    category: "Social networks",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/facebook-scheduler",
    logo: <FacebookIcon className="h-8 w-8 text-[#1877F2]" />,
  },
  {
    name: "YouTube",
    description: "Schedule YouTube videos and Shorts to your channel.",
    category: "Social networks",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/youtube-scheduler",
    logo: <YouTubeIcon className="h-8 w-8 text-[#FF0000]" />,
  },
  {
    name: "Instagram",
    description: "Schedule feed posts, Reels, and Stories to Instagram.",
    category: "Social networks",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/instagram-scheduler",
    logo: <InstagramIcon className="h-8 w-8 text-[#E1306C]" />,
  },
  {
    name: "Threads",
    description: "Schedule posts to your Threads account.",
    category: "Social networks",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/threads-scheduler",
    logo: <ThreadsIcon className="h-8 w-8 text-black" />,
  },
  {
    name: "TikTok",
    description: "Schedule TikTok videos to your profile.",
    category: "Social networks",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/tiktok-scheduler",
    logo: <TikTokIcon className="h-8 w-8 text-black" />,
  },
  {
    name: "Bluesky",
    description: "Schedule posts to your Bluesky account.",
    category: "Social networks",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/bluesky-scheduler",
    logo: <BlueskyIcon className="h-8 w-8 text-[#1185FE]" />,
  },
  {
    name: "Google My Business",
    description: "Publish updates, events, and offers to your Google Business Profile.",
    category: "Social networks",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/google-business-scheduler",
    logo: <GoogleBusinessIcon className="h-8 w-8 text-[#4285F4]" />,
  },
];

const CATEGORIES = [
  { name: "Design", count: 1 },
  { name: "Media & Storage", count: 2 },
  { name: "Stock Photos", count: 1 },
  { name: "AI assistants", count: 2 },
  { name: "Social networks", count: 10 },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left column */}
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Integrations
                </p>
                <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
                  Connect PostPlanify to the tools you already use
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
                  Bring your design tools, cloud storage, and stock photos into your PostPlanify
                  workflow. Less tab-switching, more creating.
                </p>
                <Link
                  href="#directory"
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Browse integrations
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              {/* Right column — dashboard with floating card */}
              <div className="relative">
                <div className="absolute -inset-3 rounded-3xl bg-blue-100/70" aria-hidden />
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5">
                  <Image
                    src="/images/integrations/postplanify-dashboard.png"
                    alt="PostPlanify dashboard"
                    width={1200}
                    height={750}
                    priority
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className="h-auto w-full"
                  />
                </div>

                {/* Floating Canva card */}
                <div className="absolute z-10 flex w-56 items-start gap-2.5 rounded-xl bg-white p-3 shadow-lg ring-1 ring-black/5 -top-5 -left-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white">
                    <Image
                      src="/images/integrations/canva-logo.svg"
                      alt="Canva"
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Canva</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-500">
                      Import your Canva designs straight into your posts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Directory */}
        <section id="directory" className="container mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Sidebar */}
            <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
              <p className="text-sm font-semibold text-gray-900">Categories</p>
              <div className="mt-3 space-y-2.5">
                {CATEGORIES.map((c) => (
                  <label
                    key={c.name}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                      defaultChecked
                    />
                    <span className="flex-1">{c.name}</span>
                    <span className="text-xs text-gray-400">{c.count}</span>
                  </label>
                ))}
              </div>

              {/* Newsletter card */}
              <div className="mt-6 relative overflow-hidden rounded-xl bg-[linear-gradient(150deg,#1d4ed8_0%,#1a47c4_55%,#172e9e_100%)] p-4 text-white shadow-lg">
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-300/20 blur-2xl"
                  aria-hidden
                />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Mail className="h-4 w-4 text-blue-700" />
                    </div>
                    <p className="text-sm font-bold leading-tight">Your Weekly Social Edge!</p>
                  </div>
                  <p className="mt-1.5 text-xs text-blue-50">
                    Join our newsletter for weekly social media tips, trends, and growth tactics.
                  </p>
                  <NewsletterForm />
                </div>
              </div>
            </aside>

            {/* Right content */}
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">All integrations</h2>
                  <p className="mt-1 text-sm text-gray-500">16 integrations</p>
                </div>
                <div className="relative sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="search"
                    placeholder="Search integrations…"
                    className="w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {INTEGRATIONS.map((integration) => (
                  <Link
                    key={integration.name}
                    href={integration.href}
                    className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white">
                      {integration.logo}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-gray-900">{integration.name}</p>
                      <p className="mt-1 text-sm text-gray-500">{integration.description}</p>
                      <span
                        className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${integration.categoryBg} ${integration.categoryText}`}
                      >
                        {integration.category}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="container mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="not-prose relative my-8 overflow-hidden rounded-2xl bg-blue-800 shadow-sm">
            <div className="flex flex-col gap-10 p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-8 lg:p-10">
              <div className="flex-1 lg:max-w-[44%]">
                <div className="mb-4 flex items-center gap-2">
                  <Image
                    src={POSTPLANIFY_LOGO}
                    alt="PostPlanify logo"
                    width={22}
                    height={22}
                    className="rounded-full bg-white"
                  />
                  <span className="text-sm font-semibold text-white">PostPlanify</span>
                </div>
                <h3 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                  All your tools, one place to publish
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-blue-50/90">
                  Connect your apps and accounts, then schedule across 10 platforms from a single
                  calendar.
                </p>
                <div className="mt-6 flex flex-col gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 text-base font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:w-auto sm:self-start"
                  >
                    Get started free
                    <ArrowRight className="size-4" />
                  </Link>
                  <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <div className="flex items-center">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-blue-50/80">
                      Trusted by 2,150+ businesses
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative flex-1 lg:-my-2">
                <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/20">
                  <Image
                    src="/images/integrations/postplanify-dashboard.png"
                    alt="PostPlanify dashboard"
                    width={1200}
                    height={685}
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className="h-auto w-full"
                  />
                </div>

                {/* Floating card — top-right: Engagement +18% */}
                <div className="pointer-events-none absolute -right-3 -top-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg sm:-right-4 sm:px-3.5 sm:py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[10px] font-medium text-gray-500">Engagement</p>
                    <p className="text-sm font-bold text-gray-900">+18%</p>
                  </div>
                </div>

                {/* Floating card — bottom-right: Views 52.8k */}
                <div className="pointer-events-none absolute -right-3 bottom-6 flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 shadow-lg sm:-right-4 sm:px-3.5 sm:py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Eye className="h-5 w-5" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[10px] font-medium text-gray-500">Views</p>
                    <p className="text-sm font-bold text-gray-900">52.8k</p>
                  </div>
                  <div className="ml-1 flex items-end gap-0.5">
                    {[6, 9, 7, 12, 10, 14].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-blue-400"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Floating card — left-center: +1.2k likes */}
                <div className="pointer-events-none absolute -left-3 top-1/2 flex -translate-y-1/2 items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 shadow-lg sm:-left-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                    <Heart className="h-5 w-5" />
                  </span>
                  <span className="text-base font-bold text-gray-900">+1.2k likes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
