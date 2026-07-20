"use client";

import React, { useState, useMemo } from "react";
import { ShieldAlert, AlertTriangle, Info } from "lucide-react";

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: string;
  user: string;
  details: string;
  severity: string;
}

export function SecurityEventsClient({ events }: { events: SecurityEvent[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter(
      (e) =>
        e.type.toLowerCase().includes(q) ||
        e.user.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q)
    );
  }, [events, search]);

  const severityIcon = (sev: string) => {
    switch (sev) {
      case "danger":
      case "critical":
        return <ShieldAlert className="size-5 text-rose-600 shrink-0" />;
      case "warning":
        return <AlertTriangle className="size-5 text-amber-600 shrink-0" />;
      case "info":
      default:
        return <Info className="size-5 text-teal-600 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by type, user, or details..."
        className="max-w-sm w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01696f] bg-white"
      />
      <div className="space-y-3">
        {filtered.map((evt) => (
          <div key={evt.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              {severityIcon(evt.severity)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{evt.type}</span>
                  <span className="text-[10px] text-gray-400">({evt.user})</span>
                </div>
                <p className="text-gray-600 mt-0.5">{evt.details}</p>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 font-mono shrink-0 ml-4">
              {new Date(evt.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-xs text-gray-400">No security events found.</div>
        )}
      </div>
    </div>
  );
}
