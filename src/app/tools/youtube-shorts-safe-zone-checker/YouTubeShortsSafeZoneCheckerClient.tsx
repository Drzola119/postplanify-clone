"use client";
import * as React from "react";
import Link from "next/link";
import {
  Upload,
  ChevronDown,
  UploadCloud,
  Layers,
  Download,
  Check,
  CheckCircle2,
  Star,
  Sparkles,
  Briefcase,
  LayoutTemplate,
  Eye,
  Target,
  FilmIcon,
  ArrowRight,
  AlertTriangle,
  Monitor,
  Smartphone,
  Globe,
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
    Icon: UploadCloud,
    title: "Upload your Short or thumbnail",
    body: "Drag and drop your YouTube Shorts video (MP4, MOV, WebM) or a still frame (PNG, JPEG) into the checker. Everything runs locally in your browser — no files leave your device.",
  },
  {
    Icon: Layers,
    title: "Preview YouTube's UI overlay on your content",
    body: "The tool instantly renders YouTube's on-screen elements — channel name, subscribe button, like/dislike icons, comments, share, and description bar — as semi-transparent masks on top of your video.",
  },
  {
    Icon: Download,
    title: "Adjust placement and export your guide",
    body: "Reposition text, faces, and CTAs into the safe zone. Toggle the description-expanded view to check the larger bottom bar. Download an annotated PNG to use as a reference layer in your editor.",
  },
];

const USE_CASES = [
  {
    Icon: Sparkles,
    title: "Frame Your Shorts Perfectly Every Time",
    badge: "Content Creators",
    body: "Preview your YouTube Shorts before publishing to ensure on-screen text, titles, and CTAs aren't hidden by the subscribe button, engagement icons, or description bar. Maximize viewer retention.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    Icon: Briefcase,
    title: "QA Client Shorts Before Publishing",
    badge: "Social Media Managers",
    body: "Validate every client Short against YouTube's safe zone before it goes live. Download annotated screenshots for approval workflows. Essential for agencies managing multiple YouTube channels.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    Icon: LayoutTemplate,
    title: "Design Shorts Templates with Safe Zones",
    badge: "Graphic Designers",
    body: "Build YouTube Shorts templates with safe-zone awareness built in. Verify titles, branded elements, and end-screen CTAs stay fully visible before handing off to content teams.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    Icon: Eye,
    title: "Keep Tutorials and Faces Visible",
    badge: "Influencers & Educators",
    body: "Ensure talking-head videos, educational overlays, and step-by-step instructions aren't blocked by YouTube's UI elements. Maximize completion rate and subscriber conversions from Shorts.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    Icon: Target,
    title: "Optimize YouTube Shorts Ad Creatives",
    badge: "Brands & Advertisers",
    body: "Preview YouTube's Sponsored label and CTA button overlay before launching Shorts ad campaigns. Avoid wasting ad budget on creatives where branding or offers are hidden by the UI.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    Icon: FilmIcon,
    title: "Deliver Pixel-Perfect Vertical Edits",
    badge: "Video Editors & Freelancers",
    body: "Validate safe zone placement for every Short you edit before delivering to clients. Export overlay screenshots as proof of correct framing — eliminate revision rounds caused by covered text.",
    color: "bg-cyan-100 text-cyan-600",
  },
];

const PRO_TIPS = [
  { title: "Write a killer hook in the first 2 seconds", body: "Shorts auto-play in a never-ending feed. Open with movement, bold text, or a cliff-hanger question so viewers don't swipe away before the video even starts." },
  { title: "Frame text inside the Shorts safe zone", body: "Keep captions and on-screen titles at least 120 px from the top and 300 px above the bottom. Use the PostPlanify Safe-Zone Checker to preview the overlay before you export." },
  { title: "Use vertical-only footage (9:16)", body: "YouTube adds black bars to 16:9 clips, lowering perceived quality and watch time. Shoot or crop to 1080 x 1920 so every pixel fills the screen." },
  { title: "Layer burnt-in captions for silent viewers", body: "Over 70% of Shorts are watched with the sound muted. Add concise subtitles inside the safe zone to boost retention and accessibility." },
  { title: "Close with a clear CTA above the bottom bar", body: "Ask viewers to like, comment, or tap 'Subscribe'. Place the CTA text inside the safe zone—about 350 px above the bottom—to avoid being hidden by the UI." },
  { title: "Ride trending sounds—then add original value", body: "Using popular audio boosts discoverability, but pair it with a fresh visual twist or unique insight so the clip stands out in the trend wave." },
  { title: "Aim for 15-35 seconds to maximize completion rate", body: "Shorter isn't always better—clips under 15 s can feel abrupt, while >40 s often lose viewers. The sweet spot for most niches is 20-30 seconds." },
  { title: "Batch-shoot and schedule for consistency", body: "Film multiple Shorts in one session, then use PostPlanify to drip them out daily. Consistent posting feeds the algorithm and keeps you top-of-mind." },
  { title: "Monitor audience retention curves weekly", body: "YouTube Analytics shows exactly where viewers drop. Identify boring moments and trim future videos to keep that retention line flat." },
  { title: "Leverage pinned comments for extra context", body: "Add links, product details, or follow-up resources in a pinned comment. It's a stealthy CTA that doesn't clutter the video itself." },
  { title: "Design for the description-expanded state", body: "YouTube's bottom bar grows to ~400 px when viewers expand the description. Keep critical content well above this line — check both collapsed and expanded states in our tool." },
  { title: "Check safe zones when cross-posting to TikTok or Reels", body: "YouTube Shorts, TikTok, and Instagram Reels all have different overlay sizes and positions. If you repurpose content, check each platform's safe zone separately to avoid covered text or hidden CTAs." },
];

const COMMON_ISSUES = [
  {
    q: "⚠️My text is hidden behind YouTube's description bar",
    solutions: [
      "Keep all text at least 300 px above the bottom edge to clear the description and action bar",
      "Toggle 'Description Expanded' in the checker to see the larger bottom overlay",
      "YouTube's bottom bar grows when viewers tap to read the description — design for the expanded state",
      "Move important text to the upper-center area of the frame for maximum visibility",
    ],
  },
  {
    q: "⚠️Subscribe button and engagement icons cover my content",
    solutions: [
      "Keep key visuals at least 96 px from the right edge to clear the icon column",
      "The subscribe button, like/dislike, comments, and share icons sit in a fixed right-side column",
      "Avoid placing logos, watermarks, or CTAs in the right quarter of the frame",
      "Use our checker to see exactly where the engagement icons overlap your content",
    ],
  },
  {
    q: "⚠️My Short doesn't fill the full screen on YouTube",
    solutions: [
      "Export at 1080 x 1920 pixels (9:16 aspect ratio) for full-screen display",
      "YouTube adds black bars to 16:9 horizontal videos, reducing perceived quality and watch time",
      "If using 720 x 1280 resolution, YouTube will upscale but safe zones still apply proportionally",
      "Crop horizontal footage to 9:16 in your editor before uploading as a Short",
    ],
  },
  {
    q: "⚠️My thumbnail cover looks wrong on the YouTube profile grid",
    solutions: [
      "YouTube crops Shorts thumbnails to a 1:1 square (1080 x 1080) on your channel page",
      "Keep titles, faces, and key visual elements within the center square of your frame",
      "Use the Thumbnail Preview toggle in our checker to see the center-square crop",
      "Choose a custom cover if the default crop hides important content",
    ],
  },
];

const FAQS = [
  { q: "What is the YouTube Shorts safe zone in 2026?", a: "The YouTube Shorts safe zone in 2026 refers to the central area of a 9:16 vertical video where content remains fully visible without being covered by YouTube's UI elements like channel name, subscribe button, engagement icons, and description bar. For standard 1080x1920 videos, the safe zone is approximately 888x1500 pixels." },
  { q: "What is the YouTube Shorts safe zone?", a: "The safe zone is the central area of a 9:16 (1080 x 1920) frame that stays visible after YouTube adds its on-screen elements—channel name, subscribe button, like/dislike icons, comments, share, and video description bar. Anything outside this region risks being covered, so placing key text, faces, or calls-to-action inside the safe zone keeps them readable on every device." },
  { q: "How big is the safe zone for YouTube Shorts?", a: "Current measurements (mid-2026) leave roughly 120 px padding at the top, 300 px at the bottom, and 96 px along the right edge of a 1080 x 1920 canvas. That center 888 x 1500 area is your safest space for titles, captions, and important visuals." },
  { q: "What are the exact YouTube Shorts safe zone dimensions in pixels?", a: "For standard 1080 x 1920 Shorts, the safe zone is approximately 888 x 1500 pixels. The top bar occupies ~120 px, the bottom bar (title, channel, audio, actions) takes ~300 px, and the right-side engagement icons are ~96 px wide. When the description is expanded, the bottom overlay grows to ~400 px. These dimensions are current as of 2026." },
  { q: "Why does the bottom bar cover so much space?", a: "YouTube shows the video title, channel handle, audio track, and action buttons (Like, Comment, Share) in a persistent bottom bar. When viewers expand the description, that bar grows—so any graphics below ~300 px from the bottom edge may be hidden." },
  { q: "Does the safe-zone change on different phones?", a: "The UI scales proportionally, so the percentage of the frame obscured stays the same on iOS and Android, small screens and large. However, older phones with notches can intrude further into the top area; keeping titles at least 120 px from the top avoids that risk." },
  { q: "How does the PostPlanify YouTube Shorts Safe Zone Checker work?", a: "Drag-and-drop a video (MP4/MOV/WebM) or a single frame, and the tool overlays semi-transparent masks representing YouTube's current UI. Toggle the description-expanded view to preview the larger bottom bar. No files leave your browser." },
  { q: "What file types and sizes can I upload?", a: "Upload MP4, MOV, or WEBM up to 100 MB, or PNG/JPEG stills up to 10 MB. The checker auto-scales smaller files but warns if the aspect ratio isn't 9:16." },
  { q: "Can I download a screenshot with the overlay guides?", a: "Yes. Click Download PNG to save the current frame plus the safe-zone mask. Creators use these annotated images during editing or when working with freelance designers." },
  { q: "How do I fix text being cut off in YouTube Shorts?", a: "Ensure all text elements sit inside the safe zone — at least 120 px below the top edge, 300 px above the bottom edge, and 96 px from the right side. Upload your Short to our safe zone checker to see exactly where YouTube's UI overlaps. Then adjust text in your editing software before re-exporting." },
  { q: "Do I need to worry about safe zones for thumbnail covers?", a: "Shorts thumbnails display at 1:1 in a 1080 x 1080 square. Use the tool's Thumbnail Preview toggle to see the center square crop and keep titles/graphics fully visible." },
  { q: "Does safe-zone placement affect the Shorts algorithm?", a: "Indirectly, yes. Videos with clear, unobstructed visuals usually deliver higher watch-through and engagement, which the algorithm rewards with more impressions." },
  { q: "Are YouTube Ads overlays different from organic Shorts?", a: "Yes. In-feed ads add a 'Sponsored' label and a larger CTA button at the bottom, extending the bottom overlay to ~360 px. Use Ad Mode in the checker to preview that extra space." },
  { q: "Can I use the safe zone checker for YouTube Shorts Ads?", a: "Yes. Toggle Ad Mode to see YouTube's Sponsored label and call-to-action button overlay. This is critical for paid campaigns — if your brand logo or offer sits behind the CTA button, you're wasting ad spend. Always preview ad creative in Ad Mode before launching." },
  { q: "What's the difference between YouTube Shorts and TikTok safe zones?", a: "YouTube Shorts has a narrower right-side icon column (~96 px) compared to TikTok (~164 px), but YouTube's bottom bar is taller (~300 px vs ~324 px) and grows when the description expands. Always check both platforms separately if you cross-post content." },
  { q: "Will these overlay dimensions change in the future?", a: "YouTube tweaks the Shorts UI a few times a year. The PostPlanify checker tracks official guideline updates and pushes overlay changes automatically—you don't need to re-install anything." },
  { q: "How can I position on-screen captions correctly?", a: "Burned-in captions should sit at least 320 px above the bottom edge and inside the inner 888 px width. The checker shows a dashed line indicating a safe caption baseline." },
  { q: "Does the tool integrate with PostPlanify scheduling?", a: "After validating placement, click Schedule in PostPlanify to pass the media directly to your Shorts publishing queue—no extra uploads." },
  { q: "Can I batch-check multiple Shorts at once?", a: "Version 1 previews one video at a time for accuracy. Batch validation and API access are on our roadmap—subscribe inside the tool for early access." },
  { q: "Does safe-zone compliance affect YouTube's algorithm directly?", a: "YouTube hasn't publicly confirmed a direct algorithm boost, but Shorts with clear, unobstructed visuals consistently show higher completion rates and engagement. Since watch time is YouTube's primary ranking signal for Shorts, safe-zone-friendly content enjoys significant indirect algorithm gains." },
  { q: "Is the checker really free?", a: "Yes. It's 100% FREE YouTube Shorts Safe Zone Checker. You can use it as many times as you want. Upload your video or thumbnail to see platform overlays and ensure your content is always perfectly placed." },
  { q: "What if my overlay looks different from what I see in the app?", a: "Toggle Description Expanded to match the view you captured. If you still notice a mismatch, click the feedback icon, attach screenshots with your app version, and we'll adjust the mask—typically within 48 hours." },
];

const OTHER_SAFE_ZONES = [
  {
    title: "Instagram Safe Zone Checker",
    body: "Check Reels & Stories overlays to keep your content perfectly visible",
    href: "/tools/instagram-safe-zone-checker",
    color: "from-pink-500 to-purple-600",
  },
  {
    title: "TikTok Safe Zone Checker",
    body: "Preview TikTok overlays and optimize your vertical video placement",
    href: "/tools/tiktok-safe-zone-checker",
    color: "from-zinc-700 to-zinc-900",
  },
];

const RELATED_RESOURCES = [
  {
    title: "Scheduler Comparisons & Reviews",
    links: [
      { label: "Best Hootsuite Alternatives for YouTube Creators", href: "/alternative-to-hootsuite" },
      { label: "Buffer vs Hootsuite Compared for 2026", href: "/compare/buffer-vs-hootsuite" },
      { label: "Buffer Pricing Breakdown: Is It Worth It in 2026?", href: "/buffer-pricing" },
      { label: "Best Sprout Social Alternatives for YouTube", href: "/alternative-to-sprout-social" },
      { label: "Hootsuite vs Sprout Social Compared", href: "/compare/hootsuite-vs-sprout-social" },
      { label: "Sprout Social Pricing: Full Breakdown", href: "/sprout-social-pricing" },
      { label: "Best Hootsuite Alternatives for Creators", href: "/blog/best-hootsuite-alternatives" },
      { label: "Best Buffer Alternatives: Features Compared", href: "/blog/best-buffer-alternatives" },
    ],
  },
  {
    title: "Industries & Solutions",
    links: [
      { label: "Social Media for YouTube Creators", href: "/social-media-management-for-youtube-creators" },
      { label: "Social Media for Video Creators", href: "/social-media-management-for-video-creators" },
      { label: "Social Media for Gaming Streamers", href: "/social-media-management-for-gaming-streamers" },
      { label: "Social Media for Tech Reviewers", href: "/social-media-management-for-tech-reviewers" },
      { label: "Social Media for Content Creators", href: "/social-media-management-for-creators" },
      { label: "Social Media for Podcasters", href: "/social-media-management-for-podcasters" },
    ],
  },
  {
    title: "Free Tools",
    links: [
      { label: "YouTube Description Generator", href: "/tools/youtube-description-generator" },
      { label: "YouTube Channel Description Generator", href: "/tools/youtube-bio-generator" },
      { label: "YouTube Channel Name Generator", href: "/tools/youtube-channel-name-generator" },
      { label: "YouTube Hashtag Generator", href: "/tools/youtube-hashtag-generator" },
      { label: "YouTube Line Break Generator", href: "/tools/youtube-line-break-generator" },
      { label: "YouTube Engagement Calculator", href: "/tools/youtube-engagement-calculator" },
    ],
  },
];

const ARTICLES = [
  { title: "How to Schedule YouTube Shorts in 2026", href: "/blog/how-to-schedule-youtube-shorts-in-2025" },
  { title: "Best Time to Upload a YouTube Video", href: "/blog/best-time-to-upload-a-youtube-video" },
  { title: "How to Livestream on YouTube Without 1000 Subscribers", href: "/blog/how-to-livestream-on-youtube-without-1000-subscribers" },
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
  { name: "Frank Benton", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Ffrank-benton.jpeg&w=96&q=75", text: "It is a huge time saver. I love that I can access my Canva designs without needing to download anything." },
  { name: "Monta", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fmonta.jpg&w=96&q=75", text: "The customer service is absolutely awesome. I manage over 13 accounts and some of the videos reachover 500,000 views!" },
  { name: "AprovaLeges", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faprovaleges.jpg&w=96&q=75", text: "PostPlanify has transformed our social media management. The interface is intuitive, and the scheduling works with precision, allowing the AprovaLeges team to focus on what truly matters: producing quality content." },
  { name: "Shaheer", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fshaheer.jpg&w=96&q=75", text: "postplanify is the best ive seen so far, has all the features i need." },
  { name: "Aleksandr Heinlaid", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faleksandr-heinlaid.avif&w=96&q=75", text: "PostPlanify mixes AI captions, multi-platform scheduling, and Canva templates. Overall a massive time saver for agencies." },
  { name: "Tintin", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Ftintin.jpg&w=96&q=75", text: "We're loving PostPlanify. I've been using scheduling tools for years and it's by far the best one." },
  { name: "Andreas", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Freddit-man-avatar.jpg&w=96&q=75", text: "Really helped me manage my time better and keep all my posts organized in one place." },
  { name: "Sam", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fsam-cranq.avif&w=96&q=75", text: "It's looking great!! Just what I needed to make my SM game up to the next level." },
  { name: "PostPlanify User", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Freddit-man-avatar.jpg&w=96&q=75", text: "I love it! I fired my social media manager and now just use postplanify." },
  { name: "Oguz Doruk", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Foguz-doruk.jpg&w=96&q=75", text: "Been on the $79 plan for 2 months. API access and MCP support is something most alternatives don't have. Didn't think I'd pay $80/mo just to post on social media, but it saves a lot of time." },
];

/* ------------------------------------------------------------------ */
/*  Section components                                                 */
/* ------------------------------------------------------------------ */

function YouTubeHeroIcon() {
  return (
    <svg
      role="img"
      aria-label="YouTube Shorts"
      viewBox="0 0 24 24"
      width="48"
      height="48"
      className="mx-auto"
    >
      <path
        fill="#FF0000"
        d="M17.77 10.32l-1.2-.5L13 8.5v7l3.57-1.32 1.2-.5c1.07-.46 1.07-2.04 0-2.36zM10 7v10l5-3.5L10 7zM21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"
      />
    </svg>
  );
}

function UploadWidget() {
  const [hover, setHover] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
      }}
      className={`flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed transition-colors p-8 sm:p-12 ${
        hover ? "border-primary bg-primary/5" : "border-muted-foreground/30"
      }`}
      style={{ minHeight: 320 }}
    >
      <UploadCloud className="size-8 text-muted-foreground mb-4" />
      <h3 className="font-semibold text-lg mb-2">Upload YouTube Shorts Content</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Drop a 9:16 video (MP4, MOV, WEBM) or image (PNG, JPEG) up to 100MB
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,image/png,image/jpeg"
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        type="button"
        className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
      >
        Choose File
      </button>
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
              Schedule YouTube Shorts While You Sleep
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Plan your content in advance. Stay consistent without opening YouTube daily.
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

export function YouTubeShortsSafeZoneCheckerClient() {
  return (
    <>
      <Header />
      <main>
        {/* Hero + Upload Widget + Promo */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <YouTubeHeroIcon />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">
                YouTube Shorts Safe Zone Checker
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Avoid UI overlap on your videos with our free YouTube Shorts safe zone checker. Upload your video or thumbnail to see platform overlays and ensure your content is always perfectly placed.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <UploadWidget />
              <PromoCard />
            </div>
          </Container>
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Three quick steps to preview YouTube Shorts&apos; UI overlay and export a placement guide.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((step, i) => (
                <Card key={i} className="p-6 text-center">
                  <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-4">
                    <step.Icon className="size-6" />
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

        {/* Use Cases */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Popular Use Cases</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See how creators, agencies, and brands use the YouTube Shorts safe zone checker every day.
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

        {/* Dimensions Reference */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
              YouTube Shorts Safe Zone Dimensions in 2026: The Complete Reference
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground">
              <p>
                YouTube Shorts use a <strong>1080 × 1920 pixel</strong> canvas (9:16 aspect ratio), but the visible area is reduced by YouTube&apos;s persistent UI elements. The subscribe button, engagement icons, channel name, description bar, and audio attribution all overlay portions of your video.
              </p>
              <p>
                The <strong>safe zone for YouTube Shorts</strong> is approximately <strong>888 × 1500 pixels</strong>, centered in the 1080×1920 frame:
              </p>
              <ul>
                <li><strong>Top margin:</strong> ~120px (minimal, but grows with device notches/Dynamic Island)</li>
                <li><strong>Bottom margin:</strong> ~300px (channel name, subscribe button, description, audio track)</li>
                <li><strong>Right margin:</strong> ~96px (like, dislike, comment, share icon column)</li>
                <li><strong>Left margin:</strong> minimal (~48px edge buffer)</li>
              </ul>
              <p>
                <strong>When the description is expanded</strong>, the bottom overlay grows to approximately <strong>400px</strong>. If your CTA or important text sits at pixel 1620, it will be hidden when someone taps to read the description. Always design for the expanded state.
              </p>
              <p>
                YouTube&apos;s subscribe button is also <strong>larger and more prominent in 2026</strong> than previous years, sitting in the bottom-right corner and consuming roughly 180×80 pixels. Avoid placing logos or branded elements in this area.
              </p>
              <p>
                For the full technical breakdown across all platforms — including TikTok and Instagram Reels — see our <Link href="/blog/social-media-safe-zones-2026-complete-guide" className="text-blue-600 underline">social media safe zones complete guide</Link>.
              </p>
            </div>

            {/* Specifications table */}
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th scope="col" className="text-left py-3 px-3 font-semibold text-foreground">Format</th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold text-foreground">Canvas Size</th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold text-foreground">Top Buffer</th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold text-foreground">Bottom Buffer</th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold text-foreground">Side Buffer</th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold text-foreground">Safe Area</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <th scope="row" className="text-left py-3 px-3 font-medium text-foreground">Normal View</th>
                    <td className="text-center py-3 px-3 font-mono text-xs text-muted-foreground">1080 × 1920px</td>
                    <td className="text-center py-3 px-3"><span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono text-xs font-medium">120px</span></td>
                    <td className="text-center py-3 px-3"><span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 rounded font-mono text-xs font-medium">300px</span></td>
                    <td className="text-center py-3 px-3 font-mono text-xs text-muted-foreground">0px left, 96px right</td>
                    <td className="text-center py-3 px-3"><span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded font-mono text-xs font-semibold">984 × 1500px</span></td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <th scope="row" className="text-left py-3 px-3 font-medium text-foreground">Expanded Description</th>
                    <td className="text-center py-3 px-3 font-mono text-xs text-muted-foreground">1080 × 1920px</td>
                    <td className="text-center py-3 px-3"><span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono text-xs font-medium">120px</span></td>
                    <td className="text-center py-3 px-3"><span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 rounded font-mono text-xs font-medium">360px</span></td>
                    <td className="text-center py-3 px-3 font-mono text-xs text-muted-foreground">0px left, 96px right</td>
                    <td className="text-center py-3 px-3"><span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded font-mono text-xs font-semibold">984 × 1440px</span></td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <th scope="row" className="text-left py-3 px-3 font-medium text-foreground">Thumbnail (1:1)</th>
                    <td className="text-center py-3 px-3 font-mono text-xs text-muted-foreground">1080 × 1080px</td>
                    <td className="text-center py-3 px-3"><span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono text-xs font-medium">0px</span></td>
                    <td className="text-center py-3 px-3"><span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 rounded font-mono text-xs font-medium">0px</span></td>
                    <td className="text-center py-3 px-3 font-mono text-xs text-muted-foreground">0px</td>
                    <td className="text-center py-3 px-3"><span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded font-mono text-xs font-semibold">1080 × 1080px</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Container>
        </section>

        {/* Blog guide callout */}
        <section className="w-full max-w-4xl mx-auto my-4 px-4">
          <Link
            href="/blog/social-media-safe-zones-2026-complete-guide"
            className="group block p-4 border-2 border-blue-400 rounded-lg hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-base text-gray-900 group-hover:text-primary transition-colors mb-1">
                  Complete Guide: Social Media Safe Zones 2026
                </h3>
                <p className="text-sm text-gray-600">
                  Learn pixel-perfect specs, device variations, and organic vs paid layouts
                </p>
              </div>
              <ArrowRight className="size-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </Link>
        </section>

        {/* Why Safe Zones Matter */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
              Why Safe Zones Matter for YouTube Shorts Performance
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground">
              <p>
                YouTube Shorts compete in an infinite scroll feed where viewers decide to keep watching or swipe within 1-2 seconds. If your hook text is hidden behind the subscribe button or your CTA disappears behind the description bar, you lose viewers before they even engage.
              </p>
              <ul>
                <li><strong>Watch time is YouTube&apos;s #1 Shorts ranking signal.</strong> Hidden text means confused viewers, which means shorter watch times, which means less algorithmic distribution.</li>
                <li><strong>The subscribe button is your conversion point.</strong> If your &ldquo;Subscribe for more&rdquo; text overlay sits directly behind YouTube&apos;s actual subscribe button, it&apos;s invisible — and your conversion prompt is wasted.</li>
                <li><strong>Cross-posting requires separate checks.</strong> A Short that looks perfect on YouTube may have text covered on TikTok (wider right column) or Instagram Reels (different bottom bar height). Use our <Link href="/tools/tiktok-safe-zone-checker" className="text-blue-600 underline">TikTok safe zone checker</Link> and <Link href="/tools/instagram-safe-zone-checker" className="text-blue-600 underline">Instagram safe zone checker</Link> for those platforms.</li>
              </ul>
              <p>
                For scheduling your Shorts after checking safe zones, see our guides on <Link href="/blog/how-to-schedule-youtube-shorts-in-2025" className="text-blue-600 underline">how to schedule YouTube Shorts</Link> and best YouTube scheduling tools. Posting at the best time for your audience combined with proper safe zone compliance gives your Shorts the strongest possible start.
              </p>
            </div>
          </Container>
        </section>

        {/* Schedule CTA callout */}
        <section className="w-full max-w-4xl mx-auto my-6 px-4">
          <div className="p-6 md:p-8 bg-muted/50 border-l-4 border-primary rounded-lg">
            <h3 className="text-lg md:text-xl font-semibold mb-3 text-foreground">
              Safe zone checked — ready to schedule your YouTube Shorts?
            </h3>
            <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
              Now that your Shorts content sits properly inside the crop-safe areas, the final step is scheduling across YouTube, TikTok, and Instagram Reels. If you&apos;re evaluating schedulers, we wrote a detailed <Link href="/compare/buffer-vs-later" className="text-blue-600 underline underline-offset-2 hover:text-blue-700 font-medium">Buffer vs Later comparison</Link> — only one of them actually supports YouTube. See <Link href="/alternative-to-buffer" className="text-blue-600 underline underline-offset-2 hover:text-blue-700 font-medium">the best Buffer alternatives for YouTube creators</Link>, or read our <Link href="/hootsuite-pricing" className="text-blue-600 underline underline-offset-2 hover:text-blue-700 font-medium">Hootsuite pricing analysis for 2026</Link> to decide if enterprise-tier pricing fits your budget.
            </p>
          </div>
        </section>

        {/* Pro Tips */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">💡 Pro Tips</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Practical YouTube Shorts advice from creators who post every day and test what works.
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

        {/* Common Issues */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Common Issues &amp; Solutions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The most frequent safe-zone problems creators face — and exactly how to fix them.
              </p>
            </div>
            <CommonIssuesAccordion items={COMMON_ISSUES} />
          </Container>
        </section>

        {/* Browser Compatibility */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Browser Compatibility</h2>
              <p className="text-muted-foreground">
                The YouTube Shorts Safe Zone Checker runs in any modern browser — desktop and mobile.
              </p>
            </div>
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Monitor className="size-5" />
                  Desktop Browsers
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {["Chrome", "Firefox", "Safari", "Edge", "Opera"].map((b) => (
                    <div key={b} className="flex items-center gap-2 p-3 rounded-lg">
                      <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Smartphone className="size-5" />
                  Mobile Browsers
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["iOS Safari", "Chrome Mobile", "Samsung Internet"].map((b) => (
                    <div key={b} className="flex items-center gap-2 p-3 rounded-lg">
                      <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <Globe className="size-4" />
                  Works on All Browsers
                </h4>
                <p className="text-sm text-muted-foreground">
                  Processing happens server-side, so no browser plugin or extension is required. Works seamlessly across all modern browsers and devices.
                </p>
              </div>
            </Card>
          </Container>
        </section>

        {/* FAQs */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about YouTube Shorts safe zones, dimensions, and best practices.
              </p>
            </div>
            <FaqAccordion items={FAQS} />
          </Container>
        </section>

        {/* Other Safe Zone Tools */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Check out our Safe Zone Checker Tools
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Optimize your content for every platform with our complete suite of safe zone checkers
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {OTHER_SAFE_ZONES.map((tool) => (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="group block rounded-xl bg-card text-card-foreground shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 hover:border-primary/20"
                >
                  <div className="p-6 flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} text-white shrink-0`}>
                      <svg role="img" aria-label={tool.title} viewBox="0 0 24 24" fill="currentColor" className="size-8 text-white">
                        <path d={tool.title.includes("TikTok") ? "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" : "M7.8 2h8.4C19.4 22 4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {tool.body}
                      </p>
                      <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all duration-200">
                        <span>Try this tool</span>
                        <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Card className="p-6 mt-8 text-center max-w-2xl mx-auto">
              <h3 className="font-semibold text-xl mb-2">Post smarter, not harder.</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Schedule, preview, and publish across all major platforms — from one simple dashboard.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-black text-white hover:bg-zinc-800 font-medium transition-colors"
              >
                Start 7-day Free Trial
              </Link>
            </Card>
          </Container>
        </section>

        {/* Related Resources */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Related Resources</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Explore our free tools and helpful articles to maximize your YouTube strategy
              </p>
            </div>

            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground">
                Check out our{" "}
                <Link href="/youtube-scheduler" className="text-blue-600 underline font-medium">
                  YouTube Scheduler
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
                        key={link.href}
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
            <div className="columns-1 sm:columns-2 lg:columns-5 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="break-inside-avoid mb-4">
                  <div className="flex flex-col gap-2 bg-white text-gray-900 border rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={t.name} loading="lazy" width={40} height={40} decoding="async" className="w-full h-full object-cover" src={t.avatar} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate">{t.name}</span>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className="size-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{t.text}</p>
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