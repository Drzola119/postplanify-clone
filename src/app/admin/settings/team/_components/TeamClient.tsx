"use client";

import React, { useState } from "react";
import { UserCog, Plus, Shield, ShieldOff } from "lucide-react";
import { inviteAdminAction, updateAdminRoleAction, revokeAdminAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

const ROLES = [
  { value: "admin", label: "Admin", description: "Full access except admin management" },
  { value: "support", label: "Support", description: "User read + content moderation" },
  { value: "finance", label: "Finance", description: "Billing & revenue read-only" },
  { value: "readonly", label: "Read Only", description: "View dashboards only" },
] as const;

const ROLE_BADGE: Record<string, string> = {
  owner: "px-2.5 py-0.5 text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 rounded-full",
  admin: "px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full",
  support: "px-2.5 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full",
  finance: "px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full",
  readonly: "px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 rounded-full",
};

interface AdminUserDisplay {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
  invitedBy?: string;
  permissions?: string[];
  invitePending?: boolean;
  invitedAt?: string;
}

interface Props {
  initialAdmins: AdminUserDisplay[];
}

export function TeamClient({ initialAdmins }: Props) {
  const [admins, setAdmins] = useState<AdminUserDisplay[]>(initialAdmins);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("admin");
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const result = await inviteAdminAction({ email: inviteEmail.trim(), role: inviteRole as "admin" | "support" | "finance" | "readonly" });
    setInviting(false);
    if (result.success) {
      toast({ title: "Admin Invited", description: `Invitation sent to ${inviteEmail}`, tone: "success" });
      setAdmins((prev) => [
        ...prev,
        {
          uid: `pending_${Date.now()}`,
          email: inviteEmail,
          displayName: inviteEmail.split("@")[0],
          role: inviteRole,
          status: "revoked",
          invitedAt: new Date().toISOString(),
          invitePending: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      setShowInvite(false);
      setInviteEmail("");
    } else {
      toast({ title: "Invite Failed", description: result.error || "Unknown error", tone: "error" });
    }
  };

  const handleRoleChange = async (uid: string, role: string) => {
    await updateAdminRoleAction(uid, role);
    setAdmins((prev) => prev.map((a) => (a.uid === uid ? { ...a, role } : a)));
    toast({ title: "Role Updated", description: `Admin role changed to ${role}`, tone: "info" });
  };

  const handleRevoke = async (uid: string) => {
    if (!confirm("Revoke admin access for this user? This cannot be undone.")) return;
    await revokeAdminAction(uid);
    setAdmins((prev) => prev.map((a) => (a.uid === uid ? { ...a, status: "revoked" } : a)));
    toast({ title: "Access Revoked", description: "Admin privileges removed", tone: "warning" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{admins.length} admin account{admins.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#01696f] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#015257]"
        >
          <Plus className="size-4" />
          Invite Admin
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Admin</th>
              <th className="px-6 py-3.5">Role</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Invited By</th>
              <th className="px-6 py-3.5">Created</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admins.map((admin) => (
              <tr key={admin.uid} className="hover:bg-gray-50/80">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gradient-to-tr from-[#01696f] to-teal-400 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {admin.displayName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{admin.displayName || "Unnamed"}</p>
                      <p className="text-[10px] text-gray-500">{admin.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {admin.role === "owner" ? (
                    <span className={ROLE_BADGE.owner}>Owner</span>
                  ) : (
                    <select
                      value={admin.role}
                      onChange={(e) => handleRoleChange(admin.uid, e.target.value)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-6 py-4">
                  {admin.status === "active" ? (
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Active</span>
                  ) : admin.invitePending ? (
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">Pending</span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">Revoked</span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{admin.invitedBy || "—"}</td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  {admin.role !== "owner" && (
                    <div className="flex items-center justify-end gap-2">
                      {admin.status === "active" ? (
                        <button
                          onClick={() => handleRevoke(admin.uid)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100"
                        >
                          <ShieldOff className="size-3" />
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(admin.uid, "admin")}
                          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100"
                        >
                          <Shield className="size-3" />
                          Reactivate
                        </button>
                      )}
                    </div>
                  )}
                  {admin.role === "owner" && (
                    <span className="text-[10px] text-gray-400 italic">Owner</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleInvite} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <UserCog className="size-5 text-[#01696f]" />
              <h3 className="font-bold text-gray-900 text-sm">Invite Admin User</h3>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Email Address:</label>
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Role:</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 text-xs bg-[#01696f] text-white font-bold rounded-xl hover:bg-[#015257] disabled:opacity-50"
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
