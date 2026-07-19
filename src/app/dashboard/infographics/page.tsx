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
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/dashboard/page-header";

export default function InfographicsLandingPage() {
  const t = useTranslations("dashboard");
  const TOOLS = [
    {
      title: t("infographics.landing.instant_title"),
      href: "/dashboard/infographics/instant",
      icon: Wand2,
      accent: "from-sky-500/10 to-sky-500/0",
      iconCls: "bg-sky-50 text-sky-700",
      summary: t("infographics.landing.instant_summary"),
      bullets: [
        t("infographics.landing.instant_bullet1"),
        t("infographics.landing.instant_bullet2"),
        t("infographics.landing.instant_bullet3"),
      ],
    },
    {
      title: t("infographics.landing.ads_title"),
      href: "/dashboard/infographics/ads",
      icon: Globe,
      accent: "from-amber-500/10 to-amber-500/0",
      iconCls: "bg-amber-50 text-amber-700",
      summary: t("infographics.landing.ads_summary"),
      bullets: [
        t("infographics.landing.ads_bullet1"),
        t("infographics.landing.ads_bullet2"),
        t("infographics.landing.ads_bullet3"),
      ],
    },
  ];
  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title={t("infographics.landing.page_title")}
        subtitle={t("infographics.landing.page_subtitle")}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-sm"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tool.accent}`}
                aria-hidden
              />
              <div className="relative">
                <div className={`inline-flex size-10 items-center justify-center rounded-xl ${tool.iconCls}`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{tool.title}</h3>
                <p className="mt-1.5 text-sm text-zinc-600">{tool.summary}</p>
                <ul className="mt-4 space-y-1.5">
                  {tool.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-zinc-600">
                      <span className="mt-1.5 inline-block size-1 rounded-full bg-zinc-400" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
                  {t("infographics.landing.instant_cta")}
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
          title={t("infographics.landing.hint_media_title")}
          body={t("infographics.landing.hint_media_desc")}
        />
        <Hint
          icon={Sparkles}
          title={t("infographics.landing.hint_provider_title")}
          body={t("infographics.landing.hint_provider_desc")}
        />
        <Hint
          icon={KeyRound}
          title={t("infographics.landing.hint_byok_title")}
          body={t("infographics.landing.hint_byok_desc")}
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
