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
  ShieldCheck,
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
    title: "Upload your image or video",
    body: "Drop your Instagram Reel, Story, or thumbnail into the checker. Supports MP4, MOV, WebM, PNG, and JPEG files. Everything runs in your browser — nothing is uploaded to a server.",
  },
  {
    Icon: Layers,
    title: "Choose your format and preview overlays",
    body: "Toggle between Reels, Stories, and Ad mode to see Instagram's exact UI overlays — username bar, caption area, engagement icons, and CTA buttons — rendered on top of your content.",
  },
  {
    Icon: Download,
    title: "Adjust your content and download",
    body: "Move text, faces, and CTAs into the safe zone so nothing gets hidden. Download an annotated PNG screenshot to share with your team or use as an editing guide in Premiere, CapCut, or Final Cut Pro.",
  },
];

const USE_CASES = [
  {
    Icon: Sparkles,
    title: "Perfect Reel Framing Every Time",
    body: "Preview your Reels before posting to ensure faces, subtitles, and call-to-actions aren't hidden by Instagram's UI. Stop losing engagement to poorly placed text or cropped visuals on Reels and Stories.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    Icon: Briefcase,
    title: "Client Content QA Workflow",
    body: "Check every client Reel and Story against Instagram's safe zone before publishing. Download annotated screenshots for approval workflows on Slack, Notion, or email. Perfect for agencies managing multiple accounts.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    Icon: LayoutTemplate,
    title: "Design Templates with Confidence",
    body: "Build Instagram templates with safe-zone awareness baked in. Verify text placement, logo positioning, and CTA buttons are fully visible across Reels, Stories, and Ads before handing off to clients.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    Icon: Eye,
    title: "Keep Your Face and Text Visible",
    body: "Ensure your talking-head videos, motivational quotes, and tutorial overlays aren't blocked by Instagram's caption bar or engagement icons. Maximize watch time and audience retention.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    Icon: Target,
    title: "Optimize Ad Creative Placement",
    body: "Preview Instagram Ad overlays including the Sponsored label and CTA button before launching campaigns. Avoid wasting ad spend on creatives with hidden logos, discount codes, or messaging.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    Icon: ShieldCheck,
    title: "Protect Key Visual Elements",
    body: "Check that product shots, model faces, and watermarks remain visible when posted as Reels or Stories. Ensure your portfolio content looks professional on every device and screen size.",
    color: "bg-cyan-100 text-cyan-600",
  },
];

const PRO_TIPS = [
  { title: "Keep key visuals inside the Instagram safe zone", body: "Before exporting a Reel or Story, preview it with the PostPlanify Safe-Zone Checker. Make sure faces, subtitles, and CTAs sit at least 210 px below the top bar and 310 px above the caption area so nothing gets hidden by Instagram's UI." },
  { title: "Open strong—hook viewers in the first 2 seconds", body: "Early watch-through is Instagram's top ranking signal. Start with motion, a bold headline, or a curiosity gap to lock attention before the thumb scrolls away. Keep your hook text inside the safe zone so it's always visible." },
  { title: "Use on-screen captions for silent scrollers", body: "Over half of Reels are watched with sound off. Add burned-in captions (or Instagram's auto-caption sticker) and position them inside the safe zone to boost completion rate and accessibility." },
  { title: "Post Reels natively—avoid TikTok watermarks", body: "Instagram deprioritizes videos with visible third-party logos. Export watermark-free files, then upload directly or schedule through PostPlanify for maximum reach." },
  { title: "Leverage interactive stickers in Stories", body: "Polls, quizzes, and question boxes drive taps that signal engagement to the algorithm. Place stickers above the bottom CTA bar so they remain fully tappable." },
  { title: "Batch-film, then schedule for consistency", body: "Consistency beats occasional bursts. Record 5-7 short clips in one session, drop them into PostPlanify, and auto-post at your audience's peak times." },
  { title: "Use carousel posts to boost saves and shares", body: "Carousels encourage swipes, which extend dwell time. Combine micro-tips, before-and-after photos, or step-by-step tutorials into a 5-10-frame carousel to encourage saves." },
  { title: "Write scannable captions with a bold first line", body: "Hook with a question or stat, break paragraphs with line-breaks, and end with a call-to-action. Instagram truncates after ~125 characters, so front-load the value." },
  { title: "Mix Reels with static images to stabilize reach", body: "Reels can spike reach but static posts often drive deeper discussions. A balanced content mix evens out algorithm swings and keeps your grid visually cohesive." },
  { title: "Reply to comments within the first hour", body: "Instagram rewards rapid back-and-forth. Turn on notifications (or use PostPlanify's inbox) to answer questions quickly and keep the engagement loop rolling." },
  { title: "Design for the profile grid crop too", body: "Instagram crops Reels to a 1:1 center square on your profile. Keep logos, faces, and titles in the center 1080 x 1080 area so your grid looks clean and professional. Use the Cover Preview toggle to verify before posting." },
  { title: "Export at 1080 x 1920 — never letterbox", body: "Always export in native 9:16 resolution. Letterboxed 16:9 clips (with black bars) look unprofessional and get penalized by Instagram's algorithm. If you have horizontal footage, crop to 9:16 and reframe the subject to center." },
];

const COMMON_ISSUES = [
  {
    q: "⚠️My text or captions are getting cut off in Reels",
    solutions: [
      "Keep all text at least 310 px above the bottom edge to clear the caption and action bar",
      "Use our safe zone checker to preview the exact overlay position before posting",
      "Avoid placing subtitles in the default center-bottom position — move them into the safe zone",
      "Check both the Reels feed view and the profile grid crop (1:1 center square)",
    ],
  },
  {
    q: "⚠️Instagram's UI covers my call-to-action button",
    solutions: [
      "CTAs should sit inside the central 910 x 1386 px safe zone area",
      "Avoid placing CTAs in the bottom 310 px (caption area) or right 84 px (engagement icons)",
      "Toggle Ad Mode in the checker to verify Sponsored label and CTA button placement",
      "Move CTAs to the upper-center portion of the frame for maximum visibility",
    ],
  },
  {
    q: "⚠️My uploaded image doesn't match the 9:16 aspect ratio",
    solutions: [
      "Export your content at 1080 x 1920 pixels for optimal Instagram display",
      "The checker will warn you if your aspect ratio isn't 9:16 — crop before uploading",
      "Avoid uploading 16:9 horizontal videos — Instagram adds black bars that reduce engagement",
      "Use your editing software to crop to 9:16 before checking safe zones",
    ],
  },
  {
    q: "⚠️Profile grid thumbnail cuts off important content",
    solutions: [
      "Instagram crops Reels to a 1:1 square on your profile grid",
      "Keep key visual elements (faces, logos, text) within the center 1080 x 1080 area",
      "Use the Cover Preview toggle to check how your thumbnail appears on the grid",
      "Choose a custom cover photo if the default crop hides important content",
    ],
  },
];

const FAQS = [
  { q: "What is the Instagram safe zone in 2026?", a: "The Instagram safe zone in 2026 refers to the central area of a 9:16 vertical video where important content remains fully visible without being covered by Instagram's UI elements like username, captions, engagement buttons, and stickers. For standard 1080x1920 Reels and Stories, the safe zone is approximately 910x1386 pixels." },
  { q: "What is an Instagram safe zone and why does it matter?", a: "The Instagram safe zone is the central area of a vertical 9:16 frame that remains completely visible once Instagram's on-screen UI elements—username, follow button, captions, stickers, and engagement icons—overlay your content. If important text, faces, or call-to-action buttons sit outside that zone, they can be partially hidden or cropped in the Reels feed, Stories feed, or Explore grid. Using a safe-zone checker ensures every vital element stays readable, improving watch time, tap-through rate, and overall engagement." },
  { q: "Are the safe-zone dimensions different for Reels, Stories, and in-feed previews?", a: "Yes. Reels and Stories both use a 1080 x 1920 canvas, but the overlay sizes differ slightly: Reels (vertical feed): ~210 px top bar (username + audio) and ~310 px bottom bar (caption + actions). The right-hand icon column is ~84 px wide. Stories: Smaller top UI (~140 px) and a single bottom CTA bar (~250 px if you add link stickers). Stories have no right icon bar but can show interactive stickers anywhere you place them. In-feed preview (grid): A Reel appears as a 4:5 crop in the main feed and as a 1:1 square in profile grids. Keep thumbnails and titles within the center square (1080 x 1080) so they remain intact." },
  { q: "What are the exact Instagram safe zone dimensions in pixels?", a: "For standard 1080 x 1920 Reels, the safe zone is approximately 910 x 1386 pixels centered in the frame. The top bar (username + audio) occupies ~210 px, the bottom bar (caption + action buttons) takes ~310 px, and the right-hand engagement icons are ~84 px wide. For Stories, the top UI is ~140 px and the bottom CTA bar is ~250 px. These dimensions are current as of 2026 and we update them whenever Instagram changes its interface." },
  { q: "How does the Instagram Safe Zone Checker work?", a: "Our checker runs 100% in your browser. Drop a video (MP4/MOV/WebM) or a single 1080 x 1920 frame, and the tool overlays semi-transparent masks that represent Instagram's current UI. Toggle between Reels, Stories, and Ad mode to preview each layout. Nothing gets uploaded to a server, so your media stays private." },
  { q: "What file types and sizes can I upload?", a: "You can upload MP4, MOV, or WEBM videos up to 100 MB, or PNG/JPEG images up to 10 MB for quick static checks. The tool auto-scales smaller resolutions but warns if your aspect ratio isn't 9:16." },
  { q: "Does the tool support Instagram Ads safe zones?", a: "Yes. Toggle Ad Mode to add the 'Sponsored' label and call-to-action bar, which extend the bottom overlay to ~370 px. This ensures your brand logos or discount codes aren't blocked by the CTA." },
  { q: "Will these safe-zone measurements change over time?", a: "Instagram tweaks its interface a few times per year. We monitor Meta's creator documentation and live-capture new overlay sizes whenever a change rolls out. When updates happen, the masks in the checker refresh automatically—no manual download required." },
  { q: "Can I download a screenshot with the safe-zone overlay?", a: "Absolutely. Click Download PNG and the current frame—plus translucent guides—will be saved locally. Teams often share these annotated screenshots on Slack or Notion for quick creative reviews." },
  { q: "Does using a safe-zone checker improve Reel performance?", a: "Creators who keep crucial elements inside the safe zone typically see higher completion rates, better retention curves, and more meaningful engagement (saves and shares). Clean framing avoids distracting viewers with covered-up captions or half-hidden faces, which the algorithm treats as negative feedback." },
  { q: "Is the Instagram Safe Zone Checker really free?", a: "Yes. The tool runs client-side JavaScript—no watermark, no sign-up, no API call costs. It's part of PostPlanify's free creator toolkit." },
  { q: "How do I fix text being cut off in Instagram Reels?", a: "To fix text being cut off, ensure all text elements sit inside the safe zone — at least 210 px below the top edge, 310 px above the bottom edge, and 84 px from the right side. Upload your Reel to our safe zone checker to see exactly where Instagram's UI overlaps. Then adjust your text in your editing software (CapCut, Premiere, Final Cut) before re-exporting. Burned-in captions should be positioned in the center-upper area of the frame." },
  { q: "Do I need to consider safe zones when adding on-screen captions or subtitles?", a: "Definitely. Auto-generated captions should sit inside the central 910 px width and at least 310 px above the bottom edge in Reels. Our checker shows a dashed line where caption text is safe. For Stories, place subtitles above the CTA sticker line (~250 px from the bottom)." },
  { q: "What about interactive stickers, polls, or link buttons in Stories?", a: "Stickers you place count as part of your content—they won't be hidden by Instagram's default UI. Still, avoid the top timestamp bar (~40 px) and bottom CTA bar to keep stickers tappable and legible." },
  { q: "Does the checker account for phones with notches or punch-hole cameras?", a: "Instagram automatically letterboxes video to compensate for notches. Our masks reflect the baseline UI area that appears on 99% of devices. If you want ultra-safe framing for older phones, keep text at least 150 px below the top edge." },
  { q: "Does the safe zone apply to Instagram carousel posts?", a: "Carousel posts use a different layout than Reels and Stories. In-feed carousels display at 1:1 (1080 x 1080) or 4:5 (1080 x 1350) aspect ratios with minimal UI overlay. The safe zone is less critical for carousels since there's no full-screen UI layer, but you should still keep text away from edges (at least 50 px margin) to avoid cropping on different devices. Our checker focuses on Reels and Stories where UI overlap is the biggest issue." },
  { q: "What's the difference between Reels and Stories safe zones?", a: "Both use 1080 x 1920 canvases but with different overlay sizes. Reels have a larger bottom overlay (~310 px for captions + actions) and a right-side icon column (~84 px). Stories have a smaller top bar (~140 px) and bottom CTA area (~250 px) with no right icon column. Toggle between Reels and Stories mode in our checker to compare the differences visually for your specific content." },
  { q: "Can I use the safe zone checker for Instagram Ads?", a: "Yes. Toggle Ad Mode to see Instagram's Sponsored label and call-to-action button overlay, which extends the bottom safe zone to ~370 px. This is critical for paid campaigns — if your brand logo, discount code, or CTA sits behind Instagram's CTA button, you're wasting ad spend. Always preview ad creative in Ad Mode before launching." },
  { q: "How can I align multiple clips inside safe zones when editing?", a: "Use editing software's ruler guides or import the PNG overlay you downloaded from our tool into Premiere, CapCut, or Final Cut. Layer it above your timeline, align elements, then disable or delete the overlay layer before export." },
  { q: "Can I preview how my thumbnail (cover photo) looks in the profile grid?", a: "Yes. Upload a still frame, toggle Cover Preview, and the checker displays a 1:1 square crop. Keep any text or product images centered so they remain visible on your profile." },
  { q: "Will the Instagram Safe Zone Checker integrate with PostPlanify scheduling?", a: "After you confirm placement, click Schedule in PostPlanify to pass the media file straight into the PostPlanify composer. Your safe-zone screenshot is stored in the post notes so teammates can review later." },
  { q: "How do I report a mismatch between the overlay and my Instagram app?", a: "Tap the feedback icon in the tool, attach a screenshot from your phone, and include the app version / device model. We usually validate and patch overlay changes within 48 hours." },
  { q: "Does safe-zone compliance affect Instagram's algorithm directly?", a: "Instagram hasn't publicly confirmed a direct algorithm boost, but internal studies show that clips with clear, unobstructed visuals record up to 17% higher completion rates. Since watch time and saves strongly influence ranking, safe-zone-friendly content enjoys indirect algorithm gains." },
  { q: "Can I batch-check multiple videos at once?", a: "The current version supports one video at a time for accuracy, but batch validation is on our roadmap. Sign up inside the tool to get notified when multi-file support launches." },
  { q: "What aspect ratio should I export to stay future-proof?", a: "Stick with 1080 x 1920 (or any 9:16 multiple). Even if Instagram introduces new UI tweaks, 9:16 remains the native full-screen format. Avoid letterboxed 16:9 clips—Instagram adds black bars that look outdated and reduce engagement." },
];

const OTHER_SAFE_ZONES = [
  {
    title: "TikTok Safe Zone Checker",
    body: "Preview TikTok's UI overlays and ad CTA placement in seconds",
    href: "/tools/tiktok-safe-zone-checker",
    color: "from-zinc-700 to-zinc-900",
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
    title: "Scheduler Comparisons & Reviews",
    links: [
      { label: "Best Later Alternatives for Instagram in 2026", href: "/alternative-to-later" },
      { label: "Buffer vs Later: Which is Better for Instagram?", href: "/compare/buffer-vs-later" },
      { label: "Later Pricing: Is It Worth the Cost in 2026?", href: "/later-pricing" },
      { label: "Best Planable Alternatives for Instagram", href: "/alternative-to-planable" },
      { label: "Metricool vs Publer: Full Feature Comparison", href: "/compare/metricool-vs-publer" },
      { label: "Metricool Pricing Breakdown 2026", href: "/metricool-pricing" },
      { label: "Best Later Alternatives: Full 2026 Guide", href: "/blog/best-later-alternatives" },
      { label: "Best Metricool Alternatives Compared", href: "/blog/best-metricool-alternatives" },
    ],
  },
  {
    title: "Industries & Solutions",
    links: [
      { label: "Social Media for Content Creators", href: "/social-media-management-for-creators" },
      { label: "Social Media for Influencers", href: "/social-media-management-for-influencers" },
      { label: "Social Media Scheduler for Photographers", href: "/social-media-scheduler-for-photographers" },
      { label: "Social Media Scheduler for Fashion Brands", href: "/social-media-scheduler-for-fashion-brands" },
      { label: "Social Media Scheduler for Cafes & Coffee Shops", href: "/social-media-scheduler-for-cafes-coffee-shops" },
      { label: "Social Media for Small Businesses", href: "/social-media-management-for-small-businesses" },
    ],
  },
  {
    title: "Free Tools",
    links: [
      { label: "Instagram Caption Generator", href: "/tools/instagram-caption-generator" },
      { label: "Instagram Bio Generator", href: "/tools/instagram-bio-generator" },
      { label: "Instagram Username Generator", href: "/tools/instagram-username-generator" },
      { label: "Instagram Engagement Calculator", href: "/tools/instagram-engagement-calculator" },
      { label: "Instagram Line Break Generator", href: "/tools/instagram-line-break-generator" },
      { label: "Instagram Grid Maker & Image Splitter", href: "/tools/instagram-grid-maker" },
      { label: "Instagram Carousel Splitter", href: "/tools/instagram-carousel-splitter" },
      { label: "Instagram Image Resizer", href: "/tools/instagram-image-resizer" },
      { label: "Instagram Hashtag Generator", href: "/tools/instagram-hashtag-generator" },
      { label: "Instagram Handle Checker", href: "/tools/instagram-handle-checker" },
      { label: "Instagram Feed Planner", href: "/tools/instagram-feed-planner" },
    ],
  },
];

const ARTICLES = [
  { title: "How to Schedule Instagram Posts in 2026", href: "/blog/how-to-schedule-instagram-posts-in-2025" },
  { title: "How to Schedule Instagram Reels", href: "/blog/how-to-schedule-instagram-reels" },
  { title: "How to Schedule Instagram Stories", href: "/blog/how-to-schedule-instagram-stories" },
  { title: "How to Schedule Anything on Instagram", href: "/blog/how-to-schedule-anything-on-instagram" },
  { title: "How to Schedule Carousel Posts on Instagram and Facebook", href: "/blog/how-to-schedule-carousel-posts-on-instagram-and-facebook" },
  { title: "Instagram Post Scheduler Tools 2026", href: "/blog/instagram-post-scheduler-tools-2025" },
  { title: "The Ultimate Guide to Scheduling Instagram Posts", href: "/blog/the-ultimate-guide-to-scheduling-instagram-posts" },
  { title: "Instagram Post Scheduler vs Planner", href: "/blog/instagram-post-scheduler-vs-planner" },
  { title: "Instagram Scheduled Posts Not Working", href: "/blog/instagram-scheduled-posts-not-working" },
  { title: "How to See Scheduled Posts on Instagram", href: "/blog/how-to-see-scheduled-posts-on-instagram" },
  { title: "How to Grow Instagram Followers Organically", href: "/blog/how-to-grow-instagram-followers-organically" },
  { title: "How to Improve Social Media Engagement", href: "/blog/how-to-improve-social-media-engagement" },
  { title: "How to Post Multiple Photos on Instagram", href: "/blog/how-to-post-multiple-photos-on-instagram" },
  { title: "How to Put Spaces in Instagram Caption", href: "/blog/how-to-put-spaces-in-instagram-caption" },
  { title: "How to Pin on Instagram Story", href: "/blog/how-to-pin-on-instagram-story" },
  { title: "How Many Hashtags Should You Use on Instagram?", href: "/blog/how-many-hashtags-in-instagram" },
  { title: "Holiday Captions for Instagram", href: "/blog/holiday-captions-for-instagram" },
  { title: "Scheduling Instagram Reels vs TikTok Videos", href: "/blog/scheduling-instagram-reels-vs-tiktok-videos" },
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

function InstagramHeroIcon() {
  return (
    <svg
      role="img"
      aria-label="Instagram"
      viewBox="0 0 24 24"
      width="48"
      height="48"
      className="mx-auto"
    >
      <defs>
        <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="50%" stopColor="#fa7e1e" />
          <stop offset="100%" stopColor="#d62976" />
        </linearGradient>
      </defs>
      <path
        fill="url(#ig-gradient)"
        d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.2-.1 1.6-.1 4.8-.1zm0-2.2C8.7 0 8.3 0 7.1.1 5.8.1 5 .3 4.2.6c-.8.3-1.5.7-2.2 1.4C1.3 2.7.9 3.4.6 4.2.3 5 .1 5.8.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c0 1.3.2 2.1.5 2.9.3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.6.5 2.9.5 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c1.3-.1 2.1-.2 2.9-.5.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.5-1.6.5-2.9.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c0-1.3-.2-2.1-.5-2.9-.3-.8-.7-1.5-1.4-2.2C21.3 1.3 20.6.9 19.8.6 19 .3 18.2.1 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"
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
      <h3 className="font-semibold text-lg mb-2">Upload Instagram Content</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Drop a video (MP4, MOV, WEBM) or image (PNG, JPEG) up to 100MB
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
              Schedule Instagram Posts While You Sleep
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Plan your feed in advance. Stay consistent without opening the app daily.
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

export function InstagramSafeZoneCheckerClient() {
  return (
    <>
      <Header />
      <main>
        {/* Hero + Upload Widget + Promo */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <InstagramHeroIcon />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">
                Instagram Safe Zone Checker
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Avoid UI overlap on your Instagram videos with our free Instagram safe zone checker. Upload your video or thumbnail to see platform overlays and ensure your content is always perfectly placed.
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
                Three quick steps to preview Instagram&apos;s UI overlay and export a placement guide.
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
                See how creators, agencies, and brands use the Instagram safe zone checker every day.
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

        {/* Dimensions Reference (Reels vs Stories) */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
              Instagram Safe Zone Dimensions in 2026: Reels vs Stories
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground">
              <p>
                Instagram Reels and Stories both use a 1080 × 1920 pixel canvas (9:16 aspect ratio), but their safe zones are different because each format has different UI overlay sizes.
              </p>

              <h3 className="text-foreground font-semibold mt-6 mb-2">Instagram Reels Safe Zone</h3>
              <ul>
                <li>Safe zone: approximately <strong>910 × 1386 pixels</strong> centered</li>
                <li>Top margin: ~210px (username, follow button, audio attribution)</li>
                <li>Bottom margin: ~310px (caption bar, action buttons, audio track)</li>
                <li>Right margin: ~84px (like, comment, share, save icon column)</li>
                <li>For Ads: bottom margin increases to ~370px (Sponsored label + CTA button)</li>
              </ul>

              <h3 className="text-foreground font-semibold mt-6 mb-2">Instagram Stories Safe Zone</h3>
              <ul>
                <li>Safe zone: approximately <strong>1080 × 1620 pixels</strong></li>
                <li>Top margin: ~140px (profile bar, timestamp, close button)</li>
                <li>Bottom margin: ~250px (reply bar, share button, CTA stickers)</li>
                <li>No right icon column — Stories have more horizontal breathing room than Reels</li>
              </ul>

              <p className="mt-4">
                The key difference: Reels have a tighter safe zone because of the right-side engagement icons and larger caption bar. Stories have more usable space but you need to account for interactive stickers you place yourself.
              </p>
            </div>
          </Container>
        </section>

        {/* Why Safe Zones Matter */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
              Why Instagram Safe Zones Directly Affect Your Content Performance
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground">
              <p>
                Safe zone compliance isn&apos;t just about aesthetics — it directly impacts the metrics Instagram&apos;s algorithm uses to rank your content.
              </p>
              <ul>
                <li><strong>Watch time drops when text is hidden.</strong> If your hook text or subtitles are covered by the caption bar, viewers can&apos;t follow along — they swipe away. The Instagram Reels algorithm uses watch time as its #1 ranking signal.</li>
                <li><strong>Hidden CTAs waste your reach.</strong> A &ldquo;Save this post&rdquo; overlay that sits behind the engagement icons is invisible to your audience. Proper safe zone placement can double your save rate.</li>
                <li><strong>Ad creative with covered branding wastes budget.</strong> Instagram Ads add a Sponsored label and CTA button that extend the bottom overlay to ~370px. If your logo or offer is hidden, your ad spend generates impressions but not conversions.</li>
                <li><strong>Profile grid cropping affects first impressions.</strong> Instagram crops Reels to a 1:1 center square on your profile grid. If your Reel&apos;s key visual is off-center, your grid looks messy to profile visitors deciding whether to follow.</li>
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
                Practical Instagram advice from creators who post every day and test what works.
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
                The Instagram Safe Zone Checker runs in any modern browser — desktop and mobile.
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
                Everything you need to know about Instagram safe zones, dimensions, and best practices.
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
                        <path d={tool.title.includes("TikTok") ? "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" : "M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"} />
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
                Explore our free tools and helpful articles to maximize your social media strategy
              </p>
            </div>

            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground">
                Check out our{" "}
                <Link href="/instagram-scheduler" className="text-blue-600 underline font-medium">
                  Instagram Scheduler
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
