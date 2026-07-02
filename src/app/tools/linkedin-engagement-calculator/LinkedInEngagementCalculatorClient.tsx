"use client";
import * as React from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Calculator,
  Eye,
  Star,
  CheckCircle2,
  TrendingUp,
  Building2,
  BarChart3,
  Briefcase,
  HandshakeIcon,
  Target,
  HelpCircle,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Users,
} from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";
import { Card } from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const HOW_IT_WORKS = [
  {
    Icon: Calculator,
    title: "Enter your post metrics",
    body: "Input your reactions, comments, shares, and optionally clicks from your LinkedIn post analytics.",
  },
  {
    Icon: Eye,
    title: "Add your impressions",
    body: "Enter the total impressions your post received. This is the base for calculating your engagement rate.",
  },
  {
    Icon: TrendingUp,
    title: "Get your engagement rate",
    body: "See your engagement rate percentage instantly and compare to LinkedIn benchmarks for your industry and profile type.",
  },
];

const BENCHMARKS = [
  { tier: "Starter", range: "500 - 2K", rate: "4% - 8%", insight: "Highest rates due to close professional network and relevant connections" },
  { tier: "Growing", range: "2K - 10K", rate: "3% - 6%", insight: "Strong engagement with expanding professional influence" },
  { tier: "Established", range: "10K - 30K", rate: "2% - 5%", insight: "Creator-level reach with algorithm distribution to non-connections" },
  { tier: "Influencer", range: "30K - 100K", rate: "2% - 4%", insight: "Thought leader status with significant professional influence" },
  { tier: "Top Voice", range: "100K - 500K", rate: "1.5% - 3%", insight: "Industry authority with broad professional reach" },
  { tier: "Celebrity", range: "500K+", rate: "1% - 2.5%", insight: "Massive reach with engagement across diverse professional audiences" },
];

const KEY_TAKEAWAYS = [
  "LinkedIn engagement rates are typically lower than consumer platforms (2-5%) due to professional context",
  "Use impressions (not followers) as the denominator for the most accurate engagement measurement",
  "Personal profiles naturally see 1.5-2x higher engagement than company pages on similar content",
  "Carousel documents and polls typically outperform plain text posts by 1.5-3x",
];

const ENGAGEMENT_GUIDE = [
  { range: "Below 1%", label: "Low", note: "Needs improvement", color: "bg-rose-500" },
  { range: "1% – 2%", label: "Average", note: "Typical company page", color: "bg-amber-500" },
  { range: "2% – 5%", label: "Good", note: "Strong engagement", color: "bg-emerald-500" },
  { range: "5%+", label: "Excellent", note: "Top-tier performance", color: "bg-blue-500" },
];

const USE_CASES = [
  {
    Icon: Sparkles,
    title: "Personal Brand Building",
    body: "Track post performance, build thought leadership credibility, identify content that resonates with your professional network, and grow your influence strategically.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    Icon: Building2,
    title: "Company Page Analytics",
    body: "Measure LinkedIn marketing ROI for business pages, benchmark against competitors, evaluate content effectiveness, and optimize B2B lead generation content.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    Icon: BarChart3,
    title: "Content Strategy & Growth",
    body: "Monitor engagement trends over time, identify content patterns that drive professional visibility, and adjust strategy to maintain healthy engagement as your network grows.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    Icon: Briefcase,
    title: "B2B Marketing & Lead Generation",
    body: "Measure LinkedIn content marketing effectiveness, track which topics drive qualified leads, and optimize conversion-focused content for professional audiences.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    Icon: HandshakeIcon,
    title: "Thought Leadership Development",
    body: "Track engagement on expertise-demonstrating content, build authority in your industry niche, and measure the impact of your professional insights.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    Icon: Target,
    title: "Performance Reporting",
    body: "Generate accurate LinkedIn engagement reports for clients or stakeholders, demonstrate social media ROI, and benchmark performance against industry standards.",
    color: "bg-cyan-100 text-cyan-600",
  },
];

const PRO_TIPS = [
  { title: "Write a compelling hook in the first two lines", body: "LinkedIn truncates at ~140 characters. Use bold statements, surprising stats, or curiosity gaps to get clicks on 'see more.'" },
  { title: "Post during business hours", body: "Peak engagement: Tuesday-Thursday, 8-10 AM and 12-1 PM. Avoid weekends. Use LinkedIn Analytics to find YOUR audience's active times." },
  { title: "Use short paragraphs and line breaks", body: "LinkedIn feeds are scanned, not read deeply. Single-sentence paragraphs with white space increase dwell time and algorithm favor." },
  { title: "Ask thoughtful questions for comments", body: "Specific questions ('What's one tool you couldn't work without?') get more comments than generic prompts. Reply to keep discussions active." },
  { title: "Share personal stories and authentic experiences", body: "Career failures, lessons learned, and vulnerable moments outperform promotional content. Connect personal stories to universal professional themes." },
  { title: "Use carousel documents for educational content", body: "PDF carousels outperform text posts by 1.5-3x. Use 8-12 slides with one point per slide, hook on slide one, CTA on last." },
  { title: "Respond to comments within the first hour", body: "Early engagement velocity boosts distribution. Responding quickly doubles comment count and signals active discussion to the algorithm." },
  { title: "Engage with others before and after posting", body: "Spend 10-15 minutes commenting on others' posts before you post. This primes the algorithm to show your content to those people." },
  { title: "Put external links in comments, not posts", body: "Posts with links see 40-50% less reach. Write value in post, add 'Link in comments', then comment the URL immediately." },
  { title: "Analyze top posts monthly", body: "Review your top 10 posts by engagement. Identify patterns in topics, formats, posting times, and hooks to create a replicable playbook." },
  { title: "Tag people authentically, not randomly", body: "Only tag when directly relevant. Random tagging looks desperate and hurts reputation. Authentic tags often lead to engagement and shares." },
  { title: "Use LinkedIn polls for easy engagement", body: "Polls are low-effort for users and generate high participation. Ask 'Why did you vote that way?' in comments to spark discussion." },
];

const COMMON_ISSUES = [
  {
    q: "Engagement rate seems too low",
    solutions: [
      "LinkedIn engagement rates are typically 2-5%—lower than some consumer platforms due to professional context",
      "Make sure you're using impressions, not followers, as the denominator for accurate rates",
      "Check if you're including all relevant metrics (reactions, comments, shares, and clicks if available)",
      "Company pages naturally see lower rates (1-3%) than personal profiles (3-6%)—compare appropriate benchmarks",
    ],
  },
  {
    q: "Not sure what counts as engagement",
    solutions: [
      "Include: all reaction types (Like, Celebrate, Support, etc.), comments, shares, and clicks",
      "Impressions are views/displays, not engagement—use them as the base denominator",
      "Profile views and connection requests aren't typically included in post engagement calculations",
      "For company pages, include link clicks if tracking website traffic",
    ],
  },
  {
    q: "Company page vs personal profile metrics",
    solutions: [
      "Company pages have access to more detailed analytics including click data and demographics",
      "Personal profiles show basic metrics: impressions, reactions, comments, shares",
      "The engagement formula works identically for both—just include available metrics",
      "Personal profiles typically see 1.5-2x higher engagement than company pages on similar content",
    ],
  },
  {
    q: "Engagement varies significantly between posts",
    solutions: [
      "This is normal—some topics, formats, and posting times naturally perform better",
      "Calculate averages across 10-20 posts for a reliable baseline engagement rate",
      "Carousels and polls typically outperform plain text—factor format into analysis",
      "Check if hooks, posting time, or topics correlate with performance differences",
    ],
  },
  {
    q: "Want to improve my LinkedIn engagement rate",
    solutions: [
      "Write compelling hooks in the first two lines—before the \"see more\" truncation",
      "Post during business hours (Tuesday-Thursday mornings typically perform best)",
      "Respond to all comments within the first hour to boost algorithmic distribution",
      "Avoid external links in posts—put them in comments instead for better reach",
    ],
  },
  {
    q: "Metrics from LinkedIn don't match calculator",
    solutions: [
      "LinkedIn may round or delay metrics—check the exact numbers in your analytics",
      "Ensure you're pulling data from the same time period (engagement accumulates over days)",
      "Some LinkedIn metrics update with a delay of 24-48 hours",
      "Use consistent measurement timing for accurate trend tracking",
    ],
  },
];

const FAQS = [
  {
    q: "What is LinkedIn engagement rate?",
    a: "LinkedIn engagement rate measures how actively your network interacts with your content relative to exposure. It's calculated by dividing total engagements (reactions, comments, shares, clicks) by impressions, then multiplying by 100 to get a percentage. LinkedIn uses impressions (how many times your post was shown) rather than followers as the denominator because not all followers see every post. This metric is crucial for professionals building thought leadership, B2B marketers, and companies measuring content performance.",
  },
  {
    q: "How do you calculate LinkedIn engagement rate?",
    a: "The standard LinkedIn engagement rate formula is: ((Reactions + Comments + Shares + Clicks) ÷ Impressions) × 100. For personal profiles without click data, use: ((Reactions + Comments + Shares) ÷ Impressions) × 100. Some marketers calculate by followers instead: ((Reactions + Comments + Shares) ÷ Followers) × 100, but impression-based is more accurate since LinkedIn's algorithm doesn't show posts to all followers. Always specify which formula you're using when comparing rates or reporting to clients.",
  },
  {
    q: "What is a good engagement rate on LinkedIn in 2026?",
    a: "A good LinkedIn engagement rate in 2026 typically ranges from 2-5% by impressions. Rates above 5% are considered excellent, while 1-2% is average for most accounts. Personal profiles often see higher rates (3-6%) than company pages (1-3%) because LinkedIn prioritizes individual voices over brand content. Industry matters significantly—B2B tech and professional services often see lower rates than lifestyle or career-focused content. Top thought leaders may see 8-15% on their best posts.",
  },
  {
    q: "What is a good LinkedIn engagement rate for 1,000 followers?",
    a: "Accounts with around 1,000 followers on LinkedIn typically see engagement rates of 4-8% by impressions or 3-6% by followers. At this stage, your network is likely highly relevant—first-degree connections who genuinely care about your content. Focus on consistent posting (3-5 times per week), responding to every comment, and building genuine relationships. This early engagement establishes your credibility and trains LinkedIn's algorithm to distribute your content more widely.",
  },
  {
    q: "What is a good LinkedIn engagement rate for 10K followers?",
    a: "At 10K followers, a good LinkedIn engagement rate is 3-6% by impressions. This is often called the 'Creator' threshold where LinkedIn may offer creator mode features. Your content now reaches beyond your immediate network through the algorithm. Focus on understanding which topics and formats resonate—carousel documents often outperform text posts at this stage. Brands and recruiters actively notice creators at this level, so consistent engagement becomes increasingly valuable for opportunities.",
  },
  {
    q: "What is a good LinkedIn engagement rate for 50K+ followers?",
    a: "For accounts with 50K+ followers, engagement rates of 2-4% by impressions are typical for LinkedIn influencers. While percentages decrease at scale (more passive followers), 2% of 50K+ impressions still generates substantial engagement. Top LinkedIn creators maintain 3-5% through highly valuable, conversation-starting content. At this level, quality matters more than quantity—one viral post can generate more impact than 20 average ones. Focus on content that sparks meaningful discussion in comments.",
  },
  {
    q: "Why is LinkedIn engagement rate important?",
    a: "LinkedIn engagement rate matters for multiple reasons: it directly influences algorithm distribution (higher engagement = more reach to non-connections), it builds professional credibility and thought leadership, it's essential for B2B marketing ROI measurement, it affects lead generation and business opportunities, and it determines visibility for job seekers and recruiters. Unlike consumer social platforms, LinkedIn engagement often translates directly to professional opportunities—partnerships, speaking gigs, job offers, and sales leads.",
  },
  {
    q: "Does LinkedIn engagement rate affect the algorithm?",
    a: "Yes, engagement significantly impacts LinkedIn's algorithm. The algorithm evaluates: early engagement velocity (interactions in the first hour are crucial), dwell time (how long people read your post), comment quality and length (meaningful comments boost more than 'Great post!'), engagement from your target audience, and whether people click 'see more' to expand long posts. High early engagement triggers distribution to second and third-degree connections, dramatically expanding reach. The algorithm particularly values comments and shares over simple reactions.",
  },
  {
    q: "How can I increase my engagement rate on LinkedIn?",
    a: "To boost LinkedIn engagement: write a compelling hook in the first two lines (before 'see more'), use short paragraphs with line breaks for readability, post during business hours (Tuesday-Thursday mornings work best), ask thoughtful questions that invite responses, share personal stories and authentic experiences, use carousel documents for educational content, respond to every comment within the first hour, engage with others' content before and after posting, avoid external links in posts (put them in comments), and analyze top performers to identify winning patterns.",
  },
  {
    q: "What is the average LinkedIn engagement rate by industry?",
    a: "Average LinkedIn engagement rates vary significantly by industry in 2026: Higher Education & Training (4-6%), Non-Profit & Social Impact (3-5%), HR & Recruiting (3-5%), Marketing & Advertising (2-4%), Technology & SaaS (2-4%), Consulting & Professional Services (2-4%), Healthcare (2-3%), Finance & Banking (1.5-3%), Legal (1.5-2.5%), Manufacturing (1-2%). B2B industries with passionate professional communities typically see higher engagement. Personal stories and career insights outperform promotional content across all industries.",
  },
  {
    q: "Should I calculate engagement by impressions or followers?",
    a: "For LinkedIn, impression-based engagement is more meaningful because LinkedIn's algorithm shows posts to varying percentages of your followers based on predicted relevance. A post might reach 20% of followers or 200%+ (when it goes semi-viral to non-followers). Impression-based rates measure actual content performance. Follower-based rates are useful for overall account health and comparing with competitors whose impression data you can't see. For client reporting, use impressions; for competitive benchmarking, use followers.",
  },
  {
    q: "What counts as engagement on LinkedIn?",
    a: "LinkedIn engagement includes: Reactions (Like, Celebrate, Support, Love, Insightful, Funny), Comments (including replies—which count for the original poster), Shares (reposts to feeds), Clicks (on links, images, or 'see more'), Follows from the post, Saves (bookmarking posts), and Profile visits from content. For engagement rate calculations, standard formulas use Reactions + Comments + Shares. Company pages also see click data. Dwell time isn't visible but heavily influences algorithm distribution.",
  },
  {
    q: "How often should I track my LinkedIn engagement rate?",
    a: "Track LinkedIn engagement per-post within 24-48 hours (peak distribution window), weekly for trend analysis, and monthly for strategic planning. LinkedIn posts can gain engagement for 3-7 days (unlike Twitter's short lifespan), so track final performance after a week. Use LinkedIn Analytics (native for personal profiles and company pages) or tools like PostPlanify for comprehensive tracking. Document top performers to identify patterns in topics, formats, posting times, and hook styles.",
  },
  {
    q: "What is a viral engagement rate on LinkedIn?",
    a: "Viral LinkedIn posts typically show engagement rates of 8-15%+ by impressions, with exceptional virality reaching 20%+. Signs of viral content include: engagement rate increasing over time (not decreasing after initial spike), high comment-to-reaction ratio, meaningful discussion threads in comments, significant share volume, notifications about post performance from LinkedIn, and impressions exceeding your follower count by 3-10x. Note that controversial opinions can drive engagement but may damage professional reputation—consider quality, not just quantity.",
  },
  {
    q: "Does LinkedIn company page engagement differ from personal profiles?",
    a: "Yes, company pages and personal profiles have distinct engagement patterns. Company pages typically see: lower engagement rates (1-3% vs 3-6% for personal), more emphasis on click-through to websites, access to detailed analytics including demographics, ability to boost posts with ads, and different algorithm treatment (LinkedIn prioritizes people over brands). For best results, have employees share company content from personal profiles, or use executive thought leadership to humanize the brand. Employee advocacy often outperforms company page posting.",
  },
  {
    q: "How do LinkedIn articles affect engagement compared to posts?",
    a: "LinkedIn articles and regular posts serve different purposes. Regular posts: appear in feeds, get immediate engagement, benefit from algorithm distribution, and drive conversation. Articles: appear on your profile, get less initial visibility, build long-form authority, rank in Google searches, and provide evergreen value. Posts typically generate 5-10x more engagement than articles because of feed placement. Use posts for engagement and visibility, articles for SEO and comprehensive thought leadership. Promote articles through regular posts for best results.",
  },
  {
    q: "How do carousel documents perform on LinkedIn?",
    a: "LinkedIn carousel documents (PDF uploads that swipe like slides) often dramatically outperform regular text posts. Carousels encourage: longer dwell time (swiping through slides), higher completion rates, more saves for reference, and significant shares due to educational value. Average carousel engagement is 1.5-3x higher than text posts. Best practices: use 8-12 slides, strong visual design, one key point per slide, hook on slide one, CTA on last slide. Educational carousels ('10 Tips for...') perform exceptionally well for building authority.",
  },
  {
    q: "Does buying followers or engagement work on LinkedIn?",
    a: "No, buying followers or engagement on LinkedIn is ineffective and risky. Fake followers never engage authentically, dramatically lowering your engagement rate. LinkedIn's algorithm detects suspicious patterns and may reduce your reach. The professional nature of LinkedIn means fake engagement is easily spotted by real users—damaging your credibility. LinkedIn actively removes fake accounts and may restrict violating profiles. Professional reputation matters most on LinkedIn—focus on genuine value and authentic relationships for sustainable growth.",
  },
  {
    q: "How do brands and recruiters evaluate LinkedIn engagement?",
    a: "When evaluating LinkedIn profiles, brands and recruiters analyze: consistent engagement rate across posts (not just viral outliers), comment quality and professional discussion, follower-to-engagement ratio, content relevance to their industry, thought leadership depth, network quality (who's engaging), and posting consistency. For influencer partnerships, B2B brands look for 3%+ engagement, relevant audience demographics, and authentic expertise demonstration. High engagement on LinkedIn signals industry authority and genuine influence—unlike inflated metrics on consumer platforms.",
  },
  {
    q: "What is the LinkedIn engagement rate formula for company pages?",
    a: "For LinkedIn company pages, the standard formula is: ((Reactions + Comments + Shares + Clicks) ÷ Impressions) × 100. Company pages have access to click data that personal profiles don't see. For follower-based comparison: ((Reactions + Comments + Shares) ÷ Followers) × 100. When reporting to stakeholders, also include: click-through rate (Clicks ÷ Impressions × 100), follower growth rate, and top-performing content analysis. Compare performance to industry benchmarks—company pages typically see 1-3% engagement versus 3-6% for personal profiles.",
  },
  {
    q: "Can I track engagement rate for each LinkedIn post?",
    a: "Absolutely. Access post analytics by clicking the analytics icon below any post. For personal profiles, you'll see impressions, reactions, comments, and shares. For company pages, add clicks and follower demographics. Apply the formula: ((Reactions + Comments + Shares) ÷ Impressions) × 100. Track per-post performance in a spreadsheet: posting date/time, topic, format (text/image/carousel/video), hook style, hashtags, impressions, engagements, and calculated rate. Review weekly to identify winning patterns and optimize future content.",
  },
  {
    q: "How does LinkedIn Live affect engagement?",
    a: "LinkedIn Live streams generate significantly higher engagement than regular posts—typically 7-24x more engagement according to LinkedIn data. Live engagement includes: real-time comments, reactions during broadcast, replay views and engagements, and post-broadcast conversation. LinkedIn prioritizes Live content in notifications and feeds. Calculate Live engagement: (Comments + Reactions + Peak Viewers) ÷ Followers × 100. Strong Live engagement (5-10% viewer participation) indicates an active, invested professional network. Lives are excellent for Q&As, announcements, and expert discussions.",
  },
  {
    q: "What's the difference between engagement rate and click-through rate?",
    a: "Engagement rate measures total interactions (reactions, comments, shares, clicks) relative to impressions—showing overall content resonance. Click-through rate (CTR) specifically measures clicks on links relative to impressions—showing conversion intent. High engagement with low CTR suggests entertaining but not action-driving content. High CTR with low engagement suggests useful content that doesn't inspire sharing. For B2B marketing, both matter: engagement builds awareness and credibility, CTR drives leads. Optimize for engagement on brand-building content, CTR on conversion-focused posts.",
  },
  {
    q: "Why does LinkedIn engagement rate fluctuate between posts?",
    a: "LinkedIn engagement fluctuates due to: posting time (business hours perform better), content topic (some topics naturally resonate more), format differences (carousels vs text vs video), hook effectiveness (first two lines determine 'see more' clicks), algorithm distribution variations, audience mood and external events, competition from other content, and seasonal patterns (summer and holidays often see lower engagement). This variation is normal. Track 10-post rolling averages to identify true trends. Identify your 'baseline' content versus 'breakthrough' performers for strategic insights.",
  },
  {
    q: "How do hashtags affect LinkedIn engagement?",
    a: "LinkedIn hashtags help categorize content for discovery but don't impact engagement as strongly as on Instagram. Best practices: use 3-5 relevant hashtags (more appears spammy), mix popular hashtags (#leadership, #marketing) with niche ones (#b2bsaas, #hrtech), place hashtags at the end of posts or in first comment, follow hashtags relevant to your industry, and create branded hashtags for campaigns. Hashtags marginally help reach beyond your network but hook quality and content value matter far more for engagement. Don't rely on hashtags as a primary growth strategy.",
  },
  {
    q: "What tools can I use to track LinkedIn engagement rate?",
    a: "Track LinkedIn engagement using: this free LinkedIn Engagement Rate Calculator for quick calculations, LinkedIn Analytics (native for personal profiles and company pages), PostPlanify for comprehensive multi-platform scheduling and analytics, Shield App or AuthoredUp for advanced LinkedIn-specific analytics, Hootsuite or Sprout Social for enterprise social management, and Taplio for LinkedIn creator analytics. For accurate tracking, use consistent tools and formulas over time. Export data monthly to spreadsheets for trend analysis and content strategy optimization.",
  },
  {
    q: "How do I compare my engagement rate to competitors on LinkedIn?",
    a: "To benchmark LinkedIn engagement against competitors: identify 5-10 professionals or companies in similar roles/industries, manually calculate their engagement rates on recent posts using visible reactions, comments, and shares (you can't see their impressions—use follower count as proxy), track monthly, and calculate averages. Tools like Shield or Sociality.io can automate some tracking. Focus on similar follower counts since rates decrease with audience size. Note that company page engagement is typically lower than personal profiles—compare like with like.",
  },
];

const RELATED_RESOURCES = [
  {
    title: "Check out our LinkedIn Scheduler",
    links: [
      { label: "LinkedIn Scheduler — Post in advance", href: "/linkedin-scheduler" },
    ],
  },
  {
    title: "Scheduler Comparisons & Reviews",
    links: [
      { label: "Best Sprout Social Alternatives for LinkedIn", href: "/compare/sprout-social" },
      { label: "Best Hootsuite Alternatives for LinkedIn", href: "/compare/hootsuite" },
      { label: "Buffer vs Hootsuite: Which is Better for LinkedIn?", href: "/compare/buffer" },
      { label: "Hootsuite Pricing: Is It Worth $249/mo?", href: "/blog/hootsuite-pricing" },
    ],
  },
  {
    title: "Free Tools",
    links: [
      { label: "LinkedIn Post Generator", href: "/tools/linkedin-post-generator" },
      { label: "LinkedIn Hashtag Generator", href: "/tools/linkedin-hashtag-generator" },
      { label: "LinkedIn Character Counter", href: "/tools/linkedin-character-counter" },
    ],
  },
];

const ARTICLES = [
  { title: "How to Calculate LinkedIn Engagement Rate", href: "/blog/linkedin-engagement-rate" },
  { title: "LinkedIn Algorithm 2026: Complete Guide", href: "/blog/linkedin-algorithm" },
  { title: "Best Time to Post on LinkedIn", href: "/blog/best-time-to-post-linkedin" },
  { title: "LinkedIn Marketing Strategy for B2B", href: "/blog/linkedin-marketing-strategy" },
];

const SOCIAL_ICONS = [
  { label: "TikTok", color: "text-black dark:text-white", d: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
  { label: "Instagram", color: "text-pink-500", d: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" },
  { label: "Facebook", color: "text-blue-500", d: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z" },
  { label: "X", color: "text-black dark:text-white", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { label: "YouTube", color: "text-red-500", d: "M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" },
  { label: "LinkedIn", color: "text-blue-600", d: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" },
  { label: "Threads", color: "text-black dark:text-white", d: "M12.18 22h-.07c-2.93-.02-5.13-.85-6.55-2.46-1.27-1.44-1.92-3.42-1.93-5.9 0-2.5.66-4.51 1.96-5.97C7.07 6.04 9.32 5.21 12.34 5.21c.07 0 .14 0 .21.01 2.91.05 5.13.88 6.6 2.46 1.31 1.41 1.98 3.37 1.99 5.83v.18c0 2.47-.7 4.43-2.08 5.83-1.43 1.45-3.5 2.27-6.16 2.45-.21.01-.46.02-.72.02zm.04-15.39c-2.49.04-4.34.71-5.5 1.99-1.03 1.16-1.55 2.83-1.55 4.97s.51 3.78 1.5 4.92c1.13 1.28 2.96 1.93 5.45 1.95h.06c2.95 0 5.13-.7 6.49-2.07 1.07-1.08 1.61-2.69 1.61-4.79v-.18c0-2.06-.51-3.66-1.52-4.75-1.16-1.25-2.99-1.9-5.43-1.95z" },
  { label: "Pinterest", color: "text-red-600", d: "M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.11-1.28-.56-2.02-2.38-2.02-3.85 0-3.16 2.24-6.03 6.56-6.03 3.44 0 6.12 2.49 6.12 5.74 0 3.44-2.13 6.2-5.18 6.2-.97 0-1.92-.52-2.26-1.13l-.67 2.37c-.23.86-.86 2.01-1.29 2.7v-.03Z" },
  { label: "Bluesky", color: "text-sky-500", d: "M6.3 3.71A4.6 4.6 0 0 1 12 1.5a4.6 4.6 0 0 1 5.7 2.21A4.73 4.73 0 0 1 18.7 9c-.13.27-.57.66-.81.84-.39.31-.71.43-1.04.43-.51 0-.84-.27-1.07-.6-.24-.34-.4-.81-.55-1.28a14.13 14.13 0 0 0-.41-1.21c-.18-.43-.49-.94-.97-1.36a3.21 3.21 0 0 0-3.69 0c-.48.42-.78.93-.97 1.36a14.18 14.18 0 0 0-.41 1.21c-.16.47-.31.94-.55 1.28-.23.33-.56.6-1.07.6-.33 0-.65-.12-1.04-.43a3.4 3.4 0 0 1-.81-.84A4.73 4.73 0 0 1 6.3 3.7zM3.6 12.92a3.74 3.74 0 0 1 1.16-.15c.55 0 1.13.13 1.69.46.49.29.97.74 1.31 1.36.34.62.55 1.4.55 2.32 0 1.04-.21 2.07-.55 2.95a7.83 7.83 0 0 1-1.35 2.34 6.66 6.66 0 0 1-1.74 1.55c-.55.32-.99.45-1.27.45a.8.8 0 0 1-.27-.04c-.06-.02-.1-.05-.12-.1-.04-.05-.04-.11-.04-.18v-.06c.04-.07.13-.14.31-.27.18-.14.42-.31.7-.59.27-.27.58-.63.86-1.1.28-.48.54-1.06.71-1.78.16-.71.26-1.55.26-2.17 0-.5-.12-.84-.32-1.07-.2-.23-.5-.36-.92-.36-.43 0-.85.13-1.31.43a6.49 6.49 0 0 0-1.34 1.28 7.83 7.83 0 0 1-.97-1.36 5.16 5.16 0 0 1 .41-2.65c.36-.84.95-1.66 1.85-2.21.92-.55 2.07-.95 3.45-.95z" },
  { label: "Google Business", color: "text-blue-500", d: "M22.5 12c0 5.8-4.7 10.5-10.5 10.5S1.5 17.8 1.5 12 6.2 1.5 12 1.5c2.7 0 5.2 1 7.1 2.7L16 7.3a7.5 7.5 0 1 0 5.2 12.7h-7.7v-3h11.7c.2.8.3 1.7.3 2.5z" },
];

const TESTIMONIAL_AVATARS = [
  "https://postplanify.com/_next/image?url=%2Ftestimonials%2Ffrank-benton.jpg&w=64&q=75",
  "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fmonta.jpg&w=64&q=75",
  "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faprovaleges.jpg&w=64&q=75",
  "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fshaheer.jpg&w=64&q=75",
  "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faleksandr-heinlaid.jpg&w=64&q=75",
];

/* Inline social media icons (lucide-react 1.6.0 doesn't ship them) */
const SOCIAL_SVG = {
  Instagram: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z",
  Youtube: "M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z",
  Linkedin: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z",
  Facebook: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z",
  Twitter: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  Tiktok: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
};

function PlatformIcon({ name, className = "size-6" }: { name: keyof typeof SOCIAL_SVG; className?: string }) {
  return (
    <svg
      role="img"
      aria-label={name}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d={SOCIAL_SVG[name]} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Section components                                                 */
/* ------------------------------------------------------------------ */

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
              Schedule Your LinkedIn Posts In Seconds
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Upload and schedule in advance. Your posts go live even when you&apos;re offline.
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
              {TESTIMONIAL_AVATARS.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  alt="User profile"
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-white w-8 h-8 object-cover"
                  src={src}
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

function EngagementCalculatorWidget() {
  const [byFollowers, setByFollowers] = React.useState(false);
  const [reactions, setReactions] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [shares, setShares] = React.useState("");
  const [clicks, setClicks] = React.useState("");
  const [denom, setDenom] = React.useState("");

  const reactionsN = parseFloat(reactions) || 0;
  const commentsN = parseFloat(comments) || 0;
  const sharesN = parseFloat(shares) || 0;
  const clicksN = parseFloat(clicks) || 0;
  const denomN = parseFloat(denom) || 0;

  const total = reactionsN + commentsN + sharesN + clicksN;
  const rate = denomN > 0 ? (total / denomN) * 100 : 0;

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-2xl font-bold mb-4">Calculate LinkedIn Engagement Rate</h2>
      <div className="flex items-center gap-6 mb-2">
        <span className="text-sm font-medium">Calculate by:</span>
        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setByFollowers(false)}>
          <span className="inline-flex items-center justify-center size-4 rounded border border-input bg-background">
            {!byFollowers && <Check className="size-3 text-foreground" />}
          </span>
          <span className="text-sm">Per Impression (Default)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setByFollowers(true)}>
          <span className="inline-flex items-center justify-center size-4 rounded border border-input bg-background">
            {byFollowers && <Check className="size-3 text-foreground" />}
          </span>
          <span className="text-sm">Per Follower</span>
        </label>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Most accurate for measuring actual content performance
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Reactions</label>
          <input
            type="number"
            value={reactions}
            onChange={(e) => setReactions(e.target.value)}
            placeholder="0"
            className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Comments</label>
          <input
            type="number"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="0"
            className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Shares</label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="0"
            className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Clicks (optional)</label>
          <input
            type="number"
            value={clicks}
            onChange={(e) => setClicks(e.target.value)}
            placeholder="0"
            className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-2">
            {byFollowers ? "Followers" : "Impressions"}
          </label>
          <input
            type="number"
            value={denom}
            onChange={(e) => setDenom(e.target.value)}
            placeholder="0"
            className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="rounded-lg bg-muted/30 p-4">
        <p className="text-sm font-medium mb-1">
          Engagement Rate: <span className="ml-2 inline-flex items-center justify-center w-8 h-8 rounded-full border bg-background text-base font-semibold">{denomN > 0 ? Math.round(rate * 10) / 10 : "0"}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {byFollowers ? "Add followers to calculate" : "Add impressions to calculate"}
        </p>
      </div>
    </Card>
  );
}

const OTHER_PLATFORMS: { name: keyof typeof SOCIAL_SVG; label: string; href: string; color: string }[] = [
  { name: "Instagram", label: "Instagram Engagement Calculator", href: "/tools/instagram-engagement-calculator", color: "text-pink-500" },
  { name: "Tiktok", label: "TikTok Engagement Calculator", href: "/tools/tiktok-engagement-calculator", color: "text-black dark:text-white" },
  { name: "Youtube", label: "YouTube Engagement Calculator", href: "/tools/youtube-engagement-calculator", color: "text-red-500" },
  { name: "Facebook", label: "Facebook Engagement Calculator", href: "/tools/facebook-engagement-calculator", color: "text-blue-500" },
  { name: "Twitter", label: "X (Twitter) Engagement Calculator", href: "/tools/twitter-engagement-calculator", color: "text-black dark:text-white" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function LinkedInEngagementCalculatorClient() {
  return (
    <>
      <Header />

      <main>
        {/* HERO */}
        <section className="py-8">
          <Container>
            <div className="flex flex-col items-center gap-4">
              <div className="text-blue-600 p-2 mb-2">
                <svg
                  aria-label="LinkedIn"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ width: 40, height: 40 }}
                >
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </div>
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  LinkedIn Engagement Rate Calculator
                </h1>
                <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
                  Measure your LinkedIn content performance with our free engagement rate calculator. Enter your reactions, comments, shares, and impressions to get instant insights and compare to industry benchmarks.
                </p>
              </div>

              <div className="w-full max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-6 items-start">
                  <div className="w-full min-w-0">
                    <EngagementCalculatorWidget />
                  </div>

                  <PromoCard />
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-16 lg:py-20">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Calculate your LinkedIn engagement rate in three simple steps.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {HOW_IT_WORKS.map((s, i) => (
                <Card key={i} className="p-6">
                  <div className="inline-flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary mb-3">
                    <s.Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* BENCHMARKS */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 flex items-center justify-center gap-2">
                  <TrendingUp className="size-7" />
                  LinkedIn Engagement Rate Benchmarks 2026
                </h2>
                <p className="text-lg text-muted-foreground">
                  Compare your engagement rate against industry standards. These benchmarks are based on analysis of thousands of LinkedIn accounts across different sizes and niches.
                </p>
              </div>

              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border bg-background p-1">
                  <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 text-sm font-medium">
                    <Users className="size-4" />
                    By Follower Count
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <Building2 className="size-4" />
                    By Industry
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <BarChart3 className="size-4" />
                    By Content Type
                  </button>
                </div>
              </div>

              <Card className="overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-900 dark:bg-zinc-800">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-white">Account Tier</th>
                        <th className="px-6 py-4 text-left font-semibold text-white">Follower Range</th>
                        <th className="px-6 py-4 text-center font-semibold text-white">Avg. Engagement Rate</th>
                        <th className="px-6 py-4 text-left font-semibold text-white hidden md:table-cell">Insight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BENCHMARKS.map((b, i) => (
                        <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium">{b.tier}</td>
                          <td className="px-6 py-4 text-muted-foreground">{b.range}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                              {b.rate}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground hidden md:table-cell text-sm">{b.insight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Key Takeaways:</h3>
                  <ul className="space-y-3">
                    {KEY_TAKEAWAYS.map((k, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Target className="size-5 text-primary" />
                    Engagement Rate Guide
                  </h3>
                  <ul className="space-y-3">
                    {ENGAGEMENT_GUIDE.map((g, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span className={`inline-block w-3 h-3 rounded-full ${g.color}`} />
                        <span className="font-semibold w-20">{g.range}</span>
                        <span className="font-medium w-20">{g.label}</span>
                        <span className="text-muted-foreground">{g.note}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {/* POPULAR USE CASES */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Popular Use Cases
              </h2>
              <p className="text-lg text-muted-foreground">
                See how professionals, brands, and agencies use LinkedIn engagement data to grow.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {USE_CASES.map((u, i) => (
                <Card key={i} className="p-6">
                  <div className={`inline-flex items-center justify-center size-10 rounded-lg ${u.color} mb-3`}>
                    <u.Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{u.title}</h3>
                  <p className="text-sm text-muted-foreground">{u.body}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* PRO TIPS */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-sm font-medium mb-4">
                💡 Pro Tips
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Pro Tips
              </h2>
              <p className="text-lg text-muted-foreground">
                Actionable strategies to boost your LinkedIn engagement rate.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {PRO_TIPS.map((t, i) => (
                <Card key={i} className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex shrink-0 items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold mb-1 text-sm">{t.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t.body}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* COMMON ISSUES */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-sm font-medium mb-4">
                <AlertTriangle className="size-4" />
                Troubleshooting
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Common Issues & Solutions
              </h2>
              <p className="text-lg text-muted-foreground">
                Quick fixes for the most common LinkedIn engagement challenges.
              </p>
            </div>
            <CommonIssuesAccordion items={COMMON_ISSUES} />
          </Container>
        </section>

        {/* CALCULATE FOR OTHER PLATFORMS */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Calculate Engagement for Other Platforms
              </h2>
              <p className="text-lg text-muted-foreground">
                Track engagement across every social network with our free calculators.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {OTHER_PLATFORMS.map((p, i) => (
                <Link
                  key={i}
                  href={p.href}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:border-primary hover:shadow transition-all"
                >
                  <PlatformIcon name={p.name} className={`size-6 shrink-0 ${p.color}`} />
                  <span className="font-medium text-sm">{p.label}</span>
                  <ArrowRight className="size-4 ml-auto text-muted-foreground" />
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium mb-4">
                <HelpCircle className="size-4" />
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground">
                {FAQS.length} of the questions we hear most often.
              </p>
            </div>
            <FaqAccordion items={FAQS} />
          </Container>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Post smarter, not harder.
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Stop juggling apps. PostPlanify gives you a full content calendar, AI caption writer, and LinkedIn scheduler in one place.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <CTAButton href="/signup">Try for Free</CTAButton>
                <CTAButton href="/pricing" variant="outline">See Pricing</CTAButton>
              </div>
            </div>
          </Container>
        </section>

        {/* RELATED RESOURCES */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Related Resources
              </h2>
              <p className="text-lg text-muted-foreground">
                Explore our free tools and helpful articles to maximize your social media strategy
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {RELATED_RESOURCES.map((r, i) => (
                <Card key={i} className="p-6">
                  <h3 className="font-bold mb-4">{r.title}</h3>
                  <ul className="space-y-2">
                    {r.links.map((l, j) => (
                      <li key={j}>
                        <Link
                          href={l.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <ArrowRight className="size-3" />
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* MORE FROM THE COMMUNITY */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                More from the community.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {ARTICLES.map((a, i) => (
                <Link
                  key={i}
                  href={a.href}
                  className="block p-4 rounded-lg border bg-card hover:border-primary transition-colors"
                >
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-primary mt-2 flex items-center gap-1">
                    Read article <ArrowRight className="size-3" />
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* CONNECT & PUBLISH */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Connect and publish to all your favorite platforms
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                One dashboard. Ten platforms. Zero context switching.
              </p>
              <div className="flex flex-wrap justify-center items-center gap-3 mb-8">
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
                      width={28}
                      height={28}
                      className="w-7 h-7"
                    >
                      <path d={d} />
                    </svg>
                  </div>
                ))}
              </div>
              <CTAButton href="/signup">Start 7-day Free Trial</CTAButton>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}