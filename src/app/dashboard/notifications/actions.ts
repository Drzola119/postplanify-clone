"use server";

import { getCurrentUser, adminDb } from "@/lib/firebase/admin";
import {
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

  if (!adminDb) {
    console.warn("[notifications-actions] adminDb not configured");
    return [];
  }

  try {
    const snap = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data();
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
      } as Notification;
    });
  } catch (error) {
    console.error("[notifications-actions] Error fetching notifications:", error);
    return [];
  }
}

/**
 * Returns count of documents where read == false for current user
 */
export async function getUnreadCount(): Promise<number> {
  const user = await requireUser();

  if (!adminDb) {
    return 0;
  }

  try {
    const snap = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .where("read", "==", false)
      .get();

    return snap.size;
  } catch (error) {
    console.error("[notifications-actions] Error fetching unread count:", error);
    return 0;
  }
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
