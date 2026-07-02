export type CompareTool = {
  name: string;
  /** logo path under /public (no leading slash on import) */
  logo: string;
  /** file extension determines the <img> src attribute (with leading slash) */
  ext: "png" | "svg" | "webp";
};

export const COMPARE_TOOLS: Record<string, CompareTool> = {
  buffer: { name: "Buffer", logo: "/alternatives/buffer.png", ext: "png" },
  hootsuite: { name: "Hootsuite", logo: "/alternatives/hootsuite.png", ext: "png" },
  "sprout-social": { name: "Sprout Social", logo: "/alternatives/sprout-social.png", ext: "png" },
  later: { name: "Later", logo: "/alternatives/later.png", ext: "png" },
  metricool: { name: "Metricool", logo: "/alternatives/metricool.png", ext: "png" },
  publer: { name: "Publer", logo: "/alternatives/publer.png", ext: "png" },
  socialbee: { name: "SocialBee", logo: "/alternatives/socialbee.png", ext: "png" },
  agorapulse: { name: "Agorapulse", logo: "/alternatives/agorapulse.svg", ext: "svg" },
  coschedule: { name: "CoSchedule", logo: "/alternatives/coschedule.png", ext: "png" },
  loomly: { name: "Loomly", logo: "/alternatives/loomly.svg", ext: "svg" },
  socialpilot: { name: "SocialPilot", logo: "/alternatives/socialpilot.png", ext: "png" },
  sendible: { name: "Sendible", logo: "/alternatives/sendible.png", ext: "png" },
  planable: { name: "Planable", logo: "/alternatives/planable.png", ext: "png" },
  tailwind: { name: "Tailwind", logo: "/alternatives/tailwind.png", ext: "png" },
  "zoho-social": { name: "Zoho Social", logo: "/alternatives/zoho-social.png", ext: "png" },
  iconosquare: { name: "Iconosquare", logo: "/alternatives/iconosquare.webp", ext: "webp" },
  "vista-social": { name: "Vista Social", logo: "/alternatives/vista-social.png", ext: "png" },
};

export type CompareCard = {
  /** slug pair (a-vs-b) used in /compare/<slug> */
  slug: string;
  toolA: keyof typeof COMPARE_TOOLS;
  toolB: keyof typeof COMPARE_TOOLS;
};

/** Production order preserved from postplanify.com/compare — 112 cards */
export const COMPARE_CARDS: CompareCard[] = [
  { slug: "buffer-vs-hootsuite", toolA: "buffer", toolB: "hootsuite" },
  { slug: "hootsuite-vs-sprout-social", toolA: "hootsuite", toolB: "sprout-social" },
  { slug: "buffer-vs-later", toolA: "buffer", toolB: "later" },
  { slug: "buffer-vs-metricool", toolA: "buffer", toolB: "metricool" },
  { slug: "later-vs-metricool", toolA: "later", toolB: "metricool" },
  { slug: "hootsuite-vs-later", toolA: "hootsuite", toolB: "later" },
  { slug: "hootsuite-vs-metricool", toolA: "hootsuite", toolB: "metricool" },
  { slug: "sprout-social-vs-buffer", toolA: "sprout-social", toolB: "buffer" },
  { slug: "sprout-social-vs-later", toolA: "sprout-social", toolB: "later" },
  { slug: "sprout-social-vs-metricool", toolA: "sprout-social", toolB: "metricool" },
  { slug: "buffer-vs-publer", toolA: "buffer", toolB: "publer" },
  { slug: "hootsuite-vs-publer", toolA: "hootsuite", toolB: "publer" },
  { slug: "sprout-social-vs-publer", toolA: "sprout-social", toolB: "publer" },
  { slug: "later-vs-publer", toolA: "later", toolB: "publer" },
  { slug: "metricool-vs-publer", toolA: "metricool", toolB: "publer" },
  { slug: "buffer-vs-socialbee", toolA: "buffer", toolB: "socialbee" },
  { slug: "hootsuite-vs-socialbee", toolA: "hootsuite", toolB: "socialbee" },
  { slug: "sprout-social-vs-socialbee", toolA: "sprout-social", toolB: "socialbee" },
  { slug: "later-vs-socialbee", toolA: "later", toolB: "socialbee" },
  { slug: "metricool-vs-socialbee", toolA: "metricool", toolB: "socialbee" },
  { slug: "publer-vs-socialbee", toolA: "publer", toolB: "socialbee" },
  { slug: "buffer-vs-agorapulse", toolA: "buffer", toolB: "agorapulse" },
  { slug: "hootsuite-vs-agorapulse", toolA: "hootsuite", toolB: "agorapulse" },
  { slug: "sprout-social-vs-agorapulse", toolA: "sprout-social", toolB: "agorapulse" },
  { slug: "later-vs-agorapulse", toolA: "later", toolB: "agorapulse" },
  { slug: "metricool-vs-agorapulse", toolA: "metricool", toolB: "agorapulse" },
  { slug: "publer-vs-agorapulse", toolA: "publer", toolB: "agorapulse" },
  { slug: "socialbee-vs-agorapulse", toolA: "socialbee", toolB: "agorapulse" },
  { slug: "buffer-vs-coschedule", toolA: "buffer", toolB: "coschedule" },
  { slug: "hootsuite-vs-coschedule", toolA: "hootsuite", toolB: "coschedule" },
  { slug: "sprout-social-vs-coschedule", toolA: "sprout-social", toolB: "coschedule" },
  { slug: "later-vs-coschedule", toolA: "later", toolB: "coschedule" },
  { slug: "metricool-vs-coschedule", toolA: "metricool", toolB: "coschedule" },
  { slug: "publer-vs-coschedule", toolA: "publer", toolB: "coschedule" },
  { slug: "socialbee-vs-coschedule", toolA: "socialbee", toolB: "coschedule" },
  { slug: "agorapulse-vs-coschedule", toolA: "agorapulse", toolB: "coschedule" },
  { slug: "buffer-vs-loomly", toolA: "buffer", toolB: "loomly" },
  { slug: "hootsuite-vs-loomly", toolA: "hootsuite", toolB: "loomly" },
  { slug: "sprout-social-vs-loomly", toolA: "sprout-social", toolB: "loomly" },
  { slug: "later-vs-loomly", toolA: "later", toolB: "loomly" },
  { slug: "metricool-vs-loomly", toolA: "metricool", toolB: "loomly" },
  { slug: "publer-vs-loomly", toolA: "publer", toolB: "loomly" },
  { slug: "socialbee-vs-loomly", toolA: "socialbee", toolB: "loomly" },
  { slug: "agorapulse-vs-loomly", toolA: "agorapulse", toolB: "loomly" },
  { slug: "coschedule-vs-loomly", toolA: "coschedule", toolB: "loomly" },
  { slug: "buffer-vs-socialpilot", toolA: "buffer", toolB: "socialpilot" },
  { slug: "hootsuite-vs-socialpilot", toolA: "hootsuite", toolB: "socialpilot" },
  { slug: "sprout-social-vs-socialpilot", toolA: "sprout-social", toolB: "socialpilot" },
  { slug: "later-vs-socialpilot", toolA: "later", toolB: "socialpilot" },
  { slug: "metricool-vs-socialpilot", toolA: "metricool", toolB: "socialpilot" },
  { slug: "publer-vs-socialpilot", toolA: "publer", toolB: "socialpilot" },
  { slug: "socialbee-vs-socialpilot", toolA: "socialbee", toolB: "socialpilot" },
  { slug: "agorapulse-vs-socialpilot", toolA: "agorapulse", toolB: "socialpilot" },
  { slug: "coschedule-vs-socialpilot", toolA: "coschedule", toolB: "socialpilot" },
  { slug: "loomly-vs-socialpilot", toolA: "loomly", toolB: "socialpilot" },
  { slug: "buffer-vs-sendible", toolA: "buffer", toolB: "sendible" },
  { slug: "hootsuite-vs-sendible", toolA: "hootsuite", toolB: "sendible" },
  { slug: "sprout-social-vs-sendible", toolA: "sprout-social", toolB: "sendible" },
  { slug: "later-vs-sendible", toolA: "later", toolB: "sendible" },
  { slug: "metricool-vs-sendible", toolA: "metricool", toolB: "sendible" },
  { slug: "publer-vs-sendible", toolA: "publer", toolB: "sendible" },
  { slug: "socialbee-vs-sendible", toolA: "socialbee", toolB: "sendible" },
  { slug: "agorapulse-vs-sendible", toolA: "agorapulse", toolB: "sendible" },
  { slug: "coschedule-vs-sendible", toolA: "coschedule", toolB: "sendible" },
  { slug: "loomly-vs-sendible", toolA: "loomly", toolB: "sendible" },
  { slug: "socialpilot-vs-sendible", toolA: "socialpilot", toolB: "sendible" },
  { slug: "buffer-vs-planable", toolA: "buffer", toolB: "planable" },
  { slug: "hootsuite-vs-planable", toolA: "hootsuite", toolB: "planable" },
  { slug: "sprout-social-vs-planable", toolA: "sprout-social", toolB: "planable" },
  { slug: "later-vs-planable", toolA: "later", toolB: "planable" },
  { slug: "metricool-vs-planable", toolA: "metricool", toolB: "planable" },
  { slug: "publer-vs-planable", toolA: "publer", toolB: "planable" },
  { slug: "socialbee-vs-planable", toolA: "socialbee", toolB: "planable" },
  { slug: "agorapulse-vs-planable", toolA: "agorapulse", toolB: "planable" },
  { slug: "coschedule-vs-planable", toolA: "coschedule", toolB: "planable" },
  { slug: "loomly-vs-planable", toolA: "loomly", toolB: "planable" },
  { slug: "socialpilot-vs-planable", toolA: "socialpilot", toolB: "planable" },
  { slug: "sendible-vs-planable", toolA: "sendible", toolB: "planable" },
  { slug: "buffer-vs-tailwind", toolA: "buffer", toolB: "tailwind" },
  { slug: "hootsuite-vs-tailwind", toolA: "hootsuite", toolB: "tailwind" },
  { slug: "sprout-social-vs-tailwind", toolA: "sprout-social", toolB: "tailwind" },
  { slug: "later-vs-tailwind", toolA: "later", toolB: "tailwind" },
  { slug: "metricool-vs-tailwind", toolA: "metricool", toolB: "tailwind" },
  { slug: "publer-vs-tailwind", toolA: "publer", toolB: "tailwind" },
  { slug: "socialbee-vs-tailwind", toolA: "socialbee", toolB: "tailwind" },
  { slug: "agorapulse-vs-tailwind", toolA: "agorapulse", toolB: "tailwind" },
  { slug: "coschedule-vs-tailwind", toolA: "coschedule", toolB: "tailwind" },
  { slug: "loomly-vs-tailwind", toolA: "loomly", toolB: "tailwind" },
  { slug: "socialpilot-vs-tailwind", toolA: "socialpilot", toolB: "tailwind" },
  { slug: "sendible-vs-tailwind", toolA: "sendible", toolB: "tailwind" },
  { slug: "planable-vs-tailwind", toolA: "planable", toolB: "tailwind" },
  { slug: "buffer-vs-zoho-social", toolA: "buffer", toolB: "zoho-social" },
  { slug: "hootsuite-vs-zoho-social", toolA: "hootsuite", toolB: "zoho-social" },
  { slug: "sprout-social-vs-zoho-social", toolA: "sprout-social", toolB: "zoho-social" },
  { slug: "later-vs-zoho-social", toolA: "later", toolB: "zoho-social" },
  { slug: "metricool-vs-zoho-social", toolA: "metricool", toolB: "zoho-social" },
  { slug: "agorapulse-vs-zoho-social", toolA: "agorapulse", toolB: "zoho-social" },
  { slug: "buffer-vs-iconosquare", toolA: "buffer", toolB: "iconosquare" },
  { slug: "hootsuite-vs-iconosquare", toolA: "hootsuite", toolB: "iconosquare" },
  { slug: "sprout-social-vs-iconosquare", toolA: "sprout-social", toolB: "iconosquare" },
  { slug: "later-vs-iconosquare", toolA: "later", toolB: "iconosquare" },
  { slug: "metricool-vs-iconosquare", toolA: "metricool", toolB: "iconosquare" },
  { slug: "agorapulse-vs-iconosquare", toolA: "agorapulse", toolB: "iconosquare" },
  { slug: "buffer-vs-vista-social", toolA: "buffer", toolB: "vista-social" },
  { slug: "hootsuite-vs-vista-social", toolA: "hootsuite", toolB: "vista-social" },
  { slug: "sprout-social-vs-vista-social", toolA: "sprout-social", toolB: "vista-social" },
  { slug: "later-vs-vista-social", toolA: "later", toolB: "vista-social" },
  { slug: "metricool-vs-vista-social", toolA: "metricool", toolB: "vista-social" },
  { slug: "agorapulse-vs-vista-social", toolA: "agorapulse", toolB: "vista-social" },
  { slug: "zoho-social-vs-iconosquare", toolA: "zoho-social", toolB: "iconosquare" },
  { slug: "zoho-social-vs-vista-social", toolA: "zoho-social", toolB: "vista-social" },
  { slug: "iconosquare-vs-vista-social", toolA: "iconosquare", toolB: "vista-social" },
];

export type ToolCovered = {
  name: string;
  pricing: string;
  description: string;
  pricingHref: string;
};

export const TOOLS_COVERED: ToolCovered[] = [
  {
    name: "Buffer",
    pricing: "per-channel pricing starting at $6/month",
    description: "Simple scheduling for solo creators.",
    pricingHref: "/buffer-pricing",
  },
  {
    name: "Hootsuite",
    pricing: "per-user pricing starting at $249/month",
    description: "Enterprise-grade with social listening and inbox.",
    pricingHref: "/hootsuite-pricing",
  },
  {
    name: "Sprout Social",
    pricing: "per-seat pricing starting at $199/month",
    description: "Customer care and deep analytics for large teams.",
    pricingHref: "/sprout-social-pricing",
  },
  {
    name: "Later",
    pricing: "Social Set pricing starting at $25/month",
    description: "Visual-first content planning for Instagram and TikTok creators.",
    pricingHref: "/later-pricing",
  },
  {
    name: "Metricool",
    pricing: "per-brand pricing starting free",
    description: "Analytics-focused with competitor tracking and reports.",
    pricingHref: "/metricool-pricing",
  },
  {
    name: "Publer",
    pricing: "per-account pricing starting at $5/month",
    description: "Budget-friendly with 13 platforms and bulk scheduling.",
    pricingHref: "/publer-pricing",
  },
  {
    name: "SocialBee",
    pricing: "tiered pricing starting at $29/month",
    description: "Category-based scheduling with content recycling and AI tools.",
    pricingHref: "/socialbee-pricing",
  },
  {
    name: "Agorapulse",
    pricing: "per-user pricing starting at $99/month",
    description: "Unified inbox, social CRM, and social listening for agencies.",
    pricingHref: "/agorapulse-pricing",
  },
  {
    name: "CoSchedule",
    pricing: "per-user pricing starting at $19/month",
    description: "Marketing calendar with content recycling and WordPress integration.",
    pricingHref: "/coschedule-pricing",
  },
  {
    name: "Loomly",
    pricing: "tiered pricing starting at $65/month",
    description: "Visual content calendar with approval workflows for teams.",
    pricingHref: "/loomly-pricing",
  },
  {
    name: "SocialPilot",
    pricing: "tiered pricing starting at $30/month",
    description: "Agency-focused with bulk scheduling, white-label reports, and client management.",
    pricingHref: "/socialpilot-pricing",
  },
  {
    name: "Sendible",
    pricing: "tiered pricing starting at $29/month",
    description: "Agency-focused with Priority Inbox, white-label dashboards, and 250+ report modules.",
    pricingHref: "/sendible-pricing",
  },
  {
    name: "Planable",
    pricing: "per-workspace pricing starting at $39/month",
    description: "Collaboration-first with unlimited users, approval workflows, and visual mockup previews.",
    pricingHref: "/planable-pricing",
  },
  {
    name: "Tailwind",
    pricing: "tiered pricing starting at $29.99/month",
    description: "Pinterest-first with SmartSchedule, Ghostwriter AI, Tailwind Create, and e-commerce integrations.",
    pricingHref: "/tailwind-pricing",
  },
  {
    name: "Zoho Social",
    pricing: "per-brand pricing starting free",
    description: "Part of the Zoho ecosystem with CRM integration, SmartQ scheduling, and team collaboration.",
    pricingHref: "/zoho-social-pricing",
  },
  {
    name: "Iconosquare",
    pricing: "per-profile pricing starting at $39/month",
    description: "Analytics-first with 100+ metrics, competitor tracking, industry benchmarks, and Instagram grid preview.",
    pricingHref: "/iconosquare-pricing",
  },
  {
    name: "Vista Social",
    pricing: "profile-based pricing starting at $79/month",
    description: "Enterprise-grade with DM automations, review management, social listening, and 12+ platform support.",
    pricingHref: "/vista-social-pricing",
  },
];

export type FaqEntry = {
  question: string;
  answer: string;
};

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "What is the best social media scheduling tool?",
    answer:
      "It depends on your needs and budget. Buffer is best for solo creators who want simplicity. Hootsuite and Sprout Social suit enterprises with large teams. Later is ideal for visual-first Instagram creators. Metricool excels at analytics and reporting. Publer offers the widest platform support at the lowest price. Use our side-by-side comparisons above to find the best fit for your specific workflow.",
  },
  {
    question: "Which social media scheduler is cheapest?",
    answer:
      "Publer and Metricool both offer free plans. On paid plans, Publer starts at $5/month per account and Metricool starts at $22/month for up to 5 brands. Buffer starts at $6/month per channel. Later starts at $25/month. Hootsuite starts at $249/month per user and Sprout Social starts at $199/month per seat. The cheapest option depends on how many accounts and team members you need.",
  },
  {
    question: "How do social media tool pricing models differ?",
    answer:
      "Each tool uses a different model: Buffer charges per channel, Hootsuite per user, Sprout Social per seat, Later per Social Set (a bundle of profiles), Metricool per brand, and Publer per connected account. This means the same number of social accounts can cost very different amounts across tools. Our comparisons calculate real costs at different scales so you can see the true price.",
  },
  {
    question: "Do I need an enterprise tool like Hootsuite or Sprout Social?",
    answer:
      "Only if you need features like social listening, a unified inbox for DMs and comments, sentiment analysis, or enterprise compliance (SSO, audit logs). For scheduling, publishing, AI captions, and basic analytics, tools like Buffer, Later, Metricool, or Publer cover most needs at a fraction of the cost.",
  },
  {
    question: "Which social media tools include AI features?",
    answer:
      "All six tools we compare include some form of AI. Buffer and Hootsuite include AI captions on all paid plans. Sprout Social includes AI Assist on all plans. Later uses a credit-based AI system (5-100 credits per month). Metricool includes an AI assistant on all plans. Publer includes GPT-4 captions and DALL-E 3 image generation, but only on its Business plan.",
  },
  {
    question: "Can I switch between social media scheduling tools?",
    answer:
      "Yes. Most tools let you reconnect the same social accounts. Your scheduled posts won't transfer automatically, but tools with CSV import (like Buffer and Publer) make migration easier. The main consideration is feature differences — switching from an enterprise tool to a simpler one means losing features like social listening or advanced analytics.",
  },
];