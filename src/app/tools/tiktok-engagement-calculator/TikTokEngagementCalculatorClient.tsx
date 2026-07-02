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
    title: "Enter your video metrics",
    body: "Input your TikTok video's likes, comments, and shares — these are the three core engagement signals.",
  },
  {
    Icon: Eye,
    title: "Add views or follower count",
    body: "Choose to calculate by views (per-video) or by followers (account-level) depending on your goal.",
  },
  {
    Icon: TrendingUp,
    title: "Get your engagement rate",
    body: "See your engagement rate instantly and compare it to 2026 TikTok industry benchmarks by account size.",
  },
];

const BENCHMARKS = [
  { tier: "Nano", range: "1K - 10K", rate: "8% - 18%", insight: "Highest rates due to niche communities and algorithm testing new creators" },
  { tier: "Micro", range: "10K - 50K", rate: "6% - 12%", insight: "Strong engagement with growing FYP distribution and audience loyalty" },
  { tier: "Mid-Tier", range: "50K - 100K", rate: "5% - 10%", insight: "Balanced reach and engagement, attractive for brand partnerships" },
  { tier: "Macro", range: "100K - 500K", rate: "4% - 8%", insight: "Consistent reach with established content formula" },
  { tier: "Mega", range: "500K - 1M", rate: "3% - 6%", insight: "Mass reach with engagement diluted across diverse audience" },
  { tier: "Celebrity", range: "1M+", rate: "2% - 5%", insight: "Huge reach, lower percentage but massive absolute engagement" },
];

const KEY_TAKEAWAYS = [
  "Smaller accounts typically have higher engagement rates due to more personal connections with followers",
  "Industry benchmarks vary significantly - always compare within your niche for accurate assessment",
  "Content format matters - experiment with different types to find what resonates with your audience",
  "These benchmarks are averages - top performers in each category often exceed these numbers by 2-3x",
];

const ENGAGEMENT_GUIDE = [
  { range: "0% – 1%", label: "Low", note: "Needs improvement", color: "bg-rose-500" },
  { range: "1% – 3%", label: "Average", note: "Room to grow", color: "bg-amber-500" },
  { range: "3% – 6%", label: "Good", note: "Strong engagement", color: "bg-emerald-500" },
  { range: "6%+", label: "Excellent", note: "High-performing", color: "bg-blue-500" },
];

const USE_CASES = [
  {
    Icon: Sparkles,
    title: "TikTok Creators & Influencers",
    body: "Track individual video performance, identify your highest-engaging content formats, and build a data-driven content strategy that maximizes reach and growth on the For You Page.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    Icon: Building2,
    title: "Brands & Businesses",
    body: "Measure TikTok marketing ROI, evaluate creator partnerships before investing, benchmark content performance, and make data-informed decisions about your short-form video strategy.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    Icon: BarChart3,
    title: "Growth & Performance Tracking",
    body: "Monitor engagement trends as your account scales, identify content patterns that drive virality, and adjust strategy to maintain healthy engagement as your audience grows.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    Icon: Briefcase,
    title: "Marketing Agencies",
    body: "Generate accurate TikTok engagement reports for clients, benchmark performance across multiple creator accounts, and demonstrate measurable value of your influencer marketing services.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    Icon: HandshakeIcon,
    title: "Brand Deal Negotiations",
    body: "Prove your value to sponsors with verifiable engagement metrics, evaluate potential creator collaborators with accurate data, and negotiate fair partnership rates based on performance.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    Icon: Target,
    title: "Content Strategy Optimization",
    body: "Identify which video styles, sounds, hooks, and posting times drive highest engagement to continuously refine your TikTok content formula for maximum algorithm favor.",
    color: "bg-cyan-100 text-cyan-600",
  },
];

const PRO_TIPS = [
  { title: "Hook viewers in the first 0.5-2 seconds", body: "Use pattern interrupts—unexpected visuals, sounds, or statements. Start mid-action or with the 'result' before showing the process to maximize watch time." },
  { title: "Use trending sounds strategically for algorithm boost", body: "Join trends in the 'early majority' phase (trending but not oversaturated). Put your unique spin on it rather than copying exactly." },
  { title: "Keep videos short for maximum completion rate", body: "7-15 second videos often outperform longer content because they achieve higher completion rates—a critical algorithm signal. Aim for 80%+ watch time." },
  { title: "Encourage comments with specific prompts", body: "Use either/or questions, mild controversy, or intentional small mistakes viewers will correct. Reply to comments with video responses to double engagement." },
  { title: "Post consistently 3-5 times per week minimum", body: "The algorithm rewards consistency. Find a sustainable schedule and stick to it—3 high-quality videos weekly beats 7 rushed ones." },
  { title: "Reply to comments with video responses", body: "Comment replies as videos massively boost engagement. They count as new content, surface to original commenters, and signal active community management." },
  { title: "Use captions and text overlays for retention", body: "85% of TikTok is watched on mute. Add captions to retain viewers who can't or won't enable sound—massive engagement lift." },
  { title: "Test different content formats", body: "Rotate between talking head, POV, B-roll, duet/stitch, and educational formats. Track which format drives highest engagement for your niche." },
  { title: "Post when your specific audience is most active", body: "Check your TikTok Analytics 'Followers' tab for peak activity times. Posting 30 minutes before peak maximizes initial distribution velocity." },
  { title: "Create duet and stitch-worthy content", body: "Leave openings in your videos for others to react to—controversial takes, open-ended questions, or relatable scenarios invite community participation." },
  { title: "Avoid over-polished content that feels like an ad", body: "TikTok audiences crave authenticity. Raw, phone-shot content often outperforms studio-quality videos—native beats polished on this platform." },
  { title: "Create saveable educational content", body: "'How-to' and 'tutorial' content gets massive saves, which the algorithm weights heavily. End with a clear takeaway viewers want to reference later." },
];

const COMMON_ISSUES = [
  {
    q: "Should I include saves in engagement calculation?",
    a: "Yes, if you have access to save data in TikTok Analytics (available in Pro accounts). Saves are a strong quality signal—content worth bookmarking typically indicates high value. Add saves to your formula: ((Likes + Comments + Shares + Saves) ÷ Views) × 100.",
  },
  {
    q: "My engagement rate is high but I'm not growing. Why?",
    a: "High engagement on existing content doesn't guarantee new audience reach. Check your FYP distribution—TikTok's algorithm tests new content with small audience batches. If completion rate drops below 50% in the first 3 seconds, your hook needs work even if engagement looks good.",
  },
  {
    q: "Should I track engagement per video or per account?",
    a: "Track both. Per-video engagement reveals which content formats work best; per-account engagement shows overall account health. Most creators focus on per-video because individual videos drive FYP distribution, but per-account engagement matters for brand deals and long-term growth.",
  },
  {
    q: "Why is my engagement rate different in TikTok Analytics?",
    a: "TikTok's native analytics use video views (not impressions) and include only likes, comments, and shares. Our calculator matches this methodology. If numbers differ, check whether you're comparing engagement rate vs. interaction rate—TikTok sometimes displays both with different denominators.",
  },
  {
    q: "Do hashtags affect engagement rate?",
    a: "Hashtags don't directly affect engagement rate calculations, but they impact distribution and which audience sees your content. Use 3-5 highly relevant hashtags rather than 15+ generic ones—over-tagging dilutes your content's categorization and may reduce FYP reach.",
  },
  {
    q: "How do I know if my engagement rate is 'good'?",
    a: "Compare against the 2026 benchmarks for your follower tier. Nano accounts (1K-10K) average 8-18%, micro accounts (10K-50K) average 6-12%. Your rate is 'good' when it matches or exceeds your tier's average. Top creators hit 2-3x the average—aim higher than the baseline.",
  },
];

const FAQS = [
  {
    q: "What is TikTok engagement rate?",
    a: "TikTok engagement rate is a metric that measures how actively viewers interact with your video content relative to exposure. Unlike other platforms, TikTok engagement can be calculated two ways: by followers ((Likes + Comments + Shares) ÷ Followers × 100) or by views ((Likes + Comments + Shares) ÷ Views × 100). The view-based calculation is more common on TikTok because the algorithm shows content to non-followers, making views a more accurate measure of actual audience reached.",
  },
  {
    q: "How do you calculate TikTok engagement rate?",
    a: "The standard TikTok engagement rate formula is: ((Likes + Comments + Shares) ÷ Views) × 100 for per-video analysis, or ((Likes + Comments + Shares) ÷ Followers) × 100 for account-level analysis. View-based engagement is the industry standard because TikTok's FYP distributes content far beyond your follower base. Most marketers, agencies, and brand-deal evaluators prefer the view-based formula for this reason.",
  },
  {
    q: "What is a good engagement rate on TikTok in 2026?",
    a: "A good TikTok engagement rate varies by calculation method. For view-based engagement: 4-6% is average, 6-10% is strong, and 10%+ is excellent. For follower-based engagement: 8-18% is typical for nano accounts, scaling down to 2-5% for accounts over 1 million followers. The view-based benchmark is now the industry standard since TikTok's algorithm prioritizes reach beyond followers.",
  },
  {
    q: "What is a good TikTok engagement rate for 1,000 followers?",
    a: "Accounts with around 1,000 followers on TikTok typically see engagement rates of 10-18% when calculated by followers, and 5-10% when calculated by views. At this stage, the algorithm tests your content heavily, and high engagement signals quality that pushes more videos to broader audiences. Top performers in this tier often exceed 20% by followers.",
  },
  {
    q: "What is a good TikTok engagement rate for 10K followers?",
    a: "At 10K followers, a good TikTok engagement rate is 8-15% by followers or 4-8% by views. This is a critical growth phase where consistent engagement helps the algorithm decide whether to push your content beyond your existing audience. Focus on completion rate and comment quality—they matter more than raw like counts at this stage.",
  },
  {
    q: "What is a good TikTok engagement rate for 100K followers?",
    a: "Accounts with 100K followers typically see 5-10% engagement by followers or 3-6% by views. At this level, you likely have several viral videos that brought in passive followers. Your goal is to convert passive viewers into engaged community members—comment prompts and stitchable content become critical strategies here.",
  },
  {
    q: "What is a good TikTok engagement rate for 1 million followers?",
    a: "For accounts with 1M+ followers, engagement rates of 3-7% by followers or 2-5% by views are typical. While percentages decrease at scale, 3% of 1 million followers still equals 30,000 engagements per post—massive absolute numbers. Brand-deal value is based on these absolute metrics rather than percentages alone.",
  },
  {
    q: "Why does TikTok engagement rate matter?",
    a: "TikTok engagement rate matters for multiple reasons: it directly influences the algorithm (higher engagement = more FYP distribution), it's the primary metric brands use to evaluate creator partnerships, it signals content quality to potential followers, and it predicts which videos will trend. Accounts with strong engagement grow exponentially; accounts with weak engagement plateau regardless of content quality.",
  },
  {
    q: "Does TikTok engagement rate affect the For You Page?",
    a: "Yes, engagement rate significantly impacts FYP distribution. TikTok's algorithm analyzes engagement velocity (how quickly a video gains interactions), engagement depth (comments and shares weighted higher than likes), and engagement ratio (engagements per view). Videos with high engagement in the first hour get pushed to progressively larger audience batches on the FYP.",
  },
  {
    q: "How can I increase my engagement rate on TikTok?",
    a: "To boost TikTok engagement: hook viewers in the first 0.5-2 seconds with pattern interrupts or curiosity gaps, keep videos short (7-15 seconds often outperform longer content), ask specific questions to encourage comments, reply to comments with video responses, use trending sounds in the 'early majority' phase, post when your audience is most active, and create saveable educational content.",
  },
  {
    q: "What is the average TikTok engagement rate by niche?",
    a: "Average TikTok engagement rates vary significantly by niche in 2026: Comedy/Entertainment (8-15%), Dance/Music (7-12%), Education/How-to (6-10%), Fitness/Wellness (5-9%), Food/Cooking (6-11%), Beauty/Fashion (4-8%), Tech/Gaming (5-9%), and Business/Finance (3-7%). Education and food niches typically lead because they drive saves—a strong algorithm signal.",
  },
  {
    q: "Should I calculate engagement by views or followers on TikTok?",
    a: "For TikTok, view-based engagement is typically more meaningful because the algorithm regularly shows your content to non-followers through the FYP. View-based rates give you a true picture of how your content resonates with the actual audience it reaches. Use follower-based calculation only when comparing account-level growth or evaluating brand partnerships.",
  },
  {
    q: "What counts as engagement on TikTok?",
    a: "TikTok engagement includes: Likes (hearts), Comments (replies count toward your engagement too), Shares (strongest signal—forwarding to friends or other platforms), Saves (quality signal—content worth bookmarking), and Follows from video. Some creators also include profile visits and link clicks for a fuller picture, but likes + comments + shares is the standard formula.",
  },
  {
    q: "How often should I track my TikTok engagement rate?",
    a: "Track TikTok engagement rate after every video for the first 48 hours (peak performance window), weekly to identify trends, and monthly for strategic planning. Avoid judging a single video's performance—some videos take 3-7 days to reach full algorithmic distribution. Track patterns across 10+ videos before making strategy shifts.",
  },
  {
    q: "What is viral engagement rate on TikTok?",
    a: "Viral TikTok videos typically show engagement rates of 15-30% by views, with exceptional virality reaching 40%+. Signs of viral content include: engagement rate 3-5x your account average, share rate exceeding like rate (people share more than like), comments 2x your average, and rapid growth within 24-48 hours of posting.",
  },
  {
    q: "Does buying followers affect TikTok engagement rate?",
    a: "Yes, buying followers devastates TikTok engagement rates and can harm your account. Fake followers never engage, dramatically lowering your engagement rate. TikTok's algorithm detects inactive accounts and may suppress your content from FYP distribution. Additionally, brands use engagement-rate filters that immediately expose inflated follower counts.",
  },
  {
    q: "How do brands evaluate TikTok creator engagement?",
    a: "Brands evaluating TikTok creators typically analyze: engagement rate by views (4-8% is attractive), consistency across recent videos (not just viral outliers), comment quality (genuine vs. emoji-only), share rate (signals true resonance), audience match (engaged followers in target demographic), and growth trajectory (rising engagement trend is more valuable than stable numbers).",
  },
  {
    q: "What is the TikTok engagement rate formula for influencers?",
    a: "For influencer evaluation, brands typically use: ((Likes + Comments + Shares) ÷ Views) × 100, averaged across the last 10-20 videos (excluding obvious viral outliers and old videos). A 4-8% average is the sweet spot for most brand partnerships. Some premium brand deals require 6%+ with high comment quality.",
  },
  {
    q: "Can I track engagement rate for each TikTok video?",
    a: "Absolutely. Apply the formula to individual videos: ((Likes + Comments + Shares) ÷ Views) × 100. Per-video tracking is essential on TikTok since performance varies dramatically. Use this calculator for each post and log results in a spreadsheet—patterns will emerge showing which formats, hooks, sounds, and topics drive highest engagement for your audience.",
  },
  {
    q: "How do TikTok Lives affect engagement rate?",
    a: "TikTok Lives have separate metrics from regular videos. Live engagement is measured by: (Comments + Gifts + New Followers During Live) ÷ Peak Viewers × 100. Live engagement doesn't directly affect your video engagement rate, but regular Live presence signals active community management to the algorithm and can boost your overall account authority.",
  },
  {
    q: "What's the difference between TikTok engagement and watch time?",
    a: "Watch time measures how long viewers watch your video, while engagement measures interactions (likes, comments, shares). Both critically influence the algorithm but serve different purposes: watch time determines FYP distribution (algorithm favors videos with high completion rates), while engagement signals content quality and audience resonance. Top creators optimize for both simultaneously.",
  },
  {
    q: "Why does TikTok engagement rate fluctuate so much?",
    a: "TikTok engagement fluctuates dramatically due to: the FYP algorithm's unpredictability (some videos reach viral audiences, others don't), trending sounds rising and falling in popularity, posting time alignment with audience activity, content format variation, current events affecting audience mood, and TikTok's regular algorithm updates. Track 10+ videos to identify true trends vs. random variation.",
  },
  {
    q: "How do TikTok Stitches and Duets affect engagement?",
    a: "Stitches and Duets are powerful engagement multipliers. When someone stitches/duets your video, you gain: exposure to their audience, a backlink to your original content, an additional video in the FYP ecosystem, and engagement from viewers of both videos. Create stitchable content by leaving natural pauses for reactions or ending with open-ended prompts.",
  },
  {
    q: "What tools can I use to track TikTok engagement rate?",
    a: "Track TikTok engagement using: this free TikTok Engagement Rate Calculator for quick calculations, TikTok Analytics (free with Pro account—switch in settings) for native data, PostPlanify for cross-platform tracking and historical reports, third-party tools like Modash or HypeAuditor for deeper competitor analysis, and spreadsheet templates for manual tracking across multiple accounts.",
  },
  {
    q: "Does TikTok's algorithm prefer engagement rate or view count?",
    a: "TikTok's algorithm weighs engagement rate more than raw view count. High engagement on fewer views signals quality content worthy of broader distribution. A video with 10K views and 15% engagement will get pushed harder than a video with 100K views and 1% engagement. The algorithm optimizes for engagement velocity, not raw reach.",
  },
  {
    q: "How do I compare my engagement rate to competitors on TikTok?",
    a: "To benchmark TikTok engagement against competitors: identify 5-10 creators with similar follower counts in your niche, calculate their engagement rate using the same formula (this calculator works for any public profile), track their performance over 30 days to account for variation, and compare average rates rather than individual videos. Tools like PostPlanify can automate competitor tracking.",
  },
];

const RELATED_RESOURCES = [
  {
    title: "Scheduler Comparisons & Reviews",
    links: [
      { label: "PostPlanify vs. Hootsuite", href: "/compare/hootsuite" },
      { label: "PostPlanify vs. Buffer", href: "/compare/buffer" },
      { label: "PostPlanify vs. Later", href: "/compare/later" },
    ],
  },
  {
    title: "Industries & Solutions",
    links: [
      { label: "For Small Businesses", href: "/solutions/small-business" },
      { label: "For Agencies", href: "/solutions/agencies" },
      { label: "For Enterprise", href: "/solutions/enterprise" },
    ],
  },
  {
    title: "Free Tools",
    links: [
      { label: "TikTok Caption Generator", href: "/tools/tiktok-caption-generator" },
      { label: "TikTok Hashtag Generator", href: "/tools/tiktok-hashtag-generator" },
      { label: "TikTok Username Checker", href: "/tools/tiktok-handle-checker" },
    ],
  },
];

const ARTICLES = [
  { title: "How to Calculate TikTok Engagement Rate", href: "/blog/tiktok-engagement-rate" },
  { title: "TikTok Algorithm 2026: Complete Guide", href: "/blog/tiktok-algorithm" },
  { title: "Best Time to Post on TikTok", href: "/blog/best-time-to-post-tiktok" },
  { title: "TikTok Marketing Strategy for Brands", href: "/blog/tiktok-marketing-strategy" },
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
              Schedule TikTok Videos Weeks in Advance
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Upload once, post automatically. Go viral on your schedule, not TikTok&apos;s.
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
  const [byFollowers, setByFollowers] = React.useState(true);
  const [likes, setLikes] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [shares, setShares] = React.useState("");
  const [denom, setDenom] = React.useState("");

  const likesN = parseFloat(likes) || 0;
  const commentsN = parseFloat(comments) || 0;
  const sharesN = parseFloat(shares) || 0;
  const denomN = parseFloat(denom) || 0;

  const total = likesN + commentsN + sharesN;
  const rate = denomN > 0 ? (total / denomN) * 100 : 0;

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-2xl font-bold mb-4">Calculate TikTok Engagement Rate</h2>
      <div className="flex items-center gap-6 mb-6">
        <span className="text-sm font-medium">Calculate by:</span>
        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setByFollowers(true)}>
          <span className="inline-flex items-center justify-center size-4 rounded border border-input bg-background">
            {byFollowers && <Check className="size-3 text-foreground" />}
          </span>
          <span className="text-sm">Followers</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setByFollowers(false)}>
          <span className="inline-flex items-center justify-center size-4 rounded border border-input bg-background">
            {!byFollowers && <Check className="size-3 text-foreground" />}
          </span>
          <span className="text-sm">Views</span>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Likes</label>
          <input
            type="number"
            value={likes}
            onChange={(e) => setLikes(e.target.value)}
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
          <label className="block text-sm font-medium mb-2">
            {byFollowers ? "Followers" : "Views"}
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
          Engagement Rate: <span className="ml-2 inline-flex items-center justify-center w-8 h-8 rounded-full border bg-background text-base font-semibold">{denomN > 0 ? Math.round(rate) : "0"}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {byFollowers ? "Add followers to calculate" : "Add views to calculate"}
        </p>
      </div>
    </Card>
  );
}

const OTHER_PLATFORMS: { name: keyof typeof SOCIAL_SVG; label: string; href: string; color: string }[] = [
  { name: "Instagram", label: "Instagram Engagement Calculator", href: "/tools/instagram-engagement-calculator", color: "text-pink-500" },
  { name: "Youtube", label: "YouTube Engagement Calculator", href: "/tools/youtube-engagement-calculator", color: "text-red-500" },
  { name: "Linkedin", label: "LinkedIn Engagement Calculator", href: "/tools/linkedin-engagement-calculator", color: "text-blue-600" },
  { name: "Facebook", label: "Facebook Engagement Calculator", href: "/tools/facebook-engagement-calculator", color: "text-blue-500" },
  { name: "Twitter", label: "X (Twitter) Engagement Calculator", href: "/tools/twitter-engagement-calculator", color: "text-black dark:text-white" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function TikTokEngagementCalculatorClient() {
  return (
    <>
      <Header />

      <main>
        {/* HERO */}
        <section className="py-8">
          <Container>
            <div className="flex flex-col items-center gap-4">
              <div className="text-black dark:text-white p-2 mb-2">
                <svg
                  aria-label="TikTok"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ width: 40, height: 40 }}
                >
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </div>
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  TikTok Engagement Rate Calculator
                </h1>
                <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
                  Measure your TikTok video performance with our free engagement rate calculator. Enter your likes, comments, shares, and views or followers to get instant insights and compare to industry benchmarks.
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
                Calculate your TikTok engagement rate in three simple steps.
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
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                  TikTok Engagement Rate Benchmarks 2026
                </h2>
                <p className="text-lg text-muted-foreground">
                  Compare your engagement rate against industry standards by account size.
                </p>
              </div>

              <Card className="overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold">Account Tier</th>
                        <th className="text-left p-4 font-semibold">Follower Range</th>
                        <th className="text-left p-4 font-semibold">Avg. Engagement Rate</th>
                        <th className="text-left p-4 font-semibold">Insight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BENCHMARKS.map((b, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-4 font-medium">{b.tier}</td>
                          <td className="p-4 text-muted-foreground">{b.range}</td>
                          <td className="p-4 font-semibold text-primary">{b.rate}</td>
                          <td className="p-4 text-muted-foreground">{b.insight}</td>
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

        {/* COMPLETE GUIDE */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                📊 Engagement Rate Guide
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Complete Guide: Social Media Engagement Rate (2026)
              </h2>
              <p className="text-lg text-muted-foreground">
                Learn formulas, benchmarks, and how to improve engagement on every platform.
              </p>
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
                See how creators, brands, and agencies use TikTok engagement data to grow.
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
                Actionable strategies to boost your TikTok engagement rate.
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
                Quick fixes for the most common TikTok engagement calculation questions.
              </p>
            </div>
            <FaqAccordion items={COMMON_ISSUES} />
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
                Stop juggling apps. PostPlanify gives you a full content calendar, AI caption writer, and TikTok scheduler in one place.
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
