"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { replyToTicketAction, setTicketStatusAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  ticket: any;
  ticketId: string;
}

export function SupportTicketDetailClient({ ticket, ticketId }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  if (!ticket) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-8 text-center text-gray-400">
        Ticket not found. <Link href="/admin/support" className="text-[#01696f] underline">Back to tickets</Link>
      </div>
    );
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await replyToTicketAction(ticketId, reply.trim());
      setReply("");
      toast({ title: "Reply sent", tone: "success" });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Reply failed", description: err?.message ?? "Unknown error", tone: "error" });
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (status: "open" | "pending" | "closed") => {
    await setTicketStatusAction(ticketId, status);
    toast({ title: `Status set to ${status}`, tone: "info" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/support" className="text-xs text-gray-500 hover:underline">← All tickets</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{ticket.subject}</h1>
          <p className="text-xs text-gray-500">User: <span className="font-mono">{ticket.uid}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleStatus("open")} className="px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100">Open</button>
          <button onClick={() => handleStatus("pending")} className="px-3 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100">Pending</button>
          <button onClick={() => handleStatus("closed")} className="px-3 py-1.5 text-[11px] font-bold text-gray-700 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200">Close</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 space-y-3">
        {ticket.messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No messages yet.</p>
        ) : (
          ticket.messages.map((m: any) => (
            <div
              key={m.id}
              className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                m.author === "admin"
                  ? "ml-auto bg-[#01696f] text-white"
                  : "mr-auto bg-gray-100 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={`text-[9px] mt-1 ${m.author === "admin" ? "text-teal-100" : "text-gray-400"}`}>
                {m.author} · {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleReply} className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 space-y-3">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          placeholder="Type your reply..."
          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
        />
        <div className="flex justify-end">
          <button type="submit" disabled={sending} className="px-4 py-2 bg-[#01696f] text-white text-xs font-bold rounded-xl disabled:opacity-50">
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
