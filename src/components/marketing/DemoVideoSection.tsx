"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import {
  TikTokIcon,
  InstagramIcon,
  FacebookIcon,
  XIcon,
  YouTubeIcon,
  LinkedInIcon,
  ThreadsIcon,
  PinterestIcon,
} from "@/data/platform-icons";

export function DemoVideoSection({
  youtubeId,
  title = "See PostPlanify in action",
  duration = "6 mins",
}: {
  youtubeId: string;
  title?: string;
  duration?: string;
}) {
  const [open, setOpen] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`;

  return (
    <section className="dark relative mt-16 mb-16 overflow-hidden bg-[rgb(3,7,18)] py-20 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[120px]"></div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden select-none md:block">
        <span className="absolute left-[4%] top-[14%] -rotate-[14deg] text-pink-500 opacity-80">
          <InstagramIcon className="h-10 w-10" />
        </span>
        <span className="absolute left-[13%] top-[30%] rotate-[10deg] text-blue-600 opacity-70">
          <LinkedInIcon className="h-10 w-10" />
        </span>
        <span className="absolute left-[7%] top-[50%] rotate-[8deg] text-blue-500 opacity-80">
          <FacebookIcon className="h-10 w-10" />
        </span>
        <span className="absolute left-[3%] top-[70%] rotate-[16deg] text-white opacity-75">
          <TikTokIcon className="h-10 w-10" />
        </span>
        <span className="absolute left-[16%] top-[68%] -rotate-[8deg] text-red-500 opacity-70">
          <YouTubeIcon className="h-10 w-10" />
        </span>
        <span className="absolute right-[4%] top-[15%] rotate-[12deg] text-sky-500 opacity-80">
          <XIcon className="h-10 w-10" />
        </span>
        <span className="absolute right-[12%] top-[35%] -rotate-[10deg] text-blue-700 opacity-70">
          <ThreadsIcon className="h-10 w-10" />
        </span>
        <span className="absolute right-[6%] top-[55%] rotate-[14deg] text-red-600 opacity-80">
          <PinterestIcon className="h-10 w-10" />
        </span>
      </div>
      <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-200">
            <Play className="h-4 w-4 fill-current" />
            Product demo
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-400">
            Watch how teams plan, schedule, publish, and report on every social account &mdash; all from one dashboard.
          </p>
        </div>

        {open ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-black shadow-2xl">
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative block w-full overflow-hidden rounded-2xl border bg-gray-900 shadow-2xl transition-shadow hover:shadow-3xl"
            aria-label={`Play ${title} video`}
          >
            <div className="relative aspect-video w-full">
              <Image
                src={thumb}
                alt={title}
                fill
                sizes="(max-width: 1100px) 100vw, 1100px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"></div>
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-md text-sm font-semibold">
                Watch &ldquo;How It Works&rdquo;
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                  <svg className="w-8 h-8 text-white translate-x-[1px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"></path>
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
                {duration}
              </div>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}