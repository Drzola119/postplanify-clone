"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Database,
  CreditCard,
  Clock,
  RefreshCw,
  Bot,
  Images,
  Cloud,
  Mail,
  Cpu,
  Webhook,
} from "lucide-react";
import { getSystemHealth } from "@/app/admin/actions";

function statusPill(status: string | undefined) {
  const s = status ?? "unknown";
  if (s === "healthy")
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full"><span className="size-2 bg-emerald-500 rounded-full animate-ping" />Healthy</span>;
  if (s === "degraded")
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full"><span className="size-2 bg-amber-500 rounded-full animate-ping" />Degraded</span>;
  if (s === "critical")
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full"><span className="size-2 bg-rose-500 rounded-full animate-ping" />Critical</span>;
  if (s === "down")
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full"><span className="size-2 bg-rose-500 rounded-full" />Down</span>;
  return <span className="px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 rounded-full">Unknown</span>;
}

function iconFor(status: string | undefined) {
  if (status === "down" || status === "critical") return "text-rose-600 bg-rose-50";
  if (status === "degraded") return "text-amber-600 bg-amber-50";
  if (status === "healthy") return "text-emerald-600 bg-emerald-50";
  return "text-gray-500 bg-gray-50";
}

interface ServiceCardProps {
  icon: React.ElementType;
  name: string;
  status?: string;
  latencyMs?: number;
}

function ServiceCard({ icon: Icon, name, status, latencyMs }: ServiceCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">{name}</span>
        {statusPill(status)}
      </div>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${iconFor(status)}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xl font-extrabold text-gray-900">{latencyMs ? `${latencyMs} ms` : "—"}</p>
          <p className="text-[10px] text-gray-400">Response Latency</p>
        </div>
      </div>
    </div>
  );
}

interface HealthService {
  status: string;
  latencyMs?: number;
}

interface SystemHealthData {
  firebase: HealthService;
  stripe: HealthService;
  ai: HealthService;
  imageProviders: { id: string; configured: boolean }[];
  bunny: HealthService;
  email: { status: string };
  worker: HealthService & { lastCronRun?: string | null };
  webhookSuccessRate: number | null;
  queueDepth: number;
  lastCronRun: string | null;
  firestoreReadsToday: number;
  firestoreWritesToday: number;
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await getSystemHealth();
      setHealth(data);
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health &amp; Infrastructure</h1>
          <p className="text-xs text-gray-500">Live service health pings, database operations, and background queue depth.</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-xs hover:bg-gray-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-[#01696f]" : ""}`} />
          Refresh Now
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ServiceCard icon={Database} name="Firebase Firestore" status={health?.firebase?.status} latencyMs={health?.firebase?.latencyMs} />
        <ServiceCard icon={CreditCard} name="Stripe Billing API" status={health?.stripe?.status} latencyMs={health?.stripe?.latencyMs} />
        <ServiceCard icon={Bot} name="AI Provider (Groq)" status={health?.ai?.status} latencyMs={health?.ai?.latencyMs} />
        <ServiceCard icon={Cloud} name="Bunny CDN" status={health?.bunny?.status} latencyMs={health?.bunny?.latencyMs} />
        <ServiceCard icon={Mail} name="Email (Resend)" status={health?.email?.status} />
        <ServiceCard icon={Cpu} name="Queue Worker" status={health?.worker?.status} />

        {/* Image-gen provider config */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3 lg:col-span-2">
          <span className="text-xs font-bold text-gray-500">Image-Gen Providers (API keys configured)</span>
          <div className="flex flex-wrap gap-2 pt-1">
            {(health?.imageProviders ?? []).map((p: { id: string; configured: boolean }) => (
              <span
                key={p.id}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                  p.configured
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                }`}
              >
                {p.id}: {p.configured ? "OK" : "missing key"}
              </span>
            ))}
          </div>
        </div>

        {/* Queue Depth */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Publishing Queue Depth</span>
            {statusPill((health?.queueDepth ?? 0) > 50 ? "degraded" : "healthy")}
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900">{health?.queueDepth ?? 0} Pending</p>
              <p className="text-[10px] text-gray-400">Queue Items</p>
            </div>
          </div>
        </div>

        {/* Webhook success rate */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Webhook Success (24h)</span>
            {health?.webhookSuccessRate == null ? statusPill("unknown") : statusPill((health.webhookSuccessRate ?? 0) >= 95 ? "healthy" : "degraded")}
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Webhook className="size-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900">{health?.webhookSuccessRate == null ? "—" : `${health.webhookSuccessRate}%`}</p>
              <p className="text-[10px] text-gray-400">Delivery Success</p>
            </div>
          </div>
        </div>

        {/* Worker heartbeat */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <span className="text-xs font-bold text-gray-500">Queue Worker Heartbeat</span>
          <p className="text-xs text-gray-700">
            Last run: {health?.lastCronRun ? new Date(health.lastCronRun).toLocaleString() : "never recorded"}
          </p>
        </div>

        {/* Database Operations */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-2 col-span-1 sm:col-span-2 lg:col-span-3">
          <h3 className="text-sm font-bold text-gray-900">Firestore Operations Today</h3>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">Document Reads</p>
              <p className="text-2xl font-extrabold text-gray-900">{health?.firestoreReadsToday ?? 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">Document Writes</p>
              <p className="text-2xl font-extrabold text-gray-900">{health?.firestoreWritesToday ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-gray-400 text-right">Auto-polling active every 30s. Last refreshed: {lastRefreshed.toLocaleTimeString()}</p>
    </div>
  );
}
