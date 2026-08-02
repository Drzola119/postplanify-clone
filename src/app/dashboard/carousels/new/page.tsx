/**
 * /dashboard/carousels/new
 * Carousel Studio wizard page. Server component that mounts the
 * client-side wizard. The wizard seeds itself with the default style;
 * the user can change it (or build a new one) from inside the picker.
 */
import { Metadata } from "next";
import { CarouselWizard } from "@/components/dashboard/carousel-wizard";
import { DEFAULT_CAROUSEL_STYLE } from "@/lib/carousel-gen/styles";

export const metadata: Metadata = {
  title: "Carousel Studio — New carousel",
  description:
    "Generate a 5-slide scroll-stopping carousel. Edit the script, then render every slide as one cohesive deck.",
};

export default function NewCarouselPage() {
  return (
    <CarouselWizard styleId={DEFAULT_CAROUSEL_STYLE.id} />
  );
}
