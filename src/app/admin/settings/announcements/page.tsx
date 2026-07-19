"use client";

import React, { useState } from "react";
import { Megaphone, Plus, Bell } from "lucide-react";
import { createAnnouncement } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([
    {
      id: "anc_1",
      title: "Major Release: Bluesky & Threads Scheduling Live!",
      message: "You can now auto-publish and schedule posts to Bluesky and Threads directly from PostPlanify.",
      type: "info",
      target: "all",
      startDate: "2026-07-01",
      endDate: "2026-08-01",
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info", target: "all", startDate: "2026-07-19", endDate: "2026-08-19" });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAnnouncement(form);
    setAnnouncements((prev) => [...prev, { id: `anc_${Date.now()}`, ...form }]);
    toast({ title: "Announcement Published", description: "Banner will render on user dashboards.", tone: "success" });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Announcements</h1>
          <p className="text-xs text-gray-500">Create system banners and broadcast notifications inside user dashboards.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#01696f] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#015257]"
        >
          <Plus className="size-4" />
          New Announcement
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-start gap-4">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl shrink-0">
              <Megaphone className="size-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm">{a.title}</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-800 rounded uppercase">{a.target}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{a.message}</p>
              <p className="text-[10px] text-gray-400 mt-2">Active: {a.startDate} → {a.endDate}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="font-bold text-gray-900 text-sm">Broadcast Announcement Banner</h3>
            <div>
              <label className="font-bold text-gray-700">Title:</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700">Message Body:</label>
              <textarea
                required
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-50 border rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700">Target Segment:</label>
                <select
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className="w-full mt-1 p-2 bg-gray-50 border rounded-xl"
                >
                  <option value="all">All Users</option>
                  <option value="free">Free Tier Only</option>
                  <option value="pro">Paid Plans Only</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-700">Banner Type:</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full mt-1 p-2 bg-gray-50 border rounded-xl"
                >
                  <option value="info">Info (Blue/Teal)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="success">Success (Green)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-[#01696f] text-white font-bold rounded-xl">
                Publish Banner
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
