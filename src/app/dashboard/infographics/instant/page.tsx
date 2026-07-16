import { InfographicWizard } from "@/components/dashboard/infographic-wizard";
import { INSTANT_STYLES } from "@/lib/image-gen/prompt-styles";

export default function InstantInfographicsPage() {
  return (
    <InfographicWizard
      tool="instant"
      title="Instant Infographics"
      subtitle="Type a topic, pick a layout, and render a finished social-media infographic in one pass."
      styles={INSTANT_STYLES.map((s) => ({ id: s.id, title: s.title, summary: s.summary }))}
      defaultStyleId={INSTANT_STYLES[0]?.id ?? "roadmap"}
    />
  );
}
