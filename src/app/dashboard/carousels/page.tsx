/**
 * /dashboard/carousels
 * Carousel Studio landing hub — single tool card that opens the wizard.
 * Mirrors the visual treatment of /dashboard/videos and /dashboard/infographics:
 * pastel accent card with a 10% / px icon chip, no diagonal gradients, no emoji.
 */

import { Layers } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import Link from "next/link";

export default async function CarouselsPage() {
  const t = await getTranslations("dashboard.carousels.landing");

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title={t("page_title")}
        subtitle={t("page_subtitle")}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Link
          href="/dashboard/carousels/new"
          className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-sm"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/10 to-violet-500/0"
            aria-hidden
          />
          <div className="relative">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Layers className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">
              {t("tool_title")}
            </h3>
            <p className="mt-1.5 text-sm text-zinc-600">{t("tool_summary")}</p>
            <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
              {t("tool_cta")}
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Hint title={t("hint1_title")} body={t("hint1_desc")} />
        <Hint title={t("hint2_title")} body={t("hint2_desc")} />
        <Hint title={t("hint3_title")} body={t("hint3_desc")} />
      </div>
    </div>
  );
}

function Hint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-sm font-semibold text-zinc-700">{title}</p>
      <p className="mt-1.5 text-xs text-zinc-600">{body}</p>
    </div>
  );
}
