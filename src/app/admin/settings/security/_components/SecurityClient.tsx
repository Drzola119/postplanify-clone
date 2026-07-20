"use client";

import React, { useState } from "react";
import { Shield, Smartphone, Globe, LogOut, AlertTriangle, Info } from "lucide-react";
import { toggleIpAllowlistAction, forceLogoutSessionAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  initialInfo: {
    twoFactorEnabled: boolean;
    email: string | null;
    uid: string | null;
    sessions: { id: string; device: string; ip: string; lastActive: string; current: boolean }[];
    ipAllowlistEnabled: boolean;
  };
}

export function SecurityClient({ initialInfo }: Props) {
  const [twoFactorEnabled] = useState(initialInfo.twoFactorEnabled);
  const [ipAllowlist, setIpAllowlist] = useState(initialInfo.ipAllowlistEnabled);
  const [sessions, setSessions] = useState(initialInfo.sessions);
  const { toast } = useToast();

  const handleToggleIpAllowlist = async () => {
    const next = !ipAllowlist;
    await toggleIpAllowlistAction(next);
    setIpAllowlist(next);
    toast({ title: next ? "IP Allowlist Enabled" : "IP Allowlist Disabled", tone: "info" });
  };

  const handleForceLogout = async (sessionId: string) => {
    await forceLogoutSessionAction(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    toast({ title: "Session Terminated", description: "User has been logged out of that session.", tone: "success" });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Two-Factor Authentication Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl shrink-0">
              <Smartphone className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Two-Factor Authentication (2FA)</h3>
              <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your admin account.</p>
              <div className="mt-2 flex items-center gap-2">
                {twoFactorEnabled ? (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Enabled</span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 rounded-full">Not Configured</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
              <Info className="size-3" />
              <span>TODO: Wire Firebase MFA</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-4">
          Firebase Multi-Factor Authentication is not yet configured in the Firebase Console.
          Enable SMS or TOTP-based 2FA in the Authentication &gt; Settings &gt; Multi-factor section.
        </p>
      </div>

      {/* IP Allowlist Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl shrink-0">
              <Globe className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">IP Allowlist</h3>
              <p className="text-xs text-gray-500 mt-1">Restrict admin panel access to specific IP addresses.</p>
            </div>
          </div>
          <button
            onClick={handleToggleIpAllowlist}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ipAllowlist ? "bg-[#01696f]" : "bg-gray-300"}`}
          >
            <span className={`inline-block size-4 transform rounded-full bg-white transition-transform ${ipAllowlist ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        {ipAllowlist && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              IP allowlist enabled. Only traffic from allowed IPs can access the admin panel.
              Configure allowed IPs in the Firebase Console or environment config.
            </p>
          </div>
        )}
      </div>

      {/* Active Sessions Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Shield className="size-5 text-[#01696f]" />
            <h3 className="font-bold text-gray-900 text-sm">Active Sessions</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">Devices and browsers currently signed in to your admin account.</p>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Device & Location</th>
              <th className="px-6 py-3.5">IP Address</th>
              <th className="px-6 py-3.5">Last Active</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50/80">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-gray-900">{session.device}</p>
                    {session.current && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 rounded-full">Current</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 font-mono">{session.ip}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{new Date(session.lastActive).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  {!session.current && (
                    <button
                      onClick={() => handleForceLogout(session.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 ml-auto"
                    >
                      <LogOut className="size-3" />
                      Force Logout
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 && (
          <div className="px-6 py-8 text-center text-xs text-gray-400">No active sessions found.</div>
        )}
      </div>
    </div>
  );
}
