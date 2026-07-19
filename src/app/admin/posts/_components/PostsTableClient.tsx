"use client";

import React, { useState, useMemo } from "react";
import { AlertOctagon, CheckCircle2, Clock, RefreshCw, Trash2 } from "lucide-react";

interface Post {
  id: string;
  userEmail: string;
  platforms: string[];
  status: string;
  scheduledAt: string;
  publishedAt: string | null;
  caption: string;
  errorMessage?: string | null;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  published: <CheckCircle2 className="size-4 text-emerald-500" />,
  scheduled: <Clock className="size-4 text-blue-500" />,
  failed: <AlertOctagon className="size-4 text-rose-500" />,
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  scheduled: "bg-blue-50 text-blue-700",
  failed: "bg-rose-50 text-rose-700",
};

export function PostsTableClient({
  posts,
  onRetry,
  onDelete,
}: {
  posts: Post[];
  onRetry?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let rows = posts;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) => p.userEmail.toLowerCase().includes(q) || p.caption.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") rows = rows.filter((p) => p.status === statusFilter);
    return rows;
  }, [posts, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user or caption..."
          className="flex-1 min-w-[200px] max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01696f] bg-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="failed">Failed</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} posts</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              {["User", "Caption", "Platforms", "Status", "Scheduled", "Published", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors align-top">
                <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{p.userEmail}</td>
                <td className="px-4 py-3 text-gray-800 max-w-xs">
                  <p className="truncate" title={p.caption}>{p.caption}</p>
                  {p.errorMessage && (
                    <p className="text-xs text-rose-500 mt-1 truncate" title={p.errorMessage}>{p.errorMessage}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.platforms.map((pl) => (
                      <span key={pl} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium capitalize">{pl}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_ICON[p.status]}
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(p.scheduledAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.publishedAt ? new Date(p.publishedAt).toLocaleString() : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {p.status === "failed" && onRetry && (
                      <button
                        onClick={() => onRetry(p.id)}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition-colors"
                        title="Retry post"
                      >
                        <RefreshCw className="size-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(p.id)}
                        className="p-1.5 rounded hover:bg-rose-50 text-rose-500 transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">No posts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
