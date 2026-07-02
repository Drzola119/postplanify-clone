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
  { step: 1, title: "Describe your TikTok video", body: "Tell us what your video is about. Include the content type, trend, niche, target audience, or message you want to convey. The more details, the better your captions." },
  { step: 2, title: "Choose your style and preferences", body: "Select your preferred tone (casual, funny, bold, etc.), caption length (short or long), and how many hashtags to include (0, 5, 10, or 15)." },
  { step: 3, title: "Generate and copy your caption", body: "Click generate to get 2 unique caption options optimized for TikTok. Copy your favorite, customize if needed, paste it into TikTok, and post your video." },
];

const USE_CASES = [
  { title: "Scale Your TikTok Content Production", body: "Post consistently without spending hours writing captions. Generate engaging text for every video, maintain your unique voice, and focus more time on creating quality content." },
  { title: "Grow Your Following Faster", body: "Use AI-optimized captions with trending hashtags to boost discoverability. Craft hooks that stop the scroll and CTAs that convert viewers into followers." },
  { title: "Drive Sales with Compelling Captions", body: "Create product captions that balance entertainment with promotion. Generate descriptions that highlight benefits while maintaining TikTok's casual, authentic style." },
  { title: "Maintain Brand Voice at Scale", body: "Generate on-brand captions for multiple client accounts or campaigns. Ensure consistency while adapting to TikTok's unique platform culture." },
  { title: "Make Educational Content Engaging", body: "Turn complex topics into accessible, engaging TikTok captions. Hook viewers with curiosity and deliver value that makes them follow for more." },
  { title: "Showcase Your Work Effectively", body: "Write captions that complement your visual art, music, or creative work. Generate text that adds context without overshadowing your content." },
];

const PRO_TIPS = [
  { title: "Hook them in the first line", body: "TikTok shows only the first line before \"more.\" Make it count with a question, bold statement, or curiosity gap. Examples: \"Nobody talks about this...\" or \"POV: You just discovered...\"" },
  { title: "Use relevant hashtags strategically", body: "Mix broad hashtags (#fyp, #viral) with niche ones (#booktok, #foodie). 3-5 well-chosen hashtags beat 15 random ones. Research which hashtags your successful competitors use." },
  { title: "Ask for engagement directly", body: "End with a question or call-to-action. \"What would you do?\" \"Tag someone who needs this\" \"Comment your...\" - these drive comments, which signals quality to the algorithm." },
  { title: "Match the video vibe", body: "Your caption should complement your video, not compete with it. Funny video? Funny caption. Serious content? Keep the caption straightforward. Aesthetic video? Minimal caption." },
  { title: "Keep it casual and authentic", body: "TikTok isn't LinkedIn. Write like you talk. Use lowercase, skip perfect grammar if it feels more natural, and sound like a real person sharing with friends." },
  { title: "Reference trends and sounds", body: "If you're using a trending sound or format, mention it in your caption or use related hashtags. This helps TikTok categorize your content and show it to the right audience." },
  { title: "Create curiosity gaps", body: "Make viewers want to watch till the end. \"Wait for it...\" \"The ending surprised me\" \"You won't believe what happened next\" - these boost watch time, a key ranking factor." },
  { title: "Test different caption lengths", body: "Some niches perform better with short, punchy captions. Others benefit from storytelling. Test both styles with your audience and track which gets more engagement." },
  { title: "Use emojis sparingly but strategically", body: "One or two emojis can add personality and break up text. But emoji overload looks spammy. Use them to emphasize key points or match your video's energy." },
  { title: "Save your best performers", body: "When a caption drives great engagement, save it to a swipe file. Analyze what worked - the hook, CTA, hashtags - and apply those patterns to future content." },
  { title: "Time your posts strategically", body: "Great captions matter, but timing amplifies impact. Post when your audience is active (check TikTok Analytics). Generally: early morning, lunch, and evening are peak times." },
  { title: "Don't forget accessibility", body: "Use captions/subtitles in your video itself. Many viewers watch without sound. Your text caption can reference \"turn on sound\" but the video should work without it too." },
];

const ISSUES = [
  { q: "⚠️Generated captions feel too generic", solutions: ["Add more specific details about your video content in the description", "Mention your niche, target audience, and the specific emotion or reaction you want", "Include any trending sounds or challenges you're using", "Try regenerating with a different tone selection", "Edit the output to add your personal catchphrases or inside jokes"] },
  { q: "⚠️Hashtags don't match my content", solutions: ["Be more specific about your niche in the description (e.g., \"fitness for busy moms\" not just \"fitness\")", "Select fewer hashtags (5 instead of 15) for more relevant suggestions", "Manually replace 1-2 hashtags with your proven performers", "Check if you've clearly described what your video actually shows"] },
  { q: "⚠️Captions are too long or too short", solutions: ["Use the caption length selector to choose \"short\" or \"long\"", "For punchy captions, describe a simpler concept in your input", "For longer captions, ask for storytelling or explanation in your description", "Edit the output to trim or expand as needed"] },
  { q: "⚠️Tone doesn't match my brand", solutions: ["Try different tone options (casual, funny, bold, professional, inspirational)", "Mention your brand voice in the description (e.g., \"sarcastic humor\" or \"warm and encouraging\")", "Generate multiple options and mix elements from different outputs", "Use generated captions as a starting point and adjust the voice manually"] },
];

const FAQS = [
  { q: "What is a TikTok caption generator?", a: "A TikTok caption generator is an AI-powered tool that creates engaging, viral-ready captions for your TikTok videos. Simply describe your video content, choose a tone, and get multiple caption options instantly. It helps you craft the perfect caption to boost engagement and FYP visibility without spending hours writing." },
  { q: "Is this TikTok caption generator free?", a: "Yes, our TikTok caption generator is completely free to use. No signup, no credit card, no hidden fees. Generate as many captions as you need for your TikTok videos without any cost. We believe everyone should have access to quality AI tools for content creation." },
  { q: "What's the character limit for TikTok captions?", a: "TikTok allows up to 2,200 characters per caption (increased from 300 in 2022). However, shorter captions often perform better since viewers focus on the video. Our generator creates captions within this limit and shows you the character count. For optimal engagement, we recommend 100-150 characters plus hashtags." },
  { q: "How do I write captions that get on the FYP?", a: "FYP success depends on video quality, watch time, engagement rate, and relevance. Good captions help by: (1) hooking viewers in the first line, (2) including relevant hashtags, (3) asking questions or using CTAs to drive comments, and (4) using trending keywords. Our AI creates captions optimized for these factors, but your video content is the main driver of FYP success." },
  { q: "Should I use hashtags on TikTok?", a: "Yes! TikTok hashtags are crucial for discoverability. Mix trending hashtags (#fyp, #viral) with niche-specific ones (#booktok, #gymtok). Our generator can add 5, 10, or 15 hashtags based on your preference. Research shows 3-5 highly relevant hashtags often outperform 15 random ones. Quality over quantity." },
  { q: "What tone works best for TikTok?", a: "TikTok rewards authenticity and relatability. Casual, funny, and bold tones tend to perform best. Avoid overly polished or corporate language - it feels out of place on the platform. Our generator creates captions that sound like a real creator, not a brand. Match your caption tone to your video's vibe for best results." },
  { q: "Can I use this for TikTok Shop and business accounts?", a: "Absolutely. Whether you're a creator, business, or TikTok Shop seller, our generator adapts to your needs. For product content, describe your product and target audience for captions that drive engagement and sales. We help you balance promotional content with TikTok's entertainment-first culture." },
  { q: "Will my captions sound robotic or AI-generated?", a: "No. Our AI is trained on millions of viral TikTok captions to write like a real TikTok creator - casual, trendy, and authentic. Captions sound human-written, not corporate or robotic. We use current slang, trending phrases, and the platform's unique voice." },
  { q: "How do I use trending sounds with my caption?", a: "Our generator creates the text caption - you'll add the sound in TikTok's editor. For best results, mention the sound or trend in your description when generating. This helps the AI create a caption that complements the audio. Trending sounds + relevant captions = algorithm gold." },
  { q: "Can I edit the generated captions?", a: "Yes, and we encourage it! The generated captions are a starting point. Copy them, then add your personal touch, inside jokes, or trend references that only your audience would get. The best TikTok captions feel authentic to your style while using proven engagement techniques." },
  { q: "What should I include in my description for best results?", a: "Include: (1) what your video shows, (2) your niche or target audience, (3) the vibe you're going for, (4) any trends or sounds you're using, and (5) your goal (engagement, sales, followers). Example: 'Morning routine video for busy moms, cozy aesthetic, using trending sound, want comments about their routines.'" },
  { q: "Does short or long captions work better on TikTok?", a: "It depends on your content. Quick, punchy captions (under 100 characters) work for entertainment and meme content. Longer captions work for storytelling, tutorials, or when you want to drive comments with questions. Test both styles with your audience. Our generator offers short and long options." },
  { q: "Can I generate captions in other languages?", a: "Currently, our generator creates captions in English. If you describe your content in English, the output will be in English. For multilingual TikTok accounts, you can generate the English caption and translate key phrases while keeping trending hashtags in English for broader reach." },
  { q: "How is this different from ChatGPT for TikTok captions?", a: "Our tool is specifically optimized for TikTok. It understands TikTok's casual style, hashtag strategies, character limits, and what makes content perform on the platform. No prompt engineering needed - just describe your video and get TikTok-ready captions. ChatGPT requires extensive prompting to match TikTok's unique voice." },
  { q: "Why use a caption generator for TikTok?", a: "Coming up with fresh captions for every video is exhausting, especially when posting 1-3 times daily. A caption generator: (1) saves 10-15 minutes per video, (2) provides instant options when you're stuck, (3) suggests hashtags you might miss, and (4) helps maintain consistency. Use it as a creative assistant to overcome caption fatigue." },
  { q: "What's the best time to post on TikTok?", a: "Best posting times vary by audience, but general peak times are: 7-9 AM, 12-3 PM, and 7-11 PM in your target timezone. Tuesday through Thursday often see highest engagement. Use TikTok Analytics to find when YOUR audience is most active. Great captions matter, but timing amplifies their impact." },
  { q: "How do hashtags affect TikTok algorithm?", a: "Hashtags help TikTok categorize your content and show it to relevant users. The algorithm considers: (1) hashtag relevance to your content, (2) hashtag competition level, and (3) your account's history with those hashtags. Using irrelevant trending hashtags can hurt performance. Our generator selects hashtags based on your actual content." },
  { q: "Can I use this for TikTok ads?", a: "Yes! While designed for organic content, our captions work great for TikTok ads too. For ads, you may want to add stronger CTAs and ensure the caption complements your ad creative. TikTok ads that feel native to the platform (not overly promotional) perform best." },
  { q: "How many captions can I generate per day?", a: "You can generate captions as often as you need. We have fair usage limits (10 generations per minute) to prevent abuse, but normal use is unlimited. Whether you post once a week or three times daily, our tool supports your content schedule." },
  { q: "What makes a TikTok caption go viral?", a: "Viral captions typically: (1) hook attention in the first 5 words, (2) create curiosity or emotion, (3) encourage comments with questions or controversial takes, (4) use relevant trending hashtags, and (5) complement rather than compete with the video. Our AI is trained on viral patterns, but remember - your video quality is the primary viral factor." },
  { q: "Should I include a call-to-action in my caption?", a: "Yes! CTAs significantly boost engagement. Effective TikTok CTAs include: 'Comment your...', 'Follow for part 2', 'Save this for later', 'Tag someone who...', and 'Duet this with your reaction'. Our generator can include CTAs based on your content type and goals." },
  { q: "How do I write captions for different TikTok niches?", a: "Each niche has its own caption style. Comedy uses short, punchy captions. Educational content uses longer explanatory captions. Lifestyle uses relatable, story-driven captions. Fashion uses minimal captions letting visuals speak. Tell our generator your niche, and it adapts the style accordingly." },
  { q: "Can I save my favorite generated captions?", a: "Currently, captions aren't saved in our tool - you'll need to copy them to your notes app or content calendar. Pro tip: Create a 'Caption Swipe File' document where you save your best-performing captions for future inspiration and pattern recognition." },
  { q: "Why does PostPlanify offer this tool for free?", a: "We believe great content creation tools should be accessible to everyone. Our free caption generator helps creators succeed on TikTok, and some users choose to use our paid scheduling and analytics tools. It's a win-win: you get free captions, we get to introduce you to PostPlanify's full platform." },
];

const OTHER_PLATFORMS = [
  { label: "Instagram Caption Generator", desc: "Create scroll-stopping captions with strategic hashtag suggestions for Instagram.", href: "/tools/instagram-caption-generator" },
  { label: "Twitter Caption Generator", desc: "Craft concise, engaging tweets with optimal hashtag and emoji usage.", href: "/tools/twitter-caption-generator" },
  { label: "LinkedIn Caption Generator", desc: "Build thought-leadership posts and professional captions.", href: "/tools/linkedin-caption-generator" },
  { label: "YouTube Description Generator", desc: "Generate SEO-optimized video descriptions that rank higher and get more views.", href: "/tools/youtube-description-generator" },
  { label: "Facebook Caption Generator", desc: "Create engaging Facebook post captions with strategic hooks.", href: "/tools/facebook-caption-generator" },
];

const RELATED = [
  { title: "Best Metricool Alternatives for TikTok", desc: "Top Metricool alternatives for TikTok scheduling and analytics", href: "/alternative-to-metricool" },
  { title: "Metricool vs Publer: Which Wins for TikTok?", desc: "Metricool vs Publer feature and pricing comparison", href: "/compare/metricool-vs-publer" },
  { title: "Metricool Pricing Breakdown 2026", desc: "Is Metricool worth the price? Full pricing analysis", href: "/metricool-pricing" },
  { title: "Best Later Alternatives for TikTok Creators", desc: "Top Later alternatives with TikTok scheduling support", href: "/alternative-to-later" },
  { title: "Metricool vs Planable Compared", desc: "Metricool vs Planable: which is better for TikTok teams?", href: "/compare/metricool-vs-planable" },
  { title: "Later Pricing: Is It Worth the Cost?", desc: "Full Later pricing analysis for short-form video creators", href: "/later-pricing" },
  { title: "Best Metricool Alternatives for TikTok", desc: "Top Metricool alternatives guide for TikTok creators", href: "/blog/best-metricool-alternatives" },
  { title: "Best Publer Alternatives Compared", desc: "Complete Publer alternatives guide for short-form video scheduling", href: "/blog/best-publer-alternatives" },
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
  const base = ["fyp", "foryou", "viral", "trending"];
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
  while (result.length < count) result.push(`#explore`);
  return result.slice(0, count);
}

function generateCaptions(topic: string, tone: string, length: string, hashtagCount: number): string[] {
  const safe = topic.trim() || "this video";
  const tags = pickHashtags(safe, hashtagCount);
  const t = safe.toLowerCase();
  const shortMode = length.startsWith("Short");

  const hooks: Record<string, string[]> = {
    Casual: ["ok but why is", "real talk:", "honestly though,", "no filter needed.", "vibes only."],
    Professional: ["Quick insight:", "Here's what we learned:", "Key takeaway:", "A reminder:"],
    Funny: ["me, an expert:", "POV:", "tell me why", "i can't even:", "this is your sign to"],
    Inspirational: ["Some days you just have to", "Remember:", "Big truth:", "Proof that"],
    Bold: ["Stop scrolling.", "Real talk:", "Don't sleep on this.", "Calling it now:"],
  };

  const middle: Record<string, string[]> = {
    Casual: ["there's just something about {topic} that hits different.", "this {topic} energy is everything.", "saving this for the next time someone asks me about {topic}."],
    Professional: ["{topic} continues to drive meaningful results.", "the data around {topic} speaks for itself.", "those who prioritize {topic} consistently outperform."],
    Funny: ["me pretending i haven't thought about {topic} for the third hour today.", "if {topic} was a person, I'd ask them to marry me.", "tag yourself, i'm the one who treats {topic} like a personality trait."],
    Inspirational: ["{topic} is a reminder that small steps lead to big changes.", "let {topic} be proof that growth happens in the messy middle.", "every great story starts with a single moment like this."],
    Bold: ["{topic} is the move. End of story.", "you either go all in on {topic} or you don't post about it.", "the people who get {topic} understand. the rest will."],
  };

  const cta: string[] = ["What do you think? Drop it below 👇", "Tag someone who needs this.", "Save this for later.", "Follow for more.", "Comment your thoughts."];

  const hook = hooks[tone]?.[Math.floor(Math.random() * (hooks[tone]?.length || 1))] || hooks.Casual[0];
  const mid = middle[tone]?.[Math.floor(Math.random() * (middle[tone]?.length || 1))] || middle.Casual[0];
  const end = cta[Math.floor(Math.random() * cta.length)];

  const template1 = `${hook} ${mid.replace(/\{topic\}/g, t)}\n\n${end}\n\n${tags.join(" ")}`.trim();
  const detailLine = `\n\n${tone === "Funny" ? "Anyway, that's the video. You're welcome. ✨" : tone === "Bold" ? "If this hit, share it with someone who needs to see it." : "More like this on the page — stay tuned."}`;
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
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
        <h2 className="text-xl font-semibold">TikTok Caption Generator</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Generate viral, FYP-ready captions for your TikTok videos</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="topic" className="text-sm font-medium">What is your video about?</label>
          <textarea
            id="topic"
            placeholder="Describe your video content, niche, target audience, or message..."
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

export function TiktokCaptionGeneratorClient() {
  return (
    <>
      <Header />
      <main>
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-black flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">TikTok Caption Generator (2026)</h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Generate viral, FYP-ready captions for your TikTok videos in seconds. Free AI-powered tool with trending hashtags and engagement-optimized hooks.
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
              <p className="text-sm text-muted-foreground">For TikTok creators and brands</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {USE_CASES.map((u, i) => (
                <Card key={i} className="p-6 pb-3 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
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
              <p className="text-sm text-muted-foreground">Make every TikTok caption count with proven strategies</p>
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
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Everything about AI-powered TikTok captions</p>
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