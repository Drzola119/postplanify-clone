"use client";

import React, { useState } from "react";
import { Plus, ToggleLeft, ToggleRight, Play } from "lucide-react";
import { toggleAlertRuleAction, createAlertRuleAction, muteAlertRuleAction, triggerAlertEvaluation } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

const METRIC_LABELS: Record<string, string> = {
  failure_rate_pct: "Post Failure Rate (%)",
  failed_posts_count: "Failed Posts Count",
  payment_failures_count: "Payment Failures",
  token_expiring_count: "Tokens Expiring",
  queue_depth: "Queue Depth",
  ai_spend_daily_usd: "Daily AI Spend ($)",
  storage_high_workspaces: "Storage High Workspaces",
  signups_24h: "Signups (24h)",
  churn_24h: "Churn (24h)",
};

const COMPARATOR_LABELS: Record<string, string> = {
  gt: "Greater than",
  gte: "Greater or equal",
  lt: "Less than",
  eq: "Equals",
};

interface AlertRuleRow {
  id: string;
  name: string;
  metric: string;
  comparator: string;
  threshold: number;
  windowMinutes: number;
  severity: string;
  enabled: boolean;
  notifyChannels: string[];
}

interface Props {
  initialRules: AlertRuleRow[];
}

export function AlertRulesClient({ initialRules }: Props) {
  const [rules, setRules] = useState(initialRules);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<{ name: string; metric: string; comparator: "gt" | "gte" | "lt" | "eq"; threshold: number; windowMinutes: number; severity: "info" | "warning" | "critical" }>({ name: "", metric: "failure_rate_pct", comparator: "gt", threshold: 0, windowMinutes: 60, severity: "warning" });
  const { toast } = useToast();

  const handleToggle = async (ruleId: string, current: boolean) => {
    await toggleAlertRuleAction(ruleId, !current);
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled: !current } : r)));
    toast({ title: `Rule ${!current ? "Enabled" : "Disabled"}`, tone: "info" });
  };

  const handleMute = async (ruleId: string) => {
    await muteAlertRuleAction(ruleId, 24);
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled: false } : r)));
    toast({ title: "Rule Muted for 24h", tone: "warning" });
  };

  const handleRunEvaluation = async () => {
    await triggerAlertEvaluation();
    toast({ title: "Evaluation Complete", description: "Alert rules have been re-evaluated.", tone: "success" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAlertRuleAction(form);
    setRules((prev) => [...prev, { ...form, id: `rule_${Date.now()}`, enabled: true, notifyChannels: ["in_app"] }]);
    toast({ title: "Rule Created", tone: "success" });
    setShowModal(false);
  };

  const severityBadge = (s: string) => {
    const styles: Record<string, string> = {
      critical: "bg-rose-50 text-rose-700 border border-rose-200",
      warning: "bg-amber-50 text-amber-700 border border-amber-200",
      info: "bg-teal-50 text-teal-700 border border-teal-200",
    };
    return `px-2.5 py-0.5 text-[11px] font-bold rounded-full ${styles[s] ?? styles.info}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{rules.length} rule{rules.length !== 1 ? "s" : ""} configured</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunEvaluation}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-xs hover:bg-gray-50"
          >
            <Play className="size-4" />
            Run Evaluation Now
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#01696f] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#015257]"
          >
            <Plus className="size-4" />
            New Rule
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Rule Name</th>
              <th className="px-6 py-3.5">Metric</th>
              <th className="px-6 py-3.5">Condition</th>
              <th className="px-6 py-3.5">Window</th>
              <th className="px-6 py-3.5">Severity</th>
              <th className="px-6 py-3.5">Enabled</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50/80">
                <td className="px-6 py-4 text-xs font-semibold text-gray-900">{rule.name}</td>
                <td className="px-6 py-4 text-xs text-gray-600">{METRIC_LABELS[rule.metric] || rule.metric}</td>
                <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                  {COMPARATOR_LABELS[rule.comparator] || rule.comparator} {rule.threshold}
                </td>
                <td className="px-6 py-4 text-xs text-gray-600">{rule.windowMinutes}m</td>
                <td className="px-6 py-4"><span className={severityBadge(rule.severity)}>{rule.severity}</span></td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggle(rule.id, rule.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.enabled ? "bg-[#01696f]" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block size-4 transform rounded-full bg-white transition-transform ${rule.enabled ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleMute(rule.id)}
                    className="px-3 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200"
                  >
                    Mute 24h
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
            <h3 className="font-bold text-gray-900 text-sm">New Alert Rule</h3>
            <div>
              <label className="text-xs font-bold text-gray-600">Rule Name:</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Metric:</label>
                <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}
                  className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl">
                  {Object.entries(METRIC_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Comparator:</label>
                <select value={form.comparator} onChange={(e) => setForm({ ...form, comparator: e.target.value as "gt" | "gte" | "lt" | "eq" })}
                  className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl">
                  {Object.entries(COMPARATOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Threshold:</label>
                <input type="number" required value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
                  className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Window (min):</label>
                <input type="number" required value={form.windowMinutes} onChange={(e) => setForm({ ...form, windowMinutes: Number(e.target.value) })}
                  className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Severity:</label>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as "info" | "warning" | "critical" })}
                className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-xl text-gray-600">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs bg-[#01696f] text-white font-bold rounded-xl">Create Rule</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
