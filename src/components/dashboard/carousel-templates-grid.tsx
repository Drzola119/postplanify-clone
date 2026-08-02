"use client";

/**
 * Carousel templates grid — interactive niche filter + cards.
 *
 * F5 — Pairs with /dashboard/carousels/templates. Each card links to
 * the new-carousel wizard with a prefill query string. Niche filter is
 * a small client state so the rest of the page can stay a server
 * component.
 */

import { useMemo, useState } from "react";
import { Layers, ArrowRight } from "lucide-react";
import {
  CAROUSEL_TEMPLATES,
  TEMPLATE_NICHES,
  type CarouselTemplate,
  type TemplateNiche,
} from "@/data/carousel-templates";

interface Props {
  templates: ReadonlyArray<CarouselTemplate>;
}

export function CarouselTemplatesGrid({ templates }: Props) {
  const [niche, setNiche] = useState<TemplateNiche | "all">("all");

  const filtered = useMemo(
    () => (niche === "all" ? templates : templates.filter((t) => t.niche === niche)),
    [niche, templates]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterChip
          active={niche === "all"}
          label={`All (${templates.length})`}
          onClick={() => setNiche("all")}
        />
        {TEMPLATE_NICHES.map((n) => {
          const count = templates.filter((t) => t.niche === n.id).length;
          return (
            <FilterChip
              key={n.id}
              active={niche === n.id}
              label={`${n.label} (${count})`}
              onClick={() => setNiche(n.id)}
            />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">No templates in this niche yet.</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-full px-3 h-7 text-xs font-medium border transition-colors " +
        (active
          ? "bg-zinc-900 text-white border-zinc-900"
          : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300")
      }
    >
      {label}
    </button>
  );
}

function TemplateCard({ template }: { template: CarouselTemplate }) {
  const params = new URLSearchParams({
    topic: template.topic,
    niche: template.topicNiche,
    tone: template.tone,
    ctaKeyword: template.ctaKeyword,
    slideCount: String(template.slideCount),
  });
  return (
    <a
      href={`/dashboard/carousels/new?${params.toString()}`}
      className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="inline-flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700 shrink-0">
          <Layers className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {labelForNiche(template.niche)} · {template.slideCount} slides
          </p>
          <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-zinc-900">
            {template.name}
          </h3>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-600 leading-relaxed line-clamp-3">
        {template.description}
      </p>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
        <span className="rounded-md bg-zinc-50 border border-zinc-200 px-1.5 py-0.5">
          {template.tone}
        </span>
        <span className="rounded-md bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 font-mono">
          {template.ctaKeyword}
        </span>
      </div>
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 group-hover:gap-2 transition-all">
        Use Template
        <ArrowRight className="size-3.5" />
      </div>
    </a>
  );
}

function labelForNiche(n: TemplateNiche): string {
  return TEMPLATE_NICHES.find((x) => x.id === n)?.label ?? n;
}

// Re-export the static list for tests / consumers that want the data
// without importing the data file twice.
export { CAROUSEL_TEMPLATES };
