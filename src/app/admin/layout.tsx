import { AdminShell } from "./_components/AdminShell";
import { getUnreadAdminNotificationsCount, getCurrentAdminProfile } from "./actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [unreadNotifications, adminProfile] = await Promise.all([
    getUnreadAdminNotificationsCount(),
    getCurrentAdminProfile().catch(() => null),
  ]);

  return (
    <AdminShell unreadNotifications={unreadNotifications} adminProfile={adminProfile ?? undefined}>
      {children}
    </AdminShell>
  );
}
