"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";

const TOP_LINKS = [
  { label: "Pricing", href: "/pricing" },
  { label: "What's New?", href: "/changelog" },
];

const FEATURE_LINKS = [
  { label: "Content Calendar", href: "/features/content-calendar" },
  { label: "Social Media Analytics", href: "/features/analytics" },
  { label: "Social Inbox", href: "/features/social-inbox" },
  { label: "Reporting", href: "/features/reporting" },
  { label: "Team Collaboration", href: "/features/team-collaboration" },
  { label: "Media Library", href: "/features/media-library" },
  { label: "AI Assistant", href: "/features/ai-assistant" },
  { label: "Link in Bio", href: "/features/link-in-bio" },
];

const SCHEDULER_LINKS = [
  { label: "Instagram Scheduler", href: "/instagram-scheduler" },
  { label: "Facebook Scheduler", href: "/facebook-scheduler" },
  { label: "YouTube Shorts Scheduler", href: "/youtube-scheduler" },
  { label: "TikTok Scheduler", href: "/tiktok-scheduler" },
  { label: "X (Twitter) Scheduler", href: "/x-scheduler" },
  { label: "LinkedIn Scheduler", href: "/linkedin-scheduler" },
  { label: "Threads Scheduler", href: "/threads-scheduler" },
  { label: "Pinterest Scheduler", href: "/pinterest-scheduler" },
  { label: "Bluesky Scheduler", href: "/bluesky-scheduler" },
  { label: "Google Business Scheduler", href: "/google-business-scheduler" },
];

const TOOL_LINKS = [
  { label: "Instagram Engagement Calculator", href: "/tools/instagram-engagement" },
  { label: "Instagram Grid Maker", href: "/tools/instagram-grid" },
  { label: "Instagram Carousel Splitter", href: "/tools/instagram-carousel-splitter" },
  { label: "TikTok Engagement Calculator", href: "/tools/tiktok-engagement" },
  { label: "YouTube Engagement Calculator", href: "/tools/youtube-engagement" },
  { label: "LinkedIn Engagement Calculator", href: "/tools/linkedin-engagement" },
  { label: "TikTok Safe Zone Checker", href: "/tools/tiktok-safe-zone" },
  { label: "Instagram Safe Zone Checker", href: "/tools/instagram-safe-zone" },
  { label: "YouTube Shorts Safe Zone Checker", href: "/tools/youtube-shorts-safe-zone" },
  { label: "TikTok Money Calculator", href: "/tools/tiktok-money" },
  { label: "UTM Generator", href: "/tools/utm-generator" },
  { label: "Emoji Translator", href: "/tools/emoji-translator" },
  { label: "Instagram Handle Checker", href: "/tools/instagram-handle-checker" },
  { label: "Instagram Image Resizer", href: "/tools/instagram-image-resizer" },
  { label: "Instagram Caption Generator", href: "/tools/instagram-caption-generator" },
  { label: "TikTok Caption Generator", href: "/tools/tiktok-caption-generator" },
  { label: "LinkedIn Post Generator", href: "/tools/linkedin-caption-generator" },
  { label: "Instagram Hashtag Generator", href: "/tools/instagram-hashtag-generator" },
  { label: "Instagram Bio Generator", href: "/tools/instagram-bio-generator" },
  { label: "Instagram Username Generator", href: "/tools/instagram-username-generator" },
  { label: "Instagram Feed Planner", href: "/tools/instagram-feed-planner" },
];

const ALTERNATIVE_LINKS = [
  { label: "Alternative to Buffer", href: "/alternative-to-buffer" },
  { label: "Alternative to Hootsuite", href: "/alternative-to-hootsuite" },
  { label: "Alternative to Later", href: "/alternative-to-later" },
  { label: "Alternative to Postbridge", href: "/alternative-to-postbridge" },
  { label: "Alternative to Postiz", href: "/alternative-to-postiz" },
  { label: "Alternative to Metricool", href: "/alternative-to-metricool" },
  { label: "Alternative to Sprout Social", href: "/alternative-to-sprout-social" },
  { label: "Alternative to SocialBee", href: "/alternative-to-socialbee" },
  { label: "Alternative to Planable", href: "/alternative-to-planable" },
  { label: "Alternative to SocialPilot", href: "/alternative-to-socialpilot" },
  { label: "Alternative to CoSchedule", href: "/alternative-to-coschedule" },
  { label: "Alternative to Loomly", href: "/alternative-to-loomly" },
  { label: "Alternative to Agorapulse", href: "/alternative-to-agorapulse" },
  { label: "Alternative to Sendible", href: "/alternative-to-sendible" },
  { label: "Alternative to Tailwind", href: "/alternative-to-tailwind" },
  { label: "Alternative to Publer", href: "/alternative-to-publer" },
  { label: "Alternative to Zoho Social", href: "/alternative-to-zoho-social" },
  { label: "Alternative to Iconosquare", href: "/alternative-to-iconosquare" },
  { label: "Alternative to Vista Social", href: "/alternative-to-vista-social" },
  { label: "Alternative to Pallyy", href: "/alternative-to-pallyy" },
  { label: "Alternative to NapoleonCat", href: "/alternative-to-napoleoncat" },
  { label: "Alternative to eClincher", href: "/alternative-to-eclincher" },
  { label: "Alternative to Sked Social", href: "/alternative-to-skedsocial" },
  { label: "Alternative to Statusbrew", href: "/alternative-to-statusbrew" },
  { label: "Alternative to Planoly", href: "/alternative-to-planoly" },
  { label: "Alternative to MeetEdgar", href: "/alternative-to-meetedgar" },
  { label: "Alternative to RecurPost", href: "/alternative-to-recurpost" },
  { label: "Alternative to Sprinklr", href: "/alternative-to-sprinklr" },
  { label: "Alternative to HeyOrca", href: "/alternative-to-heyorca" },
  { label: "Alternative to Hopper HQ", href: "/alternative-to-hopperhq" },
  { label: "Alternative to Post Planner", href: "/alternative-to-postplanner" },
  { label: "Alternative to Kontentino", href: "/alternative-to-kontentino" },
];

const RESOURCE_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "FAQ", href: "/#faq" },
  { label: "Blog", href: "/blog" },
  { label: "Help Center", href: "/help" },
  { label: "Affiliates (40% Lifetime)", href: "/affiliates" },
  { label: "Free Tools", href: "/tools" },
  { label: "Templates", href: "/templates" },
  { label: "Integrations", href: "/integrations" },
  { label: "Social Media Terms", href: "/social-media-terms" },
  { label: "Social Media Holidays", href: "/social-media-holidays" },
  { label: "Compare", href: "/compare" },
  { label: "Industries", href: "/industries" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Alternatives", href: "/alternatives" },
  { label: "Change Log", href: "/changelog" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Security", href: "/security" },
  { label: "GDPR", href: "/gdpr" },
  { label: "Cookie Policy", href: "/cookies" },
];

const INTEGRATION_LINKS = [
  { label: "Instagram", href: "/instagram-scheduler" },
  { label: "TikTok", href: "/tiktok-scheduler" },
  { label: "LinkedIn", href: "/linkedin-scheduler" },
  { label: "X (Twitter)", href: "/x-scheduler" },
  { label: "Facebook", href: "/facebook-scheduler" },
  { label: "YouTube", href: "/youtube-scheduler" },
  { label: "Threads", href: "/threads-scheduler" },
  { label: "Pinterest", href: "/pinterest-scheduler" },
  { label: "Bluesky", href: "/bluesky-scheduler" },
  { label: "Google Business Profile", href: "/google-business-scheduler" },
  { label: "Canva", href: "/integrations/canva" },
  { label: "Google Drive", href: "/integrations/google-drive" },
  { label: "Dropbox", href: "/integrations/dropbox" },
  { label: "Unsplash", href: "/integrations/unsplash" },
  { label: "ChatGPT", href: "/integrations/chatgpt" },
  { label: "Claude", href: "/integrations/claude" },
];

const MEGA_MENU = [
  { label: "Features", links: FEATURE_LINKS },
  { label: "Integrations", links: INTEGRATION_LINKS },
  { label: "Resources", links: RESOURCE_LINKS },
];

const HEADER_LINK =
  "inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground";

export function Header() {
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/images/postplanify/https___postplanify.com__next_image_url__2Flogo.png_w_64_q_75"
            alt="PostPlanify"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="text-xl font-semibold">PostPlanify</span>
        </Link>

        {/* Desktop nav — mega-menu triggers first, then top links */}
        <nav className="hidden lg:flex items-center gap-1">
          {MEGA_MENU.map((menu) => (
            <div
              key={menu.label}
              className="relative"
              onMouseEnter={() => setOpenMenu(menu.label)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-1 rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {menu.label}
                <ChevronDown className="size-3.5" />
              </button>
              {openMenu === menu.label && (
                <div className="absolute left-0 top-full z-50 min-w-[220px] rounded-md border bg-popover p-3 shadow-lg">
                  <ul className="grid gap-1">
                    {menu.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="block rounded px-2 py-1.5 text-sm hover:bg-accent"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {TOP_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth buttons (desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/login" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent">
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center justify-center rounded-md border border-foreground/20 px-4 text-sm font-medium hover:bg-accent transition-colors"
          >
            Try for free
          </Link>
          <Link
            href="https://cal.com/hasancagli/postplanify-demo-call"
            className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Schedule a demo
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent"
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {/* Mobile menu drawer — flat list of all nav links */}
      {open && (
        <div className="lg:hidden border-t bg-background max-h-[80vh] overflow-y-auto">
          <Container className="py-4">
            <nav className="flex flex-col gap-1">
              {MEGA_MENU.map((menu) => (
                <details key={menu.label} className="group">
                  <summary className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent cursor-pointer list-none flex items-center justify-between">
                    {menu.label}
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="ml-3 mt-1 flex flex-col gap-1 border-l pl-3">
                    {menu.links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="rounded-md px-3 py-1.5 text-xs hover:bg-accent"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ))}
              {TOP_LINKS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t flex flex-col gap-1">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  Try for free
                </Link>
                <Link
                  href="https://cal.com/hasancagli/postplanify-demo-call"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white"
                >
                  Schedule a demo
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}