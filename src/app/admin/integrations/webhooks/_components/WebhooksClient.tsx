"use client";

import React, { useState } from "react";
import { disableWebhookAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  initialWebhooks: any[];
}

export function WebhooksClient({ initialWebhooks }: Props) {
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const { toast } = useToast();

  const handleDisable = async (id: string, workspaceId: string) => {
    await disableWebhookAction(id, workspaceId);
    setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, status: "disabled" } : w)));
    toast({ title: "Webhook Disabled", tone: "info" });
  };

  const statusBadge = (s: string) => {
    if (s === "active") return "px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full";
    if (s === "failing") return "px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full";
    return "px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 rounded-full";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-3.5">URL</th>
            <th className="px-6 py-3.5">Workspace</th>
            <th className="px-6 py-3.5">Events</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5">Failures</th>
            <th className="px-6 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {webhooks.map((wh) => (
            <tr key={wh.id} className="hover:bg-gray-50/80">
              <td className="px-6 py-4 text-xs font-mono text-gray-900 max-w-[300px] truncate">{wh.url}</td>
              <td className="px-6 py-4 text-xs text-gray-500 font-mono">{wh.workspaceId}</td>
              <td className="px-6 py-4 text-xs text-gray-600">
                {(wh.events || []).map((e: string) => (
                  <span key={e} className="inline-block mr-1 mb-1 px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-700 rounded">{e}</span>
                ))}
              </td>
              <td className="px-6 py-4"><span className={statusBadge(wh.status)}>{wh.status}</span></td>
              <td className="px-6 py-4 text-xs text-gray-600">{wh.consecutiveFailures ?? 0}</td>
              <td className="px-6 py-4 text-right">
                {wh.status !== "disabled" && (
                  <button
                    onClick={() => handleDisable(wh.id, wh.workspaceId)}
                    className="px-3 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100"
                  >
                    Disable
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
