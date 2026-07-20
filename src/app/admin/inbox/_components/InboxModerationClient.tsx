"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  flagCommentAction,
  unflagCommentAction,
  deleteCommentAction,
  type AdminCommentRow,
} from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  comments: AdminCommentRow[];
}

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  neutral: "bg-gray-100 text-gray-600 border border-gray-200",
  negative: "bg-rose-50 text-rose-700 border border-rose-200",
};

export function InboxModerationClient({ comments }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = comments;
    if (onlyFlagged) list = list.filter((c) => c.flagged);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (c) => c.authorHandle?.toLowerCase().includes(s) || c.body?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [comments, onlyFlagged, search]);

  const handleFlag = async (c: AdminCommentRow) => {
    const reason = prompt("Flag reason:");
    if (reason === null) return;
    await flagCommentAction(c.workspaceId, c.commentId, reason);
    toast({ title: "Comment Flagged", tone: "warning" });
    router.refresh();
  };

  const handleUnflag = async (c: AdminCommentRow) => {
    await unflagCommentAction(c.workspaceId, c.commentId);
    toast({ title: "Flag Cleared", tone: "info" });
    router.refresh();
  };

  const handleDelete = async (c: AdminCommentRow) => {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    await deleteCommentAction(c.workspaceId, c.commentId);
    toast({ title: "Comment Deleted", tone: "error" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by author or body..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f]"
        />
        <button
          onClick={() => setOnlyFlagged((v) => !v)}
          className={`px-3 py-2 text-[11px] font-bold rounded-xl border ${
            onlyFlagged
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
          }`}
        >
          Flagged only
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Author</th>
              <th className="px-6 py-3.5">Body</th>
              <th className="px-6 py-3.5">Platform</th>
              <th className="px-6 py-3.5">Sentiment</th>
              <th className="px-6 py-3.5">Flag</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={`${c.workspaceId}-${c.commentId}`} className="hover:bg-gray-50/80">
                <td className="px-6 py-4">
                  <p className="text-xs font-semibold text-gray-900">{c.authorHandle}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{c.workspaceId}</p>
                </td>
                <td className="px-6 py-4 text-xs text-gray-700 max-w-[360px] truncate">{c.body}</td>
                <td className="px-6 py-4 text-xs text-gray-600">{c.platform}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${SENTIMENT_COLOR[c.sentiment ?? "neutral"] ?? SENTIMENT_COLOR.neutral}`}>
                    {c.sentiment ?? "unknown"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {c.flagged ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">Flagged</span>
                  ) : (
                    <span className="text-[10px] text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                  {c.flagged ? (
                    <button onClick={() => handleUnflag(c)} className="px-2 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100">Unflag</button>
                  ) : (
                    <button onClick={() => handleFlag(c)} className="px-2 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100">Flag</button>
                  )}
                  <button onClick={() => handleDelete(c)} className="px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
