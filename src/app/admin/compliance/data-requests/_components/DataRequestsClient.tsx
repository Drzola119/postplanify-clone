"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDataRequestAction,
  fulfillExportAction,
  fulfillDeleteAction,
} from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  requests: any[];
}

function statusBadge(status: string) {
  if (status === "fulfilled")
    return "px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full";
  if (status === "rejected")
    return "px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full";
  return "px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full";
}

export function DataRequestsClient({ requests }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [type, setType] = useState<"export" | "delete">("export");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [delConfirm, setDelConfirm] = useState<{ id: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid.trim()) return;
    await createDataRequestAction({ uid: uid.trim(), type });
    toast({ title: "Request created", tone: "success" });
    setUid("");
    router.refresh();
  };

  const handleExport = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fulfillExportAction(id);
      const blob = new Blob([res.exportJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-data-export-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export ready", tone: "success" });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Export failed", description: err?.message ?? "Unknown error", tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delConfirm) return;
    setBusyId(delConfirm.id);
    try {
      await fulfillDeleteAction(delConfirm.id, confirmText);
      toast({ title: "User data deleted", tone: "error" });
      setDelConfirm(null);
      setConfirmText("");
      router.refresh();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message ?? "Unknown error", tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-gray-500 uppercase">User UID</label>
          <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="user uid" className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Type</label>
          <select value={type} onChange={(e: any) => setType(e.target.value)} className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl">
            <option value="export">Export</option>
            <option value="delete">Delete</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-[#01696f] text-white text-xs font-bold rounded-xl">Create Request</button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">User</th>
              <th className="px-6 py-3.5">Type</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Requested</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-400">No data requests.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/80">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-[#01696f]">{r.uid}</td>
                  <td className="px-6 py-4 text-xs text-gray-700 uppercase">{r.type}</td>
                  <td className="px-6 py-4"><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className="px-6 py-4 text-xs text-gray-500">{r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                    {r.status === "pending" && r.type === "export" && (
                      <button onClick={() => handleExport(r.id)} disabled={busyId === r.id} className="px-2 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 disabled:opacity-50">Export</button>
                    )}
                    {r.status === "pending" && r.type === "delete" && (
                      <button onClick={() => setDelConfirm({ id: r.id })} className="px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100">Delete…</button>
                    )}
                    {r.status !== "pending" && <span className="text-[10px] text-gray-400">done</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleDelete} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="font-bold text-rose-700 text-sm">⚠ Permanent Data Deletion</h3>
            <p className="text-gray-600">This will cascade-delete all workspaces owned by this user and their profile. This cannot be undone.</p>
            <p className="font-semibold">Type <span className="font-mono text-rose-700">DELETE USER DATA</span> to confirm:</p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-rose-200 rounded-xl font-mono"
              placeholder="DELETE USER DATA"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDelConfirm(null)} className="px-4 py-2 border border-gray-200 rounded-xl">Cancel</button>
              <button type="submit" disabled={busyId === delConfirm.id} className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl disabled:opacity-50">Delete Permanently</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
