import Image from "next/image";
import { Container } from "@/components/ui/container";

const PLATFORMS = [
  { name: "TikTok", logo: "/images/postplanify/llm-logos__claude.svg", color: "from-black to-pink-600" },
  { name: "Instagram", logo: "/images/postplanify/llm-logos__claude.svg", color: "from-purple-500 via-pink-500 to-orange-400" },
  { name: "YouTube", logo: "/images/postplanify/llm-logos__claude.svg", color: "from-red-500 to-red-700" },
  { name: "X / Twitter", logo: "/images/postplanify/llm-logos__claude.svg", color: "from-black to-zinc-800" },
  { name: "Facebook", logo: "/images/postplanify/llm-logos__claude.svg", color: "from-blue-500 to-blue-700" },
  { name: "LinkedIn", logo: "/images/postplanify/llm-logos__claude.svg", color: "from-blue-600 to-blue-800" },
  { name: "Pinterest", logo: "/images/postplanify/llm-logos__claude.svg", color: "from-red-500 to-red-700" },
  { name: "Threads", logo: "/images/postplanify/llm-logos__claude.svg", color: "from-black to-zinc-900" },
  { name: "Bluesky", logo: "/images/postplanify/llm-logos__claude.svg", color: "from-blue-400 to-blue-600" },
  { name: "WordPress", logo: "/images/postplanify/llm-logos__claude.svg", color: "from-sky-600 to-blue-700" },
];

export function Integrations() {
  return (
    <section
      id="integrations"
      className="py-12 border-t border-b bg-muted/10"
    >
      <Container>
        <h2 className="text-center text-[20px] font-medium leading-[28px] text-[rgb(115,115,115)]">
          Connect and publish to all your favorite platforms
        </h2>

        <div className="mt-8 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-4">
          {PLATFORMS.map((p) => (
            <div
              key={p.name}
              className="group flex flex-col items-center gap-2"
            >
              <div
                className={`relative size-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
              >
                <Image
                  src={p.logo}
                  alt={p.name}
                  width={28}
                  height={28}
                  className="invert opacity-90"
                />
              </div>
              <span className="text-xs text-muted-foreground text-center">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}