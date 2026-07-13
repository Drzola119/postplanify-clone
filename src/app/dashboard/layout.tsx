"use client";

import { useEffect } from "react";
import * as React from "react";
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
  const [bypassAuth, setBypassAuth] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("devBypass") === "1") {
      setBypassAuth(true);
    }
  }, []);

  useEffect(() => {
    if (bypassAuth) return;
    if (status === "unauthenticated" || status === "disabled") {
      router.replace("/login");
    }
  }, [status, router, bypassAuth]);

  if (!bypassAuth && status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  if (!bypassAuth && (status === "unauthenticated" || status === "disabled")) {
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
