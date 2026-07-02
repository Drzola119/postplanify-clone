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
  { step: 1, title: "Describe your topic or insight", body: "Tell us what you want to post about. Include your industry insight, career update, lesson learned, or professional topic you want to share with your network." },
  { step: 2, title: "Choose your style and preferences", body: "Select your preferred tone (professional, inspirational, bold, etc.), post length (short or long), and whether to include hashtags." },
  { step: 3, title: "Generate and copy your post", body: "Click generate to get 2 unique post options optimized for LinkedIn engagement. Copy your favorite, add personal touches, and publish to your network." },
];

const USE_CASES = [
  { title: "Build Your Professional Brand", body: "Generate insightful posts that establish expertise in your field. Share industry perspectives, challenge conventions, and build a following around your unique viewpoint." },
  { title: "Stand Out to Recruiters", body: "Create posts that showcase your expertise and personality. Share career insights, project wins, and professional growth stories that attract hiring managers." },
  { title: "Generate Leads Through Content", body: "Create posts that demonstrate expertise and attract potential clients. Share valuable insights that position you as the go-to expert in your industry." },
  { title: "Scale Client LinkedIn Presence", body: "Generate professional posts for multiple client accounts. Maintain consistent quality and brand voice across LinkedIn content calendars." },
  { title: "Attract Clients with Value", body: "Share frameworks, tips, and insights that demonstrate your expertise. Generate content that nurtures potential clients through your thought leadership." },
  { title: "Attract Top Talent", body: "Create engaging job posts, company culture content, and employer brand stories. Generate posts that make candidates want to work with your organization." },
];

const PRO_TIPS = [
  { title: "Hook with the first line", body: "LinkedIn truncates posts after 2-3 lines. Your opening must make people click \"see more.\" Start with a bold statement, surprising insight, counterintuitive claim, or intriguing question." },
  { title: "Use line breaks liberally", body: "LinkedIn posts with short paragraphs and white space perform significantly better. One idea per line. Makes content scannable on both mobile and desktop feeds." },
  { title: "Share personal stories", body: "LinkedIn rewards authenticity. Personal experiences, lessons from failures, and vulnerable moments often outperform pure business content. Be human, not a corporate mouthpiece." },
  { title: "End with a question", body: "Invite conversation by ending with a genuine question. \"What's your experience with this?\" or \"Agree or disagree?\" drives comments, which significantly boosts visibility." },
  { title: "Keep hashtags minimal", body: "3-5 relevant hashtags max. Use industry-specific tags and check that they have an active following. Avoid generic hashtags that dilute your content." },
  { title: "Post consistently", body: "LinkedIn's algorithm rewards consistent posters. 3-5 times per week is ideal for building momentum. Use a generator to maintain quality when time is tight." },
  { title: "Engage within the first hour", body: "Reply to every comment on your posts, especially in the first hour. This signals to LinkedIn's algorithm that your post is generating meaningful conversation and boosts reach." },
  { title: "Share contrarian takes", body: "Posts that challenge conventional wisdom get more engagement than agreeable content. Have a point of view. Take a stance. The algorithm rewards posts that generate discussion." },
  { title: "Include a clear CTA", body: "Tell people what you want them to do. 'Comment your experience,' 'Follow for more,' or 'Share if you agree' give readers a clear next step and boost engagement metrics." },
  { title: "Mix content types", body: "Vary between text posts, carousels, videos, and polls. Different formats reach different parts of LinkedIn's algorithm. Test what resonates with your specific audience." },
  { title: "Be vulnerable (strategically)", body: "Sharing failures, mistakes, and lessons learned humanizes you and builds trust. \"Here's what I got wrong\" often outperforms \"Here's how great I am.\"" },
  { title: "Save and repurpose winners", body: "When a post performs well, analyze why and create variations. Successful post formulas can be adapted for different topics. Build a swipe file of your best performers." },
];

const ISSUES = [
  { q: "⚠️Generated posts feel too generic or corporate", solutions: ["Add specific examples, data, or stories from your actual experience", "Mention your industry, role, and unique perspective", "Choose \"Casual\" or \"Bold\" tone for more personality", "Describe the specific insight or lesson you want to share", "Edit to add your authentic voice and specific details"] },
  { q: "⚠️Posts feel too salesy or promotional", solutions: ["Focus your description on value and insights rather than selling", "Ask for \"thought leadership\" or \"educational\" content in your description", "Choose \"Inspirational\" or \"Professional\" tone", "Lead with value before any mention of your services"] },
  { q: "⚠️Posts are too long or too short", solutions: ["Use the caption length selector to explicitly choose \"short\" or \"long\"", "For quick insights, describe a focused single point", "For thought leadership, mention you want \"detailed\" or \"comprehensive\" treatment", "Edit the output to match your preferred length"] },
  { q: "⚠️Posts sound too much like \"LinkedIn cringe\"", solutions: ["Avoid asking for motivational or inspirational content", "Focus on specific, actionable insights rather than abstract advice", "Choose \"Professional\" or \"Casual\" tone over \"Inspirational\" for business topics", "Edit out any humble-brags or virtue signaling", "Add genuine personal stories instead of manufactured ones"] },
];

const FAQS = [
  { q: "What is a LinkedIn post generator?", a: "A LinkedIn post generator is an AI-powered tool that creates professional, engaging posts for your LinkedIn profile or company page. Simply describe your topic, choose a tone, and get multiple post options instantly. It helps you maintain thought leadership, share insights, and build your professional presence consistently." },
  { q: "Is this LinkedIn post generator free?", a: "Yes, our LinkedIn post generator is completely free to use. No signup, no credit card, no hidden fees. Generate as many posts as you need for your professional content without any cost. We believe great content creation tools should be accessible to everyone building their career." },
  { q: "What's the character limit for LinkedIn posts?", a: "LinkedIn allows up to 3,000 characters per post. Our generator creates posts within this limit and shows you the character count. For optimal engagement, posts between 150-300 characters often perform well, but longer thought-leadership posts (1,000-1,500 chars) also drive high engagement when they provide value." },
  { q: "What tones work best for LinkedIn?", a: "LinkedIn values professional yet authentic content. Our Professional and Inspirational tones work well for thought leadership. Casual tone works for personal stories and authentic moments that humanize your brand. Bold works for hot takes and industry commentary that challenge conventional thinking." },
  { q: "Should I use hashtags on LinkedIn?", a: "Yes, but strategically. 3-5 relevant hashtags help with discoverability on LinkedIn. Use industry-specific hashtags and trending professional topics. Avoid generic hashtags like #success or #motivation - they're oversaturated. Our generator can add hashtags, but we recommend keeping them minimal and highly relevant." },
  { q: "What types of LinkedIn posts can I generate?", a: "You can generate any type of LinkedIn content: thought leadership posts, industry insights, career updates, job announcements, company news, personal stories and lessons learned, tips and advice, achievement celebrations, and engagement posts. Just describe your topic and goal." },
  { q: "How do I write posts that get engagement on LinkedIn?", a: "LinkedIn rewards posts that spark professional discussion. Ask questions, share contrarian insights, tell vulnerability stories, and provide actionable value. Our AI creates engaging hooks and conversation starters. Posting consistently (3-5x/week) and engaging with comments also significantly boosts reach." },
  { q: "Will my posts sound robotic or AI-generated?", a: "No. Our AI is trained to write naturally and professionally, matching how successful LinkedIn creators communicate. Posts sound human-written - insightful, authentic, and engaging. We avoid corporate jargon, buzzwords, and LinkedIn cringe that makes content feel fake." },
  { q: "Can I use this for company page posts?", a: "Absolutely. Whether posting from a personal profile or company page, our generator adapts to your needs. For company content, describe your brand voice and target audience for better results. Company pages benefit from mixing brand content with employee spotlights and industry insights." },
  { q: "Can I edit the generated posts?", a: "Yes, and we strongly encourage it! The generated posts are a starting point. Add your personal experiences, specific data from your work, stories from your career, and adjust the tone. Adding personal touches makes LinkedIn content significantly more authentic and engaging." },
  { q: "What should I include in my description for best results?", a: "Include: (1) your main topic or insight, (2) your industry or niche, (3) target audience (recruiters, peers, potential clients), (4) the goal of the post (engagement, thought leadership, announcement), and (5) any specific points or data to mention. Context helps the AI create relevant, targeted content." },
  { q: "How is this different from ChatGPT for LinkedIn posts?", a: "Our tool is specifically optimized for LinkedIn. It understands LinkedIn's professional context, optimal post structures (hook + story + insight + CTA), what drives engagement on the platform, and avoids the cringe patterns that hurt credibility. No prompt engineering needed." },
  { q: "Can I generate LinkedIn articles?", a: "Our generator creates LinkedIn posts (up to 3,000 characters). For longer LinkedIn articles, you can use generated posts as introductions, key sections, or summary points, then expand on them in the article editor with more depth and detail." },
  { q: "What posting frequency works best on LinkedIn?", a: "Consistency matters more than frequency. 3-5 posts per week is ideal for most professionals building a presence. Quality beats quantity - one thoughtful post outperforms five mediocre ones. Our generator helps you maintain that cadence without spending hours writing each post." },
  { q: "Why use a post generator instead of writing my own?", a: "Professional content takes time to craft well, and many people struggle with LinkedIn's unique format. A post generator: (1) provides instant starting points, (2) helps you find the right angle for your insights, (3) saves time when you're busy, (4) maintains quality when inspiration is low. Use it as a creative accelerator." },
  { q: "What's the best time to post on LinkedIn?", a: "Best times are generally Tuesday-Thursday, 8-10 AM and 12-1 PM in your target timezone. Monday mornings and Friday afternoons see lower engagement. However, your specific network may differ - test different times and check your LinkedIn analytics to optimize." },
  { q: "How do I write LinkedIn posts that go viral?", a: "Viral LinkedIn posts typically: (1) share vulnerable personal stories, (2) challenge industry conventional wisdom, (3) provide highly actionable frameworks, (4) tap into professional frustrations or aspirations, (5) use strong hooks that stop the scroll. Our AI incorporates these patterns, but authenticity is key." },
  { q: "Should LinkedIn posts be personal or professional?", a: "The best LinkedIn posts blend both. Pure professional content feels corporate; pure personal feels out of place. Share professional insights through the lens of personal experience. 'I learned this lesson when...' or 'Here's what I discovered after 10 years in...' performs exceptionally well." },
  { q: "Can I use this for job postings?", a: "Yes! Describe that you're creating a job posting and include the role details. Our generator can create engaging job posts that attract candidates. For best results, focus on what makes the role compelling rather than just listing requirements." },
  { q: "How do I build thought leadership on LinkedIn?", a: "Thought leadership requires: (1) consistent posting on focused topics, (2) unique perspectives based on real experience, (3) engaging with others' content, (4) sharing both wins and lessons from failures, (5) providing actionable value. Our generator helps you maintain the posting consistency while you focus on authentic insights." },
  { q: "What LinkedIn post formats work best?", a: "High-performing formats: (1) Hook + Story + Insight + Question, (2) Numbered lists with actionable tips, (3) Contrarian takes that challenge assumptions, (4) Before/After career stories, (5) 'What I learned from [experience]' reflections. Our generator uses these proven structures." },
  { q: "How many posts can I generate per day?", a: "You can generate posts as often as you need. We have fair usage limits (10 generations per minute) to prevent abuse, but normal use is unlimited. Whether you post weekly or daily, our tool supports your LinkedIn content strategy." },
  { q: "Can I save my favorite generated posts?", a: "Currently, posts aren't saved in our tool - copy them to your notes app, content calendar, or scheduling tool like PostPlanify. Pro tip: Create a 'LinkedIn Swipe File' where you save your best-performing posts to analyze patterns." },
  { q: "Why does PostPlanify offer this tool for free?", a: "We believe great content creation tools should be accessible to everyone building their professional brand. Our free post generator helps professionals succeed on LinkedIn, and some users choose to use our paid scheduling and analytics tools for full social media management. It's a win-win." },
];

const OTHER_PLATFORMS = [
  { label: "Instagram Caption Generator", desc: "Create scroll-stopping captions with strategic hashtag suggestions for Instagram.", href: "/tools/instagram-caption-generator" },
  { label: "Twitter Caption Generator", desc: "Craft concise, engaging tweets with optimal hashtag and emoji usage.", href: "/tools/twitter-caption-generator" },
  { label: "TikTok Caption Generator", desc: "Generate viral, FYP-ready captions for your TikTok videos.", href: "/tools/tiktok-caption-generator" },
  { label: "YouTube Description Generator", desc: "Generate SEO-optimized video descriptions that rank higher and get more views.", href: "/tools/youtube-description-generator" },
  { label: "Facebook Caption Generator", desc: "Create engaging Facebook post captions with strategic hooks.", href: "/tools/facebook-caption-generator" },
];

const RELATED = [
  { title: "Best Sprout Social Alternatives for LinkedIn", desc: "Top Sprout Social alternatives for LinkedIn marketers", href: "/alternative-to-sprout-social" },
  { title: "Hootsuite vs Sprout Social Compared", desc: "Hootsuite vs Sprout Social: feature and pricing comparison", href: "/compare/hootsuite-vs-sprout-social" },
  { title: "Sprout Social Pricing Explained", desc: "Is Sprout Social worth the cost? Full pricing analysis", href: "/sprout-social-pricing" },
  { title: "Best Hootsuite Alternatives for LinkedIn", desc: "Top Hootsuite alternatives for LinkedIn B2B marketers", href: "/alternative-to-hootsuite" },
  { title: "Buffer vs Hootsuite: Which is Better for LinkedIn?", desc: "Buffer vs Hootsuite compared for LinkedIn professional scheduling", href: "/compare/buffer-vs-hootsuite" },
  { title: "Hootsuite Pricing: Is It Worth $249/mo?", desc: "Full Hootsuite pricing breakdown for LinkedIn marketers", href: "/hootsuite-pricing" },
  { title: "Best Sprout Social Alternatives: 2026 Guide", desc: "In-depth Sprout Social alternatives guide for LinkedIn B2B marketers", href: "/blog/best-sprout-social-alternatives" },
  { title: "Best Hootsuite Alternatives for LinkedIn", desc: "Complete Hootsuite alternatives guide for LinkedIn professionals", href: "/blog/best-hootsuite-alternatives" },
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
/*  Post generator logic                                               */
/* ------------------------------------------------------------------ */

function pickHashtags(topic: string, count: number): string[] {
  if (count === 0) return [];
  const lower = topic.toLowerCase();
  const words = lower.split(/\W+/).filter((w) => w.length > 3 && !["with","your","this","from","have","that","about","they","them","were","what","when","make","like","just","into","over","also","some","than","them"].includes(w));
  const base = ["linkedin", "leadership", "career", "professional"];
  const dynamic = words.slice(0, 3);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const w of [...base, ...dynamic]) {
    const tag = w.replace(/[^a-z0-9]/gi, "");
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      result.push("#" + tag);
    }
    if (result.length >= count) break;
  }
  while (result.length < count) result.push(`#networking`);
  return result.slice(0, count);
}

function generateCaptions(topic: string, tone: string, length: string, hashtagCount: number): string[] {
  const safe = topic.trim() || "professional growth";
  const tags = pickHashtags(safe, hashtagCount);
  const t = safe.toLowerCase();
  const shortMode = length.startsWith("Short");

  const hooks: Record<string, string[]> = {
    Casual: ["here's the thing:", "off my chest:", "unpopular opinion:", "real talk:", "quick thought:"],
    Professional: ["A perspective I've been reflecting on:", "Worth sharing:", "Insight worth noting:", "Key takeaway from my experience:"],
    Funny: ["it me:", "imagine:", "plot twist:", "confession:", "the irony:"],
    Inspirational: ["Some things I've learned:", "A reminder for the week:", "Worth remembering:", "Big truth:"],
    Bold: ["Hot take:", "Controversial:", "Stop doing this.", "Let's be honest:"],
  };

  const middle: Record<string, string[]> = {
    Casual: ["I've been thinking about {topic} and here's where I landed.", "spent the last few weeks digging into {topic}. here's what I found.", "the more I sit with {topic}, the more I keep coming back to one thing."],
    Professional: ["Throughout my career, {topic} has been a defining force.", "the data and my experience with {topic} point to consistent outcomes.", "for those investing deeply in {topic}, the results compound over time."],
    Funny: ["me pretending I'm not thinking about {topic} for the third coffee today.", "tag yourself, I'm the one who treats {topic} like a personality trait.", "if {topic} was a person, I'd ask them to marry me."],
    Inspirational: ["{topic} is a reminder that growth comes from the messy middle.", "let {topic} be proof that small consistent steps lead to meaningful change.", "every great chapter starts with a single moment like this."],
    Bold: ["{topic} is the move. End of story.", "the people who get {topic} succeed. the rest stay stuck.", "stop overcomplicating {topic}. here's what actually works."],
  };

  const cta: string[] = ["What's your take? Share it below.", "Tag someone who needs this.", "Curious how others approach this.", "Follow for more practical insights.", "Agree or disagree? Let's discuss."];

  const hook = hooks[tone]?.[Math.floor(Math.random() * (hooks[tone]?.length || 1))] || hooks.Casual[0];
  const mid = middle[tone]?.[Math.floor(Math.random() * (middle[tone]?.length || 1))] || middle.Casual[0];
  const end = cta[Math.floor(Math.random() * cta.length)];

  const template1 = `${hook} ${mid.replace(/\{topic\}/g, t)}\n\n${end}\n\n${tags.join(" ")}`.trim();
  const detailLine = `\n\n${tone === "Funny" ? "Anyway, that's the post. You're welcome. ✨" : tone === "Bold" ? "If this hit, share it with someone who needs to see it." : "More like this on the feed — stay tuned."}`;
  const template2 = `${hook} ${mid.replace(/\{topic\}/g, t)}${shortMode ? "" : detailLine}\n\n${end}\n\n${tags.join(" ")}`.trim();

  return shortMode ? [template1] : [template1, template2];
}

/* ------------------------------------------------------------------ */
/*  Post Generator Widget                                              */
/* ------------------------------------------------------------------ */

function GeneratorWidget() {
  const [topic, setTopic] = React.useState("");
  const [tone, setTone] = React.useState<string>("Professional");
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
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
        <h2 className="text-xl font-semibold">LinkedIn Post Generator</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Generate professional, engaging posts for your network</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="topic" className="text-sm font-medium">What is your post about?</label>
          <textarea
            id="topic"
            placeholder="Describe your insight, career update, lesson learned, or professional topic..."
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
          {generating ? "Generating..." : "Generate Posts"}
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

export function LinkedinCaptionGeneratorClient() {
  return (
    <>
      <Header />
      <main>
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">LinkedIn Post Generator (2026)</h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Generate professional, engaging posts for your LinkedIn network in seconds. Free AI-powered tool for thought leadership, career updates, and business content.
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
              <p className="text-sm text-muted-foreground">For LinkedIn professionals and brands</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {USE_CASES.map((u, i) => (
                <Card key={i} className="p-6 pb-3 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
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
              <p className="text-sm text-muted-foreground">Make every LinkedIn post count with proven strategies</p>
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
              <p className="text-sm text-muted-foreground">Post generation problems — and how to solve them</p>
            </div>
            <IssuesAccordion items={ISSUES} />
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Everything about AI-powered LinkedIn posts</p>
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