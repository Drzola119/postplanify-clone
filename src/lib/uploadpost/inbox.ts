import "server-only";
import { createLogger } from "@/lib/log";

/**
 * Server-side Upload-Post Inbox adapter (Instagram V1).
 *
 * Only calls endpoints verified against the official docs on 2026-09-06
 * (see docs/inbox/capability-matrix.md). API keys stay on the server —
 * callers pass the resolved key + workspace-owned profile username;
 * a client-supplied username is never accepted as authorization.
 *
 * Conventions (matching src/lib/uploadpost/publisher.ts):
 * - bounded AbortSignal timeouts on every call
 * - consistent UploadPostInboxError with retryable flag + redacted logs
 * - reads are safe to retry; writes are NEVER blindly retried
 */

const log = createLogger("uploadpost-inbox");

const API_BASE = "https://api.upload-post.com/api";
const READ_TIMEOUT_MS = 20_000;
const WRITE_TIMEOUT_MS = 30_000;

export type InboxErrorCode =
  | "bad-request"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "conflict-reauth"
  | "rate-limited"
  | "platform-not-supported"
  | "tiktok-reconnect-required"
  | "provider-error"
  | "timeout"
  | "network";

export class UploadPostInboxError extends Error {
  readonly code: InboxErrorCode;
  readonly httpStatus: number;
  /** Reads may be retried with backoff; writes must reconcile, never blindly retry. */
  readonly retryable: boolean;
  readonly errorCode?: string;

  constructor(code: InboxErrorCode, httpStatus: number, message: string, retryable: boolean, errorCode?: string) {
    super(message);
    this.name = "UploadPostInboxError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.retryable = retryable;
    if (errorCode) this.errorCode = errorCode;
  }
}

// ---------- normalized types ----------

export interface ProviderComment {
  id: string;
  text: string;
  timestamp: string;
  authorId?: string;
  authorUsername?: string;
}

export interface CommentPage {
  comments: ProviderComment[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface ProviderConversationMessage {
  id: string;
  createdTime: string;
  fromId?: string;
  fromUsername?: string;
  body: string;
}

export interface ProviderConversation {
  id: string;
  participants: Array<{ id: string; username: string }>;
  messages: ProviderConversationMessage[];
}

export interface PrivateReplyResult {
  recipientId: string;
  messageId: string;
}

export interface PublicReplyResult {
  id: string;
}

export interface DmSendResult {
  recipientId: string;
  messageId: string;
}

export interface ProviderMedia {
  id: string;
  caption?: string;
  mediaType?: string;
  permalink?: string;
  timestamp?: string;
}

export interface MediaPage {
  media: ProviderMedia[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type AutodmStatus = "running" | "paused" | "resuming" | "stopped" | "expired";

export interface AutodmMonitor {
  monitorId: string;
  postUrl: string;
  replyMessage: string;
  profileUsername: string;
  monitoringInterval?: number;
  isActive: boolean;
  status: AutodmStatus;
  stats?: { totalComments: number; newComments: number; successfulReplies: number; failedReplies: number };
  createdAt?: string;
  lastCheck?: string;
}

export interface AutodmLog {
  type: string;
  timestamp: string;
  message: string;
}

// ---------- internals ----------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function errText(v: unknown, fallback: string): string {
  if (typeof v === "string" && v.trim()) return v;
  if (!isRecord(v)) return fallback;
  for (const k of ["error", "error_message", "message", "detail", "reason"]) {
    const val = v[k];
    if (typeof val === "string" && val.trim()) return val;
  }
  return fallback;
}

function classify(status: number, body: unknown): UploadPostInboxError {
  const msg = errText(body, `Upload-Post request failed (HTTP ${status})`);
  const code = isRecord(body) && typeof body.error_code === "string" ? body.error_code : undefined;
  if (code === "platform_not_supported")
    return new UploadPostInboxError("platform-not-supported", status, msg, false, code);
  if (code === "tiktok_reconnect_required")
    return new UploadPostInboxError("tiktok-reconnect-required", status, msg, false, code);
  if (status === 400) return new UploadPostInboxError("bad-request", status, msg, false, code);
  if (status === 401) return new UploadPostInboxError("unauthorized", status, msg, false, code);
  if (status === 403) return new UploadPostInboxError("forbidden", status, msg, false, code);
  if (status === 404) return new UploadPostInboxError("not-found", status, msg, false, code);
  if (status === 409) return new UploadPostInboxError("conflict-reauth", status, msg, false, code);
  if (status === 429) return new UploadPostInboxError("rate-limited", status, msg, true, code);
  if (status >= 500) return new UploadPostInboxError("provider-error", status, msg, true, code);
  return new UploadPostInboxError("provider-error", status, msg, status >= 500, code);
}

async function req<T>(opts: {
  apiKey: string;
  method: "GET" | "POST";
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: Record<string, unknown>;
  timeoutMs: number;
  op: string;
}): Promise<T> {
  const url = new URL(`${API_BASE}${opts.path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method,
      headers: {
        Authorization: `Apikey ${opts.apiKey}`,
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(opts.timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new UploadPostInboxError("timeout", 504, `Upload-Post ${opts.op} timed out`, true);
    }
    throw new UploadPostInboxError("network", 502, `Upload-Post ${opts.op} network error`, true);
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok || (isRecord(data) && data.success === false)) {
    const e = classify(res.status, data);
    // Redacted: never log the key or message bodies.
    log.warn(`inbox ${opts.op} failed`, { status: res.status, code: e.code });
    throw e;
  }
  return data as T;
}

function normComment(c: unknown): ProviderComment {
  const r = (isRecord(c) ? c : {}) as Record<string, unknown>;
  const user = (isRecord(r.user) ? r.user : {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    text: typeof r.text === "string" ? r.text : "",
    timestamp: typeof r.timestamp === "string" ? r.timestamp : new Date().toISOString(),
    authorId: typeof user.id === "string" ? user.id : undefined,
    authorUsername: typeof user.username === "string" ? user.username : undefined,
  };
}

// ---------- reads (retryable) ----------

export async function listInstagramComments(
  apiKey: string,
  profileUsername: string,
  target: { postId?: string; postUrl?: string },
  opts?: { limit?: number; after?: string }
): Promise<CommentPage> {
  const limit = Math.min(Math.max(opts?.limit ?? 25, 1), 50);
  const data = await req<{ comments?: unknown[]; pagination?: { next_cursor?: string | null; has_next?: boolean } }>({
    apiKey,
    method: "GET",
    path: "/uploadposts/comments",
    query: {
      platform: "instagram",
      user: profileUsername,
      ...(target.postId ? { post_id: target.postId } : {}),
      ...(target.postUrl ? { post_url: target.postUrl } : {}),
      limit,
      ...(opts?.after ? { after: opts.after } : {}),
    },
    timeoutMs: READ_TIMEOUT_MS,
    op: "list-comments",
  });
  const comments = Array.isArray(data.comments) ? data.comments.map(normComment).filter((c) => c.id) : [];
  return {
    comments,
    nextCursor: data.pagination?.next_cursor ?? null,
    hasNext: data.pagination?.has_next ?? false,
  };
}

export async function listInstagramMedia(
  apiKey: string,
  profileUsername: string,
  opts?: { limit?: number; cursor?: string }
): Promise<MediaPage> {
  const limit = Math.min(Math.max(opts?.limit ?? 25, 1), 100);
  const data = await req<{ media?: unknown[]; pagination?: { next_cursor?: string | null; has_more?: boolean } }>({
    apiKey,
    method: "GET",
    path: "/uploadposts/media",
    query: {
      platform: "instagram",
      user: profileUsername,
      limit,
      ...(opts?.cursor ? { cursor: opts.cursor } : {}),
    },
    timeoutMs: READ_TIMEOUT_MS,
    op: "list-media",
  });
  const media: ProviderMedia[] = Array.isArray(data.media)
    ? data.media.flatMap((m) => {
        if (!isRecord(m) || typeof m.id !== "string") return [];
        return [
          {
            id: m.id,
            caption: typeof m.caption === "string" ? m.caption : undefined,
            mediaType: typeof m.media_type === "string" ? m.media_type : undefined,
            permalink: typeof m.permalink === "string" ? m.permalink : undefined,
            timestamp: typeof m.timestamp === "string" ? m.timestamp : undefined,
          },
        ];
      })
    : [];
  return { media, nextCursor: data.pagination?.next_cursor ?? null, hasMore: data.pagination?.has_more ?? false };
}

export async function listInstagramConversations(
  apiKey: string,
  profileUsername: string
): Promise<ProviderConversation[]> {
  const data = await req<{ conversations?: unknown[] }>({
    apiKey,
    method: "GET",
    path: "/uploadposts/dms/conversations",
    query: { platform: "instagram", user: profileUsername },
    timeoutMs: READ_TIMEOUT_MS,
    op: "list-conversations",
  });
  if (!Array.isArray(data.conversations)) return [];
  return data.conversations.flatMap((c): ProviderConversation[] => {
    if (!isRecord(c) || typeof c.id !== "string") return [];
    const parts = isRecord(c.participants) && Array.isArray((c.participants as { data?: unknown }).data)
      ? ((c.participants as { data: unknown[] }).data as unknown[])
      : [];
    const msgs = isRecord(c.messages) && Array.isArray((c.messages as { data?: unknown }).data)
      ? ((c.messages as { data: unknown[] }).data as unknown[])
      : [];
    return [
      {
        id: c.id,
        participants: parts.flatMap((p) =>
          isRecord(p) && typeof p.id === "string" ? [{ id: p.id, username: typeof p.username === "string" ? p.username : p.id }] : []
        ),
        messages: msgs.flatMap((m): ProviderConversationMessage[] => {
          if (!isRecord(m) || typeof m.id !== "string") return [];
          const from = isRecord(m.from) ? (m.from as Record<string, unknown>) : {};
          return [
            {
              id: m.id,
              createdTime: typeof m.created_time === "string" ? m.created_time : new Date().toISOString(),
              fromId: typeof from.id === "string" ? from.id : undefined,
              fromUsername: typeof from.username === "string" ? from.username : undefined,
              body: typeof m.message === "string" ? m.message : "",
            },
          ];
        }),
      },
    ];
  });
}

// ---------- writes (never blindly retried) ----------

export interface DmButton {
  title: string;
  url: string;
}

function checkButtons(buttons?: DmButton[]): void {
  if (!buttons) return;
  if (buttons.length > 3) throw new UploadPostInboxError("bad-request", 400, "At most 3 buttons are supported", false);
  for (const b of buttons) {
    if (!b.title || b.title.length > 20)
      throw new UploadPostInboxError("bad-request", 400, "Button title is required (max 20 chars)", false);
    if (!/^https?:\/\//.test(b.url))
      throw new UploadPostInboxError("bad-request", 400, "Button URL must be http(s)", false);
  }
}

/** Instagram public reply: POST /comments/public-reply */
export async function postInstagramPublicReply(
  apiKey: string,
  profileUsername: string,
  input: { commentId: string; message: string }
): Promise<PublicReplyResult> {
  if (!input.commentId) throw new UploadPostInboxError("bad-request", 400, "comment_id is required", false);
  if (!input.message.trim()) throw new UploadPostInboxError("bad-request", 400, "message is required", false);
  const data = await req<{ id?: string }>({
    apiKey,
    method: "POST",
    path: "/uploadposts/comments/public-reply",
    body: { platform: "instagram", user: profileUsername, comment_id: input.commentId, message: input.message },
    timeoutMs: WRITE_TIMEOUT_MS,
    op: "public-reply",
  });
  if (!data.id) throw new UploadPostInboxError("provider-error", 502, "Provider reply missing id", false);
  return { id: data.id };
}

/** Instagram private reply (DM to commenter): POST /comments/reply */
export async function postInstagramPrivateReply(
  apiKey: string,
  profileUsername: string,
  input: { commentId: string; message: string; buttons?: DmButton[] }
): Promise<PrivateReplyResult> {
  if (!input.commentId) throw new UploadPostInboxError("bad-request", 400, "comment_id is required", false);
  if (!input.message.trim()) throw new UploadPostInboxError("bad-request", 400, "message is required", false);
  checkButtons(input.buttons);
  const data = await req<{ recipient_id?: string; message_id?: string }>({
    apiKey,
    method: "POST",
    path: "/uploadposts/comments/reply",
    body: {
      platform: "instagram",
      user: profileUsername,
      comment_id: input.commentId,
      message: input.message,
      ...(input.buttons?.length ? { buttons: input.buttons } : {}),
    },
    timeoutMs: WRITE_TIMEOUT_MS,
    op: "private-reply",
  });
  if (!data.message_id) throw new UploadPostInboxError("provider-error", 502, "Provider reply missing message_id", false);
  return { recipientId: data.recipient_id ?? "", messageId: data.message_id };
}

/** Instagram DM by scoped recipient id: POST /dms/send */
export async function sendInstagramDm(
  apiKey: string,
  profileUsername: string,
  input: { recipientId: string; message: string; buttons?: DmButton[] }
): Promise<DmSendResult> {
  if (!input.recipientId) throw new UploadPostInboxError("bad-request", 400, "recipient_id is required", false);
  if (!input.message.trim()) throw new UploadPostInboxError("bad-request", 400, "message is required", false);
  checkButtons(input.buttons);
  const data = await req<{ recipient_id?: string; message_id?: string }>({
    apiKey,
    method: "POST",
    path: "/uploadposts/dms/send",
    body: {
      platform: "instagram",
      user: profileUsername,
      recipient_id: input.recipientId,
      message: input.message,
      ...(input.buttons?.length ? { buttons: input.buttons } : {}),
    },
    timeoutMs: WRITE_TIMEOUT_MS,
    op: "dm-send",
  });
  if (!data.message_id) throw new UploadPostInboxError("provider-error", 502, "Provider DM missing message_id", false);
  return { recipientId: data.recipient_id ?? input.recipientId, messageId: data.message_id };
}

/** Instagram comment delete (own comments / own posts): DELETE /comments/delete */
export async function deleteInstagramComment(
  apiKey: string,
  profileUsername: string,
  commentId: string
): Promise<void> {
  if (!commentId) throw new UploadPostInboxError("bad-request", 400, "comment_id is required", false);
  await req<unknown>({
    apiKey,
    method: "POST",
    path: "/uploadposts/comments/delete",
    body: { platform: "instagram", user: profileUsername, comment_id: commentId },
    timeoutMs: WRITE_TIMEOUT_MS,
    op: "comment-delete",
  });
}

// ---------- AutoDM (prepared; disabled until workspace enables — grill decision) ----------

export interface AutodmStartInput {
  postUrl: string;
  replyMessage: string;
  profileUsername: string;
  buttons?: DmButton[];
  monitoringInterval?: number;
  triggerKeywords?: string[];
}

export async function autodmStart(
  apiKey: string,
  input: AutodmStartInput
): Promise<{ monitorId: string }> {
  checkButtons(input.buttons);
  const data = await req<{ monitor_id?: string }>({
    apiKey,
    method: "POST",
    path: "/uploadposts/autodms/start",
    body: {
      post_url: input.postUrl,
      reply_message: input.replyMessage,
      profile_username: input.profileUsername,
      ...(input.buttons?.length ? { buttons: input.buttons } : {}),
      ...(input.monitoringInterval ? { monitoring_interval: input.monitoringInterval } : {}),
      ...(input.triggerKeywords?.length ? { trigger_keywords: input.triggerKeywords } : {}),
    },
    timeoutMs: WRITE_TIMEOUT_MS,
    op: "autodm-start",
  });
  if (!data.monitor_id) throw new UploadPostInboxError("provider-error", 502, "Provider monitor missing monitor_id", false);
  return { monitorId: data.monitor_id };
}

export async function autodmStatus(apiKey: string, includeInactive = false): Promise<AutodmMonitor[]> {
  const data = await req<{ monitors?: unknown[] }>({
    apiKey,
    method: "GET",
    path: "/uploadposts/autodms/status",
    query: includeInactive ? { include_inactive: "true" } : {},
    timeoutMs: READ_TIMEOUT_MS,
    op: "autodm-status",
  });
  if (!Array.isArray(data.monitors)) return [];
  return data.monitors.flatMap((m): AutodmMonitor[] => {
    if (!isRecord(m) || typeof m.monitor_id !== "string") return [];
    const stats = isRecord(m.stats)
      ? {
          totalComments: Number(m.stats.total_comments ?? 0),
          newComments: Number(m.stats.new_comments ?? 0),
          successfulReplies: Number(m.stats.successful_replies ?? 0),
          failedReplies: Number(m.stats.failed_replies ?? 0),
        }
      : undefined;
    return [
      {
        monitorId: m.monitor_id,
        postUrl: typeof m.post_url === "string" ? m.post_url : "",
        replyMessage: typeof m.reply_message === "string" ? m.reply_message : "",
        profileUsername: typeof m.profile_username === "string" ? m.profile_username : "",
        monitoringInterval: typeof m.monitoring_interval === "number" ? m.monitoring_interval : undefined,
        isActive: m.is_active === true,
        status: (["running", "paused", "resuming", "stopped", "expired"] as AutodmStatus[]).includes(m.status as AutodmStatus)
          ? (m.status as AutodmStatus)
          : "stopped",
        stats,
        createdAt: typeof m.created_at === "string" ? m.created_at : undefined,
        lastCheck: typeof m.last_check === "string" ? m.last_check : undefined,
      },
    ];
  });
}

export async function autodmLogs(apiKey: string, monitorId: string): Promise<AutodmLog[]> {
  const data = await req<{ logs?: unknown[] }>({
    apiKey,
    method: "GET",
    path: "/uploadposts/autodms/logs",
    query: { monitor_id: monitorId },
    timeoutMs: READ_TIMEOUT_MS,
    op: "autodm-logs",
  });
  if (!Array.isArray(data.logs)) return [];
  return data.logs.flatMap((l): AutodmLog[] => {
    if (!isRecord(l)) return [];
    return [
      {
        type: typeof l.type === "string" ? l.type : "info",
        timestamp: typeof l.timestamp === "string" ? l.timestamp : "",
        message: typeof l.message === "string" ? l.message : "",
      },
    ];
  });
}

async function autodmControl(apiKey: string, action: "pause" | "resume" | "stop" | "delete", monitorId: string): Promise<void> {
  await req<unknown>({
    apiKey,
    method: "POST",
    path: `/uploadposts/autodms/${action}`,
    body: { monitor_id: monitorId },
    timeoutMs: WRITE_TIMEOUT_MS,
    op: `autodm-${action}`,
  });
}

export const autodmPause = (k: string, id: string) => autodmControl(k, "pause", id);
export const autodmResume = (k: string, id: string) => autodmControl(k, "resume", id);
export const autodmStop = (k: string, id: string) => autodmControl(k, "stop", id);
export const autodmDelete = (k: string, id: string) => autodmControl(k, "delete", id);
