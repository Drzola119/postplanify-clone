"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Activity, Zap } from "lucide-react";

interface HealthData {
  firebase: { status: "healthy" | "degraded" | "down"; latencyMs: number };
  stripe: { status: "healthy" | "degraded" | "down"; latencyMs: number };
  queueDepth: number;
  lastCronRun: string;
  firestoreReadsToday: number;
  firestoreWritesToday: number;
}

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "Healthy" },
  degraded: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", label: "Degraded" },
  down: { icon: XCircle, color: "text-rose-500", bg: "bg-rose-50", label: "Down" },
};

function ServiceCard({ name, status, latencyMs }: { name: string; status: "healthy" | "degraded" | "down"; latencyMs: number }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center justify-between p-5 rounded-xl border ${cfg.bg} border-opacity-60`}>
      <div className="flex items-center gap-3">
        <Icon className={`size-6 ${cfg.color}`} />
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono font-semibold text-gray-700">{latencyMs}ms</p>
        <p c