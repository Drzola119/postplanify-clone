"use client";

import { useMemo } from "react";
import type {
  CarouselDocument,
  CarouselSlideItem,
  CarouselAspectRatio,
} from "@/lib/carousel-gen/types";

interface SlideCanvasProps {
  deck: CarouselDocument;
  slide: CarouselSlideItem;
  slideIndex: number;
  totalSlides: number;
  showSafeZones?: boolean;
  brandKit?: any;
}

export function SlideCanvas({
  deck,
  slide,
  slideIndex,
  totalSlides,
  showSafeZones = false,
  brandKit,
}: SlideCanvasProps) {
  const isSquare = deck.aspectRatio === "1:1";
  const isPortrait = deck.aspectRatio === "4:5";
  const isStory = deck.aspectRatio === "9:16";

  const aspectRatioClass = isSquare
    ? "aspect-square"
    : isPortrait
    ? "aspect-[4/5]"
    : "aspect-[9/16]";

  const bgColor =
    slide.backgroundColor ||
    brandKit?.colors?.background ||
    deck.style?.colors?.background ||
    "#ffffff";

  const textColor =
    slide.textColor ||
    brandKit?.colors?.primary ||
    deck.style?.colors?.primary ||
    "#0f172a";

  const accentColor =
    slide.accentColor ||
    brandKit?.colors?.accent ||
    deck.style?.colors?.accent ||
    "#3b82f6";

  const displayFont =
    slide.displayFont ||
    brandKit?.fonts?.display ||
    deck.style?.fonts?.display ||
    "Outfit";

  const bodyFont =
    slide.bodyFont ||
    brandKit?.fonts?.body ||
    deck.style?.fonts?.body ||
    "Inter";

  const textAlign = slide.textAlign || "left";

  return (
    <div
      className={`relative w-full max-w-lg ${aspectRatioClass} rounded-2xl shadow-2xl overflow-hidden select-none border border-zinc-700/50 flex flex-col justify-between p-8 sm:p-10 transition-all`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Background Image Layer */}
      {slide.backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url(${slide.backgroundImageUrl})`,
            opacity: (slide.backgroundOpacity ?? 20) / 100,
          }}
        />
      )}

      {/* Instagram 1:1 Safe Zone Guide Overlay */}
      {showSafeZones && isPortrait && (
        <div className="absolute inset-x-0 top-[12.5%] bottom-[12.5%] border-2 border-dashed border-amber-400/50 pointer-events-none flex items-start justify-end p-2 z-30">
          <span className="text-[10px] font-mono uppercase bg-amber-500 text-zinc-950 font-bold px-1.5 py-0.5 rounded shadow">
            1:1 Profile Crop
          </span>
        </div>
      )}

      {/* Top Slide Header (Branding & Tag) */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {brandKit?.logoUrl && (
            <img
              src={brandKit.logoUrl}
              alt="Logo"
              className="h-5 w-auto object-contain"
            />
          )}
          {brandKit?.socialHandle && (
            <span
              className="text-xs font-semibold opacity-75"
              style={{ color: textColor, fontFamily: bodyFont }}
            >
              {brandKit.socialHandle}
            </span>
          )}
        </div>

        {/* Slide Counter */}
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm"
          style={{
            backgroundColor: `${accentColor}20`,
            color: accentColor,
            fontFamily: bodyFont,
          }}
        >
          {slide.type || "Slide"} {slideIndex + 1}/{totalSlides}
        </span>
      </div>

      {/* Center Main Content Area */}
      <div
        className="relative z-10 flex-1 flex flex-col justify-center my-4"
        style={{ textAlign }}
      >
        {/* Subheadline / Kicker */}
        {slide.subheadline && (
          <p
            className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 opacity-80"
            style={{ color: accentColor, fontFamily: bodyFont }}
          >
            {slide.subheadline}
          </p>
        )}

        {/* Headline */}
        <h2
          className="text-2xl sm:text-3xl font-black leading-tight tracking-tight drop-shadow-sm"
          style={{
            color: textColor,
            fontFamily: displayFont,
            fontSize: slide.fontSizeScale ? `${1.875 * slide.fontSizeScale}rem` : undefined,
          }}
        >
          {slide.headline || "Enter Headline..."}
        </h2>

        {/* Body Copy */}
        {slide.body && (
          <p
            className="text-sm sm:text-base mt-4 leading-relaxed opacity-90"
            style={{ color: textColor, fontFamily: bodyFont }}
          >
            {slide.body}
          </p>
        )}

        {/* Stats Callout if stats slide */}
        {slide.statsValue && (
          <div className="my-4">
            <span
              className="text-4xl sm:text-5xl font-black block tracking-tight"
              style={{ color: accentColor, fontFamily: displayFont }}
            >
              {slide.statsValue}
            </span>
            {slide.statsLabel && (
              <span
                className="text-xs sm:text-sm font-medium opacity-75"
                style={{ color: textColor, fontFamily: bodyFont }}
              >
                {slide.statsLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer (Swipe Indicator & Watermark) */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-black/10">
        <span
          className="text-[11px] font-medium opacity-60"
          style={{ color: textColor, fontFamily: bodyFont }}
        >
          {deck.title || "PostPlanify Carousel"}
        </span>

        <div className="flex items-center gap-1.5">
          <span
            className="text-[11px] font-bold"
            style={{ color: accentColor, fontFamily: bodyFont }}
          >
            {slideIndex === totalSlides - 1 ? "Comment Below 💬" : "Swipe ➡️"}
          </span>
        </div>
      </div>
    </div>
  );
}
