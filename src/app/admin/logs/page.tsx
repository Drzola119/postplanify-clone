"use client";

import React, { useState } from "react";
import { Terminal, Filter, RefreshCw } from "lucide-react";

export default function ApiLogsPage() {
  const [logs] = useState([
    { id: "log_1", timestamp: new Date().toISOString(), method: "POST", endpoint: "/api/posts/create", status: 200, user: "elena@spypublishing.com", duration: 142, ip: "203.0.113.19" },
    { id: "log_2", timestamp: new Date(Date.now() - 300000).toISOString(), method: "GET", endpoint: "/api/social-accounts", status: 200, user: "jessica@agency.org", duration: 88, ip: "192.0.2.45" },
    { id: "log_3", timestamp: new Date(Date.now() - 900000).toISOString(), method: "POST", endpoint: "/api/publishing/tiktok", status: 401, user: "marcus@vancemedia.co", duration: 420, ip: "198.51.100.99" },
    { id: "log_4", timestamp: new Date(Date.now() - 1800000).toISOString(), method: "POST", endpoint: "/api/ai/captions", status: 500, user: "sarah@design.io", duration: 850, ip: "198.51.100.12" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Endpoint Logs</h1>
          <p className="text-xs text-gray-500">Live HTTP API execution logs and response time metrics.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 font-sans text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Timestamp</th>
              <th className="px-6 py-3.5">Method</th>
              <th className="px-6 py-3.5">Endpoint</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">User</th>
              <th className="px-6 py-3.5">Duration</th>
              <th className="px-6 py-3.5">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50/80">
                <td className="px-6 py-3.5 text-gray-500">{new Date(l.timestamp).toLocaleTimeString()}</td>
                <td className="px-6 py-3.5 font-bold text-gray-900">{l.method}</td>
                <td className="px-6 py-3.5 text-teal-700">{l.endpoint}</td>
                <td className="px-6 py-3.5">
                  {l.status === 200 && <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded">200 OK</span>}
                  {l.status === 401 && <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded">401 Auth</span>}
                  {l.status === 500 && <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 rounded">500 Server Error</span>}
                </td>
                <td className="px-6 py-3.5 text-gray-700">{l.user}</td>
                <td className="px-6 py-3.5 text-gray-500">{l.duration}ms</td>
                <td className="px-6 py-3.5 text-gray-400">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
