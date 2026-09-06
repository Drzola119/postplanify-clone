import "server-only";
import { toIso } from "@/lib/db/date-utils";
import { adminDb } from "@/lib/db";
import type {
  CommentDoc,
  ConversationDoc,
  MessageDoc,
  PlatformId,
} from "@/lib/db/schema";

/**
 * Inbound event shape accepted by `upsertCommentFromEvent` and
 * `appendMessageFromEvent`. Mirrors the validated Zod schema in
 * src/lib/validation/inbox-events.ts but kept structurally
 * compatible (no zod types leaking into the db layer).
 */
export interface InboxEventPayload {
  workspaceId: string;
  platform: PlatformId;
  type: "comment" | "message";
  postId?: string;
  conversationId?: string;
  externalId: string;
  authorHandle: string;
  authorName?: string;
  authorExternalId?: string;
  body: string;
  sentAt: string;
  inReplyToId?: string;
  direction?: "in" | "out";
  metadata?: Record<string, unknown>;
  /** Workspace-owned Upload-Post profile username scoping this record. */
  accountKey?: string;
  /** Provider media/post id + permalink for post context links. */
  externalPostId?: string;
  postPermalink?: string;
  origin?: "manual" | "provider-automation" | "internal-automation";
}

/**
 * Workspace-scoped stable identity. External ids are NOT globally unique,
 * so every provider record is keyed by workspace + account + platform + id.
 */
export function identityKey(accountKey: string, platform: string, externalId: string): string {
  return `${accountKey}:${platform}:${externalId}`;
}

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
  resolved?: boolean;
  unreadOnly?: boolean;
  accountKey?: string;
  pageSize?: number;
  cursor?: string;
}

export interface CommentItem {
  id: string;
  workspaceId: string;
  platform: PlatformId;
  postId?: string;
  externalPostId?: string;
  postPermalink?: string;
  accountKey?: string;
  externalId?: string;
  authorHandle: string;
  authorExternalId?: string;
  body: string;
  sentAt: string;
  sentiment?: "positive" | "neutral" | "negative";
  sentimentSource?: "manual" | "ai" | "unset";
  labels?: string[];
  read?: boolean;
  resolved?: boolean;
  intent?: "support" | "sales" | "feedback" | "spam" | "other";
  topics?: string[];
  replied: boolean;
  replyId?: string;
  /** Campaign id when the auto-responder sent the reply (UI uses this to badge). */
  autoRepliedByCampaignId?: string;
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
  if (typeof filters.resolved === "boolean") q = q.where("resolved", "==", filters.resolved);
  if (filters.unreadOnly) q = q.where("read", "==", false);
  if (filters.accountKey) q = q.where("accountKey", "==", filters.accountKey);

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

export async function updateCommentSentiment(
  workspaceId: string,
  commentId: string,
  sentiment: "positive" | "neutral" | "negative"
): Promise<void> {
  const ref = commentsCollection(workspaceId).doc(commentId);
  await ref.update({ sentiment });
}

export async function replyToComment(
  workspaceId: string,
  commentId: string,
  body: string,
  platform: string = "twitter"
): Promise<string> {
  // Reply becomes a sibling message-like doc under comments collection with
  // direction metadata — we keep replies searchable alongside comments.
  const ref = commentsCollection(workspaceId).doc();
  await ref.set({
    platform,
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
  accountKey?: string;
  participants: string[];
  participantExternalIds?: string[];
  lastMessageAt: string;
  lastInboundAt?: string;
  unreadCount: number;
  read?: boolean;
  resolved?: boolean;
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

/**
 * Idempotent comment upsert keyed by `externalId`. n8n (and other
 * sources) may replay events; we don't want duplicate comment rows
 * for the same platform-side comment id.
 *
 * The dedup lookup uses a `where("externalId","==",...).limit(1)`
 * query — fast because externalId is high-cardinality. When found
 * we update mutable fields (sentiment, replied, metadata); when
 * not found we create a fresh doc with replied: false.
 *
 * Returns the serialized CommentItem plus whether it was created
 * vs updated.
 */
export async function upsertCommentFromEvent(
  workspaceId: string,
  payload: InboxEventPayload
): Promise<{ comment: CommentItem; created: boolean }> {
  const coll = commentsCollection(workspaceId);
  const sentAt = parseSentAt(payload.sentAt);
  const accountKey = payload.accountKey ?? workspaceId;
  const key = identityKey(accountKey, payload.platform, payload.externalId);

  let existing = await coll.where("identityKey", "==", key).limit(1).get();
  // Back-compat: records written before identityKey existed dedup by
  // externalId — but only legacy docs WITHOUT an identityKey. A scoped doc
  // from another account must never shadow this one.
  let legacyDoc: { id: string; data: () => unknown } | null = null;
  if (existing.docs.length === 0) {
    const byExternal = await coll.where("externalId", "==", payload.externalId).limit(10).get();
    legacyDoc = byExternal.docs.find((d) => !(d.data() as { identityKey?: unknown }).identityKey) ?? null;
    if (legacyDoc) {
      await coll.doc(legacyDoc.id).update({ identityKey: key, accountKey });
      existing = await coll.where("identityKey", "==", key).limit(1).get();
    }
  }
  if (existing.docs.length > 0) {
    const doc = existing.docs[0];
    const data = doc.data() as CommentDoc;
    const updates: Record<string, unknown> = {};
    if (payload.authorName && !data.authorHandle) updates.authorHandle = payload.authorHandle;
    if (payload.body) updates.body = payload.body;
    if (payload.metadata) updates.metadata = payload.metadata;
    if (Object.keys(updates).length > 0) await coll.doc(doc.id).update(updates);
    return {
      comment: serializeComment(workspaceId, doc.id, { ...data, ...updates } as CommentDoc),
      created: false,
    };
  }

  const ref = coll.doc();
  await ref.set({
    externalId: payload.externalId,
    identityKey: key,
    platform: payload.platform,
    postId: payload.postId,
    externalPostId: payload.externalPostId,
    postPermalink: payload.postPermalink,
    accountKey,
    authorHandle: payload.authorHandle,
    authorName: payload.authorName,
    authorExternalId: payload.authorExternalId,
    body: payload.body,
    sentAt,
    observedAt: new Date(),
    direction: payload.direction,
    inReplyToId: payload.inReplyToId,
    metadata: payload.metadata,
    replied: false,
    analyzed: false,
    read: false,
    resolved: false,
    origin: payload.origin ?? "internal-automation",
  });
  return {
    comment: {
      id: ref.id,
      workspaceId,
      platform: payload.platform,
      postId: payload.postId,
      authorHandle: payload.authorHandle,
      body: payload.body,
      sentAt: toIso(sentAt),
      sentiment: undefined,
      replied: false,
      replyId: undefined,
    },
    created: true,
  };
}

/**
 * Append a DM into a conversation. When `conversationId` is supplied
 * we attach to that conversation; otherwise we look up an existing
 * conversation for (platform, authorHandle) or create one.
 *
 * Returns the conversation id and the new message id.
 */
export async function appendMessageFromEvent(
  workspaceId: string,
  payload: InboxEventPayload
): Promise<{ conversationId: string; messageId: string; created: boolean }> {
  const coll = conversationsCollection(workspaceId);
  let conversationId = payload.conversationId;
  let created = false;
  const accountKey = payload.accountKey ?? workspaceId;

  if (!conversationId) {
    const key = identityKey(accountKey, payload.platform, payload.externalId);
    let existing = await coll.where("identityKey", "==", key).limit(1).get();
    if (existing.docs.length === 0) {
      // Legacy fallback: only adopt docs without an identityKey.
      const byExternal = await coll.where("externalId", "==", payload.externalId).limit(10).get();
      const legacy = byExternal.docs.find((d) => !(d.data() as { identityKey?: unknown }).identityKey);
      if (legacy) {
        await coll.doc(legacy.id).update({ identityKey: key, accountKey });
        existing = await coll.where("identityKey", "==", key).limit(1).get();
      }
    }
    if (existing.docs.length > 0) {
      conversationId = existing.docs[0].id;
    } else {
      const ref = coll.doc();
      const sentAt = parseSentAt(payload.sentAt);
      await ref.set({
        externalId: payload.externalId,
        identityKey: key,
        platform: payload.platform,
        accountKey,
        participants: [payload.authorHandle],
        participantExternalIds: payload.authorExternalId ? [payload.authorExternalId] : [],
        lastMessageAt: sentAt,
        lastInboundAt: payload.direction !== "out" ? sentAt : null,
        unreadCount: payload.direction === "in" ? 1 : 0,
        read: payload.direction !== "in",
        resolved: false,
        createdAt: SERVER_TIMESTAMP,
      });
      conversationId = ref.id;
      created = true;
    }
  }

  // Message-level dedup: re-syncs must not duplicate history.
  const msgColl = coll.doc(conversationId).collection("messages");
  const dup = await msgColl.where("externalId", "==", payload.externalId).limit(1).get();
  if (dup.docs.length > 0) {
    return { conversationId, messageId: dup.docs[0].id, created: false };
  }

  const msgRef = msgColl.doc();
  const sentAt = parseSentAt(payload.sentAt);
  await msgRef.set({
    externalId: payload.externalId,
    fromHandle: payload.authorHandle,
    authorName: payload.authorName,
    body: payload.body,
    sentAt,
    direction: payload.direction,
    inReplyToId: payload.inReplyToId,
    metadata: payload.metadata,
    analyzed: false,
  });

  // Bump conversation lastMessageAt + unreadCount. lastInboundAt only moves
  // on inbound provider messages — our own sends never extend the DM window.
  const update: Record<string, unknown> = { lastMessageAt: sentAt, read: false };
  if (payload.direction === "in") {
    update.unreadCount = { _methodName: "increment", _operand: 1 };
    update.lastInboundAt = sentAt;
  } else if (payload.direction === "out") {
    update.unreadCount = 0;
  }
  await coll.doc(conversationId).update(update);

  return { conversationId, messageId: msgRef.id, created };
}

/**
 * Find or create a conversation keyed by the PROVIDER conversation id
 * (stable across syncs). Used by the sync worker so one provider thread
 * maps to exactly one local conversation.
 */
export async function findOrCreateConversation(
  workspaceId: string,
  input: {
    platform: PlatformId;
    accountKey: string;
    providerConversationId: string;
    participants: string[];
    participantExternalIds?: string[];
  }
): Promise<{ conversationId: string; created: boolean }> {
  const coll = conversationsCollection(workspaceId);
  const key = identityKey(input.accountKey, input.platform, input.providerConversationId);
  let existing = await coll.where("identityKey", "==", key).limit(1).get();
  if (existing.docs.length === 0) {
    existing = await coll.where("externalId", "==", input.providerConversationId).limit(1).get();
  }
  if (existing.docs.length > 0) {
    const id = existing.docs[0].id;
    const data = existing.docs[0].data() as ConversationDoc;
    const patch: Record<string, unknown> = {};
    if (!data.identityKey) patch.identityKey = key;
    if (!data.accountKey) patch.accountKey = input.accountKey;
    if (input.participantExternalIds?.length && !(data.participantExternalIds ?? []).length) {
      patch.participantExternalIds = input.participantExternalIds;
    }
    if (Object.keys(patch).length > 0) await coll.doc(id).update(patch);
    return { conversationId: id, created: false };
  }
  const ref = coll.doc();
  await ref.set({
    externalId: input.providerConversationId,
    identityKey: key,
    platform: input.platform,
    accountKey: input.accountKey,
    participants: input.participants,
    participantExternalIds: input.participantExternalIds ?? [],
    lastMessageAt: new Date(),
    unreadCount: 0,
    read: true,
    resolved: false,
    createdAt: SERVER_TIMESTAMP,
  });
  return { conversationId: ref.id, created: true };
}

function parseSentAt(raw: string): Date {
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function serializeComment(workspaceId: string, id: string, data: CommentDoc): CommentItem {
  return {
    id,
    workspaceId,
    platform: data.platform,
    postId: data.postId,
    externalPostId: data.externalPostId,
    postPermalink: data.postPermalink,
    accountKey: data.accountKey,
    externalId: data.externalId,
    authorHandle: data.authorHandle ?? "",
    authorExternalId: data.authorExternalId,
    body: data.body ?? "",
    sentAt: toIso(data.sentAt),
    sentiment: data.sentiment,
    sentimentSource: data.sentimentSource,
    labels: data.labels,
    read: data.read,
    resolved: data.resolved,
    intent: data.intent,
    topics: data.topics,
    replied: data.replied ?? false,
    replyId: data.replyId,
    autoRepliedByCampaignId: data.autoRepliedByCampaignId,
  };
}

function serializeConversation(id: string, data: ConversationDoc): ConversationItem {
  return {
    id,
    platform: data.platform,
    accountKey: data.accountKey,
    participants: data.participants ?? [],
    participantExternalIds: data.participantExternalIds,
    lastMessageAt: toIso(data.lastMessageAt),
    lastInboundAt: data.lastInboundAt ? toIso(data.lastInboundAt) : undefined,
    unreadCount: data.unreadCount ?? 0,
    read: data.read,
    resolved: data.resolved,
  };
}


