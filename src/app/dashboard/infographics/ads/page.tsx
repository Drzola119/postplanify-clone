import { InfographicWizard } from "@/components/dashboard/infographic-wizard";
import { ADS_STYLES } from "@/lib/image-gen/prompt-styles";

export default function AdsInfographicsPage() {
  return (
    <InfographicWizard
      tool="ads"
      title="Instant Infographic Ads"
      subtitle="Paste a landing-page URL and we pull the offer copy, then render a scroll-stopping ad."
      styles={ADS_STYLES.map((s) => ({ id: s.id, title: s.title, summary: s.summary }))}
      defaultStyleId={ADS_STYLES[0]?.id ?? "offer-snapshot"}
    />
  );
}
