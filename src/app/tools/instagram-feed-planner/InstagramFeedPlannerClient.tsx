"use client";
import * as React from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Star,
  Upload,
  ImageIcon,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const HOW_IT_WORKS = [
  { step: 1, title: "Upload your images", body: "Drag and drop or click to upload up to 15 images. Supports JPG, PNG, and WEBP formats. Your images stay in your browser—nothing is uploaded to servers." },
  { step: 2, title: "Arrange your grid", body: "Drag and drop images to reorder them. See exactly how posts will appear in your 3-column Instagram grid. The top-left position is your most recent post." },
  { step: 3, title: "Preview and download", body: "Toggle the phone mockup to see a realistic preview. Download your planned grid as an image to share with your team or reference when posting." },
];

const USE_CASES = [
  { title: "Maintain Your Aesthetic", body: "Plan your feed to ensure every post complements the next. Preview how new content fits with existing posts and maintain the cohesive look your followers love." },
  { title: "Plan Campaign Launches", body: "Visualize product launches, seasonal campaigns, or rebrands before they go live. Ensure your Instagram presence aligns with your marketing strategy." },
  { title: "Client Approvals Made Easy", body: "Download grid previews to share with clients for approval. Show exactly how their Instagram will look before posting, streamlining the feedback process." },
  { title: "Showcase Products Strategically", body: "Plan product photos to create visual variety while maintaining brand consistency. Alternate between product shots, lifestyle images, and user content." },
  { title: "Create Visual Stories", body: "Plan puzzle grids, themed rows, or color gradients that turn your profile into a portfolio. Preview how individual pieces form a larger visual narrative." },
  { title: "Balance Sponsored Content", body: "Plan where sponsored posts fit within your organic content. Maintain authenticity by ensuring promotional content doesn't cluster or disrupt your feed flow." },
];

const GRID_LAYOUTS = [
  { title: "Checkerboard Pattern", body: "Alternate between two types of content (e.g., photos and quotes) creating a checkerboard effect. Simple to maintain and visually striking." },
  { title: "Row-by-Row Themes", body: "Each row of 3 posts shares a theme, color, or story. Creates clear visual sections as users scroll through your profile." },
  { title: "Diagonal Color Flow", body: "Colors flow diagonally across the grid, creating movement and cohesion. Requires careful planning but looks stunning." },
  { title: "Puzzle/Seamless Grid", body: "One large image split across multiple posts. Creates a dramatic visual impact when viewers see your full profile. Use our Grid Maker tool for this." },
];

const WHY_PLANNING = [
  { num: "67%", desc: "of users say a cohesive grid makes them more likely to follow an account" },
  { num: "3 sec", desc: "Average time users spend deciding whether to follow a profile" },
  { num: "9 posts", desc: "First impression grid that visitors see when landing on your profile" },
];

const PRO_TIPS = [
  { title: "Plan in rows of 3 for visual impact", body: "Instagram displays posts in rows of 3. Design with this in mind—create themed rows, color gradients across three posts, or triptych images that span the full width. This creates intentional visual moments as users scroll." },
  { title: "Check the diagonal flow of your feed", body: "Colors and themes often create diagonal patterns in a 3-column grid. Pay attention to how colors flow diagonally from top-left to bottom-right and top-right to bottom-left. A balanced diagonal flow creates visual harmony." },
  { title: "Alternate between different shot types", body: "Mix close-up detail shots with wider environmental shots. This creates visual variety and prevents your feed from feeling monotonous. A good rhythm might be: close-up, medium shot, wide shot, repeat." },
  { title: "Use the same editing preset on all photos", body: "Consistency in editing is the fastest way to create a cohesive feed. Whether you use Lightroom presets, VSCO filters, or Instagram's built-in filters, stick to one style. Your photos will look like they belong together." },
  { title: "Plan your first 9 posts carefully—they're your first impression", body: "When someone visits your profile, they see your top 9 posts first. These 9 images determine whether they follow you. Make sure this '3x3 grid' represents your best content and clearest brand message." },
  { title: "Leave breathing room with minimalist posts", body: "If your feed feels visually cluttered, add 'breathing room' posts—simple images with lots of white space, solid colors, or minimal compositions. These give eyes a rest and make busy posts pop more." },
  { title: "Consider how Reels covers fit your grid", body: "Reel thumbnails appear in your grid just like photos. Plan your Reel covers to match your aesthetic—you can add custom cover images to Reels to maintain visual consistency across your profile." },
  { title: "Don't let text posts cluster together", body: "Quote graphics, announcement posts, or text-heavy images should be spread throughout your feed, not posted back-to-back. This maintains visual variety and prevents your grid from looking like a bulletin board." },
  { title: "Preview before every post, not just major launches", body: "The most cohesive feeds are maintained by creators who preview every single post before publishing. Make feed planning a habit, not just a special occasion. Consistency compounds over time." },
  { title: "Save your planned grid for reference when posting", body: "Download your planned grid and keep it accessible when you're ready to post. This ensures you post in the exact order you planned, maintaining the aesthetic you designed. It's easy to forget the plan otherwise." },
];

const FAQS = [
  { q: "What is an Instagram feed planner?", a: "An Instagram feed planner is a visual tool that lets you upload images, arrange them in a 3-column grid layout, and preview how they'll look on your Instagram profile before posting. It helps you create a cohesive aesthetic by seeing how multiple posts work together, allowing you to plan colors, themes, and visual patterns in advance." },
  { q: "Is this Instagram feed planner free to use?", a: "Yes, this Instagram feed planner is 100% free with no signup required. You can upload images, rearrange them, preview your grid, and download the preview image without creating an account or paying anything. There are no hidden fees, watermarks, or premium features locked behind a paywall." },
  { q: "Are my images uploaded to your servers?", a: "No, your images are never uploaded to our servers. Everything is processed locally in your browser using client-side technology. Your photos stay on your device, ensuring complete privacy. When you close the page, the images are removed from memory. We don't store, share, or have access to any of your content." },
  { q: "How many images can I upload to the feed planner?", a: "You can upload up to 15 images to plan your Instagram feed. This allows you to preview 5 rows of content (15 posts) and see how your upcoming posts will look together. The first 9 images represent what visitors see immediately when landing on your profile—the most important visual impression." },
  { q: "How do I rearrange images in the grid?", a: "Simply drag and drop images to reorder them. Click and hold on any image, then drag it to a new position in the grid. The other images will automatically shift to accommodate the change. This makes it easy to experiment with different arrangements until you find the perfect layout." },
  { q: "Can I download my planned feed preview?", a: "Yes, click the 'Download Preview' button to save your grid as a PNG image. This creates a high-quality image of your top 9 posts that you can save, share with clients or team members, or reference when posting. It's perfect for content approval workflows or keeping a record of your planned aesthetic." },
  { q: "What image formats are supported?", a: "The feed planner supports all common image formats including JPG, JPEG, PNG, and WEBP. For best results, use high-quality images in square (1:1) or portrait (4:5) aspect ratios. Non-square images will be automatically cropped to square in the preview, matching how Instagram displays grid thumbnails." },
  { q: "Does this tool work on mobile devices?", a: "Yes, the Instagram feed planner is fully responsive and works on mobile devices, tablets, and desktops. You can upload images from your phone's camera roll and rearrange them using touch gestures. For the best experience with drag-and-drop reordering, we recommend using a tablet or desktop." },
  { q: "Can I see how my feed looks with a phone mockup?", a: "Yes, click the 'Show Mockup' button to see your planned feed inside a realistic phone frame, complete with a profile header showing posts, followers, and following counts. This gives you a true preview of how visitors will see your Instagram profile, helping you make better design decisions." },
  { q: "Why should I plan my Instagram feed in advance?", a: "Planning your feed helps you maintain a consistent aesthetic that makes your profile memorable and professional. A cohesive grid increases follower trust, improves brand recognition, and can boost engagement. Studies show profiles with consistent aesthetics have higher follow-through rates when users discover them through Reels or Explore." },
  { q: "What makes a good Instagram grid layout?", a: "A good Instagram grid balances colors, alternates between different shot types (close-ups vs. wide shots), maintains consistent editing style, and creates visual flow. Popular layouts include the checkerboard pattern, row-by-row themes, diagonal color flow, and puzzle grids. The best layout depends on your brand and content type." },
  { q: "Can I use this to plan Instagram Reels?", a: "Yes, you can upload Reel cover images or thumbnails to see how they'll appear in your grid. While the tool doesn't play videos, you can preview how Reel covers will look alongside your photo posts. This helps maintain aesthetic consistency even when mixing Reels with static posts." },
  { q: "How does the Instagram grid work?", a: "Instagram displays posts in a 3-column grid on your profile, with the newest post appearing in the top-left position. Each row shows 3 posts. When visitors land on your profile, they typically see your top 9 posts first (3 rows), which is why this 'first impression' grid is crucial for attracting new followers." },
  { q: "Can I plan carousel posts with this tool?", a: "You can upload the first image of your carousel to see how it appears in the grid. Instagram only shows the first slide as the grid thumbnail, so planning with the first image gives you an accurate preview. For splitting images into carousels, check out our Instagram Carousel Splitter tool." },
  { q: "What's the difference between feed planner and grid maker?", a: "A feed planner helps you arrange and preview multiple posts in your Instagram grid layout. A grid maker (or image splitter) divides one large image into multiple tiles to create a seamless puzzle effect when posted together. They serve different purposes: planning order vs. creating multi-post images. We offer both tools." },
  { q: "How often should I plan my Instagram feed?", a: "Most creators plan 1-2 weeks ahead, which means 9-15 posts at a time. This gives you enough runway to maintain consistency without over-planning. Some brands plan monthly for campaign launches. The key is finding a rhythm that lets you stay consistent without feeling locked into content that's no longer relevant." },
  { q: "Can I connect my Instagram account to import existing posts?", a: "This tool is designed to work without requiring any Instagram login or connection for your privacy and security. You would need to manually screenshot or save your current posts if you want to include them in your planning. This keeps the tool simple, fast, and completely private." },
  { q: "What are the best colors for an Instagram feed?", a: "The best colors depend on your brand, but cohesive feeds typically stick to 2-4 main colors that appear consistently across posts. Popular approaches include muted/pastel tones for lifestyle brands, bold contrasting colors for creative accounts, and neutral/minimal palettes for professional services. Consistency matters more than specific colors." },
  { q: "How do I create a cohesive Instagram aesthetic?", a: "Create cohesion by using the same preset/filter on all photos, sticking to a consistent color palette, maintaining similar composition styles, and planning posts that complement each other. Use this feed planner to preview how posts look together before committing. Consider the overall mood you want your profile to convey." },
  { q: "Can multiple team members use this tool?", a: "Yes, anyone can use this tool without an account. For team collaboration, you can download the planned grid preview and share it for approval. For more advanced team features like comments, approvals, and scheduled publishing, consider using PostPlanify's full scheduling platform with team collaboration built-in." },
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

const SAMPLE_GRADIENTS = [
  "from-pink-300 via-rose-300 to-orange-200",
  "from-blue-300 via-cyan-300 to-teal-200",
  "from-purple-300 via-pink-300 to-red-200",
  "from-amber-200 via-yellow-200 to-lime-200",
  "from-emerald-300 via-teal-300 to-cyan-300",
  "from-indigo-300 via-purple-300 to-pink-200",
  "from-orange-300 via-red-300 to-pink-300",
  "from-slate-300 via-gray-300 to-zinc-200",
  "from-fuchsia-300 via-pink-300 to-rose-300",
];

/* ------------------------------------------------------------------ */
/*  Feed Planner Widget                                                */
/* ------------------------------------------------------------------ */

function FeedPlannerWidget() {
  const [items, setItems] = React.useState<{ id: string; gradient: string; label: string }[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const MAX = 15;

  function loadFiles(files: FileList | null) {
    if (!files) return;
    const remaining = MAX - items.length;
    const list = Array.from(files).slice(0, remaining);
    const next = list.map((f, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2)}`,
      gradient: SAMPLE_GRADIENTS[(items.length + idx) % SAMPLE_GRADIENTS.length],
      label: f.name,
      url: URL.createObjectURL(f),
    }));
    setItems((cur) => [...cur, ...next]);
  }

  function loadSamples() {
    const remaining = MAX - items.length;
    const list = Array.from({ length: Math.min(9, remaining) }).map((_, idx) => ({
      id: `s${Date.now()}-${idx}`,
      gradient: SAMPLE_GRADIENTS[(items.length + idx) % SAMPLE_GRADIENTS.length],
      label: `Sample ${items.length + idx + 1}`,
    }));
    setItems((cur) => [...cur, ...list]);
  }

  function removeAt(idx: number) {
    setItems((cur) => cur.filter((_, i) => i !== idx));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    loadFiles(e.dataTransfer.files);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    setItems((cur) => {
      const next = [...cur];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  }

  return (
    <div className="rounded-xl bg-card text-card-foreground shadow p-6 border">
      <div className="flex items-center gap-2 mb-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
        </svg>
        <h2 className="text-xl font-semibold">Instagram Feed Planner</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Plan and preview your Instagram grid before posting</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed transition-colors p-6 text-center cursor-pointer mb-4 ${dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">Drop images here or click to upload</p>
        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP — up to {MAX} images. Images stay in your browser.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          multiple
          className="hidden"
          onChange={(e) => loadFiles(e.target.files)}
        />
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={loadSamples}
          className="inline-flex items-center justify-center gap-2 w-full h-10 rounded-md border bg-background hover:bg-accent text-sm font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" /> Load sample grid
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
            <span>{items.length}/{MAX} slots — drag to reorder</span>
            <button type="button" onClick={() => setItems([])} className="hover:underline">Clear all</button>
          </div>
          <div
            className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden bg-muted"
            onDragOver={(e) => e.preventDefault()}
          >
            {items.map((it, i) => (
              <div
                key={it.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
                  if (!Number.isNaN(from)) reorder(from, i);
                }}
                className="relative aspect-square bg-gradient-to-br cursor-move group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${it.gradient}`} />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/80 font-medium mix-blend-overlay truncate px-1">{i + 1}</div>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 9 - items.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square bg-muted/30 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center text-muted-foreground/50">
                <ImageIcon className="w-4 h-4" />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-md border bg-background hover:bg-accent text-sm font-medium mt-4 transition-colors"
            disabled={items.length >= MAX}
          >
            <Upload className="w-4 h-4" /> Add more images
          </button>
        </>
      )}
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted-foreground shrink-0 mt-1 transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9" /></svg>
          </summary>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</div>
        </details>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main client                                                        */
/* ------------------------------------------------------------------ */

export function InstagramFeedPlannerClient() {
  return (
    <>
      <Header />
      <main>
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">Free Instagram Feed Planner</h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Plan and preview your Instagram grid before posting. Upload images, drag to reorder, and see exactly how your feed will look. Free, no signup required.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <FeedPlannerWidget />
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
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                        <line x1="15" y1="3" x2="15" y2="21" />
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
          <Container className="max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Popular Instagram Grid Layouts</h2>
              <p className="text-sm text-muted-foreground">Find the grid style that fits your brand</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {GRID_LAYOUTS.map((l, i) => (
                <div key={i} className="p-4 border rounded-lg bg-card">
                  <h3 className="font-semibold text-lg mb-2">{l.title}</h3>
                  <p className="text-sm text-muted-foreground">{l.body}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Why Planning Your Instagram Feed Matters</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-center">
              {WHY_PLANNING.map((s, i) => (
                <div key={i} className="p-4">
                  <p className="text-4xl font-bold text-primary mb-2">{s.num}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">💡 Pro Tips</h2>
              <p className="text-sm text-muted-foreground">Plan a feed that grows your audience</p>
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
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Everything about Instagram feed planning</p>
            </div>
            <FaqAccordion items={FAQS} />
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
