import Image from "next/image";
import { Calendar, BarChart3, Inbox, Users, Sparkles, FileText, ImageIcon, Link as LinkIcon, ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";

type Feature = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  bullets?: string[];
  variant?: "default" | "left-image" | "right-image" | "dark-fuchsia" | "dark-cyan";
};

const FEATURES: Feature[] = [
  {
    icon: Calendar,
    title: "One calendar. All your posts.",
    description: "Plan, edit, and reschedule across all your platforms from one drag-and-drop calendar.",
    image: "/images/postplanify/postplanify-dashboard.png",
    imageAlt: "Content Calendar Demo",
    bullets: ["10 platforms in one view", "Drag & drop scheduling", "Bulk upload via CSV"],
    variant: "left-image",
  },
  {
    icon: BarChart3,
    title: "See what actually works",
    description: "Track performance, engagement, and growth across all 10 platforms. Historical trends included.",
    image: "/images/postplanify/features__analytics.webp",
    imageAlt: "Analytics Dashboard",
    bullets: ["Cross-platform analytics", "Best time to post", "Custom date ranges"],
    variant: "right-image",
  },
  {
    icon: Inbox,
    title: "Never miss a comment or DM again",
    description: "All your comments + DMs in one place. Reply, label, assign to teammates, and let AI help you respond faster.",
    image: "/images/postplanify/features__social-inbox.png",
    imageAlt: "Social Inbox",
    bullets: ["Unified inbox", "AI reply suggestions", "Assign + label"],
    variant: "dark-fuchsia",
  },
  {
    icon: Users,
    title: "No per-seat pricing",
    description: "Invite team members and clients into one workspace. Shared calendar, approval workflows, post comments + @mentions and role-based permissions — flat pricing.",
    image: "/images/postplanify/features__team-collaboration.webp",
    imageAlt: "Team Collaboration",
    bullets: ["Flat pricing", "Roles & permissions", "Approvals"],
    variant: "left-image",
  },
  {
    icon: Sparkles,
    title: "Create posts faster with AI",
    description: "Generate captions, create images, and improve your content - all with built-in AI assistant.",
    image: "/images/postplanify/features__ai-features.webp",
    imageAlt: "AI Caption Assistant Demo",
    bullets: ["AI captions", "AI images", "AI insights"],
    variant: "right-image",
  },
  {
    icon: FileText,
    title: "Reports your clients will actually read",
    description: "Every report carries your brand — logo, accent color, custom footer. Trend charts from all 10 platforms baked in. Download or share a link.",
    image: "/images/postplanify/features__reporting-overviews-2.png",
    imageAlt: "White-Label Reports",
    bullets: ["White-label PDF", "Custom branding", "Shareable links"],
    variant: "dark-cyan",
  },
  {
    icon: ImageIcon,
    title: "All your media, organized",
    description: "Store, organize and reuse your brand assets in one shared library. Import from Canva, Google Drive or Dropbox when needed.",
    image: "/images/postplanify/features__media-library.png",
    imageAlt: "Canva Integration Demo",
    bullets: ["Canva integration", "Google Drive + Dropbox", "Reusable assets"],
    variant: "left-image",
  },
  {
    icon: LinkIcon,
    title: "One link for everything",
    description: "One page. All your links. Styled to match your brand.",
    image: "/images/postplanify/features__link-in-bio.webp",
    imageAlt: "Link in Bio Page",
    bullets: ["Custom branding", "Analytics built-in", "Unlimited blocks"],
    variant: "right-image",
  },
];

function FeatureRow({ feature }: { feature: Feature }) {
  const { variant = "default" } = feature;

  if (variant === "dark-fuchsia" || variant === "dark-cyan") {
    const bg = variant === "dark-fuchsia" ? "bg-fuchsia-950 border-fuchsia-900/40" : "bg-cyan-950 border-cyan-900/40";
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-0 rounded-2xl md:rounded-3xl overflow-hidden border ${bg} transition-transform hover:scale-[1.01]`}>
        <div className="p-8 md:p-10 flex flex-col justify-center text-white">
          <div className="inline-flex size-10 items-center justify-center rounded-lg bg-white/10 mb-4">
            <feature.icon className="size-5" />
          </div>
          {/* Feature card H3: 30/700/36/normal */}
          <h3 className="text-[30px] font-bold leading-[36px] tracking-normal">{feature.title}</h3>
          <p className="mt-3 text-white/70 max-w-md">{feature.description}</p>
          {feature.bullets && (
            <ul className="mt-5 space-y-2">
              {feature.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-white/80">
                  <Check className="size-4 text-emerald-400" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="relative min-h-[260px] lg:min-h-[420px]">
          <Image src={feature.image} alt={feature.imageAlt} fill className="object-cover" sizes="(min-width: 1024px) 60vw, 100vw" />
        </div>
      </div>
    );
  }

  const isLeft = variant === "left-image";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
      {/* Image */}
      <div className={`relative rounded-2xl md:rounded-3xl overflow-hidden border bg-muted/30 min-h-[240px] lg:min-h-[320px] ${isLeft ? "lg:col-span-7" : "lg:col-span-7 lg:order-2"}`}>
        <Image src={feature.image} alt={feature.imageAlt} fill className="object-cover object-center" sizes="(min-width: 1024px) 60vw, 100vw" />
      </div>

      {/* Text */}
      <div className={`rounded-2xl md:rounded-3xl border bg-card p-6 md:p-8 flex flex-col justify-center ${isLeft ? "lg:col-span-5 lg:order-2" : "lg:col-span-5 lg:order-1"}`}>
        <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 w-fit">
          <feature.icon className="size-5" />
        </div>
        {/* Feature card H3: 30/700/36/normal */}
        <h3 className="text-[30px] font-bold leading-[36px] tracking-normal">{feature.title}</h3>
        <p className="mt-3 text-muted-foreground">{feature.description}</p>
        {feature.bullets && (
          <ul className="mt-4 space-y-2">
            {feature.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm">
                <Check className="size-4 text-emerald-600 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-16">
      <Container>
        {/* Heading — original: 36/700/40/normal */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-[36px] font-bold leading-[40px] tracking-normal">
            Everything you need to manage social media
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            One platform for scheduling, analytics, inbox, AI, and team collaboration — built for agencies and growing teams.
          </p>
        </div>

        {/* Feature rows */}
        <div className="space-y-3 md:space-y-4">
          {FEATURES.map((f) => (
            <FeatureRow key={f.title} feature={f} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <CTAButton size="xl" className="min-w-[240px]" showArrow>
            Try it for free
          </CTAButton>
        </div>
      </Container>
    </section>
  );
}
