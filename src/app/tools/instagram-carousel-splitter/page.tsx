import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Layers,
  Check,
  ChevronDown,
  Sparkles,
  ImageIcon,
  Shield,
  Upload,
  CheckCircle2,
  Lock,
  Eye,
  Globe,
  Smartphone,
  Lightbulb,
  HelpCircle,
  ArrowRight,
  Star,
  Camera,
  Briefcase,
  Plane,
  Megaphone,
  Palette,
  Building2,
  Wrench,
} from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";
import { Card } from "@/components/ui/card";
import { CarouselSplitter } from "@/components/tools/carousel/CarouselSplitter";

export const metadata: Metadata = {
  title: "Instagram Carousel Splitter — Free Online Tool | PostPlanify",
  description:
    "Split any image into perfectly sized Instagram carousel slides (1080×1350, 1080×1080, or 1080×608). 100% free, runs in your browser, no signup.",
  openGraph: {
    title: "Instagram Carousel Splitter — Free Online Tool | PostPlanify",
    description:
      "Split any image into perfectly sized Instagram carousel slides. 100% free, runs in your browser, no signup.",
    images: ["/seo/postplanify-og-image.png"],
  },
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const HOW_IT_WORKS = [
  {
    title: "Upload your image",
    body: "Drop or pick any JPG, PNG, WebP, or GIF. We accept any aspect ratio — square, portrait, landscape, panoramic — your image becomes the source for the carousel.",
  },
  {
    title: "Pick how many slides",
    body: "Choose 2–10 slides using the slider or quick-set buttons (3, 5, 7, 10). The tool automatically computes the best grid layout to fit your image.",
  },
  {
    title: "Download individual tiles",
    body: "Preview every tile in-app, click any tile to download it as a 1080px PNG, or grab the whole set with one click. No watermarks, no signup, no limits.",
  },
];

const SLIDE_GUIDE = [
  { count: 2, layout: "1×2 / 2×1", size: "1080×540 each", use: "Side-by-side comparison, before/after" },
  { count: 3, layout: "1×3 / 3×1", size: "1080×360 each", use: "Quick storytelling, three takeaways" },
  { count: 4, layout: "2×2 grid", size: "540×540 each", use: "Product features, photo dump" },
  { count: 5, layout: "Custom fit", size: "Varies", use: "Most popular — step-by-step tutorial" },
  { count: 6, layout: "2×3 / 3×2", size: "540×360 each", use: "Listicles, mini-portfolio" },
  { count: 7, layout: "Custom fit", size: "Varies", use: "Long-form carousel, week recap" },
  { count: 8, layout: "2×4 / 4×2", size: "270×540 each", use: "Storyboard, swipeable gallery" },
  { count: 9, layout: "3×3 grid", size: "360×360 each", use: "Instagram-grid preview, gallery" },
  { count: 10, layout: "Custom fit", size: "Varies", use: "Maximum length — deep dives" },
];

const USE_CASES = [
  { Icon: Camera, title: "Personal Branding", body: "Turn a single portrait or quote into a multi-slide story that stops the scroll.", color: "bg-rose-100 text-rose-600" },
  { Icon: Briefcase, title: "Business & Marketing", body: "Repurpose one hero image into a campaign-ready carousel without leaving your browser.", color: "bg-blue-100 text-blue-600" },
  { Icon: Palette, title: "Landscape Photography", body: "Slice a panoramic landscape into a swipeable gallery that fits the 4:5 portrait frame.", color: "bg-emerald-100 text-emerald-600" },
  { Icon: Plane, title: "Travel Diaries", body: "Build a trip recap by splitting one wide travel shot into a 5-slide story.", color: "bg-amber-100 text-amber-600" },
  { Icon: ImageIcon, title: "Photography Portfolios", body: "Show 4–9 variations of a single shot in a clean grid — perfect for IG-grid previews.", color: "bg-violet-100 text-violet-600" },
  { Icon: Megaphone, title: "Marketing Teams", body: "Turn one design into a campaign swipe without opening Photoshop or paying for Figma.", color: "bg-cyan-100 text-cyan-600" },
];

const ENGAGEMENT_TIPS = [
  { title: "Hook in slide one", body: "Lead with a bold visual or a curiosity-driving question — 80% of drop-off happens before slide two." },
  { title: "Design for thumbs", body: "Use high-contrast colors, oversized headlines, and one focal point per slide. The grid preview is only 240px wide on mobile." },
  { title: "Alternate layout rhythm", body: "Don't repeat the same template on every slide — vary between text-heavy, image-led, and quote slides to keep swipers moving." },
  { title: "End with a CTA", body: "The last slide is your conversion moment — save, share, comment, link in bio. Make it unmissable." },
  { title: "Write a caption that teases", body: "Reference slide numbers (\"swipe for tip 3\") and use the first 125 characters to earn the tap on \"more\"." },
  { title: "Re-post winners as Reels", body: "Top-performing carousels make great talking-head Reels. Save the export and re-cut it." },
];

const PRO_TIPS = [
  "Use a 4:5 portrait aspect for the highest engagement rate — Instagram gives portrait posts more screen real estate than square.",
  "Keep text on the safe zone — leave at least 100px of margin on every edge so UI overlays don't cover your headlines.",
  "Export at 1080×1350 (4:5) for portrait, 1080×1080 for square, or 1080×608 for landscape — never above 1440px on the long edge.",
  "Stick to 5–7 slides for maximum completion rate — Instagram's algorithm rewards completion more than raw slide count.",
  "Save the source file before splitting — you can re-export the same source at any aspect ratio or slide count.",
  "Use a consistent color palette across all slides so the carousel reads as one piece in the grid view.",
  "Number your slides (\"1/7\", \"2/7\", …) — it sets a clear expectation and boosts completion.",
  "Use the first slide as a hook slide, not a cover — same image, but with a different crop or overlay.",
  "Compress with the IG-safe quality (PNG for sharp graphics, JPG at 85% for photos) before uploading to avoid pixelation.",
  "Don't over-stuff. If a slide has more than 25 words, split it into two slides.",
  "Pin the strongest slide as the cover — Instagram shows a single cover image in the grid view.",
  "After posting, watch the drop-off in Insights — if slide 3 has a 50% drop, your hook or pacing is off.",
];

const COMMON_ISSUES = [
  {
    q: "My tiles are blurry after upload.",
    a: "Instagram recompresses everything you upload. To stay sharp, export each tile at 1080px on the long edge as PNG (for graphics) or JPG at 85% (for photos), and never above 1440px on the long edge — IG will downscale it anyway and pixelation creeps in.",
  },
  {
    q: "Cropped text on the edges of my slides.",
    a: "Leave at least a 100px safe-zone margin on every edge. Instagram adds the username, caption, and action buttons on top of your image — anything in those zones will be covered, especially on mobile.",
  },
  {
    q: "The grid layout looks weird on my image.",
    a: "The tool picks a rows×cols layout that best matches your source aspect ratio. For a 16:9 panorama into 5 tiles, you'll get 1 row × 5 columns; for a square image into 5 tiles, you'll get 2 rows × 3 columns. Pick a different slide count if the layout doesn't suit your image.",
  },
  {
    q: "Why is my portrait image getting weird crop boxes?",
    a: "We crop each tile to the chosen aspect ratio (1:1, 4:5, or 16:9) so every tile is exactly Instagram-spec. If your source image is 9:16 and you pick 1:1 tiles, the top and bottom of the image won't appear in any tile. Try 4:5 to keep more of the original frame.",
  },
  {
    q: "I uploaded a GIF — does it stay animated?",
    a: "Static frames only. We decode the first frame of any GIF and export it as PNG. For animated carousels, use PostPlanify's video scheduler and upload an MP4 instead — Instagram supports video in carousel posts.",
  },
  {
    q: "The download is missing one or two tiles.",
    a: "Browsers throttle rapid downloads. Click \"Download all tiles\" once and wait — your browser will save them in sequence over a few seconds. If your browser blocks multiple downloads, accept the prompt at the top of the window.",
  },
  {
    q: "The tile order is wrong on my phone.",
    a: "Tiles are numbered 01–10 in the order you swiped them in the source grid. If you numbered your source image left-to-right, top-to-bottom, the tiles will land in the right Instagram order automatically.",
  },
  {
    q: "Instagram rejected one of my tiles as \"unsupported format\".",
    a: "We've exported every tile as PNG, which Instagram accepts. If you got an error, double-check that the file extension is .png (not .webp or .gif) and that the file is under 8 MB. PostPlanify keeps everything under 2 MB per tile.",
  },
  {
    q: "Can I edit individual tiles after downloading?",
    a: "Yes — the PNG output is lossless and editable in any design tool (Canva, Photoshop, Figma, Affinity). Import the tile, make your change, re-export at 1080px, and re-upload to IG.",
  },
];

const BROWSERS = [
  { Icon: Globe, name: "Chrome 90+", note: "Best experience — full canvas + drag/drop" },
  { Icon: Globe, name: "Firefox 88+", note: "Full support, including file drag/drop" },
  { Icon: Globe, name: "Safari 14+", note: "Full support, iOS 14 and above" },
  { Icon: Globe, name: "Edge 90+", note: "Chromium-based — works exactly like Chrome" },
  { Icon: Globe, name: "Opera 76+", note: "Full canvas support" },
  { Icon: Smartphone, name: "Mobile browsers", note: "iOS Safari, Chrome Android, Samsung Internet" },
];

const PRIVACY = [
  {
    Icon: Lock,
    title: "100% client-side",
    body: "Your image never leaves your device. Slicing happens in your browser using the HTML5 Canvas API — we have no server-side processing pipeline for this tool.",
  },
  {
    Icon: Eye,
    title: "Nothing is uploaded",
    body: "There is no upload, no cloud storage, no database write. We can't see your image, we can't train models on it, and we don't share it with third parties.",
  },
  {
    Icon: Shield,
    title: "No tracking pixels",
    body: "We don't drop cookies or analytics on this page. The only network call is the static page load — once you're in, your image stays local.",
  },
];

const FAQS = [
  {
    q: "What is an Instagram carousel splitter?",
    a: "An Instagram carousel splitter is a tool that takes one image and slices it into multiple square, portrait, or landscape tiles sized for an Instagram carousel post. Each tile becomes one slide in your carousel, so swiping left on Instagram reveals the next piece of your original image. This lets you post long-form, panoramic, or wide images that wouldn't otherwise fit Instagram's 1:1, 4:5, or 16:9 frame.",
  },
  {
    q: "How does this Instagram carousel splitter work?",
    a: "Upload any image (JPG, PNG, WebP, or GIF), choose how many slides you want (2–10), and pick an aspect ratio (1:1 square, 4:5 portrait, or 16:9 landscape). The tool computes the best rows×cols grid layout for your image, crops each tile to your chosen aspect ratio at 1080px on the long edge, and lets you download each tile as a PNG. You can grab them individually or all at once.",
  },
  {
    q: "Is the Instagram Carousel Splitter really free?",
    a: "Yes — 100% free, no signup, no email gate, no credit card. The tool runs entirely in your browser, so we have no infrastructure costs to recoup. PostPlanify also offers a full social media management platform (paid, with a 7-day free trial), but this splitter is and will remain free forever.",
  },
  {
    q: "What image formats are supported?",
    a: "JPG, PNG, WebP, and GIF (we take the first frame of any animated GIF and export it as a still PNG). HEIC and RAW formats are not supported — convert those to JPG first using your phone's built-in converter or any free tool.",
  },
  {
    q: "What's the best aspect ratio for Instagram carousels in 2026?",
    a: "4:5 portrait (1080×1350) is the highest-engagement aspect ratio on Instagram right now — it takes up the most screen real estate on mobile feeds and gets ~17% more reach than square posts in most niches. Square (1:1, 1080×1080) is still the safe default, especially for grid consistency. Landscape (16:9, 1080×608) is best for photo dumps and panoramic storytelling but gets less feed space.",
  },
  {
    q: "How many slides should I use?",
    a: "5–7 slides is the sweet spot for most carousels in 2026. Instagram's algorithm rewards carousel completion, so the longer your audience stays swiping, the more reach you get — but only if every slide earns the next swipe. Going past 10 isn't possible (Instagram caps carousel posts at 10 slides), and dropping below 3 usually isn't enough to tell a story.",
  },
  {
    q: "Can I use this for panoramic photos?",
    a: "Absolutely — that's exactly what it's built for. Upload a 21:9 or 3:1 panorama, set 4–5 slides at 4:5 portrait, and the tool will slice your panorama into a swipeable vertical scroll. This is the trick that every landscape photographer uses to post ultra-wide shots on a portrait-first platform.",
  },
  {
    q: "Will my image quality degrade after splitting?",
    a: "No — we slice at full resolution (1080px on the long edge per tile) and export lossless PNG. The only quality loss happens when Instagram re-compresses your upload, which it does for everything you post. To minimize that loss, export as PNG for graphics and JPG at 85% for photos, and never exceed 1440px on the long edge.",
  },
  {
    q: "Do you store my image on a server?",
    a: "No. Your image never leaves your device. All slicing happens locally in your browser using the HTML5 Canvas API. We have no server-side pipeline for this tool, we don't write the image to any database, and we don't have any way to see what you uploaded.",
  },
  {
    q: "Can I split an animated GIF?",
    a: "Static frames only. We decode the first frame of any GIF and export it as PNG. For animated Instagram carousels, upload an MP4 video instead — Instagram supports video in carousel posts, and PostPlanify's scheduler handles video uploads natively.",
  },
  {
    q: "Will the tiles fit Instagram's grid view?",
    a: "If you pick 9 tiles and the 1:1 aspect ratio, yes — the resulting 3×3 grid will preview as one cohesive image in your profile grid. For other tile counts, only the cover image shows in the grid (the rest are revealed on swipe), so design your first tile to be a strong standalone cover.",
  },
  {
    q: "How do I post a carousel on Instagram?",
    a: "Open Instagram, tap the + to create a new post, select \"Post\" then \"Select multiple\", pick all your downloaded tiles in order (slide 1 first, slide 10 last), tap Next twice, add your caption and hashtags, and share. On desktop, the flow is the same — drag tiles in order, then publish.",
  },
  {
    q: "Can I edit individual tiles after downloading?",
    a: "Yes — the PNG output is lossless and editable in any design tool (Canva, Photoshop, Figma, Affinity). Import the tile, make your change, re-export at 1080px, and re-upload to Instagram.",
  },
  {
    q: "Does this work on mobile?",
    a: "Yes — the tool is fully responsive and works on iOS Safari, Android Chrome, and Samsung Internet. The drag-and-drop upload is replaced by a tap-to-pick on touch devices, but everything else (splitting, previewing, downloading) works the same.",
  },
  {
    q: "Can I split a TikTok or Pinterest image?",
    a: "Yes — the same splitter works for any platform that accepts multi-image posts. For TikTok, use 1:1 square tiles (TikTok crops everything to 9:16 anyway). For Pinterest, use 2:3 (1000×1500) by selecting 1:1 aspect ratio and cropping manually after download — or use PostPlanify's Pinterest Image Resizer for native 2:3 output.",
  },
  {
    q: "How big can my source image be?",
    a: "Up to 20 MB and up to 12,000px on the long edge. Anything bigger will be rejected by your browser before it hits the canvas. For most use cases, a 4000×6000 source image is more than enough — Instagram caps uploads at 1440px on the long edge.",
  },
  {
    q: "What's the difference between a carousel splitter and a grid maker?",
    a: "A grid maker (like our Instagram Grid Maker) lets you plan how multiple separate posts will look together in your profile grid. A carousel splitter takes one image and slices it into the multiple slides of a single carousel post. They solve different problems — use the grid maker when you have 9 separate images and want them to look cohesive, and the carousel splitter when you have one wide image you want to make swipeable.",
  },
  {
    q: "Can I split a vertical 9:16 image into portrait carousel tiles?",
    a: "Yes — pick 2:3 or 4:5 aspect ratio and 2–4 slides. The tool will crop your vertical image into horizontal strips that fit Instagram's portrait frame. This is a great way to post tall infographics or story-style content as a carousel.",
  },
  {
    q: "Why are some tiles smaller than others in the preview?",
    a: "The tool preserves the source aspect ratio by trimming each tile to the chosen output aspect ratio. Tiles that come from the source's \"edges\" (the rows/cols closest to the source's natural bounds) will appear with the most image content; tiles from the \"interior\" of the grid will be tighter crops. This is by design — it keeps every tile at exactly 1080px on the long edge, which is Instagram's recommendation.",
  },
  {
    q: "How do I number my slides for Instagram?",
    a: "Add small \"01/07\", \"02/07\", … \"07/07\" labels in the corner of each slide before uploading. This sets a clear expectation of length and boosts completion rate. Use a consistent position (e.g., bottom-right) and a low-contrast color so the number doesn't distract from the slide content.",
  },
  {
    q: "Can I add text overlays after splitting?",
    a: "Yes — open the PNGs in Canva, Photoshop, or any design tool, add your text, and re-export at 1080px. For bulk editing, use Canva's bulk-create or PostPlanify's image editor (paid feature) to apply the same template to all 10 tiles at once.",
  },
  {
    q: "Do I need a PostPlanify account to use this?",
    a: "No — this tool is free with no account required. If you want to schedule the resulting carousel (or any other post) directly from PostPlanify, you can sign up for a 7-day free trial at /signup. No credit card needed.",
  },
  {
    q: "What if my image has transparency (PNG)?",
    a: "We fill any transparent areas with white before exporting, so every tile ends up as a fully-opaque PNG. If you want to preserve transparency, use a different tool — Instagram doesn't support transparent images anyway.",
  },
  {
    q: "Can I use this for LinkedIn carousels?",
    a: "Yes — LinkedIn carousel posts accept the same 1:1 square format (1080×1080) as Instagram. Pick the 1:1 aspect ratio, download your tiles, and upload them as a LinkedIn document post. LinkedIn's algorithm actually rewards PDF-style carousel posts heavily.",
  },
  {
    q: "Is there a desktop app I can install?",
    a: "Not yet — the tool is browser-only. You can install it as a Progressive Web App on Chrome (click the install icon in the address bar) for one-click access from your desktop. Offline support is on the roadmap.",
  },
  {
    q: "How does this compare to Photoshop or Figma?",
    a: "Photoshop and Figma are general-purpose design tools — they can split an image into a grid, but you have to set up the canvas, the guides, and the export manually for every aspect ratio. This splitter is purpose-built for Instagram, runs in your browser, and exports at the exact specs Instagram wants. Use Photoshop/Figma for the design, this tool for the final export.",
  },
  {
    q: "Will my image upload be slow on a big file?",
    a: "For files under 5 MB, processing is near-instant. For files over 10 MB, expect 1–3 seconds for the canvas to slice and export every tile. We render each tile at 1080px (not the source resolution) to keep memory use reasonable on phones and older laptops.",
  },
  {
    q: "Can I split a screenshot of a long article?",
    a: "Yes — upload the screenshot, pick 4–7 portrait (4:5) tiles, and the tool will slice the article into swipeable slides. Add a hook on slide 1 (\"5 lessons from this article\") and a CTA on the last slide (\"read the full piece, link in bio\") for the best engagement.",
  },
  {
    q: "Does this work for TikTok photo carousels?",
    a: "Yes — TikTok photo mode accepts multi-image posts in 1:1 or 4:5. Pick 1:1 for the cleanest fit, upload your tiles in order, and post as a TikTok photo carousel. TikTok currently caps photo carousels at 35 images, so 10 tiles is well within the limit.",
  },
  {
    q: "Can I re-split the same image at a different aspect ratio?",
    a: "Yes — change the aspect ratio or slide count after upload and the previews re-render in real time. The source image stays loaded, so you can iterate on layouts without re-uploading.",
  },
  {
    q: "Why is the cover slide so important?",
    a: "Instagram shows only the first slide in your grid preview and in the feed thumbnail. The cover slide determines whether someone taps your post — design it as a strong standalone image with a clear hook. The other slides are revealed on swipe, so they can build on the cover without needing to stand alone.",
  },
  {
    q: "Can I batch-split multiple images at once?",
    a: "Not yet — this tool processes one image per session. For bulk workflows, drop your images into PostPlanify's bulk editor (paid) which handles up to 50 images per batch with the same aspect-ratio and slide-count rules.",
  },
  {
    q: "What if my image has a face or text in an awkward spot after splitting?",
    a: "Move or re-compose the source image before re-uploading — the tool can't intelligently reposition content. If you want pixel-perfect control, use Photoshop or Figma to reposition the source, then re-upload and re-split. The whole loop takes about 30 seconds.",
  },
];

const RELATED_RESOURCES = [
  {
    title: "Scheduler Comparisons",
    items: [
      { label: "PostPlanify vs Buffer", href: "/alternative-to-buffer" },
      { label: "PostPlanify vs Hootsuite", href: "/alternative-to-hootsuite" },
      { label: "PostPlanify vs Later", href: "/alternative-to-later" },
      { label: "PostPlanify vs Sprout Social", href: "/alternative-to-sprout-social" },
      { label: "PostPlanify vs SocialPilot", href: "/alternative-to-socialpilot" },
      { label: "PostPlanify vs Agorapulse", href: "/alternative-to-agorapulse" },
      { label: "PostPlanify vs Sendible", href: "/alternative-to-sendible" },
      { label: "PostPlanify vs Publer", href: "/alternative-to-publer" },
      { label: "PostPlanify vs Vista Social", href: "/alternative-to-vista-social" },
    ],
  },
  {
    title: "Industries",
    items: [
      { label: "Agencies", href: "/industries/agencies" },
      { label: "Restaurants", href: "/industries/restaurants" },
      { label: "Real Estate", href: "/industries/real-estate" },
      { label: "E-commerce", href: "/industries/ecommerce" },
      { label: "Coaches and Creators", href: "/industries/coaches" },
      { label: "SaaS", href: "/industries/saas" },
      { label: "Local Businesses", href: "/industries/local-business" },
      { label: "Nonprofits", href: "/industries/nonprofits" },
    ],
  },
  {
    title: "Free Tools",
    items: [
      { label: "Instagram Engagement Calculator", href: "/tools/instagram-engagement-calculator" },
      { label: "Instagram Grid Maker", href: "/tools/instagram-grid-maker" },
      { label: "TikTok Engagement Calculator", href: "/tools/tiktok-engagement-calculator" },
      { label: "YouTube Engagement Calculator", href: "/tools/youtube-engagement-calculator" },
      { label: "LinkedIn Engagement Calculator", href: "/tools/linkedin-engagement-calculator" },
      { label: "Instagram Safe Zone Checker", href: "/tools/instagram-safe-zone-checker" },
      { label: "TikTok Safe Zone Checker", href: "/tools/tiktok-safe-zone-checker" },
      { label: "UTM Generator", href: "/tools/utm-generator" },
      { label: "Instagram Caption Generator", href: "/tools/instagram-caption-generator" },
    ],
  },
  {
    title: "Articles",
    items: [
      { label: "Best Time to Post on Instagram in 2026", href: "/blog/best-time-to-post-instagram" },
      { label: "How Often to Post on Instagram", href: "/blog/how-often-post-instagram" },
      { label: "10 Instagram Reels Ideas for 2026", href: "/blog/instagram-reels-ideas" },
      { label: "Instagram Algorithm 2026 Explained", href: "/blog/instagram-algorithm" },
      { label: "Social Media KPIs That Matter", href: "/blog/social-media-kpis" },
      { label: "Best Link in Bio Tools Compared", href: "/blog/link-in-bio-tools" },
      { label: "How to Schedule Instagram Posts", href: "/blog/schedule-instagram-posts" },
      { label: "Instagram Carousel Examples That Convert", href: "/blog/instagram-carousel-examples" },
    ],
  },
];

const TESTIMONIALS = [
  { name: "Andreas Luisa", company: "arcdigital.ro", metric: "14 Clients, 35 Social Accounts", quote: "PostPlanify has been a game-changer. The team listens to feedback and ships features fast." },
  { name: "Eric Bai", role: "Founder & CEO", company: "shopmeagent.com", metric: "10 Social Accounts, 2 Countries", quote: "We manage social across China and the US from a single dashboard." },
  { name: "Umut Yorulmaz", company: "udydigital.com", metric: "17 Social Accounts, 2 Brands", quote: "The team ships feature requests within 24 hours. We're scheduling 95 posts per day across 17 accounts." },
  { name: "Frank Benton", company: "elevatecom.com.au", metric: "8 Clients, 22 Social Accounts", quote: "The free tools alone (carousel splitter, grid maker) saved us hours every week." },
  { name: "Sam Cranq", company: "craftix.io", metric: "5 Brands, 12 Social Accounts", quote: "Cleanest scheduler I've used. The bulk composer + carousel splitter combo is unbeatable." },
  { name: "Aleksandr Heinlaid", company: "ferociti.net", metric: "Solo creator, 4 Platforms", quote: "I went from spending 6 hours a week on social to under 2. The grid maker is a hidden gem." },
  { name: "Shaheer", company: "getnorms.com", metric: "3 Brands, 9 Accounts", quote: "I split a 21:9 panorama into 5 portrait tiles in 30 seconds. Used to take me 20 minutes in Photoshop." },
  { name: "Monta", company: "globtechllc.com", metric: "Agency, 28 Accounts", quote: "The carousel splitter is exactly the kind of tool I'd build myself. Free forever is wild." },
  { name: "Oguz Doruk", company: "acarograf.com", metric: "Personal brand, 3 Platforms", quote: "Finally a free tool that actually exports at the right resolution. No watermarks, no signup." },
  { name: "Hasan Cagli", role: "Founder", company: "PostPlanify", metric: "2150+ businesses", quote: "We built this because we needed it ourselves. Hope it saves you as much time as it saves us." },
];

const PLATFORMS = [
  { label: "Instagram", href: "/instagram-scheduler" },
  { label: "TikTok", href: "/tiktok-scheduler" },
  { label: "LinkedIn", href: "/linkedin-scheduler" },
  { label: "X (Twitter)", href: "/x-scheduler" },
  { label: "Facebook", href: "/facebook-scheduler" },
  { label: "YouTube", href: "/youtube-scheduler" },
  { label: "Threads", href: "/threads-scheduler" },
  { label: "Pinterest", href: "/pinterest-scheduler" },
  { label: "Bluesky", href: "/bluesky-scheduler" },
  { label: "Google Business", href: "/google-business-scheduler" },
];

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

export default function InstagramCarouselSplitterPage() {
  return (
    <>
      <Header />

      <main>
        {/* ============================================================
            HERO — Live layout: centered Instagram icon + title +
            subtitle, then 2-col grid: [upload box | promo card]
        ============================================================ */}
        <section className="py-8">
          <Container>
            <div className="flex flex-col items-center gap-4">
              <svg
                aria-label="Instagram"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-red-500 mb-4"
                style={{ width: 56, height: 56 }}
              >
                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
              </svg>
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Instagram Carousel Splitter
                </h1>
                <p className="text-lg max-w-2xl mx-auto">
                  Split wide images into swipeable Instagram carousels. Upload panoramas
                  or landscapes and download 2-10 perfectly sized slides instantly.
                </p>
              </div>

              <div className="w-full max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6 items-start">
                  <div className="rounded-xl border bg-card text-card-foreground shadow w-full">
                    <div className="p-6 space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors">
                        <Upload
                          className="mx-auto mb-3 text-gray-400"
                          style={{ width: 48, height: 48 }}
                          strokeWidth={1.5}
                        />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Click to upload an image
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                        <input type="file" accept="image/*" className="hidden" />
                      </div>
                    </div>
                  </div>

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
                            Manage All Your Social Accounts Without the Chaos
                          </p>
                          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                            Schedule posts, track performance, and collaborate with your team.
                          </p>
                        </div>

                        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-2 my-4">
                          {[
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
                          ].map(({ label, color, d }) => (
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
                            {[
                              "https://postplanify.com/_next/image?url=%2Ftestimonials%2Ffrank-benton.jpg&w=64&q=75",
                              "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fmonta.jpg&w=64&q=75",
                              "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faprovaleges.jpg&w=64&q=75",
                              "https://postplanify.com/_next/image?url=%2Ftestimonials%2Fshaheer.jpg&w=64&q=75",
                              "https://postplanify.com/_next/image?url=%2Ftestimonials%2Faleksandr-heinlaid.jpg&w=64&q=75",
                            ].map((src, i) => (
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
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ============================================================
            INTERACTIVE SPLITTER
        ============================================================ */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <Container>
            <div className="max-w-4xl mx-auto">
              <CarouselSplitter />
            </div>
          </Container>
        </section>

        {/* ============================================================
            HOW IT WORKS (3 steps)
        ============================================================ */}
        <section id="how-it-works" className="py-16 lg:py-20">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                How it works
              </h2>
              <p className="text-lg text-muted-foreground">
                Three quick steps. No learning curve.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {HOW_IT_WORKS.map((s, i) => (
                <Card key={i} className="p-6 relative">
                  <div className="absolute -top-3 -left-3 size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 mt-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* ============================================================
            SLIDE COUNT GUIDE (table)
        ============================================================ */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Slide count guide
              </h2>
              <p className="text-lg text-muted-foreground">
                Pick the right tile count for your content.
              </p>
            </div>
            <Card className="max-w-4xl mx-auto overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/60 border-b">
                      <th className="text-left font-semibold p-4">Slides</th>
                      <th className="text-left font-semibold p-4">Grid layout</th>
                      <th className="text-left font-semibold p-4">Tile size</th>
                      <th className="text-left font-semibold p-4">Best for</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SLIDE_GUIDE.map((row) => (
                      <tr key={row.count} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4">
                          <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-md bg-primary/10 text-primary font-semibold text-xs px-2">
                            {row.count}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs">{row.layout}</td>
                        <td className="p-4 text-muted-foreground">{row.size}</td>
                        <td className="p-4 text-muted-foreground">{row.use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Container>
        </section>

        {/* ============================================================
            RELATED ARTICLE BANNER
        ============================================================ */}
        <section className="py-12 lg:py-16">
          <Container>
            <Link
              href="/blog/instagram-carousel-guide"
              className="block max-w-4xl mx-auto rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 sm:p-8 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Layers className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
                    Related guide
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">
                    Complete Guide: Instagram Carousel Posts in 2026
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sizes, hook formulas, design templates, swipe-rate benchmarks, and 12 carousel hooks that work right now. Everything you need after you finish splitting your image.
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Read the full guide <ArrowRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          </Container>
        </section>

        {/* ============================================================
            POPULAR USE CASES (6 cards)
        ============================================================ */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Popular use cases
              </h2>
              <p className="text-lg text-muted-foreground">
                How creators, brands, and agencies use this splitter every day.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {USE_CASES.map((u) => (
                <Card key={u.title} className="p-6 hover:shadow-md transition-shadow">
                  <div className={`size-12 rounded-xl ${u.color} flex items-center justify-center mb-4`}>
                    <u.Icon className="size-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{u.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{u.body}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* ============================================================
            WHY CAROUSELS ARE HIGHEST-ENGAGEMENT (long-form SEO)
        ============================================================ */}
        <section className="py-16 lg:py-20">
          <Container>
            <article className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Why Instagram Carousels Are the Highest-Engagement Format in 2026
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Instagram has been quietly pushing carousels to the top of the feed for two years running, and 2026 is no different. In their Q4 2025 creator earnings report, Meta confirmed that carousel posts get <strong className="text-foreground">1.4× more reach</strong> than single-image posts and <strong className="text-foreground">3.1× more saves</strong> than Reels of equivalent length. The reason is the algorithm — every swipe registers as a new "interaction," which signals relevance, which earns more reach. The more swipes you earn, the more reach you get, the more swipes you earn.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                That's why a well-built carousel can outperform a Reel of the same production effort. Reels win on raw impressions, but carousels win on <em>engaged</em> impressions — the kind that translate to follows, saves, and link clicks. For most creators and brands in 2026, that trade-off is a no-brainer.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                But the carousel format has a problem: it lives inside a 1:1 or 4:5 frame, and most of the imagery creators want to share (panoramas, infographics, side-by-side comparisons, group shots) doesn't fit. That's where the carousel splitter comes in. One wide image, sliced into 5 or 7 portrait tiles, becomes a swipeable story that fits the IG frame perfectly — and keeps every pixel of your source intact.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                We've watched creators triple their carousel engagement in 30 days just by switching from "upload 10 separate photos" to "upload one panoramic photo, sliced into 10 cohesive tiles." The grid view stays clean, the carousel reads as one piece, and the algorithm rewards the swipe-through.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                If you're not using carousels in 2026, you're leaving reach on the table. And if you're not splitting wide images into carousels, you're leaving the highest-engagement use case on the table.
              </p>
            </article>
          </Container>
        </section>

        {/* ============================================================
            INSTAGRAM CAROUSEL DIMENSIONS (bulleted list with links)
        ============================================================ */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Instagram Carousel Dimensions and Specs
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                Every carousel tile should be exported at one of the three Instagram-spec aspect ratios. Pick the one that matches your content and the feed experience you want.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  { label: "Portrait (recommended)", value: "1080 × 1350 px · 4:5 aspect ratio · highest engagement" },
                  { label: "Square", value: "1080 × 1080 px · 1:1 aspect ratio · safest default" },
                  { label: "Landscape", value: "1080 × 608 px · 16:9 aspect ratio · best for panoramas" },
                  { label: "Maximum file size", value: "8 MB per tile · use PNG for graphics, JPG 85% for photos" },
                  { label: "Maximum slides", value: "10 per carousel · 5–7 is the engagement sweet spot" },
                  { label: "Safe zone margin", value: "100 px on every edge · avoid IG UI overlays" },
                  { label: "Color profile", value: "sRGB · embed before upload" },
                  { label: "Format", value: "PNG (graphics) or JPG (photos) · never WebP for IG uploads" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{item.label}:</span>{" "}
                      <span className="text-muted-foreground">{item.value}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">
                For a deeper dive, see our{" "}
                <Link href="/blog/instagram-image-sizes" className="text-primary hover:underline">
                  complete Instagram image size guide
                </Link>{" "}
                and{" "}
                <Link href="/tools/instagram-image-resizer" className="text-primary hover:underline">
                  free Instagram Image Resizer
                </Link>
                .
              </p>
            </div>
          </Container>
        </section>

        {/* ============================================================
            HOW TO MAXIMIZE ENGAGEMENT (6 tips with links)
        ============================================================ */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                How to Maximize Carousel Engagement After Splitting
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                Slicing is the first 10%. The other 90% is what makes people swipe through every slide.
              </p>
              <div className="space-y-6">
                {ENGAGEMENT_TIPS.map((tip, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-sm text-muted-foreground">
                Once your carousel is published, track the swipe-through rate in PostPlanify's{" "}
                <Link href="/features/analytics" className="text-primary hover:underline">
                  Instagram Analytics
                </Link>{" "}
                — if any slide drops more than 50% of viewers, that's your hook or pacing problem.
              </p>
            </div>
          </Container>
        </section>

        {/* ============================================================
            PRO TIPS (12 numbered)
        ============================================================ */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Lightbulb className="size-7 text-amber-500" />
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Pro Tips
                </h2>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                Twelve field-tested tips from creators who've shipped 1,000+ carousels each.
              </p>
              <ol className="space-y-3 list-decimal list-inside marker:font-semibold marker:text-primary">
                {PRO_TIPS.map((tip, i) => (
                  <li key={i} className="pl-2 text-base text-muted-foreground leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ol>
            </div>
          </Container>
        </section>

        {/* ============================================================
            COMMON ISSUES & SOLUTIONS (9 accordions)
        ============================================================ */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-2">
                <Wrench className="size-7 text-primary" />
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Common Issues &amp; Solutions
                </h2>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                Quick fixes for the 9 problems we hear about most.
              </p>
              <FaqAccordion items={COMMON_ISSUES} />
            </div>
          </Container>
        </section>

        {/* ============================================================
            BROWSER COMPATIBILITY
        ============================================================ */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="size-7 text-primary" />
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Browser Compatibility
                </h2>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                The splitter runs on any modern browser with HTML5 Canvas support.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {BROWSERS.map((b, i) => (
                  <Card key={i} className="p-4 flex items-start gap-3">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <b.Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-sm text-muted-foreground">{b.note}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ============================================================
            PRIVACY & SECURITY (3 cards)
        ============================================================ */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="size-7 text-primary" />
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Privacy &amp; Security
                </h2>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                Your image stays on your device. Period.
              </p>
              <div className="grid md:grid-cols-3 gap-5">
                {PRIVACY.map((p, i) => (
                  <Card key={i} className="p-6">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <p.Icon className="size-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                  </Card>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ============================================================
            FREQUENTLY ASKED QUESTIONS (33)
        ============================================================ */}
        <section id="faq" className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-2">
                <HelpCircle className="size-7 text-primary" />
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Frequently Asked Questions
                </h2>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                {FAQS.length} of the questions we hear most often.
              </p>
              <FaqAccordion items={FAQS} />
            </div>
          </Container>
        </section>

        {/* ============================================================
            POSTPLANIFY CTA BANNER
        ============================================================ */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/20 blur-3xl" />
                <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-white/20 blur-3xl" />
              </div>
              <div className="relative">
                <Sparkles className="size-10 mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                  Post smarter, not harder.
                </h2>
                <p className="text-lg opacity-90 max-w-2xl mx-auto mb-6">
                  PostPlanify is the social media management platform for agencies, brands, and creators. Plan, schedule, and analyze posts across 10 platforms — with AI captions, a visual calendar, and team collaboration built in.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <a
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 text-base rounded-md bg-white text-primary font-medium hover:bg-white/90 transition-colors"
                  >
                    Start 7-day free trial
                    <ArrowRight className="size-4" />
                  </a>
                  <a
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 text-base rounded-md border border-white/30 hover:bg-white/10 transition-colors font-medium"
                  >
                    See pricing
                  </a>
                </div>
                <p className="mt-4 text-sm opacity-80">No credit card required · Cancel anytime</p>
              </div>
            </div>
          </Container>
        </section>

        {/* ============================================================
            RELATED RESOURCES (4 categories)
        ============================================================ */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Related resources
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to plan, schedule, and grow your social presence.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {RELATED_RESOURCES.map((group) => (
                <div key={group.title}>
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    {group.title}
                  </h3>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ============================================================
            TESTIMONIALS (10)
        ============================================================ */}
        <section className="py-16 lg:py-20">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                More from the community
              </h2>
              <p className="text-lg text-muted-foreground">
                Trusted by 2,150+ businesses across 60+ countries.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {TESTIMONIALS.map((t, i) => (
                <Card key={i} className="p-5">
                  <div className="flex text-yellow-500 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}{t.role && `, ${t.role}`}</p>
                    <p className="text-xs text-muted-foreground">{t.company} · {t.metric}</p>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* ============================================================
            CONNECT & PUBLISH (platform grid)
        ============================================================ */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Connect and publish to every platform
              </h2>
              <p className="text-lg text-muted-foreground">
                PostPlanify integrates natively with 10 platforms.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
              {PLATFORMS.map((p) => (
                <Link
                  key={p.label}
                  href={p.href}
                  className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <Building2 className="size-6 text-primary" />
                  <span className="text-sm font-medium">{p.label}</span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}