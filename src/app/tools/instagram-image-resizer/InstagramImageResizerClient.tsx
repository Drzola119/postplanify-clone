"use client";
import * as React from "react";
import Link from "next/link";
import {
  Upload,
  Check,
  CheckCircle2,
  Star,
  ChevronDown,
  ArrowRight,
  Download,
  ImageIcon,
} from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const SIZES = [
  { key: "square", label: "Square Post", size: "1080 × 1080", ratio: "1:1", w: 1080, h: 1080 },
  { key: "portrait", label: "Portrait Post", size: "1080 × 1350", ratio: "4:5", w: 1080, h: 1350 },
  { key: "landscape", label: "Landscape Post", size: "1080 × 566", ratio: "1.91:1", w: 1080, h: 566 },
  { key: "story", label: "Story / Reel", size: "1080 × 1920", ratio: "9:16", w: 1080, h: 1920 },
  { key: "profile", label: "Profile Picture", size: "320 × 320", ratio: "1:1", w: 320, h: 320 },
] as const;

const WHO_USES = [
  { title: "Content Creators & Influencers", body: "Resize photos for feed posts, Stories, and Reels with perfect dimensions that maximize engagement and maintain your aesthetic." },
  { title: "Small Business Owners", body: "Create professional Instagram content without design skills. Perfect product photos and promotional images in minutes." },
  { title: "Social Media Managers", body: "Quickly resize client images for Instagram campaigns. Ensure consistent quality across multiple accounts and posts." },
  { title: "Online Sellers", body: "Resize product images for Instagram Shop, feed posts, and Stories. Drive sales with perfectly formatted visuals." },
  { title: "Photographers & Artists", body: "Export portfolio work at exact Instagram dimensions. Showcase your art without Instagram cropping or compression ruining quality." },
  { title: "Everyday Users", body: "Share vacation photos, memories, and moments in the best possible quality. No more awkward crops or blurry uploads." },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Upload your image", body: "Select any image from your device. Works with JPG, PNG, and other common formats up to 10MB." },
  { step: 2, title: "Choose your Instagram size", body: "Pick from square (1:1), portrait (4:5), landscape (1.91:1), Story/Reel (9:16), or profile picture dimensions." },
  { step: 3, title: "Adjust and download", body: "Drag to reposition your image, resize from corners to perfect your crop, then download your Instagram-ready image." },
];

const PRO_TIPS = [
  { title: "Use 4:5 portrait for maximum feed visibility", body: "Portrait images at 1080×1350 take up 20% more screen space than square posts. This increased visibility leads to higher engagement—users spend more time on larger images and are more likely to like, comment, and save them." },
  { title: "Keep safe zones in mind for Stories and Reels", body: "The top and bottom 250 pixels of Stories/Reels are covered by Instagram's UI (username, captions, buttons). Keep important content like text, faces, and CTAs in the middle safe zone to ensure nothing gets hidden." },
  { title: "Maintain consistent aesthetics on your profile grid", body: "Your profile displays posts in a 3-column grid. Mix of square and portrait images can look chaotic. Consider using consistent aspect ratios or planning your grid layout in advance. Portrait posts show the center crop on the grid." },
  { title: "Design carousel posts for swipeability", body: "Start carousels with an attention-grabbing first image. Use consistent dimensions throughout (4:5 recommended). Add visual cues like arrows or 'Swipe' text to encourage engagement. Carousels get higher engagement than single images." },
  { title: "Optimize profile pictures for recognition", body: "Your profile picture displays tiny in comments and explore. Use a close-up face shot or simple logo with high contrast. Avoid text or detailed graphics that become illegible at small sizes. Keep key elements centered for the circular crop." },
  { title: "Test images on mobile before posting", body: "Most Instagram users browse on mobile. Preview your resized images on your phone to check quality, readability of any text, and how it appears in the feed. Colors and details can look different on mobile screens versus desktop." },
  { title: "Use high-resolution source images", body: "Always start with images larger than your target size (at least 1080px wide). Scaling down preserves quality; scaling up causes pixelation. Our tool works best with high-quality source images." },
  { title: "Save templates for repeated use", body: "If you post similar content regularly (quotes, recipes, products), create reusable templates. Most design tools let you save frame sizes and layouts, so you only set up dimensions once." },
  { title: "Consider the file size limit", body: "Instagram caps uploads at 30MB for photos. Our resizer keeps you under this limit by balancing dimensions with compression. If your file is still too big, reduce quality slightly." },
  { title: "Use white space for breathing room", body: "Don't fill every pixel of your Instagram canvas. White space (or background color space) makes your content feel premium and prevents it from looking cluttered in the feed." },
  { title: "Add subtle branding that's crop-safe", body: "Place logos and watermarks in the center or upper third of your image—never near the edges. Instagram can crop edges differently on different devices, so center your branding for safety." },
  { title: "Export in PNG for graphics, JPG for photos", body: "PNG preserves sharp text and graphics with transparency. JPG compresses photos better for smaller file sizes. Choose PNG for text-heavy designs and JPG for photographic content." },
];

const ISSUES = [
  {
    q: "⚠️Image looks blurry after posting to Instagram",
    solutions: [
      "Ensure your source image is at least 1080 pixels wide",
      "Use PNG format for graphics and text to preserve sharpness",
      "Avoid resizing the same image multiple times—start from the original",
    ],
  },
  {
    q: "⚠️Instagram is cropping my image unexpectedly",
    solutions: [
      "Use our resizer to pre-crop to exact Instagram dimensions (1:1, 4:5, or 1.91:1)",
      "For Stories/Reels, use 1080×1920 (9:16 ratio)",
      "Check that important content is centered—Instagram may crop edges",
    ],
  },
  {
    q: "⚠️Colors look different after uploading",
    solutions: [
      "Instagram uses sRGB color space—convert your images to sRGB",
      "Avoid over-saturated colors that may be compressed differently",
      "Test on mobile before posting as colors display differently on phone screens",
    ],
  },
  {
    q: "⚠️Carousel images have different sizes",
    solutions: [
      "All carousel images must use the same aspect ratio",
      "Instagram applies the first image's ratio to all subsequent images",
      "Resize all carousel images to the same dimensions before uploading",
    ],
  },
];

const FAQS = [
  { q: "What is the best Instagram post size?", a: "The best Instagram post size depends on your content. For square posts, use 1080×1080 pixels (1:1 ratio). For portrait posts that take up more feed space, use 1080×1350 pixels (4:5 ratio)—this is the most engaging format. For landscape posts, use 1080×566 pixels (1.91:1 ratio). Instagram recommends keeping images at least 1080 pixels wide for best quality." },
  { q: "What is the Instagram Story and Reels size?", a: "Instagram Stories and Reels both use 1080×1920 pixels (9:16 aspect ratio). This vertical full-screen format is optimized for mobile viewing. Keep important content away from the top 250 pixels (username area) and bottom 250 pixels (swipe up/CTA area) to avoid UI overlap." },
  { q: "What size is an Instagram profile picture?", a: "Instagram profile pictures are displayed at 110×110 pixels on mobile and 180×180 pixels on desktop, but you should upload at least 320×320 pixels for best quality. Instagram crops profile photos into circles, so keep your face or logo centered in the square frame." },
  { q: "What is the 4:5 aspect ratio for Instagram?", a: "The 4:5 aspect ratio (1080×1350 pixels) is the tallest format Instagram allows in the feed. Portrait photos in this ratio take up more screen space than square or landscape images, leading to higher engagement. It's ideal for portraits, product shots, and any content where you want maximum visibility." },
  { q: "Why does Instagram crop my photos?", a: "Instagram crops photos that don't fit supported aspect ratios. The platform supports ratios from 1.91:1 (landscape) to 4:5 (portrait). If your image falls outside this range, Instagram will crop it to fit. Use our resizer to pre-crop your images to the exact dimensions you want, giving you full control over the final result." },
  { q: "What is the best Instagram carousel size?", a: "Instagram carousels work best at 1080×1080 (square) or 1080×1350 (portrait) pixels. All images in a carousel must use the same aspect ratio—Instagram applies the first image's ratio to the entire carousel. Portrait (4:5) carousels get more engagement as they occupy more screen space while users swipe through." },
  { q: "Does resizing reduce image quality?", a: "Downscaling (making an image smaller) preserves quality because you're removing pixels. Upscaling (making an image larger) can reduce quality because the software has to invent new pixels. Always start with an image at least as large as your target size for best results." },
  { q: "What file formats does this tool support?", a: "Our Instagram image resizer supports JPG, PNG, and WebP formats up to 10MB. For graphics with text or transparency, use PNG. For photos, use JPG for smaller file sizes. After resizing, you can choose to download as either format." },
  { q: "Can I resize images for Instagram carousels?", a: "Yes! Use the square or portrait size for carousel posts. All carousel images must share the same aspect ratio, so resize your entire batch to the same dimensions before uploading. We recommend 1080×1350 portrait for maximum carousel engagement." },
  { q: "Is this Instagram resizer free?", a: "Yes, completely free with no signup required. Resize unlimited images for Instagram and other platforms. Your images are processed entirely in your browser—they never leave your device." },
  { q: "What aspect ratio works best for Instagram?", a: "Portrait 4:5 (1080×1350) works best for engagement because it takes up the most screen space in the feed. Square 1:1 (1080×1080) is timeless and grid-friendly. Use 9:16 (1080×1920) for Stories and Reels. Avoid landscape in feed posts—it's smaller on mobile and gets less engagement." },
  { q: "How do I create a perfect Instagram grid?", a: "Plan your grid by alternating aspect ratios carefully or stick to one ratio. Preview your grid with apps like Preview or Planoly before posting. Most successful grids use consistent square or portrait ratios with a coordinated color palette for visual harmony." },
  { q: "Can I use this for Instagram ads?", a: "Yes! Instagram ads use the same dimensions as organic posts. For feed ads, use 1080×1080 or 1080×1350. For Stories ads, use 1080×1920. Ensure your ad creative includes a clear CTA and follows Instagram's ad guidelines for best performance." },
  { q: "Will my image look good on Instagram after resizing?", a: "Yes, as long as your source image is high quality. Our resizer preserves quality by maintaining aspect ratios and using optimal compression. For best results, start with images at least 1080 pixels wide and avoid extreme upscaling." },
  { q: "Should I include Instagram safe zones?", a: "Yes, for Stories and Reels especially. The top 250 pixels (for username/caption UI) and bottom 250 pixels (for navigation/reaction buttons) are covered. Place logos, text, and key visuals in the middle 1080×1420 safe area to ensure visibility across all devices." },
  { q: "How often does Instagram change image size requirements?", a: "Instagram rarely changes supported dimensions, but they occasionally add new formats like the recent Reels cover image size (1080×1920) or dual-format posts. Our tool is regularly updated to reflect current Instagram specifications." },
  { q: "Can I batch resize multiple images?", a: "Our current tool resizes one image at a time for precision control. For batch resizing, we recommend using a desktop tool like Photoshop with actions, or PostPlanify's bulk image editor, which can process multiple files at once." },
  { q: "Does the resizer preserve transparency?", a: "PNG files with transparency are preserved when downloading as PNG. If you choose JPG output, transparency will be filled with white (or you can choose a custom background color). For best results with transparent graphics, always download as PNG." },
  { q: "What's the difference between resizing and cropping?", a: "Resizing changes the dimensions of your entire image, scaling proportionally. Cropping removes parts of your image to fit specific dimensions. Our tool does both—you can resize the canvas and crop to focus on the most important parts of your image." },
  { q: "Can I undo my crop adjustments?", a: "Yes, simply re-upload your original image to start fresh. Since everything happens in your browser, no changes are saved—we always recommend starting from your original source file rather than a previously edited version." },
  { q: "What if my image looks distorted after resizing?", a: "If your image looks stretched or squished, you've probably resized to an aspect ratio different from the source. Choose the aspect ratio that matches your source image (square, portrait, landscape, or story) to maintain proportions. Our tool handles letterboxing automatically." },
];

const PLATFORMS = [
  { label: "Twitter/X Image Resizer", desc: "Resize images for Twitter profile pictures, headers, and tweet images with perfect dimensions.", href: "/tools/twitter-image-resizer" },
  { label: "LinkedIn Image Resizer", desc: "Resize images for LinkedIn profile pictures, banners, post images, and company logos.", href: "/tools/linkedin-image-resizer" },
  { label: "Pinterest Image Resizer", desc: "Create perfectly sized pins, board covers, and profile pictures for Pinterest.", href: "/tools/pinterest-image-resizer" },
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
/*  Resizer widget                                                     */
/* ------------------------------------------------------------------ */

function ResizerWidget() {
  const [sizeKey, setSizeKey] = React.useState<(typeof SIZES)[number]["key"]>("square");
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 50, y: 50 }); // percent
  const [dragging, setDragging] = React.useState(false);
  const dragStart = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const size = SIZES.find((s) => s.key === sizeKey)!;
  const targetRatio = size.w / size.h;

  const fileInput = React.useRef<HTMLInputElement>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target?.result as string);
      setZoom(1);
      setOffset({ x: 50, y: 50 });
    };
    reader.readAsDataURL(f);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!imageSrc) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !dragStart.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;
    setOffset({
      x: Math.max(0, Math.min(100, dragStart.current.ox + dx)),
      y: Math.max(0, Math.min(100, dragStart.current.oy + dy)),
    });
  }

  function onPointerUp() {
    setDragging(false);
    dragStart.current = null;
  }

  async function handleDownload() {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image load failed"));
      img.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Fill bg
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Compute crop based on zoom and offset to cover the target area
    const imgRatio = img.width / img.height;
    let cropW: number, cropH: number;
    if (imgRatio > targetRatio) {
      // Source is wider - crop horizontally
      cropH = img.height / zoom;
      cropW = cropH * targetRatio;
    } else {
      cropW = img.width / zoom;
      cropH = cropW / targetRatio;
    }
    const cropX = Math.max(0, Math.min(img.width - cropW, (img.width - cropW) * (offset.x / 100)));
    const cropY = Math.max(0, Math.min(img.height - cropH, (img.height - cropH) * (offset.y / 100)));

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instagram-${sizeKey}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  const previewStyle: React.CSSProperties = imageSrc
    ? {
        backgroundImage: `url(${imageSrc})`,
        backgroundSize: `${zoom * 100}%`,
        backgroundPosition: `${offset.x}% ${offset.y}%`,
      }
    : {};

  return (
    <div className="rounded-xl bg-card text-card-foreground shadow p-6 border">
      <h2 className="text-xl font-semibold text-center mb-2">Resize for Instagram</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Upload any image and resize it to perfect Instagram dimensions
      </p>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {SIZES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSizeKey(s.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${sizeKey === s.key ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
            >
              {s.label} <span className="opacity-70 ml-1">({s.size})</span>
            </button>
          ))}
        </div>

        {!imageSrc ? (
          <div
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f && fileInput.current) {
                const dt = new DataTransfer();
                dt.items.add(f);
                fileInput.current.files = dt.files;
                fileInput.current.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }}
            className="border-2 border-dashed rounded-xl cursor-pointer p-12 flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors"
          >
            <Upload className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload an image</p>
            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
          </div>
        ) : (
          <>
            <div
              ref={previewRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative bg-muted rounded-xl overflow-hidden cursor-move touch-none"
              style={{ aspectRatio: `${targetRatio}`, maxHeight: 480, ...previewStyle }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-[13%] bg-black/10" />
                <div className="absolute inset-x-0 bottom-0 h-[13%] bg-black/10" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-black text-white hover:bg-zinc-800 font-medium text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Download {size.w}×{size.h}
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageSrc(null);
                  if (fileInput.current) fileInput.current.value = "";
                }}
                className="inline-flex items-center justify-center h-10 px-4 rounded-md border hover:bg-muted font-medium text-sm transition-colors"
              >
                New Image
              </button>
            </div>
          </>
        )}

        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFile}
          className="hidden"
        />
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
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Schedule posts, track performance, and collaborate with your team.
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-2 my-4">
            {SOCIAL_ICONS.map(({ label, color, d }) => (
              <div key={label} className={`transition-all duration-200 ${color} hover:opacity-80`} title={label}>
                <svg role="img" aria-label={label} viewBox="0 0 24 24" fill="currentColor" width={32} height={32} className="w-8 h-8">
                  <path d={d} />
                </svg>
              </div>
            ))}
          </div>
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-black text-white hover:bg-zinc-800 font-medium transition-colors">
            Start 7-day Free Trial
          </Link>
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

export function InstagramImageResizerClient() {
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
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">Instagram Image Resizer (2026)</h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Resize images for Instagram instantly. Get perfect dimensions for square posts, portrait photos, landscape images, Stories, Reels, and profile pictures. Free tool, no signup required.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <ResizerWidget />
              <PromoCard />
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Who Uses This Tool?</h2>
              <p className="text-sm text-muted-foreground">Perfect for anyone posting on Instagram</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {WHO_USES.map((u, i) => (
                <Card key={i} className="p-6 pb-3 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5" />
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

        <section className="py-12 sm:py-16 px-4">
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

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">💡 Pro Tips</h2>
              <p className="text-sm text-muted-foreground">Get the best results from your Instagram images</p>
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
              <h2 className="text-3xl font-bold mb-2">Troubleshooting Common Issues</h2>
              <p className="text-sm text-muted-foreground">Common image issues and how to fix them</p>
            </div>
            <IssuesAccordion items={ISSUES} />
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Everything you need to know about Instagram image sizes</p>
            </div>
            <FaqAccordion items={FAQS} />
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Image Resizers for Other Platforms</h2>
              <p className="text-sm text-muted-foreground">Resize images for every major platform</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PLATFORMS.map((p, i) => (
                <Link key={i} href={p.href} className="block rounded-xl border bg-card text-card-foreground shadow hover:shadow-md transition-all duration-200 hover:border-primary/40 p-5">
                  <h3 className="font-semibold mb-2">{p.label}</h3>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/tools" className="inline-flex items-center text-sm text-primary hover:underline">
                View all free tools →
              </Link>
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
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Schedule, preview, and publish across all major platforms — from one simple dashboard.
              </p>
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-black text-white hover:bg-zinc-800 font-medium transition-colors">
                Start 7-day Free Trial
                <ArrowRight className="size-4" />
              </Link>
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
                    <svg role="img" aria-label={label} viewBox="0 0 24 24" fill="currentColor" width={32} height={32} className="w-8 h-8">
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
