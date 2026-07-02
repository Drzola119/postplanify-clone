"use client";
import * as React from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  CheckCircle2,
  Star,
  Mail,
  Megaphone,
  Share2,
  BarChart3,
  ShoppingBag,
  CreditCard,
  ChevronDown,
  AlertTriangle,
  ArrowRight,
  Link2,
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
    step: 1,
    title: "Enter your destination URL",
    body: "Paste the webpage URL you want to track. This is where users will land after clicking your link.",
  },
  {
    step: 2,
    title: "Fill in UTM parameters",
    body: "Add source (where traffic comes from), medium (how it reaches you), and campaign name. Optionally add content and term.",
  },
  {
    step: 3,
    title: "Copy your tracking URL",
    body: "Your UTM link is generated automatically. Copy it and use it in your ads, emails, social posts, or anywhere you share links.",
  },
];

const USE_CASES = [
  {
    Icon: Mail,
    title: "Email Marketing Campaigns",
    body: "Track clicks from newsletters, promotional emails, and automated sequences.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    Icon: Megaphone,
    title: "Social Media Ads",
    body: "Measure ROI from paid social campaigns on Facebook, Instagram, LinkedIn, and more.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    Icon: Share2,
    title: "Organic Social Posts",
    body: "Track traffic from organic social media content across all platforms.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    Icon: BarChart3,
    title: "Performance Analytics",
    body: "Build comprehensive reports in Google Analytics with clean, consistent UTM data.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    Icon: ShoppingBag,
    title: "E-commerce Tracking",
    body: "Attribute sales to specific campaigns and optimize your marketing spend.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    Icon: CreditCard,
    title: "Paid Search Campaigns",
    body: "Track Google Ads, Bing Ads, and other paid search traffic with custom parameters.",
    color: "bg-cyan-100 text-cyan-600",
  },
];

const PRO_TIPS = [
  { title: "Use consistent naming conventions", body: "Create a naming guide for your team. Always use the same format—if you use 'facebook' as a source, never switch to 'fb' or 'Facebook'. Consistency makes analytics much easier to analyze." },
  { title: "Always use lowercase", body: "UTM parameters are case-sensitive. 'Email' and 'email' will appear as different mediums in your reports. Stick to lowercase to avoid fragmenting your data across multiple entries." },
  { title: "Use underscores instead of spaces", body: "Spaces become '%20' in URLs, making them ugly and hard to read. Use underscores (summer_sale) or hyphens (summer-sale) for multi-word values. Pick one format and stick with it." },
  { title: "Keep campaign names descriptive but concise", body: "Use names that clearly identify the campaign when you see them months later. Include the year or quarter if relevant (q1_2024_promo). But don't make them so long that URLs become unwieldy." },
  { title: "Document your UTM strategy", body: "Create a spreadsheet documenting your UTM naming conventions. Share it with your team to ensure everyone uses the same values. This prevents data fragmentation and makes reporting accurate." },
  { title: "Test your links before launching", body: "Always click your UTM links before publishing campaigns. Verify they load the correct page and that the parameters appear correctly. Check that analytics is receiving the data properly." },
  { title: "Use utm_content for A/B testing", body: "When testing different versions of the same ad or email, use utm_content to differentiate them. Example: 'blue_button' vs 'green_button' to track which performs better." },
  { title: "Include dates in campaign names", body: "Add dates or time periods to campaign names for easy filtering. Use formats like '2024_q1_sale' or 'jan2024_promo' to quickly find campaigns in your analytics." },
  { title: "Shorten long UTM URLs", body: "UTM URLs can get long and ugly. Use URL shorteners like Bitly or your own branded domain to create cleaner, more shareable links that still track properly." },
  { title: "Track different placements", body: "Use utm_content to track where links appear—header vs footer, sidebar vs inline. This reveals which link placements drive the most clicks and conversions." },
  { title: "Set up GA4 reports for UTMs", body: "Create custom reports in Google Analytics 4 that show traffic by source, medium, and campaign. Save these reports for quick access to your UTM performance data." },
  { title: "Use UTMs in email signatures", body: "Add UTM parameters to links in your email signature to track how many clicks come from your daily email communications. Great for measuring personal outreach impact." },
];

const COMMON_ISSUES = [
  {
    q: "⚠️UTM data not appearing in Google Analytics",
    solutions: [
      "Wait 24-48 hours for data to process in GA4",
      "Verify your Google Analytics tracking code is installed correctly",
      "Check that UTM parameters are correctly formatted in the URL",
    ],
  },
  {
    q: "⚠️Data is fragmented across multiple sources",
    solutions: [
      "Use consistent lowercase for all UTM values",
      "Standardize naming conventions across your team",
      "Check for typos or variations in source/medium names",
    ],
  },
  {
    q: "⚠️URL is too long or broken",
    solutions: [
      "Use shorter, more concise parameter values",
      "Consider using a URL shortener for cleaner links",
      "Avoid special characters that may break URLs",
    ],
  },
  {
    q: "⚠️UTMs not tracking social media clicks",
    solutions: [
      "Some platforms strip UTM parameters - test before launching",
      "Use link shorteners that preserve UTM parameters",
      "Check that the link is copied correctly with all parameters",
    ],
  },
  {
    q: "⚠️Campaign names are confusing in reports",
    solutions: [
      "Use descriptive names that include date and purpose",
      "Create a naming convention document for your team",
      "Include the channel and campaign type in the name",
    ],
  },
  {
    q: "⚠️Cannot differentiate between ads or placements",
    solutions: [
      "Use utm_content to differentiate ad variations",
      "Include placement info in utm_content (e.g., sidebar, header)",
      "Create unique UTM links for each ad creative",
    ],
  },
];

const FAQS = [
  { q: "What is a UTM code?", a: "UTM (Urchin Tracking Module) codes are snippets of text added to the end of a URL to track the performance of marketing campaigns. They help you identify which sources, mediums, and campaigns drive traffic to your website in Google Analytics and other analytics tools." },
  { q: "What are the 5 UTM parameters?", a: "The 5 UTM parameters are: utm_source (identifies the traffic source like google or facebook), utm_medium (identifies the marketing medium like cpc or email), utm_campaign (identifies the specific campaign name), utm_content (differentiates similar content or links), and utm_term (identifies paid search keywords). Source, medium, and campaign are required; content and term are optional." },
  { q: "How do I create a UTM link?", a: "To create a UTM link: 1) Enter your destination URL, 2) Add utm_source (where traffic comes from), 3) Add utm_medium (how it reaches you), 4) Add utm_campaign (your campaign name), 5) Optionally add utm_content and utm_term. Our free UTM generator builds the URL automatically as you fill in the fields." },
  { q: "What should I put in utm_source?", a: "Use utm_source to identify where the traffic originates. Common examples: 'google' for Google Ads, 'facebook' for Facebook posts or ads, 'instagram' for Instagram, 'newsletter' for email campaigns, 'linkedin' for LinkedIn, or 'twitter' for X/Twitter. Be consistent with naming—always use lowercase and the same format." },
  { q: "What should I put in utm_medium?", a: "Use utm_medium to identify how the traffic reaches you. Common values: 'cpc' for paid search, 'social' for organic social posts, 'paid_social' for paid social ads, 'email' for email campaigns, 'banner' for display ads, 'affiliate' for affiliate links, or 'referral' for partner links." },
  { q: "What should I put in utm_campaign?", a: "Use utm_campaign to identify specific promotions or campaigns. Examples: 'spring_sale_2024', 'product_launch', 'black_friday', 'welcome_series', or 'brand_awareness'. Use descriptive names that help you identify the campaign later. Use underscores instead of spaces." },
  { q: "Are UTM parameters case-sensitive?", a: "Yes, UTM parameters are case-sensitive in most analytics tools. 'Facebook' and 'facebook' would appear as separate sources. Always use lowercase to avoid splitting your data. Our UTM generator automatically converts your input to lowercase to prevent this issue." },
  { q: "Do UTM codes affect SEO?", a: "UTM codes themselves don't directly affect SEO rankings. However, having many URLs with different UTM parameters could potentially create duplicate content issues. Use canonical tags on your landing pages to point to the main URL. Google is generally good at handling UTM parameters." },
  { q: "Where can I see UTM data in Google Analytics?", a: "In Google Analytics 4 (GA4), go to Reports > Acquisition > Traffic acquisition to see data by source, medium, and campaign. You can also create custom reports or explorations to analyze UTM parameters. Filter by specific campaigns to see their performance." },
  { q: "Can I use UTM parameters for social media?", a: "Yes, UTM parameters are essential for tracking social media marketing. Add them to links in your bio, posts, stories, and ads. This helps you measure which platforms, content types, and campaigns drive the most traffic and conversions from social media." },
  { q: "How long can a UTM URL be?", a: "While there's no strict limit, keep UTM URLs reasonably short. Most browsers support URLs up to 2,000 characters, but some email clients and social platforms may truncate long URLs. Use concise, descriptive parameter values. Consider using a URL shortener for very long links." },
  { q: "Should I use spaces in UTM parameters?", a: "No, avoid spaces in UTM parameters. Spaces get encoded as '%20' in URLs, making them harder to read in reports. Use underscores (_) or hyphens (-) instead. For example, use 'summer_sale' not 'summer sale'. Our generator automatically replaces spaces with underscores." },
  { q: "Is this UTM generator free?", a: "Yes, completely free with no signup required. Enter your URL and UTM parameters, and the tool generates your tracking URL instantly. Copy it and use it in your campaigns. No watermarks, no limits, no hidden fees." },
  { q: "What's the difference between utm_content and utm_term?", a: "utm_content differentiates similar content or links within the same ad—useful for A/B testing (e.g., 'blue_button' vs 'red_button'). utm_term is specifically for paid search keywords to identify which search terms triggered your ad. For social media, utm_content is more commonly used." },
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
/*  Section components                                                 */
/* ------------------------------------------------------------------ */

function UtmHeroIcon() {
  return (
    <svg
      role="img"
      aria-label="UTM Generator"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="48"
      height="48"
      className="mx-auto text-primary"
    >
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function GeneratorWidget() {
  const [url, setUrl] = React.useState("");
  const [source, setSource] = React.useState("");
  const [medium, setMedium] = React.useState("");
  const [campaign, setCampaign] = React.useState("");
  const [content, setContent] = React.useState("");
  const [term, setTerm] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  function sanitize(v: string) {
    return v.trim().toLowerCase().replace(/\s+/g, "_");
  }

  function buildUrl() {
    if (!url) return "";
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      const params = new URLSearchParams();
      const s = sanitize(source);
      const m = sanitize(medium);
      const c = sanitize(campaign);
      const ct = sanitize(content);
      const t = sanitize(term);
      if (s) params.set("utm_source", s);
      if (m) params.set("utm_medium", m);
      if (c) params.set("utm_campaign", c);
      if (ct) params.set("utm_content", ct);
      if (t) params.set("utm_term", t);
      const qs = params.toString();
      return qs ? `${u.origin}${u.pathname}${u.search ? u.search + "&" : "?"}${qs}` : url;
    } catch {
      return "";
    }
  }

  const generatedUrl = buildUrl();
  const canCopy = Boolean(generatedUrl);

  async function handleCopy() {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="rounded-xl bg-card text-card-foreground shadow p-6 border">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold">UTM Generator</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Fill in the fields below to build your tracking URL with UTM parameters.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="url" className="text-sm font-medium">
            Website URL
          </label>
          <input
            id="url"
            type="url"
            placeholder="https://example.com/page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">The full URL you want to track</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="source" className="text-sm font-medium">
            UTM Source <span className="text-red-500">*</span>
          </label>
          <input
            id="source"
            type="text"
            placeholder="google, facebook, newsletter"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">The referrer (e.g., google, instagram, newsletter)</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="medium" className="text-sm font-medium">
            UTM Medium <span className="text-red-500">*</span>
          </label>
          <input
            id="medium"
            type="text"
            placeholder="cpc, social, email"
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Marketing medium (e.g., cpc, social, email, banner)</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="campaign" className="text-sm font-medium">
            UTM Campaign <span className="text-red-500">*</span>
          </label>
          <input
            id="campaign"
            type="text"
            placeholder="spring_sale_2024"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Specific campaign name</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="text-sm font-medium">
            UTM Content
          </label>
          <input
            id="content"
            type="text"
            placeholder="header_link, blue_button"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Differentiates similar content (optional)</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="term" className="text-sm font-medium">
            UTM Term
          </label>
          <input
            id="term"
            type="text"
            placeholder="running+shoes"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Paid keyword (optional)</p>
        </div>

        <div className="rounded-lg bg-muted/40 p-4 border">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Generated Tracking URL
          </div>
          <div className="text-sm font-mono break-all bg-background rounded border p-3 min-h-[44px] mb-3">
            {generatedUrl || (
              <span className="text-muted-foreground italic">
                Fill in your URL and UTM parameters to generate a link
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={!canCopy}
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-black text-white hover:bg-zinc-800 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied!" : "Copy URL"}
          </button>
        </div>
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
              Powerful social media management
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Schedule posts, track performance, and collaborate with your team.
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

export function UtmGeneratorClient() {
  return (
    <>
      <Header />
      <main>
        {/* Hero + Generator + Promo */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <UtmHeroIcon />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">
                Free UTM Generator
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Create tracking URLs with UTM parameters to measure your marketing campaigns in Google Analytics. Free tool, no signup required.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <GeneratorWidget />
              <PromoCard />
            </div>
          </Container>
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-6">How It Works</h2>
            </div>
            <div className="space-y-3">
              {HOW_IT_WORKS.map((step) => (
                <Card key={step.step} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {step.step}
                    </div>
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

        {/* Popular Use Cases */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Popular Use Cases</h2>
              <p className="text-sm text-muted-foreground">
                How marketers, agencies, and creators use UTM tracking links
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {USE_CASES.map((u, i) => (
                <Card key={i} className="p-6 pb-3 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-primary mt-1">
                      <u.Icon className="w-5 h-5" />
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

        {/* Pro Tips */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">💡 Pro Tips</h2>
              <p className="text-sm text-muted-foreground">
                Proven strategies for better UTM tracking and analytics
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRO_TIPS.map((tip, i) => (
                <Card key={i} className="p-6 h-full">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                      {i + 1}
                    </div>
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

        {/* Common Issues & Solutions */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Common Issues &amp; Solutions</h2>
              <p className="text-sm text-muted-foreground">
                The most frequent UTM tracking problems — and how to solve them
              </p>
            </div>
            <CommonIssuesAccordion items={COMMON_ISSUES} />
          </Container>
        </section>

        {/* FAQs */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about UTM tracking codes and parameters
              </p>
            </div>
            <FaqAccordion items={FAQS} />
          </Container>
        </section>

        {/* Post smarter CTA */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-3xl">
            <Card className="p-8 text-center">
              <h3 className="font-semibold text-xl mb-2">Post smarter, not harder.</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Schedule, preview, and publish across all major platforms — from one simple dashboard.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-black text-white hover:bg-zinc-800 font-medium transition-colors"
              >
                Start 7-day Free Trial
                <ArrowRight className="size-4" />
              </Link>
            </Card>
          </Container>
        </section>

        {/* More from the community */}
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
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className="size-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <a
                        href="https://www.producthunt.com/products/postplanify/launches/postplanify"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="View on ProductHunt"
                      >
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