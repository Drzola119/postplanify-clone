"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, RefreshCw } from "lucide-react";
import type { Notification } from "@/lib/notifications";
import { NotificationItem } from "./NotificationItem";
import { markAllReadAction, markReadAction } from "@/app/dashboard/notifications/actions";

interface NotificationBellProps {
  initialUnreadCount?: number;
  initialNotifications?: Notification[];
}

export function NotificationBell({
  initialUnreadCount = 0,
  initialNotifications = [],
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const refreshNotifications = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const response = await fetch("/api/notifications", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const body = (await response.json().catch(() => ({}))) as {
        items?: Notification[];
        unreadCount?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? `Refresh failed (${response.status})`);
      setNotifications(body.items ?? []);
      setUnreadCount(body.unreadCount ?? 0);
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Unable to refresh notifications");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAllRead = async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    try {
      await markAllReadAction();
    } catch (err) {
      console.warn("[NotificationBell] Failed to mark all read:", err);
    }
  };

  const handleToggle = () => {
    setIsOpen((open) => !open);
  };

  const handleMarkRead = async (id: string) => {
    const target = notifications.find((item) => item.id === id);
    if (!target || target.read) return;
    setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, read: true } : item));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markReadAction(id);
    } catch (error) {
      console.warn("[NotificationBell] Failed to mark notification read:", error);
    }
  };

  const handleDeleteItem = (id: string) => {
    setNotifications((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && !target.read) setUnreadCount((count) => Math.max(0, count - 1));
      return prev.filter((item) => item.id !== id);
    });
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-flex items-center justify-center size-8 rounded-md hover:bg-[var(--color-surface-offset)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[480px] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] z-50 flex flex-col">
          {/* Header Row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-10">
            <h3 className="font-semibold text-sm text-[var(--color-text)]">Notifications</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleMarkAllRead()}
                  className="text-xs text-[var(--color-primary)] hover:underline font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => void refreshNotifications()}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
                aria-label="Refresh notifications"
                title="Refresh notifications"
              >
                <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {refreshError ? <p className="px-4 py-2 text-xs text-red-600 border-b border-red-100 bg-red-50">{refreshError}</p> : null}

          {/* List or Empty State */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
            {notifications.length === 0 ? (
              <div className="px-6 py-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-offset)] flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-[var(--color-text-faint)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  You&apos;re all caught up
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-[240px]">
                  Notifications will appear here when your posts publish, fail, or your accounts
                  need attention.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  onDelete={handleDeleteItem}
                  onMarkRead={(id) => void handleMarkRead(id)}
                />
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="p-2 border-t border-[var(--color-border)] text-center bg-[var(--color-surface-offset)] sticky bottom-0">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-[var(--color-primary)] hover:underline block py-1"
            >
              View all notifications &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
