import Image from "next/image";
import Link from "next/link";
import { Sparkles, Calendar, Play, Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";

const AVATARS = [
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Ffrank_benton.jpeg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fsam_cranq.avif_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Faleksandr_heinlaid.avif_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fshaheer.jpg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fmonta.jpg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Foguz_doruk.jpg_w_96_q_75",
];

const LOGOS = [
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fshopmeagent_com.png_w_256_q_75", alt: "ShopMeAgent" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Felevatecom_com_au.png_w_256_q_75", alt: "ElevateCom" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fameco_group_com.png_w_256_q_75", alt: "Ameco Group" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fudydigital_com.png_w_256_q_75", alt: "UDY Digital" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fgetnorms_com.png_w_256_q_75", alt: "GetNorms" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Farcdigital_ro.png_w_256_q_75", alt: "ArcDigital" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fcraftix_io.png_w_256_q_75", alt: "Craftix" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fferociti_net.png_w_256_q_75", alt: "Ferociti" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Feles_com_br.png_w_256_q_75", alt: "Eles" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fglobtechllc_com.png_w_256_q_75", alt: "GlobTech LLC" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Facarograf_com.png_w_256_q_75", alt: "Acarograf" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fgetlogical_co_uk.png_w_256_q_75", alt: "Get Logical" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fglobaltalent_co.png_w_256_q_75", alt: "Global Talent" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fplenavitashift_com.png_w_256_q_75", alt: "Plenavitashift" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Faprovaleges_com_br.png_w_256_q_75", alt: "Aprovaleges" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fnexposuremedia_com.png_w_256_q_75", alt: "Nexposure Media" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fcotwrealty_com.png_w_256_q_75", alt: "COTW Realty" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fdreamdestination_agency.jpg_w_256_q_75", alt: "Dream Destination Agency" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Ftechdots_dev.png_w_256_q_75", alt: "TechDots" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fwellorganised_com_au.png_w_256_q_75", alt: "Well Organised" },
  { src: "/images/postplanify/https___postplanify.com__next_image_url__2Fcustomer_logos_2Fscriptsee_io.png_w_256_q_75", alt: "ScriptSee" },
];

const LLM_LOGOS = [
  { src: "/images/postplanify/llm-logos__claude.svg", alt: "Claude" },
  { src: "/images/postplanify/llm-logos__chatgpt.svg", alt: "ChatGPT" },
  { src: "/images/postplanify/llm-logos__gemini.svg", alt: "Gemini" },
  { src: "/images/postplanify/llm-logos__perplexity.svg", alt: "Perplexity" },
  { src: "/images/postplanify/llm-logos__grok.svg", alt: "Grok" },
];

function LogoMarquee() {
  return (
    <div className="relative mt-12 w-full overflow-hidden gradient-mask-x">
      <div className="flex w-max animate-marquee gap-12 items-center">
        {[...LOGOS, ...LOGOS].map((logo, i) => (
          <div key={i} className="relative h-12 w-32 shrink-0">
            <Image
              src={logo.src}
              alt={logo.alt}
              fill
              className="object-contain rounded-md"
              sizes="128px"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="overflow-hidden bg-gradient-to-b from-background to-background/95 py-4">
      <Container>
        {/* Mobile / single-column layout */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 lg:hidden">
          {/* Announcement badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs sm:text-sm">
            <div className="flex -space-x-1.5">
              {LLM_LOGOS.slice(0, 3).map((logo) => (
                <Image
                  key={logo.alt}
                  src={logo.src}
                  alt={logo.alt}
                  width={16}
                  height={16}
                  className="rounded-full bg-background"
                />
              ))}
            </div>
            <span className="text-muted-foreground">AI social media manager</span>
          </div>

          <h1 className="text-[36px] sm:text-[40px] md:text-[48px] font-bold leading-[1] tracking-[-1.2px]">
            Social media management built for agencies and growing teams
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
            Schedule posts, track analytics, manage your inbox, and collaborate with your team across 10 platforms — from one dashboard.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <CTAButton Icon={Sparkles} size="xl" className="w-full sm:w-auto sm:min-w-[200px]">
              Try it for free
            </CTAButton>
            <Link
              href="https://cal.com/hasancagli/postplanify-demo-call"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto sm:min-w-[200px] h-[52px] px-8 text-base rounded-md border hover:bg-accent transition-colors"
            >
              <Calendar className="size-4" />
              Schedule a Call
            </Link>
          </div>

          {/* Social proof avatars */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex -space-x-2">
              {AVATARS.map((src, i) => (
                <div
                  key={i}
                  className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-background"
                >
                  <Image src={src} alt="User profile" fill className="object-cover" sizes="48px" />
                </div>
              ))}
              <div className="relative w-12 h-16 rounded-md overflow-hidden border-2 border-background">
                <Image
                  src="/images/postplanify/https___postplanify.com__next_image_url__2Fhasan_cagli_postplanify.webp_w_96_q_75"
                  alt="Hasan"
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <div className="flex text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <span className="ml-1">Trusted by 2150+ businesses</span>
            </div>
          </div>
        </div>

        {/* Desktop two-column */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Left: content */}
          <div className="flex flex-col items-start text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-sm">
              <div className="flex -space-x-1.5">
                {LLM_LOGOS.map((logo) => (
                  <Image
                    key={logo.alt}
                    src={logo.src}
                    alt={logo.alt}
                    width={18}
                    height={18}
                    className="rounded-full bg-background"
                  />
                ))}
              </div>
              <span className="text-muted-foreground">AI social media manager</span>
            </div>

            <h1 className="text-[48px] font-bold leading-[48px] tracking-[-1.2px]">
              Social media management built for agencies and growing teams
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Schedule posts, track analytics, manage your inbox, and collaborate with your team across 10 platforms — from one dashboard.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <CTAButton Icon={Sparkles} size="xl" className="min-w-[200px]">
                Try it for free
              </CTAButton>
              <Link
                href="https://cal.com/hasancagli/postplanify-demo-call"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-w-[200px] h-[52px] px-8 text-base rounded-md border hover:bg-accent transition-colors"
              >
                <Calendar className="size-4" />
                Schedule a Call
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {AVATARS.map((src, i) => (
                  <div key={i} className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-background">
                    <Image src={src} alt="User profile" fill className="object-cover" sizes="48px" />
                  </div>
                ))}
                <div className="relative w-12 h-16 rounded-md overflow-hidden border-2 border-background">
                  <Image
                    src="/images/postplanify/https___postplanify.com__next_image_url__2Fhasan_cagli_postplanify.webp_w_96_q_75"
                    alt="Hasan"
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className="flex text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <span className="ml-1">Trusted by 2150+ businesses</span>
              </div>
            </div>
          </div>

          {/* Right: video */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group">
            <Image
              src="/images/postplanify/vi__I-STsuP3Lfk__maxresdefault.jpg"
              alt="Watch 'PostPlanify Demo'"
              fill
              priority
              fetchPriority="high"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="size-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="size-7 text-black fill-black ml-1" />
              </div>
              <p className="mt-3 text-white text-sm font-medium">
                Watch &quot;How It Works&quot; · 6 mins
              </p>
            </div>
          </div>
        </div>

        {/* Logo marquee — full width below the hero content */}
        <div className="mt-12">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Trusted by agencies and brands in 60+ countries
          </p>
          <LogoMarquee />
        </div>
      </Container>
    </section>
  );
}