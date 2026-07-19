import React from "react";
import { getNotifications, getUnreadCount } from "./actions";
import { NotificationsPageClient } from "./_components/NotificationsPageClient";
import type { Notification } from "@/lib/notifications";

export const metadata = {
  title: "Notifications | PostPlanify",
  description: "View and manage your PostPlanify in-app notifications.",
};

export default async function NotificationsPage() {
  let notifications: Notification[] = [];
  let unreadCount = 0;

  try {
    notifications = await getNotifications();
    unreadCount = await getUnreadCount();
  } catch (error) {
    console.warn("[NotificationsPage] Could not fetch server notifications:", error);
  }

  return (
    <NotificationsPageClient
      notifications={notifications}
      unreadCount={unreadCount}
    />
  );
}
