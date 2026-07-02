// /tools — index page matching postplanify.com/tools
// 11 categories × ~80 tools in card grid (production parity)

import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  User,
  AtSign,
  Tag,
  Calculator,
  CheckCircle,
  Crop,
  AlignLeft,
  Type,
  Hash,
  Languages,
} from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import {
  CATEGORIES,
  getToolsByKinds,
  PLATFORM_BRAND,
  type Platform,
} from "@/data/tools";
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

export const metadata: Metadata = {
  title: "Free Social Media Tools | PostPlanify",
  description:
    "Discover our collection of free social media tools to help you grow your online presence. Calculate engagement rates, analyze performance, and optimize your social media strategy.",
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  User,
  AtSign,
  Tag,
  Calculator,
  CheckCircle,
  Crop,
  AlignLeft,
  Type,
  Hash,
  Languages,
};

const PLATFORM_ICONS: Partial<Record<Platform, React.ComponentType<{ className?: string }>>> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  twitter: XIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
  pinterest: PinterestIcon,
  threads: ThreadsIcon,
  bluesky: BlueskyIcon,
  "google-business": GoogleBusinessIcon,
};

function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const Icon = PLATFORM_ICONS[platform];
  if (!Icon) return <Calculator className={className ?? "h-4 w-4"} />;
  return <Icon className={className ?? "h-4 w-4"} />;
}

const CTA_PLATFORMS: Platform[] = ["tiktok", "instagram", "facebook", "twitter", "youtube", "linkedin", "threads", "pinterest", "bluesky", "google-business"];

export default function ToolsIndexPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-[85rem] mx-auto">
        <div className="container mx-auto px-4 py-12">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl mb-6">
              Free Social Media Tools
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Boost your social media performance with our collection of free tools. Calculate
              engagement rates, analyze content performance, and optimize your strategy without
              spending a dime.
            </p>
          </div>

          {/* 11 category sections */}
          <div className="space-y-16">
            {CATEGORIES.map((cat) => {
              const tools = getToolsByKinds(cat.kinds);
              const SectionIcon = ICONS[cat.iconName] ?? Sparkles;
              return (
                <section key={cat.key} className="relative">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${cat.iconBgCls}`}>
                        <SectionIcon className={`h-5 w-5 ${cat.iconColorCls}`} />
                      </div>
                      <h2 className="text-2xl font-semibold">{cat.title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">{cat.description}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tools.map((tool) => (
                      <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                        <div className="rounded-xl border bg-card text-card-foreground shadow group hover:shadow-lg transition-all duration-200 hover:border-primary/50 hover:-translate-y-0.5 cursor-pointer h-full border-border/60">
                          <div className="flex flex-col space-y-1.5 p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-1.5 rounded-md bg-muted/80" style={{ color: PLATFORM_BRAND[tool.platform] }}>
                                <PlatformIcon platform={tool.platform} className="h-4 w-4" />
                              </div>
                              <div className="tracking-tight text-base font-medium leading-tight">
                                {tool.name}
                              </div>
                            </div>
                            <div className="text-sm leading-relaxed text-muted-foreground/80">
                              {tool.description}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-20">
            <div className="rounded-xl border bg-card text-card-foreground shadow w-full max-w-4xl mx-auto mt-16 mb-8">
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Post smarter, not harder.</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Schedule, preview, and publish across all major platforms — from one simple dashboard.
                </p>
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-2 my-4 mx-4">
                  {CTA_PLATFORMS.map((p) => (
                    <div key={p} className="w-8 h-8" style={{ color: PLATFORM_BRAND[p] }}>
                      <PlatformIcon platform={p} className="w-8 h-8" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors h-10 rounded-md px-6 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Try for Free
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors h-10 rounded-md px-6 border border-input bg-background hover:bg-accent"
                  >
                    Sign up with Google
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}