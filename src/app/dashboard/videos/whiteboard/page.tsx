/**
 * /dashboard/videos/whiteboard
 * Whiteboard Explainer Video wizard page.
 */
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { WhiteboardWizard } from "@/components/dashboard/whiteboard-wizard";

export const metadata: Metadata = {
  title: "Whiteboard Explainer — Video Studio",
  description:
    "Turn a topic into a hand-drawn-style whiteboard explainer video with native AI narration.",
};

export default async function WhiteboardVideoPage() {
  const t = await getTranslations("videos");

  return (
    <WhiteboardWizard
      title={t("landing.whiteboard_title")}
      subtitle={t("landing.whiteboard_summary")}
    />
  );
}
