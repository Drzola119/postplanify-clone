import { AdminShell } from "./_components/AdminShell";
import { getUnreadAdminNotificationsCount } from "./actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Fix #6 — fetch live unread count server-side and pass it to the shell
  const unreadNotifications = await getUnreadAdminNotificationsCount();

  return (
    <AdminShell unreadNotifications={unreadNotifications}>
      {children}
    </AdminShell>
  );
}
