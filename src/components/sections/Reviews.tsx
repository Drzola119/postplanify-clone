import Image from "next/image";
import { Star, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.39C1.34 2.69.93 3.36.62 4.15c-.3.76-.5 1.64-.56 2.91C0 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.39 2.13.67.67 1.34 1.08 2.13 1.39.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.39.67-.67 1.08-1.34 1.39-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.39-2.13C21.31 1.34 20.64.93 19.85.62c-.76-.3-1.64-.5-2.91-.56C15.67 0 15.26 0 12 0m0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84m0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8m6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  );
}

function TvIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814a2.506 2.506 0 0 0 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.464V8.536L16 12l-6 3.464z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.11-1.28-.56-2.02-2.38-2.02-3.85 0-3.16 2.24-6.03 6.56-6.03 3.44 0 6.12 2.49 6.12 5.74 0 3.44-2.13 6.2-5.18 6.2-.97 0-1.92-.52-2.26-1.13l-.67 2.37c-.23.86-.86 2.01-1.29 2.7v-.03Z" />
    </svg>
  );
}

type Review = {
  source: "G2" | "Trustpilot";
  author: string;
  role: string;
  date: string;
  title: string;
  body: string;
  avatar?: string;
  initial?: string;
};

const REVIEWS: Review[] = [
  {
    source: "G2",
    author: "Frank B.",
    role: "Business Owner, Small-Business",
    date: "May 24, 2026",
    title: "PostPlanify helped us with Social Scheduling, Approvals, and Inbox in One Place",
    body: "We manage 8 social media accounts across LinkedIn, Instagram, X, Facebook, TikTok and YouTube. Before PostPlanify we had two people on Buffer, someone else posting natively, and a Notion doc for approvals — a total mess. PostPlanify replaced all of it. Approvals, scheduling, and the inbox now live in one place. The pricing is fair and the support is genuinely fast.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Ffrank_benton.jpeg_w_96_q_75",
  },
  {
    source: "G2",
    author: "Verified User in Marketing",
    role: "Small-Business (50 or fewer emp.)",
    date: "May 22, 2026",
    title: "Seamless Claude Code Integration — A Real Game Changer",
    body: "The integration with Claude Code has been seamless, and it's been a real game changer for us. Pulling ongoing performance insights via Claude Code and pushing the answers into our existing dashboards has saved hours every week. Setup was the easiest we've had with any social tool.",
    initial: "M",
  },
  {
    source: "Trustpilot",
    author: "Carol Phillips",
    role: "GB · 2 reviews",
    date: "June 18, 2026",
    title: "Great support, great system, I highly recommend",
    body: "This has made social media planning and posting so much easier. I can manage all of my platforms in one place, the calendar view makes it really clear to see where I am missing content and the support has been fantastic. I have been using it for a few months now and they have already added extra features that I asked for.",
    initial: "C",
  },
  {
    source: "G2",
    author: "Oguz D.",
    role: "Small-Business (50 or fewer emp.)",
    date: "April 14, 2026",
    title: "Effortless API Integration and Analytics at Its Best",
    body: "I use PostPlanify a lot, particularly its API integration, which I find really valuable as it connects well with my internal tools and personal accounts. It's easy to integrate into my apps, which makes my workflow much faster and smoother, especially when handling repetitive scheduling across multiple brands.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Foguz_doruk.jpg_w_96_q_75",
  },
];

const BG_ICONS = [
  { Icon: InstagramIcon, className: "top-[6%] left-[2%] -rotate-12 text-pink-500", opacity: 0.12 },
  { Icon: XIcon, className: "top-[25%] left-[7%] rotate-[15deg] text-neutral-900", opacity: 0.10 },
  { Icon: XIcon, className: "top-[45%] left-[1%] rotate-[6deg] text-neutral-900", opacity: 0.10 },
  { Icon: LinkedinIcon, className: "top-[64%] left-[6%] -rotate-[10deg] text-blue-600", opacity: 0.12 },
  { Icon: MessageCircle, className: "top-[83%] left-[2%] rotate-[18deg] text-neutral-900", opacity: 0.10 },
  { Icon: TvIcon, className: "top-[8%] right-[3%] -rotate-[8deg] text-red-500", opacity: 0.10 },
  { Icon: FacebookIcon, className: "top-[28%] right-[7%] -rotate-[8deg] text-blue-500", opacity: 0.12 },
  { Icon: PinterestIcon, className: "top-[48%] right-[2%] rotate-[16deg] text-red-500", opacity: 0.10 },
  { Icon: MessageCircle, className: "top-[67%] right-[6%] -rotate-[14deg] text-sky-500", opacity: 0.12 },
];

function SourceBadge({ source }: { source: "G2" | "Trustpilot" }) {
  if (source === "G2") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md bg-[#FF492C]/10 px-2 py-1">
        <span className="text-[11px] font-bold text-[#FF492C] tracking-tight">G2</span>
        <span className="text-[10px] text-[#FF492C]/80">verified</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1">
      <svg viewBox="0 0 24 24" className="size-3 text-emerald-600 fill-current" aria-hidden>
        <path d="M12 .5C5.65.5.5 5.65.5 12S5.65 23.5 12 23.5 23.5 18.35 23.5 12 18.35.5 12 .5zm-1.2 16.55L6.5 12.7l1.4-1.4 2.9 2.9 6.3-6.3 1.4 1.4-7.7 7.75z" />
      </svg>
      <span className="text-[11px] font-bold text-emerald-700 tracking-tight">Trustpilot</span>
    </div>
  );
}

export function Reviews() {
  return (
    <section className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_10%_10%,#ffffff_0%,#fafafa_45%,#ffffff_100%)]" />
        <div className="absolute -top-24 -right-24 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-emerald-400/10 via-sky-400/5 to-transparent blur-3xl" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(0,0,0,0.8)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.8)_1px,transparent_1px)] [background-size:48px_48px]"
        />
      </div>

      {/* Floating background icons */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
        {BG_ICONS.map(({ Icon, className, opacity }, i) => (
          <span key={i} className={`absolute ${className}`} style={{ opacity }}>
            <Icon className="w-11 h-11" />
          </span>
        ))}
      </div>

      <Container className="relative z-10 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-[36px] font-bold leading-[40px] tracking-normal text-balance text-neutral-900">
            What our customers say on{" "}
            <span className="relative inline-block text-[#FF492C]">G2</span>
            {" "}and{" "}
            <span className="relative inline-block text-emerald-600">Trustpilot</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {REVIEWS.map((r, i) => (
            <Card key={i} hover className="p-6 flex flex-col bg-white">
              {/* Header: source + date + stars */}
              <div className="flex items-center justify-between mb-4">
                <SourceBadge source={r.source} />
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Stars />
                  <span>{r.date}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-neutral-900 leading-[28px] mb-3">
                &ldquo;{r.title}&rdquo;
              </h3>

              {/* Body */}
              <p className="text-sm text-neutral-600 leading-relaxed flex-1">{r.body}</p>

              {/* Author */}
              <div className="mt-5 pt-5 border-t border-neutral-100 flex items-center gap-3">
                {r.avatar ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-100 shrink-0">
                    <Image src={r.avatar} alt={r.author} fill className="object-cover" sizes="40px" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {r.initial ?? r.author[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{r.author}</p>
                  <p className="text-xs text-neutral-500 truncate">{r.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
