/**
 * /dashboard/carousels/analytics
 * F9 — Carousel Studio analytics. Server component that loads the
 * aggregated analytics + the carousel list in parallel, then mounts
 * the client-side view component. Kept as its own page (rather than a
 * tab inside the main /dashboard/analytics) so the rest of the
 * analytics page isn't disturbed.
 */
import { PageHeader } from "@/components/dashboard/page-header";
import { CarouselAnalyticsView } from "@/components/dashboard/carousel-analytics-view";

export const metadata = {
  title: "Carousel Studio — Analytics",
  description:
    "Track your carousel output: total decks, monthly volume, style mix, and cost.",
};

export default function CarouselAnalyticsPage() {
  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title="Carousel Analytics"
        subtitle="Track the decks you've generated — total volume, monthly trend, style mix, and spend."
      />
      <CarouselAnalyticsView />
    </div>
  );
}
