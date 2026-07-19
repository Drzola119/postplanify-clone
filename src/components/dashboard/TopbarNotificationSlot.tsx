import { getNotifications, getUnreadCount } from "@/app/dashboard/notifications/actions";
import { NotificationBell } from "@/app/dashboard/_components/NotificationBell";

export async function TopbarNotificationSlot() {
  let initialNotifications: Awaited<ReturnType<typeof getNotifications>> = [];
  let initialUnreadCount = 0;

  try {
    [initialNotifications, initialUnreadCount] = await Promise.all([
      getNotifications(),
      getUnreadCount(),
    ]);
  } catch {
    // Silently fail — bell renders in empty state
  }

  return (
    <NotificationBell
      initialUnreadCount={initialUnreadCount}
      initialNotifications={initialNotifications}
    />
  );
}
