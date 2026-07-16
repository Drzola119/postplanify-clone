"use client";

import Link from "next/link";
import {
  Sparkles,
  Wand2,
  Globe,
  ArrowRight,
  Image as ImageIcon,
  KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

const TOOLS = [
  {
    title: "Instant Infographics",
    href: "/dashboard/infographics/instant",
    icon: Wand2,
    accent: "from-sky-500/10 to-sky-500/0",
    iconCls: "bg-sky-50 text-sky-700",
    summary:
      "Type a topic and pick a layout. We render a finished, on-brand social infographic in one pass.",
    bullets: [
      "8 original layouts — pathway, trade-off, timeline, iceberg, and more",
      "Hook-first composition: bold headline, strong middle, save/share footer",
      "Three colour schemes — light, dark, brand",
    ],
  },
  {
    title: "Instant Infographic Ads",
    href: "/dashboard/infographics/ads",
    icon: Globe,
    accent: "from-amber-500/10 to-amber-500/0",
    iconCls: "bg-amber-50 text-amber-700",
    summary:
      "Paste a landing-page URL and we pull the offer copy for you, then render a scroll-stopping ad.",
    bullets: [
      "Server-side URL fetch — no extra browser extension required",
      "Offer-snapshot, value-stack, transformation-path, and more layouts",
      "Footer CTA + offer title carry straight through to the image",
    ],
  },
];

export default function InfographicsLandingPage() {
  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="AI Infographic Generator"
        subtitle="Render on-brand social infographics and offer ads in one pass — choose a tool to get started."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-sm"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.accent}`}
                aria-hidden
              />
              <div className="relative">
                <div className={`inline-flex size-10 items-center justify-center rounded-xl ${t.iconCls}`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{t.title}</h3>
                <p className="mt-1.5 text-sm text-zinc-600">{t.summary}</p>
                <ul className="mt-4 space-y-1.5">
                  {t.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-zinc-600">
                      <span className="mt-1.5 inline-block size-1 rounded-full bg-zinc-400" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
                  Open wizard
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Hint
          icon={ImageIcon}
          title="Saved to Media Library"
          body="Every render is uploaded to Bunny CDN and indexed under your workspace with the right tags."
        />
        <Hint
          icon={Sparkles}
          title="Multi-provider fallback"
          body="Gemini Flash Lite Image (default) → GPT Image 2 → Ideogram 4 → Gemini Flash Image. Walks the chain on retryable failure."
        />
        <Hint
          icon={KeyRound}
          title="BYOK supported"
          body="Drop your own OpenRouter, OpenAI, or Ideogram keys under Settings → API Keys to bill generations to your own account."
        />
      </div>
    </div>
  );
}

function Hint({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-zinc-500" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-1.5 text-xs text-zinc-600">{body}</p>
    </div>
  );
}
