"use client";
import * as React from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Star,
  ChevronDown,
  ArrowRight,
  Copy,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const COUNT_OPTIONS = [
  { v: "5", label: "5 hashtags" },
  { v: "10", label: "10 hashtags" },
  { v: "15", label: "15 hashtags" },
  { v: "20", label: "20 hashtags" },
  { v: "30", label: "30 hashtags" },
];
const MIX_OPTIONS = ["Balanced Mix", "Popular (High reach)", "Medium (Moderate)", "Niche (Targeted)"] as const;

const HOW_IT_WORKS = [
  { step: 1, title: "Describe your content", body: "Enter your post topic, niche, or what your content is about. The more specific, the better the hashtag suggestions." },
  { step: 2, title: "Choose your preferences", body: "Select how many hashtags you want (5, 10, 15, 20, or 30) and the mix type (popular, medium, niche, or balanced)." },
  { step: 3, title: "Copy and use", body: "Get AI-generated hashtags instantly. Copy all at once or click individual hashtags. Paste them in your Instagram post or comment." },
];

const USE_CASES = [
  { title: "Instagram Feed Posts", body: "Generate optimized hashtags to increase reach and engagement on your Instagram feed posts." },
  { title: "Instagram Reels", body: "Find trending hashtags to boost discoverability of your short-form video content." },
  { title: "Instagram Stories", body: "Create relevant hashtags to appear in hashtag Stories and reach new audiences." },
  { title: "Business Account Growth", body: "Generate industry-specific hashtags to attract your target audience and potential customers." },
  { title: "Influencer Marketing", body: "Find niche hashtags to build authority and connect with engaged communities in your space." },
  { title: "Brand Campaigns", body: "Create branded and campaign-specific hashtags to track engagement and user-generated content." },
];

const PRO_TIPS = [
  { title: "Mix popular, medium, and niche hashtags", body: "Use a 30-40-30 split: 30% popular hashtags for broad reach, 40% medium for balanced discoverability, and 30% niche for targeted engagement. This strategy maximizes both exposure and engagement." },
  { title: "Research hashtags before using them", body: "Check if hashtags are active and relevant by searching them on Instagram. Look at recent posts—if they're spammy or unrelated to your content, skip that hashtag. Quality over quantity always wins." },
  { title: "Create hashtag sets for content categories", body: "Build collections of hashtags for different content types (product posts, behind-the-scenes, tips, etc.). This saves time and ensures you're using relevant tags. Rotate sets to avoid repetition." },
  { title: "Include branded and community hashtags", body: "Create a branded hashtag for your business and use it consistently. Also join community hashtags in your niche—they connect you with engaged audiences who actively follow those tags." },
  { title: "Place hashtags strategically", body: "For cleaner captions, add hashtags in the first comment or after line breaks in your caption. Instagram's algorithm treats both placements equally, so choose based on your aesthetic preference." },
  { title: "Track hashtag performance", body: "Use Instagram Insights to see which hashtags drive the most reach. Double down on what works and replace underperforming hashtags. Regular optimization improves your hashtag strategy over time." },
  { title: "Avoid banned and restricted hashtags", body: "Some hashtags are blocked by Instagram for spam or inappropriate content. Search hashtags before using them to make sure they're not restricted, which could hurt your post's visibility." },
  { title: "Use hashtags relevant to your content", body: "Never use popular but irrelevant hashtags just for reach. Instagram's algorithm detects mismatched content and may reduce your post's distribution. Relevance is more important than popularity." },
  { title: "Include location-based hashtags", body: "If your content is location-specific, add city or neighborhood hashtags. These help you reach local audiences and face less competition than generic hashtags." },
  { title: "Update hashtags for trends", body: "When relevant trends emerge in your niche, incorporate those hashtags into your posts. Trending hashtags can significantly boost reach when used authentically with related content." },
  { title: "Check competitor hashtags", body: "Research what hashtags successful accounts in your niche use. Don't copy exactly, but learn from their strategy and adapt effective hashtags for your own content." },
  { title: "Use hashtags immediately when posting", body: "Add hashtags right away, either in the caption or first comment. Instagram indexes content quickly, and immediate hashtag presence helps your post appear in hashtag feeds from the start." },
];

const ISSUES = [
  { q: "⚠️Hashtags not driving any reach", solutions: ["Check if you're using banned or restricted hashtags", "Try using more niche, less competitive hashtags", "Ensure your hashtags are relevant to your content"] },
  { q: "⚠️Posts getting lost in popular hashtags", solutions: ["Use more medium and niche hashtags instead of only popular ones", "Apply the 30-40-30 ratio (popular-medium-niche)", "Target hashtags with 10K-500K posts for better visibility"] },
  { q: "⚠️Same reach regardless of hashtags", solutions: ["Focus on content quality first—hashtags amplify good content", "Post at optimal times when your audience is active", "Engage with your audience to boost overall account health"] },
  { q: "⚠️Not sure which hashtags are niche vs popular", solutions: ["Search hashtags on Instagram to see post counts", "Under 100K = niche, 100K-1M = medium, 1M+ = popular", "Use our generator with the \"balanced\" mix option"] },
  { q: "⚠️Hashtags looking spammy in captions", solutions: ["Post hashtags in the first comment instead", "Use line breaks to separate hashtags from caption", "Reduce to 15-20 well-chosen hashtags if needed"] },
  { q: "⚠️Suspected shadowban from hashtag use", solutions: ["Remove all banned/restricted hashtags from recent posts", "Take a break from hashtags for a few days", "Focus on engagement and quality content to recover"] },
];

const FAQS = [
  { q: "How many hashtags should I use on Instagram?", a: "Instagram allows up to 30 hashtags per post. Studies show that posts with 20-30 hashtags often get the most engagement. However, the key is relevance—30 irrelevant hashtags perform worse than 10 highly relevant ones. Start with 20-30 and test what works best for your audience." },
  { q: "What are the best hashtags for Instagram growth?", a: "The best hashtags for growth are a mix of: popular hashtags (1M+ posts) for reach, medium hashtags (100K-1M posts) for discoverability, and niche hashtags (under 100K posts) for targeted engagement. This balanced strategy helps you reach both broad and specific audiences." },
  { q: "Should I put hashtags in comments or captions?", a: "Both work equally well for discoverability since Instagram's 2023 update. Putting hashtags in captions keeps everything in one place. Putting them in comments looks cleaner. Choose based on your aesthetic preference—it won't affect your reach either way." },
  { q: "How do Instagram hashtags work?", a: "Hashtags categorize your content and make it discoverable. When users search or follow a hashtag, your post can appear in their feed or Explore page. Instagram's algorithm also uses hashtags to understand your content and show it to interested users." },
  { q: "What hashtags should I avoid on Instagram?", a: "Avoid banned/restricted hashtags (Instagram hides posts using them), overly generic hashtags like #love or #instagood (too competitive), irrelevant hashtags (hurts credibility), and spammy hashtags like #followforfollow. Stick to relevant, active hashtags in your niche." },
  { q: "Do hashtags still work on Instagram in 2026?", a: "Yes, hashtags remain an important discovery tool on Instagram. While the algorithm has evolved to prioritize content quality and engagement, hashtags still help categorize content and reach new audiences. The key is using relevant, strategic hashtags rather than random popular ones." },
  { q: "What are niche hashtags and why use them?", a: "Niche hashtags are specific, low-competition tags with fewer posts (typically under 100K). They're valuable because your content is more likely to be seen and rank in smaller hashtag feeds. Examples: instead of #fitness (500M posts), use #homeworkoutmoms (50K posts)." },
  { q: "How often should I change my hashtags?", a: "Change your hashtags for each post based on the specific content. Using the same hashtags repeatedly can look spammy to Instagram's algorithm. Create hashtag sets for different content types and rotate them. Our generator helps create fresh, relevant hashtags every time." },
  { q: "Can hashtags get my account shadowbanned?", a: "Using banned or restricted hashtags can reduce your reach (sometimes called shadowban). Avoid hashtags that Instagram has flagged for spam or inappropriate content. Also avoid using hashtags that have nothing to do with your content—this signals low-quality posting to the algorithm." },
  { q: "What's the difference between popular and niche hashtags?", a: "Popular hashtags (millions of posts) give massive exposure but your post gets buried quickly. Niche hashtags (thousands of posts) have less reach but your content stays visible longer and reaches more targeted users. A balanced mix of both maximizes discovery potential." },
  { q: "Do hashtags work for Instagram Reels?", a: "Yes, hashtags help Reels get discovered. Use 3-5 highly relevant hashtags for Reels—the algorithm relies more on content analysis for Reels, but hashtags still help categorization. Include trending hashtags related to your content and popular Reels-specific tags." },
  { q: "How do I find trending Instagram hashtags?", a: "Our AI-powered generator analyzes current trends to suggest relevant hashtags. You can also check the Explore page, look at what successful accounts in your niche use, and use Instagram's search to see hashtag popularity. The key is finding trending tags relevant to your content." },
  { q: "Is this Instagram hashtag generator free?", a: "Yes, completely free with no signup required. Enter your topic, select how many hashtags you want and the mix type (popular, medium, niche, or balanced), and get instant AI-generated hashtags. No limits, no watermarks, no hidden fees." },
  { q: "Can I use the same hashtags for Stories?", a: "Stories support up to 10 hashtags, but they work differently. Story hashtags help you appear in hashtag Stories (when users browse a hashtag). Use your most relevant 3-5 hashtags for Stories. You can hide them by making them small or matching them to your background." },
  { q: "What's the best hashtag size strategy?", a: "Use a 30-40-30 ratio: 30% popular (1M+ posts), 40% medium (100K-1M posts), 30% niche (under 100K posts). This gives you broad reach from popular tags while increasing your chances of ranking in smaller, more targeted hashtag feeds." },
  { q: "Do branded hashtags help on Instagram?", a: "Yes, branded hashtags are excellent for building community and tracking user-generated content. Create a unique hashtag for your brand, use it consistently, and encourage followers to use it. This creates a searchable collection of content related to your brand." },
  { q: "How do I know if a hashtag is banned?", a: "Search the hashtag on Instagram. If you see a message saying 'Recent posts hidden' or if there are no recent posts despite high volume, it may be banned or restricted. Avoid using these hashtags as they can hurt your post's reach." },
  { q: "Should I use location hashtags?", a: "Yes, location hashtags help local businesses and location-specific content reach relevant audiences. Use city, neighborhood, or landmark hashtags when your content is location-relevant. They have less competition than generic hashtags and reach more targeted users." },
  { q: "How do hashtags affect the Instagram algorithm?", a: "Hashtags help Instagram understand your content and show it to interested users. The algorithm considers hashtag relevance, your account's history with those hashtags, and engagement patterns. Using relevant hashtags consistently helps Instagram categorize your content better." },
  { q: "Can I research hashtag performance?", a: "Yes, Instagram Insights shows how many impressions came from hashtags for each post. Track which hashtag combinations drive the most reach over time. Our generator helps you discover new hashtags, and you can track their performance in your analytics." },
  { q: "What's the difference between hashtags and keywords?", a: "Hashtags are clickable, searchable tags that categorize content (#photography). Keywords are words in your caption that Instagram's algorithm reads for context. Use both: hashtags for discoverability and keywords naturally in captions for SEO." },
  { q: "How quickly should I add hashtags after posting?", a: "Add hashtags immediately when posting or within the first few minutes. Instagram indexes posts quickly, and having hashtags from the start ensures your content appears in hashtag feeds right away. Delayed hashtag addition may reduce initial discovery." },
];

const OTHER_PLATFORMS = [
  { label: "TikTok Hashtag Generator", desc: "Generate trending hashtags to boost discoverability for your TikTok videos.", href: "/tools/tiktok-hashtag-generator" },
  { label: "Facebook Hashtag Generator", desc: "Create relevant hashtags to increase reach on your Facebook posts.", href: "/tools/facebook-hashtag-generator" },
  { label: "LinkedIn Hashtag Generator", desc: "Generate professional hashtags to expand reach on LinkedIn.", href: "/tools/linkedin-hashtag-generator" },
  { label: "Pinterest Hashtag Generator", desc: "Create searchable hashtags to drive traffic to your pins.", href: "/tools/pinterest-hashtag-generator" },
  { label: "YouTube Hashtag Generator", desc: "Generate SEO-friendly hashtags to improve YouTube video discoverability.", href: "/tools/youtube-hashtag-generator" },
  { label: "Threads Hashtag Generator", desc: "Create trending hashtags for your Threads posts to reach engaged communities.", href: "/tools/threads-hashtag-generator" },
];

const RELATED = [
  { title: "Best Later Alternatives for Instagram in 2026", desc: "Compare the top Later alternatives for Instagram creators and brands", href: "/alternative-to-later" },
  { title: "Buffer vs Later: Which is Better for Instagram?", desc: "In-depth Buffer vs Later comparison for Instagram scheduling", href: "/compare/buffer-vs-later" },
  { title: "Later Pricing: Is It Worth the Cost in 2026?", desc: "Full Later pricing breakdown with hidden costs and cheaper options", href: "/later-pricing" },
  { title: "Best Planable Alternatives for Instagram", desc: "Top Planable alternatives for Instagram content collaboration", href: "/alternative-to-planable" },
  { title: "Metricool vs Publer: Full Feature Comparison", desc: "Detailed Metricool vs Publer comparison for Instagram marketers", href: "/compare/metricool-vs-publer" },
  { title: "Metricool Pricing Breakdown 2026", desc: "Is Metricool worth the cost? Full pricing analysis for 2026", href: "/metricool-pricing" },
  { title: "Best Later Alternatives: Full 2026 Guide", desc: "In-depth guide to the top Later alternatives for Instagram creators", href: "/blog/best-later-alternatives" },
  { title: "Best Metricool Alternatives Compared", desc: "Side-by-side Metricool alternatives guide for Instagram marketers", href: "/blog/best-metricool-alternatives" },
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
/*  Hashtag generator logic                                            */
/* ------------------------------------------------------------------ */

const POPULAR = [
  "love", "instagood", "photooftheday", "fashion", "beautiful", "happy",
  "cute", "tbt", "like4like", "followme", "picoftheday", "follow",
  "me", "selfie", "summer", "art", "instadaily", "friends", "repost",
  "nature", "fun", "style", "smile", "food", "instalike",
];

const MEDIUM = [
  "explorepage", "instaphoto", "photographer", "lifestyle", "travelgram",
  "fitnessmotivation", "foodie", "beauty", "fashionista", "wellness",
  "marketing", "entrepreneur", "smallbusiness", "digitalmarketing",
  "socialmedia", "creativity", "mindfulness", "selfcare",
];

const NICHE_TPL = [
  "{topic}", "{topic}lover", "{topic}life", "{topic}gram", "{topic}daily",
  "love{topic}", "my{topic}", "best{topic}", "{topic}tips", "{topic}community",
];

function pickByMix(mix: string, topic: string, count: number): string[] {
  const t = topic.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  const dynamicNiche = t
    ? NICHE_TPL.map((tmpl) => tmpl.replace(/\{topic\}/g, t))
    : [];
  let pool: string[] = [];
  if (mix.startsWith("Popular")) {
    pool = [...POPULAR];
  } else if (mix.startsWith("Medium")) {
    pool = [...MEDIUM, ...dynamicNiche.slice(0, 5)];
  } else if (mix.startsWith("Niche")) {
    pool = [...dynamicNiche, ...NICHE_TPL.slice(0, 8).map((tmpl) => tmpl.replace(/\{topic\}/g, t || "lifestyle"))];
  } else {
    // Balanced: 30% popular, 40% medium, 30% niche
    const popCount = Math.ceil(count * 0.3);
    const medCount = Math.floor(count * 0.4);
    const nicheCount = count - popCount - medCount;
    pool = [
      ...POPULAR.slice(0, popCount),
      ...MEDIUM.slice(0, medCount),
      ...dynamicNiche.slice(0, nicheCount),
    ];
    if (pool.length < count) {
      while (pool.length < count) pool.push(...MEDIUM);
    }
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of pool) {
    const tag = (h.startsWith("#") ? h : "#" + h).toLowerCase().replace(/[^a-z0-9#]/g, "");
    if (!seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
    if (out.length >= count) break;
  }
  return out.slice(0, count);
}

function generateHashtags(topic: string, count: number, mix: string): string[] {
  const safe = topic.trim() || "lifestyle";
  return pickByMix(mix, safe, count);
}

/* ------------------------------------------------------------------ */
/*  Hashtag Generator Widget                                           */
/* ------------------------------------------------------------------ */

function GeneratorWidget() {
  const [topic, setTopic] = React.useState("");
  const [count, setCount] = React.useState("15");
  const [mix, setMix] = React.useState<string>("Balanced Mix");
  const [tags, setTags] = React.useState<string[]>([]);
  const [generating, setGenerating] = React.useState(false);
  const [copiedAll, setCopiedAll] = React.useState(false);

  function handleGenerate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setTags([]);
    setTimeout(() => {
      setTags(generateHashtags(topic, parseInt(count, 10), mix));
      setGenerating(false);
    }, 600);
  }

  async function handleCopyAll() {
    try {
      await navigator.clipboard.writeText(tags.join(" "));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {}
  }

  async function handleCopyOne(t: string) {
    try {
      await navigator.clipboard.writeText(t);
    } catch {}
  }

  return (
    <div className="rounded-xl bg-card text-card-foreground shadow p-6 border">
      <div className="flex items-center gap-2 mb-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary">
          <line x1="4" y1="9" x2="20" y2="9" />
          <line x1="4" y1="15" x2="20" y2="15" />
          <line x1="10" y1="3" x2="8" y2="21" />
          <line x1="16" y1="3" x2="14" y2="21" />
        </svg>
        <h2 className="text-xl font-semibold">Instagram Hashtag Generator</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Generate trending hashtags for your Instagram posts</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="topic" className="text-sm font-medium">What is your post about?</label>
          <textarea
            id="topic"
            placeholder="Describe your post topic, niche, or content (e.g., vegan breakfast, fitness tips, travel Tokyo)..."
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, 500))}
            rows={4}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="text-xs text-muted-foreground text-right">{topic.length}/500</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Number of hashtags</label>
            <select value={count} onChange={(e) => setCount(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              {COUNT_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Hashtag mix</label>
            <select value={mix} onChange={(e) => setMix(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              {MIX_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!topic.trim() || generating}
          className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-md bg-black text-white hover:bg-zinc-800 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          {generating ? "Generating..." : "Generate Hashtags"}
        </button>

        {tags.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">Your hashtags ({tags.length})</span>
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {copiedAll ? <><Check className="w-3 h-3" />Copied all</> : <><Copy className="w-3 h-3" />Copy all</>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-4">
              {tags.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleCopyOne(t)}
                  className="inline-flex items-center rounded-full bg-white border px-3 py-1 text-xs font-medium hover:bg-primary hover:text-white transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
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
              <img alt="PostPlanify logo" width={24} height={24} className="rounded-full" src="/logo.png" />
              <span className="text-md font-semibold">PostPlanify</span>
            </div>
            <p className="text-xl font-semibold">Manage All Your Social Accounts Without the Chaos</p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Schedule posts, track performance, and collaborate with your team.</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-2 my-4">
            {SOCIAL_ICONS.map(({ label, color, d }) => (
              <div key={label} className={`transition-all duration-200 ${color} hover:opacity-80`} title={label}>
                <svg role="img" aria-label={label} viewBox="0 0 24 24" fill="currentColor" width={32} height={32} className="w-8 h-8"><path d={d} /></svg>
              </div>
            ))}
          </div>
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-black text-white hover:bg-zinc-800 font-medium transition-colors">Start 7-day Free Trial</Link>
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-2">
            <span className="inline-flex items-center gap-1"><CheckCircle2 style={{ width: 14, height: 14 }} className="text-emerald-500" />Content Calendar</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 style={{ width: 14, height: 14 }} className="text-emerald-500" />Full Analytics</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 style={{ width: 14, height: 14 }} className="text-emerald-500" />Social Inbox</span>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {TESTIMONIALS.slice(0, 5).map((t, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} alt={t.name} width={32} height={32} className="rounded-full border-2 border-white w-8 h-8 object-cover" src={t.avatar} />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map((i) => (<Star key={i} style={{ width: 14, height: 14 }} fill="currentColor" />))}
              </div>
              <span className="text-xs text-muted-foreground">Trusted by 2150+ businesses</span>
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
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</div>
        </details>
      ))}
    </div>
  );
}

function IssuesAccordion({ items }: { items: { q: string; solutions: string[] }[] }) {
  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {items.map((issue, i) => (
        <details key={i} className="group rounded-lg border bg-card overflow-hidden">
          <summary className="cursor-pointer list-none p-4 sm:p-5 flex items-start justify-between gap-3">
            <span className="font-medium text-left">{issue.q}</span>
            <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-1 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground">
            <p className="font-medium mb-3">Try these solutions:</p>
            <ul className="space-y-2">
              {issue.solutions.map((s, j) => (
                <li key={j} className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{s.replace(/^✓\s*/, "")}</span>
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

export function InstagramHashtagGeneratorClient() {
  return (
    <>
      <Header />
      <main>
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white">
                  <line x1="4" y1="9" x2="20" y2="9" />
                  <line x1="4" y1="15" x2="20" y2="15" />
                  <line x1="10" y1="3" x2="8" y2="21" />
                  <line x1="16" y1="3" x2="14" y2="21" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">Free Instagram Hashtag Generator</h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Generate relevant, trending hashtags for your Instagram posts with AI. Boost your reach and engagement with the perfect hashtag mix. Free tool, no signup required.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <GeneratorWidget />
              <PromoCard />
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-6">How It Works</h2>
            </div>
            <div className="space-y-3">
              {HOW_IT_WORKS.map((step) => (
                <Card key={step.step} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">{step.step}</div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.body}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Popular Use Cases</h2>
              <p className="text-sm text-muted-foreground">For Instagram creators and brands</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {USE_CASES.map((u, i) => (
                <Card key={i} className="p-6 pb-3 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <line x1="4" y1="9" x2="20" y2="9" />
                        <line x1="4" y1="15" x2="20" y2="15" />
                        <line x1="10" y1="3" x2="8" y2="21" />
                        <line x1="16" y1="3" x2="14" y2="21" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold mb-1">{u.title}</h3>
                    </div>
                  </div>
                  <div className="pt-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{u.body}</p>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">💡 Pro Tips</h2>
              <p className="text-sm text-muted-foreground">Build a winning Instagram hashtag strategy</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRO_TIPS.map((tip, i) => (
                <Card key={i} className="p-6 h-full">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">{i + 1}</div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold mb-2">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip.body}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Common Issues &amp; Solutions</h2>
              <p className="text-sm text-muted-foreground">Hashtag problems — and how to solve them</p>
            </div>
            <IssuesAccordion items={ISSUES} />
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Everything about Instagram hashtags</p>
            </div>
            <FaqAccordion items={FAQS} />
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Hashtag Generators for Other Platforms</h2>
              <p className="text-sm text-muted-foreground">Generate hashtags for every major social platform</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {OTHER_PLATFORMS.map((p, i) => (
                <Link key={i} href={p.href} className="block rounded-xl border bg-card text-card-foreground shadow hover:shadow-md transition-all duration-200 hover:border-primary/40 p-5">
                  <h3 className="font-semibold mb-2">{p.label}</h3>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Related Resources</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {RELATED.map((r, i) => (
                <Link key={i} href={r.href} className="block rounded-xl border bg-card text-card-foreground shadow hover:shadow-md transition-all duration-200 hover:border-primary/40 p-5 h-full">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{r.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-3">{r.desc}</p>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-3xl">
            <Card className="p-8 text-center">
              <h3 className="font-semibold text-xl mb-2">Post smarter, not harder.</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">Schedule, preview, and publish across all major platforms — from one simple dashboard.</p>
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-black text-white hover:bg-zinc-800 font-medium transition-colors">Start 7-day Free Trial <ArrowRight className="size-4" /></Link>
            </Card>
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
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
                            {Array.from({ length: 5 }).map((_, j) => (<Star key={j} className="size-3 text-yellow-400 fill-current" />))}
                          </div>
                        </div>
                      </div>
                      <a href="https://www.producthunt.com/products/postplanify/launches/postplanify" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="View on ProductHunt">
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

        <section className="py-12 sm:py-16 px-4 text-center">
          <Container className="max-w-6xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">Connect and publish to all your favorite platforms</h2>
            <p className="text-sm text-muted-foreground/70 mb-10">Powered by official platform APIs — reliable and secure</p>
            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
              {SOCIAL_ICONS.map(({ label, color, d }) => (
                <div key={label} className="flex flex-col items-center space-y-2 max-w-20">
                  <div className={`transition-colors duration-200 ${color} hover:opacity-80`}>
                    <svg role="img" aria-label={label} viewBox="0 0 24 24" fill="currentColor" width={32} height={32} className="w-8 h-8"><path d={d} /></svg>
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