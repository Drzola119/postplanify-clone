"use server";

import { getCurrentUser } from "@/lib/firebase/admin";
import {
  countUnreadNotifications,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type Notification,
} from "@/lib/notifications";
import { revalidatePath } from "next/cache";

/**
 * Helper to get authenticated user or throw
 */
async function requireUser() {
  const user = await getCurrentUser();
  if (!user || !user.uid) {
    throw new Error("Unauthorized: Authentication required.");
  }
  return user;
}

/**
 * Returns last 50 notifications for the current user, ordered by createdAt DESC
 */
export async function getNotifications(): Promise<Notification[]> {
  const user = await requireUser();
  return listNotifications(user.uid);
}

/**
 * Returns count of documents where read == false for current user
 */
export async function getUnreadCount(): Promise<number> {
  const user = await requireUser();
  return countUnreadNotifications(user.uid);
}

/**
 * Marks a single notification as read for current user
 */
export async function markReadAction(notifId: string): Promise<void> {
  const user = await requireUser();
  await markNotificationRead(user.uid, notifId);
  revalidatePath("/dashboard");
}

/**
 * Marks all notifications as read for current user
 */
export async function markAllReadAction(): Promise<void> {
  const user = await requireUser();
  await markAllNotificationsRead(user.uid);
  revalidatePath("/dashboard");
}

/**
 * Deletes a single notification for current user
 */
export async function deleteNotificationAction(notifId: string): Promise<void> {
  const user = await requireUser();
  await deleteNotification(user.uid, notifId);
  revalidatePath("/dashboard");
}
