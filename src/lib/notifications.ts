import { adminDb } from "@/lib/firebase/admin";

export type NotificationType =
  | "post_published"
  | "post_failed"
  | "post_publishing_soon"
  | "post_rescheduled"
  | "queue_empty"
  | "token_expired"
  | "account_connected"
  | "account_disconnected"
  | "admin_message"
  | "inbox_comment"
  | "inbox_message"
  | "quota_exceeded"
  | "system_warning";

export type NotificationCategory = "publishing" | "accounts" | "inbox" | "system";

export interface CreateNotificationInput {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  /** Stable event identity. New events with the same key are written once. */
  dedupeKey?: string;
}

export interface Notification extends CreateNotificationInput {
  id: string;
  uid: string;
  read: boolean;
  createdAt: string; // ISO string
}

export interface NotificationFeed {
  items: Notification[];
  unreadCount: number;
}

type ConfigurableNotificationType = "post_published" | "inbox_comment" | "inbox_message";
type NotificationPreference = "postPublished" | "inboxComment" | "inboxMessage";

const preferenceByType: Record<ConfigurableNotificationType, NotificationPreference> = {
  post_published: "postPublished",
  inbox_comment: "inboxComment",
  inbox_message: "inboxMessage",
};

const preferenceCache = new Map<string, { values: Record<string, unknown>; expiresAt: number }>();
const PREFERENCE_CACHE_TTL_MS = 60_000;

export function clearNotificationPreferenceCache(uid: string): void {
  preferenceCache.delete(uid);
}

async function isNotificationEnabled(uid: string, type: NotificationType): Promise<boolean> {
  const preference = preferenceByType[type as ConfigurableNotificationType];
  if (!preference || !adminDb) return true;

  const cached = preferenceCache.get(uid);
  let values = cached && cached.expiresAt > Date.now() ? cached.values : null;
  if (!values) {
    const snap = await adminDb.collection("users").doc(uid).get();
    values = ((snap.data()?.notif ?? {}) as Record<string, unknown>);
    preferenceCache.set(uid, { values, expiresAt: Date.now() + PREFERENCE_CACHE_TTL_MS });
  }

  if (typeof values[preference] !== "boolean") {
    return type !== "inbox_message";
  }
  return values[preference] as boolean;
}

function stableDocumentId(dedupeKey: string): string {
  // FNV-1a gives us a deterministic, Firestore-safe id without importing a
  // Node-only crypto module into client components that import Notification as
  // a type. Two passes reduce the already-small collision surface.
  let first = 2166136261;
  let second = 2166136261;
  for (let i = 0; i < dedupeKey.length; i += 1) {
    const code = dedupeKey.charCodeAt(i);
    first ^= code;
    first = Math.imul(first, 16777619) >>> 0;
    second ^= code + i;
    second = Math.imul(second, 16777619) >>> 0;
  }
  return `event_${first.toString(16).padStart(8, "0")}${second.toString(16).padStart(8, "0")}`;
}

function serializeNotification(uid: string, id: string, data: Record<string, unknown>): Notification {
  return {
    id,
    uid,
    type: data.type as NotificationType,
    category: data.category as NotificationCategory,
    title: String(data.title ?? "Notification"),
    message: String(data.message ?? ""),
    actionUrl: typeof data.actionUrl === "string" ? data.actionUrl : undefined,
    actionLabel: typeof data.actionLabel === "string" ? data.actionLabel : undefined,
    metadata: data.metadata as Record<string, unknown> | undefined,
    dedupeKey: typeof data.dedupeKey === "string" ? data.dedupeKey : undefined,
    read: Boolean(data.read),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
  };
}

export async function listNotifications(uid: string): Promise<Notification[]> {
  if (!uid || !adminDb) return [];
  try {
    const snap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    return snap.docs.map((doc) => serializeNotification(uid, doc.id, doc.data()));
  } catch (error) {
    console.error("[notifications] Error listing notifications:", error);
    return [];
  }
}

export async function countUnreadNotifications(uid: string): Promise<number> {
  if (!uid || !adminDb) return 0;
  try {
    const snap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .where("read", "==", false)
      .get();
    return snap.size;
  } catch (error) {
    console.error("[notifications] Error counting unread notifications:", error);
    return 0;
  }
}

export async function getNotificationFeed(uid: string): Promise<NotificationFeed> {
  const [items, unreadCount] = await Promise.all([
    listNotifications(uid),
    countUnreadNotifications(uid),
  ]);
  return { items, unreadCount };
}

export async function getWorkspaceOwnerUid(workspaceId: string): Promise<string | null> {
  if (!workspaceId || !adminDb) return null;
  try {
    const snap = await adminDb.doc(`workspaces/${workspaceId}`).get();
    const ownerUid = snap.data()?.ownerUid;
    return typeof ownerUid === "string" && ownerUid ? ownerUid : null;
  } catch (error) {
    console.error("[notifications] Error resolving workspace owner:", error);
    return null;
  }
}

/**
  Creates a new notification document under users/{uid}/notifications
 */
export async function createNotification(
  uid: string,
  data: CreateNotificationInput
): Promise<boolean> {
  if (!uid) return false;
  if (!adminDb) {
    console.warn("[notifications] adminDb not configured, skipping createNotification");
    return false;
  }
  try {
    if (!(await isNotificationEnabled(uid, data.type))) return false;
    const collection = adminDb.collection("users").doc(uid).collection("notifications");
    const { dedupeKey, ...payload } = data;
    const ref = dedupeKey ? collection.doc(stableDocumentId(dedupeKey)) : collection.doc();
    await ref.create({
      ...payload,
      uid,
      read: false,
      createdAt: new Date().toISOString(),
      ...(dedupeKey ? { dedupeKey } : {}),
    });
    return true;
  } catch (error) {
    // A duplicate deterministic id means an upstream retry, not a failed
    // notification. All other failures remain best-effort and non-blocking.
    if ((error as { code?: unknown })?.code === 6 || (error as { code?: unknown })?.code === "already-exists") {
      return false;
    }
    console.error("[notifications] Error creating notification:", error);
    return false;
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
