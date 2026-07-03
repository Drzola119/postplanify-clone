import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  BarChart3,
  Inbox,
  Users,
  Sparkles,
  FileBarChart,
  Image as ImageIcon,
  Link2,
  Bot,
  Workflow,
  Code2,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Features | PostPlanify",
  description:
    "Explore every PostPlanify feature: AI assistant, content calendar, social inbox, analytics, team collaboration, white-label reports, link-in-bio, and more — all in one platform.",
};

type FeatureLink = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  image?: string;
  tileBg: string;
  ringColor: string;
};

const FEATURES: FeatureLink[] = [
  {
    href: "/features/content-calendar",
    title: "Content Calendar",
    description: "Plan, edit, and reschedule across all your platforms from one drag-and-drop calendar.",
    icon: Calendar,
    image: "/images/postplanify/postplanify-dashboard.png",
    tileBg: "bg-blue-950",
    ringColor: "ring-blue-800/40",
  },
  {
    href: "/features/analytics",
    title: "Advanced Analytics",
    description: "Track performance, engagement, and growth across all 10 platforms. Historical trends included.",
    icon: BarChart3,
    image: "/images/postplanify/features__analytics.webp",
    tileBg: "bg-violet-950",
    ringColor: "ring-violet-800/40",
  },
  {
    href: "/features/social-inbox",
    title: "Social Inbox",
    description: "All your comments + DMs in one place. Reply, label, assign, and let AI help you respond faster.",
    icon: Inbox,
    image: "/images/postplanify/features__social-inbox.png",
    tileBg: "bg-fuchsia-950",
    ringColor: "ring-fuchsia-800/40",
  },
  {
    href: "/features/team-collaboration",
    title: "Team Collaboration",
    description: "Invite teammates and clients into one workspace with shared calendar, approvals, and flat pricing.",
    icon: Users,
    tileBg: "bg-emerald-950",
    ringColor: "ring-emerald-800/40",
  },
  {
    href: "/features/ai-assistant",
    title: "AI Assistant",
    description: "Generate captions, create images, and improve your content with the built-in AI assistant.",
    icon: Sparkles,
    image: "/images/postplanify/features__ai-features.webp",
    tileBg: "bg-amber-950",
    ringColor: "ring-amber-800/40",
  },
  {
    href: "/features/reporting",
    title: "White-label Reports",
    description: "Every report carries your brand. Trend charts from all 10 platforms baked in. Share or download.",
    icon: FileBarChart,
    tileBg: "bg-rose-950",
    ringColor: "ring-rose-800/40",
  },
  {
    href: "/features/media-library",
    title: "Media Library",
    description: "Upload once, reuse everywhere. Smart tagging, fast search, and Bunny-powered CDN delivery.",
    icon: ImageIcon,
    tileBg: "bg-cyan-950",
    ringColor: "ring-cyan-800/40",
  },
  {
    href: "/features/link-in-bio",
    title: "Link in Bio",
    description: "A polished, branded landing page for every platform — drag, drop, publish.",
    icon: Link2,
    tileBg: "bg-indigo-950",
    ringColor: "ring-indigo-800/40",
  },
  {
    href: "/features/automation",
    title: "Automation",
    description: "Auto-publish, auto-respond, recycle evergreen posts. Set it once, let it run.",
    icon: Workflow,
    tileBg: "bg-teal-950",
    ringColor: "ring-teal-800/40",
  },
  {
    href: "/features/ai",
    title: "AI Captions & Images",
    description: "Generate platform-perfect captions and on-brand images in seconds.",
    icon: Bot,
    tileBg: "bg-orange-950",
    ringColor: "ring-orange-800/40",
  },
  {
    href: "/features/api",
    title: "Developer API",
    description: "Build on top of PostPlanify. REST endpoints for posts, accounts, analytics, and webhooks.",
    icon: Code2,
    tileBg: "bg-slate-950",
    ringColor: "ring-slate-800/40",
  },
];

export default function FeaturesIndexPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-24">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <p className="inline-flex items-center rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-700 backdrop-blur">
              All the tools. One platform.
            </p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
              Every feature you need to
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                {" "}
                grow on social.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
              From a unified content calendar to AI-powered captions, white-label
              reports to team workflows — explore every PostPlanify feature below.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold"
              >
                Start free
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center h-11 px-6 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 text-sm font-semibold"
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className={`group relative overflow-hidden rounded-xl border border-zinc-200 ${f.tileBg} p-6 ring-1 ${f.ringColor} transition-all hover:-translate-y-0.5 hover:shadow-xl`}
              >
                <div className="relative z-10 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                    <f.icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-white/70">{f.description}</p>
                  </div>
                </div>
                <ArrowRight className="absolute right-5 top-5 size-4 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                {f.image && (
                  <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
                    <Image
                      src={f.image}
                      alt={f.title}
                      width={600}
                      height={360}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-16 text-center">
          <div className="rounded-2xl bg-zinc-950 px-8 py-16 text-white">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to put it all together?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Try PostPlanify free for 14 days. No credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center justify-center h-11 px-6 rounded-md bg-white hover:bg-zinc-100 text-zinc-950 text-sm font-semibold"
            >
              Get started
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}