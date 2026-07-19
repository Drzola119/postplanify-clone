"use client";

import React, { useState } from "react";
import { Flag, Plus, Check, X } from "lucide-react";
import { toggleFeatureFlag, createFeatureFlag } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState([
    { id: "ai_video_gen", name: "AI Video Generation", description: "Enable AI script-to-video workflow", enabled: true, rollout: 50 },
    { id: "threads_auto_reply", name: "Threads Auto-Reply", description: "Auto respond to comments on Threads", enabled: false, rollout: 0 },
    { id: "multi_brand_workspace", name: "Multi-Brand Workspaces", description: "Allow clients to create up to 10 brand sub-accounts", enabled: true, rollout: 100 },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newFlag, setNewFlag] = useState({ id: "", name: "", description: "", rollout: 100 });
  const { toast } = useToast();

  const handleToggle = async (flagId: string, currentEnabled: boolean, rollout: number) => {
    const nextEnabled = !currentEnabled;
    await toggleFeatureFlag(flagId, nextEnabled, rollout);
    setFlags((prev) => prev.map((f) => (f.id === flagId ? { ...f, enabled: nextEnabled } : f)));
    toast({ title: "Feature Flag Toggled", description: `${flagId} is now ${nextEnabled ? "ENABLED" : "DISABLED"}`, tone: "info" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFeatureFlag({ ...newFlag, enabled: true });
    setFlags((prev) => [...prev, { ...newFlag, enabled: true }]);
    toast({ title: "Feature Flag Created", description: `Created flag ${newFlag.id}`, tone: "success" });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-xs text-gray-500">Control feature rollouts dynamically across the PostPlanify platform.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#01696f] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#015257]"
        >
          <Plus className="size-4" />
          Create New Flag
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Flag Name & ID</th>
              <th className="px-6 py-3.5">Description</th>
              <th className="px-6 py-3.5">Rollout %</th>
              <th className="px-6 py-3.5">Enabled</th>
              <th className="px-6 py-3.5 text-right">Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {flags.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50/80">
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-gray-900">{f.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{f.id}</p>
                </td>
                <td className="px-6 py-4 text-xs text-gray-600">{f.description}</td>
                <td className="px-6 py-4 text-xs font-bold text-teal-700">{f.rollout}% Users</td>
                <td className="px-6 py-4">
                  {f.enabled ? (
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Active</span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 rounded-full">Disabled</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleToggle(f.id, f.enabled, f.rollout)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      f.enabled ? "bg-[#01696f]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                        f.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900">New Feature Flag</h3>
            <div>
              <label className="text-xs font-bold text-gray-600">Flag ID (snake_case):</label>
              <input
                type="text"
                required
                placeholder="e.g. ai_hashtag_gen"
                value={newFlag.id}
                onChange={(e) => setNewFlag({ ...newFlag, id: e.target.value })}
                className="w-full mt-1 p-2 text-xs bg-gray-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Display Name:</label>
              <input
                type="text"
                required
                placeholder="e.g. AI Hashtag Generator"
                value={newFlag.name}
                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                className="w-full mt-1 p-2 text-xs bg-gray-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Description:</label>
              <input
                type="text"
                required
                placeholder="Feature overview..."
                value={newFlag.description}
                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                className="w-full mt-1 p-2 text-xs bg-gray-50 border rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs border rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs bg-[#01696f] text-white font-bold rounded-xl">
                Create Flag
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
