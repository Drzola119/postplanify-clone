"use client";

import * as React from "react";
import { X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export type LearnSectionId = "media-captions" | "publishing" | "troubleshooting";

interface LearnPanelProps {
  open: boolean;
  onClose: () => void;
  initialSection?: LearnSectionId;
}

const SECTIONS: { id: LearnSectionId; heading: string; render: () => React.ReactNode }[] = [
  {
    id: "media-captions",
    heading: "Media & Captions",
    render: () => (
      <>
        <p>Upload images or videos from your device, Canva, or Google Drive.</p>
        <p>You can also create text-only posts for platforms like X, Threads, and Bluesky.</p>
        <p>Each platform can have different captions, text, and hashtags.</p>
        <p>Click the platform icons at the top to preview how your post will look on each platform before publishing.</p>
        <p>
          <strong>Video Posts:</strong> Upload custom thumbnail images to use as video covers.
        </p>
        <div className="my-4 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/learn/media-captions-preview.png"
            alt="Create New Post interface preview"
            className="w-full h-auto"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="px-3 py-2 text-xs text-zinc-500 text-center">
            Create New Post interface
          </div>
        </div>
      </>
    ),
  },
  {
    id: "publishing",
    heading: "Publishing & Platform Features",
    render: () => (
      <>
        <p>
          <strong>Publish Now</strong> - Post immediately to selected platforms.
        </p>
        <p>
          <strong>Schedule for Later</strong> - Choose a specific date and time.
        </p>
        <p>
          <strong>Important:</strong> Keep your browser open while publishing - the process takes a few moments.
        </p>
        <p>
          <strong>Platform-Specific Options:</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>X (Twitter)</strong> - Add first comments for CTAs/links, or post to communities instead of your profile
          </li>
          <li>
            <strong>Instagram &amp; Facebook</strong> - Schedule story posts
          </li>
          <li>
            <strong>YouTube</strong> - Add custom titles and descriptions
          </li>
          <li>
            <strong>Pinterest</strong> - Select which board to post to
          </li>
        </ul>
        <div className="my-4 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/learn/publishing-preview.png"
            alt="Schedule modal preview"
            className="w-full h-auto"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </>
    ),
  },
  {
    id: "troubleshooting",
    heading: "Troubleshooting Failed Posts",
    render: () => (
      <>
        <p>
          Posts can fail due to expired tokens, changed credentials, or unsupported content.
        </p>
        <p>
          <strong>Solution:</strong> Go to the{" "}
          <a href="/dashboard/accounts" className="text-blue-600 underline">
            Accounts page
          </a>{" "}
          and click <strong>Refresh</strong> to reconnect your social accounts.
        </p>
        <p>
          Still having issues? Contact{" "}
          <a href="mailto:hasan@postplanify.com" className="text-blue-600 underline">
            hasan@postplanify.com
          </a>
        </p>
      </>
    ),
  },
];

export function LearnPanel({ open, onClose, initialSection }: LearnPanelProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sectionRefs = React.useRef<Record<LearnSectionId, HTMLDivElement | null>>({
    "media-captions": null,
    publishing: null,
    troubleshooting: null,
  });

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;
    if (!initialSection) return;
    // Wait for layout, then scroll
    const t = setTimeout(() => {
      const el = sectionRefs.current[initialSection];
      if (el && scrollRef.current) {
        scrollRef.current.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
      }
    }, 100);
    return () => clearTimeout(t);
  }, [open, initialSection]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] animate-in fade-in-0 duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Learn"
        className={cn(
          "relative w-full max-w-[600px] h-full bg-white shadow-2xl flex flex-col",
          "animate-in slide-in-from-right duration-300"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="text-base font-semibold">PostPlanify</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-sm font-medium hover:bg-zinc-50"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {/* Author byline */}
        <div className="px-6 py-4 border-b border-zinc-200 flex-shrink-0 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-300 flex items-center justify-center text-zinc-600 text-xs font-semibold">
            HC
          </div>
          <div className="text-sm">
            <div>
              Written by <span className="font-semibold">Hasan Cagli</span>
            </div>
            <div className="text-zinc-500 text-xs">Founder of PostPlanify</div>
          </div>
        </div>

        {/* Scrollable body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {SECTIONS.map((s) => (
            <section
              key={s.id}
              ref={(el) => {
                sectionRefs.current[s.id] = el as HTMLDivElement | null;
              }}
            >
              <h3 className="text-base font-semibold mb-3">{s.heading}</h3>
              <div className="space-y-2 text-sm text-zinc-700 leading-relaxed">{s.render()}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
