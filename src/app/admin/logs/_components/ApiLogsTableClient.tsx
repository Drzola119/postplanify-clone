"use client";

import React, { useState, useMemo } from "react";

interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  user: string;
  duration: number;
  ip: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-50 text-blue-700",
  POST: "bg-emerald-50 text-emerald-700",
  DELETE: "bg-rose-50 text-rose-700",
  PATCH: "bg-amber-50 text-amber-700",
  PUT: "bg-purple-50 text-purple-700",
};

export function ApiLogsTableClient({ logs }: { logs: ApiLog[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let rows = logs;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (l) => l.endpoint.toLowerCase().includes(q) || l.user.toLowerCase().includes(q) || l.ip.includes(q)
      );
    }
    if (statusFilter === "2xx") rows = rows.filter((l) => l.status >= 200 && l.status < 300);
    else if (statusFilter === "4xx") rows = rows.filter((l) => l.status >= 400 && l.status < 500);
    else if (statusFilter === "5xx") rows = rows.filter((l) => l.status >= 500);
    return rows;
  }, [logs, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search endpoint, user or IP..."
          className="flex-1 min-w-[200px] max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01696f] bg-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]"
        >
          <option value="all">All Status Codes</option>
          <option value="2xx">2xx Success</option>
          <option value="4xx">4xx Client Error</option>
          <option value="5xx">5xx Server Error</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} logs</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm font-mono">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-sans">
            <tr>
              {["Time", "Method", "Endpoint", "Status", "User", "Duration", "IP"].map((h) => (
                <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${METHOD_COLORS[l.method] ?? "bg-gray-100 text-gray-600"}`}>
                    {l.method}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 text-xs">{l.endpoint}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold text-xs ${
                    l.status < 300 ? "text-emerald-600" : l.status < 500 ? "text-amber-600" : "text-rose-600"
                  }`}>{l.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{l.user}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{l.duration}ms</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{l.ip}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm font-sans">No log entries found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
