"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export default function SecurityEventsPage() {
  const securityEvents = [
    { id: "sec_1", timestamp: new Date().toISOString(), type: "ADMIN_ACCESS", user: "edylabels@gmail.com", details: "Admin authenticated and accessed /admin control panel", severity: "info" },
    { id: "sec_2", timestamp: new Date(Date.now() - 1200000).toISOString(), type: "FAILED_LOGIN_ATTEMPT", user: "marcus@vancemedia.co", details: "3 failed password attempts detected from IP 198.51.100.99", severity: "warning" },
    { id: "sec_3", timestamp: new Date(Date.now() - 3600000).toISOString(), type: "ACCOUNT_SUSPENDED", user: "marcus@vancemedia.co", details: "Account status modified to suspended by admin edylabels@gmail.com", severity: "danger" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security & Audit Events</h1>
        <p className="text-xs text-gray-500">Audit trail of authentication attempts, admin actions, and suspicious activities.</p>
      </div>

      <div className="space-y-3">
        {securityEvents.map((evt) => (
          <div key={evt.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              {evt.severity === "danger" && <ShieldAlert className="size-5 text-rose-600" />}
              {evt.severity === "warning" && <AlertTriangle className="size-5 text-amber-600" />}
              {evt.severity === "info" && <Info className="size-5 text-teal-600" />}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{evt.type}</span>
                  <span className="text-[10px] text-gray-400">({evt.user})</span>
                </div>
                <p className="text-gray-600 mt-0.5">{evt.details}</p>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
