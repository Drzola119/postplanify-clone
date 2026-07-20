"use client";

import React, { useState, useMemo } from "react";
import { Download, ChevronDown, ChevronRight, Search } from "lucide-react";
import { getAdminAuditLog } from "@/app/admin/actions";
import { toCsv, downloadCsv } from "@/lib/csv";

const ACTION_LABELS: Record<string, string> = {
  suspend_user: "Suspend User",
  unsuspend_user: "Unsuspend User",
  delete_user: "Delete User",
  impersonate_user: "Impersonate User",
  change_plan: "Change Plan",
  send_password_reset: "Password Reset",
  cancel_subscription: "Cancel Subscription",
  grant_free_month: "Grant Free Month",
  retry_post: "Retry Post",
  retry_all_failed_posts: "Retry All Failed",
  delete_post: "Delete Post",
  mark_commission_paid: "Mark Commission Paid",
  suspend_affiliate: "Suspend Affiliate",
  toggle_feature_flag: "Toggle Feature Flag",
  create_feature_flag: "Create Feature Flag",
  create_announcement: "Create Announcement",
  send_email_broadcast: "Email Broadcast",
  create_coupon: "Create Coupon",
  invite_admin: "Invite Admin",
  update_admin_role: "Update Admin Role",
  revoke_admin: "Revoke Admin",
  toggle_ip_allowlist: "Toggle IP Allowlist",
  force_logout_session: "Force Logout Session",
};

const ACTION_KEYS = Object.keys(ACTION_LABELS).sort();

interface Props {
  initialLogs: any[];
}

export function AuditLogClient({ initialLogs }: Props) {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filterEmail, setFilterEmail] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (filterEmail && !log.adminEmail?.toLowerCase().includes(filterEmail.toLowerCase())) return false;
      if (filterAction && log.action !== filterAction) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!log.adminEmail?.toLowerCase().includes(term) &&
            !log.action?.toLowerCase().includes(term) &&
            !log.targetId?.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [logs, filterEmail, filterAction, searchTerm]);

  const handleRefresh = async () => {
    setLoading(true);
    const data = await getAdminAuditLog();
    setLogs(data);
    setLoading(false);
  };

  const handleExport = () => {
    const csvData = filtered.map((log) => ({
      Timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString() : "",
      Admin: log.adminEmail || "",
      Action: ACTION_LABELS[log.action] || log.action,
      Target: log.targetId || "",
      Metadata: log.metadata ? JSON.stringify(log.metadata) : "",
    }));
    const csv = toCsv(csvData);
    downloadCsv("admin-audit-log.csv", csv);
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails, actions, targets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f]"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by admin email..."
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-[#01696f]"
          />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f]"
          >
            <option value="">All Actions</option>
            {ACTION_KEYS.map((key) => (
              <option key={key} value={key}>{ACTION_LABELS[key]}</option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 text-xs bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 font-medium disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#01696f] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#015257]"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5 w-8"></th>
              <th className="px-6 py-3.5">Timestamp</th>
              <th className="px-6 py-3.5">Admin</th>
              <th className="px-6 py-3.5">Action</th>
              <th className="px-6 py-3.5">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((log) => (
              <React.Fragment key={log.id}>
                <tr className="hover:bg-gray-50/80 cursor-pointer" onClick={() => toggleExpanded(log.id)}>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      {expanded.has(log.id) ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap font-mono">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-900 font-medium">{log.adminEmail || "—"}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200 rounded-full">
                      {ACTION_LABELS[log.action] || log.action || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 font-mono">{log.targetId || "—"}</td>
                </tr>
                {expanded.has(log.id) && (
                  <tr key={`${log.id}_detail`} className="bg-gray-50/50">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="text-xs space-y-2">
                        <p className="font-bold text-gray-700">Metadata:</p>
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded-xl overflow-x-auto text-[11px] leading-relaxed">
                          {JSON.stringify(log.metadata ?? {}, null, 2)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-6 py-8 text-center text-xs text-gray-400">No audit log entries found.</div>
        )}
      </div>
    </div>
  );
}
