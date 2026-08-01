/**
 * /dashboard/videos/real-estate
 * Real Estate Video Studio wizard page.
 */
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RealEstateWizard } from "@/components/dashboard/real-estate-wizard";

export const metadata: Metadata = {
  title: "Real Estate Walkthrough — Video Studio",
  description:
    "Turn a property description or your own listing photos into a continuous AI-generated walkthrough video.",
};

export default async function RealEstateVideoPage() {
  const t = await getTranslations("videos");

  return (
    <RealEstateWizard
      title={t("landing.realestate_title")}
      subtitle={t("landing.realestate_summary")}
    />
  );
}
