import Image from "next/image";
import { Code2, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";
import { SectionHeading } from "@/components/ui/section-heading";

const LLM_LOGOS = [
  { src: "/images/postplanify/llm-logos__claude.svg", alt: "Claude" },
  { src: "/images/postplanify/llm-logos__chatgpt.svg", alt: "ChatGPT" },
  { src: "/images/postplanify/llm-logos__gemini.svg", alt: "Gemini" },
  { src: "/images/postplanify/llm-logos__perplexity.svg", alt: "Perplexity" },
  { src: "/images/postplanify/llm-logos__grok.svg", alt: "Grok" },
];

export function API() {
  return (
    <section className="py-14 bg-zinc-950 text-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: text */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium mb-4 text-white">
              <Sparkles className="size-3 text-indigo-300" />
              Included in All Plans
            </div>
            <h2 className="text-[36px] font-bold leading-[40px] tracking-normal text-left text-white mb-4">
              Build with PostPlanify API
            </h2>
            <p className="mt-4 text-lg text-zinc-300">
              Automate your social media workflows, build custom integrations, and connect your own tools — all through a simple, well-documented REST API.
            </p>

            <ul className="mt-6 space-y-2">
              <li className="flex items-center gap-2 text-sm text-zinc-200">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">✓</span>
                No extra cost
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-200">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">✓</span>
                Simple setup
              </li>
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <CTAButton variant="pill" Icon={Code2} href="/features/api">Explore API Docs</CTAButton>
              <CTAButton variant="pill" href="/signup" className="bg-white text-zinc-900 hover:bg-zinc-100">Get Your API Key</CTAButton>
            </div>

            {/* MCP section */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-sm font-medium mb-3 text-zinc-200">Prefer using AI? Connect via MCP</p>
              <div className="flex items-center gap-2 flex-wrap">
                {LLM_LOGOS.map((logo) => (
                  <div key={logo.alt} className="size-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center p-2">
                    <Image src={logo.src} alt={logo.alt} width={24} height={24} className="object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: code block */}
          <div className="rounded-2xl bg-zinc-950 text-zinc-100 p-6 shadow-2xl border border-zinc-800">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="size-3 rounded-full bg-red-500/80" />
              <span className="size-3 rounded-full bg-yellow-500/80" />
              <span className="size-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-zinc-500">POST /api/v1/posts</span>
            </div>
            <pre className="text-xs leading-relaxed overflow-x-auto">
              <code>
                <span className="text-pink-400">POST</span>{" "}
                <span className="text-emerald-400">/api/v1/posts</span>
                {"\n"}
                {"{"}
                {"\n  "}
                <span className="text-sky-300">&quot;workspaceId&quot;</span>
                <span className="text-zinc-500">:</span>{" "}
                <span className="text-amber-300">&quot;ws_123&quot;</span>
                <span className="text-zinc-500">,</span>
                {"\n  "}
                <span className="text-sky-300">&quot;socialAccountId&quot;</span>
                <span className="text-zinc-500">:</span>{" "}
                <span className="text-amber-300">&quot;sa_456&quot;</span>
                <span className="text-zinc-500">,</span>
                {"\n  "}
                <span className="text-sky-300">&quot;caption&quot;</span>
                <span className="text-zinc-500">:</span>{" "}
                <span className="text-amber-300">&quot;Launched our new feature!&quot;</span>
                <span className="text-zinc-500">,</span>
                {"\n  "}
                <span className="text-sky-300">&quot;scheduledAt&quot;</span>
                <span className="text-zinc-500">:</span>{" "}
                <span className="text-amber-300">&quot;2026-03-15T20:00:00.000Z&quot;</span>
                <span className="text-zinc-500">,</span>
                {"\n  "}
                <span className="text-sky-300">&quot;mediaIds&quot;</span>
                <span className="text-zinc-500">:</span>{" "}
                [<span className="text-amber-300">&quot;media_789&quot;</span>]
                {"\n"}
                {"}"}
              </code>
            </pre>
          </div>
        </div>
      </Container>
    </section>
  );
}
