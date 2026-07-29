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
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("cartoon.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("cartoon.subtitle")}
        </p>
      </div>
      <CartoonVideoWizard />
    </div>
  );
}
