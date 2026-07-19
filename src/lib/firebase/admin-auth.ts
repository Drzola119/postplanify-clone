export const ADMIN_EMAIL = "edylabels@gmail.com";

export function isAdminUser(
  user: { email?: string | null } | string | null | undefined
): boolean {
  if (!user) return false;
  if (typeof user === "string") return user.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (user.email) return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  return false;
}
