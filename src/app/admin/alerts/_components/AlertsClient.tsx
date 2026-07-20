"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle2, BellOff, Bell, RefreshCw, Filter } from "lucide-react";
import { acknowledgeAlertAction, resolveAlertAction, muteAlertRuleAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-rose-50 text-rose-700 border border-rose-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  info: "bg-teal-50 text-teal-700 border border-teal-200",
};

const SEVERITY_ICONS: Record<string, React.ElementType> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Bell,
};

interface Props {
  initialAlerts: any[];
}

export function AlertsClient({ initialAlerts }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const { toast } = useToast();

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      const isActive = !a.resolvedAt;
      if (filterStatus === "active" && !isActive) return false;
      if (filterStatus === "resolved" && isActive) return false;
      if (filterStatus === "acknowledged" && (!a.acknowledged || isActive)) return false;
      if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
      return true;
    });
  }, [alerts, filterStatus, filterSeverity]);

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlertAction(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
    toast({ title: "Alert Acknowledged", tone: "info" });
  };

  const handleResolve = async (id: string) => {
    await resolveAlertAction(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolvedAt: new Date().toISOString() } : a)));
    toast({ title: "Alert Resolved", tone: "success" });
  };

  const handleMute = async (ruleId: string) => {
    if (!ruleId) return;
    await muteAlertRuleAction(ruleId);
    toast({ title: "Rule Muted for 24h", tone: "warning" });
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex flex-wrap items-center gap-3">
        <Filter className="size-4 text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
        >
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <span className="text-[11px] text-gray-500 ml-auto">{filtered.length} alert{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Alert cards */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const SeverityIcon = SEVERITY_ICONS[alert.severity] ?? Bell;
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl border shadow-xs p-5 transition-all ${
                alert.severity === "critical" && !alert.resolvedAt
                  ? "border-rose-300 ring-1 ring-rose-200"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${alert.severity === "critical" ? "bg-rose-100 text-rose-600" : alert.severity === "warning" ? "bg-amber-100 text-amber-600" : "bg-teal-100 text-teal-600"}`}>
                  <SeverityIcon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-gray-900">{alert.title}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info}`}>
                      {alert.severity}
                    </span>
                    {alert.acknowledged && !alert.resolvedAt && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">Acknowledged</span>
                    )}
                    {alert.resolvedAt && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Resolved</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                    <span>Source: {alert.source}</span>
                    <span>Type: {alert.type}</span>
                    <span>{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!alert.acknowledged && !alert.resolvedAt && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100"
                    >
                      <CheckCircle2 className="size-3" />
                      Acknowledge
                    </button>
                  )}
                  {!alert.resolvedAt && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100"
                    >
                      <RefreshCw className="size-3" />
                      Resolve
                    </button>
                  )}
                  {alert.dedupeKey && (
                    <button
                      onClick={() => handleMute(alert.dedupeKey?.split("_")[0] ?? alert.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200"
                    >
                      <BellOff className="size-3" />
                      Mute Rule
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-12 text-center">
            <CheckCircle2 className="size-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900">All Clear</p>
            <p className="text-xs text-gray-500 mt-1">No alerts match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
