import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Play,
  Star,
  Check,
  ChevronDown,
  ChevronRight,
  Smartphone,
  LayoutGrid,
  Eye,
  MessagesSquare,
  Users,
  TrendingUp,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";
import { Card } from "@/components/ui/card";
import { SectionHeading, SectionSubtitle } from "@/components/ui/section-heading";
import { PricingToggle } from "@/components/marketing/PricingToggle";
import { DemoVideoSection } from "@/components/marketing/DemoVideoSection";
import {
  TikTokIcon,
  InstagramIcon,
  FacebookIcon,
  XIcon,
  YouTubeIcon,
  LinkedInIcon,
  ThreadsIcon,
} from "@/data/platform-icons";

const WHY_CHOOSE_ICONS: { Icon: React.ComponentType<{ className?: string }>; bg: string; text: string }[] = [
  { Icon: Calendar, bg: "bg-blue-100", text: "text-blue-600" },
  { Icon: Smartphone, bg: "bg-violet-100", text: "text-violet-600" },
  { Icon: LayoutGrid, bg: "bg-emerald-100", text: "text-emerald-600" },
  { Icon: Eye, bg: "bg-amber-100", text: "text-amber-600" },
  { Icon: MessagesSquare, bg: "bg-rose-100", text: "text-rose-600" },
  { Icon: Users, bg: "bg-cyan-100", text: "text-cyan-600" },
  { Icon: Calendar, bg: "bg-blue-100", text: "text-blue-600" },
  { Icon: Smartphone, bg: "bg-violet-100", text: "text-violet-600" },
  { Icon: LayoutGrid, bg: "bg-emerald-100", text: "text-emerald-600" },
];

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type MarketingPageData = {
  slug: string;
  category: "Features" | "Schedulers";
  eyebrow?: string;
  heroTitle: React.ReactNode;
  heroSubtitle: string;
  heroBullets?: string[];
  heroImage?: { src: string; alt: string };
  heroCtaPrimary?: { label: string; href: string };
  heroCtaSecondary?: { label: string; href: string };
  problemHeading: string;
  problemSubheading?: string;
  problemIntro: string;
  problemWithout: string[];
  problemWith: string[];
  featuresGrid: {
    heading: string;
    subheading?: string;
    layout?: "icons" | "tiles";
    image?: { src: string; alt: string };
    items: { tag?: string; title: string; description: string; image?: string; href?: string; icon?: React.ComponentType<{ className?: string }>; iconBg?: string; iconText?: string; tileBg?: string; tileBorder?: string; tileRing?: string; tileTagBg?: string; tileTagText?: string; tileTitleText?: string; tileBodyText?: string; colSpan?: string; horizontal?: boolean }[];
  };
  demoVideo?: {
    youtubeId: string;
    title?: string;
    duration?: string;
  };
  bottomCta?: {
    heading: string;
    subheading?: string;
    ctaLabel?: string;
    ctaHref?: string;
    image?: { src: string; alt: string };
  };
  howItWorks?: {
    heading: string;
    subheading?: string;
    steps: { title: string; description: string }[];
  };
  useCases?: {
    heading: string;
    subheading?: string;
    items: { title: string; description: string }[];
  };
  whyChoose: {
    heading: string;
    subheading: string;
    blocks: { title: string; description: string; bullets?: string[]; icon?: React.ComponentType<{ className?: string }>; iconBg?: string; iconText?: string }[];
    ctaLabel?: string;
    layout?: "cards" | "prose";
  };
  whatYouCanSchedule?: {
    heading: string;
    subheading: string;
    items: { title: string; description: string }[];
  };
  whatYouCanTrack?: {
    heading: string;
    subheading?: string;
    items: { title: string; icon?: React.ComponentType<{ className?: string }> }[];
  };
  whyItMatters?: {
    heading: string;
    subheading?: string;
    blocks: { title: string; description: string }[];
  };
  audiences?: {
    heading: string;
    subheading?: string;
    items: { title: string; description: string }[];
  };
  repurposeAcrossPlatforms?: {
    heading: string;
    subheading?: string;
    items: { label: string; href: string }[];
  };
  seoContent?: {
    heading: string;
    paragraphs: string[];
    subSections?: { heading: string; body: string | string[] }[];
  };
  midCta?: {
    heading: string;
    subheading: string;
    bullets: string[];
    ctaLabel: string;
    ctaHref: string;
  };
  faq?: { q: string; a: string }[];
  relatedResources?: {
    heading: string;
    subheading: string;
    groups: { title: string; items: { label: string; href: string }[] }[];
  };
};

/* ------------------------------------------------------------------ */
/*  Static data shared across marketing pages                        */
/* ------------------------------------------------------------------ */

const AVATARS = [
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Ffrank_benton.jpeg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fsam_cranq.avif_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Faleksandr_heinlaid.avif_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fshaheer.jpg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fmonta.jpg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Foguz_doruk.jpg_w_96_q_75",
];

const LOGOS = [
  "shopmeagent_com",
  "elevatecom_com_au",
  "ameco_group_com",
  "udydigital_com",
  "getnorms_com",
  "arcdigital_ro",
  "craftix_io",
  "ferociti_net",
  "eles_com_br",
  "globtechllc_com",
  "acarograf_com",
  "getlogical_co_uk",
  "globaltalent_co",
  "plenavitashift_com",
  "aprovaleges_com_br",
  "nexposuremedia_com",
  "cotwrealty_com",
  "dreamdestination_agency",
  "techdots_dev",
  "wellorganised_com_au",
  "scriptsee_io",
];

const TESTIMONIALS = [
  {
    name: "Andreas Luisa",
    company: "arcdigital.ro",
    metric: "14 Clients, 35 Social Accounts",
    quote:
      "I run an agency and PostPlanify has been a game-changer. The team listens to feedback and ships features fast. I rarely see that level of responsiveness in this space.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Farcdigital_ro.png_w_256_q_75",
  },
  {
    name: "Eric Bai",
    role: "Founder & CEO",
    company: "shopmeagent.com",
    metric: "10 Social Accounts, 2 Countries",
    quote:
      "We manage social across China and the US from a single dashboard. The calendar view, approvals, and multi-platform scheduling make this easy.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fshopmeagent_com.png_w_256_q_75",
  },
  {
    name: "Umut Yorulmaz",
    company: "udydigital.com",
    metric: "17 Social Accounts, 2 Brands",
    quote:
      "The team ships feature requests within 24 hours. We're scheduling 95 posts per day across 17 accounts without breaking a sweat.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fudydigital_com.png_w_256_q_75",
  },
];

const COMPARISON_PAGES = [
  { label: "PostPlanify vs Buffer", href: "/alternative-to-buffer" },
  { label: "PostPlanify vs Hootsuite", href: "/alternative-to-hootsuite" },
  { label: "PostPlanify vs Later", href: "/alternative-to-later" },
  { label: "PostPlanify vs Sprout Social", href: "/alternative-to-sprout-social" },
  { label: "PostPlanify vs SocialPilot", href: "/alternative-to-socialpilot" },
  { label: "PostPlanify vs Agorapulse", href: "/alternative-to-agorapulse" },
  { label: "PostPlanify vs Sendible", href: "/alternative-to-sendible" },
  { label: "PostPlanify vs CoSchedule", href: "/alternative-to-coschedule" },
  { label: "PostPlanify vs Publer", href: "/alternative-to-publer" },
  { label: "PostPlanify vs Vista Social", href: "/alternative-to-vista-social" },
];

const INDUSTRY_PAGES = [
  { label: "Agencies", href: "/industries/agencies" },
  { label: "Restaurants", href: "/industries/restaurants" },
  { label: "Real Estate", href: "/industries/real-estate" },
  { label: "E-commerce", href: "/industries/ecommerce" },
  { label: "Coaches and Creators", href: "/industries/coaches" },
  { label: "SaaS", href: "/industries/saas" },
  { label: "Local Businesses", href: "/industries/local-business" },
  { label: "Nonprofits", href: "/industries/nonprofits" },
];

const ARTICLE_PAGES = [
  { label: "Best Time to Post on Instagram in 2026", href: "/blog/best-time-to-post-instagram" },
  { label: "How to Schedule Threads Posts", href: "/blog/schedule-threads-posts" },
  { label: "10 Instagram Reels Ideas for 2026", href: "/blog/instagram-reels-ideas" },
  { label: "How Often to Post on TikTok", href: "/blog/how-often-post-tiktok" },
  { label: "Social Media KPIs That Matter", href: "/blog/social-media-kpis" },
  { label: "LinkedIn Algorithm 2026 Explained", href: "/blog/linkedin-algorithm" },
  { label: "YouTube Shorts vs Long-Form Strategy", href: "/blog/youtube-shorts-strategy" },
  { label: "Best Link in Bio Tools Compared", href: "/blog/link-in-bio-tools" },
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
  { label: "LinkedIn Caption Generator", href: "/tools/linkedin-caption-generator" },
  { label: "Instagram Hashtag Generator", href: "/tools/instagram-hashtag-generator" },
  { label: "Instagram Bio Generator", href: "/tools/instagram-bio-generator" },
  { label: "Instagram Username Generator", href: "/tools/instagram-username-generator" },
  { label: "Instagram Feed Planner", href: "/tools/instagram-feed-planner" },
];

/* ------------------------------------------------------------------ */
/*  Helper components                                                 */
/* ------------------------------------------------------------------ */

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LogoMarquee() {
  return (
    <div className="relative mt-10 w-full overflow-hidden gradient-mask-x">
      <div className="flex w-max animate-marquee gap-12 items-center">
        {[...LOGOS, ...LOGOS].map((slug, i) => {
          const ext = slug.endsWith("_agency") ? "jpg" : "png";
          const src = `/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2F${slug}.${ext}_w_256_q_75`;
          return (
            <div key={i} className="relative h-12 w-32 shrink-0">
              <Image
                src={src}
                alt={slug}
                fill
                className="object-contain rounded-md"
                sizes="128px"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                              */
/* ------------------------------------------------------------------ */

function PageHero({ data }: { data: MarketingPageData }) {
  return (
    <section className="overflow-hidden bg-gradient-to-b from-background to-background/95 py-4">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            {data.eyebrow && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs sm:text-sm">
                <span className="text-muted-foreground">{data.eyebrow}</span>
              </div>
            )}
            <h1 className="text-[36px] sm:text-[42px] lg:text-[48px] font-bold leading-[1.0] tracking-[-1.2px]">
              {data.heroTitle}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              {data.heroSubtitle}
            </p>
            {data.heroBullets && data.heroBullets.length > 0 && (
              <ul className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-sm">
                {data.heroBullets.map((b) => (
                  <li key={b} className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Check className="size-4 text-emerald-600" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <CTAButton
                Icon={Sparkles}
                size="xl"
                href={data.heroCtaPrimary?.href ?? "/signup"}
                className="w-full sm:w-auto sm:min-w-[200px]"
              >
                {data.heroCtaPrimary?.label ?? "Try it for free"}
              </CTAButton>
              {data.heroCtaSecondary && (
                <Link
                  href={data.heroCtaSecondary.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto sm:min-w-[200px] h-[52px] px-8 text-base rounded-md border hover:bg-accent transition-colors"
                >
                  <Calendar className="size-4" />
                  {data.heroCtaSecondary.label}
                </Link>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {AVATARS.slice(0, 6).map((src, i) => (
                  <div key={i} className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-background">
                    <Image src={src} alt="User" fill className="object-cover" sizes="40px" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className="flex text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </div>
                <span className="ml-1">Trusted by 2150+ businesses</span>
              </div>
            </div>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900">
            <Image
              src={data.heroImage?.src ?? "/images/postplanify/postplanify-dashboard.png"}
              alt={data.heroImage?.alt ?? "PostPlanify dashboard"}
              fill
              priority
              fetchPriority="high"
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>

        <p className="mt-12 text-center text-xs uppercase tracking-widest text-muted-foreground">
          Trusted by agencies and brands in 30+ countries
        </p>
        <LogoMarquee />
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Problem / Solution                                                */
/* ------------------------------------------------------------------ */

function ProblemSection({ data }: { data: MarketingPageData }) {
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <div className="max-w-3xl mx-auto text-center mb-10">
          <SectionHeading>{data.problemHeading}</SectionHeading>
          {data.problemSubheading && (
            <SectionSubtitle>{data.problemSubheading}</SectionSubtitle>
          )}
          <p className="mt-6 text-base text-muted-foreground">{data.problemIntro}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {/* Without */}
          <Card className="p-6 lg:p-8 bg-rose-50/50 border-rose-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-4">
              Without a tool like this
            </h3>
            <ul className="space-y-3">
              {data.problemWithout.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 size-5 rounded-full bg-rose-100 text-rose-700 inline-flex items-center justify-center text-xs">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* With */}
          <Card className="p-6 lg:p-8 bg-emerald-50/50 border-emerald-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-4">
              With PostPlanify
            </h3>
            <ul className="space-y-3">
              {data.problemWith.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonials                                                      */
/* ------------------------------------------------------------------ */

function TestimonialsSection() {
  return (
    <section className="py-16 lg:py-20 bg-muted/30">
      <Container>
        <SectionHeading>What our customers say</SectionHeading>
        <SectionSubtitle>Real agencies. Real numbers. Real results.</SectionSubtitle>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border bg-muted shrink-0">
                  <Image src={t.avatar} alt={t.name} fill className="object-cover" sizes="48px" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.company}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs">
                <div className="flex text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-muted-foreground">{t.metric}</span>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features grid (cross-link to other features/platforms)           */
/* ------------------------------------------------------------------ */

function HowItWorksSection({ data }: { data: MarketingPageData }) {
  if (!data.howItWorks) return null;
  return (
    <section className="dark relative overflow-hidden bg-[rgb(3,7,18)] py-20 mt-16 mb-16 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[120px]"></div>
      </div>
      <Container className="relative max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white">{data.howItWorks.heading}</h2>
        </div>
        <div className="relative flex flex-col sm:flex-row gap-6">
          <div className="hidden sm:block absolute top-6 left-0 right-0 h-px bg-white/15"></div>
          {data.howItWorks.steps.map((step, i) => (
            <div key={i} className="flex-1 relative">
              <div className="flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-3 sm:text-center">
                <div className="relative z-10 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shrink-0 ring-4 ring-[rgb(3,7,18)]">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1 text-white">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function UseCasesSection({ data }: { data: MarketingPageData }) {
  if (!data.useCases) return null;
  return (
    <section className="py-20 mt-16 mb-16 bg-[rgb(3,7,18)] text-white">
      <Container>
        <h2 className="text-[36px] font-bold leading-[40px] text-center text-white">
          {data.useCases.heading}
        </h2>
        {data.useCases.subheading && (
          <p className="mt-3 text-base md:text-lg text-white/70 text-center max-w-2xl mx-auto">{data.useCases.subheading}</p>
        )}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {data.useCases.items.map((item) => (
            <div key={item.title} className="p-6 rounded-xl border border-white/10 bg-white/[0.04]">
              <h3 className="text-xl font-bold leading-7 mb-2 text-white">{item.title}</h3>
              <p className="text-sm text-white/70">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FeaturesGridSection({ data }: { data: MarketingPageData }) {
  const items = data.featuresGrid.items;
  const layout = data.featuresGrid.layout;

  if (layout === "tiles") {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-background/95 scroll-mt-10" id="features">
        <Container>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="relative inline-block">
                Everything
                <svg className="absolute -bottom-3 left-0 w-full h-5 text-green-600" viewBox="0 0 200 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12 L45 8 L55 12 L95 8 L105 12 L145 8 L155 12 L195 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              </span>{" "}you need to <span className="bg-blue-600 text-white px-2 rounded">manage social media</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
            {items.map((f, i) => {
              const span = f.colSpan ?? (i === 0 || i === 3 ? "lg:col-span-7" : i === 2 ? "lg:col-span-12" : "lg:col-span-5");
              return (
                <div key={f.title} className={span}>
                  <a className={`relative rounded-2xl md:rounded-3xl overflow-hidden h-full ${f.tileBg ?? "bg-blue-950"} border ${f.tileBorder ?? "border-blue-900/40"} ${f.horizontal ? "grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-0" : "flex flex-col justify-center"} transition-transform hover:scale-[1.01]`} href={f.href ?? "#"}>
                    <div className={`p-6 md:p-8 flex flex-col justify-center ${f.horizontal ? "order-2 lg:order-1" : ""}`}>
                      {f.tag && (
                        <span className={`inline-flex items-center w-fit px-3 py-1 rounded-full text-sm font-semibold tracking-wider uppercase ${f.tileTagBg ?? "bg-blue-800/50"} ${f.tileTagText ?? "text-blue-100"} mb-5`}>
                          {f.tag}
                        </span>
                      )}
                      <h3 className={`text-2xl md:text-3xl font-bold ${f.tileTitleText ?? "text-white"} mb-3 leading-tight`}>{f.title}</h3>
                      <p className={`text-md md:text-xl ${f.tileBodyText ?? "text-blue-100/80"} leading-relaxed`}>{f.description}</p>
                    </div>
                    {f.image && (
                      <div className={`relative ${f.horizontal ? "order-1 lg:order-2 p-3 md:p-4" : "mt-auto px-3 pb-3 md:px-4 md:pb-4"}`}>
                        <div className={`rounded-xl md:rounded-2xl overflow-hidden ring-1 ${f.tileRing ?? "ring-blue-800/30"}`}>
                          <div className="w-full h-auto object-contain">
                            <img alt={f.title} className="object-cover w-full h-full rounded-lg shadow-md" loading="lazy" src={f.image} />
                          </div>
                        </div>
                      </div>
                    )}
                  </a>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    );
  }

  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);
  const fgImage = data.featuresGrid.image;
  return (
    <section className="py-14">
      <Container>
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            {data.featuresGrid.heading}
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-4">
            {items.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                {f.icon && (
                  <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${f.iconBg ?? "bg-blue-100"}`}>
                    <f.icon className={`w-5 h-5 ${f.iconText ?? "text-blue-600"}`} />
                  </div>
                )}
                <div>
                  {f.tag && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      {f.tag}
                    </p>
                  )}
                  <h3 className="text-base font-semibold text-foreground mb-1 leading-6">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
          {fgImage && (
            <div className="rounded-2xl bg-blue-950 border border-blue-900/40 p-2 sm:p-3 shadow-md">
              <div className="rounded-xl overflow-hidden ring-1 ring-blue-800/30">
                <img alt={fgImage.alt} loading="lazy" className="w-full h-auto block" src={fgImage.src} />
              </div>
            </div>
          )}
          {!fgImage && (
            <div className="flex flex-col gap-4">
              {right.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  {f.icon && (
                    <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${f.iconBg ?? "bg-blue-100"}`}>
                      <f.icon className={`w-5 h-5 ${f.iconText ?? "text-blue-600"}`} />
                    </div>
                  )}
                  <div>
                    {f.tag && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {f.tag}
                      </p>
                    )}
                    <h3 className="text-base font-semibold text-foreground mb-1 leading-6">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Live stats                                                        */
/* ------------------------------------------------------------------ */

function LiveStatsSection() {
  return (
    <section className="py-8 relative overflow-hidden">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="col-span-2 md:col-span-1 md:row-span-2 relative group">
            <div className="h-full min-h-[200px] md:min-h-[280px] rounded-3xl bg-gradient-to-br from-gray-900 to-black p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Live count
                </div>
              </div>
              <div className="relative">
                <p className="text-7xl font-bold text-white tabular-nums tracking-tight">48165+</p>
                <p className="text-white/80 text-lg mt-2 font-medium">Posts published</p>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="h-full min-h-[130px] rounded-3xl bg-gradient-to-br from-indigo-700 to-violet-800 p-5 sm:p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-indigo-500/20 transition-shadow duration-300">
              <div className="flex flex-wrap items-center gap-2 text-white/90">
                <TikTokIcon className="w-4 h-4" />
                <InstagramIcon className="w-4 h-4" />
                <FacebookIcon className="w-4 h-4" />
                <XIcon className="w-4 h-4" />
                <YouTubeIcon className="w-4 h-4" />
                <LinkedInIcon className="w-4 h-4" />
                <ThreadsIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-4xl font-bold text-white tabular-nums">10</p>
                <p className="text-white/80 text-sm mt-1">Platforms supported</p>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="h-full min-h-[130px] rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-800 p-5 sm:p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow duration-300">
              <div className="flex items-center gap-1 text-yellow-300">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <div>
                <p className="text-4xl font-bold text-white tabular-nums">1511+</p>
                <p className="text-white/80 text-sm mt-1">Social accounts connected</p>
              </div>
            </div>
          </div>
          <div className="col-span-2 relative">
            <div className="rounded-3xl bg-gray-900 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {AVATARS.slice(0, 6).map((src, i) => (
                    <div key={i} className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-gray-900">
                      <Image src={src} alt="User" fill className="object-cover" sizes="36px" />
                    </div>
                  ))}
                </div>
                <p className="text-white font-medium text-base">
                  Join 2150+ users <span className="text-gray-400 text-sm ml-1">who save time every week</span>
                </p>
              </div>
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Why Choose (deep feature blocks)                                  */
/* ------------------------------------------------------------------ */

function WhyChooseSection({ data }: { data: MarketingPageData }) {
  const isProse = data.whyChoose.layout === "prose";
  return (
    <section className={isProse ? "py-20" : "py-20"}>
      <Container>
        {!isProse && (
          <>
            <SectionHeading>{data.whyChoose.heading}</SectionHeading>
            <SectionSubtitle>{data.whyChoose.subheading}</SectionSubtitle>
          </>
        )}

        {isProse ? (
          <div className="space-y-28">
            {data.whyChoose.blocks.map((b, i) => {
              const Icon = b.icon ?? WHY_CHOOSE_ICONS[i % WHY_CHOOSE_ICONS.length].Icon;
              const bg = b.iconBg ?? WHY_CHOOSE_ICONS[i % WHY_CHOOSE_ICONS.length].bg;
              const text = b.iconText ?? WHY_CHOOSE_ICONS[i % WHY_CHOOSE_ICONS.length].text;
              const isReversed = i % 2 === 1;
              return (
                <div key={b.title} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                  <div className={isReversed ? "lg:order-2 lg:text-right" : "lg:order-1"}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center lg:hidden mb-4 ${bg}`}>
                      <Icon className={`size-6 ${text}`} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                      {b.title}
                    </h2>
                    <p className="text-base md:text-lg text-muted-foreground">
                      {b.description}
                    </p>
                  </div>
                  <div className={`hidden lg:flex justify-center ${isReversed ? "lg:order-1" : "lg:order-2"}`}>
                    <div className={`w-36 h-36 rounded-3xl flex items-center justify-center ${bg}`}>
                      <Icon className={`size-6 ${text}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.whyChoose.blocks.map((b, i) => (
              <Card key={b.title} className="p-6 flex flex-col">
                <div className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold mb-4">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-bold leading-tight">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
                {b.bullets && b.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {b.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-sm">
                        <Check className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        )}

        {data.whyChoose.ctaLabel && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <CTAButton Icon={Sparkles} size="xl" href="/signup">
              {data.whyChoose.ctaLabel}
            </CTAButton>
            <CTAButton variant="outline" href="/signup">
              <GoogleIcon className="size-4" />
              Sign up with Google
            </CTAButton>
          </div>
        )}
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  What You Can Track (per platform accordion)                      */
/* ------------------------------------------------------------------ */

function WhatYouCanTrackSection({ data }: { data: MarketingPageData }) {
  if (!data.whatYouCanTrack) return null;
  return (
    <section className="py-16">
      <Container>
        <div className="text-center mb-10">
          <SectionHeading>{data.whatYouCanTrack.heading}</SectionHeading>
          {data.whatYouCanTrack.subheading && (
            <SectionSubtitle>{data.whatYouCanTrack.subheading}</SectionSubtitle>
          )}
        </div>
        <div className="w-full max-w-3xl mx-auto space-y-3">
          {data.whatYouCanTrack.items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="border rounded-lg px-5">
                <h3 className="flex">
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-between py-4 text-sm font-medium text-left hover:no-underline"
                    aria-expanded="false"
                  >
                    <span className="flex items-center gap-3">
                      {Icon ? <Icon className="w-5 h-5 shrink-0" /> : null}
                      <span className="text-base font-medium">{item.title}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </h3>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  What You Can Schedule                                             */
/* ------------------------------------------------------------------ */

function WhatYouCanScheduleSection({ data }: { data: MarketingPageData }) {
  if (!data.whatYouCanSchedule) return null;
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <SectionHeading>{data.whatYouCanSchedule.heading}</SectionHeading>
        <SectionSubtitle>{data.whatYouCanSchedule.subheading}</SectionSubtitle>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.whatYouCanSchedule.items.map((item) => (
            <Card key={item.title} className="p-6">
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Why It Matters                                                    */
/* ------------------------------------------------------------------ */

function WhyItMattersSection({ data }: { data: MarketingPageData }) {
  if (!data.whyItMatters) return null;
  return (
    <section className="py-16 lg:py-20 bg-muted/30">
      <Container>
        <div className="max-w-3xl mx-auto text-center mb-10">
          <SectionHeading>{data.whyItMatters.heading}</SectionHeading>
          {data.whyItMatters.subheading && (
            <SectionSubtitle>{data.whyItMatters.subheading}</SectionSubtitle>
          )}
        </div>
        <div className="max-w-3xl mx-auto space-y-10">
          {data.whyItMatters.blocks.map((b) => (
            <div key={b.title} className="border-l-4 border-primary/30 pl-6">
              <h3 className="text-2xl font-bold tracking-tight">{b.title}</h3>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Audiences                                                         */
/* ------------------------------------------------------------------ */

function AudiencesSection({ data }: { data: MarketingPageData }) {
  if (!data.audiences) return null;
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <SectionHeading>{data.audiences.heading}</SectionHeading>
        {data.audiences.subheading && (
          <SectionSubtitle>{data.audiences.subheading}</SectionSubtitle>
        )}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.audiences.items.map((item) => (
            <Card key={item.title} className="p-6">
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Repurpose Across Platforms                                        */
/* ------------------------------------------------------------------ */

function RepurposeSection({ data }: { data: MarketingPageData }) {
  if (!data.repurposeAcrossPlatforms) return null;
  return (
    <section className="py-16 lg:py-20 bg-muted/30 border-t">
      <Container>
        <SectionHeading>{data.repurposeAcrossPlatforms.heading}</SectionHeading>
        {data.repurposeAcrossPlatforms.subheading && (
          <SectionSubtitle>{data.repurposeAcrossPlatforms.subheading}</SectionSubtitle>
        )}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {data.repurposeAcrossPlatforms.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:border-foreground/30 transition-colors"
            >
              <span className="text-sm font-medium">{item.label}</span>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                               */
/* ------------------------------------------------------------------ */

function FAQSection({ items }: { items: NonNullable<MarketingPageData["faq"]> }) {
  return (
    <section id="faq" className="py-16">
      <Container>
        <SectionHeading>FAQ</SectionHeading>
        <SectionSubtitle>Everything you need to know</SectionSubtitle>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 divide-y rounded-2xl border bg-card">
            {items.map((item) => (
              <h3 key={item.q} className="m-0 font-normal text-base">
                <details className="group">
                  <summary className="flex items-center justify-between gap-4 py-6 px-5 text-left cursor-pointer hover:bg-accent/40 transition-colors list-none">
                    <span className="text-base font-normal">{item.q}</span>
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-7 pt-0 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </div>
                </details>
              </h3>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <p className="text-lg font-bold mb-3">Still have questions?</p>
              <p className="text-sm text-muted-foreground mb-5">
                Can&apos;t find the answer you&apos;re looking for? Get started with a free trial or chat with our team.
              </p>
              <div className="flex flex-col gap-2">
                <CTAButton Icon={Sparkles} href="/signup">Try for Free</CTAButton>
                <CTAButton variant="outline" href="/signup">
                  <GoogleIcon className="size-4" />
                  Sign up with Google
                </CTAButton>
              </div>
            </Card>

            <Card bordered={false} className="bg-muted/30 p-6">
              <div className="flex -space-x-2 mb-3">
                {AVATARS.slice(0, 5).map((src, i) => (
                  <div key={i} className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-background">
                    <Image src={src} alt="User" fill className="object-cover" sizes="40px" />
                  </div>
                ))}
              </div>
              <p className="font-semibold text-sm leading-tight">Trusted by 2150+ businesses</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex -space-x-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="size-3.5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <span>4.9/5 average rating</span>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Bottom CTA (post-FAQ)                                             */
/* ------------------------------------------------------------------ */

function BottomCtaSection({ data }: { data: MarketingPageData }) {
  if (!data.bottomCta) return null;
  const cta = data.bottomCta;
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="relative my-8 overflow-hidden rounded-2xl bg-blue-800 shadow-sm">
          <div className="flex flex-col gap-10 p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-8 lg:p-10">
            <div className="flex-1 lg:max-w-[44%]">
              <div className="mb-4 flex items-center gap-2">
                <img alt="PostPlanify logo" loading="lazy" width="22" height="22" className="rounded-full bg-white" src="/images/postplanify/postplanify-logo.png" />
                <span className="text-sm font-semibold text-white">PostPlanify</span>
              </div>
              <h3 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">{cta.heading}</h3>
              {cta.subheading && (
                <p className="mt-3 max-w-md text-base leading-relaxed text-blue-50/90">{cta.subheading}</p>
              )}
              <div className="mt-6 flex flex-col gap-4">
                {cta.ctaLabel && (
                  <a href={cta.ctaHref ?? "/signup"} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 text-base font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50 sm:w-auto sm:self-start">
                    {cta.ctaLabel}
                    <ChevronRight className="h-4 w-4" />
                  </a>
                )}
                <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-5 w-5 text-yellow-300 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-blue-50/80">Trusted by 2,150+ businesses</span>
                </div>
              </div>
            </div>
            {cta.image && (
              <div className="relative flex-1 lg:-my-2">
                <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/20">
                  <img alt={cta.image.alt} loading="lazy" className="h-auto w-full" src={cta.image.src} />
                </div>
                <div className="pointer-events-none absolute -right-3 -top-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg sm:-right-4 sm:px-3.5 sm:py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[10px] font-medium text-gray-500">Engagement</p>
                    <p className="text-sm font-bold text-gray-900">+18%</p>
                  </div>
                </div>
                <div className="pointer-events-none absolute -right-3 bottom-6 flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 shadow-lg sm:-right-4 sm:px-3.5 sm:py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Eye className="h-4 w-4" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[10px] font-medium text-gray-500">Views</p>
                    <p className="text-sm font-bold text-gray-900">52.8k</p>
                  </div>
                  <div className="ml-1 flex items-end gap-0.5">
                    <span className="w-1 rounded-full bg-blue-400" style={{ height: "6px" }}></span>
                    <span className="w-1 rounded-full bg-blue-400" style={{ height: "9px" }}></span>
                    <span className="w-1 rounded-full bg-blue-400" style={{ height: "7px" }}></span>
                    <span className="w-1 rounded-full bg-blue-400" style={{ height: "12px" }}></span>
                    <span className="w-1 rounded-full bg-blue-400" style={{ height: "10px" }}></span>
                    <span className="w-1 rounded-full bg-blue-400" style={{ height: "14px" }}></span>
                  </div>
                </div>
                <div className="pointer-events-none absolute -left-3 top-1/2 flex -translate-y-1/2 items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 shadow-lg sm:-left-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13.35 20.13c-.76.69-1.93.69-2.69-.01l-.11-.1C5.3 15.27 1.87 12.16 2 8.28c.06-1.7.93-3.33 2.34-4.29 2.64-1.8 5.9-.96 7.66 1.1 1.76-2.06 5.02-2.91 7.66-1.1 1.41.96 2.28 2.59 2.34 4.29.14 3.88-3.3 6.99-8.55 11.76z" /></svg>
                  </span>
                  <span className="text-base font-bold text-gray-900">+1.2k likes</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SEO long-form content                                             */
/* ------------------------------------------------------------------ */

function SeoContentSection({ data }: { data: MarketingPageData }) {
  if (!data.seoContent) return null;
  const { heading, paragraphs, subSections } = data.seoContent;
  return (
    <section className="py-16 lg:py-20 border-t">
      <Container>
        <article className="prose prose-zinc dark:prose-invert max-w-3xl mx-auto">
          <h2 className="text-[36px] font-bold leading-[40px]">{heading}</h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="text-base text-muted-foreground leading-relaxed mt-4">
              {p}
            </p>
          ))}
          {subSections?.map((sub) => (
            <div key={sub.heading} className="mt-8">
              <h3 className="text-xl font-bold leading-tight">{sub.heading}</h3>
              {Array.isArray(sub.body) ? (
                sub.body.map((b, i) => (
                  <p key={i} className="text-base text-muted-foreground leading-relaxed mt-3">
                    {b}
                  </p>
                ))
              ) : (
                <p className="text-base text-muted-foreground leading-relaxed mt-3">
                  {sub.body}
                </p>
              )}
            </div>
          ))}
        </article>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Mid-page CTA banner                                               */
/* ------------------------------------------------------------------ */

function MidCtaSection({ data }: { data: MarketingPageData }) {
  if (!data.midCta) return null;
  return (
    <section className="py-8 bg-foreground text-background">
      <Container>
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-[30px] font-bold leading-[36px] tracking-tight text-background">{data.midCta.heading}</h3>
          <p className="mt-2 text-sm text-background/70 max-w-2xl mx-auto">
            {data.midCta.subheading}
          </p>
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
            {data.midCta.bullets.map((b) => (
              <li key={b} className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-400" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Link
              href={data.midCta.ctaHref}
              className="inline-flex items-center justify-center gap-2 h-[40px] px-6 text-sm rounded-md bg-background text-foreground hover:bg-background/90 font-medium transition-colors"
            >
              <Sparkles className="size-4" />
              {data.midCta.ctaLabel}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function MidCtaButtonsSection() {
  return (
    <div className="pb-8">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <CTAButton Icon={Sparkles} size="xl" href="/signup">
          Try for Free
          <span className="ml-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronRight className="size-4" />
          </span>
        </CTAButton>
        <CTAButton variant="outline" size="xl" href="/signup">
          <GoogleIcon className="size-4" />
          Sign up with Google
        </CTAButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Related Resources                                                 */
/* ------------------------------------------------------------------ */

function RelatedResourcesSection({ data }: { data: MarketingPageData }) {
  if (!data.relatedResources) return null;
  const defaultGroups = [
    {
      title: "Scheduler Comparisons & Reviews",
      items: COMPARISON_PAGES,
    },
    {
      title: "Industries & Solutions",
      items: INDUSTRY_PAGES,
    },
    {
      title: "Free Tools",
      items: FREE_TOOLS,
    },
    {
      title: "Articles",
      items: ARTICLE_PAGES,
    },
  ];
  const groups = data.relatedResources.groups.length > 0 ? data.relatedResources.groups : defaultGroups;
  return (
    <section className="py-16 lg:py-20 border-t">
      <Container>
        <SectionHeading>{data.relatedResources.heading}</SectionHeading>
        <SectionSubtitle>{data.relatedResources.subheading}</SectionSubtitle>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {groups.map((group) => (
            <div key={group.title} className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {group.title}
              </p>
              <ul className="space-y-2">
                {group.items.slice(0, 10).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-foreground/80 hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                    >
                      <ChevronRight className="size-3.5 text-muted-foreground" />
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
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                       */
/* ------------------------------------------------------------------ */

export function MarketingPageTemplate({ data }: { data: MarketingPageData }) {
  const isScheduler = data.category === "Schedulers";
  if (isScheduler) {
    return (
      <>
        <PageHero data={data} />
        <ProblemSection data={data} />
        {data.howItWorks && <HowItWorksSection data={data} />}
        <FeaturesGridSection data={data} />
        <TestimonialsSection />
        <LiveStatsSection />
        {data.demoVideo && <DemoVideoSection youtubeId={data.demoVideo.youtubeId} title={data.demoVideo.title} duration={data.demoVideo.duration} />}
        <PricingToggle />
        <WhyChooseSection data={data} />
        {data.whatYouCanSchedule && <WhatYouCanScheduleSection data={data} />}
        {data.whyItMatters && <WhyItMattersSection data={data} />}
        {data.audiences && <AudiencesSection data={data} />}
        {data.repurposeAcrossPlatforms && <RepurposeSection data={data} />}
        {data.faq && data.faq.length > 0 && <FAQSection items={data.faq} />}
        {data.seoContent && <SeoContentSection data={data} />}
        {data.relatedResources && <RelatedResourcesSection data={data} />}
      </>
    );
  }
  return (
    <>
      <PageHero data={data} />
      {data.howItWorks && <HowItWorksSection data={data} />}
      <FeaturesGridSection data={data} />
      {data.useCases && <MidCtaButtonsSection />}
      {data.useCases && <UseCasesSection data={data} />}
      {data.whatYouCanTrack && <WhatYouCanTrackSection data={data} />}
      <WhyChooseSection data={data} />
      {data.whatYouCanSchedule && <WhatYouCanScheduleSection data={data} />}
      {data.whyItMatters && <WhyItMattersSection data={data} />}
      <LiveStatsSection />
      {data.midCta && <MidCtaSection data={data} />}
      {data.demoVideo && <DemoVideoSection youtubeId={data.demoVideo.youtubeId} title={data.demoVideo.title} duration={data.demoVideo.duration} />}
      <PricingToggle />
      {data.faq && data.faq.length > 0 && <FAQSection items={data.faq} />}
      {data.bottomCta && <BottomCtaSection data={data} />}
    </>
  );
}