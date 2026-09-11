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

import type { CarouselSlideItem, CarouselStyle } from "@/lib/carousel-gen/types";

export type TemplateNiche =
  | "saas"
  | "fitness"
  | "real-estate"
  | "personal-branding"
  | "ecommerce"
  | "finance"
  | "food-lifestyle"
  | "marketing-agency"
  | "educational"
  | "case-study";

export type TemplateCategory =
  | "educational"
  | "how-to"
  | "myth-fact"
  | "before-after"
  | "case-study"
  | "thought-leadership"
  | "data-insight"
  | "checklist"
  | "storytelling";

export interface CarouselTemplate {
  /** Stable id, used as the URL key. */
  id: string;
  /** Display name. */
  name: string;
  /** One-line description shown in the card. */
  description: string;
  /** Niche filter bucket. */
  niche: TemplateNiche;
  /** Category / framework archetype */
  category?: TemplateCategory;
  /** Default slide count for the wizard. */
  slideCount: 5 | 7 | 10 | 15;
  /** Topic seed — pre-fills the wizard's topic textarea. */
  topic: string;
  /** Optional tone the LLM should match. */
  tone: string;
  /** Optional niche tag passed to the script gen */
  topicNiche: string;
  /** CTA keyword the LLM drops on the final slide. */
  ctaKeyword: string;
  /** Default output language. */
  outputLanguage: "en" | "fr" | "ar";
  /** Optional pre-configured style definition */
  style?: Partial<CarouselStyle>;
  /** Optional structured slide presets */
  slides?: Partial<CarouselSlideItem>[];
}

export const TEMPLATE_NICHES: ReadonlyArray<{ id: TemplateNiche; label: string }> = [
  { id: "educational", label: "Educational" },
  { id: "saas", label: "SaaS" },
  { id: "marketing-agency", label: "Marketing & Agency" },
  { id: "personal-branding", label: "Personal Branding" },
  { id: "case-study", label: "Case Studies" },
  { id: "finance", label: "Finance & Wealth" },
  { id: "fitness", label: "Fitness & Health" },
  { id: "real-estate", label: "Real Estate" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "food-lifestyle", label: "Food & Lifestyle" },
];


export const CAROUSEL_TEMPLATES: ReadonlyArray<CarouselTemplate> = [
  // ─── Educational & Frameworks ──────────────────────────────────────────
  {
    id: "edu-5-step-framework",
    name: "5-Step Mastery Framework",
    description: "Break down complex topics into clear, digestible educational steps with crisp visual cards.",
    niche: "educational",
    category: "educational",
    slideCount: 5,
    topic: "The 5-Step Framework to Scale Any Creative Output",
    tone: "Authoritative, educational, structured",
    topicNiche: "Strategy & Systems",
    ctaKeyword: "FRAMEWORK",
    outputLanguage: "en",
    style: {
      colors: { primary: "#0f172a", background: "#f8fafc", accent: "#3b82f6" },
      fonts: { display: "Outfit", body: "Inter" },
    },
    slides: [
      { type: "hook", headline: "The 5-Step Framework to Scale Output", subheadline: "How top operators build leverage without burning out" },
      { type: "stakes", headline: "The Trap: Working Harder Instead of Smarter", body: "Most creators hit a ceiling because they rely on sheer hours rather than repeatable workflows." },
      { type: "value", headline: "Step 1: Document Every Core Action", body: "Turn your mental checklist into clear SOPs that can be automated or delegated." },
      { type: "receipts", headline: "Step 2: Automate The Repetitive 80%", body: "Free up 15+ hours weekly by scheduling and batching production." },
      { type: "cta", headline: "Save this carousel for your next planning session", body: "Comment 'FRAMEWORK' to get the Notion template" },
    ],
  },
  {
    id: "myth-vs-fact-breakdown",
    name: "Myth vs. Fact Breakdown",
    description: "Debunk popular industry misconceptions with sharp side-by-side contrast.",
    niche: "marketing-agency",
    category: "myth-fact",
    slideCount: 5,
    topic: "3 Social Media Growth Myths You Need to Stop Believing",
    tone: "Punchy, contrarian, evidence-backed",
    topicNiche: "Social Growth",
    ctaKeyword: "TRUTH",
    outputLanguage: "en",
    style: {
      colors: { primary: "#18181b", background: "#fafafa", accent: "#ef4444" },
      fonts: { display: "Archivo Black", body: "Inter" },
    },
    slides: [
      { type: "hook", headline: "3 Industry Myths Costing You Growth", subheadline: "What the algorithms actually reward in 2026" },
      { type: "stakes", headline: "Myth #1: You must post 5x a day", body: "Fact: Consistency beats volume. 3 high-signal posts outperform 15 generic ones every single time." },
      { type: "value", headline: "Myth #2: Hashtags drive reach", body: "Fact: Semantic search and topic categorization now drive 90% of non-follower discovery." },
      { type: "receipts", headline: "Myth #3: Short captions are best", body: "Fact: Dwell time and save rates surge when you provide comprehensive, actionable breakdowns." },
      { type: "cta", headline: "Which myth were you still following?", body: "Comment 'TRUTH' for the algorithmic ranking checklist" },
    ],
  },
  {
    id: "before-after-case-study",
    name: "Transformation / Before & After",
    description: "Showcase client results, workflow transformations, or product evolution with tangible proof.",
    niche: "case-study",
    category: "before-after",
    slideCount: 5,
    topic: "How We 4x'd Inbound Pipeline in 90 Days",
    tone: "Data-driven, executive, transparent",
    topicNiche: "B2B Marketing",
    ctaKeyword: "CASESTUDY",
    outputLanguage: "en",
    style: {
      colors: { primary: "#09090b", background: "#ffffff", accent: "#10b981" },
      fonts: { display: "Outfit", body: "Inter" },
    },
    slides: [
      { type: "hook", headline: "From 5 Leads/Mo to 38 Qualified Inbounds", subheadline: "The 90-day repositioning breakdown" },
      { type: "stakes", headline: "The Starting State: Zero Clear Positioning", body: "Vague messaging attracted low-intent price shoppers and wasted sales capacity." },
      { type: "value", headline: "The Pivot: High-Signal Teardowns", body: "We replaced generic advice with weekly deep dives analyzing specific customer problems." },
      { type: "receipts", headline: "The Result: 4.2x Pipeline Surge", body: "Average deal size doubled from $4.5k to $9.2k within 3 months." },
      { type: "cta", headline: "Want our complete positioning audit rubric?", body: "Comment 'CASESTUDY' and we'll send over the PDF" },
    ],
  },
  {
    id: "thought-leadership-manifesto",
    name: "Thought Leadership & Perspectives",
    description: "Establish strong point of view and industry authority with bold quotes and key takeaways.",
    niche: "personal-branding",
    category: "thought-leadership",
    slideCount: 5,
    topic: "The Future of Agency Work in the Age of Autonomous AI",
    tone: "Visionary, articulate, provocative",
    topicNiche: "Leadership",
    ctaKeyword: "LEADER",
    outputLanguage: "en",
    style: {
      colors: { primary: "#172554", background: "#eff6ff", accent: "#2563eb" },
      fonts: { display: "Outfit", body: "Inter" },
    },
    slides: [
      { type: "hook", headline: "The Death of Billable Hours", subheadline: "Why output-based agencies will dominate the next decade" },
      { type: "stakes", headline: "Selling time is a race to the bottom", body: "When AI cuts production time by 80%, billing by the hour literally penalizes efficiency." },
      { type: "value", headline: "The New Currency: Problem Ownership", body: "Clients don't buy hours; they buy guaranteed outcomes and strategic clarity." },
      { type: "receipts", headline: "How modern teams are pricing", body: "Value-based tiers, performance bonuses, and productized workflows." },
      { type: "cta", headline: "Where do you stand on value-based pricing?", body: "Share your perspective below or comment 'LEADER'" },
    ],
  },
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
