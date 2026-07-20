import { adminAuth, adminDb } from "./admin";

export const ADMIN_EMAIL = "edylabels@gmail.com";

export async function getAdminUser(uid: string): Promise<{
  uid: string;
  email: string;
  displayName: string;
  role: "owner" | "admin" | "support" | "finance" | "readonly";
  status: "active" | "revoked";
  permissions: string[];
  createdAt?: string;
  invitedBy?: string;
  lastLoginAt?: string;
} | null> {
  if (!adminDb) return null;
  try {
    const snap = await adminDb.collection("adminUsers").doc(uid).get();
    if (!snap.exists) return null;
    const d = snap.data()!;
    return {
      uid,
      email: d.email || "",
      displayName: d.displayName || d.email?.split("@")[0] || "Admin",
      role: d.role || "admin",
      status: d.status || "active",
      permissions: d.permissions || [],
      createdAt: d.createdAt,
      invitedBy: d.invitedBy,
      lastLoginAt: d.lastLoginAt,
    };
  } catch {
    return null;
  }
}

/** Legacy sync check — used by middleware fallback and existing call sites. */
export function isAdminUser(
  user: { email?: string | null } | string | null | undefined
): boolean {
  if (!user) return false;
  if (typeof user === "string") return user.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (user.email) return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  return false;
}

/** Set Firebase Auth custom claims on an admin user. */
export async function setAdminCustomClaims(uid: string, role: string): Promise<void> {
  if (!adminAuth) return;
  try {
    await adminAuth.setCustomUserClaims(uid, { admin: true, role });
  } catch (err) {
    console.error("[admin-auth] Failed to set custom claims:", err);
  }
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ["*"],
  admin: [
    "users.read", "users.write", "billing.read", "billing.write",
    "content.moderate", "affiliates.manage", "platform.settings",
    "security.manage",
  ],
  support: ["users.read", "content.moderate"],
  finance: ["billing.read", "users.read"],
  readonly: ["users.read", "billing.read"],
};

export function getRolePermissions(role: string, overrides?: string[]): string[] {
  if (overrides && overrides.length > 0) return overrides;
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.readonly;
}

export function hasPermission(role: string, permission: string, overrides?: string[]): boolean {
  const perms = getRolePermissions(role, overrides);
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}
