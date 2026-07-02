import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";

const LLM_LOGOS = [
  { src: "/images/postplanify/llm-logos__claude.svg", alt: "Claude" },
  { src: "/images/postplanify/llm-logos__chatgpt.svg", alt: "ChatGPT", invert: true },
  { src: "/images/postplanify/llm-logos__gemini.svg", alt: "Gemini" },
  { src: "/images/postplanify/llm-logos__perplexity.svg", alt: "Perplexity" },
  { src: "/images/postplanify/llm-logos__grok.svg", alt: "Grok" },
];

export function AnnouncementBar() {
  return (
    <div className="relative w-full overflow-hidden bg-zinc-950 text-white">
      {/* Radial gradient overlay (violet glow from top) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_140%_at_50%_0%,rgba(139,92,246,0.22),transparent)]"
      />
      {/* Top border line */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent"
      />
      {/* Top blur glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent blur-[3px]"
      />

      <Link
        href="/mcp"
        className="group relative block"
        data-umami-event="Announcement Bar: MCP | Link"
      >
        <Container>
          <div className="flex items-center justify-center gap-2.5 py-2 text-xs sm:text-sm">
            {/* "New" pill badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/15">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
              </span>
              New
            </span>

            <span className="font-medium text-white/90">
              <span className="sm:hidden">Run social from your AI</span>
              <span className="hidden sm:inline">Turn your AI into a social media manager</span>
            </span>

            {/* LLM logos (desktop only) */}
            <span className="hidden items-center -space-x-1.5 sm:flex">
              {LLM_LOGOS.map((logo) => (
                <span
                  key={logo.alt}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-white/15"
                >
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={12}
                    height={12}
                    className={logo.invert ? "invert" : ""}
                  />
                </span>
              ))}
            </span>

            {/* Arrow (hover-revealed) */}
            <span className="hidden text-white/60 transition-transform group-hover:translate-x-0.5 sm:inline">
              →
            </span>
          </div>
        </Container>
      </Link>
    </div>
  );
}
