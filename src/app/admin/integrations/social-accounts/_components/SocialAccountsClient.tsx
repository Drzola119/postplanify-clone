"use client";

import React, { useState, useMemo } from "react";
import { disconnectSocialAccountAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-700",
  facebook: "bg-blue-100 text-blue-700",
  x: "bg-gray-900 text-white",
  twitter: "bg-gray-900 text-white",
  linkedin: "bg-blue-100 text-blue-800",
  tiktok: "bg-gray-900 text-white",
  threads: "bg-gray-100 text-gray-800",
  youtube: "bg-red-100 text-red-700",
};

interface Props {
  initialAccounts: any[];
}

export function SocialAccountsClient({ initialAccounts }: Props) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const filtered = useMemo(() => {
    if (!search) return accounts;
    const s = search.toLowerCase();
    return accounts.filter((a) =>
      a.accountName?.toLowerCase().includes(s) ||
      a.platform?.toLowerCase().includes(s) ||
      a.userEmail?.toLowerCase().includes(s)
    );
  }, [accounts, search]);

  const handleDisconnect = async (id: string, workspaceId: string) => {
    if (!confirm("Force-disconnect this social account?")) return;
    await disconnectSocialAccountAction(id, workspaceId);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Account Disconnected", tone: "warning" });
  };

  const statusBadge = (status: string) => {
    if (status === "connected") return "px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full";
    if (status === "expiring") return "px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full";
    return "px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full";
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4">
        <input
          type="text"
          placeholder="Search by account, platform, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f]"
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Account</th>
              <th className="px-6 py-3.5">Platform</th>
              <th className="px-6 py-3.5">Workspace</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Token Expiry</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((acc) => {
              const platformColor = PLATFORM_COLORS[acc.platform?.toLowerCase()] ?? "bg-gray-100 text-gray-700";
              return (
                <tr key={acc.id} className="hover:bg-gray-50/80">
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-gray-900">{acc.accountName}</p>
                    <p className="text-[10px] text-gray-500">{acc.userEmail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${platformColor}`}>
                      {acc.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-mono">{acc.workspaceId}</td>
                  <td className="px-6 py-4"><span className={statusBadge(acc.status)}>{acc.status}</span></td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {acc.tokenExpiresAt ? new Date(acc.tokenExpiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDisconnect(acc.id, acc.workspaceId)}
                      className="px-3 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100"
                    >
                      Disconnect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
