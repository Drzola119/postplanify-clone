/**
 * /dashboard/videos
 * Video Studio hub — four workflow cards.
 * Mirrors src/app/dashboard/infographics/page.tsx exactly: PageHeader,
 * pastel-accent cards with a 10%/px icon chip, no diagonal gradient tiles,
 * no emoji, no dark: variants, no shadcn theme tokens.
 */

import { getTranslations } from "next-intl/server";
import { VideoStudioHub } from "@/components/dashboard/video-studio-hub";

export default async function VideosPage() {
  const t = await getTranslations("videos");

  return (
    <VideoStudioHub title={t("landing.title")} subtitle={t("landing.subtitle")} />
  );
}
