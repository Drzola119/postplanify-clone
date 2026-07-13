"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DrawerProvider, useDrawer } from "@/components/dashboard/drawer-provider";
import { LabelsDrawer } from "@/components/dashboard/labels-drawer";
import { HashtagsDrawer } from "@/components/dashboard/hashtags-drawer";
import { PostingScheduleModal } from "@/components/dashboard/posting-schedule-modal";

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <DrawerProvider>
      <div className="min-h-screen bg-zinc-50">
        <DashboardSidebar />
        <div className="lg:pl-[240px]">{children}</div>
        <DrawersHost />
      </div>
    </DrawerProvider>
  );
}
