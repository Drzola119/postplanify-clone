/**
 * Carousel Studio — Templates library (F5)
 *
 * 20+ curated templates across 8 niches. Each template is a static
 * seed record: when the user clicks "Use Template", the wizard reads
 * the topic / tone / niche / ctaKeyword / slideCount from the template
 * and the AI re-generates the script in those constraints.
 *
 * The template body is intentionally NOT a pre-written script — the
 * LLM is the source of truth for actual copy. Templates just encode
 * the structural decision the user has already made.
 */

export type TemplateNiche =
  | "saas"
  | "fitness"
  | "real-estate"
  | "personal-branding"
  | "ecommerce"
  | "finance"
  | "food-lifestyle"
  | "marketing-agency";

export interface CarouselTemplate {
  /** Stable id, used as the URL key. */
  id: string;
  /** Display name. */
  name: string;
  /** One-line description shown in the card. */
  description: string;
  /** Niche filter bucket. */
  niche: TemplateNiche;
  /** Default slide count for the wizard. */
  slideCount: 5 | 7 | 10 | 15;
  /** Topic seed — pre-fills the wizard's topic textarea. */
  topic: string;
  /** Optional tone the LLM should match. */
  tone: string;
  /** Optional niche tag passed to the script gen (the wizard's "Niche"
   * field — different from the template's niche-bucket filter). */
  topicNiche: string;
  /** CTA keyword the LLM drops on the final slide. */
  ctaKeyword: string;
  /** Default output language. */
  outputLanguage: "en" | "fr" | "ar";
}

export const TEMPLATE_NICHES: ReadonlyArray<{ id: TemplateNiche; label: string }> = [
  { id: "saas", label: "SaaS" },
  { id: "fitness", label: "Fitness" },
  { id: "real-estate", label: "Real Estate" },
  { id: "personal-branding", label: "Personal Branding" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "finance", label: "Finance" },
  { id: "food-lifestyle", label: "Food & Lifestyle" },
  { id: "marketing-agency", label: "Marketing Agency" },
];

export const CAROUSEL_TEMPLATES: ReadonlyArray<CarouselTemplate> = [
  // ─── SaaS ────────────────────────────────────────────────────────────
  {
    id: "saas-churn-recovery",
    name: "SaaS Churn Recovery Playbook",
    description: "Win back cancelled accounts in 5 slides — the timing, the offer, the follow-up.",
    niche: "saas",
    slideCount: 5,
    topic: "How to recover a churned SaaS customer in 14 days",
    tone: "Direct, founder-to-founder",
    topicNiche: "B2B SaaS",
    ctaKeyword: "PLAYBOOK",
    outputLanguage: "en",
  },
  {
    id: "saas-onboarding-teardown",
    name: "Onboarding Teardown",
    description: "Audit any SaaS onboarding flow in 7 slides — the 4 leaks, the fixes, the metric to watch.",
    niche: "saas",
    slideCount: 7,
    topic: "Audit your SaaS onboarding: 4 leaks and how to fix them",
    tone: "Sharp, no fluff",
    topicNiche: "Product",
    ctaKeyword: "AUDIT",
    outputLanguage: "en",
  },
  {
    id: "saas-pricing-page",
    name: "Pricing Page That Converts",
    description: "The 10 elements of a pricing page that lifts trial-to-paid by 30%+.",
    niche: "saas",
    slideCount: 10,
    topic: "10 elements every high-converting SaaS pricing page needs",
    tone: "Persuasive, evidence-driven",
    topicNiche: "Conversion",
    ctaKeyword: "TEMPLATE",
    outputLanguage: "en",
  },

  // ─── Fitness ─────────────────────────────────────────────────────────
  {
    id: "fitness-30-day-pushup",
    name: "30-Day Push-Up Challenge",
    description: "The reps-by-day schedule, the form cues, and the rest day rule.",
    niche: "fitness",
    slideCount: 7,
    topic: "30-day push-up challenge: reps, form, and the rest day rule",
    tone: "Motivating, plain-spoken",
    topicNiche: "Calisthenics",
    ctaKeyword: "PUSHUP",
    outputLanguage: "en",
  },
  {
    id: "fitness-protein-myths",
    name: "Protein Myths Coaches Still Spread",
    description: "5 myths about daily protein — the source, the evidence, the corrected number.",
    niche: "fitness",
    slideCount: 5,
    topic: "5 protein myths coaches still spread",
    tone: "Conversational, myth-busting",
    topicNiche: "Nutrition",
    ctaKeyword: "MACROS",
    outputLanguage: "en",
  },

  // ─── Real Estate ─────────────────────────────────────────────────────
  {
    id: "realtor-listing-presentation",
    name: "Listing Presentation Skeleton",
    description: "The 10 slides every listing presentation opens with — comp, photo plan, marketing budget.",
    niche: "real-estate",
    slideCount: 10,
    topic: "Listing presentation: 10 slides to win the seller",
    tone: "Confident, agent-to-seller",
    topicNiche: "Residential",
    ctaKeyword: "LISTING",
    outputLanguage: "en",
  },
  {
    id: "realtor-first-time-buyer",
    name: "First-Time Buyer 5-Slide Guide",
    description: "The pre-approval, the neighbourhood score, the inspection shortcut.",
    niche: "real-estate",
    slideCount: 5,
    topic: "First-time home buyer: the 5 steps nobody walks you through",
    tone: "Reassuring, stepwise",
    topicNiche: "Buyers",
    ctaKeyword: "GUIDE",
    outputLanguage: "en",
  },

  // ─── Personal Branding ──────────────────────────────────────────────
  {
    id: "pb-content-pillar-audit",
    name: "Content Pillar Audit",
    description: "Map your last 30 posts against 4 pillars — find the gap, double down on the winner.",
    niche: "personal-branding",
    slideCount: 5,
    topic: "Content pillar audit: the 4 buckets and how to find your gap",
    tone: "Honest, self-aware",
    topicNiche: "Creator",
    ctaKeyword: "AUDIT",
    outputLanguage: "en",
  },
  {
    id: "pb-linkedin-headline",
    name: "LinkedIn Headline Rewrite",
    description: "7 headline formulas that turn a title into a hook — tested against 30+ profiles.",
    niche: "personal-branding",
    slideCount: 7,
    topic: "7 LinkedIn headline formulas that turn a job title into a hook",
    tone: "Witty, high-contrast",
    topicNiche: "LinkedIn",
    ctaKeyword: "REWRITE",
    outputLanguage: "en",
  },
  {
    id: "pb-thought-leadership",
    name: "15-Slide Thought Leadership",
    description: "A long-form carousel structure for the contrarian essay in your industry.",
    niche: "personal-branding",
    slideCount: 15,
    topic: "How to write one contrarian essay a month that builds your brand",
    tone: "Authoritative, contrarian",
    topicNiche: "Thought leadership",
    ctaKeyword: "ESSAY",
    outputLanguage: "en",
  },

  // ─── E-commerce ──────────────────────────────────────────────────────
  {
    id: "ecom-pdp-teardown",
    name: "Product Page Teardown",
    description: "The 7 elements above the fold that move a visitor from browse to buy.",
    niche: "ecommerce",
    slideCount: 7,
    topic: "Product page teardown: 7 elements that move browse to buy",
    tone: "Data-led, retailer-friendly",
    topicNiche: "DTC",
    ctaKeyword: "TEARDOWN",
    outputLanguage: "en",
  },
  {
    id: "ecom-abandoned-cart",
    name: "Abandoned Cart Recovery",
    description: "5 email angles that re-open a closed tab — the discount, the social proof, the urgency.",
    niche: "ecommerce",
    slideCount: 5,
    topic: "5 abandoned cart email angles that re-open a closed tab",
    tone: "Direct, conversion-focused",
    topicNiche: "Email",
    ctaKeyword: "CART",
    outputLanguage: "en",
  },

  // ─── Finance ─────────────────────────────────────────────────────────
  {
    id: "finance-emergency-fund",
    name: "Emergency Fund in 90 Days",
    description: "The 3-bucket split, the auto-save rule, the milestone to hit before month 3.",
    niche: "finance",
    slideCount: 5,
    topic: "Build a real emergency fund in 90 days",
    tone: "Calm, stepwise",
    topicNiche: "Personal finance",
    ctaKeyword: "FUND",
    outputLanguage: "en",
  },
  {
    id: "finance-tax-checklist",
    name: "Self-Employed Tax Checklist",
    description: "The 10 deductions a self-employed person misses every April.",
    niche: "finance",
    slideCount: 10,
    topic: "10 deductions self-employed people miss every tax season",
    tone: "Authoritative, accountant-style",
    topicNiche: "Tax",
    ctaKeyword: "CHECKLIST",
    outputLanguage: "en",
  },

  // ─── Food & Lifestyle ────────────────────────────────────────────────
  {
    id: "foodlifestyle-meal-prep",
    name: "Sunday Meal Prep in 7 Slides",
    description: "The 90-minute plan, the 5-container rotation, the grocery shortcut.",
    niche: "food-lifestyle",
    slideCount: 7,
    topic: "Sunday meal prep in 90 minutes: the 5-container rotation",
    tone: "Friendly, practical",
    topicNiche: "Meal prep",
    ctaKeyword: "PREP",
    outputLanguage: "en",
  },
  {
    id: "foodlifestyle-restaurant-story",
    name: "Restaurant Origin Story",
    description: "5 slides that turn a chef's backstory into a brand people follow.",
    niche: "food-lifestyle",
    slideCount: 5,
    topic: "Tell your restaurant's origin story in 5 slides",
    tone: "Warm, personal",
    topicNiche: "Restaurant",
    ctaKeyword: "MENU",
    outputLanguage: "en",
  },

  // ─── Marketing Agency ───────────────────────────────────────────────
  {
    id: "agency-case-study",
    name: "Client Case Study Skeleton",
    description: "The 7-slide case study deck that wins the next pitch.",
    niche: "marketing-agency",
    slideCount: 7,
    topic: "7-slide client case study that wins the next pitch",
    tone: "Confident, results-first",
    topicNiche: "Agency",
    ctaKeyword: "STUDY",
    outputLanguage: "en",
  },
  {
    id: "agency-funnel-numbers",
    name: "Funnel Numbers You Should Quote",
    description: "10 benchmark numbers every agency should know cold on a sales call.",
    niche: "marketing-agency",
    slideCount: 10,
    topic: "10 funnel benchmark numbers every agency should quote on a sales call",
    tone: "Data-led, consultant voice",
    topicNiche: "Funnel",
    ctaKeyword: "NUMBERS",
    outputLanguage: "en",
  },
  {
    id: "agency-content-engine",
    name: "Content Engine in 15 Slides",
    description: "The full build of a content engine for a single client — pillars, cadence, repurposing.",
    niche: "marketing-agency",
    slideCount: 15,
    topic: "How to build a 30-post-per-month content engine for a single client",
    tone: "Operator, systems-first",
    topicNiche: "Content ops",
    ctaKeyword: "ENGINE",
    outputLanguage: "en",
  },
  {
    id: "agency-cold-outreach",
    name: "Cold Outreach Sequence",
    description: "5 slides: the trigger event, the hook, the proof, the ask, the follow-up.",
    niche: "marketing-agency",
    slideCount: 5,
    topic: "Cold outreach that doesn't feel cold: the 5-slide sequence",
    tone: "Direct, peer-to-peer",
    topicNiche: "Outreach",
    ctaKeyword: "PITCH",
    outputLanguage: "en",
  },
  {
    id: "agency-pricing-teardown",
    name: "Agency Pricing Teardown",
    description: "The 7 levers between hourly billing and value pricing — when to use each.",
    niche: "marketing-agency",
    slideCount: 7,
    topic: "7 pricing levers between hourly billing and value pricing",
    tone: "Strategic, candid",
    topicNiche: "Pricing",
    ctaKeyword: "PRICING",
    outputLanguage: "en",
  },
];

export function getTemplate(id: string): CarouselTemplate | null {
  return CAROUSEL_TEMPLATES.find((t) => t.id === id) ?? null;
}
