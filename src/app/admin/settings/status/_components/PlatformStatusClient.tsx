"use client";

import React, { useState } from "react";
import { Activity, AlertTriangle, Wrench } from "lucide-react";
import { setPlatformStatusAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  initialStatus: {
    state: "operational" | "degraded" | "maintenance";
    message: string;
  };
}

const STATE_ICONS: Record<string, React.ElementType> = {
  operational: Activity,
  degraded: AlertTriangle,
  maintenance: Wrench,
};

const STATE_LABELS: Record<string, string> = {
  operational: "All Systems Operational",
  degraded: "Degraded Performance",
  maintenance: "Under Maintenance",
};

const STATE_STYLES: Record<string, string> = {
  operational: "bg-emerald-50 text-emerald-700 border-emerald-200",
  degraded: "bg-amber-50 text-amber-700 border-amber-200",
  maintenance: "bg-blue-50 text-blue-700 border-blue-200",
};

export function PlatformStatusClient({ initialStatus }: Props) {
  const [state, setState] = useState(initialStatus.state);
  const [message, setMessage] = useState(initialStatus.message);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    await setPlatformStatusAction(state, message);
    setSaving(false);
    toast({ title: "Status Updated", description: `Platform status set to ${state}`, tone: "success" });
  };

  const StateIcon = STATE_ICONS[state] ?? Activity;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Current Status Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${state === "operational" ? "bg-emerald-100 text-emerald-600" : state === "degraded" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
            <StateIcon className="size-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">Current Status</h3>
            <p className={`mt-2 inline-block px-3 py-1 text-xs font-bold rounded-full ${STATE_STYLES[state]}`}>
              {STATE_LABELS[state]}
            </p>
            <p className="text-xs text-gray-600 mt-2">{message}</p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-sm">Update Platform Status</h3>
        <div>
          <label className="text-xs font-bold text-gray-600">Status:</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(["operational", "degraded", "maintenance"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setState(s)}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  state === s
                    ? "border-[#01696f] bg-teal-50 text-[#01696f] ring-1 ring-[#01696f]"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {STATE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600">Message:</label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f]"
            placeholder="Describe what users should expect..."
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#01696f] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#015257] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update Status"}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Setting the status to "Degraded" or "Maintenance" will show a banner across the main app for all users.
          This requires wiring the platformStatus singleton doc into the user-facing app layout.
        </p>
      </div>
    </div>
  );
}
