"use client";

import React, { useState } from "react";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { sendEmailBroadcast } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

export default function EmailBroadcastsPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState("all");
  const [loading, setLoading] = useState(false);
  const [sentHistory, setSentHistory] = useState([
    { id: "broadcast_1", subject: "PostPlanify Summer Update 2026", segment: "all", recipientCount: 148, sentAt: "2026-07-10T10:00:00.000Z" },
  ]);
  const { toast } = useToast();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body) return;
    try {
      setLoading(true);
      await sendEmailBroadcast({ subject, body, segment });
      setSentHistory((prev) => [
        { id: `broadcast_${Date.now()}`, subject, segment, recipientCount: 148, sentAt: new Date().toISOString() },
        ...prev,
      ]);
      toast({ title: "Email Broadcast Sent", description: `Broadcast queued for ${segment} users.`, tone: "success" });
      setSubject("");
      setBody("");
    } catch (err: any) {
      toast({ title: "Failed to Send Email", description: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Broadcasts</h1>
        <p className="text-xs text-gray-500">Send mass announcements and newsletter emails to registered platform users.</p>
      </div>

      <form onSubmit={handleSend} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-gray-900">Compose New Broadcast</h2>

        <div>
          <label className="font-bold text-gray-700">Target Audience Segment:</label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-50 border rounded-xl"
          >
            <option value="all">All Users (148 recipients)</option>
            <option value="free">Free Tier Users Only</option>
            <option value="paid">Paid Subscribers (Pro / Business / Agency)</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-gray-700">Email Subject Line:</label>
          <input
            type="text"
            required
            placeholder="e.g. Exciting New Features Coming to PostPlanify..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-50 border rounded-xl"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700">Email Message (Rich Markdown / HTML):</label>
          <textarea
            required
            rows={6}
            placeholder="Write your email announcement message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-50 border rounded-xl font-sans"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#01696f] hover:bg-[#015257] text-white font-bold rounded-xl shadow-xs transition-colors"
          >
            <Send className="size-4" />
            {loading ? "Sending Broadcast..." : "Send Broadcast Now"}
          </button>
        </div>
      </form>

      {/* Broadcast History */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Sent Broadcasts History</h2>
        <div className="divide-y divide-gray-100 text-xs">
          {sentHistory.map((h) => (
            <div key={h.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{h.subject}</p>
                <p className="text-[10px] text-gray-400">Segment: {h.segment} ({h.recipientCount} recipients)</p>
              </div>
              <span className="text-gray-500">{new Date(h.sentAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
