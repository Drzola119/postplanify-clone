"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Inbox,
  AlertTriangle,
  Link2,
  Unlink2,
  X,
} from "lucide-react";
import type { Notification, NotificationType } from "@/lib/notifications";
import { deleteNotificationAction } from "@/app/dashboard/notifications/actions";

interface NotificationItemProps {
  notification: Notification;
  onDelete: (id: string) => void;
}

function formatRelativeTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString();
}

function getIconAndStyle(type: NotificationType) {
  switch (type) {
    case "post_published":
      return {
        Icon: CheckCircle2,
        className: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      };
    case "post_failed":
      return {
        Icon: XCircle,
        className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      };
    case "post_publishing_soon":
      return {
        Icon: Clock,
        className: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      };
    case "post_rescheduled":
      return {
        Icon: RefreshCw,
        className: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
      };
    case "queue_empty":
      return {
        Icon: Inbox,
        className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      };
    case "token_expired":
      return {
        Icon: AlertTriangle,
        className: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      };
    case "account_connected":
      return {
        Icon: Link2,
        className: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
      };
    case "account_disconnected":
      return {
        Icon: Unlink2,
        className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      };
    default:
      return {
        Icon: CheckCircle2,
        className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      };
  }
}

export function NotificationItem({ notification, onDelete }: NotificationItemProps) {
  const { Icon, className: iconClassName } = getIconAndStyle(notification.type);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(notification.id);
    deleteNotificationAction(notification.id).catch((err) => {
      console.error("Failed to delete notification on server:", err);
    });
  };

  return (
    <div className="flex gap-3 px-4 py-3 hover:bg-[var(--color-surface-offset)] transition-colors relative group border-b border-[var(--color-border)] last:border-b-0">
      {/* Left Column: Icon Circle */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconClassName}`}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Right Column */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="text-sm font-medium text-[var(--color-text)] flex items-center">
          {!notification.read && (
            <span
              className="w-2 h-2 rounded-full bg-[var(--color-primary)] inline-block mr-1.5 mb-0.5 flex-shrink-0"
              title="Unread"
            />
          )}
          <span className="truncate">{notification.title}</span>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        <div className="flex items-center text-xs mt-1.5 text-[var(--color-text-faint)]">
          <span>{formatRelativeTime(notification.createdAt)}</span>
          {notification.actionUrl && (
            <Link
              href={notification.actionUrl}
              className="text-xs text-[var(--color-primary)] hover:underline ml-3 font-medium"
            >
              {notification.actionLabel || "View"}
            </Link>
          )}
        </div>
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] rounded transition-colors"
        aria-label="Delete notification"
        title="Delete notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
