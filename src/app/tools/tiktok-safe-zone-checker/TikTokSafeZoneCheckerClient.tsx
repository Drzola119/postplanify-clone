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
  Users,
  ArrowRight,
  AlertTriangle,
  HelpCircle,
  Monitor,
  Smartphone,
  Globe,
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
    Icon: UploadCloud,
    title: "Upload your video or thumbnail",
    body: "Drag and drop your TikTok video (MP4, MOV, WebM) or a still frame (PNG, JPEG) into the checker. Everything runs locally in your browser — no files are uploaded to any server.",
  },
  {
    Icon: Layers,
    title: "Toggle between Organic and Ad overlays",
    body: "Switch between TikTok's standard organic layout (profile photo, captions, engagement icons) and Ad mode (Sponsored label + CTA button) to see exactly where the UI covers your content.",
  },
  {
    Icon: Download,
    title: "Adjust placement and export your guide",
    body: "Reposition text, faces, and CTAs into the safe zone. Download an annotated PNG screenshot with overlay guides to use as a reference in CapCut, Premiere, or any editing software.",
  },
];

const USE_CASES = [
  {
    Icon: Sparkles,
    title: "Nail Your Text Placement on Every TikTok",
    body: "Preview your videos before posting to ensure on-screen text, subtitles, and hashtags aren't hidden behind TikTok's profile icon, engagement buttons, or caption bar. Stop losing views to covered content.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    Icon: Briefcase,
    title: "QA Client TikToks Before Publishing",
    body: "Check every client video against TikTok's safe zone before it goes live. Download annotated screenshots for approval workflows on Slack, Notion, or email. Essential for agencies managing multiple creator accounts.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    Icon: LayoutTemplate,
    title: "Build TikTok Templates That Work",
    body: "Design video templates with safe-zone awareness built in. Verify text overlays, branded elements, and CTA buttons are fully visible before handing off to clients or content teams.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    Icon: Eye,
    title: "Keep Your Face and Message Visible",
    body: "Ensure talking-head videos, tutorial overlays, and motivational quotes aren't blocked by TikTok's engagement icons or expanding caption bar. Maximize first-3-second retention and watch time.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    Icon: Target,
    title: "Optimize TikTok Ad Creatives",
    body: "Preview TikTok Spark Ads and In-Feed Ad overlays including the Sponsored label and CTA button before launching campaigns. Avoid wasting ad budget on creatives with hidden logos or offers.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    Icon: Users,
    title: "Deliver Client-Ready Vertical Content",
    body: "Validate safe zone placement for every TikTok you edit before delivering to clients. Export overlay screenshots as proof of correct framing — no more revision rounds for covered text.",
    color: "bg-cyan-100 text-cyan-600",
  },
];

const PRO_TIPS = [
  { title: "Keep text inside the TikTok safe zone", body: "Before you publish, preview overlays with the PostPlanify Safe-Zone Checker to ensure captions, stickers, and calls-to-action aren't hidden by the UI icons." },
  { title: "Hook viewers within the first 3 seconds", body: "Open with movement, a bold statement, or a 'watch till the end' teaser. TikTok's algorithm weighs early watch-through heavily when deciding who gets pushed to For You pages." },
  { title: "Use trending sounds—then add your twist", body: "Pair a viral audio clip with niche-specific visuals. This taps into existing momentum while keeping the content unique to your brand." },
  { title: "Add on-screen captions for silent scrollers", body: "Over 60% of TikTok users watch with the sound low or off. Auto-generate subtitles, then nudge them into the center of the safe zone so they stay readable on every device." },
  { title: "Reply to high-performing comments with a video", body: "Turning top comments into follow-up videos drives community feel and doubles your content output without new brainstorming." },
  { title: "Post at least once per day—consistently", body: "Regular uploads reset the algorithm 'learning phase' and keep your account top-of-mind. Use PostPlanify to batch-schedule clips so you never miss a cadence." },
  { title: "Close with a clear call-to-action", body: "Ask viewers to like, save, share, or click your bio link. Place the CTA above the caption area to avoid overlap with the engagement bar." },
  { title: "Analyze retention curves weekly", body: "TikTok's built-in analytics show exactly where viewers drop off. Trim dead air, tighten edits, and keep cuts punchy to push that retention line higher." },
  { title: "Design for the expanding caption bar", body: "TikTok's caption area expands when viewers tap to read longer descriptions. Keep important content at least 370 px above the bottom edge to stay visible even when captions are expanded." },
  { title: "Check safe zones when cross-posting to Instagram Reels", body: "TikTok and Instagram have different overlay sizes — TikTok's right icon column is wider (~164 px vs ~84 px). If you repurpose content, check each platform's safe zone separately to avoid covered text." },
  { title: "Keep faces away from the right engagement column", body: "TikTok's like, comment, share, and bookmark icons sit on the right side. If your subject's face is on the right third of the frame, it gets partially blocked. Frame subjects center or center-left." },
];

const COMMON_ISSUES = [
  {
    q: "⚠️My on-screen text is hidden behind TikTok's caption bar",
    solutions: [
      "Keep all text at least 324 px above the bottom edge for organic posts (370 px for ads)",
      "Use our safe zone checker to preview the exact caption bar position before posting",
      "Remember the caption bar expands when viewers tap to read longer descriptions",
      "Move important text to the upper-center area of the frame for maximum visibility",
    ],
  },
  {
    q: "⚠️TikTok's engagement icons cover my content on the right side",
    solutions: [
      "Keep key visuals at least 164 px from the right edge to clear the icon column",
      "The engagement icons (like, comment, share, bookmark) sit in a fixed column on the right",
      "Avoid placing logos, watermarks, or CTAs in the right third of the frame",
      "Use our checker to see exactly where the icon column overlaps your content",
    ],
  },
  {
    q: "⚠️My video doesn't fill the full TikTok screen",
    solutions: [
      "Export at 1080 x 1920 pixels (9:16 aspect ratio) for full-screen display",
      "TikTok adds black bars to 16:9 horizontal videos which reduces engagement",
      "If using 720 x 1280 resolution, TikTok will upscale but safe zones still apply",
      "Crop horizontal footage to 9:16 in your editor before uploading",
    ],
  },
  {
    q: "⚠️My TikTok ad creative has hidden CTA or branding",
    solutions: [
      "Toggle Ad Mode in the checker to see the Sponsored label and CTA button overlay",
      "TikTok ads extend the bottom overlay to ~370 px — keep branding above this line",
      "The CTA button sits at the very bottom center and can hide discount codes or logos",
      "Always preview both organic and ad layouts before launching paid campaigns",
    ],
  },
];

const FAQS = [
  {
    q: "What is the TikTok safe zone in 2026?",
    a: "The TikTok safe zone in 2026 refers to the central area of a 9:16 vertical video where important content remains fully visible without being covered by TikTok's UI elements like buttons, captions, profile icons, and engagement controls. For standard 1080x1920 videos, the safe zone is approximately 960x1386 pixels.",
  },
  {
    q: "What is a TikTok safe zone?",
    a: "The TikTok safe zone (sometimes called the 'UI overlay safe area') is the portion of a 9:16 vertical video that won't be covered by TikTok's on-screen elements—profile photo, captions, buttons, and engagement icons. Using a TikTok safe-zone checker ensures text, faces, and CTAs remain fully visible.",
  },
  {
    q: "Why do I need a TikTok safe-zone checker tool?",
    a: "TikTok overlays its profile picture, follow button, likes, comments, share icons, and video captions directly on top of your content. A free TikTok safe-zone checker lets you preview these overlays, so you can avoid important text or logos being hidden, which improves viewer retention and click-through rate.",
  },
  {
    q: "What are the exact safe-zone dimensions for TikTok videos?",
    a: "For standard 1080 x 1920 videos, the most up-to-date safe area is roughly the center 960 x 1386 pixels: leave 164 px padding on both left and right, 324 px at the bottom (where captions and icons sit), and ~140 px at the top to avoid crop on some devices.",
  },
  {
    q: "Does the safe zone change for TikTok ads?",
    a: "Yes. TikTok Spark Ads and In-Feed Ads add an extra call-to-action bar at the bottom. When running ads, keep key elements above 370 px from the bottom. Our TikTok safe-zone checker includes an ad-mode toggle so you can preview organic vs. paid layouts.",
  },
  {
    q: "Will TikTok safe zones vary by phone model or screen size?",
    a: "TikTok scales UI proportionally across devices, so the percentage of the screen covered is consistent. However, older phones with notch cutouts can eat into top margin; checking with a responsive safe-zone overlay ensures compatibility on iPhone, Android, and tablets.",
  },
  {
    q: "How do I use PostPlanify's TikTok Safe Zone Checker?",
    a: "Simply upload or drag-and-drop your 9:16 vertical video or a still thumbnail. Select 'Organic' or 'Ad' view, and the tool instantly applies TikTok UI overlays. You can resize, scrub through frames, and download a screenshot with guides for easy reference.",
  },
  {
    q: "Can this tool help with other platforms like Instagram Reels or YouTube Shorts?",
    a: "Yes! Click the multi-platform tab to switch overlays. The same video can be previewed with Instagram Reels safe zones, YouTube Shorts UI, and Snapchat Spotlight overlays—all in one place.",
  },
  {
    q: "Is the TikTok Safe Zone Checker really free?",
    a: "Absolutely. The checker runs entirely in your browser using JavaScript and HTML5 Canvas—no watermarks, no login required, and no hidden costs.",
  },
  {
    q: "What video formats are supported?",
    a: "You can upload .MP4, .MOV, and .WEBM files up to 100 MB. For quick layout checks, you can also drop in a single 1080 x 1920 PNG or JPEG frame.",
  },
  {
    q: "How do I fix text being cut off in TikTok videos?",
    a: "Ensure all text elements sit inside the safe zone — at least 140 px below the top edge, 324 px above the bottom edge, and 164 px from the right side. Upload your video to our safe zone checker to see exactly where TikTok's UI overlaps. Then adjust text in CapCut, Premiere, or your preferred editor before re-exporting.",
  },
  {
    q: "Does checking the safe zone affect video quality?",
    a: "No. The tool merely overlays a semi-transparent guide in your browser—your original video file stays untouched, and you can safely re-download or schedule it through PostPlanify.",
  },
  {
    q: "How often does TikTok change its UI overlay dimensions?",
    a: "TikTok tweaks icon spacing every few months. We monitor official design guidelines and update the safe-zone overlay automatically, so you always preview the latest layout without lifting a finger.",
  },
  {
    q: "What's the difference between the 'caption area' and the 'engagement icon area'?",
    a: "The caption area runs across the full width near the bottom and expands as your caption length grows. The engagement icon column sits on the right-hand side. Both occupy space simultaneously; using a checker helps you keep faces away from icons AND text away from the expanding caption field.",
  },
  {
    q: "How can I place text safely in TikTok videos?",
    a: "Keep important text within the 960-pixel horizontal center and at least 370 px above the bottom edge (for ads) or 324 px (for organic). Use our text-overlay preview in the safe-zone tool to drag headlines into the perfect spot.",
  },
  {
    q: "What's the difference between TikTok and Instagram Reels safe zones?",
    a: "TikTok has a wider right-side icon column (~164 px) compared to Instagram Reels (~84 px), and TikTok's caption bar expands dynamically when viewers tap to read. Instagram's bottom overlay is fixed at ~310 px. Always check both platforms separately if you cross-post content — what's visible on Instagram may be hidden on TikTok.",
  },
  {
    q: "Can I share safe-zone screenshots with my team?",
    a: "Every preview session includes a one-click 'Download PNG with Guides' button plus a shareable URL so collaborators can review placement without re-uploading the file.",
  },
  {
    q: "Will using a safe-zone checker improve my watch-through rate?",
    a: "Creators report higher average watch time and better call-to-action click-throughs when crucial elements aren't hidden by the TikTok UI. Ensuring correct alignment can boost the first-3-second retention that TikTok's algorithm prioritizes.",
  },
  {
    q: "Can I use the safe zone checker for TikTok Ads?",
    a: "Yes. Toggle Ad Mode to see TikTok's Sponsored label and call-to-action button overlay, which extends the bottom safe zone to ~370 px. This is critical for paid campaigns — if your brand logo or offer sits behind the CTA button, you're wasting ad spend. Always preview ad creative in Ad Mode before launching.",
  },
  {
    q: "Do vertical videos shorter than 1080 x 1920 need safe-zone checks?",
    a: "Yes—TikTok will still display overlays relative to the top and bottom edges, so smaller 720 x 1280 clips can lose content if text or logos hug the edges.",
  },
  {
    q: "What aspect ratio does TikTok recommend for safe uploads?",
    a: "TikTok recommends 9:16 (vertical) for full-screen impact. Our safe-zone checker supports 9:16, but we also flag if you accidentally upload a 1:1 or 16:9 clip so you can add padding before posting.",
  },
  {
    q: "Does the tool support batch processing?",
    a: "For now, the checker previews one video at a time for accuracy. Batch safe-zone validation is on our roadmap—join the newsletter inside PostPlanify to get early access.",
  },
  {
    q: "Does safe-zone compliance affect TikTok's algorithm directly?",
    a: "TikTok hasn't publicly confirmed a direct algorithm boost, but videos with clear, unobstructed visuals consistently show higher completion rates and engagement. Since watch time is TikTok's primary ranking signal, safe-zone-friendly content enjoys significant indirect algorithm gains.",
  },
  {
    q: "How do I report a mismatch between the overlay and TikTok's latest app version?",
    a: "Click the feedback button in the corner of the checker. Provide your app version and device screenshots; we typically push overlay updates within 48 hours.",
  },
];

const OTHER_SAFE_ZONES = [
  {
    title: "Instagram Safe Zone Checker",
    body: "Check Reels & Stories overlays to keep your content perfectly visible",
    href: "/tools/instagram-safe-zone-checker",
    color: "from-pink-500 to-purple-600",
  },
  {
    title: "YouTube Shorts Safe Zone Checker",
    body: "Preview YouTube Shorts UI overlays including the subscribe button",
    href: "/tools/youtube-shorts-safe-zone-checker",
    color: "from-red-500 to-red-700",
  },
];

const RELATED_RESOURCES = [
  {
    title: "Check out our TikTok Scheduler",
    links: [
      { label: "TikTok Scheduler — Post in advance", href: "/tiktok-scheduler" },
    ],
  },
  {
    title: "Scheduler Comparisons & Reviews",
    links: [
      { label: "Best Metricool Alternatives for TikTok", href: "/alternative-to-metricool" },
      { label: "Metricool vs Publer", href: "/compare/metricool-vs-publer" },
      { label: "Best Hootsuite Alternatives for TikTok", href: "/compare/hootsuite" },
      { label: "Buffer vs Hootsuite: Which is Better for TikTok?", href: "/compare/buffer" },
    ],
  },
  {
    title: "Free Tools",
    links: [
      { label: "TikTok Caption Generator", href: "/tools/tiktok-caption-generator" },
      { label: "TikTok Hashtag Generator", href: "/tools/tiktok-hashtag-generator" },
      { label: "TikTok Character Counter", href: "/tools/tiktok-character-counter" },
    ],
  },
];

const ARTICLES = [
  { title: "How to Schedule TikTok Posts in 2026", href: "/blog/how-to-schedule-tiktok-posts-in-2025" },
  { title: "Best TikTok Scheduling Tools", href: "/blog/best-tiktok-scheduling-tools" },
  { title: "Best Time to Post on TikTok", href: "/blog/best-time-to-post-on-tiktok" },
  { title: "Social Media Safe Zones 2026: Complete Guide", href: "/blog/social-media-safe-zones-2026-complete-guide" },
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

const TESTIMONIAL_AVATARS = [
  "https://postplanify.com/_next/image?url=%2Ftestimonials%2Ffrank-benton.jpg&w=64&q=75",
  "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fmonta.jpg&w=64&q=75",
  "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faprovaleges.jpg&w=64&q=75",
  "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fshaheer.jpg&w=64&q=75",
  "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faleksandr-heinlaid.jpg&w=64&q=75",
];

const TESTIMONIALS = [
  { name: "Frank Benton", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Ffrank-benton.jpg&w=64&q=75", text: "PostPlanify makes it incredibly easy to publish to all my social accounts from one place. The scheduling is rock-solid and the analytics give me the insights I need to grow." },
  { name: "Monta", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fmonta.jpg&w=64&q=75", text: "I've tried dozens of schedulers and PostPlanify is hands-down the best for TikTok creators. The safe zone checker alone saved me from so many bad uploads." },
  { name: "Aprovaleges", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faprovaleges.jpg&w=64&q=75", text: "The PostPlanify safe zone tool is a must-use. I keep my text inside the safe zone and watch-through rate jumped significantly." },
  { name: "Shaheer", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fshaheer.jpg&w=64&q=75", text: "Best free TikTok safe zone checker I've found. Saves tons of time when prepping videos for clients." },
  { name: "Aleksandr Heinlaid", avatar: "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faleksandr-heinlaid.jpg&w=64&q=75", text: "I run an agency and this is now part of every deliverable. We overlay the safe zone before client review." },
];

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
      <h3 className="font-semibold text-lg mb-2">Upload TikTok Video</h3>
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
          <div className="px-4 sm:p-5 pb-4 sm:pb-5 text-sm text-muted-foreground">
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

const SOCIAL_SVG = {
  Instagram: "M7.8 2h8.4C19.4 22 4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z",
  Youtube: "M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z",
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
/*  Main client                                                         */
/* ------------------------------------------------------------------ */

export function TikTokSafeZoneCheckerClient() {
  return (
    <>
      <Header />
      <main>
        {/* Hero + Upload Widget + Promo */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <TikTokHeroIcon />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">
                TikTok Safe Zone Checker
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Avoid UI overlap on your videos with our free TikTok safe zone checker. Upload your video or thumbnail to see platform overlays and ensure your content is always perfectly placed.
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
                Three quick steps to preview TikTok&apos;s UI overlay and export a placement guide.
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
                See how creators, agencies, and brands use the TikTok safe zone checker every day.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {USE_CASES.map((u, i) => (
                <Card key={i} className="p-6 h-full">
                  <div className={`inline-flex items-center justify-center size-12 rounded-full ${u.color} mb-4`}>
                    <u.Icon className="size-6" />
                  </div>
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
              TikTok Safe Zone Dimensions in 2026: The Complete Reference
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground">
              <p>
                TikTok videos use a <strong>1080 × 1920 pixel</strong> canvas (9:16 aspect ratio), but the actual visible area is significantly smaller. TikTok&apos;s UI overlays — profile picture, follow button, like/comment/share/bookmark icons, caption bar, and sound attribution — cover portions of the top, bottom, and right side of every video.
              </p>
              <p>
                The <strong>safe zone for organic TikTok content</strong> is approximately <strong>960 × 1386 pixels</strong>, centered in the 1080×1920 frame. This means:
              </p>
              <ul>
                <li><strong>Top margin:</strong> ~140px (profile bar, device notch/Dynamic Island)</li>
                <li><strong>Bottom margin:</strong> ~324px (caption bar, sound attribution, engagement buttons)</li>
                <li><strong>Right margin:</strong> ~164px (like, comment, share, bookmark icon column)</li>
                <li><strong>Left margin:</strong> ~60px (edge buffer)</li>
              </ul>
              <p>
                For <strong>TikTok Ads</strong> (Spark Ads, In-Feed Ads), the bottom margin increases to <strong>~370px</strong> because of the additional CTA button (&ldquo;Shop Now,&rdquo; &ldquo;Learn More,&rdquo; etc.) and the &ldquo;Sponsored&rdquo; label. Always preview ad creative in Ad Mode before launching paid campaigns.
              </p>
              <p>
                These dimensions change when TikTok updates its app UI — which happens 3-5 times per year. Our safe zone checker is updated monthly to reflect the latest TikTok interface changes.
              </p>
            </div>
          </Container>
        </section>

        {/* Why Safe Zones Matter */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
              Why TikTok Safe Zones Matter for Your Content Performance
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground">
              <p>
                Getting your safe zones right isn&apos;t just about aesthetics — it directly impacts your video&apos;s performance in TikTok&apos;s algorithm.
              </p>
              <ul>
                <li><strong>First 3 seconds determine everything.</strong> TikTok&apos;s algorithm evaluates whether viewers keep watching or swipe away within the first 1-3 seconds. If your hook text is hidden behind the engagement icons, viewers can&apos;t read it — and they swipe.</li>
                <li><strong>Hidden CTAs waste your effort.</strong> If your &ldquo;Follow for more&rdquo; text or product link is covered by the caption bar, viewers never see it.</li>
                <li><strong>Ad creative with covered branding wastes budget.</strong> TikTok ads with logos or offers hidden behind the CTA button have lower conversion rates.</li>
                <li><strong>Cross-posting requires separate checks.</strong> A video that looks perfect on TikTok may have covered text on Instagram Reels or YouTube Shorts.</li>
              </ul>
            </div>
          </Container>
        </section>

        {/* Pro Tips */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">💡 Pro Tips</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Practical TikTok advice from creators who post every day and test what works.
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
                The TikTok Safe Zone Checker runs in any modern browser — desktop and mobile.
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
              <div className="mt-6 p-4 border border-primary/20 rounded-lg flex items-start gap-3">
                <Globe className="size-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  All processing happens locally in your browser — your video files never leave your device. No signup required, no watermarks.
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
                Everything you need to know about TikTok safe zones, dimensions, and best practices.
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
                      {tool.title.includes("Instagram") ? (
                        <PlatformIcon name="Instagram" className="size-8 text-white" />
                      ) : (
                        <PlatformIcon name="Youtube" className="size-8 text-white" />
                      )}
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
                Explore our free tools and helpful articles to maximize your social media strategy
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
              {RELATED_RESOURCES.slice(1).map((group) => (
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
