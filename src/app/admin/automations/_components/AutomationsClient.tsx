"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { disableAutomationAction, type AdminAutomationRow } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  automations: AdminAutomationRow[];
}

export function AutomationsClient({ automations }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return automations;
    const s = search.toLowerCase();
    return automations.filter(
      (a) => a.name?.toLowerCase().includes(s) || a.workspaceId?.toLowerCase().includes(s)
    );
  }, [automations, search]);

  const handleDisable = async (a: AdminAutomationRow) => {
    if (!confirm(`Disable automation "${a.name}"?`)) return;
    await disableAutomationAction(a.workspaceId, a.campaignId);
    toast({ title: "Automation Disabled", tone: "warning" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4">
        <input
          type="text"
          placeholder="Search by name or workspace..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f]"
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Name</th>
              <th className="px-6 py-3.5">Workspace</th>
              <th className="px-6 py-3.5">Trigger</th>
              <th className="px-6 py-3.5">Platforms</th>
              <th className="px-6 py-3.5">Triggered / Sent</th>
              <th className="px-6 py-3.5">Last Run</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <tr key={`${a.workspaceId}-${a.campaignId}`} className="hover:bg-gray-50/80">
                <td className="px-6 py-4 text-xs font-semibold text-gray-900">{a.name}</td>
                <td className="px-6 py-4 text-xs text-gray-500 font-mono">{a.workspaceId}</td>
                <td className="px-6 py-4 text-xs text-gray-600">{a.triggerKind}</td>
                <td className="px-6 py-4 text-xs text-gray-600">
                  {(a.platforms || []).join(", ")}
                </td>
                <td className="px-6 py-4 text-xs text-gray-700">{a.triggered} / {a.sent}</td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {a.lastTriggeredAt ? new Date(a.lastTriggeredAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  {a.status === "active" && (
                    <button
                      onClick={() => handleDisable(a)}
                      className="px-3 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100"
                    >
                      Disable
                    </button>
                  )}
                  {a.status !== "active" && (
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 rounded-full">Paused</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
