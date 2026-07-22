"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification } from "@/lib/notifications";
import { NotificationItem } from "./NotificationItem";
import { markAllReadAction } from "@/app/dashboard/notifications/actions";

interface NotificationBellProps {
  initialUnreadCount?: number;
  initialNotifications?: Notification[];
}

export function NotificationBell({
  initialUnreadCount = 0,
  initialNotifications = [],
}: NotificationBellProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const containerRef = useRef<HTMLDivElement>(null);

  // Firestore real-time listener: maps docs directly into client state without server action re-fetches
  useEffect(() => {
    if (!user?.uid || !db) return;

    try {
      const notifRef = collection(db, "users", user.uid, "notifications");
      const q = query(notifRef, orderBy("createdAt", "desc"), limit(50));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: Notification[] = snapshot.docs.map((doc) => {
            const data = doc.data(); // DocumentData from Firestore SDK
            return {
              id: doc.id,
              uid: user.uid,
              type: data.type,
              category: data.category,
              title: data.title,
              message: data.message,
              actionUrl: data.actionUrl,
              actionLabel: data.actionLabel,
              metadata: data.metadata,
              read: Boolean(data.read),
              createdAt: data.createdAt || new Date().toISOString(),
            };
          });
          setNotifications(items);
          setUnreadCount(items.filter((i) => !i.read).length);
        },
        () => {
          // Notifications remain at their server-rendered state when the listener is unavailable.
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("[NotificationBell] Error setting up listener:", err);
    }
  }, [user?.uid]);

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
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && unreadCount > 0) {
      handleMarkAllRead();
    }
  };

  const handleDeleteItem = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
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
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-[var(--color-primary)] hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

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
