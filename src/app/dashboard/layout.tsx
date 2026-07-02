"use client";

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
