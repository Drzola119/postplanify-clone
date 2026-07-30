/**
 * /dashboard/videos
 * Video Studio hub — four workflow cards.
 * Mirrors src/app/dashboard/infographics/page.tsx exactly: PageHeader,
 * pastel-accent cards with a 10%/px icon chip, no diagonal gradient tiles,
 * no emoji, no dark: variants, no shadcn theme tokens.
 */

import { Sparkles, Zap, Home, PenTool, ArrowRight, ImageIcon, KeyRound, Wand2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import Link from "next/link";

export default async function VideosPage() {
  const t = await getTranslations("videos");

  const TOOLS = [
    {
      id: "cartoon",
      title: t("landing.cartoon_title"),
      href: "/dashboard/videos/cartoon",
      icon: Sparkles,
      accent: "from-sky-500/10 to-sky-500/0",
      iconCls: "bg-sky-50 text-sky-700",
      summary: t("landing.cartoon_summary"),
      available: true,
    },
    {
      id: "viral",
      title: t("landing.viral_title"),
      href: "/dashboard/videos/viral",
      icon: Zap,
      accent: "from-rose-500/10 to-rose-500/0",
      iconCls: "bg-rose-50 text-rose-700",
      summary: t("landing.viral_summary"),
      available: false,
    },
    {
      id: "real-estate",
      title: t("landing.real-estate_title"),
      href: "/dashboard/videos/real-estate",
      icon: Home,
      accent: "from-emerald-500/10 to-emerald-500/0",
      iconCls: "bg-emerald-50 text-emerald-700",
      summary: t("landing.real-estate_summary"),
      available: false,
    },
    {
      id: "whiteboard",
      title: t("landing.whiteboard_title"),
      href: "/dashboard/videos/whiteboard",
      icon: PenTool,
      accent: "from-amber-500/10 to-amber-500/0",
      iconCls: "bg-amber-50 text-amber-700",
      summary: t("landing.whiteboard_summary"),
      available: true,
    },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title={t("landing.title")}
        subtitle={t("landing.subtitle")}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const inner = (
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-sm">
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tool.accent}`}
                aria-hidden
              />
              <div className="relative">
                <div className={`inline-flex size-10 items-center justify-center rounded-xl ${tool.iconCls}`}>
                  <Icon className="size-5" />
                </div>
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold tracking-tight">{tool.title}</h3>
                  {!tool.available ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Coming soon
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm text-zinc-600">{tool.summary}</p>
                {tool.available ? (
                  <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
                    Try it
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                ) : (
                  <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400">
                    Notify me when ready
                  </div>
                )}
              </div>
            </div>
          );
          if (!tool.available) {
            return (
              <div key={tool.id} className="opacity-60 pointer-events-none" aria-disabled>
                {inner}
              </div>
            );
          }
          return (
            <Link key={tool.id} href={tool.href}>
              {inner}
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Hint
          icon={ImageIcon}
          title="Your videos land in Assets"
          body="Every render is saved to your media library so you can re-post, download, or schedule re-shares."
        />
        <Hint
          icon={Wand2}
          title="Pick Auto and we choose the best model"
          body="Auto mode runs the fallback chain — the fastest path that respects quality for the chosen style."
        />
        <Hint
          icon={KeyRound}
          title="Costs come out of your plan credits"
          body="Render costs are visible at the bottom of the right-hand preview panel before you confirm."
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
