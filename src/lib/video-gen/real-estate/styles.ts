/**
 * video-gen/real-estate/styles.ts
 * Style presets for Real Estate Video Studio — data, not prompts-per-request.
 *
 * Each preset is a `descriptors` string that gets spliced into the fixed
 * 10-shot prompt skeleton by shot-plan.ts. Adding a new style means
 * adding one entry here, not regenerating any LLM code.
 */

export interface PropertyStylePreset {
  id: string;
  label: string;
  blurb: string;
  /**
   * Style descriptors spliced into each shot's prompt. Includes materials,
   * palette, architectural language — everything that varies per style.
   */
  descriptors: string;
}

export const PROPERTY_STYLES: readonly PropertyStylePreset[] = [
  {
    id: "modern-american-luxury",
    label: "Modern American Luxury",
    blurb: "Bright Florida daylight, clean lines, walnut + glass.",
    descriptors:
      "white stucco, warm walnut accents, black-framed glass, polished concrete, tropical landscaping, bright Florida daylight",
  },
  {
    id: "cozy-farmhouse",
    label: "Cozy Farmhouse",
    blurb: "Warm wood, shaker details, muted earth palette.",
    descriptors:
      "weathered shiplap walls, exposed wood beams, shaker cabinetry in cream, oil-rubbed bronze hardware, oak flooring, soft golden-hour window light",
  },
  {
    id: "urban-industrial-loft",
    label: "Urban Industrial Loft",
    blurb: "Concrete, brick, steel — moody and architectural.",
    descriptors:
      "polished concrete floors, exposed brick walls, black steel window frames, Edison-bulb pendants, charcoal cabinetry, moody directional lighting",
  },
  {
    id: "mediterranean-villa",
    label: "Mediterranean Villa",
    blurb: "Stucco arches, terracotta, blue accents.",
    descriptors:
      "ivory stucco, terracotta roof tiles, arched openings, hand-painted ceramic tile accents, blue-and-white textiles, sun-drenched Mediterranean afternoon light",
  },
];

const STYLE_BY_ID = new Map<string, PropertyStylePreset>(
  PROPERTY_STYLES.map((s) => [s.id, s])
);

export function getPropertyStyle(id: string): PropertyStylePreset | undefined {
  return STYLE_BY_ID.get(id);
}
