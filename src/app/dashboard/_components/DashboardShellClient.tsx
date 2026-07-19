"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { DrawerProvider, useDrawer } from "@/components/dashboard/drawer-provider";
import { LabelsDrawer } from "@/components/dashboard/labels-drawer";
import { HashtagsDrawer } from "@/components/dashboard/hashtags-drawer";
import { PostingScheduleModal } from "@/components/dashboard/posting-schedule-modal";
import { HelpSystemProvider } from "@/components/dashboard/help/help-system";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { getLocaleDir } from "@/lib/i18n/types";
import type { UiLocale } from "@/lib/i18n/types";

function DrawersHost() {
  const { active, closeDrawer } = useDrawer();
  return (
    <>
      <LabelsDrawer open={active === "labels"} onClose={closeDrawer} />
      <HashtagsDrawer open={active === "hashtags"} onClose={closeDrawer} />
      <PostingScheduleModal open={active === "schedule"} onClose={closeDrawer} />
    </>
  );
}

interface DashboardShellClientProps {
  notificationSlot?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShellClient({
  notificationSlot,
  children,
}: DashboardShellClientProps) {
  const { status } = useAuth();
  const router = useRouter();
  const locale = useLocale() as UiLocale;
  const dir = getLocaleDir(locale);

  useEffect(() => {
    // Only force a redirect when the SDK is loaded and there is no session.
    // "loading" means we don't yet know — keep showing the spinner.
    // "disabled" means Firebase isn't configured (e.g. preview environments);
    // render the shell so devs can still see the UI while API calls will
    // return 401/503. Production with valid Firebase config never hits this.
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-text)]" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <DrawerProvider>
      <HelpSystemProvider>
        <div className="min-h-screen bg-[var(--color-bg)]">
          <DashboardSidebar />
          <DashboardTopbar notificationSlot={notificationSlot} />
          <main dir={dir} className="lg:pl-[240px] pt-14 min-h-screen">
            <EmailVerificationBanner />
            {children}
          </main>
          <DrawersHost />
        </div>
      </HelpSystemProvider>
    </DrawerProvider>
  );
}
