"use client";
import * as React from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  XCircle,
  Info,
  Star,
  ChevronDown,
  ArrowRight,
  ExternalLink,
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
    title: "Enter your desired Instagram username",
    body: "Type the username you want to check in the input field above. Our tool automatically validates the format against Instagram's username rules in real-time.",
  },
  {
    step: 2,
    title: "Review format validation results",
    body: "See instant feedback on whether your username meets Instagram's requirements: 30 character limit, allowed characters, and formatting rules.",
  },
  {
    step: 3,
    title: "Check availability on Instagram",
    body: "Click the 'Check on Instagram' button to verify if the username is available. If you see 'Sorry, this page isn't available'—it's likely available!",
  },
];

const USE_CASES = [
  { title: "Brand or Business Launch", body: "Check availability of your brand name before launching marketing materials, business cards, or website copy." },
  { title: "Personal Brand Building", body: "Reserve your real name or nickname across Instagram and other social platforms to build a consistent personal brand." },
  { title: "Influencer Account", body: "Secure your influencer or creator handle before scaling content and partnerships." },
  { title: "Product or Service Launch", body: "Verify product names are available on Instagram before launching marketing campaigns." },
  { title: "Event Promotion", body: "Reserve dedicated handles for conferences, weddings, or special events to share photos and updates." },
  { title: "Username Recovery", body: "Try variations and alternatives if your preferred handle is already taken by an inactive account." },
];

const BEST_PRACTICES = [
  "Keep it short and memorable (8-15 characters ideal)",
  "Use your real name or brand name for authenticity",
  "Make it easy to spell and pronounce",
  "Be consistent across all social platforms",
  "Consider using underscores for readability",
  "Claim your username early, even if not posting yet",
  "Don't use excessive numbers or special characters",
  "Don't include birth years that will date your profile",
  "Don't use hard-to-type character combinations",
  "Don't copy famous accounts with slight variations",
  "Don't use trademarked terms without permission",
  "Don't make it too generic (like \"user12345678\")",
];

const CHAR_RULES = [
  { text: "Maximum 30 characters allowed", valid: true },
  { text: "Letters (a-z), numbers (0-9) permitted", valid: true },
  { text: "Periods (.) and underscores (_) allowed", valid: true },
  { text: "Case-insensitive (converted to lowercase)", valid: true },
  { text: "No spaces or special characters", valid: false },
  { text: "Cannot start or end with a period", valid: false },
  { text: "No consecutive periods (..)", valid: false },
  { text: "Cannot use reserved words (instagram, admin)", valid: false },
];

const PRO_TIPS = [
  { title: "Check username availability across all platforms first", body: "Before committing to an Instagram username, verify it's available on TikTok, Twitter/X, YouTube, and your website domain. Consistent handles across platforms make your brand easier to find and strengthen your digital identity. Use namecheckr.com or similar tools to check multiple platforms at once." },
  { title: "Secure variations of your username to prevent impersonation", body: "Once you find your perfect username, consider creating accounts with common variations (with/without underscores, common misspellings) to prevent impersonators or competitors from confusing your audience. You can redirect these to your main account or keep them dormant." },
  { title: "Avoid numbers that look like letters for better memorability", body: "Usernames like 'j0hn_d0e' with zeros instead of O's or '1nstagram' with 1 instead of I are harder to remember and communicate verbally. When someone asks for your Instagram, 'john underscore doe' is clearer than explaining 'j-zero-h-n'. Stick to actual letters when possible." },
  { title: "Keep your username under 15 characters for easy tagging", body: "While Instagram allows 30 characters, shorter usernames are easier to tag in comments, remember, and fit in bios. The ideal length is 8-15 characters. If your brand name is longer, consider an abbreviation or acronym that's still recognizable." },
  { title: "Use underscores over periods for better readability", body: "Both periods and underscores are allowed, but underscores (john_doe) are generally more readable than periods (john.doe), especially on mobile devices where periods can be easy to miss. Underscores also work better in URLs and are less likely to be confused with sentence endings." },
  { title: "Test your username out loud before committing", body: "Say your username out loud five times fast. If you stumble or others can't spell it after hearing it once, it's too complex. A great Instagram username passes the bar test - someone can hear it once, remember it, type it correctly, and find your profile immediately." },
  { title: "Avoid using birth years in usernames", body: "Adding years like '_1995' or '92' to usernames dates your account and may not age well as your brand grows. If your name is taken, find creative alternatives using your interests, niche, or unique spellings rather than defaulting to birth years that lock you into a time period." },
  { title: "Consider SEO and searchability", body: "While Instagram search is limited, usernames do appear in Google search results. Including a relevant keyword in your username (like 'nyc_foodie' or 'fitness_coach') can help people find you through search engines and improve your profile's discoverability to your target audience." },
  { title: "Keep it timeless and brand-flexible", body: "Choose a username that won't feel outdated as your content or brand evolves. 'food_lover_2026' locks you in time, while 'food_stories' allows for growth into any food niche. Think about where your brand might be in 3-5 years before committing to a handle." },
  { title: "Make sure your username matches your email domain", body: "If you have a website domain like johndoe.com, ideally your Instagram handle should be johndoe too. Consistent handles across social media and your domain create a cohesive digital presence and make you easier to find across all platforms." },
  { title: "Document and store your login credentials safely", body: "Once you secure your perfect username, use a password manager like 1Password or Bitwarden to store your credentials. Recovery from a hacked Instagram account is much easier when you have your original email, username, and password stored securely." },
  { title: "Enable two-factor authentication immediately", body: "After securing a valuable username, enable 2FA right away. Popular or brandable usernames are targets for hackers. Use an authenticator app (Google Authenticator or Authy) rather than SMS for stronger security on accounts with valuable handles." },
];

const FAQS = [
  { q: "How do I check if an Instagram username is available?", a: "Enter your desired username in our free Instagram handle checker above. Our tool validates the format instantly and provides a direct link to check availability on Instagram. If you see 'Sorry, this page isn't available' on Instagram, the username is likely available. If you see a profile, it's already taken. You can also try searching the username in Instagram's app registration flow." },
  { q: "What are the rules for Instagram usernames?", a: "Instagram usernames must follow these rules: maximum 30 characters, only letters (a-z), numbers (0-9), periods (.), and underscores (_) are allowed. Usernames cannot start or end with a period, cannot have consecutive periods, and cannot contain spaces or special characters. Instagram usernames are case-insensitive, meaning 'JohnDoe' and 'johndoe' are treated as the same username." },
  { q: "Can I use special characters in my Instagram username?", a: "No, Instagram only allows letters (a-z), numbers (0-9), periods (.), and underscores (_) in usernames. Special characters like @, #, $, %, &, !, or emojis are not permitted. This limitation helps maintain clean, professional-looking handles and prevents confusion with hashtags or mentions." },
  { q: "Why is the Instagram username I want already taken?", a: "Popular usernames get claimed quickly, especially short or common words. Instagram doesn't release inactive usernames automatically, so even dormant accounts hold their handles. If your desired username is taken, try variations with underscores, numbers (sparingly), or creative alternatives that maintain brand recognition." },
  { q: "Can I get an Instagram username that's been inactive for years?", a: "Instagram has a process for inactive username reclamation. You can report an inactive account through Instagram's Help Center if it appears completely abandoned for an extended period. However, this process isn't guaranteed and can take months. It's better to choose an available alternative immediately." },
  { q: "How long does Instagram keep inactive usernames?", a: "Instagram generally keeps usernames reserved indefinitely, even if the account is inactive. There's no automatic release period. Some users report successfully reclaiming usernames from accounts inactive for 2+ years through Instagram's support, but this is not a guaranteed process and requires patience." },
  { q: "Can I change my Instagram username later?", a: "Yes, you can change your Instagram username anytime through your profile settings. However, your old username becomes available for others to claim immediately. If you build a brand around a username, changing it can break existing links and confuse followers. Choose carefully upfront." },
  { q: "Does my Instagram username affect SEO?", a: "Yes, Instagram usernames appear in Google search results and can influence discoverability. Including relevant keywords (like 'nyc_photographer' or 'vegan_baker') helps your profile rank for those searches. However, prioritize brand recognition and memorability over keyword stuffing for long-term success." },
  { q: "Is it better to have a . or _ in Instagram username?", a: "Both periods (.) and underscores (_) work, but underscores are generally preferred for readability, especially on mobile devices. Periods can be confused with sentence punctuation or email addresses. Underscores also work better in URLs and are clearer when communicated verbally." },
  { q: "Can two people have the same Instagram username?", a: "No, Instagram usernames are unique. If a username is taken, you'll need to choose a different one. Instagram treats usernames case-insensitively, meaning 'JohnDoe' and 'johndoe' cannot coexist. Once you claim a username, no one else can use it until you release it or your account is deleted." },
  { q: "What happens to old Instagram usernames?", a: "Old usernames remain attached to accounts even after long periods of inactivity. If a user changes their username, the old one is immediately released and can be claimed by anyone. There's no waiting period or auction process - it becomes available on a first-come, first-served basis." },
  { q: "How do I check Instagram username availability on mobile?", a: "Our Instagram handle checker works perfectly on mobile browsers. You can also check availability directly through the Instagram app by attempting to sign up with the username or by visiting instagram.com/username in your mobile browser. If the profile loads, it's taken; if you get an error page, it might be available." },
  { q: "Can I trademark an Instagram username?", a: "You can't trademark a username itself, but you can trademark your brand name which gives you legal grounds to request usernames that infringe on your trademark through Instagram's trademark complaint process. Register your trademark if you want strong protection for valuable brand handles on Instagram and other platforms." },
  { q: "Are short usernames better on Instagram?", a: "Yes, shorter usernames are generally better because they're easier to remember, type, tag in comments, and share verbally. While Instagram allows 30 characters, the sweet spot is 8-15 characters. Short, memorable handles command more perceived authority and are easier for word-of-mouth growth." },
];

const RELATED_RESOURCES = [
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
/*  Validation logic                                                    */
/* ------------------------------------------------------------------ */

function validateInstagramUsername(handle: string): { valid: boolean; checks: { text: string; ok: boolean }[]; sanitized: string } {
  const s = handle.toLowerCase();
  const reserved = ["instagram", "admin"];
  const checks = [
    { text: "1-30 characters", ok: s.length >= 1 && s.length <= 30, helper: s.length > 30 ? `Too long by ${s.length - 30} chars` : undefined },
    { text: "Only letters, numbers, periods, and underscores", ok: /^[a-z0-9._]*$/.test(s), helper: /[^a-z0-9._]/.test(s) ? "Invalid character detected" : undefined },
    { text: "Does not start or end with a period", ok: s.length === 0 || (!s.startsWith(".") && !s.endsWith(".")), helper: s.startsWith(".") ? "Cannot start with ." : s.endsWith(".") ? "Cannot end with ." : undefined },
    { text: "No consecutive periods (..)", ok: !s.includes(".."), helper: s.includes("..") ? "Found consecutive .." : undefined },
    { text: "Not a reserved word (instagram, admin)", ok: !reserved.includes(s), helper: reserved.includes(s) ? "Reserved word" : undefined },
  ];
  return { valid: checks.every((c) => c.ok), checks, sanitized: s };
}

/* ------------------------------------------------------------------ */
/*  Section components                                                 */
/* ------------------------------------------------------------------ */

function InstagramIcon() {
  return (
    <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    </div>
  );
}

function CheckerWidget() {
  const [handle, setHandle] = React.useState("");
  const validation = validateInstagramUsername(handle);
  const igUrl = handle ? `https://www.instagram.com/${validation.sanitized}/` : "";
  const isValid = validation.valid && handle.length > 0;
  const invalidChars = handle.match(/[^a-zA-Z0-9._]/g);

  return (
    <div className="rounded-xl bg-card text-card-foreground shadow p-6 border">
      <h2 className="text-xl font-semibold text-center mb-2">Check Instagram Username Availability</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Enter your desired username to validate format and check if it's available
      </p>

      <div className="space-y-2 max-w-md mx-auto">
        <label htmlFor="ig-handle" className="text-sm font-medium block text-center">
          Instagram Username
        </label>
        <div className="flex items-center rounded-md border border-input bg-transparent overflow-hidden focus-within:ring-1 focus-within:ring-ring">
          <span className="flex items-center justify-center px-3 text-muted-foreground bg-muted/40 h-9">@</span>
          <input
            id="ig-handle"
            type="text"
            placeholder="yourdesiredusername"
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/^@+/, ""))}
            maxLength={50}
            className="flex-1 h-9 bg-transparent px-3 py-1 text-sm focus-visible:outline-none"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{handle.length} / 30</span>
          <span>• Letters, numbers, periods, and underscores only</span>
        </div>
      </div>

      {handle.length > 0 && (
        <div className="mt-6 space-y-2 max-w-md mx-auto">
          {invalidChars && invalidChars.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive border border-destructive/30">
              Remove invalid character{invalidChars.length > 1 ? "s" : ""}:{" "}
              {invalidChars.map((c, i) => (
                <span key={i} className="inline-block px-1.5 py-0.5 bg-destructive/20 rounded mr-1 font-mono">{c === " " ? "space" : c}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 max-w-2xl mx-auto rounded-xl bg-card text-card-foreground shadow border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <h3 className="font-semibold">Instagram Username Rules</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {CHAR_RULES.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              {r.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              )}
              <span className="text-muted-foreground">{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      {handle.length > 0 && (
        <div className="mt-6 max-w-2xl mx-auto">
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full max-w-md mx-auto h-11 px-6 rounded-md bg-black text-white hover:bg-zinc-800 font-medium text-sm transition-colors"
          >
            Check on Instagram
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
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
            <p className="text-xl font-semibold">Powerful social media management</p>
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

/* ------------------------------------------------------------------ */
/*  Main client                                                         */
/* ------------------------------------------------------------------ */

export function InstagramHandleCheckerClient() {
  return (
    <>
      <Header />
      <main>
        {/* Hero + Widget + Promo */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <InstagramIcon />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">
                Instagram Handle Checker
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Check if your desired Instagram username is available instantly. Validate format, find alternatives, and claim the perfect handle for your brand or personal account.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <CheckerWidget />
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
                Common scenarios where checking handle availability matters
              </p>
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

        {/* Best Practices */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Instagram Username Best Practices</h2>
              <p className="text-sm text-muted-foreground">
                Do's and don'ts for picking the perfect Instagram handle
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {BEST_PRACTICES.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                  <span className="text-sm">{tip.replace(/^•\s*/, "")}</span>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Instagram Username Character Rules (full section) */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Instagram Username Character Rules</h2>
              <p className="text-sm text-muted-foreground">
                The official Instagram username format requirements
              </p>
            </div>
            <Card className="p-6">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {CHAR_RULES.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    {r.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm">{r.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Container>
        </section>

        {/* Pro Tips */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">💡 Pro Tips</h2>
              <p className="text-sm text-muted-foreground">
                Insider strategies for securing the perfect Instagram handle
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

        {/* FAQs */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about Instagram usernames
              </p>
            </div>
            <FaqAccordion items={FAQS} />
          </Container>
        </section>

        {/* Related Resources */}
        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Related Resources</h2>
              <p className="text-sm text-muted-foreground">
                More Instagram tools and guides to help you grow
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {RELATED_RESOURCES.map((r, i) => (
                <Link
                  key={i}
                  href={r.href}
                  className="block rounded-xl border bg-card text-card-foreground shadow hover:shadow-md transition-all duration-200 hover:border-primary/40 p-5 h-full"
                >
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{r.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-3">{r.desc}</p>
                </Link>
              ))}
            </div>
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
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-black text-white hover:bg-zinc-800 font-medium transition-colors">
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

        {/* Connect and publish */}
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
