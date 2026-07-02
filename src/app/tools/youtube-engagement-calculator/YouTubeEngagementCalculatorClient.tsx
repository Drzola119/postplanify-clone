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
    title: "Enter your video metrics",
    body: "Input your likes, comments, and optionally shares from a YouTube video or average across recent uploads.",
  },
  {
    Icon: Eye,
    title: "Add views or subscriber count",
    body: "Choose to calculate engagement based on views (per-video performance) or subscribers (audience loyalty).",
  },
  {
    Icon: TrendingUp,
    title: "Get your engagement rate",
    body: "See your engagement rate percentage instantly and compare to YouTube benchmarks for your channel size and niche.",
  },
];

const BENCHMARKS = [
  { tier: "Starter", range: "1K - 10K", rate: "5% - 10%", insight: "Highest rates due to dedicated early audience and niche community" },
  { tier: "Rising", range: "10K - 50K", rate: "4% - 8%", insight: "Strong engagement with growing algorithm recommendations" },
  { tier: "Established", range: "50K - 100K", rate: "3% - 6%", insight: "Balanced growth and engagement, attractive for brand partnerships" },
  { tier: "Professional", range: "100K - 500K", rate: "2% - 5%", insight: "Consistent audience with proven content formula" },
  { tier: "Major", range: "500K - 1M", rate: "2% - 4%", insight: "Large reach with engagement diluted across casual viewers" },
  { tier: "Celebrity", range: "1M+", rate: "1% - 3%", insight: "Massive reach with lower percentage but absolute engagement numbers" },
];

const KEY_TAKEAWAYS = [
  "YouTube engagement rates are typically 2-5% by views—lower than other platforms due to passive viewing behavior",
  "Subscriber-based rates are usually higher (5-10%) since not all subscribers actively watch content",
  "Shorts see higher engagement rates (4-8%) than long-form videos (2-4%)",
  "Top creators in each tier often exceed these benchmarks by 2-3x with strong content-niche fit",
];

const ENGAGEMENT_GUIDE = [
  { range: "Below 1%", label: "Low", note: "Needs improvement", color: "bg-rose-500" },
  { range: "1% – 2%", label: "Average", note: "Typical YouTube range", color: "bg-amber-500" },
  { range: "2% – 4%", label: "Good", note: "Strong engagement", color: "bg-emerald-500" },
  { range: "4%+", label: "Excellent", note: "Top-tier performance", color: "bg-blue-500" },
];

const USE_CASES = [
  {
    Icon: Sparkles,
    title: "YouTubers & Content Creators",
    body: "Track individual video performance, identify your highest-engaging content formats, and build a data-driven content strategy that maximizes watch time and subscriber growth.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    Icon: Building2,
    title: "Brands & Businesses",
    body: "Measure YouTube marketing ROI, evaluate creator partnerships before investing, benchmark content performance, and make data-informed decisions about your video strategy.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    Icon: BarChart3,
    title: "Channel Growth Analysis",
    body: "Monitor engagement trends as your subscriber count scales, identify content patterns that drive growth, and adjust strategy to maintain healthy engagement as your audience expands.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    Icon: Briefcase,
    title: "Marketing Agencies",
    body: "Generate accurate YouTube engagement reports for clients, benchmark performance across multiple channels, and demonstrate measurable value of your video marketing services.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    Icon: HandshakeIcon,
    title: "Sponsorship Negotiations",
    body: "Prove your value to sponsors with verifiable engagement metrics, evaluate potential creator collaborators with accurate data, and negotiate fair partnership rates based on performance.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    Icon: Target,
    title: "Content Strategy Optimization",
    body: "Identify which video topics, formats, lengths, and posting times drive highest engagement to continuously refine your YouTube content strategy for maximum algorithm favor.",
    color: "bg-cyan-100 text-cyan-600",
  },
];

const PRO_TIPS = [
  { title: "Hook viewers in the first 30 seconds", body: "Start with your most compelling hook—the result, conflict, or question. Avoid long intros before delivering value. Analyze retention graphs to see where viewers drop off." },
  { title: "Ask for engagement at high-attention moments", body: "Place CTAs after surprising info or emotional highs, not just at the end. Use pattern interrupts like 'If you've experienced this, drop a comment.'" },
  { title: "Use Community posts between uploads", body: "Post 2-4 times weekly with polls, behind-the-scenes, and teasers. Community posts keep subscribers connected and signal channel activity to YouTube." },
  { title: "Respond to comments within the first 2 hours", body: "Early comment velocity impacts distribution. Responding quickly doubles your comment count and shows new viewers an active community." },
  { title: "Optimize thumbnails and titles for CTR", body: "Use faces with emotion, 3-4 words of text, high contrast colors. A/B test thumbnails. Aim for 4-10% CTR for new channels, 8-15%+ for established." },
  { title: "Create end screens and cards strategically", body: "Use end screens to promote related videos and cards at natural transitions. Playlists in end screens increase session time, which YouTube rewards." },
  { title: "Structure videos with chapters", body: "Timestamps help viewers navigate and actually increase watch time. Include your main keyword in chapter titles for SEO benefit." },
  { title: "Analyze retention graphs to fix drop-offs", body: "Study where viewers stop watching. Sharp drops in the first 30 seconds = weak hook. Sudden mid-video drops = boring sections to cut." },
  { title: "Post consistently at the same time", body: "Posting same day/hour weekly trains both the algorithm and your audience. Consistency often matters more than frequency for engagement." },
  { title: "Design content to spark comments", body: "Share opinions viewers will debate, ask specific questions ('Team A or B?'), or request feedback. Specific prompts get 3-5x more comments." },
  { title: "Use pinned comments strategically", body: "Pin a question to spark discussion, correct errors, or answer FAQs. A well-crafted pinned comment can generate dozens of replies." },
  { title: "Repurpose content into Shorts", body: "Extract high-engagement moments from long-form videos as Shorts. Shorts are excellent for testing hooks and topics before full videos." },
];

const COMMON_ISSUES = [
  {
    q: "Engagement rate seems too low",
    solutions: [
      "YouTube engagement rates are typically 2-5% by views—lower than other platforms due to passive viewing behavior",
      "Check which calculation you're using—view-based rates are lower than subscriber-based rates",
      "Compare to benchmarks for your specific niche, as rates vary significantly by content category",
      "Ensure you're including comments in your calculation, not just likes",
    ],
  },
  {
    q: "Engagement varies widely between videos",
    solutions: [
      "This is normal—some topics and formats naturally generate more engagement than others",
      "Calculate 10-video rolling averages to identify true performance trends over time",
      "Separate Shorts from long-form videos as they have different engagement patterns",
      "Check if thumbnail/title CTR correlates with engagement—different audiences may click different content",
    ],
  },
  {
    q: "Not sure whether to use views or subscribers",
    solutions: [
      "Use views for per-video content quality analysis (most common for YouTube)",
      "Use subscribers for measuring audience loyalty and overall channel health over time",
      "For sponsorship discussions, brands typically want view-based engagement since it reflects video performance",
      "Report both metrics—they serve different purposes in understanding your channel",
    ],
  },
  {
    q: "Shorts vs long-form engagement comparison",
    solutions: [
      "Shorts typically have higher engagement rates (4-8%) than long-form content (2-4%)",
      "Track them separately for accurate analysis—they reach different audiences",
      "Shorts engagement often doesn't translate to long-form subscriber behavior",
      "Consider Shorts for reach and long-form for deeper community engagement",
    ],
  },
  {
    q: "Want to improve my YouTube engagement rate",
    solutions: [
      "Hook viewers in the first 30 seconds—most drop-off happens early",
      "Ask for engagement at high-attention moments, not just at the video end",
      "Respond to comments within 2 hours to boost algorithm signals and encourage more discussion",
      "Use Community posts between uploads to maintain subscriber connection",
    ],
  },
  {
    q: "Comparing to other YouTube channels",
    solutions: [
      "Smaller channels typically have higher engagement rates due to dedicated early audiences",
      "Compare within your specific content niche for relevant benchmarks—rates vary by category",
      "Focus on your own growth trends over time rather than obsessing over competitor numbers",
      "Use tools like Social Blade or vidIQ to track competitor performance systematically",
    ],
  },
];

const FAQS = [
  {
    q: "What is YouTube engagement rate?",
    a: "",
  },
  {
    q: "How do you calculate YouTube engagement rate?",
    a: "The standard YouTube engagement rate formula is: ((Likes + Comments) ÷ Views) × 100 for per-video analysis, or ((Likes + Comments) ÷ Subscribers) × 100 for audience loyalty metrics. For comprehensive analysis, include shares: ((Likes + Comments + Shares) ÷ Views) × 100. Most marketers prefer view-based calculations since they measure actual viewer response. Some advanced formulas weight comments higher than likes since they require more effort. Always specify which formula you're using when comparing rates.",
  },
  {
    q: "What is a good engagement rate on YouTube in 2026?",
    a: "A good YouTube engagement rate varies by calculation method. For view-based engagement: 2-4% is average, 4-6% is strong, and 6%+ is excellent. For subscriber-based: rates are typically higher—5-10% for active channels. YouTube naturally has lower engagement rates than TikTok or Instagram because it's a lean-back viewing experience. Shorts typically see higher rates (4-8%) than long-form content (2-4%). Channels under 10K subscribers often see higher percentages due to dedicated early audiences.",
  },
  {
    q: "What is a good YouTube engagement rate for 1,000 subscribers?",
    a: "Channels with around 1,000 subscribers typically see engagement rates of 5-10% by subscribers or 3-6% by views. At this stage, your audience is likely highly interested in your niche—they subscribed because they genuinely want your content. Focus on building community through consistent posting, replying to every comment, and asking for feedback. This early engagement momentum is crucial for YouTube's algorithm to start recommending your content to broader audiences.",
  },
  {
    q: "What is a good YouTube engagement rate for 10K subscribers?",
    a: "At 10K subscribers, a good YouTube engagement rate is 4-8% by subscribers or 2-5% by views. This is a critical growth phase where YouTube starts showing your content to more non-subscribers through recommendations. Your monetization eligibility is confirmed, and you have access to more analytics. Focus on understanding which content drives highest engagement to double down on successful formats. Maintain community engagement even as the audience grows.",
  },
  {
    q: "What is a good YouTube engagement rate for 100K subscribers?",
    a: "Channels with 100K subscribers typically see 3-6% engagement by subscribers or 2-4% by views. At this level, you likely have a mix of highly engaged core fans and casual viewers who subscribed but don't watch everything. This is normal—focus on engagement quality over percentage. Brands actively seek creators at this tier with 3%+ engagement rates for sponsorships. Analyze which videos attract new subscribers versus engage existing ones.",
  },
  {
    q: "What is a good YouTube engagement rate for 1 million subscribers?",
    a: "For channels with 1M+ subscribers, engagement rates of 2-4% by subscribers or 1-3% by views are typical. While percentages decrease at scale, 2% of 1 million subscribers equals 20,000 engagements per video—substantial for brand deals. Celebrity channels may see 0.5-2% while niche creators maintain 3-5%. At this scale, focus on engagement rate per video for sponsorship negotiations. Consistent 2%+ engagement at 1M+ subscribers indicates an unusually engaged audience.",
  },
  {
    q: "Why is YouTube engagement rate important?",
    a: "YouTube engagement rate matters for multiple reasons: it directly influences the algorithm (higher engagement = better recommendations and search rankings), it's a key metric brands use to evaluate sponsorship opportunities and CPM rates, it indicates content resonance and audience loyalty, it affects monetization potential through higher ad rates on engaging content, and it predicts channel growth trajectory. Watch time matters most for the algorithm, but engagement signals quality to both YouTube and sponsors.",
  },
  {
    q: "Does YouTube engagement rate affect the algorithm?",
    a: "Yes, engagement significantly impacts YouTube's algorithm, though watch time is the primary factor. The algorithm analyzes: like-to-view ratio (indicates satisfaction), comment velocity (early comments signal engaging content), click-through rate (CTR) from impressions, average view duration, and session time (do viewers watch more after your video). High engagement in the first few hours after upload is especially important for algorithm boost. Comments particularly help because they indicate content worth discussing.",
  },
  {
    q: "How can I increase my YouTube engagement rate?",
    a: "To boost YouTube engagement: ask viewers to like and comment at specific moments in the video (not just at the end), use pattern interrupt CTAs ('If you've ever experienced X, drop a comment'), respond to comments quickly to encourage more discussion, pin interesting comments to spark conversation threads, use Community posts to engage subscribers between uploads, create end screens encouraging viewers to watch more, ask questions that require specific answers (not yes/no), and analyze your most-commented videos to identify what sparked discussion.",
  },
  {
    q: "What is the average YouTube engagement rate by niche?",
    a: "Average YouTube engagement rates vary significantly by niche in 2026: Gaming/Let's Plays (3-5%), Education/How-to (3-6%), Entertainment/Comedy (2-4%), Music Videos (1-3%), Tech Reviews (2-4%), Beauty/Fashion (2-4%), Fitness/Health (3-5%), Vlogs (2-4%), News/Commentary (3-5%), Finance/Business (2-4%). Niches with passionate communities (gaming, education) typically see higher rates. Controversial content drives comments but may not indicate healthy engagement. Benchmark against similar channels in your specific niche.",
  },
  {
    q: "Should I calculate engagement by views or subscribers?",
    a: "For YouTube, view-based engagement is typically more meaningful for analyzing specific video performance since it measures actual viewer response. Subscriber-based engagement measures audience loyalty and overall channel health. For sponsorship discussions, brands usually want view-based rates since they reflect video performance, not just audience size. Use both metrics: views for content optimization, subscribers for channel health. Note that subscriber counts don't reflect active viewers—many subscribers never return.",
  },
  {
    q: "What counts as engagement on YouTube?",
    a: "YouTube engagement includes: Likes (most common engagement), Comments (strongest signal—indicates content worth discussing), Shares (via share button or embedding), Dislikes (technically engagement but often excluded from calculations since hidden), Saves to playlists (underutilized metric), and Subscribers gained from the video. Watch time and average view duration aren't 'engagements' but critically influence algorithm distribution. For calculations, standard formulas use Likes + Comments. Some include shares if data is available through YouTube Analytics.",
  },
  {
    q: "How often should I track my YouTube engagement rate?",
    a: "Track YouTube engagement per-video for the first 48-72 hours (critical window for algorithm), weekly for trend analysis, and monthly for strategic planning. Unlike other platforms, YouTube videos can gain significant engagement months or years after upload through search and recommendations—periodically re-check evergreen content. Use YouTube Studio Analytics for detailed tracking. Document top performers to identify patterns in topics, thumbnails, titles, and video length that drive highest engagement.",
  },
  {
    q: "What is a viral engagement rate on YouTube?",
    a: "Viral YouTube videos typically show engagement rates of 5-10% by views, with exceptional virality reaching 15%+. Signs of viral content include: engagement rate increasing over time (not just initially), high comment-to-view ratio, significant external sharing and embedding, traffic from 'Browse features' and 'Suggested videos' exceeding 50%, and subscribers gained per view above 1-2%. Note that controversy can drive high engagement through negative sentiment—check comment quality, not just quantity.",
  },
  {
    q: "Does YouTube Shorts engagement differ from long-form videos?",
    a: "Yes, YouTube Shorts and long-form videos have distinct engagement patterns. Shorts typically see: higher engagement rates (4-8% vs 2-4% for long-form) due to quick consumption and loop viewing, higher like ratios but lower comment ratios (less time to type comments during short content), different algorithmic treatment (Shorts shelf vs homepage recommendations), and different audience behavior (swipe vs search). Track Shorts and long-form separately for accurate analysis. Shorts engagement often doesn't translate to long-form subscribers.",
  },
  {
    q: "How do comments affect YouTube engagement more than likes?",
    a: "Comments carry more weight than likes in YouTube's algorithm and for sponsorships because they require significant effort, indicate content worth discussing, create community and return visits, generate additional content (replies), and signal deeper emotional response. A video with 1,000 comments often performs better than one with 10,000 likes in recommendations. Brands specifically analyze comment sentiment and quality. Optimize for comments by asking specific questions, creating controversy-worthy takes, or requesting viewer input.",
  },
  {
    q: "Does buying subscribers or engagement affect YouTube rates?",
    a: "Yes, buying subscribers or engagement severely damages your channel. Fake subscribers never watch or engage, dramatically lowering your view-to-subscriber ratio—a key metric for YouTube's algorithm. Low engagement signals to YouTube that your content isn't valuable, reducing recommendations. Brands use audit tools to detect fake engagement, disqualifying you from sponsorships. YouTube actively removes fake subscribers and may terminate channels for violations. Focus on organic growth through quality content.",
  },
  {
    q: "How do brands evaluate YouTube creator engagement?",
    a: "Brands evaluating YouTube creators typically analyze: engagement rate by views (3%+ is attractive), consistency across recent videos (not just viral outliers), comment quality and sentiment (genuine discussion vs spam), subscriber-to-view ratio (healthy channels show 10-30% of subs viewing new videos), average view duration (high engagement with low watch time is a red flag), audience demographics, and engagement trends over 30-90 days. Many brands use influencer platforms that audit engagement patterns and identify fake metrics.",
  },
  {
    q: "What is the YouTube engagement rate formula for sponsorships?",
    a: "For sponsorship evaluation, brands typically use: ((Likes + Comments) ÷ Views) × 100, averaged across the last 10-20 videos (excluding obvious outliers). Advanced formulas may weight comments higher: ((Likes + Comments × 2) ÷ Views) × 100. For subscriber-based: ((Average Video Engagements) ÷ Subscribers) × 100. When negotiating brand deals, provide: view-based rate, subscriber-based rate, average view duration percentage, and your top 10 videos' individual rates. Also share audience demographics from YouTube Analytics.",
  },
  {
    q: "Can I track engagement rate for each YouTube video?",
    a: "Absolutely. Apply the formula to individual videos: ((Likes + Comments) ÷ Views) × 100. Per-video tracking helps identify your best-performing content types, optimal video lengths, and most engaging topics. Create a spreadsheet tracking: upload date, title, thumbnail style, video length, topic, views, likes, comments, CTR, average view duration, and calculated engagement rate. YouTube Studio provides this data. Review monthly to identify patterns and optimize future content.",
  },
  {
    q: "How do YouTube Live streams affect engagement rate?",
    a: "YouTube Live streams have distinct engagement patterns from regular videos. Live engagement includes: live chat messages, Super Chats/Super Stickers, memberships joined during stream, and likes. After going live, the archived video accumulates standard engagement. Lives typically show higher engagement rates due to real-time interaction incentive. Calculate live engagement separately: (Chat Messages + Likes + Super Chats) ÷ Peak Concurrent Viewers × 100. Strong live engagement (5-10% participation) indicates an active, invested community.",
  },
  {
    q: "What's the difference between engagement rate and watch time?",
    a: "Watch time measures total minutes viewers spend watching your content—YouTube's most important algorithm factor. Engagement rate measures interactions (likes, comments, shares) relative to views. Both matter but differently: high watch time signals content quality and keeps YouTube distributing your video; high engagement signals content that resonates emotionally. Ideal videos have both—viewers watch fully AND engage. A video with high engagement but low watch time may be controversial. A video with high watch time but low engagement is still valuable for algorithm but may not build community.",
  },
  {
    q: "Why does YouTube engagement rate fluctuate between videos?",
    a: "YouTube engagement fluctuates due to: content topic variation (some topics naturally engage more), thumbnail/title effectiveness affecting who clicks, audience mood and timing (holidays, news events), video length (shorter often gets higher engagement percentage), content format (tutorials vs vlogs vs reviews), recommendation source (search viewers behave differently than homepage viewers), and algorithm distribution patterns. This variation is normal. Track 10-video rolling averages for true trends. Identify your engagement 'baseline' content versus 'breakthrough' performers.",
  },
  {
    q: "How do YouTube Community posts affect engagement?",
    a: "YouTube Community posts (polls, images, text updates) are powerful for maintaining engagement between uploads. They don't count toward video engagement rate but significantly impact channel health: they keep subscribers connected, signal to YouTube that your channel is active, drive traffic to new uploads, build anticipation for upcoming content, and provide audience research opportunities. Aim for 2-4 Community posts per week. Polls typically get highest engagement, followed by images, then text. Active Community use often correlates with higher video engagement.",
  },
  {
    q: "What tools can I use to track YouTube engagement rate?",
    a: "Track YouTube engagement using: this free YouTube Engagement Rate Calculator for quick calculations, YouTube Studio Analytics (free, detailed per-video metrics), PostPlanify for multi-platform scheduling and analytics, TubeBuddy or vidIQ for advanced YouTube-specific analytics and competitor research, Social Blade for public channel tracking and growth statistics, and NoxInfluencer for influencer-level analytics. For accurate tracking, use consistent tools and formulas over time. Export data monthly to spreadsheets for long-term trend analysis.",
  },
  {
    q: "How do I compare my engagement rate to competitors on YouTube?",
    a: "To benchmark YouTube engagement against competitors: identify 5-10 channels with similar subscriber counts in your niche, calculate their engagement rates on their last 10 videos using publicly visible likes, comments, and views, track monthly, and calculate averages. Tools like Social Blade, vidIQ, or TubeBuddy provide competitor analytics. Focus on channels with similar content styles since niche affects rates significantly. Note that you can't see their watch time, so engagement rate and view-to-subscriber ratio are your best comparison metrics.",
  },
];

const RELATED_RESOURCES = [
  {
    title: "Scheduler Comparisons & Reviews",
    links: [
      { label: "Best Hootsuite Alternatives for YouTube Creators", href: "/compare/hootsuite" },
      { label: "Buffer vs Hootsuite for YouTube", href: "/compare/buffer" },
      { label: "Top YouTube Scheduler Tools", href: "/compare" },
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
      { label: "YouTube Title Generator", href: "/tools/youtube-title-generator" },
      { label: "YouTube Description Generator", href: "/tools/youtube-description-generator" },
      { label: "YouTube Tag Generator", href: "/tools/youtube-tag-generator" },
    ],
  },
];

const ARTICLES = [
  { title: "How to Calculate YouTube Engagement Rate", href: "/blog/youtube-engagement-rate" },
  { title: "YouTube Algorithm 2026: Complete Guide", href: "/blog/youtube-algorithm" },
  { title: "Best Time to Post on YouTube", href: "/blog/best-time-to-post-youtube" },
  { title: "YouTube Marketing Strategy for Brands", href: "/blog/youtube-marketing-strategy" },
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
              Schedule Your YouTube Videos In Seconds
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Upload and schedule in advance. Your uploads go live even when you&apos;re offline.
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
      <h2 className="text-2xl font-bold mb-4">Calculate YouTube Engagement Rate</h2>
      <div className="flex items-center gap-6 mb-2">
        <span className="text-sm font-medium">Calculate by:</span>
        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setByFollowers(false)}>
          <span className="inline-flex items-center justify-center size-4 rounded border border-input bg-background">
            {!byFollowers && <Check className="size-3 text-foreground" />}
          </span>
          <span className="text-sm">Per View (Default)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setByFollowers(true)}>
          <span className="inline-flex items-center justify-center size-4 rounded border border-input bg-background">
            {byFollowers && <Check className="size-3 text-foreground" />}
          </span>
          <span className="text-sm">Per Subscriber</span>
        </label>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Most accurate for comparing video performance and viral potential
      </p>

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
            {byFollowers ? "Subscribers" : "Views"}
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
          {byFollowers ? "Add subscribers to calculate" : "Add views to calculate"}
        </p>
      </div>
    </Card>
  );
}

const OTHER_PLATFORMS: { name: keyof typeof SOCIAL_SVG; label: string; href: string; color: string }[] = [
  { name: "Instagram", label: "Instagram Engagement Calculator", href: "/tools/instagram-engagement-calculator", color: "text-pink-500" },
  { name: "Twitter", label: "TikTok Engagement Calculator", href: "/tools/tiktok-engagement-calculator", color: "text-black dark:text-white" },
  { name: "Linkedin", label: "LinkedIn Engagement Calculator", href: "/tools/linkedin-engagement-calculator", color: "text-blue-600" },
  { name: "Facebook", label: "Facebook Engagement Calculator", href: "/tools/facebook-engagement-calculator", color: "text-blue-500" },
  { name: "Twitter", label: "X (Twitter) Engagement Calculator", href: "/tools/twitter-engagement-calculator", color: "text-black dark:text-white" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function YouTubeEngagementCalculatorClient() {
  return (
    <>
      <Header />

      <main>
        {/* HERO */}
        <section className="py-8">
          <Container>
            <div className="flex flex-col items-center gap-4">
              <div className="text-red-500 p-2 mb-2">
                <svg
                  aria-label="YouTube"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ width: 40, height: 40 }}
                >
                  <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                </svg>
              </div>
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  YouTube Engagement Rate Calculator
                </h1>
                <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
                  Measure your YouTube video performance with our free engagement rate calculator. Enter your likes, comments, views or subscribers to get instant insights and compare to industry benchmarks.
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
                Calculate your YouTube engagement rate in three simple steps.
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
                  YouTube Engagement Rate Benchmarks 2026
                </h2>
                <p className="text-lg text-muted-foreground">
                  Compare your engagement rate against industry standards. These benchmarks are based on analysis of thousands of YouTube accounts across different sizes and niches.
                </p>
              </div>

              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border bg-background p-1">
                  <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-red-700 text-white px-4 py-2 text-sm font-medium">
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
                            <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-red-500 to-red-700 text-white">
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
                See how creators, brands, and agencies use YouTube engagement data to grow.
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
                Actionable strategies to boost your YouTube engagement rate.
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
                Quick fixes for the most common YouTube engagement challenges.
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
                Stop juggling apps. PostPlanify gives you a full content calendar, AI caption writer, and YouTube scheduler in one place.
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