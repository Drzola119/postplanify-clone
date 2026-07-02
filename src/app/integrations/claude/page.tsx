import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, TrendingUp, Eye, Heart } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Claude Integration — Schedule Social Posts with Claude (MCP)",
  description:
    "Connect PostPlanify to Claude via MCP. Create, schedule, and analyze social media posts in plain English from Claude Desktop or Claude Code.",
  alternates: { canonical: "/integrations/claude" },
};

const POSTPLANIFY_LOGO = "/images/postplanify/https___postplanify.com__next_image_url__2Flogo.png_w_64_q_75";

const OTHER_INTEGRATIONS = [
  {
    name: "Canva",
    category: "Design",
    categoryBg: "bg-violet-100",
    categoryText: "text-violet-700",
    href: "/integrations/canva",
    logo: "/images/integrations/canva-logo.svg",
    isImg: false,
  },
  {
    name: "Google Drive",
    category: "Media & Storage",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/integrations/google-drive",
    logo: "/images/integrations/google-drive-logo.svg",
    isImg: false,
  },
  {
    name: "Unsplash",
    category: "Stock Photos",
    categoryBg: "bg-emerald-100",
    categoryText: "text-emerald-700",
    href: "/integrations/unsplash",
    logo: "/images/integrations/unsplash-logo.svg",
    isImg: false,
  },
  {
    name: "Dropbox",
    category: "Media & Storage",
    categoryBg: "bg-blue-100",
    categoryText: "text-blue-700",
    href: "/integrations/dropbox",
    logo: "/images/integrations/dropbox-logo.svg",
    isImg: false,
  },
  {
    name: "ChatGPT",
    category: "AI assistants",
    categoryBg: "bg-fuchsia-100",
    categoryText: "text-fuchsia-700",
    href: "/integrations/chatgpt",
    logo: "/images/integrations/chatgpt-logo.svg",
    isImg: true,
  },
];

const GETTING_STARTED_STEPS = [
  "Generate an API key in your PostPlanify API Keys dashboard.",
  "Open your Claude config (Claude Desktop, or ~/.claude/settings.json for Claude Code).",
  "Add the PostPlanify MCP server with your API key.",
  "Restart Claude — the PostPlanify tools load automatically.",
  "Ask Claude to draft, schedule, or analyze your posts.",
];

const CAPABILITIES = [
  {
    title: "Create & schedule posts",
    description: "Draft captions and schedule posts to any connected account at any time.",
  },
  {
    title: "Manage your media",
    description: "Upload images and videos from a URL and attach them to posts.",
  },
  {
    title: "Pull analytics",
    description: "Get account analytics, growth trends, and a brand overview across all platforms.",
  },
  {
    title: "Generate PDF reports",
    description: "Pull your analytics and have Claude build a shareable, white-label PDF report — straight from the chat.",
  },
  {
    title: "Reply to comments",
    description: "List and reply to comments on Instagram, Facebook, LinkedIn, and Google Business.",
  },
  {
    title: "Manage accounts & workspaces",
    description: "List workspaces, social accounts, and Pinterest boards.",
  },
];

export default function ClaudeIntegrationPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero — blue band with breadcrumb + logo + title + CTA */}
        <section className="bg-blue-800">
          <Container className="py-8 sm:py-10">
            <nav className="mb-6 text-sm text-blue-200">
              <Link href="/integrations" className="hover:text-white transition-colors">
                Integrations
              </Link>
              <span className="mx-2">›</span>
              <span className="text-white">Claude</span>
            </nav>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-7">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white shadow-sm">
                  <Image
                    src="/images/integrations/claude-logo.svg"
                    alt="Claude"
                    width={64}
                    height={64}
                    className="h-16 w-16"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Claude</h1>
                  <p className="mt-2 text-lg text-blue-100">
                    Create and schedule social posts with Claude, in plain English.
                  </p>
                  <span className="mt-3 inline-block rounded-full bg-fuchsia-100 px-3 py-1 text-sm font-medium text-fuchsia-700">
                    AI assistants
                  </span>
                </div>
              </div>

              <Link
                href="/signup"
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              >
                Try it for free →
              </Link>
            </div>
          </Container>
        </section>

        {/* Main content — sidebar + article */}
        <section className="container mx-auto max-w-[1280px] bg-white px-4 pt-12 pb-8 sm:px-6 sm:pt-16">
          <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
            <aside className="space-y-5 text-sm">
              <div>
                <p className="text-gray-400">Built by</p>
                <p className="font-semibold text-gray-900">PostPlanify</p>
              </div>
              <div>
                <p className="text-gray-400">Status</p>
                <p className="font-semibold text-gray-900">Active</p>
              </div>
              <div>
                <p className="text-gray-400">Type</p>
                <p className="font-semibold text-gray-900">First-party</p>
              </div>
              <div>
                <p className="text-gray-400">Website</p>
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  claude.ai
                </a>
              </div>
            </aside>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Claude integration for PostPlanify
              </h2>
              <p className="mt-4 leading-relaxed text-gray-600">
                Connect PostPlanify to Claude through MCP and run your social media in plain English. Ask Claude to draft captions, schedule posts, pull analytics, or reply to comments — and it acts on your PostPlanify account. Works with Claude Desktop and Claude Code.
              </p>

              <h3 className="mt-8 text-lg font-semibold text-gray-900">
                Getting started
              </h3>
              <p className="mt-2 leading-relaxed text-gray-600">
                You&apos;ll need a PostPlanify subscription and an API key from your dashboard.
              </p>

              <ol className="mt-4 space-y-2.5 text-base leading-6 text-gray-600">
                {GETTING_STARTED_STEPS.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-semibold text-gray-400">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <p className="mt-4 text-sm">
                <Link href="/mcp/docs" className="font-medium text-blue-600 hover:text-blue-700">
                  See the full setup guide →
                </Link>
              </p>

              <h3 className="mt-10 text-lg font-semibold text-gray-900">
                What you can do
              </h3>
              <ul className="mt-4 space-y-3.5">
                {CAPABILITIES.map((cap) => (
                  <li key={cap.title}>
                    <p className="text-sm font-semibold text-gray-900">{cap.title}</p>
                    <p className="text-sm leading-relaxed text-gray-600">{cap.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Blue CTA card */}
        <div className="container mx-auto max-w-5xl px-4 pb-12 sm:px-6">
          <div className="not-prose relative my-4 overflow-hidden rounded-2xl bg-blue-800 shadow-sm">
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
                  Schedule from Claude in minutes
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-blue-50/90">
                  Connect your accounts and publish across 10 platforms from one place — no
                  downloads, no copy-paste.
                </p>
                <div className="mt-6 flex flex-col gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 text-base font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50 sm:w-auto sm:self-start"
                  >
                    Get started free
                    <ArrowRight className="size-4" />
                  </Link>
                  <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <div className="flex items-center">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="size-5 fill-yellow-300 text-yellow-300" />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-blue-50/80">
                      Trusted by 2 150+ businesses
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

                {/* Floating badge — top-right: Engagement +18% */}
                <div className="pointer-events-none absolute -right-3 -top-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg sm:-right-4 sm:px-3.5 sm:py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <TrendingUp className="size-4" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[10px] font-medium text-gray-500">Engagement</p>
                    <p className="text-sm font-bold text-gray-900">+18%</p>
                  </div>
                </div>

                {/* Floating badge — bottom-right: Views 52.8k */}
                <div className="pointer-events-none absolute -right-3 bottom-6 flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 shadow-lg sm:-right-4 sm:px-3.5 sm:py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Eye className="size-4" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[10px] font-medium text-gray-500">Views</p>
                    <p className="text-sm font-bold text-gray-900">52.8k</p>
                  </div>
                  <div className="ml-1 flex items-end gap-0.5">
                    {[6, 9, 7, 12, 10, 14].map((h, i) => (
                      <span key={i} className="w-1 rounded-full bg-blue-400" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>

                {/* Floating badge — left-center: +1.2k likes */}
                <div className="pointer-events-none absolute -left-3 top-1/2 flex -translate-y-1/2 items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 shadow-lg sm:-left-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                    <Heart className="size-4" />
                  </span>
                  <span className="text-base font-bold text-gray-900">+1.2k likes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other integrations */}
        <section className="border-t border-gray-100 bg-white">
          <Container className="px-4 py-12 sm:px-6">
            <h2 className="text-lg font-semibold leading-7 text-gray-900">Other integrations</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {OTHER_INTEGRATIONS.map((integration) => (
                <Link
                  key={integration.name}
                  href={integration.href}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white">
                    {integration.isImg ? (
                      <Image
                        src={integration.logo}
                        alt={integration.name}
                        width={24}
                        height={24}
                        className="h-6 w-6"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={integration.logo} alt={integration.name} className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {integration.name}
                    </p>
                    <span
                      className={`mt-1 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${integration.categoryBg} ${integration.categoryText}`}
                    >
                      {integration.category}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
