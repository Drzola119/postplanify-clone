"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  suspendWorkspaceAction,
  reactivateWorkspaceAction,
  transferWorkspaceOwnershipAction,
  type AdminWorkspaceRow,
} from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  workspaces: AdminWorkspaceRow[];
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600 border border-gray-200",
  pro: "bg-teal-50 text-teal-700 border border-teal-200",
  team: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  enterprise: "bg-purple-50 text-purple-700 border border-purple-200",
};

export function WorkspacesClient({ workspaces }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [transferTo, setTransferTo] = useState<string>("");
  const [transferId, setTransferId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return workspaces;
    const s = search.toLowerCase();
    return workspaces.filter(
      (w) => w.name?.toLowerCase().includes(s) || w.ownerUid?.toLowerCase().includes(s)
    );
  }, [workspaces, search]);

  const handleSuspend = async (id: string, suspended: boolean) => {
    if (suspended) {
      await reactivateWorkspaceAction(id);
      toast({ title: "Workspace Reactivated", tone: "info" });
    } else {
      if (!confirm("Suspend this workspace? Publishing and API access will be blocked.")) return;
      await suspendWorkspaceAction(id);
      toast({ title: "Workspace Suspended", tone: "warning" });
    }
    router.refresh();
  };

  const handleTransfer = async (id: string) => {
    if (!transferTo.trim()) return;
    await transferWorkspaceOwnershipAction(id, transferTo.trim());
    setTransferId(null);
    setTransferTo("");
    toast({ title: "Ownership Transferred", tone: "success" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4">
        <input
          type="text"
          placeholder="Search by name or owner UID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f]"
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Workspace</th>
              <th className="px-6 py-3.5">Owner</th>
              <th className="px-6 py-3.5">Plan</th>
              <th className="px-6 py-3.5">Members</th>
              <th className="px-6 py-3.5">Created</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((w) => {
              const planColor = PLAN_COLORS[w.plan] ?? PLAN_COLORS.free;
              return (
                <tr key={w.workspaceId} className="hover:bg-gray-50/80 align-top">
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-gray-900">{w.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{w.workspaceId}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 font-mono">{w.ownerUid}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${planColor}`}>{w.plan}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">{w.memberCount}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {w.suspended ? (
                      <span className="px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">Suspended</span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-y-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleSuspend(w.workspaceId, w.suspended)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border ${
                          w.suspended
                            ? "text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100"
                            : "text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        {w.suspended ? "Reactivate" : "Suspend"}
                      </button>
                    </div>
                    {transferId === w.workspaceId ? (
                      <div className="flex justify-end gap-1">
                        <input
                          value={transferTo}
                          onChange={(e) => setTransferTo(e.target.value)}
                          placeholder="new owner UID"
                          className="w-32 p-1 text-[10px] border border-gray-200 rounded-lg"
                        />
                        <button
                          onClick={() => handleTransfer(w.workspaceId)}
                          className="px-2 py-1 text-[10px] font-bold text-white bg-[#01696f] rounded-lg"
                        >
                          Go
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setTransferId(w.workspaceId)}
                        className="text-[10px] text-gray-500 hover:text-[#01696f] underline"
                      >
                        Transfer ownership
                      </button>
                    )}
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
