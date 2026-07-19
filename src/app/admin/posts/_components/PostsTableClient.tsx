"use client";

import React, { useState } from "react";
import {
  FileText,
  RotateCcw,
  Trash2,
  Eye,
  Globe,
  Share2,
  Video,
  MessageSquare,
  X,
  AlertOctagon,
  RefreshCw,
} from "lucide-react";
import { retryPostAction, retryAllFailedPostsAction, deletePostAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface PostRow {
  id: string;
  userEmail: string;
  platforms: string[];
  status: "published" | "scheduled" | "failed" | "draft";
  scheduledAt: string;
  publishedAt?: string | null;
  caption: string;
  errorMessage?: string | null;
}

export function PostsTableClient({
  initialPosts,
  onlyFailed = false,
}: {
  initialPosts: PostRow[];
  onlyFailed?: boolean;
}) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [statusFilter, setStatusFilter] = useState<string>(onlyFailed ? "failed" : "all");
  const [viewPost, setViewPost] = useState<PostRow | null>(null);
  const { toast } = useToast();

  const filteredPosts = posts.filter((p) => {
    if (onlyFailed && p.status !== "failed") return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const handleRetry = async (postId: string) => {
    try {
      await retryPostAction(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: "scheduled", errorMessage: null } : p)));
      toast({ title: "Post Retried", description: `Post ${postId} placed back into publishing queue.`, tone: "success" });
    } catch (err: any) {
      toast({ title: "Retry Failed", description: err.message, tone: "error" });
    }
  };

  const handleRetryAll = async () => {
    try {
      await retryAllFailedPostsAction();
      setPosts((prev) => prev.map((p) => (p.status === "failed" ? { ...p, status: "scheduled", errorMessage: null } : p)));
      toast({ title: "All Failed Posts Retried", description: "Successfully requeued all failed posts.", tone: "success" });
    } catch (err: any) {
      toast({ title: "Retry All Failed", description: err.message, tone: "error" });
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePostAction(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({ title: "Post Deleted", description: `Post ${postId} deleted.`, tone: "success" });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, tone: "error" });
    }
  };

  const platformIcons: Record<string, React.ElementType> = {
    instagram: Globe,
    linkedin: Share2,
    facebook: MessageSquare,
    x: FileText,
    tiktok: Video,
  };

  // Pie chart data for failed post errors
  const errorChartData = [
    { name: "auth_error", value: 45, color: "#f43f5e" },
    { name: "rate_limit", value: 30, color: "#f59e0b" },
    { name: "network", value: 15, color: "#0284c7" },
    { name: "unknown", value: 10, color: "#64748b" },
  ];

  return (
    <div className="space-y-6">
      {onlyFailed && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="size-5" />
            </div>
            <div>
              <h2 className="font-bold text-rose-900">Failed Posts Control Center</h2>
              <p className="text-xs text-rose-700">Review publishing exceptions, check error logs, or trigger bulk retries.</p>
            </div>
          </div>
          <button
            onClick={handleRetryAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <RefreshCw className="size-4" />
            Retry All Failed Posts
          </button>
        </div>
      )}

      {/* Filter Bar */}
      {!onlyFailed && (
        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500">Filter Status:</span>
          {["all", "published", "scheduled", "failed", "draft"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize transition-colors ${
                statusFilter === st ? "bg-[#01696f] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Platforms</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Caption Preview</th>
                {onlyFailed && <th className="px-6 py-3.5 text-rose-600">Error Message</th>}
                <th className="px-6 py-3.5">Scheduled At</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-gray-900">{p.userEmail}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {p.platforms.map((plat) => {
                          const Icon = platformIcons[plat] || FileText;
                          return (
                            <div key={plat} className="p-1.5 bg-gray-100 text-gray-700 rounded-lg" title={plat}>
                              <Icon className="size-3.5" />
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.status === "published" && <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Published</span>}
                      {p.status === "scheduled" && <span className="px-2.5 py-0.5 text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 rounded-full">Scheduled</span>}
                      {p.status === "failed" && <span className="px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">Failed</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">{p.caption}</td>
                    {onlyFailed && (
                      <td className="px-6 py-4 text-xs text-rose-600 font-mono max-w-xs truncate">{p.errorMessage || "Unknown Error"}</td>
                    )}
                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(p.scheduledAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewPost(p)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-xs"
                          title="View Full Post"
                        >
                          <Eye className="size-4" />
                        </button>
                        {p.status === "failed" && (
                          <button
                            onClick={() => handleRetry(p.id)}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg text-xs"
                            title="Force Retry"
                          >
                            <RotateCcw className="size-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                          title="Delete Post"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-400">
                    No posts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Breakdown Chart on Failed Page */}
      {onlyFailed && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Error Exception Breakdown</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={errorChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {errorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* View Post Detail Modal */}
      {viewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900">Full Post Details</h3>
              <button onClick={() => setViewPost(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-gray-500">Author:</span> {viewPost.userEmail}
              </div>
              <div>
                <span className="font-bold text-gray-500">Scheduled Time:</span> {new Date(viewPost.scheduledAt).toLocaleString()}
              </div>
              <div>
                <span className="font-bold text-gray-500">Caption:</span>
                <p className="mt-1 p-3 bg-gray-50 rounded-xl text-gray-800 whitespace-pre-wrap">{viewPost.caption}</p>
              </div>
              {viewPost.errorMessage && (
                <div>
                  <span className="font-bold text-rose-600">Error Exception:</span>
                  <p className="mt-1 p-3 bg-rose-50 text-rose-700 rounded-xl font-mono">{viewPost.errorMessage}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setViewPost(null)} className="px-4 py-2 text-xs border rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
