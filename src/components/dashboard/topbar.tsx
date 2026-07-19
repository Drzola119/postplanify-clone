"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BookOpen, ShieldAlert } from "lucide-react";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { useHelpSystem } from "@/components/dashboard/help/help-system";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminUser } from "@/lib/firebase/admin-auth";
import { NotificationBell } from "@/app/dashboard/_components/NotificationBell";

function usePageTitle(t: (key: string) => string): string {
  const path = usePathname();
  const PAGE_TITLES: Record<string, string> = {
    "/dashboard/posts": t("topbar.page_calendar"),
    "/dashboard/posts/drafts": t("topbar.page_drafts"),
    "/dashboard/queue": t("topbar.page_queue"),
    "/dashboard/posts/history": t("topbar.page_history"),
    "/dashboard/command-center": t("topbar.page_command_center"),
    "/dashboard/analytics": t("topbar.page_analytics"),
    "/dashboard/reports": t("topbar.page_reports"),
    "/dashboard/inbox": t("topbar.page_inbox"),
    "/dashboard/assets": t("topbar.page_assets"),
    "/dashboard/infographics": t("topbar.page_infographics"),
    "/dashboard/brands": t("topbar.page_brands"),
    "/dashboard/accounts": t("topbar.page_accounts"),
    "/dashboard/automations/dm": t("topbar.page_automations"),
    "/dashboard/destinations": t("topbar.page_destinations"),
    "/dashboard/settings/branding": t("topbar.page_branding"),
    "/dashboard/settings": t("topbar.page_settings"),
    "/dashboard/api-keys": t("topbar.page_api_keys"),
    "/dashboard/notifications": "Notifications",
  };
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  for (const [prefix, label] of Object.entries(PAGE_TITLES)) {
    if (path.startsWith(prefix + "/")) return label;
  }
  return "";
}

export function DashboardTopbar() {
  const t = useTranslations("shell");
  const pageTitle = usePageTitle(t);
  const { openLearn } = useHelpSystem();
  const auth = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-[240px] h-14 z-30 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
      <span className="text-sm font-semibold text-zinc-800">{pageTitle}</span>
      <div className="flex items-center gap-2">
        {isAdminUser(auth.user) && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <ShieldAlert className="size-3.5 text-white" />
            Admin Panel
          </Link>
        )}
        <LocaleSwitcher />
        <button
          type="button"
          onClick={() => openLearn()}
          className="inline-flex items-center justify-center size-8 rounded-md hover:bg-zinc-100"
          aria-label={t("topbar.learn")}
          title={t("topbar.learn")}
        >
          <BookOpen className="size-4 text-zinc-500" />
        </button>
        <NotificationBell />
      </div>
    </header>
  );
}
