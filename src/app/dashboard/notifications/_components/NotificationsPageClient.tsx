"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import type { Notification, NotificationCategory } from "@/lib/notifications";
import { NotificationItem } from "@/app/dashboard/_components/NotificationItem";
import { markAllReadAction } from "@/app/dashboard/notifications/actions";

interface NotificationsPageClientProps {
  notifications: Notification[];
  unreadCount: number;
}

type TabType = "all" | NotificationCategory;

function getDateGroup(createdAt: string): "Today" | "Yesterday" | "This Week" | "Earlier" {
  const date = new Date(createdAt);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const startOfThisWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfThisWeek) return "This Week";
  return "Earlier";
}

export function NotificationsPageClient({
  notifications: initialNotifications,
  unreadCount: initialUnreadCount,
}: NotificationsPageClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    setUnreadCount(0);
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    try {
      await markAllReadAction();
      router.refresh();
    } catch (err) {
      console.error("Failed to mark all read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && !target.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Filter items by category
  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    return item.category === activeTab;
  });

  // Group filtered items by date category
  const groups: Array<{ name: "Today" | "Yesterday" | "This Week" | "Earlier"; items: Notification[] }> = [
    { name: "Today", items: [] },
    { name: "Yesterday", items: [] },
    { name: "This Week", items: [] },
    { name: "Earlier", items: [] },
  ];

  filteredItems.forEach((item) => {
    const groupName = getDateGroup(item.createdAt);
    const group = groups.find((g) => g.name === groupName);
    if (group) {
      group.items.push(item);
    }
  });

  const activeGroups = groups.filter((g) => g.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-offset)] transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === "all"
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-offset)]"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("publishing")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === "publishing"
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-offset)]"
          }`}
        >
          Publishing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("accounts")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === "accounts"
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-offset)]"
          }`}
        >
          Accounts
        </button>
      </div>

      {/* Grouped List or Empty State */}
      {filteredItems.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[var(--color-surface-offset)] flex items-center justify-center mb-4">
            <Bell className="w-7 h-7 text-[var(--color-text-faint)]" />
          </div>
          <h3 className="text-base font-semibold text-[var(--color-text)]">No notifications</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm">
            {activeTab === "all"
              ? "You don't have any notifications right now. Everything is up to date!"
              : `No notifications found under the ${activeTab} category.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeGroups.map((group) => (
            <div key={group.name} className="space-y-2">
              <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-1">
                {group.name}
              </h2>
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden shadow-xs divide-y divide-[var(--color-border)]">
                {group.items.map((item) => (
                  <NotificationItem key={item.id} notification={item} onDelete={handleDeleteItem} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
