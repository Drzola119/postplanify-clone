"use client";

import * as React from "react";
import { X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HelpBlock, HelpTopic, InlineSpan } from "@/lib/help/content";
import { helpHeader } from "@/lib/help/content";

interface HelpDrawerProps {
  open: boolean;
  onClose: () => void;
  triggerLabel: string;
  topic: HelpTopic | null;
}

export function HelpDrawer({ open, onClose, triggerLabel, topic }: HelpDrawerProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);

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
    const mql = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [open]);

  React.useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [open, topic?.id]);

  if (!open || !topic) return null;
  const header = helpHeader();

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
        aria-label={`${triggerLabel} — ${topic.label}`}
        className={cn(
          "relative h-full bg-white shadow-2xl flex flex-col",
          isMobile ? "w-full" : "w-[500px] xl:w-[600px]",
          "animate-in slide-in-from-right duration-300"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img
              src={header.logo}
              alt="PostPlanify"
              width={32}
              height={32}
              className={cn("h-8 w-8", isMobile && "hidden")}
            />
            <BookOpen className={cn("w-4 h-4", isMobile ? "block" : "hidden")} />
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

        <div className="px-6 py-4 border-b border-zinc-200 flex-shrink-0 flex items-center gap-3">
          <img
            src={header.avatar}
            alt={header.author}
            width={48}
            height={48}
            className={cn(
              "rounded-full object-cover bg-zinc-200",
              isMobile ? "h-8 w-8" : "h-12 w-12"
            )}
          />
          <div className="text-sm">
            <div>
              Written by <span className="font-semibold">{header.author}</span>
            </div>
            <div className="text-zinc-500 text-xs">{header.role}</div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <article key={topic.id} className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">{topic.label}</h2>
            <div className="space-y-4 text-sm text-zinc-700 leading-relaxed">
              {topic.blocks.map((block, i) => (
                <BlockRenderer key={i} block={block} />
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: HelpBlock }) {
  switch (block.kind) {
    case "heading":
      return block.level === 2 ? (
        <h3 className="text-base font-semibold text-zinc-900 mt-6 mb-2">{block.text}</h3>
      ) : (
        <h4 className="text-sm font-semibold text-zinc-900 mt-4 mb-1">{block.text}</h4>
      );
    case "paragraph":
      return (
        <p>
          {block.spans.map((s, i) => (
            <InlineSpanRenderer key={i} span={s} />
          ))}
        </p>
      );
    case "list":
      return block.ordered ? (
        <ol className="list-decimal pl-5 space-y-1">
          {block.items.map((item, i) => (
            <li key={i}>
              {item.map((s, j) => (
                <InlineSpanRenderer key={j} span={s} />
              ))}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc pl-5 space-y-1">
          {block.items.map((item, i) => (
            <li key={i}>
              {item.map((s, j) => (
                <InlineSpanRenderer key={j} span={s} />
              ))}
            </li>
          ))}
        </ul>
      );
    case "image":
      return (
        <figure className="my-4 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt} className="w-full h-auto" />
        </figure>
      );
    case "callout":
      return (
        <div
          className={cn(
            "my-4 rounded-md border-l-4 px-4 py-3 text-sm",
            block.tone === "tip"
              ? "border-amber-400 bg-amber-50 text-amber-900"
              : "border-sky-400 bg-sky-50 text-sky-900"
          )}
        >
          {block.spans.map((s, i) => (
            <InlineSpanRenderer key={i} span={s} />
          ))}
        </div>
      );
  }
}

function InlineSpanRenderer({ span }: { span: InlineSpan }) {
  if ("link" in span && span.link) {
    const external = span.link.external ?? !span.link.href.startsWith("/");
    return (
      <a
        href={span.link.href}
        className="text-blue-600 underline"
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {span.text}
      </a>
    );
  }
  return "bold" in span && span.bold ? <strong>{span.text}</strong> : <>{span.text}</>;
}