import "server-only";
import { adminDb } from "@/lib/db";
import type {
  CommentDoc,
  ConversationDoc,
  MessageDoc,
  PlatformId,
} from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function commentsCollection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/comments`);
}

function conversationsCollection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/conversations`);
}

export interface ListCommentsFilters {
  platform?: PlatformId;
  sentiment?: "positive" | "neutral" | "negative";
  replied?: boolean;
  pageSize?: number;
  cursor?: string;
}

export interface CommentItem {
  id: string;
  workspaceId: string;
  platform: PlatformId;
  postId?: string;
  authorHandle: string;
  body: string;
  sentAt: string;
  sentiment?: "positive" | "neutral" | "negative";
  replied: boolean;
  replyId?: string;
}

export async function listComments(
  workspaceId: string,
  filters: ListCommentsFilters = {}
): Promise<{ items: CommentItem[]; nextCursor: string | null }> {
  const coll = commentsCollection(workspaceId);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);

  let q: { where: (f: string, op: string, v: unknown) => typeof q; orderBy: (f: string, d?: string) => typeof q; limit: (n: number) => { get: () => Promise<{ docs: Array<{ id: string; data: () => unknown }> }> }; get: () => Promise<{ docs: Array<{ id: string; data: () => unknown }> }> } = coll
    .orderBy("sentAt", "desc")
    .limit(pageSize) as unknown as typeof q;
  if (filters.platform) q = q.where("platform", "==", filters.platform);
  if (filters.sentiment) q = q.where("sentiment", "==", filters.sentiment);
  if (typeof filters.replied === "boolean") q = q.where("replied", "==", filters.replied);

  const snap = await q.get();
  const items = snap.docs.map((d) => serializeComment(workspaceId, d.id, d.data() as CommentDoc));
  const nextCursor = items.length === pageSize ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

export async function createComment(
  workspaceId: string,
  data: Partial<CommentDoc>
): Promise<string> {
  const ref = commentsCollection(workspaceId).doc();
  await ref.set({
    platform: data.platform ?? "twitter",
    postId: data.postId,
    authorHandle: data.authorHandle ?? "",
    body: data.body ?? "",
    sentAt: data.sentAt ?? SERVER_TIMESTAMP,
    sentiment: data.sentiment,
    replied: false,
    replyId: undefined,
  });
  return ref.id;
}

export async function markReplied(
  workspaceId: string,
  commentId: string,
  replyId: string
): Promise<void> {
  const ref = commentsCollection(workspaceId).doc(commentId);
  await ref.update({ replied: true, replyId });
}

export async function replyToComment(
  workspaceId: string,
  commentId: string,
  body: string
): Promise<string> {
  // Reply becomes a sibling message-like doc under comments collection with
  // direction metadata — we keep replies searchable alongside comments.
  const ref = commentsCollection(workspaceId).doc();
  await ref.set({
    platform: "twitter",
    authorHandle: "you",
    body,
    sentAt: SERVER_TIMESTAMP,
    replied: true,
  });
  await markReplied(workspaceId, commentId, ref.id);
  return ref.id;
}

export interface ListConversationsFilters {
  unreadOnly?: boolean;
  pageSize?: number;
  cursor?: string;
}

export interface ConversationItem {
  id: string;
  platform: PlatformId;
  participants: string[];
  lastMessageAt: string;
  unreadCount: number;
}

export async function listConversations(
  workspaceId: string,
  filters: ListConversationsFilters = {}
): Promise<{ items: ConversationItem[]; nextCursor: string | null }> {
  const coll = conversationsCollection(workspaceId);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);

  let q: { where: (f: string, op: string, v: unknown) => typeof q; orderBy: (f: string, d?: string) => typeof q; limit: (n: number) => { get: () => Promise<{ docs: Array<{ id: string; data: () => unknown }> }> }; get: () => Promise<{ docs: Array<{ id: string; data: () => unknown }> }> } = coll
    .orderBy("lastMessageAt", "desc")
    .limit(pageSize) as unknown as typeof q;
  if (filters.unreadOnly) q = q.where("unreadCount", ">", 0);

  const snap = await q.get();
  const items = snap.docs.map((d) => serializeConversation(d.id, d.data() as ConversationDoc));
  const nextCursor = items.length === pageSize ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

export async function getMessages(
  workspaceId: string,
  conversationId: string
): Promise<MessageDoc[]> {
  const coll = conversationsCollection(workspaceId).doc(conversationId).collection("messages");
  const snap = await coll.orderBy("sentAt", "asc").get();
  return snap.docs.map((d) => d.data() as MessageDoc);
}

export async function sendMessage(
  workspaceId: string,
  conversationId: string,
  body: string,
  direction: "in" | "out" = "out"
): Promise<string> {
  const ref = conversationsCollection(workspaceId).doc(conversationId).collection("messages").doc();
  await ref.set({
    fromHandle: direction === "out" ? "you" : "",
    body,
    sentAt: SERVER_TIMESTAMP,
    direction,
  });
  // Bump lastMessageAt + unreadCount.
  const convRef = conversationsCollection(workspaceId).doc(conversationId);
  await convRef.update({
    lastMessageAt: SERVER_TIMESTAMP,
    unreadCount: direction === "in" ? { _methodName: "increment", _operand: 1 } : 0,
  });
  return ref.id;
}

export async function markConversationRead(
  workspaceId: string,
  conversationId: string
): Promise<void> {
  const ref = conversationsCollection(workspaceId).doc(conversationId);
  await ref.update({ unreadCount: 0 });
}

function serializeComment(workspaceId: string, id: string, data: CommentDoc): CommentItem {
  return {
    id,
    workspaceId,
    platform: data.platform,
    postId: data.postId,
    authorHandle: data.authorHandle ?? "",
    body: data.body ?? "",
    sentAt: toIso(data.sentAt),
    sentiment: data.sentiment,
    replied: data.replied ?? false,
    replyId: data.replyId,
  };
}

function serializeConversation(id: string, data: ConversationDoc): ConversationItem {
  return {
    id,
    platform: data.platform,
    participants: data.participants ?? [],
    lastMessageAt: toIso(data.lastMessageAt),
    unreadCount: data.unreadCount ?? 0,
  };
}

function toIso(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && v && "_methodName" in v) return new Date().toISOString();
  if (typeof v === "object" && v && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof v === "object" && v && "seconds" in v) {
    const s = (v as { seconds: number }).seconds;
    return new Date(s * 1000).toISOString();
  }
  return new Date().toISOString();
}
