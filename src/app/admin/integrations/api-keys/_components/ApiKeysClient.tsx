"use client";

import React, { useState } from "react";
import { revokeApiKeyAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface ApiKeyEntry {
  id: string;
  workspaceId: string;
  name: string;
  masked: string;
  createdAt: string | null;
  lastUsedAt: string | null;
  status: string;
}

interface Props {
  initialKeys: ApiKeyEntry[];
}

export function ApiKeysClient({ initialKeys }: Props) {
  const [keys, setKeys] = useState(initialKeys);
  const { toast } = useToast();

  const handleRevoke = async (id: string, workspaceId: string) => {
    if (!confirm("Revoke this API key? This will break integrations using it.")) return;
    await revokeApiKeyAction(id, workspaceId);
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: "revoked" } : k)));
    toast({ title: "API Key Revoked", tone: "warning" });
  };

  const statusBadge = (s: string) => {
    if (s === "active") return "px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full";
    return "px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 rounded-full";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-3.5">Name</th>
            <th className="px-6 py-3.5">Key</th>
            <th className="px-6 py-3.5">Workspace</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5">Last Used</th>
            <th className="px-6 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {keys.map((k) => (
            <tr key={k.id} className="hover:bg-gray-50/80">
              <td className="px-6 py-4 text-xs font-semibold text-gray-900">{k.name}</td>
              <td className="px-6 py-4 text-xs font-mono text-gray-600">{k.masked}</td>
              <td className="px-6 py-4 text-xs text-gray-500 font-mono">{k.workspaceId}</td>
              <td className="px-6 py-4"><span className={statusBadge(k.status)}>{k.status}</span></td>
              <td className="px-6 py-4 text-xs text-gray-500">
                {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
              </td>
              <td className="px-6 py-4 text-right">
                {k.status === "active" && (
                  <button
                    onClick={() => handleRevoke(k.id, k.workspaceId)}
                    className="px-3 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100"
                  >
                    Revoke
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
