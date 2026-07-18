"use client";

import { usePathname } from "next/navigation";
import { BookOpen, Bell } from "lucide-react";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { useHelpSystem } from "@/components/dashboard/help/help-system";

const TITLE_MAP: Record<string, string> = {
  "/dashboard/posts": "Calendar",
  "/dashboard/posts/drafts": "Drafts",
  "/dashboard/queue": "Queue",
  "/dashboard/analytics": "Analytics",
  "/dashboard/reports": "Reports",
  "/dashboard/inbox": "Social Inbox",
  "/dashboard/assets": "Media Library",
  "/dashboard/infographics": "Infographics",
  "/dashboard/brands": "Workspaces",
  "/dashboard/accounts": "Accounts",
  "/dashboard/settings": "Settings",
};

function usePageTitle(): string {
  const path = usePathname();
  // Exact match first
  if (TITLE_MAP[path]) return TITLE_MAP[path];
  // Prefix match (e.g. /dashboard/infographics/ads)
  for (const [prefix, label] of Object.entries(TITLE_MAP)) {
    if (path.startsWith(prefix + "/")) return label;
  }
  return "";
}

export function DashboardTopbar() {
  const pageTitle = usePageTitle();
  const { openLearn } = useHelpSystem();

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-[240px] h-14 z-30 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
      <span className="text-sm font-semibold text-zinc-800">{pageTitle}</span>
      <div className="flex items-center gap-1">
        <LocaleSwitcher />
        <button
          type="button"
          onClick={() => openLearn()}
          className="inline-flex items-center justify-center size-8 rounded-md hover:bg-zinc-100"
          aria-label="Open Learn panel"
          title="Learn"
        >
          <BookOpen className="size-4 text-zinc-500" />
        </button>
        <button
          type="button"
          className="relative inline-flex items-center justify-center size-8 rounded-md hover:bg-zinc-100"
          aria-label="Notifications"
        >
          <Bell className="size-4 text-zinc-500" />
          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
