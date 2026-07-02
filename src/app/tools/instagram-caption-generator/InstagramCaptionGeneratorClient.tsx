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

const TONES = ["Casual", "Professional", "Funny", "Inspirational", "Bold"] as const;
const HASHTAG_OPTIONS = [
  { v: "0", label: "No hashtags" },
  { v: "5", label: "5 hashtags" },
  { v: "10", label: "10 hashtags" },
  { v: "15", label: "15 hashtags" },
];
const LENGTHS = ["Short (concise)", "Long (detailed)"] as const;

const HOW_IT_WORKS = [
  { step: 1, title: "Describe your Instagram post", body: "Tell us what your post is about. Include details about the content, product, mood, target audience, or message you want to convey. The more specific, the better your captions." },
  { step: 2, title: "Choose your style and preferences", body: "Select your preferred tone (casual, professional, funny, etc.), caption length (short or long), and whether to include hashtags (0, 5, 10, or 15)." },
  { step: 3, title: "Generate and copy your caption", body: "Click generate to get 2 unique caption options optimized for Instagram. Copy your favorite, personalize if needed, paste it into Instagram, and post." },
];

const USE_CASES = [
  { title: "Daily Feed Posts", body: "Quickly generate engaging captions for your regular Instagram content to keep your feed active." },
  { title: "Product Launches", body: "Create compelling captions for new product announcements with strategic feature highlights." },
  { title: "Behind-the-Scenes", body: "Share authentic moments from your process with captions that feel personal and relatable." },
  { title: "Inspiration & Quotes", body: "Pair motivational content with captions that amplify your message and encourage saves." },
  { title: "User-Generated Content", body: "Repost customer content with thoughtful captions that credit creators and build community." },
  { title: "Promotions & Sales", body: "Drive conversions with action-oriented captions for promotions, discounts, and limited offers." },
];

const PRO_TIPS = [
  { title: "Start with a hook", body: "The first line shows before \"more\" - make it count. Lead with a question, bold statement, or intriguing opener that makes people tap to read the rest." },
  { title: "Add a clear call to action", body: "End with a CTA: \"Double tap if you agree,\" \"Tag a friend who needs this,\" \"Save for later,\" or \"Share your thoughts below.\" This tells followers what to do and boosts engagement." },
  { title: "Use line breaks for readability", body: "Long blocks of text are hard to read on mobile. Break your caption into short paragraphs with blank lines between them. Our generator does this automatically for longer captions." },
  { title: "Mix hashtag sizes strategically", body: "Don't just use massive hashtags with millions of posts. Mix large (1M+ posts), medium (100K-1M), and niche (10K-100K) hashtags for the best balance of reach and discoverability." },
  { title: "Match tone to content type", body: "A funny caption on a serious post feels off. Choose the tone that matches your visual content and audience expectations. Aesthetic photos often need minimal captions; carousels benefit from context." },
  { title: "Personalize the AI output", body: "AI-generated captions are a starting point. Add personal anecdotes, specific details about your experience, or references only your audience would understand to make them truly yours." },
  { title: "Include 3-5 relevant hashtags", body: "Studies show 3-5 highly relevant hashtags often outperform 20+ generic ones. Instagram's algorithm favors relevance over quantity for content distribution." },
  { title: "Test caption lengths", body: "Short captions work for aesthetic posts; long captions (150+ words) boost engagement for educational or storytelling content. Test both and measure results." },
  { title: "Ask questions to drive comments", body: "Caption questions boost comment rates by 30%+. End with \"What do you think?\" or \"Have you tried this?\" to invite conversation." },
  { title: "Use emojis sparingly and intentionally", body: "One to three strategic emojis add personality without cluttering your caption. Match emoji tone to your brand voice—professional accounts should use minimal emojis." },
  { title: "Save top-performing captions", body: "Track which captions drive the most engagement, then create templates based on those winners. Replicate what works instead of reinventing every time." },
  { title: "Optimize the first 125 characters", body: "Instagram shows only the first 125 characters before \"more.\" Put your hook, value proposition, or most important point at the very beginning of your caption." },
];

const ISSUES = [
  { q: "⚠️Generated captions feel too generic", solutions: ["Add more specific details about your post content in the description", "Mention your niche, target audience, and the specific emotion you want to evoke", "Describe what makes YOUR content unique compared to similar posts", "Try regenerating with a different tone selection", "Edit the output to add your personal catchphrases, inside jokes, or brand voice"] },
  { q: "⚠️Hashtags don't match my content or niche", solutions: ["Be more specific about your niche in the description (e.g., \"vegan meal prep for busy professionals\" not just \"food\")", "Select fewer hashtags (5 instead of 15) for more relevant suggestions", "Manually replace 1-2 hashtags with your proven performers", "Mention specific hashtag communities you want to reach in your description"] },
  { q: "⚠️Captions are too long or too short", solutions: ["Use the caption length selector to explicitly choose \"short\" or \"long\"", "For punchy captions, describe a simpler concept or ask for \"minimal text\"", "For longer storytelling captions, mention you want \"detailed\" or \"story format\"", "Edit the output to trim unnecessary words or expand with personal details"] },
  { q: "⚠️Tone doesn't match my brand voice", solutions: ["Try different tone options until you find the closest match", "Describe your brand voice in the input (e.g., \"witty and sarcastic\" or \"warm and encouraging\")", "Generate multiple options and mix elements from different outputs", "Use generated captions as a framework and rewrite in your voice"] },
];

const FAQS = [
  { q: "How does the AI Instagram caption generator work?", a: "Our AI analyzes your post description, selected tone, length, and hashtag preferences to craft captions optimized for Instagram engagement. It uses natural language patterns that perform well on the platform, combining proven copywriting formulas with platform-specific best practices." },
  { q: "Are the generated captions unique?", a: "Yes, every caption generated is unique to your specific input. We use AI to create original content based on your description. However, always review and personalize captions before posting to ensure they reflect your authentic voice and brand." },
  { q: "Can I use these captions for Instagram Reels?", a: "Absolutely! Our generator works for any Instagram content type—feed posts, Reels, carousel posts, and Stories. For Reels specifically, ask for shorter punchy captions in your description. The same caption principles apply across formats." },
  { q: "Is this Instagram caption generator free?", a: "Yes, completely free with no signup required. Generate unlimited Instagram captions with various tones, lengths, and hashtag options. No watermarks, no hidden fees, no account creation." },
  { q: "What is the ideal Instagram caption length?", a: "Instagram allows up to 2,200 characters, but engagement is highest at 150-300 characters for most posts. For educational or storytelling content, longer captions (500+ characters) can work well and signal depth to the algorithm." },
  { q: "Does the AI add emojis automatically?", a: "Our generator may include 1-3 strategic emojis based on the tone you select. You can request no emojis or more emojis by adding specific instructions in your description. Always review emojis to ensure they fit your brand voice." },
  { q: "Can I edit the generated captions?", a: "Yes, and we highly recommend personalizing every caption before posting. Add specific details about your experience, brand catchphrases, or inside references only your audience would understand to make captions truly yours." },
  { q: "How many hashtags should I use on Instagram?", a: "Instagram allows up to 30 hashtags, but research shows 3-5 highly relevant hashtags typically perform best. Use our \"5 hashtags\" or \"10 hashtags\" options to start, then experiment to find what works for your specific audience." },
  { q: "Should I put hashtags in the caption or first comment?", a: "Both approaches work and reach similar results. Putting hashtags in the first comment keeps captions cleaner visually, but in-caption hashtags are more visible to anyone reading the caption. Choose based on your aesthetic preference." },
  { q: "What's the best tone for Instagram captions?", a: "The best tone matches your brand voice and content type. Casual tones work for lifestyle content, professional for B2B, funny for entertainment, inspirational for motivational, bold for strong opinion pieces. Stay consistent with your tone across posts." },
  { q: "Can I generate captions in other languages?", a: "Our generator works best in English but can also generate captions in Spanish, French, German, and several other languages. Mention the target language in your post description to get the best results in that language." },
  { q: "How do I make my captions go viral?", a: "There are no guarantees in virality, but engagement-driving captions share these traits: a strong hook in the first line, emotional resonance, a clear call to action, and 3-5 relevant hashtags. Combining these elements increases the chances of algorithmic promotion." },
  { q: "What makes a caption engaging on Instagram?", a: "Engaging captions typically include: a relatable hook, personal stories or insights, clear formatting with line breaks, a question or CTA, and relevant hashtags. Most importantly, they provide value—entertainment, information, or inspiration—to keep readers engaged." },
  { q: "Can I use this for business accounts?", a: "Yes! This tool is perfect for business accounts, agencies, and marketers managing multiple Instagram profiles. Save your preferred settings and use them consistently across client accounts for streamlined content creation." },
  { q: "What's the difference between this and ChatGPT?", a: "While ChatGPT is a general AI tool, our generator is specifically optimized for Instagram. It understands platform character limits, hashtag strategies, engagement patterns, and tone nuances specific to Instagram's audience." },
  { q: "Should I capitalize on trending topics?", a: "Trending topics can boost reach, but only when they're relevant to your niche. Forcing unrelated trends feels inauthentic and can hurt engagement. Our generator lets you describe trending angles in your input for relevant topical captions." },
  { q: "How long does generation take?", a: "Caption generation happens in under 2 seconds. Our AI is optimized for speed and quality, so you can quickly generate options for multiple posts without waiting. Generate, browse, copy, paste—it's that fast." },
  { q: "Can this help with Instagram SEO?", a: "Yes! Including relevant keywords in your Instagram username, bio, name field, and captions improves searchability. Our generator can incorporate SEO-friendly terms when you mention target keywords in your post description." },
  { q: "What about the algorithm and reach?", a: "Instagram's algorithm rewards content that drives conversations, saves, and shares. Our captions include proven CTAs and engagement triggers that signal to the algorithm that your content deserves wider distribution." },
  { q: "Can I generate captions for carousels?", a: "Yes! Carousel posts often perform better with longer, context-providing captions. Use our \"Long (detailed)\" option and describe the carousel narrative. Add instructions like \"mention this is a 5-slide carousel\" for more tailored outputs." },
  { q: "How do I track caption performance?", a: "Use Instagram Insights to track which captions drive the most saves, shares, and comments. A/B test different caption styles and tones to learn what resonates with your specific audience. Patterns emerge within 5-10 posts." },
  { q: "Can I save my favorite captions?", a: "We don't store your captions, but you can copy them to your notes app or use PostPlanify to save them as templates. PostPlanify's content calendar lets you save captions and reuse them across multiple posts with minor edits." },
  { q: "What's the best caption for product posts?", a: "Product post captions should highlight benefits (not just features), include social proof or testimonials, mention pricing or availability, and end with a clear CTA like \"Shop now—link in bio\" or \"DM us to order.\"" },
  { q: "Can this generate captions for Stories?", a: "Yes, but Stories have unique considerations. Stories are short-form visual content, so captions for cross-posted feed content work well. For exclusive Stories, focus on one clear message with text overlays rather than long captions." },
];

const OTHER_PLATFORMS = [
  { label: "TikTok Caption Generator", desc: "Create viral, FYP-ready captions for your TikTok videos with trending hashtags.", href: "/tools/tiktok-caption-generator" },
  { label: "Twitter Caption Generator", desc: "Craft concise, engaging tweets with optimal hashtag and emoji usage.", href: "/tools/twitter-caption-generator" },
  { label: "LinkedIn Caption Generator", desc: "Build thought-leadership posts and professional captions.", href: "/tools/linkedin-caption-generator" },
  { label: "YouTube Caption Generator", desc: "Craft compelling video descriptions and titles for YouTube.", href: "/tools/youtube-caption-generator" },
  { label: "Facebook Caption Generator", desc: "Create engaging Facebook post captions with strategic hooks.", href: "/tools/facebook-caption-generator" },
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
/*  Caption generator logic                                            */
/* ------------------------------------------------------------------ */

function pickHashtags(topic: string, count: number): string[] {
  if (count === 0) return [];
  const lower = topic.toLowerCase();
  const words = lower.split(/\W+/).filter((w) => w.length > 3 && !["with","your","this","from","have","that","about","they","them","were","what","when","make","like","just","into","over","also","some","than","them"].includes(w));
  const base = ["instagram", "instagood", "photooftheday", "love"];
  const dynamic = words.slice(0, 3);
  const result: string[] = [];
  // Combine: dedupe, capitalize
  const seen = new Set<string>();
  for (const w of [...base, ...dynamic]) {
    const tag = w.replace(/[^a-z0-9]/gi, "");
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      result.push("#" + tag);
    }
    if (result.length >= count) break;
  }
  while (result.length < count) result.push(`#explore`);
  return result.slice(0, count);
}

function generateCaptions(topic: string, tone: string, length: string, hashtagCount: number): string[] {
  const safe = topic.trim() || "this moment";
  const tags = pickHashtags(safe, hashtagCount);
  const t = safe.toLowerCase();
  const shortMode = length.startsWith("Short");

  const hooks: Record<string, string[]> = {
    Casual: ["real talk:", "honestly though,", "ok but why is", "vibes only.", "no filter needed."],
    Professional: ["Insights worth sharing:", "Key takeaway:", "Here's what we learned:", "A quick reminder:"],
    Funny: ["me, an expert:", "POV:", "i can't even:", "this is your sign to", "tell me why"],
    Inspirational: ["Some days you just have to", "Remember:", "Proof that", "Big truth:"],
    Bold: ["Stop scrolling.", "Real talk:", "Don't sleep on this.", "Calling it now:"],
  };

  const middle: Record<string, string[]> = {
    Casual: ["there's just something about {topic} that hits different.", "this {topic} energy is everything.", "saving this for the next time someone asks me about {topic}."],
    Professional: ["{topic} continues to be a key driver of meaningful results.", "the data around {topic} speaks for itself.", "those who prioritize {topic} consistently outperform their peers."],
    Funny: ["me pretending i haven't thought about {topic} for the third hour today.", "if {topic} was a person, I'd ask them to marry me.", "tag yourself, i'm the one who treats {topic} like a personality trait."],
    Inspirational: ["{topic} is a reminder that small steps lead to big changes.", "let {topic} be proof that growth happens in the messy middle.", "every great story starts with a single moment like this."],
    Bold: ["{topic} is the move. End of story.", "you either go all in on {topic} or you don't post about it.", "the people who get {topic} understand. the rest will."],
  };

  const cta: string[] = ["What do you think? Drop it below 👇", "Tag a friend who needs this.", "Save this for later.", "Double tap if you agree.", "Share your story in the comments."];

  const hook = hooks[tone]?.[Math.floor(Math.random() * (hooks[tone]?.length || 1))] || hooks.Casual[0];
  const mid = middle[tone]?.[Math.floor(Math.random() * (middle[tone]?.length || 1))] || middle.Casual[0];
  const end = cta[Math.floor(Math.random() * cta.length)];

  const template1 = `${hook} ${mid.replace(/\{topic\}/g, t)}\n\n${end}\n\n${tags.join(" ")}`.trim();
  const detailLine = `\n\n${tone === "Funny" ? "Anyway, that's the post. You're welcome. ✨" : tone === "Bold" ? "If this hit, share it with someone who needs to see it." : "More like this on the feed — stay tuned."}`;
  const template2 = `${hook} ${mid.replace(/\{topic\}/g, t)}${shortMode ? "" : detailLine}\n\n${end}\n\n${tags.join(" ")}`.trim();

  return shortMode ? [template1] : [template1, template2];
}

/* ------------------------------------------------------------------ */
/*  Caption Generator Widget                                           */
/* ------------------------------------------------------------------ */

function GeneratorWidget() {
  const [topic, setTopic] = React.useState("");
  const [tone, setTone] = React.useState<string>("Casual");
  const [hashtagOption, setHashtagOption] = React.useState("0");
  const [length, setLength] = React.useState<string>("Long (detailed)");
  const [captions, setCaptions] = React.useState<string[]>([]);
  const [generating, setGenerating] = React.useState(false);
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);

  const MAX = 1000;
  const tagsToAdd = parseInt(hashtagOption, 10);

  function handleGenerate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setCaptions([]);
    setTimeout(() => {
      const r = generateCaptions(topic, tone, length, tagsToAdd);
      setCaptions(r);
      setGenerating(false);
    }, 700);
  }

  async function handleCopy(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {}
  }

  return (
    <div className="rounded-xl bg-card text-card-foreground shadow p-6 border">
      <div className="flex items-center gap-2 mb-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
        <h2 className="text-xl font-semibold">Instagram Caption Generator</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Generate engaging captions for your Instagram posts</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="topic" className="text-sm font-medium">What is your post about?</label>
          <textarea
            id="topic"
            placeholder="Describe your post content, product, or message..."
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, MAX))}
            rows={5}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="text-xs text-muted-foreground text-right">{topic.length}/{MAX}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Hashtags</label>
            <select value={hashtagOption} onChange={(e) => setHashtagOption(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              {HASHTAG_OPTIONS.map((h) => <option key={h.v} value={h.v}>{h.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Length</label>
            <select value={length} onChange={(e) => setLength(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              {LENGTHS.map((l) => <option key={l} value={l}>{l}</option>)}
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
          {generating ? "Generating..." : "Generate Captions"}
        </button>

        {captions.length > 0 && (
          <div className="space-y-3 pt-2">
            {captions.map((c, i) => (
              <div key={i} className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Option {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(c, i)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {copiedIdx === i ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{c}</p>
              </div>
            ))}
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

export function InstagramCaptionGeneratorClient() {
  return (
    <>
      <Header />
      <main>
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">Instagram Caption Generator (2026)</h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Generate engaging, scroll-stopping captions for your Instagram posts, Reels, and Stories in seconds. Free AI-powered tool with strategic hashtag suggestions.
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
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
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
              <p className="text-sm text-muted-foreground">Make every caption count with proven strategies</p>
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
              <p className="text-sm text-muted-foreground">Caption generation problems — and how to solve them</p>
            </div>
            <IssuesAccordion items={ISSUES} />
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Everything about AI-powered Instagram captions</p>
            </div>
            <FaqAccordion items={FAQS} />
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Caption Generators for Other Platforms</h2>
              <p className="text-sm text-muted-foreground">Generate captions across every major social platform</p>
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
