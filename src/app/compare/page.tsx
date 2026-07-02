import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Star } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { COMPARE_CARDS, COMPARE_TOOLS, FAQ_ENTRIES, TOOLS_COVERED } from "@/data/compare";

const PROFILE_AVATARS = [
  "/images/pricing/testimonials/frank-benton.jpeg",
  "/images/pricing/testimonials/sam-cranq.avif",
  "/images/pricing/testimonials/aleksandr-heinlaid.avif",
  "/images/pricing/testimonials/shaheer.jpg",
  "/images/pricing/testimonials/monta.jpg",
  "/images/pricing/testimonials/oguz-doruk.jpg",
  "/images/pricing/testimonials/hasan-cagli-postplanify.webp",
];

const PLATFORM_ICONS: { name: string; color: string; svg: React.ReactNode }[] = [
  { name: "TikTok", color: "text-black dark:text-white", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg> },
  { name: "Instagram", color: "text-pink-500", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" /></svg> },
  { name: "Facebook", color: "text-blue-500", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z" /></svg> },
  { name: "X", color: "text-black dark:text-white", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
  { name: "YouTube", color: "text-red-500", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" /></svg> },
  { name: "LinkedIn", color: "text-blue-600", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg> },
  { name: "Threads", color: "text-black dark:text-white", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12.18 2c5.69 0 9.82 4.27 9.82 9.95 0 5.91-4.18 10.05-10.02 10.05-2.79 0-5.18-1.05-6.99-2.83l1.4-1.45c1.43 1.43 3.4 2.27 5.59 2.27 4.83 0 8.03-3.4 8.03-8.04 0-4.5-3.39-7.95-8.03-7.95-3.55 0-6.13 1.99-7.27 4.42l1.55 1.05c.95-2.06 2.94-3.48 5.72-3.48zm-.06 4.34c2.91 0 5.05 2.16 5.05 5.36 0 3.2-2.16 5.36-5.05 5.36-1.69 0-3.06-.76-3.85-2.06l1.43-.99c.55.93 1.43 1.46 2.42 1.46 1.84 0 3.05-1.46 3.05-3.77 0-2.32-1.21-3.78-3.05-3.78-1.16 0-2.13.65-2.55 1.78l-1.5-.81c.69-1.62 2.18-2.55 4.05-2.55z" /></svg> },
  { name: "Pinterest", color: "text-red-500", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.86.4 1.55 1.26 1.55 1.49 0 2.64-1.61 2.64-3.92 0-2.04-1.49-3.45-3.61-3.45-2.47 0-3.91 1.84-3.91 3.74 0 .74.28 1.55.63 1.96.06.08.06.17.06.29-.06.23-.17.86-.23.97-.06.17-.17.23-.4.11-1.49-.69-2.41-2.87-2.41-4.6 0-3.74 2.7-7.14 7.79-7.14 4.08 0 7.27 2.92 7.27 6.81 0 4.08-2.58 7.36-6.13 7.36-1.21 0-2.35-.63-2.7-1.32l-.74 2.81c-.28.97-1 2.18-1.49 2.96" /></svg> },
  { name: "Bluesky", color: "text-[#0085ff]", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M5.202 4.066c-.967.643-1.4 1.685-1.4 2.916 0 1.34.518 2.39 1.616 3.196.836.6 1.916.898 2.916.898.4 0 .798-.046 1.193-.137-.246.49-.557.93-.93 1.318-.745.77-1.728 1.293-2.795 1.293-.74 0-1.428-.21-2.058-.587v2.236c.69.318 1.46.516 2.275.516 1.575 0 3.058-.715 4.144-1.857 1.085-1.142 1.713-2.7 1.713-4.337 0-1.31-.518-2.36-1.616-3.165-.836-.6-1.916-.898-2.916-.898-.4 0-.798.046-1.193.137.246-.49.557-.93.93-1.318.745-.77 1.728-1.293 2.795-1.293.74 0 1.428.21 2.058.587V2.65c-.69-.318-1.46-.516-2.275-.516-1.575 0-3.058.715-4.144 1.857-.36.379-.685.79-.965 1.227.31-.426.674-.815 1.092-1.152zM12 11.13c-.45 0-.885-.06-1.305-.165-.42.105-.855.165-1.305.165-2.485 0-4.5-2.015-4.5-4.5S6.905 2.13 9.39 2.13c.45 0 .885.06 1.305.165.42-.105.855-.165 1.305-.165 2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5z" /></svg> },
  { name: "Google Business", color: "text-[#4285F4]", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 11v2.4h6.8c-.3 1.65-2.05 4.85-6.8 4.85-4.1 0-7.45-3.4-7.45-7.55S7.9 3.15 12 3.15c2.35 0 3.9.99 4.8 1.85l3.25-3.15C18.05.25 15.3-.65 12-.65 5.85-.65.85 4.35.85 10.5S5.85 21.65 12 21.65c6.95 0 11.55-4.85 11.55-11.7 0-.8-.1-1.4-.2-2z" /></svg> },
];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-green-600">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="M22 4 12 14.01l-3-3" />
  </svg>
);

export const metadata = {
  title: "Compare Social Media Scheduling Tools | Side-by-Side Reviews",
  description:
    "Side-by-side comparisons of the most popular social media scheduling tools. Pricing, features, AI tools, and real user reviews to help you decide.",
};

export default function ComparePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">
              Compare Social Media Scheduling Tools
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Picking the right scheduling tool shouldn&apos;t take hours. We compared the most popular platforms side by side — features, pricing, and what real users say — so you can decide faster.
            </p>
          </div>
        </section>

        {/* Compare grid */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 pb-12 md:pb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Which tools are you comparing?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {COMPARE_CARDS.map((card) => {
              const toolA = COMPARE_TOOLS[card.toolA];
              const toolB = COMPARE_TOOLS[card.toolB];
              return (
                <Link
                  key={card.slug}
                  href={`/compare/${card.slug}`}
                  className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-center gap-6 h-32">
                    <Image
                      src={toolA.logo}
                      alt={`${toolA.name} logo`}
                      width={128}
                      height={72}
                      className="object-contain"
                    />
                    <Image
                      src={toolB.logo}
                      alt={`${toolB.name} logo`}
                      width={128}
                      height={72}
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-lg font-semibold mt-4 text-center">
                    {toolA.name} vs {toolB.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        </section>

        {/* How We Compare */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 pb-12 md:pb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
              How We Compare Social Media Tools
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Every comparison on this page follows the same framework. We evaluate each tool across six categories:{" "}
                <strong className="text-foreground font-bold">pricing and value</strong>,{" "}
                <strong className="text-foreground font-bold">scheduling and publishing features</strong>,{" "}
                <strong className="text-foreground font-bold">AI tools</strong>,{" "}
                <strong className="text-foreground font-bold">analytics and reporting</strong>,{" "}
                <strong className="text-foreground font-bold">team collaboration</strong>, and{" "}
                <strong className="text-foreground font-bold">platform support</strong>.
              </p>
              <p>
                Pricing is compared at real-world usage levels — not just the base price, but what you actually pay for 3, 5, and 10+ social accounts with the features you need. We factor in per-seat, per-channel, per-brand, and per-account pricing models so you can see the true cost at your scale.
              </p>
              <p>
                User reviews are pulled from{" "}
                <strong className="text-foreground font-bold">G2</strong> and{" "}
                <strong className="text-foreground font-bold">Trustpilot</strong> — two independent review platforms — so you get a balanced view of what real users experience. We report both scores and review volume to help you weigh the data.
              </p>
            </div>
          </div>
        </section>

        {/* Tools We Cover */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 pb-12 md:pb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
              Tools We Cover
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                We currently compare seventeen of the most popular social media scheduling platforms:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                {TOOLS_COVERED.map((tool) => (
                  <li key={tool.name}>
                    <strong className="text-foreground font-bold">{tool.name}</strong> — {tool.pricing}. {tool.description}{" "}
                    <Link href={tool.pricingHref} className="text-foreground underline hover:text-primary">
                      See {tool.name} pricing
                    </Link>
                  </li>
                ))}
              </ul>
              <p>
                Each tool uses a different pricing model, which makes direct comparisons tricky. Our side-by-side breakdowns normalize the pricing so you can see what you actually pay at your account and team size.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 pb-12 md:pb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {FAQ_ENTRIES.map((faq) => (
                <div key={faq.question} className="border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA card */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 pb-12">
          <div className="rounded-xl bg-card text-card-foreground shadow p-6 my-12 border-black border-4 max-w-2xl mx-4 sm:mx-auto">
            <div className="text-center space-y-5">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <Image src="/images/pricing/logo.png" alt="PostPlanify logo" width={24} height={24} className="rounded-full" />
                  <span className="text-md font-semibold">PostPlanify</span>
                </div>
                <p className="text-xl font-semibold">Manage All Your Social Accounts Without the Chaos</p>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  Schedule posts, track performance, and collaborate with your team.
                </p>
              </div>
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-2 my-4 mx-4">
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-2">
                  {PLATFORM_ICONS.map((p) => (
                    <div key={"cta-" + p.name} className={"transition-all duration-200 hover:opacity-80 " + p.color}>
                      {p.svg}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 justify-center items-center">
                <a
                  href="/signup?show_first_signup_message=true"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 rounded-lg shadow-lg min-w-[240px] text-base font-semibold"
                >
                  Start 7-day Free Trial
                  <ChevronRight className="size-4" />
                </a>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckIcon />
                    <span>Content Calendar</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckIcon />
                    <span>Full Analytics</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckIcon />
                    <span>Social Inbox</span>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-2 max-w-none">
                  <div className="flex -space-x-3">
                    {PROFILE_AVATARS.map((src, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-muted shadow-sm">
                        <Image src={src} alt="User profile" width={36} height={36} className="object-cover w-full h-full" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="size-5 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground font-medium mt-0.5">Trusted by 2150+ businesses</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}