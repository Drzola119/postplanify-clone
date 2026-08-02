/**
 * /dashboard/carousels/templates
 * F5 — Carousel templates library. Browse 20+ curated templates by
 * niche; "Use Template" sends the user to /dashboard/carousels/new
 * with the right query-string pre-fill so the wizard boots with the
 * topic, tone, niche, ctaKeyword, and slideCount already set.
 *
 * Server component — the templates are static data so no client work
 * is needed for the page shell. The grid component is client-side
 * because the niche filter needs an interactive state.
 */

import { PageHeader } from "@/components/dashboard/page-header";
import { CarouselTemplatesGrid } from "@/components/dashboard/carousel-templates-grid";
import { CAROUSEL_TEMPLATES } from "@/data/carousel-templates";

export const metadata = {
  title: "Carousel Studio — Templates",
  description:
    "20+ curated carousel templates across 8 niches. Click Use Template to pre-fill the wizard with a working starting point.",
};

export default function CarouselTemplatesPage() {
  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title="Carousel Templates"
        subtitle="Pick a template, click Use Template, and the wizard opens with the right topic, tone, and slide count."
      />
      <CarouselTemplatesGrid templates={CAROUSEL_TEMPLATES} />
    </div>
  );
}
