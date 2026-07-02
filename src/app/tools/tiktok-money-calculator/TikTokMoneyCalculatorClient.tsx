"use client";
import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  Check,
  CheckCircle2,
  Star,
  Sparkles,
  Briefcase,
  LayoutTemplate,
  Eye,
  Target,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Enter your TikTok follower count",
    body: "Input your current TikTok follower count. This forms the base of your earning potential calculation. The more followers you have, the higher your potential earnings from brand deals and sponsorships.",
  },
  {
    step: 2,
    title: "Add your engagement rate",
    body: "Enter your average engagement rate (likes + comments + shares ÷ views × 100). Check TikTok analytics for accurate data. Higher engagement rates significantly increase your earning potential—brands pay premium rates for engaged audiences.",
  },
  {
    step: 3,
    title: "Get your TikTok earnings estimate",
    body: "See your estimated earnings per sponsored post, potential monthly income, and how you compare to industry benchmarks. Use these data-backed numbers to negotiate fair rates with brands and set income goals.",
  },
];

const USE_CASES = [
  {
    Icon: Sparkles,
    title: "Estimate True Earning Potential",
    badge: "Content Creators & Influencers",
    body: "Estimate your true earning potential and set fair rates for brand collaborations. Use data-backed calculations when negotiating with brands on TikTok, ensuring you never undersell your influence. Perfect for nano-influencers (1k-10k), micro-influencers (10k-100k), and established creators scaling their income.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    Icon: Briefcase,
    title: "Evaluate Influencer Rates",
    badge: "Brand Managers & Marketers",
    body: "Evaluate influencer rates and budget accurately for TikTok marketing campaigns. Quickly assess whether creator pricing aligns with industry standards before signing deals. Plan campaign budgets knowing exactly what fair market rates look like across different follower tiers.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    Icon: Target,
    title: "Set Realistic Income Goals",
    badge: "Aspiring TikTok Influencers",
    body: "Set realistic income goals and understand which metrics to focus on for monetization. See exactly how many followers and what engagement rate you need to reach your target income. Use the calculator to stay motivated by tracking your growing earning potential.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    Icon: BarChart3,
    title: "Build Influencer Marketing Proposals",
    badge: "Marketing Agencies",
    body: "Quickly assess creator value when building influencer marketing proposals for clients. Compare potential ROI across different influencer tiers (nano, micro, macro, mega) and recommend the best fit for campaign objectives and budgets.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    Icon: LayoutTemplate,
    title: "Negotiate Brand Partnership Rates",
    badge: "Partnership Negotiations",
    body: "Use data-backed estimates to negotiate fair rates in brand partnerships. Show brands industry benchmarks when they offer below-market compensation. Calculate package rates for multi-post deals, stories, and exclusive content.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    Icon: TrendingUp,
    title: "Track Income Growth Over Time",
    badge: "Income Tracking & Goals",
    body: "Monitor how your earning potential grows as your account metrics improve over time. Recalculate monthly to track progress toward income goals. See exactly how much each 1,000 new followers or 1% engagement increase adds to your earning potential.",
    color: "bg-cyan-100 text-cyan-600",
  },
];

const PRO_TIPS = [
  { title: "Focus on engagement rate, not just follower count", body: "Brands pay for influence, not inflated numbers. The TikTok Money Calculator shows higher income potential when your likes, comments, shares, and saves are strong—even with fewer followers. A 10% engagement rate on 5,000 followers often outearns 1% engagement on 50,000 followers." },
  { title: "Niche down for higher TikTok earnings", body: "Finance, tech, beauty, and health creators command 2-3x higher rates than general entertainment. Use the calculator to compare earnings potential in different niches. Brands pay premium rates to reach audiences with specific purchasing intent rather than broad, unfocused followings." },
  { title: "Leverage your micro-influencer status", body: "Accounts with 5,000-50,000 followers can earn steady income if engagement is high. The calculator proves that micro-influencers often deliver better ROI for brands. Pitch yourself as a 'high-engagement creator' rather than competing on follower count alone." },
  { title: "Track your engagement rate monthly", body: "Your earnings potential changes as your account grows. Recheck with the TikTok Money Calculator after each major milestone (10k, 25k, 50k, 100k followers) to ensure you're charging fairly. Many creators undercharge by 30-50% simply because they haven't updated their rates." },
  { title: "Use calculator results in brand negotiations", body: "Screenshot your TikTok Money Calculator results and include them in your media kit. When brands offer below-market rates, show them industry benchmarks. Data-backed negotiations lead to 20-40% higher rates than accepting first offers." },
  { title: "Diversify beyond the Creator Fund", body: "TikTok's Creator Fund pays only $0.02-$0.04 per 1,000 views—a viral video with 10M views earns just $200-400. Sponsored posts, affiliate marketing, and merchandise bring 10-50x higher revenue. Use the calculator to understand your true sponsorship value." },
  { title: "Highlight audience demographics to brands", body: "Brands care about who follows you, not just how many. Pair your TikTok income estimates with insights about audience location, age, gender, and interests. US-based audiences command 30-50% higher rates than global averages." },
  { title: "Post consistently to maximize earning potential", body: "Posting 1-3x daily grows both followers and engagement faster than sporadic uploads. As your numbers rise, recalculate with the TikTok monetization calculator to see updated earnings potential. Consistency compounds—double your posting frequency, accelerate your income growth." },
  { title: "Build long-term brand partnerships", body: "One-off sponsored posts pay less than ongoing ambassador deals. Use your initial earning estimates as a starting point, then negotiate multi-post packages at 10-20% premium rates. Brands prefer reliable creators over one-time collaborations." },
  { title: "Stack affiliate income on top of sponsorships", body: "Beyond sponsored posts, affiliate links generate passive income from every video. Calculate your base sponsorship earnings, then add potential affiliate commissions (typically 5-30% of sales) for total revenue projections. Top creators earn 40%+ of income from affiliates." },
  { title: "Create a professional media kit with earnings data", body: "Professional media kits with engagement stats, audience demographics, and calculator-backed rate estimates make you look serious. Include past brand collaborations, content samples, and your calculated rate range. This alone can increase brand response rates by 2-3x." },
  { title: "Time your rate increases strategically", body: "Raise rates after viral videos, crossing follower milestones, or completing successful brand campaigns. Rerun the TikTok Money Calculator after each major growth spurt. Creators who update rates quarterly earn 30-50% more annually than those who set-and-forget pricing." },
];

const COMMON_ISSUES = [
  {
    q: "⚠️Earnings estimate seems too low",
    solutions: [
      "Verify your engagement rate is accurate—higher engagement = significantly higher earnings",
      "Niche matters: finance, tech, and beauty creators earn 2-3x more than entertainment",
      "These are industry averages—negotiate higher based on your unique audience value",
      "US-based audiences command 30-50% higher rates than global averages",
      "Consider that micro-influencers with high engagement often outperform larger accounts",
    ],
  },
  {
    q: "⚠️Earnings estimate seems too high",
    solutions: [
      "Double-check your follower count and engagement rate inputs for accuracy",
      "Remember these are estimates—actual rates vary by niche, location, and brand budgets",
      "New creators may need to start below market rates while building portfolio",
      "Engagement rate above 10% is rare—verify your calculation is correct",
      "Some niches (entertainment, memes) pay below these averages despite high reach",
    ],
  },
  {
    q: "⚠️Not sure what engagement rate to use",
    solutions: [
      "Formula: (likes + comments + shares) ÷ views × 100",
      "Use averages from your last 10-20 posts for accuracy (not just viral outliers)",
      "Check TikTok Creator Tools > Analytics for detailed engagement data",
      "Industry average is 3-6%—above 8% is excellent, below 2% needs improvement",
      "Engagement on recent posts matters more than old content",
    ],
  },
  {
    q: "⚠️Want to increase my TikTok earning potential",
    solutions: [
      "Focus on improving engagement rate through interactive content (questions, duets, stitches)",
      "Build a niche audience—specialized creators command premium rates",
      "Post consistently (1-3x daily) to grow followers while maintaining engagement",
      "Respond to comments to build community and boost engagement metrics",
      "Create content that gets saved and shared—these signals increase your value",
    ],
  },
  {
    q: "⚠️Brand offering less than calculator estimate",
    solutions: [
      "Share your calculator results and engagement data as negotiation leverage",
      "Estimates are averages—some brands have smaller budgets, especially startups",
      "Consider total value: brand exposure, portfolio content, future partnership potential",
      "Counter-offer with your calculated rate and justify with engagement metrics",
      "If they can't meet your rate, negotiate for more posts, longer usage rights, or affiliate commission",
    ],
  },
  {
    q: "⚠️Calculator not accounting for all income sources",
    solutions: [
      "This calculator focuses on sponsored posts—your primary income source",
      "Add Creator Fund separately: $0.02-$0.04 per 1,000 views",
      "Factor in affiliate commissions (typically 5-30% of sales you drive)",
      "LIVE gifts, TikTok Shop, and merchandise are additional revenue streams",
      "Total income = sponsored posts + Creator Fund + affiliates + gifts + merch",
    ],
  },
];

const FAQS = [
  { q: "What is a TikTok Money Calculator?", a: "A TikTok Money Calculator (also called a TikTok earnings estimator or income calculator) is a free tool that helps creators estimate how much they could earn from sponsored posts, brand deals, and collaborations on TikTok. It uses your follower count, engagement rate, and 2026 industry benchmarks to calculate a realistic earning range per post and monthly income potential." },
  { q: "How does the TikTok Money Calculator work?", a: "The calculator uses a proven formula based on industry averages: (Followers × Engagement Rate) × a value range (typically $0.01–$0.04 per engaged follower). This produces lower and upper earnings estimates, showing how much you could make from one sponsored TikTok post. Higher engagement rates and niche audiences can push your rates toward the upper range or beyond." },
  { q: "How much does TikTok pay for 1 million views?", a: "TikTok's Creator Fund pays approximately $20-$40 for 1 million views (about $0.02-$0.04 per 1,000 views). However, sponsored brand deals for viral content can pay significantly more—creators with 1 million views on a post often negotiate $500-$5,000+ for brand partnerships, depending on their niche and engagement rate. The Creator Fund alone is rarely enough; most successful TikTokers earn primarily through sponsorships." },
  { q: "How much do TikTokers with 100k followers make?", a: "TikTokers with 100,000 followers (mid-tier influencers) typically earn $500-$2,500 per sponsored post, depending on engagement rate and niche. With a healthy 5% engagement rate and 4-5 brand deals per month, a 100k TikTok creator can earn $2,000-$12,500 monthly. High-value niches like finance, tech, and beauty command rates at the top of this range." },
  { q: "How much do TikTokers with 1 million followers make?", a: "TikTokers with 1 million followers (macro influencers) earn $5,000-$25,000+ per sponsored post on average. Top creators in lucrative niches can command $50,000+ per brand deal. Monthly income for million-follower accounts often ranges from $25,000 to $100,000+ when combining sponsored content, affiliate marketing, and merchandise sales." },
  { q: "What counts as engagement on TikTok?", a: "TikTok engagement includes likes, comments, shares, saves, and video completions. These interactions indicate how active your audience is. Higher engagement rates (5%+ is considered excellent) usually mean higher earnings potential since brands pay premium rates to reach audiences that actively interact with content rather than passive scrollers." },
  { q: "How accurate is the TikTok Money Calculator?", a: "The calculator provides estimated income ranges based on 2026 industry averages across thousands of influencer deals. Actual earnings depend on your specific niche, audience demographics (US/UK audiences pay more), content quality, negotiation skills, and brand budgets. Use it as a data-backed starting point for rate negotiations, not an exact prediction." },
  { q: "How much money can you make on TikTok per 1,000 followers?", a: "On average, TikTok creators earn $5-$25 per 1,000 engaged followers for a sponsored post. For example, an account with 50,000 followers and a 5% engagement rate could earn $125-$625 per post. Nano-influencers (1,000-10,000 followers) with high engagement often outperform larger accounts with disengaged audiences on a per-follower basis." },
  { q: "Does follower count or engagement matter more for TikTok earnings?", a: "Engagement is often more important than raw follower count. A creator with 10,000 highly active followers (8%+ engagement) may earn more than someone with 100,000 followers but only 1% engagement. Brands increasingly prioritize engagement rate, audience trust, and conversion potential over vanity metrics. Focus on building an engaged community, not just growing follower numbers." },
  { q: "Can the calculator estimate monthly TikTok income?", a: "Yes. While the default estimate is per sponsored post, multiply by your monthly brand deal count for total income. For example, if you earn $300 per post and complete 6 brand collaborations monthly, your estimated monthly TikTok sponsorship income is $1,800. Add Creator Fund earnings, affiliate commissions, and gifts for your total TikTok revenue." },
  { q: "What TikTok niches earn the most money?", a: "The highest-paying TikTok niches include: Finance/Investing ($0.05-$0.10 per engaged follower), Technology ($0.04-$0.08), Health & Fitness ($0.03-$0.06), Beauty & Skincare ($0.03-$0.05), Business/Entrepreneurship ($0.04-$0.07), and Travel/Lifestyle ($0.02-$0.05). Comedy and entertainment have massive reach but typically lower CPMs. Choose niches where your audience has purchasing power." },
  { q: "Can I use the TikTok Money Calculator for brand deal negotiations?", a: "Absolutely. Many influencers use TikTok earnings calculators to set fair pricing before negotiating with brands. It provides a data-backed starting point so you don't undervalue your work. Screenshot your results, include them in your media kit, and reference industry rates when brands offer below-market compensation." },
  { q: "Does this tool calculate TikTok Creator Fund earnings?", a: "This calculator focuses on sponsored posts and brand collaborations, which are typically 10-50x more profitable than the Creator Fund. TikTok's Creator Fund pays $0.02-$0.04 per 1,000 views—meaning 1 million views earns only $20-$40. Most successful TikTokers treat Creator Fund income as supplementary and prioritize brand partnerships for primary revenue." },
  { q: "How much does TikTok pay per 1,000 views?", a: "TikTok's Creator Fund pays $0.02-$0.04 per 1,000 views (CPM). This means 100,000 views earns approximately $2-$4, and 1 million views earns $20-$40. For comparison, YouTube pays $1-$5 per 1,000 views through AdSense. This is why TikTok creators focus on sponsored content—a single brand deal can pay more than millions of Creator Fund views." },
  { q: "Is the TikTok Money Calculator free to use?", a: "Yes, completely free. PostPlanify's TikTok Money Calculator requires no sign-up, no email, and no payment. It runs directly in your browser with unlimited use. Calculate earnings for different follower counts and engagement rates as often as you need to plan your content strategy and pricing." },
  { q: "What's the best way to increase my TikTok earnings?", a: "The fastest ways to increase TikTok income: 1) Boost engagement rate by replying to comments and creating interactive content, 2) Niche down to attract higher-paying brand categories, 3) Post consistently (1-3x daily) to grow followers, 4) Build an email list to demonstrate audience ownership, 5) Create a professional media kit with engagement stats, 6) Reach out proactively to brands in your niche rather than waiting for inbound deals." },
  { q: "Can small TikTok accounts make money?", a: "Yes. Accounts with just 1,000-10,000 followers (nano-influencers) regularly earn $5-$50 per sponsored post if they have strong niche focus and high engagement. Many brands specifically seek nano and micro-influencers because they often deliver better ROI, higher engagement rates, and more authentic recommendations than mega-influencers." },
  { q: "Does TikTok pay creators directly through this calculator?", a: "No. This is an independent estimation tool for calculating your market value. TikTok only pays creators directly through: 1) Creator Fund (views-based), 2) TikTok Pulse program (ad revenue sharing), 3) LIVE Gifts (virtual gifts from viewers), 4) TikTok Shop commissions. Our calculator estimates what brands should pay you for sponsored content—your primary income source." },
  { q: "How often should I check my TikTok earning potential?", a: "Recalculate monthly or after significant changes: gaining 10,000+ new followers, viral posts that boost engagement, entering a new niche, or when preparing for brand negotiations. Regular checks ensure you're pricing competitively and not leaving money on the table as your account grows." },
  { q: "Is this calculator updated for 2026?", a: "Yes. The calculator uses current 2026 influencer marketing benchmarks, reflecting the latest brand spending patterns, platform changes, and creator economy trends. TikTok rates have evolved significantly—what creators charged in 2023 is often 20-40% below current market rates." },
  { q: "Can brands use this tool to evaluate influencers?", a: "Absolutely. Brands, marketing agencies, and talent managers use TikTok income calculators to quickly assess whether an influencer's rates align with market standards. It helps both sides of the partnership: creators avoid undercharging, and brands ensure they're paying fair market value for reach and engagement." },
  { q: "Does location affect TikTok earning potential?", a: "Yes, significantly. US-based creators earn 30-50% more than global averages because American audiences have higher purchasing power and brands pay premium rates to reach them. UK, Canada, Australia, and Western Europe also command higher rates. The calculator provides global averages—adjust expectations based on your primary audience location." },
  { q: "Can I embed the TikTok Money Calculator on my website?", a: "Yes. PostPlanify provides a free embeddable iframe widget for blogs, agencies, and content creators to share the calculator on their own sites. No attribution required. This helps spread accurate earnings information and lets your audience calculate their own TikTok income potential directly on your website." },
  { q: "TikTok vs Instagram vs YouTube: Which pays more?", a: "YouTube typically pays highest per view ($1-5 CPM vs TikTok's $0.02-0.04), but TikTok offers fastest audience growth and viral potential. Instagram sits between them for sponsored post rates. Smart creators use TikTok for reach and audience building, then monetize through YouTube AdSense and Instagram brand deals. Diversify across all three for maximum income." },
  { q: "What's the minimum followers needed to make money on TikTok?", a: "There's no official minimum for brand deals—creators with 1,000+ followers receive sponsorship offers if they have engaged audiences. For TikTok's Creator Fund, you need 10,000+ followers and 100,000+ views in the last 30 days. For TikTok LIVE gifts, you need 1,000+ followers. Start monetizing early with nano-influencer deals while growing toward Creator Fund eligibility." },
];

const EARNINGS_BY_FOLLOWER = [
  { tier: "Nano", followers: "1,000 - 10,000", perPost: "$5 - $50", monthly: "$25 - $250", deals: "Product gifting, small collaborations" },
  { tier: "Micro", followers: "10,000 - 100,000", perPost: "$50 - $500", monthly: "$250 - $2,500", deals: "Paid sponsorships, affiliate deals", mostCommon: true },
  { tier: "Mid-Tier", followers: "100,000 - 500,000", perPost: "$500 - $2,500", monthly: "$2,500 - $12,500", deals: "Brand ambassadorships, campaigns" },
  { tier: "Macro", followers: "500,000 - 1M", perPost: "$2,500 - $10,000", monthly: "$12,500 - $50,000", deals: "Long-term partnerships, exclusives" },
  { tier: "Mega", followers: "1M+", perPost: "$10,000 - $50,000+", monthly: "$50,000+", deals: "Celebrity-level deals, equity partnerships" },
];

const PLATFORM_COMPARISON = [
  {
    platform: "TikTok",
    creatorFund: "$0.02 - $0.04",
    sponsoredPost: "$0.01 - $0.04 per engaged follower",
    alternative: "$0.02 - $0.04 per 1,000 views",
    strength: "Viral reach, Gen Z audience, brand awareness",
    color: "from-zinc-700 to-zinc-900",
  },
  {
    platform: "YouTube",
    creatorFund: "$1 - $5 (CPM)",
    sponsoredPost: "$20 - $50 per 1,000 subscribers",
    alternative: "AdSense: $1-5 CPM average",
    strength: "Long-form content, higher CPM, evergreen income",
    color: "from-red-500 to-red-700",
  },
  {
    platform: "Instagram",
    creatorFund: "$0.01 - $0.05",
    sponsoredPost: "$10 - $100 per 1,000 followers",
    alternative: "Reels Play Bonus (invite only)",
    strength: "Visual brands, lifestyle, shopping integration",
    color: "from-pink-500 to-purple-600",
  },
];

const ENGAGEMENT_CALCULATORS = [
  { title: "TikTok Engagement Calculator", body: "Calculate your TikTok engagement rate to understand your audience activity and optimize content performance", href: "/tools/tiktok-engagement-calculator", color: "from-zinc-700 to-zinc-900" },
  { title: "Instagram Engagement Calculator", body: "Measure Instagram engagement rate with likes, comments, and followers to benchmark your performance", href: "/tools/instagram-engagement-calculator", color: "from-pink-500 to-purple-600" },
  { title: "YouTube Engagement Calculator", body: "Analyze YouTube engagement metrics per view or subscriber to improve your channel performance", href: "/tools/youtube-engagement-calculator", color: "from-red-500 to-red-700" },
  { title: "LinkedIn Engagement Calculator", body: "Track LinkedIn post engagement with reactions, comments, shares, and impressions for B2B growth", href: "/tools/linkedin-engagement-calculator", color: "from-blue-600 to-blue-800" },
];

const RELATED_RESOURCES = [
  {
    title: "Scheduler Comparisons & Reviews",
    links: [
      { label: "Best Metricool Alternatives for TikTok", href: "/alternative-to-metricool" },
      { label: "Metricool vs Publer: Which Wins for TikTok?", href: "/compare/metricool-vs-publer" },
      { label: "Metricool Pricing Breakdown 2026", href: "/metricool-pricing" },
      { label: "Best Later Alternatives for TikTok Creators", href: "/alternative-to-later" },
      { label: "Metricool vs Planable Compared", href: "/compare/metricool-vs-planable" },
      { label: "Later Pricing: Is It Worth the Cost?", href: "/later-pricing" },
      { label: "Best Metricool Alternatives for TikTok", href: "/blog/best-metricool-alternatives" },
      { label: "Best Publer Alternatives Compared", href: "/blog/best-publer-alternatives" },
    ],
  },
  {
    title: "Industries & Solutions",
    links: [
      { label: "Social Media for TikTok Creators", href: "/social-media-management-for-tiktok-creators" },
      { label: "Social Media for Comedy Creators", href: "/social-media-management-for-comedy-creators" },
      { label: "Social Media Scheduler for Music Artists", href: "/social-media-scheduler-for-music-artists" },
      { label: "Social Media for Video Creators", href: "/social-media-management-for-video-creators" },
      { label: "Social Media for Influencers", href: "/social-media-management-for-influencers" },
      { label: "Social Media for Content Creators", href: "/social-media-management-for-creators" },
    ],
  },
  {
    title: "Free Tools",
    links: [
      { label: "TikTok Caption Generator", href: "/tools/tiktok-caption-generator" },
      { label: "TikTok Bio Generator", href: "/tools/tiktok-bio-generator" },
      { label: "TikTok Username Generator", href: "/tools/tiktok-username-generator" },
      { label: "TikTok Hashtag Generator", href: "/tools/tiktok-hashtag-generator" },
      { label: "TikTok Line Break Generator", href: "/tools/tiktok-line-break-generator" },
      { label: "TikTok Engagement Calculator", href: "/tools/tiktok-engagement-calculator" },
      { label: "TikTok Safe Zone Checker", href: "/tools/tiktok-safe-zone-checker" },
      { label: "TikTok Username Checker", href: "/tools/tiktok-handle-checker" },
    ],
  },
];

const ARTICLES = [
  { title: "How to Schedule TikTok Posts in 2026", href: "/blog/how-to-schedule-tiktok-posts-in-2025" },
  { title: "Best Time to Post on TikTok", href: "/blog/best-time-to-post-on-tiktok" },
  { title: "How to Do Voiceovers on TikTok", href: "/blog/how-to-do-voiceovers-on-tiktok" },
];

const SOCIAL_ICONS = [
  { label: "TikTok", color: "text-black dark:text-white", d: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
  { label: "Instagram", color: "text-pink-500", d: "M7.8 2h8.4C19.4 22 4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" },
  { label: "Facebook", color: "text-blue-500", d: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z" },
  { label: "X", color: "text-black dark:text-white", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { label: "YouTube", color: "text-red-500", d: "M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" },
  { label: "LinkedIn", color: "text-blue-600", d: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" },
  { label: "Threads", color: "text-black dark:text-white", d: "M12.18 22h-.07c-2.93-.02-5.13-.85-6.55-2.46-1.27-1.44-1.92-3.42-1.93-5.9 0-2.5.66-4.51 1.96-5.97C7.07 6.04 9.32 5.21 12.34 5.21c.07 0 .14 0 .21.01 2.91.05 5.13.88 6.6 2.46 1.31 1.41 1.98 3.37 1.99 5.83v.18c0 2.47-.7 4.43-2.08 5.83-1.43 1.45-3.5 2.27-6.16 2.45-.21.01-.46.02-.72.02zm.04-15.39c-2.49.04-4.34.71-5.5 1.99-1.03 1.16-1.55 2.83-1.55 4.97s.51 3.78 1.5 4.92c1.13 1.28 2.96 1.93 5.45 1.95h.06c2.95 0 5.13-.7 6.49-2.07 1.07-1.08 1.61-2.69 1.61-4.79v-.18c0-2.06-.51-3.66-1.52-4.75-1.16-1.25-2.99-1.9-5.43-1.95z" },
  { label: "Pinterest", color: "text-red-600", d: "M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.11-1.28-.56-2.02-2.38-2.02-3.85 0-3.16 2.24-6.03 6.56-6.03 3.44 0 6.12 2.49 6.12 5.74 0 3.44-2.13 6.2-5.18 6.2-.97 0-1.92-.52-2.26-1.13l-.67 2.37c-.23.86-.86 2.01-1.29 2.7v-.03Z" },
];

const TESTIMONIALS = [
  { name: "Frank Benton", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Ffrank-benton.jpeg&w=96&q=75", text: "It is a <highlight>huge time saver.</highlight> I love that I can access my Canva designs without needing to download anything." },
  { name: "Monta", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fmonta.jpg&w=96&q=75", text: "The <highlight>customer service</highlight> is absolutely awesome. I manage over 13 accounts and some of the videos reachover 500,000 views!" },
  { name: "AprovaLeges", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faprovaleges.jpg&w=96&q=75", text: "PostPlanify has <highlight>transformed our social media management</highlight>. The interface is intuitive, and the scheduling works with precision, allowing the AprovaLeges team to focus on what truly matters: producing quality content." },
  { name: "Shaheer", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fshaheer.jpg&w=96&q=75", text: "postplanify is the <highlight>best ive seen so far</highlight>, has all the features i need." },
  { name: "Aleksandr Heinlaid", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faleksandr-heinlaid.avif&w=96&q=75", text: "PostPlanify mixes AI captions, multi-platform scheduling, and Canva templates. Overall a <highlight>massive time saver</highlight> for agencies." },
  { name: "Tintin", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Ftintin.jpg&w=96&q=75", text: "We're loving PostPlanify. I've been using scheduling tools for years and it's <highlight>by far the best one</highlight>." },
  { name: "Andreas", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Freddit-man-avatar.jpg&w=96&q=75", text: "Really <highlight>helped me manage my time better</highlight> and keep all my posts organized in one place." },
  { name: "Sam", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fsam-cranq.avif&w=96&q=75", text: "It's looking great!! <highlight>Just what I needed</highlight> to make my SM game up to the next level." },
  { name: "PostPlanify User", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Freddit-man-avatar.jpg&w=96&q=75", text: "I love it! I <highlight>fired my social media manager</highlight> and now just use postplanify." },
  { name: "Oguz Doruk", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Foguz-doruk.jpg&w=96&q=75", text: "Been on the $79 plan for 2 months. <highlight>API access and MCP support</highlight> is something most alternatives don't have. Didn't think I'd pay $80/mo just to post on social media, but it <highlight>saves a lot of time</highlight>." },
];

function highlightToHtml(s: string) {
  return s.replace(/<highlight>([^<]+)<\/highlight>/g, '<span class="bg-yellow-100 px-1 rounded font-medium text-primary">$1</span>');
}

/* ------------------------------------------------------------------ */
/*  Section components                                                 */
/* ------------------------------------------------------------------ */

function TikTokHeroIcon() {
  return (
    <svg
      role="img"
      aria-label="TikTok"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="48"
      height="48"
      className="mx-auto"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

const NICHE_OPTIONS = [
  "General",
  "Finance",
  "Tech",
  "Beauty",
  "Health & Fitness",
  "Travel",
  "Business",
  "Comedy",
];

const REGION_OPTIONS = ["Global", "United States", "United Kingdom", "Canada", "Australia"];

const QUALITY_OPTIONS = ["Typical", "Premium", "Top-tier"];

function CalculatorWidget() {
  const [followers, setFollowers] = React.useState(25000);
  const [engagement, setEngagement] = React.useState(5.5);
  const [postsPerMonth, setPostsPerMonth] = React.useState(8);
  const [avgViews, setAvgViews] = React.useState(50000);
  const [niche, setNiche] = React.useState("General");
  const [region, setRegion] = React.useState("Global");
  const [quality, setQuality] = React.useState("Typical");

  // Estimate formula: based on industry averages
  // Per-post low/high band based on engaged followers × per-follower rate
  const engagedFollowers = followers * (engagement / 100);
  const baseRate = 0.02; // USD per engaged follower (mid)

  const nicheMultiplier =
    niche === "Finance" || niche === "Business"
      ? 2.2
      : niche === "Tech"
      ? 1.8
      : niche === "Beauty" || niche === "Health & Fitness"
      ? 1.4
      : niche === "Travel"
      ? 1.2
      : 1;

  const regionMultiplier =
    region === "United States"
      ? 1.4
      : region === "United Kingdom" || region === "Canada" || region === "Australia"
      ? 1.2
      : 1;

  const qualityMultiplier = quality === "Top-tier" ? 1.5 : quality === "Premium" ? 1.2 : 1;

  const perPostMid = Math.max(1, Math.round(engagedFollowers * baseRate * nicheMultiplier * regionMultiplier * qualityMultiplier));
  const perPostLow = Math.max(1, Math.round(perPostMid * 0.4));
  const perPostHigh = Math.round(perPostMid * 1.6);
  const monthly = perPostMid * postsPerMonth;

  const creatorFund = Math.round((avgViews / 1000) * 0.03 * 30); // crude
  const multiple = Math.max(1, Math.round(monthly / Math.max(1, creatorFund)));

  function formatFollowers(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function formatViews(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  return (
    <div className="rounded-xl bg-card text-card-foreground shadow p-6 border-2 border-border">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold">TikTok Money Calculator</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Adjust the sliders below to estimate your sponsored post earnings
      </p>

      <div className="space-y-5">
        {/* Followers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Followers</label>
            <span className="text-sm font-semibold text-primary">{formatFollowers(followers)}</span>
          </div>
          <input
            type="range"
            min={100}
            max={10_000_000}
            step={100}
            value={followers}
            onChange={(e) => setFollowers(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            aria-label="Followers"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>100</span>
            <span>10M+</span>
          </div>
        </div>

        {/* Engagement Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Engagement Rate</label>
            <span className="text-sm font-semibold text-primary">{engagement.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={30}
            step={0.1}
            value={engagement}
            onChange={(e) => setEngagement(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            aria-label="Engagement Rate"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>0.1%</span>
            <span>30%</span>
          </div>
        </div>

        {/* Posts/Month */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Posts/Month</label>
            <span className="text-sm font-semibold text-primary">{postsPerMonth}</span>
          </div>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={postsPerMonth}
            onChange={(e) => setPostsPerMonth(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            aria-label="Posts per month"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>1</span>
            <span>60</span>
          </div>
        </div>

        {/* Avg Views */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Avg Views</label>
            <span className="text-sm font-semibold text-primary">{formatViews(avgViews)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={5_000_000}
            step={1000}
            value={avgViews}
            onChange={(e) => setAvgViews(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            aria-label="Average Views"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>0</span>
            <span>5M</span>
          </div>
        </div>

        {/* Niche / Region / Quality */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Niche</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background h-9 px-2 text-sm"
            >
              {NICHE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background h-9 px-2 text-sm"
            >
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Quality</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background h-9 px-2 text-sm"
            >
              {QUALITY_OPTIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-lg bg-muted/40 p-4 border">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Estimated per post</span>
            <span className="text-2xl font-bold text-primary">${perPostMid}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Low: ${perPostLow}</span>
            <span>High: ${perPostHigh}</span>
          </div>

          <div className="my-3 border-t" />

          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Monthly Potential</span>
            <span className="text-xl font-semibold">${monthly.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{postsPerMonth} posts/month</p>

          <div className="my-3 border-t" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">vs Creator Fund</span>
            <span className="font-semibold text-emerald-600">{multiple}x more potential</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">{formatFollowers(Math.round(engagedFollowers))} engaged followers</span>
            <span className="text-muted-foreground">{engagement.toFixed(1)}% engagement rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoBanner() {
  return (
    <div className="w-full max-w-2xl mx-4 sm:mx-auto my-12">
      <div className="rounded-xl bg-card text-card-foreground shadow p-6 border-4 border-black">
        <div className="text-center space-y-5">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="PostPlanify logo"
                width={24}
                height={24}
                className="rounded-full"
                src="/logo.png"
              />
              <span className="text-md font-semibold">PostPlanify</span>
            </div>
            <p className="text-xl font-semibold">
              Manage All Your Social Accounts Without the Chaos
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Schedule posts, track performance, and collaborate with your team.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-2 my-4">
            {SOCIAL_ICONS.map(({ label, color, d }) => (
              <div
                key={label}
                className={`transition-all duration-200 ${color} hover:opacity-80`}
                title={label}
              >
                <svg
                  role="img"
                  aria-label={label}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                >
                  <path d={d} />
                </svg>
              </div>
            ))}
          </div>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-black text-white hover:bg-zinc-800 font-medium transition-colors"
          >
            Start 7-day Free Trial
          </Link>

          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-2">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 style={{ width: 14, height: 14 }} className="text-emerald-500" />
              Content Calendar
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 style={{ width: 14, height: 14 }} className="text-emerald-500" />
              Full Analytics
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 style={{ width: 14, height: 14 }} className="text-emerald-500" />
              Social Inbox
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {TESTIMONIALS.slice(0, 5).map((t, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  alt={t.name}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-white w-8 h-8 object-cover"
                  src={t.avatar}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} style={{ width: 14, height: 14 }} fill="currentColor" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Trusted by 2150+ businesses
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoCard() {
  return (
    <div className="lg:sticky lg:top-6 max-w-lg w-full">
      <div className="rounded-xl bg-card text-card-foreground shadow p-6 border-4 border-black">
        <div className="text-center space-y-5">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="PostPlanify logo"
                width={24}
                height={24}
                className="rounded-full"
                src="/logo.png"
              />
              <span className="text-md font-semibold">PostPlanify</span>
            </div>
            <p className="text-xl font-semibold">
              Plan Your Content with PostPlanify
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Manage All Your Social Accounts Without the Chaos
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-2 my-4">
            {SOCIAL_ICONS.map(({ label, color, d }) => (
              <div
                key={label}
                className={`transition-all duration-200 ${color} hover:opacity-80`}
                title={label}
              >
                <svg
                  role="img"
                  aria-label={label}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                >
                  <path d={d} />
                </svg>
              </div>
            ))}
          </div>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-black text-white hover:bg-zinc-800 font-medium transition-colors"
          >
            Start 7-day Free Trial
          </Link>

          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-2">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 style={{ width: 14, height: 14 }} className="text-emerald-500" />
              Content Calendar
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 style={{ width: 14, height: 14 }} className="text-emerald-500" />
              Full Analytics
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 style={{ width: 14, height: 14 }} className="text-emerald-500" />
              Social Inbox
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {TESTIMONIALS.slice(0, 5).map((t, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  alt={t.name}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-white w-8 h-8 object-cover"
                  src={t.avatar}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} style={{ width: 14, height: 14 }} fill="currentColor" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Trusted by 2150+ businesses
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {items.map((f, i) => (
        <details key={i} className="group rounded-lg border bg-card overflow-hidden">
          <summary className="cursor-pointer list-none p-4 sm:p-5 flex items-start justify-between gap-3">
            <span className="font-medium text-left">{f.q}</span>
            <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-1 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground leading-relaxed">
            {f.a}
          </div>
        </details>
      ))}
    </div>
  );
}

function CommonIssuesAccordion({ items }: { items: { q: string; solutions: string[] }[] }) {
  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {items.map((issue, i) => (
        <details key={i} className="group rounded-lg border bg-card overflow-hidden">
          <summary className="cursor-pointer list-none p-4 sm:p-5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
              <span className="font-medium text-left">{issue.q}</span>
            </div>
            <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-1 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground">
            <p className="font-medium mb-3">Try these solutions:</p>
            <ul className="space-y-2">
              {issue.solutions.map((s, j) => (
                <li key={j} className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main client                                                         */
/* ------------------------------------------------------------------ */

export function TikTokMoneyCalculatorClient() {
  return (
    <>
      <Header />
      <main>
        {/* Hero + Calculator + Promo */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <TikTokHeroIcon />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">
                TikTok Money Calculator
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Calculate how much TikTokers make per post, per 1,000 views, and monthly. Free TikTok earnings calculator for creators, influencers, and brands. See your income potential instantly—no signup required.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <CalculatorWidget />
              <PromoCard />
            </div>
          </Container>
        </section>

        {/* Plan Your Content with PostPlanify Banner */}
        <PromoBanner />

        {/* How It Works */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Three quick steps to estimate your TikTok earnings and start pricing your sponsored content with confidence.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((step) => (
                <Card key={step.step} className="p-6 text-center">
                  <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-4">
                    <span className="text-lg font-bold">{step.step}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.body}
                  </p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* TikTok Earnings by Follower Count */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">TikTok Earnings by Follower Count</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See how much TikTokers make at different follower levels. Rates vary by niche, engagement, and location.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th scope="col" className="text-left py-3 px-3 font-semibold">Tier</th>
                    <th scope="col" className="text-left py-3 px-3 font-semibold">Followers</th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold">Per Sponsored Post</th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold">Monthly Potential</th>
                    <th scope="col" className="text-left py-3 px-3 font-semibold">Typical Brand Deals</th>
                  </tr>
                </thead>
                <tbody>
                  {EARNINGS_BY_FOLLOWER.map((row) => (
                    <tr key={row.tier} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <th scope="row" className="text-left py-3 px-3 font-medium">
                        {row.tier}
                        {row.mostCommon && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                            Most Common
                          </span>
                        )}
                      </th>
                      <td className="text-left py-3 px-3 text-muted-foreground">{row.followers}</td>
                      <td className="text-center py-3 px-3 font-semibold">{row.perPost}</td>
                      <td className="text-center py-3 px-3 font-semibold">{row.monthly}</td>
                      <td className="text-left py-3 px-3 text-muted-foreground">{row.deals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </section>

        {/* Platform Comparison */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">TikTok vs YouTube vs Instagram: Earnings Comparison</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Compare creator earnings across the major platforms to plan your monetization strategy.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th scope="col" className="text-left py-3 px-3 font-semibold">Platform</th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold">Creator Fund / AdSense</th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold">Sponsored Post Rate</th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold">Alternative Revenue</th>
                    <th scope="col" className="text-left py-3 px-3 font-semibold">Best For</th>
                  </tr>
                </thead>
                <tbody>
                  {PLATFORM_COMPARISON.map((row) => (
                    <tr key={row.platform} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <th scope="row" className="text-left py-3 px-3 font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-br ${row.color}`} />
                          {row.platform}
                        </span>
                      </th>
                      <td className="text-center py-3 px-3 font-mono text-xs">{row.creatorFund}</td>
                      <td className="text-center py-3 px-3 font-mono text-xs">{row.sponsoredPost}</td>
                      <td className="text-center py-3 px-3 font-mono text-xs">{row.alternative}</td>
                      <td className="text-left py-3 px-3 text-muted-foreground">{row.strength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </section>

        {/* Popular Use Cases */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Popular Use Cases</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See how creators, agencies, and brands use the TikTok Money Calculator to make smarter income decisions.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {USE_CASES.map((u, i) => (
                <Card key={i} className="p-6 h-full">
                  <div className={`inline-flex items-center justify-center size-12 rounded-full ${u.color} mb-4`}>
                    <u.Icon className="size-6" />
                  </div>
                  {u.badge && (
                    <span className="inline-flex items-center rounded-full border border-transparent bg-secondary text-secondary-foreground px-2.5 py-0.5 mb-2 text-xs font-semibold">
                      {u.badge}
                    </span>
                  )}
                  <h3 className="font-semibold text-lg mb-2">{u.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {u.body}
                  </p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Pro Tips */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">💡 Pro Tips</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Proven strategies to grow your TikTok income and negotiate higher rates with brand partners.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {PRO_TIPS.map((tip, i) => (
                <Card key={i} className="p-6 h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center rounded-full border bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-medium">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold text-base">{tip.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tip.body}
                  </p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Common Issues & Solutions */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Common Issues &amp; Solutions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The most common creator questions about TikTok earnings — and exactly how to navigate them.
              </p>
            </div>
            <CommonIssuesAccordion items={COMMON_ISSUES} />
          </Container>
        </section>

        {/* FAQs */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about TikTok earnings, sponsored posts, and monetization in 2026.
              </p>
            </div>
            <FaqAccordion items={FAQS} />
          </Container>
        </section>

        {/* Engagement Calculators CTA */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Calculate Your Engagement Across All Platforms</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Higher engagement means higher earnings. Use our free engagement calculators to measure your performance and increase your TikTok income potential.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
              {ENGAGEMENT_CALCULATORS.map((tool) => {
                const platform = tool.title.split(" ")[0];
                const social = SOCIAL_ICONS.find((s) => s.label === platform);
                return (
                  <Link
                    key={tool.title}
                    href={tool.href}
                    className="group"
                  >
                    <div className="rounded-xl bg-card text-card-foreground shadow h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 hover:border-primary/20">
                      <div className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} text-white flex-shrink-0 mb-4`}>
                            <svg role="img" aria-label={tool.title} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" className="w-8 h-8">
                              <path d={social?.d ?? SOCIAL_ICONS[0].d} />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-primary transition-colors">
                              {tool.title}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                              {tool.body}
                            </p>
                            <div className="flex items-center justify-center text-primary font-medium text-sm group-hover:gap-2 transition-all duration-200">
                              <span>Calculate now</span>
                              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform ml-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                View all free social media tools
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </Container>
        </section>

        {/* Related Resources */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Related Resources</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Explore our free tools and helpful articles to maximize your TikTok strategy
              </p>
            </div>

            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground">
                Check out our{" "}
                <Link href="/tiktok-scheduler" className="text-blue-600 underline font-medium">
                  TikTok Scheduler
                </Link>
              </p>
            </div>

            <div className="space-y-8">
              {RELATED_RESOURCES.map((group) => (
                <div key={group.title}>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold">{group.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.links.map((link) => (
                      <Link
                        key={link.href + link.label}
                        href={link.href}
                        className="rounded-xl border bg-card text-card-foreground shadow group hover:shadow-md transition-all duration-200 hover:border-primary/40 cursor-pointer"
                      >
                        <div className="flex flex-col space-y-1.5 p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold tracking-tight text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                {link.label}
                              </div>
                            </div>
                            <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Articles</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ARTICLES.map((a) => (
                    <Link
                      key={a.href}
                      href={a.href}
                      className="rounded-xl border bg-card text-card-foreground shadow group hover:shadow-md transition-all duration-200 hover:border-primary/40"
                    >
                      <div className="p-3">
                        <div className="font-semibold tracking-tight text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                          {a.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* More from the community */}
        <section className="py-12 sm:py-16 px-4 bg-zinc-900 text-white">
          <Container className="max-w-7xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">More from the community.</h2>
            </div>
            <div className="columns-1 sm:columns-2 lg:columns-5 gap-4 px-4 sm:px-6 max-w-7xl mx-auto">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="break-inside-avoid mb-4">
                  <div className="flex flex-col gap-2 bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={t.name} loading="lazy" width={40} height={40} decoding="async" className="w-full h-full object-cover" src={t.avatar} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700 truncate">{t.name}</span>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className="size-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <a
                        href="https://www.producthunt.com/products/postplanify/launches/postplanify"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="View on ProductHunt"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26.245 26.256" width="32" height="32" className="w-6 h-6">
                          <path d="M26.254 13.128c0 7.253-5.875 13.128-13.128 13.128S-.003 20.382-.003 13.128 5.872 0 13.125 0s13.128 5.875 13.128 13.128" fill="#da552f" />
                          <path d="M14.876 13.128h-3.72V9.2h3.72c1.083 0 1.97.886 1.97 1.97s-.886 1.97-1.97 1.97m0-6.564H8.53v13.128h2.626v-3.938h3.72c2.538 0 4.595-2.057 4.595-4.595s-2.057-4.595-4.595-4.595" fill="#fff" />
                        </svg>
                      </a>
                    </div>
                    <p className="text-md leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: highlightToHtml(t.text) }} />
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Connect and publish */}
        <section className="py-12 sm:py-16 px-4 text-center">
          <Container className="max-w-6xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">Connect and publish to all your favorite platforms</h2>
            <p className="text-sm text-muted-foreground/70 mb-10">Powered by official platform APIs — reliable and secure</p>
            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
              {SOCIAL_ICONS.map(({ label, color, d }) => (
                <div key={label} className="flex flex-col items-center space-y-2 max-w-20">
                  <div className={`transition-colors duration-200 ${color} hover:opacity-80`}>
                    <svg
                      role="img"
                      aria-label={label}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width={32}
                      height={32}
                      className="w-8 h-8"
                    >
                      <path d={d} />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}