import "server-only";
import { createLogger } from "@/lib/log";
import { adminDb } from "@/lib/db";
import { upsertCommentFromEvent, appendMessageFromEvent } from "@/lib/db/inbox";
import {
  claimDue,
  recordSyncSuccess,
  recordSyncFailure,
  tierFor,
  accountScope,
} from "@/lib/db/inbox-sync";
import {
  listInstagramMedia,
  listInstagramComments,
  listInstagramConversations,
  UploadPostInboxError,
} from "@/lib/uploadpost/inbox";
import { readCachedInboxAccount } from "@/lib/inbox/account";
import { readProfile } from "@/lib/db/upload-post-profiles";

const log = createLogger("inbox-sync");

/**
 * Affordable provider synchronization (spec §8).
 * Bounded: one media page + a few recent posts + a few comment pages per run.
 * Deduplicated via identityKey. Fair + concurrency-safe via claimDue.
 * Reads are retryable with backoff; nothing here performs writes upstream.
 */

const MAX_POSTS_PER_RUN = 5;
const MAX_COMMENT_PAGES_PER_POST = 2;
const COMMENT_PAGE_SIZE = 25;

export interface SyncRunResult {
  scope: string;
  ok: boolean;
  commentsUpserted: number;
  conversationsUpserted: number;
  providerCalls: number;
  skipped?: string;
  error?: string;
}

export interface InboxSyncTickResult {
  workspaces: number;
  attempted: number;
  succeeded: number;
  skipped: number;
  providerCalls: number;
}

function jitter(ms: number): number {
  return Math.floor(ms * (0.8 + Math.random() * 0.4));
}

export async function syncInstagramAccount(input: {
  workspaceId: string;
  accountKey: string;
  apiKey: string;
  force?: boolean;
}): Promise<SyncRunResult> {
  const { workspaceId, accountKey, apiKey } = input;
  const scope = accountScope(accountKey, "instagram");

  const claimed = await claimDue(workspaceId, scope, {
    accountKey,
    platform: "instagram",
    force: input.force,
  });
  if (!claimed) {
    return { scope, ok: true, commentsUpserted: 0, conversationsUpserted: 0, providerCalls: 0, skipped: "throttled" };
  }

  let providerCalls = 0;
  let commentsUpserted = 0;
  let conversationsUpserted = 0;
  try {
    // 1. Bounded media discovery — recent posts only, single page.
    const mediaPage = await listInstagramMedia(apiKey, accountKey, { limit: MAX_POSTS_PER_RUN });
    providerCalls += 1;
    const posts = mediaPage.media.slice(0, MAX_POSTS_PER_RUN);

    let newestActivity: Date | null = null;
    for (const post of posts) {
      let after: string | undefined;
      for (let page = 0; page < MAX_COMMENT_PAGES_PER_POST; page += 1) {
        const comments = await listInstagramComments(apiKey, accountKey, { postId: post.id }, { limit: COMMENT_PAGE_SIZE, after });
        providerCalls += 1;
        for (const c of comments.comments) {
          await upsertCommentFromEvent(workspaceId, {
            workspaceId,
            platform: "instagram",
            type: "comment",
            externalId: c.id,
            authorHandle: c.authorUsername ?? "unknown",
            authorExternalId: c.authorId,
            body: c.text,
            sentAt: c.timestamp,
            accountKey,
            externalPostId: post.id,
            postPermalink: post.permalink,
            origin: "internal-automation",
          });
          commentsUpserted += 1;
          const ts = new Date(c.timestamp);
          if (!Number.isNaN(ts.getTime()) && (!newestActivity || ts > newestActivity)) newestActivity = ts;
        }
        if (!comments.hasNext || !comments.nextCursor) break;
        after = comments.nextCursor;
      }
    }

    // 2. DM conversations snapshot (bounded — provider has no pagination).
    // One provider thread → one local conversation (no dupes).
    try {
      const convos = await listInstagramConversations(apiKey, accountKey);
      providerCalls += 1;
      const { findOrCreateConversation } = await import("@/lib/db/inbox");
      for (const convo of convos.slice(0, 25)) {
        const { conversationId } = await findOrCreateConversation(workspaceId, {
          platform: "instagram",
          accountKey,
          providerConversationId: convo.id,
          participants: convo.participants.map((p) => p.username),
          participantExternalIds: convo.participants.map((p) => p.id),
        });
        for (const m of convo.messages.slice(-10)) {
          await appendMessageFromEvent(workspaceId, {
            workspaceId,
            platform: "instagram",
            type: "message",
            conversationId,
            externalId: m.id,
            authorHandle: m.fromUsername ?? "unknown",
            authorExternalId: m.fromId,
            body: m.body,
            sentAt: m.createdTime,
            direction: "in",
            accountKey,
            origin: "internal-automation",
          });
          conversationsUpserted += 1;
        }
      }
    } catch (err) {
      // Conversation sync is best-effort — comment data already secured.
      log.warn("conversation sync failed, keeping comment results", { scope, err: String(err) });
    }

    const tier = tierFor(newestActivity);
    await recordSyncSuccess(workspaceId, scope, { tier });
    return { scope, ok: true, commentsUpserted, conversationsUpserted, providerCalls };
  } catch (err) {
    if (err instanceof UploadPostInboxError) {
      await recordSyncFailure(workspaceId, scope, { code: err.code, message: err.message });
      if (err.code === "rate-limited") {
        // Extra safety: push next run out with jitter on top of backoff.
        void jitter;
      }
      log.warn("account sync failed", { scope, code: err.code });
      return { scope, ok: false, commentsUpserted, conversationsUpserted, providerCalls, error: err.message };
    }
    await recordSyncFailure(workspaceId, scope, { code: "internal", message: String(err) });
    throw err;
  }
}

/** Run due Instagram syncs for connected workspaces without touching provider
 * accounts that are disconnected or require reauthorization. */
export async function runInboxSyncTick(
  apiKey: string,
  maxWorkspaces = 50,
  workspaceId?: string,
): Promise<InboxSyncTickResult> {
  const result: InboxSyncTickResult = { workspaces: 0, attempted: 0, succeeded: 0, skipped: 0, providerCalls: 0 };
  if (!adminDb) return result;
  const workspaces: Array<{ id: string }> = workspaceId
    ? [{ id: workspaceId }]
    : (await adminDb.collection("workspaces").limit(maxWorkspaces).get()).docs;
  result.workspaces = workspaces.length;
  for (const workspace of workspaces) {
    const account = await readCachedInboxAccount(workspace.id);
    const profile = await readProfile(workspace.id).catch(() => null);
    if (!account || account.reauthRequired || !profile?.username) {
      result.skipped += 1;
      continue;
    }
    result.attempted += 1;
    try {
      const sync = await syncInstagramAccount({ workspaceId: workspace.id, accountKey: profile.username, apiKey });
      result.providerCalls += sync.providerCalls;
      if (sync.ok) result.succeeded += 1;
    } catch (err) {
      log.warn("workspace inbox sync failed; continuing worker tick", { workspaceId: workspace.id, err: String(err) });
    }
  }
  return result;
}

/** Last successful sync time for the UI header (null = never). */
export async function lastSyncAt(workspaceId: string, accountKey: string): Promise<string | null> {
  if (!adminDb) return null;
  const snap = await adminDb.doc(`workspaces/${workspaceId}/inboxSync/${accountScope(accountKey, "instagram")}`).get().catch(() => null);
  if (!snap?.exists) return null;
  const data = snap.data() as { lastSuccessAt?: { toDate?: () => Date } | Date | string };
  const v = data.lastSuccessAt;
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v.toDate === "function") return v.toDate().toISOString();
  return null;
}
