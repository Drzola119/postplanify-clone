/**
 * /dashboard/videos/cartoon
 * Cartoon-Style Video wizard page — M1 launch workflow.
 */
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CartoonVideoWizard } from "@/components/dashboard/cartoon-video-wizard";

export const metadata: Metadata = {
  title: "Cartoon-Style Video — Video Studio",
  description: "Turn a topic or image into an animated cartoon video.",
};

export default async function CartoonVideoPage() {
  const t = await getTranslations("videos");

  return (
    <div className="p-6 max-w-6xl">
      <CartoonVideoWizard
        title={t("cartoon.title")}
        subtitle={t("cartoon.subtitle")}
      />
    </div>
  );
}
