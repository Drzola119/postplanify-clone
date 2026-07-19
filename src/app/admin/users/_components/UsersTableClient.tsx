"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";

interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  connectedAccounts: number;
  joined: string;
  lastActive: string;
  photoURL: string | null;
  ipAddress: string;
  device: string;
}

const PLAN_COLORS: Record<string, string> = {
  Agency: "bg-purple-50 text-purple-700",
  Business: "bg-blue-50 text-blue-700",
  Pro: "bg-teal-50 text-teal-700",
  Free: "bg-gray-100 text-gray-600",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  suspended: "bg-amber-50 text-amber-700",
  deleted: "bg-rose-50 text-rose-700",
};

export function UsersTableClient({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof User>("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let rows = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.ipAddress.toLowerCase().includes(q)
      );
    }
    if (planFilter !== "all") rows = rows.filter((u) => u.plan === planFilter);
    if (statusFilter !== "all") rows = rows.filter((u) => u.status === statusFilter);
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [users, search, sortKey, sortDir, planFilter, statusFilter]);

  const toggleSort = (key: keyof User) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ k }: { k: keyof User }) =>
    sortKey === k ? (
      sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
    ) : null;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or IP..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01696f] bg-white"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]"
        >
          <option value="all">All Plans</option>
          <option>Free</option>
          <option>Pro</option>
          <option>Business</option>
          <option>Agency</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]"
        >
          <option value="all">All Statuses</option>
          <option>active</option>
          <option>suspended</option>
          <option>deleted</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} users</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              {(["name", "email", "plan", "status", "connectedAccounts", "joined", "lastActive"] as (keyof User)[]).map((k) => (
                <th
                  key={k}
                  onClick={() => toggleSort(k)}
                  className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1">
                    {k.replace(/([A-Z])/g, " $1")}
                    <SortIcon k={k} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{u.name}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_COLORS[u.plan] ?? "bg-gray-100 text-gray-600"}`}>
                    {u.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[u.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-700">{u.connectedAccounts}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(u.joined).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(u.lastActive).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors inline-flex"
                    title="View details"
                  >
                    <MoreHorizontal className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No users match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
