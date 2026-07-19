"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Activity, Zap, Database } from "lucide-react";

interface HealthData {
  firebase: { status: "healthy" | "degraded" | "down"; latencyMs: number };
  stripe: { status: "healthy" | "degraded" | "down"; latencyMs: number };
  queueDepth: number;
  lastCronRun: string;
  firestoreReadsToday: number;
  firestoreWritesToday: number;
}

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200", label: "Healthy" },
  degraded: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 border-amber-200", label: "Degraded" },
  down: { icon: XCircle, color: "text-rose-500", bg: "bg-rose-50 border-rose-200", label: "Down" },
};

function ServiceCard({
  name,
  status,
  latencyMs,
}: {
  name: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
}) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center justify-between p-5 rounded-xl border ${cfg.bg}`}>
      <div className="flex items-center gap-3">
        <Icon className={`size-6 ${cfg.color}`} />
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono font-semibold text-gray-700">{latencyMs}ms</p>
        <p className="text-xs text-gray-400">latency</p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4">
      <div className="size-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <Icon className="size-5 text-gray-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900 font-mono">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function SystemHealthClient({ data }: { data: HealthData }) {
  const lastCronFormatted = data.lastCronRun
    ? new Date(data.lastCronRun).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  const overallStatus =
    data.firebase.status === "down" || data.stripe.status === "down"
      ? "down"
      : data.firebase.status === "degraded" || data.stripe.status === "degraded"
      ? "degraded"
      : "healthy";

  const overallCfg = STATUS_CONFIG[overallStatus];
  const OverallIcon = overallCfg.icon;

  return (
    <div className="space-y-8">
      {/* Overall status banner */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl border ${overallCfg.bg}`}>
        <OverallIcon className={`size-8 ${overallCfg.color}`} />
        <div>
          <p className="font-bold text-gray-900 text-lg">
            System is{" "}
            <span className={overallCfg.color}>{overallCfg.label}</span>
          </p>
          <p className="text-sm text-gray-500">All monitored services checked in real time</p>
        </div>
      </div>

      {/* Service cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Services
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ServiceCard
            name="Firebase / Firestore"
            status={data.firebase.status}
            latencyMs={data.firebase.latencyMs}
          />
          <ServiceCard
            name="Stripe"
            status={data.stripe.status}
            latencyMs={data.stripe.latencyMs}
          />
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Platform Stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Queue Depth"
            value={data.queueDepth}
            icon={Activity}
            sub="pending jobs"
          />
          <StatCard
            label="Last Cron Run"
            value={lastCronFormatted}
            icon={Zap}
            sub="scheduled tasks"
          />
          <StatCard
            label="Firestore Reads"
            value={data.firestoreReadsToday.toLocaleString()}
            icon={Database}
            sub="today"
          />
          <StatCard
            label="Firestore Writes"
            value={data.firestoreWritesToday.toLocaleString()}
            icon={Database}
            sub="today"
          />
        </div>
      </div>
    </div>
  );
}
