import Image from "next/image";
import { Star, Users, Layers, Activity } from "lucide-react";
import { Container } from "@/components/ui/container";

/*
 * PLACEHOLDER METRICS
 * These numbers are demo / placeholder values used for the marketing site.
 * In production, replace NEXT_PUBLIC_STATS_POSTS_PUBLISHED etc. in your
 * environment or update the defaults below with real analytics data.
 */
const POSTS_PUBLISHED = process.env.NEXT_PUBLIC_STATS_POSTS_PUBLISHED ?? "125M+";
const ACCOUNTS_CONNECTED = process.env.NEXT_PUBLIC_STATS_ACCOUNTS_CONNECTED ?? "180K+";
const PLATFORMS_SUPPORTED = process.env.NEXT_PUBLIC_STATS_PLATFORMS_SUPPORTED ?? "10";
const USERS_COUNT = process.env.NEXT_PUBLIC_STATS_USERS_COUNT ?? "2,150+";
const RATING = process.env.NEXT_PUBLIC_STATS_RATING ?? "4.9/5";

const AVATARS = [
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Ffrank_benton.jpeg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fsam_cranq.avif_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Faleksandr_heinlaid.avif_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fshaheer.jpg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fmonta.jpg_w_96_q_75",
  "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Foguz_doruk.jpg_w_96_q_75",
];

export function Stats() {
  return (
    <section className="py-8 bg-background">
      <Container>
        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Live counter — dark card */}
          <div className="md:col-span-1 rounded-2xl bg-zinc-950 text-white p-6 flex flex-col justify-between min-h-[180px] relative overflow-hidden">
            <div className="absolute -top-12 -right-12 size-40 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs">
                <Activity className="size-3 text-emerald-400" />
                <span>Live count</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-bold tracking-tight">{POSTS_PUBLISHED}</span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">Posts published</p>
            </div>
          </div>

          {/* Platforms supported — indigo card */}
          <div className="md:col-span-1 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 flex flex-col justify-between min-h-[180px] relative overflow-hidden">
            <div className="absolute -bottom-12 -right-12 size-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-xs">
                <Layers className="size-3" />
                <span>Platforms</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-bold tracking-tight">{PLATFORMS_SUPPORTED}</span>
                <span className="text-base font-medium text-indigo-100">supported</span>
              </div>
              <p className="text-sm text-indigo-100/80 mt-1">TikTok, IG, YT, X, FB, LI, Pinterest, Threads, Bluesky, WP</p>
            </div>
          </div>

          {/* Accounts connected — emerald card */}
          <div className="md:col-span-1 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 flex flex-col justify-between min-h-[180px] relative overflow-hidden">
            <div className="absolute -top-12 -left-12 size-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-xs">
                <Users className="size-3" />
                <span>Accounts</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-bold tracking-tight">{ACCOUNTS_CONNECTED}</span>
              </div>
              <p className="text-sm text-emerald-50/80 mt-1">Social accounts connected</p>
            </div>
          </div>

          {/* Full-width: Join 2,150+ users */}
          <div className="md:col-span-3 rounded-2xl border bg-muted/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {AVATARS.map((src, i) => (
                  <div key={i} className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-background">
                    <Image src={src} alt="User" fill className="object-cover" sizes="40px" />
                  </div>
                ))}
              </div>
              <div>
                <p className="font-semibold leading-tight">Join {USERS_COUNT} users</p>
                <p className="text-sm text-muted-foreground">Growing every day across 60+ countries</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="flex text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-medium ml-1">{RATING}</span>
              </div>
              <span className="text-sm text-muted-foreground">500+ reviews</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}