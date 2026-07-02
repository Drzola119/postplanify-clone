"use client";
import * as React from "react";
import Link from "next/link";
import {
  Repeat,
  Check,
  CheckCircle2,
  Star,
  Copy,
  ChevronDown,
  AlertTriangle,
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
  {
    step: 1,
    title: "Choose your mode",
    body: "Select whether you want to convert text to emojis or translate emojis to text using the toggle switch.",
  },
  {
    step: 2,
    title: "Enter your content",
    body: "Type or paste your text or emoji sequence into the input box. Up to 500 characters supported.",
  },
  {
    step: 3,
    title: "Translate and copy",
    body: "Click Translate to get your result instantly. Copy it with one click and use it anywhere.",
  },
];

const USE_CASES = [
  {
    title: "Social Media Captions",
    body: "Add personality to your Instagram, TikTok, and Twitter posts with strategic emoji placement.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Marketing Content",
    body: "Make promotional content more engaging with eye-catching emoji translations.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    title: "Decode Messages",
    body: "Understand emoji-heavy messages from friends, customers, or social media comments.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Educational Content",
    body: "Create fun, memorable educational posts with visual emoji representations.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    title: "Creative Writing",
    body: "Add visual flair to stories, poems, and creative content with emoji translations.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    title: "Cross-cultural Communication",
    body: "Use universal emoji language to communicate across language barriers.",
    color: "bg-cyan-100 text-cyan-600",
  },
];

const PRO_TIPS = [
  { title: "Be specific with context", body: 'When converting text to emoji, include context words like emotions or actions. "I love pizza" works better than just "pizza" for getting expressive results.' },
  { title: "Use for caption hooks", body: "Create attention-grabbing social media hooks by translating your first line to emojis. Emoji-rich openings stand out in feeds." },
  { title: "Decode confusing messages", body: "Got a text full of emojis you don't understand? Paste the whole thing into emoji-to-text mode to get the meaning." },
  { title: "Mix text and emojis", body: "The best social media captions blend text and emojis naturally. Use the translation as a starting point, then edit for balance." },
  { title: "Check emoji meanings", body: "Emojis can have different meanings across cultures and generations. Use the translator to verify you're using emojis correctly." },
  { title: "Create emoji stories", body: "Write a short story or message, translate to emojis, and challenge friends to decode it. Fun for social media engagement." },
  { title: "Use for accessible content", body: "When adding emojis to captions, ensure they enhance rather than replace key words. Screen readers announce emojis, so balance is important." },
  { title: "Test across platforms", body: "Emojis can look different on iOS, Android, and web. Check how your emoji text appears on different devices before posting." },
  { title: "Use for visual breaks", body: "Strategic emoji placement creates visual breaks in long text. Translate key section headers to emojis for scannable content." },
  { title: "Avoid emoji overload", body: "More emojis don't mean more engagement. 2-5 well-placed emojis often perform better than walls of emoji characters." },
  { title: "Match emoji tone to content", body: "Professional content needs subtle emoji use. Casual content can be more playful. Match emoji density to your brand voice." },
  { title: "Create emoji reactions", body: "Use the translator to create emoji-only responses for social media engagement. Quick emoji replies can boost interaction rates." },
];

const COMMON_ISSUES = [
  {
    q: "⚠️Translation seems inaccurate",
    solutions: [
      "Add more context to your text - include emotions, actions, and subjects",
      "Break complex sentences into simpler phrases",
      "Try rephrasing if the result doesn't match your intent",
    ],
  },
  {
    q: "⚠️Some emojis not displaying correctly",
    solutions: [
      "Check that your device supports the latest Unicode emoji set",
      "Try viewing on a different device or browser",
      "Some older systems may not display newer emojis properly",
    ],
  },
  {
    q: "⚠️Emoji meaning seems different",
    solutions: [
      "Emoji meanings vary by culture and generation - verify before sharing",
      "Check emoji meaning in context with the full translation",
      "Some emojis have evolved meanings on different platforms",
    ],
  },
  {
    q: "⚠️Character limit reached",
    solutions: [
      "Keep input under 500 characters per translation",
      "Split longer content into multiple translations",
      "Focus on key phrases rather than translating everything",
    ],
  },
  {
    q: "⚠️Emojis not copying correctly",
    solutions: [
      "Use the copy button in our tool for best results",
      "Paste into a plain text field first, then copy again if needed",
      "Some apps may not support all emoji characters",
    ],
  },
  {
    q: "⚠️Translation too literal",
    solutions: [
      "AI captures concepts, not always exact words",
      "Edit the result to better match your tone",
      "Use the translation as a starting point, not final content",
    ],
  },
];

const FAQS = [
  { q: "What is an emoji translator?", a: "An emoji translator is an AI-powered tool that converts text into emojis or decodes emoji sequences into plain text. It helps you understand what emojis mean, create fun emoji messages, and translate emoji-heavy texts from friends or social media." },
  { q: "Is this emoji translator free?", a: "Yes, our emoji translator is completely free to use. No signup, no credit card, no hidden fees. Translate as many messages as you need without any cost." },
  { q: "How do I use the emoji translator?", a: "Simply toggle between \"Text to Emoji\" or \"Emoji to Text\" mode. Enter your text or emojis in the input box, then click Translate. The AI will instantly convert your input and you can copy the result with one click." },
  { q: "What does \"text to emoji\" mode do?", a: "Text to emoji mode converts your regular text into a fun emoji representation. The AI replaces words and concepts with relevant emojis while keeping the meaning clear. Great for making your messages more expressive and engaging." },
  { q: "What does \"emoji to text\" mode do?", a: "Emoji to text mode decodes emoji sequences into plain English. It interprets the meaning of each emoji and combines them into coherent sentences. Perfect for understanding confusing emoji messages." },
  { q: "Why would I need an emoji translator?", a: "Emoji translators are useful for understanding unclear emoji messages, creating fun social media captions, making texts more expressive, learning emoji meanings, and adding personality to your content without overdoing it." },
  { q: "How accurate is the emoji translation?", a: "Our AI-powered translator understands context and nuance, providing accurate translations for most emoji combinations. Complex or ambiguous sequences may have multiple interpretations, and the AI picks the most likely meaning." },
  { q: "Can I translate emoji messages from social media?", a: "Yes, you can paste any emoji message from Instagram, TikTok, Twitter, or any platform into our translator. It will decode the emoji sequence into readable text so you understand what it means." },
  { q: "Is there a character limit?", a: "Yes, you can translate up to 500 characters per request. This is enough for most messages and captions. For longer content, you can split it into multiple translations." },
  { q: "Does this work with all emojis?", a: "Yes, our translator supports all standard Unicode emojis including the latest additions. It can interpret single emojis, combinations, and complex emoji stories." },
  { q: "Can I use this for social media captions?", a: "Absolutely! Use the text to emoji mode to add emojis to your captions, or create entirely emoji-based captions for a fun, visual effect on Instagram, TikTok, and other platforms." },
  { q: "How many times can I translate per day?", a: "You can translate as often as you need. We have fair usage limits to prevent abuse (15 translations per 5 minutes), but normal use is unlimited." },
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

function EmojiTranslatorIcon() {
  return (
    <svg
      role="img"
      aria-label="Emoji Translator"
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
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

const EMOJI_DICT: Record<string, string> = {
  "love":"❤️", "happy":"😊", "sad":"😢", "fun":"🎉", "party":"🥳",
  "pizza":"🍕", "burger":"🍔", "coffee":"☕", "beer":"🍺", "wine":"🍷",
  "dog":"🐶", "cat":"🐱", "fish":"🐟", "bird":"🐦", "tree":"🌳",
  "sun":"☀️", "moon":"🌙", "star":"⭐", "fire":"🔥", "heart":"❤️",
  "cool":"😎", "rocket":"🚀", "car":"🚗", "plane":"✈️", "music":"🎵",
  "dance":"💃", "run":"🏃", "work":"💼", "phone":"📱", "computer":"💻",
  "home":"🏠", "money":"💰", "birthday":"🎂", "school":"🎓", "book":"📚",
  "thank you":"🙏", "thanks":"🙏", "yes":"✅", "no":"❌", "ok":"👌",
  "good":"👍", "bad":"👎", "wow":"🤩", "laugh":"😂", "cry":"😭",
};

function translateTextToEmoji(text: string): string {
  if (!text.trim()) return "";
  let result = text;
  // Replace longer phrases first
  const phrases = Object.keys(EMOJI_DICT).filter((k) => k.includes(" ")).sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    const re = new RegExp(`\\b${phrase}\\b`, "gi");
    result = result.replace(re, EMOJI_DICT[phrase]);
  }
  const words = Object.keys(EMOJI_DICT).filter((k) => !k.includes(" ")).sort((a, b) => b.length - a.length);
  for (const w of words) {
    const re = new RegExp(`\\b${w}\\b`, "gi");
    result = result.replace(re, EMOJI_DICT[w]);
  }
  // For non-mapped text, sprinkle emoji accents
  return result;
}

const EMOJI_MEANINGS: Record<string, string> = {
  "❤️":"love", "😊":"happy", "😢":"sad", "🎉":"celebration", "🥳":"party",
  "🍕":"pizza", "🍔":"burger", "☕":"coffee", "🍺":"beer", "🍷":"wine",
  "🐶":"dog", "🐱":"cat", "🐟":"fish", "🐦":"bird", "🌳":"tree",
  "☀️":"sunny", "🌙":"night", "⭐":"star", "🔥":"fire",
  "😎":"cool", "🚀":"rocket", "🚗":"car", "✈️":"plane", "🎵":"music",
  "💃":"dancing", "🏃":"running", "💼":"work", "📱":"phone", "💻":"computer",
  "🏠":"home", "💰":"money", "🎂":"birthday", "🎓":"school", "📚":"books",
  "🙏":"thank you", "✅":"yes", "❌":"no", "👌":"ok", "👍":"good",
  "👎":"bad", "🤩":"wow", "😂":"laughing", "😭":"crying",
};

function translateEmojiToText(text: string): string {
  if (!text.trim()) return "";
  // Find emoji sequences (handles compound emojis)
  const emojiRegex = /(?:\p{Extended_Pictographic}(?:‍\p{Extended_Pictographic})*)/gu;
  const matches = [...text.matchAll(emojiRegex)];
  if (matches.length === 0) return "No emojis detected in your input.";
  const parts: string[] = [];
  let last = 0;
  for (const m of matches) {
    if (m.index > last) {
      const literal = text.slice(last, m.index).trim();
      if (literal) parts.push(literal);
    }
    const e = m[0];
    parts.push(EMOJI_MEANINGS[e] || e);
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    const tail = text.slice(last).trim();
    if (tail) parts.push(tail);
  }
  const capitalized = parts.map((p, i) => i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p);
  return capitalized.join(" ") + ".";
}

function TranslatorWidget() {
  const [mode, setMode] = React.useState<"text2emoji" | "emoji2text">("text2emoji");
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const MAX = 500;

  function handleTranslate() {
    if (!input.trim()) return;
    if (mode === "text2emoji") {
      setOutput(translateTextToEmoji(input));
    } else {
      setOutput(translateEmojiToText(input));
    }
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const placeholder = mode === "text2emoji"
    ? "Enter text to convert to emojis..."
    : "Paste emojis here to translate...";

  return (
    <div className="rounded-xl bg-card text-card-foreground shadow p-6 border">
      <div className="flex items-center mb-4 bg-muted rounded-lg p-1">
        <button
          type="button"
          onClick={() => { setMode("text2emoji"); setOutput(""); setInput(""); }}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "text2emoji" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Text → Emoji
        </button>
        <button
          type="button"
          onClick={() => { setMode("emoji2text"); setOutput(""); setInput(""); }}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "emoji2text" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Emoji → Text
        </button>
      </div>

      <div className="space-y-2">
        <textarea
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX))}
          rows={6}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{input.length} / {MAX}</span>
        </div>

        <button
          type="button"
          onClick={handleTranslate}
          disabled={!input.trim()}
          className="inline-flex items-center justify-center w-full h-11 px-4 rounded-md bg-black text-white hover:bg-zinc-800 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Translate
        </button>

        {output && (
          <div className="rounded-lg bg-muted/40 p-4 border mt-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Result
            </div>
            <div className="text-base leading-relaxed break-words bg-background rounded border p-3 min-h-[60px] mb-3">
              {output}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-black text-white hover:bg-zinc-800 font-medium text-sm transition-colors"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied!" : "Copy Result"}
            </button>
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

export function EmojiTranslatorClient() {
  return (
    <>
      <Header />
      <main>
        {/* Hero + Generator + Promo */}
        <section className="py-12 sm:py-16 px-4">
          <Container className="max-w-6xl">
            <div className="text-center mb-10">
              <EmojiTranslatorIcon />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-4">
                Emoji Translator
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Convert text to emojis or decode emoji messages to text. Free AI-powered tool that helps you understand and create emoji content.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <TranslatorWidget />
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
                How creators and marketers use emoji translation
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {USE_CASES.map((u, i) => (
                <Card key={i} className="p-6 pb-3 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${u.color} flex items-center justify-center`}>
                      <span className="text-lg">✨</span>
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
                Get the most out of emoji translation in your content
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
                Common emoji translation problems — and how to solve them
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
                Everything you need to know about emoji translation
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
