export const ADMIN_EMAIL = "edylabels@gmail.com";

/**
 * Pure, client-safe admin check based solely on the owner email.
 * Does NOT import the server-only firebase-admin module, so it can be
 * used inside Client Components (e.g. sidebar/topbar) without pulling
 * grpc/google-gax into the browser bundle.
 */
export function isAdminUser(
  user: { email?: string | null } | string | null | undefined
): boolean {
  if (!user) return false;
  if (typeof user === "string") return user.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (user.email) return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  return false;
}
