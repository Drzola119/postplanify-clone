import { useTranslations } from "next-intl";
import { InfographicWizard } from "@/components/dashboard/infographic-wizard";
import { INSTANT_STYLES } from "@/lib/image-gen/prompt-styles";

export default function InstantInfographicsPage() {
  const t = useTranslations("dashboard");
  return (
    <InfographicWizard
      tool="instant"
      title={t("infographics.landing.instant_title")}
      subtitle={t("infographics.landing.instant_summary")}
      styles={INSTANT_STYLES.map((s) => ({ id: s.id, title: s.title, summary: s.summary }))}
      defaultStyleId={INSTANT_STYLES[0]?.id ?? "roadmap"}
    />
  );
}
