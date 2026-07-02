import Link from "next/link";
import { Container } from "@/components/ui/container";

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/postplanify",
    path: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z",
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/PostPlanify",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61574002472316",
    path: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/postplanify",
    path: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@PostPlanify",
    path: "M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17M10 15l5-3-5-3z",
  },
];

const QUICK_LINKS = [
  { label: "Pricing", href: "/pricing" },
  { label: "Features", href: "/#features" },
  { label: "FAQ", href: "/#faq" },
  { label: "Blog", href: "https://postplanify.com/blog" },
  { label: "Help Center", href: "/help" },
  { label: "Affiliates (40% Lifetime)", href: "https://postplanify.com/affiliates" },
  { label: "Free Tools", href: "https://postplanify.com/tools" },
  { label: "Templates", href: "https://postplanify.com/templates" },
  { label: "Integrations", href: "https://postplanify.com/integrations" },
  { label: "Social Media Terms", href: "https://postplanify.com/social-media-terms" },
  { label: "Social Media Holidays", href: "https://postplanify.com/social-media-holidays" },
  { label: "Compare", href: "https://postplanify.com/compare" },
  { label: "Industries", href: "https://postplanify.com/industries" },
  { label: "Use Cases", href: "https://postplanify.com/use-cases" },
  { label: "Alternatives", href: "/alternatives" },
  { label: "Change Log", href: "https://postplanify.com/changelog" },
];

const COMPARE = [
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

const LEGAL = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Security", href: "/security" },
  { label: "GDPR", href: "/gdpr" },
  { label: "Cookie Policy", href: "/cookies" },
];

const PLATFORMS = [
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

const FEATURES = [
  { label: "Content Calendar", href: "/features/content-calendar" },
  { label: "Social Media Analytics", href: "/features/analytics" },
  { label: "Social Inbox", href: "/features/social-inbox" },
  { label: "Reporting", href: "/features/reporting" },
  { label: "Team Collaboration", href: "/features/team-collaboration" },
  { label: "Media Library", href: "/features/media-library" },
  { label: "AI Assistant", href: "/features/ai-assistant" },
  { label: "Link in Bio", href: "/features/link-in-bio" },
];

const AUTOMATION = [
  { label: "API Docs", href: "https://postplanify.com/docs" },
  { label: "MCP Integration", href: "https://postplanify.com/mcp" },
  { label: "MCP Setup Docs", href: "https://postplanify.com/mcp/docs" },
];

const FREE_TOOLS = [
  { label: "Instagram Engagement Calculator", href: "/tools/instagram-engagement-calculator" },
  { label: "Instagram Grid Maker", href: "/tools/instagram-grid-maker" },
  { label: "Instagram Carousel Splitter", href: "/tools/instagram-carousel-splitter" },
  { label: "TikTok Engagement Calculator", href: "/tools/tiktok-engagement-calculator" },
  { label: "YouTube Engagement Calculator", href: "/tools/youtube-engagement-calculator" },
  { label: "LinkedIn Engagement Calculator", href: "/tools/linkedin-engagement-calculator" },
  { label: "TikTok Safe Zone Checker", href: "/tools/tiktok-safe-zone-checker" },
  { label: "Instagram Safe Zone Checker", href: "/tools/instagram-safe-zone-checker" },
  { label: "YouTube Shorts Safe Zone Checker", href: "/tools/youtube-shorts-safe-zone-checker" },
  { label: "TikTok Money Calculator", href: "/tools/tiktok-money-calculator" },
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

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <span className="block font-medium">{title}</span>
      <nav className="mt-4 flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/10">
      <Container className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="text-xl font-semibold">
              PostPlanify
            </Link>
            <p className="text-sm text-muted-foreground">
              Social media management for agencies, teams and businesses.
            </p>
            <p className="text-sm text-muted-foreground">
              <b>Tumunuham LLC</b>
              <br />
              8 The Green, Suite A, Dover.
              <br />
              Delaware, USA. 19901.
              <br />
              <br />
              hasan@postplanify.com
            </p>
          </div>

          {/* Quick Links + Legal */}
          <div className="space-y-8">
            <FooterColumn title="Quick Links" links={QUICK_LINKS} />
            <FooterColumn title="Legal" links={LEGAL} />
          </div>

          {/* Platforms + Features + Automation */}
          <div className="space-y-8">
            <FooterColumn title="Platforms" links={PLATFORMS} />
            <FooterColumn title="Features" links={FEATURES} />
            <FooterColumn title="Automation" links={AUTOMATION} />
          </div>

          {/* Free Tools */}
          <FooterColumn title="Free Tools" links={FREE_TOOLS} />

          {/* Compare */}
          <FooterColumn title="Compare" links={COMPARE} />
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-start">
            © {new Date().getFullYear()} PostPlanify. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-2 items-center max-w-xl"></div>
          <div className="flex space-x-4">
            {SOCIAL_LINKS.map(({ label, href, path }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
