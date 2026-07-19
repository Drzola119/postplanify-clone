import { useTranslations } from "next-intl";
import { InfographicWizard } from "@/components/dashboard/infographic-wizard";
import { ADS_STYLES } from "@/lib/image-gen/prompt-styles";

export default function AdsInfographicsPage() {
  const t = useTranslations("dashboard");
  return (
    <InfographicWizard
      tool="ads"
      title={t("infographics.landing.ads_title")}
      subtitle={t("infographics.landing.ads_summary")}
      styles={ADS_STYLES.map((s) => ({ id: s.id, title: s.title, summary: s.summary }))}
      defaultStyleId={ADS_STYLES[0]?.id ?? "offer-snapshot"}
    />
  );
}
