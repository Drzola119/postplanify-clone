import { z } from "zod";

export const templates = [
  "checklist",
  "process",
  "timeline",
  "comparison",
  "statistics",
  "offer",
] as const;
export type Template = (typeof templates)[number];
export const templateLabels: Record<Template, string> = {
  checklist: "Checklist",
  process: "Step-by-step process",
  timeline: "Timeline",
  comparison: "Comparison",
  statistics: "Key statistics",
  offer: "Offer overview",
};
export const formats = [
  { name: "Square", width: 1080, height: 1080 },
  { name: "Portrait", width: 1080, height: 1350 },
  { name: "Story", width: 1080, height: 1920 },
  { name: "Landscape", width: 1920, height: 1080 },
] as const;
export const identifier = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const brandSchema = z.object({
  name: z.string().max(80),
  primary: color,
  secondary: color,
  background: color,
  text: color,
  font: z.enum(["sans", "arabic", "serif"]),
  logoAssetId: identifier.optional(),
  website: z.string().max(160),
  footer: z.string().max(160),
});
export type Brand = z.infer<typeof brandSchema>;
const common = {
  id: identifier,
  icon: z.enum(["check", "circle", "star", "arrow"]).default("circle"),
};
const words = z.string().max(600);
export const blockSchema = z.discriminatedUnion("type", [
  z.object({ ...common, type: z.literal("heading"), text: words }),
  z.object({ ...common, type: z.literal("paragraph"), text: words }),
  z.object({
    ...common,
    type: z.literal("list"),
    title: words,
    items: z.array(z.string().max(160)).max(8),
  }),
  z.object({ ...common, type: z.literal("step"), title: words, text: words }),
  z.object({
    ...common,
    type: z.literal("comparison"),
    title: words,
    left: words,
    right: words,
  }),
  z.object({
    ...common,
    type: z.literal("statistic"),
    title: words,
    value: z.number().finite().min(-1e9).max(1e9),
    unit: z.string().max(30),
    confirmed: z.boolean(),
  }),
  z.object({
    ...common,
    type: z.literal("chart"),
    title: words,
    unit: z.string().max(30),
    confirmed: z.boolean(),
    values: z
      .array(
        z.object({
          label: z.string().min(1).max(60),
          value: z.number().finite().min(0).max(1e9),
        }),
      )
      .min(1)
      .max(6),
  }),
]);
export type Block = z.infer<typeof blockSchema>;
export const documentSchema = z
  .object({
    schemaVersion: z.literal(1),
    template: z.enum(templates),
    title: z.string().min(1).max(160),
    introduction: z.string().max(400),
    cta: z.string().max(160),
    language: z.enum(["en", "fr", "ar"]),
    width: z.number(),
    height: z.number(),
    brand: brandSchema,
    spacing: z.enum(["comfortable", "compact"]),
    blocks: z.array(blockSchema).min(1).max(8),
    artworkAssetId: identifier.optional(),
    brief: z.object({
      mode: z.enum(["idea", "offer"]),
      content: z.string().max(20000),
      audience: z.string().max(200),
      goal: z.string().max(200),
      sourceUrl: z.string().url().max(2048).or(z.literal("")),
      confirmed: z.boolean(),
    }),
  })
  .superRefine((doc, ctx) => {
    if (!formats.some((f) => f.width === doc.width && f.height === doc.height))
      ctx.addIssue({
        code: "custom",
        message: "Unsupported output size",
        path: ["width"],
      });
    if (new Set(doc.blocks.map((b) => b.id)).size !== doc.blocks.length)
      ctx.addIssue({
        code: "custom",
        message: "Block identifiers must be unique",
        path: ["blocks"],
      });
  });
export type StudioDocument = z.infer<typeof documentSchema>;
export type Project = {
  id: string;
  title: string;
  revision: number;
  mode: "structured";
  document: StudioDocument;
  updatedAt: string;
  createdAt: string;
  ownerUid: string;
  exportAssetId?: string;
  exportRevision?: number;
};
export type Version = {
  revision: number;
  document: StudioDocument;
  createdAt: string;
  uid: string;
};
export const defaultBrand: Brand = {
  name: "",
  primary: "#2563eb",
  secondary: "#14b8a6",
  background: "#ffffff",
  text: "#172033",
  font: "sans",
  website: "",
  footer: "",
};
export function newDocument(
  template: Template = "checklist",
  mode: "idea" | "offer" = "idea",
): StudioDocument {
  return {
    schemaVersion: 1,
    template,
    title: "Untitled infographic",
    introduction: "",
    cta: "",
    language: "en",
    width: 1080,
    height: 1350,
    brand: { ...defaultBrand },
    spacing: "comfortable",
    blocks: [
      { id: "section-1", type: "step", title: "", text: "", icon: "check" },
    ],
    brief: {
      mode,
      content: "",
      audience: "",
      goal: "",
      sourceUrl: "",
      confirmed: false,
    },
  };
}
export function sampleDocument(template: Template): StudioDocument {
  const d = newDocument(template);
  d.title = templateLabels[template];
  d.introduction = "Illustrative template • replace with your content";
  d.blocks =
    template === "comparison"
      ? ["Plan", "Create", "Review"].map((title, i) => ({
          id: `s${i}`,
          type: "comparison",
          title,
          left: "Option A",
          right: "Option B",
          icon: "circle",
        }))
      : template === "statistics"
        ? ["Example A", "Example B", "Example C"].map((title, i) => ({
            id: `s${i}`,
            type: "statistic",
            title,
            value: (i + 1) * 10,
            unit: "units",
            confirmed: true,
            icon: "circle",
          }))
        : [
            "Start with a clear idea",
            "Make every detail count",
            "Share something useful",
          ].map((title, i) => ({
            id: `s${i}`,
            type: "step",
            title,
            text: "Add your own supporting details here.",
            icon: "check",
          }));
  return d;
}
export function templateIssues(
  d: StudioDocument,
  template = d.template,
): string[] {
  const issues: string[] = [];
  if (
    template === "comparison" &&
    d.blocks.some(
      (b) =>
        b.type !== "comparison" &&
        b.type !== "heading" &&
        b.type !== "paragraph",
    )
  )
    issues.push(
      "Comparison requires comparison sections. Change the section type first; existing content will be preserved until you confirm a conversion.",
    );
  if (
    template === "statistics" &&
    d.blocks.some(
      (b) => !["statistic", "chart", "heading", "paragraph"].includes(b.type),
    )
  )
    issues.push(
      "Statistics requires numeric or chart sections. Enter and confirm your values first.",
    );
  for (const b of d.blocks) {
    if (
      (b.type === "statistic" || b.type === "chart") &&
      (!b.confirmed || !b.unit.trim() || !b.title.trim())
    )
      issues.push(
        `Section ${d.blocks.indexOf(b) + 1}: confirm the values and provide a label and unit.`,
      );
  }
  return issues;
}
export function prepareOutline(d: StudioDocument): StudioDocument {
  const lines = d.brief.content
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!lines.length)
    throw new Error(
      "Supply the facts or offer details before preparing the outline.",
    );
  if (lines.length > 8 || lines.some((s) => s.length > 600))
    throw new Error(
      "Use up to eight sections of 600 characters each. Shorten the supplied content first; nothing has been discarded.",
    );
  return {
    ...d,
    blocks: lines.map((text, i) => ({
      id: `section-${i + 1}`,
      type: "step",
      title: "",
      text,
      icon: "check",
    })),
    brief: { ...d.brief, confirmed: false },
  };
}
