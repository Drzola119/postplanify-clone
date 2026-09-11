/**
 * /dashboard/carousels/new
 * Carousel Studio wizard page. Server component that mounts the
 * client-side wizard. The wizard seeds itself with the default style;
 * the user can change it (or build a new one) from inside the picker.
 *
 * F5 — when launched from a template, query params pre-fill topic,
 * niche, tone, slideCount so the user starts one click closer to a
 * finished carousel.
 */
import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import { redirect } from "next/navigation";
import { CreateCarousel } from "@/components/dashboard/carousel-studio/create-carousel";
import { Metadata } from "next";
import { CarouselWizard } from "@/components/dashboard/carousel-wizard";
import { DEFAULT_CAROUSEL_STYLE } from "@/lib/carousel-gen/styles";
import { ALLOWED_SLIDE_COUNTS, type AllowedSlideCount } from "@/lib/carousel-gen/types";

export const metadata: Metadata = {
  title: "Carousel Studio — New carousel",
  description:
    "Generate a 5-slide scroll-stopping carousel. Edit the script, then render every slide as one cohesive deck.",
};

function parseSlideCount(raw: string | undefined): AllowedSlideCount {
  const n = Number.parseInt(raw ?? "5", 10);
  return (ALLOWED_SLIDE_COUNTS as readonly number[]).includes(n)
    ? (n as AllowedSlideCount)
    : 5;
}

export default async function NewCarouselPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session=await requireCarouselAccess();
  if (session instanceof Response) {
    if (session.status === 401) redirect("/login");
    return (
      <main className="mx-auto max-w-2xl p-6 md:p-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-zinc-900">Carousel access unavailable</h1>
          <p className="mt-2 text-sm text-zinc-700">You don’t have permission to create carousels in this workspace.</p>
        </div>
      </main>
    );
  }
  const params = await searchParams;
  if(params.mode!=="images") return <CreateCarousel workspaceId={session.workspaceId}/>;
  const get = (k: string): string => {
    const v = params[k];
    if (Array.isArray(v)) return v[0] ?? "";
    return v ?? "";
  };
  const prefill = {
    topic: get("topic"),
    niche: get("niche"),
    tone: get("tone"),
    ctaKeyword: get("ctaKeyword"),
    slideCount: parseSlideCount(get("slideCount")),
    styleId: get("styleId") || undefined,
  };
  return (
    <CarouselWizard
      styleId={DEFAULT_CAROUSEL_STYLE.id}
      prefill={prefill}
    />
  );
}
