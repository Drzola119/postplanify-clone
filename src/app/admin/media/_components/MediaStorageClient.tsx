"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { orphanMediaAssetsAction, type AdminMediaRow, type AdminStorageTotals } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  data: {
    rows: AdminMediaRow[];
    totals: AdminStorageTotals;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function MediaStorageClient({ data }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [cleaning, setCleaning] = useState<string | null>(null);

  const handleCleanup = async (workspaceId: string) => {
    if (!confirm(`Soft-delete all unreferenced assets in workspace ${workspaceId}?`)) return;
    setCleaning(workspaceId);
    const res = await orphanMediaAssetsAction(workspaceId);
    setCleaning(null);
    toast({ title: `Cleaned ${res.orphaned} orphaned assets`, tone: "success" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-500">Total Stored</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatBytes(data.totals.totalBytes)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-500">Total Assets</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{data.totals.totalAssets.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-500">Workspaces With Media</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{data.totals.byWorkspace.length}</p>
        </div>
      </div>

      {/* Per-workspace usage */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Workspace</th>
              <th className="px-6 py-3.5">Stored</th>
              <th className="px-6 py-3.5">Assets</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.totals.byWorkspace.map((w) => (
              <tr key={w.workspaceId} className="hover:bg-gray-50/80">
                <td className="px-6 py-4 text-xs font-mono text-gray-700">{w.workspaceId}</td>
                <td className="px-6 py-4 text-xs text-gray-900 font-semibold">{formatBytes(w.bytes)}</td>
                <td className="px-6 py-4 text-xs text-gray-600">{w.assets}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleCleanup(w.workspaceId)}
                    disabled={cleaning === w.workspaceId}
                    className="px-3 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 disabled:opacity-50"
                  >
                    {cleaning === w.workspaceId ? "Cleaning..." : "Cleanup orphans"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Largest single assets */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Asset</th>
              <th className="px-6 py-3.5">Workspace</th>
              <th className="px-6 py-3.5">Type</th>
              <th className="px-6 py-3.5">Size</th>
              <th className="px-6 py-3.5">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.rows
              .slice()
              .sort((a: AdminMediaRow, b: AdminMediaRow) => b.size - a.size)
              .slice(0, 50)
              .map((a: AdminMediaRow) => (
                <tr key={`${a.workspaceId}-${a.assetId}`} className="hover:bg-gray-50/80">
                  <td className="px-6 py-4 text-xs font-semibold text-gray-900 truncate max-w-[280px]">{a.name}</td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-mono">{a.workspaceId}</td>
                  <td className="px-6 py-4 text-xs text-gray-600">{a.mime}</td>
                  <td className="px-6 py-4 text-xs text-gray-900 font-semibold">{formatBytes(a.size)}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {a.uploadedAt ? new Date(a.uploadedAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
