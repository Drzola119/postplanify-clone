import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/admin";
import { isAdminUser } from "@/lib/firebase/admin-auth";
import { AdminShell } from "./_components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdminUser(user)) {
    redirect("/dashboard?error=access_denied");
  }

  return <AdminShell>{children}</AdminShell>;
}
