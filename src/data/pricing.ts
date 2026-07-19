export type Plan = {
  name: string;
  tagline: string;
  price: string;
  priceSuffix?: string;
  billedYearly?: string;
  savingsBadge?: string;
  isPopular?: boolean;
  ctaText: string;
  ctaHref: string;
  ctaClass?: string;
  everythingIn?: string;
  features: { value?: string; label: string }[];
};

export const PLANS: Plan[] = [
  {
    name: "Growth",
    tagline: "For small teams and solo agency owners managing a few accounts.",
    price: "$79",
    priceSuffix: "/month",
    billedYearly: "$948 billed yearly",
    savingsBadge: "Save $180/yr",
    ctaText: "Try for Free Now",
    ctaHref: "/signup?show_first_signup_message=true",
    ctaClass: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20",
    features: [
      { value: "15", label: "Social Accounts" },
      { value: "5", label: "Workspaces" },
      { value: "3", label: "Users" },
      { label: "Unlimited Posts" },
      { label: "Analytics" },
      { label: "Reply to Comments + DMs" },
      { label: "Bulk Schedule" },
      { label: "Media Library" },
      { label: "Shared Calendar" },
      { label: "Link in Bio" },
      { label: "Full API + MCP Access" },
      { label: "AI Assistant" },
      { value: undefined, label: "Custom Integrations*" },
    ],
  },
  {
    name: "Premium",
    tagline: "For growing agencies with full team collaboration features.",
    price: "$159",
    priceSuffix: "/month",
    billedYearly: "$1908 billed yearly",
    savingsBadge: "Save $360/yr",
    isPopular: true,
    ctaText: "Try for Free Now",
    ctaHref: "/signup?show_first_signup_message=true",
    ctaClass: "bg-green-700 hover:bg-green-800 text-white shadow-green-700/20",
    everythingIn: "Growth",
    features: [
      { value: "30", label: "Social Accounts" },
      { value: "15", label: "Workspaces" },
      { value: "6", label: "Users" },
      { label: "Advanced Analytics" },
      { label: "Reports" },
      { label: "Post Approvals" },
      { label: "Team Comments / @Mentions" },
      { label: "Roles & Permissions" },
      { label: "AI Training & Knowledge" },
      { value: "400", label: "AI Images / mo" },
    ],
  },
  {
    name: "Scale",
    tagline: "For established agencies managing dozens of clients + need white-label.",
    price: "$239",
    priceSuffix: "/month",
    billedYearly: "$2868 billed yearly",
    savingsBadge: "Save $480/yr",
    ctaText: "Try for Free Now",
    ctaHref: "/signup?show_first_signup_message=true",
    ctaClass: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20",
    everythingIn: "Premium",
    features: [
      { value: "100", label: "Social Accounts" },
      { value: "50", label: "Workspaces" },
      { value: "12", label: "Users" },
      { label: "White-Label PDF Reports" },
      { value: "800", label: "AI Images / mo" },
      { label: "Priority Human Support" },
      { label: "Dedicated Onboarding & Migration" },
    ],
  },
  {
    name: "Enterprise",
    tagline: "For larger agencies needing SSO and custom contracts.",
    price: "Custom",
    billedYearly: "Custom billed yearly",
    savingsBadge: "Save 20%",
    ctaText: "Book a Demo",
    ctaHref: "https://cal.com/hasancagli/postplanify-demo-call",
    ctaClass: "bg-blue-800 hover:bg-blue-900 text-white shadow-blue-800/20",
    everythingIn: "Scale",
    features: [
      { value: "Custom", label: "Social Accounts" },
      { value: "Unlimited", label: "Workspaces" },
      { value: "Unlimited", label: "Users" },
      { value: "Unlimited", label: "AI Images / mo" },
      { label: "1:1 Onboarding Call" },
      { label: "Priority Feature Requests" },
      { label: "Private WhatsApp Support" },
    ],
  },
];

export type CompareCategory = {
  name: string;
  bgClass: string;
  rows: {
    label: string;
    values: (string | null)[]; // null = empty/checkmark
  }[];
};

export const COMPARE_CATEGORIES: CompareCategory[] = [
  {
    name: "Platform & Limits",
    bgClass: "bg-blue-50",
    rows: [
      { label: "Social Accounts", values: ["15", "30", "100", "Custom"] },
      { label: "Brands / Workspaces", values: ["5", "15", "50", "Unlimited"] },
      { label: "Scheduled Posts", values: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"] },
    ],
  },
  {
    name: "Scheduling",
    bgClass: "bg-violet-50",
    rows: [
      { label: "Content Calendar", values: [null, null, null, null] },
      { label: "Cross-Platform Posting", values: [null, null, null, null] },
      { label: "Customize Content Per Platform", values: [null, null, null, null] },
      { label: "Draft Posts", values: [null, null, null, null] },
      { label: "Drag & Drop Rescheduling", values: [null, null, null, null] },
      { label: "Bulk Scheduling", values: [null, null, null, null] },
      { label: "Schedule First Comments", values: [null, null, null, null] },
      { label: "Schedule Threads", values: [null, null, null, null] },
      { label: "Posting Queue", values: [null, null, null, null] },
      { label: "Hashtag Manager", values: [null, null, null, null] },
      { label: "Best Time to Post", values: [null, null, null, null] },
    ],
  },
  {
    name: "Content",
    bgClass: "bg-teal-50",
    rows: [
      { label: "Media Library", values: [null, null, null, null] },
      { label: "Cloud Storage", values: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"] },
      { label: "Carousel / Multi-Image Posts", values: [null, null, null, null] },
      { label: "Video Posts", values: [null, null, null, null] },
      { label: "Stories Scheduling", values: [null, null, null, null] },
      { label: "Saved Captions", values: [null, null, null, null] },
    ],
  },
  {
    name: "AI",
    bgClass: "bg-amber-50",
    rows: [
      { label: "AI Training & Knowledge Base", values: [null, null, null, null] },
      { label: "AI Caption Assistant", values: [null, null, null, null] },
      { label: "AI Alt Text Generation", values: [null, null, null, null] },
      { label: "AI Image Generation", values: ["200 / mo", "400 / mo", "800 / mo", "Unlimited"] },
    ],
  },
  {
    name: "Analytics & Reporting",
    bgClass: "bg-emerald-50",
    rows: [
      { label: "Platform Analytics", values: ["Basic", "Advanced", "Advanced", "Advanced"] },
      { label: "Historical Trends", values: ["90 days", "180 days", "Unlimited", "Unlimited"] },
      { label: "Compare Periods", values: [null, null, null, null] },
      { label: "Reports", values: [null, "Advanced", "White-label", "White-label"] },
      { label: "Scheduled Reports", values: [null, null, null, null] },
    ],
  },
  {
    name: "Collaboration",
    bgClass: "bg-rose-50",
    rows: [
      { label: "Team Members", values: ["3", "6", "12", "Unlimited"] },
      { label: "Roles & Permissions", values: [null, null, null, null] },
      { label: "Shared Calendar", values: [null, null, null, null] },
      { label: "Single-Stage Post Approval", values: [null, null, null, null] },
      { label: "Multi-Stage Post Approval", values: [null, null, null, null] },
      { label: "Team Comments + @Mentions", values: [null, null, null, null] },
    ],
  },
  {
    name: "Inbox",
    bgClass: "bg-cyan-50",
    rows: [
      { label: "Social Inbox", values: [null, null, null, null] },
      { label: "AI Reply Drafts", values: [null, null, null, null] },
      { label: "Brand Voice (AI Replies)", values: [null, null, null, null] },
      { label: "AI Suggested Replies", values: [null, null, null, null] },
      { label: "Sentiment & Theme Analysis", values: [null, null, null, null] },
      { label: "Inbox Insights & Reporting", values: [null, null, null, null] },
      { label: "Labels & Assignments", values: [null, null, null, null] },
    ],
  },
  {
    name: "Integrations",
    bgClass: "bg-orange-50",
    rows: [
      { label: "Canva", values: [null, null, null, null] },
      { label: "Google Drive", values: [null, null, null, null] },
      { label: "Unsplash", values: [null, null, null, null] },
      { label: "Dropbox", values: [null, null, null, null] },
      { label: "Developer API + MCP", values: [null, null, null, null] },
    ],
  },
  {
    name: "Support & Extras",
    bgClass: "bg-pink-50",
    rows: [
      { label: "Link in Bio", values: [null, null, null, null] },
      { label: "1:1 Onboarding Call", values: [null, null, null, null] },
      { label: "Priority Feature Requests", values: [null, null, null, null] },
      { label: "WhatsApp Priority Support", values: [null, null, null, null] },
    ],
  },
];

export type CommunityItem = {
  href: string;
  platform: "producthunt" | "twitter" | "web";
  text: string;
  avatar?: string;
  author?: string;
};

export const COMMUNITY_ITEMS: CommunityItem[] = [
  { href: "https://www.producthunt.com/products/postplanify/launches/postplanify", platform: "producthunt", text: "Just launched on Product Hunt" },
  { href: "https://aprovaleges.com.br/", platform: "web", text: "Aprova Leges Agency" },
  { href: "https://x.com/shaheerui/status/1956329991114744184", platform: "twitter", text: "@shaheerui", author: "Shaheer" },
  { href: "https://www.producthunt.com/products/postplanify/launches/postplanify", platform: "producthunt", text: "Loved by 2,150+ teams" },
  { href: "https://x.com/HsanC_/status/1954873218004561950", platform: "twitter", text: "@HsanC_", author: "Hasan Cagli" },
  { href: "https://x.com/oguzbuilds", platform: "twitter", text: "@oguzbuilds", author: "Oğuz" },
];