/**
 * /dashboard/videos
 * Video Studio hub — four workflow cards.
 * Mirrors src/app/dashboard/infographics/page.tsx structure.
 */
import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Film,
  Home,
  PenTool,
  Zap,
  Sparkles,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Video Studio",
  description: "Generate AI-powered videos from your content.",
};

const WORKFLOWS = [
  {
    id: "cartoon",
    href: "/dashboard/videos/cartoon",
    icon: Sparkles,
    available: true,
    badge: "New",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "viral",
    href: "/dashboard/videos/viral",
    icon: Zap,
    available: false,
    badge: "Soon",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    id: "real-estate",
    href: "/dashboard/videos/real-estate",
    icon: Home,
    available: false,
    badge: "Soon",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "whiteboard",
    href: "/dashboard/videos/whiteboard",
    icon: PenTool,
    available: false,
    badge: "Soon",
    gradient: "from-amber-500 to-orange-600",
  },
] as const;

export default async function VideosPage() {
  const t = await getTranslations("videos");

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30">
          <Film className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("landing.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("landing.subtitle")}
          </p>
        </div>
      </div>

      {/* Workflow cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        {WORKFLOWS.map(({ id, href, icon: Icon, available, badge, gradient }) => (
          <WorkflowCard
            key={id}
            href={href}
            icon={<Icon className="size-6 text-white" />}
            title={t(`landing.${id}_title`)}
            summary={t(`landing.${id}_summary`)}
            badge={badge}
            available={available}
            gradient={gradient}
          />
        ))}
      </div>
    </div>
  );
}

function WorkflowCard({
  href,
  icon,
  title,
  summary,
  badge,
  available,
  gradient,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  summary: string;
  badge: string;
  available: boolean;
  gradient: string;
}) {
  const card = (
    <div
      className={`group relative flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-all
        ${
          available
            ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            : "opacity-60 cursor-not-allowed"
        }`}
    >
      {/* Gradient icon badge */}
      <div
        className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}
      >
        {icon}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg leading-tight">{title}</h2>
          <Badge
            variant={available ? "default" : "secondary"}
            className="text-xs"
          >
            {badge}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
      </div>

      {!available && (
        <Lock className="absolute top-4 end-4 size-4 text-muted-foreground" />
      )}
    </div>
  );

  if (!available) return card;
  return <Link href={href}>{card}</Link>;
}
