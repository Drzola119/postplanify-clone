import { adminDb } from "@/lib/firebase/admin";

export type NotificationType =
  | "post_published"
  | "post_failed"
  | "post_publishing_soon"
  | "post_rescheduled"
  | "queue_empty"
  | "token_expired"
  | "account_connected"
  | "account_disconnected";

export type NotificationCategory = "publishing" | "accounts";

export interface CreateNotificationInput {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

export interface Notification extends CreateNotificationInput {
  id: string;
  uid: string;
  read: boolean;
  createdAt: string; // ISO string
}

/**
  Creates a new notification document under users/{uid}/notifications
 */
export async function createNotification(
  uid: string,
  data: CreateNotificationInput
): Promise<void> {
  if (!uid) return;
  if (!adminDb) {
    console.warn("[notifications] adminDb not configured, skipping createNotification");
    return;
  }
  try {
    await adminDb.collection("users").doc(uid).collection("notifications").add({
      ...data,
      uid,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[notifications] Error creating notification:", error);
  }
}

/**
 * Marks a single notification as read for a given user
 */
export async function markNotificationRead(
  uid: string,
  notifId: string
): Promise<void> {
  if (!uid || !notifId) return;
  if (!adminDb) {
    console.warn("[notifications] adminDb not configured, skipping markNotificationRead");
    return;
  }
  try {
    await adminDb
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .doc(notifId)
      .set({ read: true }, { merge: true });
  } catch (error) {
    console.error("[notifications] Error marking notification read:", error);
  }
}

/**
 * Marks all unread notifications as read for a given user
 */
export async function markAllNotificationsRead(uid: string): Promise<void> {
  if (!uid) return;
  if (!adminDb) {
    console.warn("[notifications] adminDb not configured, skipping markAllNotificationsRead");
    return;
  }
  try {
    const snap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .where("read", "==", false)
      .get();

    if (snap.empty) return;

    const batch = adminDb.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.error("[notifications] Error marking all notifications read:", error);
  }
}

/**
 * Deletes a notification document for a given user
 */
export async function deleteNotification(
  uid: string,
  notifId: string
): Promise<void> {
  if (!uid || !notifId) return;
  if (!adminDb) {
    console.warn("[notifications] adminDb not configured, skipping deleteNotification");
    return;
  }
  try {
    await adminDb
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .doc(notifId)
      .delete();
  } catch (error) {
    console.error("[notifications] Error deleting notification:", error);
  }
}
