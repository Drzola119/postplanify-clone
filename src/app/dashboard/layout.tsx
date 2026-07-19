import React from "react";
import { TopbarNotificationSlot } from "@/components/dashboard/TopbarNotificationSlot";
import { DashboardShellClient } from "./_components/DashboardShellClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const notificationSlot = <TopbarNotificationSlot />;
  return (
    <DashboardShellClient notificationSlot={notificationSlot}>
      {children}
    </DashboardShellClient>
  );
}
