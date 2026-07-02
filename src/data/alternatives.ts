// alternatives.ts — data for 32 /alternative-to-{tool} pages.
// Each entry follows the AlternativeData shape from AlternativePageTemplate.

import type { AlternativeData } from "@/components/marketing/AlternativePageTemplate";

const commonFaq = (tool: string): { q: string; a: string }[] => [
  { q: `Is migrating from ${tool} difficult?`, a: `No — most teams complete their migration in under an hour. You can import your existing content calendar, reconnect your accounts with one click OAuth, and start scheduling immediately. Our support team is available to help with bulk imports.` },
  { q: `How does PostPlanify pricing compare to ${tool}?`, a: `PostPlanify uses flat pricing ($79-$239/mo) vs most competitors that charge per channel. For 10+ social accounts, PostPlanify is typically 30-60% cheaper than ${tool} and similar tools.` },
  { q: `Does PostPlanify support the same platforms as ${tool}?`, a: `Yes — PostPlanify supports 10 platforms: Instagram, Facebook, YouTube, TikTok, X (Twitter), LinkedIn, Pinterest, Threads, Bluesky, and Google Business. We cover the same core networks plus Bluesky and Google Business.` },
  { q: `Can I try PostPlanify before switching?`, a: `Yes — 7-day free trial with full access to all features. No credit card required. You can run it alongside ${tool} during migration.` },
  { q: `Does PostPlanify have the same team features as ${tool}?`, a: `PostPlanify includes shared calendars, approval workflows, post assignments, comments, role-based permissions, and audit logs on Growth and above. White-label reporting is available on the Scale plan.` },
  { q: `Will I lose my content history when I switch?`, a: `No — PostPlanify keeps all your published and scheduled posts with full engagement history. You can export your archive from ${tool} and import it into PostPlanify via CSV.` },
];

const commonVerdict = (tool: string) => ({
  chooseOther: [
    `You only need basic scheduling for 1-3 social accounts`,
    `You're a solo creator with no team collaboration needs`,
    `${tool}'s free plan covers everything you need`,
  ],
  chooseUs: [
    `You manage 5+ social accounts across multiple brands or clients`,
    `You need team collaboration with approvals and roles`,
    `You're tired of ${tool}'s per-channel pricing adding up`,
    `You want AI-powered captions and image generation`,
    `You need bulk scheduling (up to 20 posts at once)`,
  ],
});

const commonProsCons = (tool: string) => ({
  tool: [
    `Established brand with long track record`,
    `Per-channel pricing can be cost-effective for very small accounts`,
    `Limited bulk scheduling capabilities`,
    `Team features locked behind higher tiers`,
    `AI tools limited to captions only`,
    `No native bulk upload`,
  ],
  us: [
    `Flat pricing — predictable cost as you grow`,
    `Bulk schedule up to 20 posts at once`,
    `Team collaboration on every plan (3-12+ users)`,
    `AI captions + AI image generation`,
    `Multi-brand workspaces built-in`,
    `White-label PDF reports`,
    `API + MCP access for Claude, ChatGPT, Gemini, Copilot`,
  ],
});

const commonWhySwitch = (tool: string) => [
  { title: `Per-channel pricing adds up quickly`, description: `${tool}'s per-channel pricing model means your bill grows linearly with every account. PostPlanify's flat pricing stays predictable as you scale.` },
  { title: `Limited beyond basic scheduling`, description: `Most ${tool}-like tools stop at scheduling. PostPlanify includes analytics, social inbox, AI tools, reporting, and team collaboration in one platform.` },
  { title: `Team features locked behind expensive tiers`, description: `${tool} often gates approvals, roles, and audit logs behind the top plan. PostPlanify includes team features on Growth ($79/mo) and above.` },
  { title: `No native bulk scheduling`, description: `Need to upload a CSV of 50 posts? Most ${tool} alternatives require manual entry. PostPlanify accepts bulk uploads and CSV imports natively.` },
];

const commonComparison = (tool: string) => [
  { feature: `Best For`, other: `Solo creators & small teams`, us: `Agencies, teams & businesses` },
  { feature: `Pricing Model`, other: `Per-channel ($${tool === "Hootsuite" ? "99" : "6-12"}/mo/channel)`, us: `$79-$239/mo flat (Enterprise: custom)` },
  { feature: `Cost for 10 Accounts`, other: `$${tool === "Hootsuite" ? "990" : "120"}/mo`, us: `$79/mo (Growth, 15 accounts)` },
  { feature: `Free Plan`, other: `Limited channels & posts`, us: `7-day trial + 14-day money-back` },
  { feature: `Platforms Supported`, other: `${tool === "Hootsuite" ? "13+" : "8-11"}`, us: `10 (incl. Bluesky & Google Business)` },
  { feature: `Team Members`, other: `${tool === "Hootsuite" ? "1-5 per plan" : "Varies"}`, us: `3 / 6 / 12 / Unlimited` },
  { feature: `Workspaces (Multi-Brand)`, other: `Limited or paid add-on`, us: `5 / 15 / 50 (Growth/Premium/Scale)` },
  { feature: `Approval Workflows`, other: `Top tier only`, us: `Premium+ (multi-approver)` },
  { feature: `Analytics & Reporting`, other: `Basic on lower tiers`, us: `All 10 platforms + best time to post + historical trends` },
  { feature: `Social Inbox`, other: `Limited platforms`, us: `Growth+ (7 platforms incl. Threads & Bluesky)` },
  { feature: `AI Tools`, other: `Captions only`, us: `Brand-aware AI assistant (captions + images)` },
  { feature: `Bulk Scheduling`, other: `No native bulk upload`, us: `Up to 20 posts at once` },
  { feature: `White-Label PDF Reports`, other: `No (export only)`, us: `Scale plan` },
  { feature: `API & MCP Access`, other: `No`, us: `API + MCP (Claude, ChatGPT, Gemini, Copilot)` },
];

function makeAlt(tool: string, slug: string, description: string): AlternativeData {
  return {
    slug,
    tool,
    category: "Social Media Scheduler",
    description,
    verdict: commonVerdict(tool),
    prosCons: commonProsCons(tool),
    whySwitch: commonWhySwitch(tool),
    comparisonTable: commonComparison(tool),
    faq: commonFaq(tool),
  };
}

export const ALTERNATIVES: AlternativeData[] = [
  makeAlt("Buffer", "buffer", "A side-by-side comparison of Buffer and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Hootsuite", "hootsuite", "A side-by-side comparison of Hootsuite and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Later", "later", "A side-by-side comparison of Later and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Postbridge", "postbridge", "A side-by-side comparison of Postbridge and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Postiz", "postiz", "A side-by-side comparison of Postiz and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Metricool", "metricool", "A side-by-side comparison of Metricool and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Sprout Social", "sprout-social", "A side-by-side comparison of Sprout Social and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("SocialBee", "socialbee", "A side-by-side comparison of SocialBee and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Planable", "planable", "A side-by-side comparison of Planable and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("SocialPilot", "socialpilot", "A side-by-side comparison of SocialPilot and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("CoSchedule", "coschedule", "A side-by-side comparison of CoSchedule and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Loomly", "loomly", "A side-by-side comparison of Loomly and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Agorapulse", "agorapulse", "A side-by-side comparison of Agorapulse and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Sendible", "sendible", "A side-by-side comparison of Sendible and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Tailwind", "tailwind", "A side-by-side comparison of Tailwind and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Publer", "publer", "A side-by-side comparison of Publer and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Zoho Social", "zoho-social", "A side-by-side comparison of Zoho Social and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Iconosquare", "iconosquare", "A side-by-side comparison of Iconosquare and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Vista Social", "vista-social", "A side-by-side comparison of Vista Social and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Pallyy", "pallyy", "A side-by-side comparison of Pallyy and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("NapoleonCat", "napoleoncat", "A side-by-side comparison of NapoleonCat and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("eClincher", "eclincher", "A side-by-side comparison of eClincher and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Sked Social", "skedsocial", "A side-by-side comparison of Sked Social and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Statusbrew", "statusbrew", "A side-by-side comparison of Statusbrew and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Planoly", "planoly", "A side-by-side comparison of Planoly and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("MeetEdgar", "meetedgar", "A side-by-side comparison of MeetEdgar and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("RecurPost", "recurpost", "A side-by-side comparison of RecurPost and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Sprinklr", "sprinklr", "A side-by-side comparison of Sprinklr and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("HeyOrca", "heyorca", "A side-by-side comparison of HeyOrca and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Hopper HQ", "hopperhq", "A side-by-side comparison of Hopper HQ and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Post Planner", "postplanner", "A side-by-side comparison of Post Planner and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
  makeAlt("Kontentino", "kontentino", "A side-by-side comparison of Kontentino and PostPlanify covering pricing, features, workflow speed, and platform support — so you can pick the right social media management tool for your needs."),
];