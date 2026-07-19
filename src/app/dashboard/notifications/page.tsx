import { getNotifications, getUnreadCount } from "./actions";
import { NotificationsPageClient } from "./_components/NotificationsPageClient";

export const metadata = { title: "Notifications — PostPlanify" };

export default async function NotificationsPage() {
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadCount(),
  ]);

  return (
    <NotificationsPageClient
      notifications={notifications}
      unreadCount={unreadCount}
    />
  );
}
