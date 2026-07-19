import { Container } from "@/components/ui/container";
import {
  Music2,
  Camera,
  Play,
  MessageCircle,
  ThumbsUp,

  PinIcon,
  MessageSquare,
  Cloud,
  Globe,
  Briefcase,
} from "lucide-react";

const PLATFORMS = [
  { name: "TikTok", icon: Music2, color: "from-black to-pink-600" },
  { name: "Instagram", icon: Camera, color: "from-purple-500 via-pink-500 to-orange-400" },
  { name: "YouTube", icon: Play, color: "from-red-500 to-red-700" },
  { name: "X / Twitter", icon: MessageCircle, color: "from-black to-zinc-800" },
  { name: "Facebook", icon: ThumbsUp, color: "from-blue-500 to-blue-700" },
  { name: "LinkedIn", icon: Briefcase, color: "from-blue-600 to-blue-800" },
  { name: "Pinterest", icon: PinIcon, color: "from-red-500 to-red-700" },
  { name: "Threads", icon: MessageSquare, color: "from-black to-zinc-900" },
  { name: "Bluesky", icon: Cloud, color: "from-blue-400 to-blue-600" },
  { name: "WordPress", icon: Globe, color: "from-sky-600 to-blue-700" },
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
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className="group flex flex-col items-center gap-2"
              >
                <div
                  className={`relative size-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <Icon className="size-6 text-white" />
                </div>
                <span className="text-xs text-muted-foreground text-center">
                  {p.name}
                </span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}