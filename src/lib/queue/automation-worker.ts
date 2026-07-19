import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { listAutoDmCampaigns, recordAutoDmTrigger } from "@/lib/db/automations";
import { generateInboxReply } from "@/lib/ai/groq";
import { analyzeInboxMessage } from "@/lib/ai/inbox-analysis";
import { deliverInboxReply } from "@/lib/webhooks/delivery";
import { createLogger } from "@/lib/log";
import { resolvers } from "@/lib/security/server-config";
import type { AutoDmCampaignItem, AutoDmTrigger } from "@/lib/db/automations";
import type { PlatformId } from "@/lib/db/schema";
import { toInternalPlatform } from "@/lib/platforms";

/**
 * Auto-reply worker. Mirrors queue/worker.ts design (start/stop, runOnce).
 *
 * What it does each tick:
 *   1. For each workspace, load active AutoDM campaigns.
 *   2. Find unreplied inbound comments (and conversations with unreplied
 *      messages) that are not yet analyzed and have no autoRepliedByCampaignId.
 *   3. Run AI analysis (sentiment / intent / topics) on each.
 *   4. For each active campaign whose trigger matches the event and whose
 *      per-author cap allows it, generate a reply (AI or template) and
 *      deliver via n8n (OutboundReplyPayload — see webhooks/delivery.ts).
 *   5. Mark the source comment/message as replied + record campaign stats.
 *
 * n8n workflow expectations (also documented in webhooks/delivery.ts):
 *   Inbound: n8n polls platform API (Twitter mentions, IG comments, etc.),
 *     normalizes to InboxEventPayload, POSTs /api/inbox/events.
 *   Outbound: n8n HTTP Webhook receives OutboundReplyPayload, switches
 *     by platform to the right connector, returns
 *     { "ok": true, "externalReplyId": "..." } on success.
 */

const log = createLogger("automation-worker");

const DEFAULT_INTERVAL_MS = Number(process.env.AUTOMATION_INTERVAL_MS ?? 60_000);
const MAX_EVENTS_PER_TICK = Number(process.env.AUTOMATION_MAX_EVENTS_PER_TICK ?? 50);
const MAX_WORKSPACES_PER_TICK = Number(process.env.AUTOMATION_MAX_WORKSPACES ?? 25);

export interface AutomationTickResult {
  scanned: number;
  analyzed: number;
  matched: number;
  sent: number;
  skipped: number;
  error?: string;
}

let interval: NodeJS.Timeout | null = null;
let running = false;
let lastTickAt: Date | null = null;
let lastResult: AutomationTickResult | null = null;

export async function runAutomationTick(): Promise<AutomationTickResult> {
  const result: AutomationTickResult = { scanned: 0, analyzed: 0, matched: 0, sent: 0, skipped: 0 };
  if (!adminDb) return result;

  let apiKey: string;
  try {
    apiKey = resolvers.groqApiKey(new Headers());
  } catch (err) {
    result.error = err instanceof Error ? err.message : "GROQ_API_KEY missing";
    return result;
  }

  try {
    const workspacesSnap = await adminDb.collection("workspaces").limit(MAX_WORKSPACES_PER_TICK).get();
    for (const wsDoc of workspacesSnap.docs) {
      const workspaceId = wsDoc.id;
      try {
        const r = await processWorkspace(workspaceId, apiKey);
        result.scanned += r.scanned;
        result.analyzed += r.analyzed;
        result.matched += r.matched;
        result.sent += r.sent;
        result.skipped += r.skipped;
      } catch (err) {
        log.warn("workspace tick failed", { workspaceId, err: (err as Error).message });
      }
    }
  } catch (err) {
    log.error("tick failed", { err: (err as Error).message });
    result.error = err instanceof Error ? err.message : "unknown";
  }

  return result;
}

async function processWorkspace(
  workspaceId: string,
  apiKey: string,
): Promise<AutomationTickResult> {
  const r: AutomationTickResult = { scanned: 0, analyzed: 0, matched: 0, sent: 0, skipped: 0 };

  const campaigns = await listAutoDmCampaigns(workspaceId, { status: "active" });
  if (campaigns.items.length === 0) return r;

  // === Comment events ===
  const commentsRef = adminDb!.collection(`workspaces/${workspaceId}/comments`);
  const unrepliedCommentsSnap = await commentsRef
    .where("replied", "==", false)
    .orderBy("sentAt", "asc")
    .limit(MAX_EVENTS_PER_TICK)
    .get();

  for (const cdoc of unrepliedCommentsSnap.docs) {
    r.scanned++;
    const data = cdoc.data() as Record<string, unknown>;
    const platform = data.platform ? toInternalPlatform(data.platform as string) as PlatformId : undefined;
    if (platform) data.platform = platform;
    const body = typeof data.body === "string" ? data.body : "";
    const authorHandle = typeof data.authorHandle === "string" ? data.authorHandle : "";
    const authorName = typeof data.authorName === "string" ? data.authorName : undefined;
    const externalId = typeof data.externalId === "string" ? data.externalId : cdoc.id;
    const postId = typeof data.postId === "string" ? data.postId : undefined;

    // Analysis first (always — even if no campaign matches).
    if (data.analyzed !== true && platform) {
      const analysis = await analyzeInboxMessage(
        { platform, body, authorHandle },
        apiKey,
      );
      if (analysis) {
        await cdoc.ref.update({
          sentiment: analysis.sentiment,
          intent: analysis.intent,
          topics: analysis.topics,
          analyzed: true,
        });
        r.analyzed++;
      }
    }

    // Match campaigns.
    const matching = campaigns.items.filter((c) => campaignMatchesComment(c, data));
    if (matching.length === 0) continue;
    r.matched += matching.length;

    // Author cap: count this campaign's outbound sends to this author in the last 24h.
    for (const c of matching) {
      const cap = c.perAuthorPerDayCap ?? 0;
      if (cap > 0) {
        const sent = await countOutboundToAuthor(workspaceId, c.id, authorHandle, 24);
        if (sent >= cap) {
          r.skipped++;
          await recordAutoDmTrigger(workspaceId, c.id, false);
          continue;
        }
      }

      const replyBody = await generateInboxReply(
        {
          workspaceId,
          platform: platform ?? "twitter",
          authorHandle,
          authorName,
          body,
          campaignName: c.name,
          template: c.template,
        },
        apiKey,
      );

      const results = await deliverInboxReply(workspaceId, {
        workspaceId,
        platform: platform ?? "twitter",
        type: "comment-reply",
        originalExternalId: externalId,
        authorHandle,
        replyBody,
        campaignId: c.id,
        metadata: { postId },
      });
      const ok = results.some((res) => res.success);
      if (ok) {
        await cdoc.ref.update({
          replied: true,
          replyId: `n8n:${c.id}`,
          autoRepliedByCampaignId: c.id,
        });
        r.sent++;
      } else {
        r.skipped++;
      }
      await recordAutoDmTrigger(workspaceId, c.id, ok);
    }
  }

  // === DM events (conversations) ===
  const convRef = adminDb!.collection(`workspaces/${workspaceId}/conversations`);
  const dmCampaigns = campaigns.items.filter((c) => c.trigger.kind === "first-comment");
  if (dmCampaigns.length === 0) return r;

  const convSnap = await convRef.orderBy("lastMessageAt", "desc").limit(MAX_EVENTS_PER_TICK).get();
  for (const convDoc of convSnap.docs) {
    const cdata = convDoc.data() as Record<string, unknown>;
    if (cdata.replied === true) continue;
    const msgsSnap = await convDoc.ref
      .collection("messages")
      .orderBy("sentAt", "desc")
      .limit(1)
      .get();
    if (msgsSnap.empty) continue;
    const lastMsg = msgsSnap.docs[0];
    const mdata = lastMsg.data() as Record<string, unknown>;
    if (mdata.direction !== "in" || mdata.autoRepliedByCampaignId) continue;
    const platform = cdata.platform ? toInternalPlatform(cdata.platform as string) as PlatformId : undefined;
    if (platform) cdata.platform = platform;
    const body = typeof mdata.body === "string" ? mdata.body : "";
    const authorHandle = typeof mdata.fromHandle === "string" ? mdata.fromHandle : "";
    const externalId = typeof mdata.externalId === "string" ? mdata.externalId : lastMsg.id;

    const matching = dmCampaigns.filter((c) => campaignMatchesDm(c, cdata));
    if (matching.length === 0) continue;
    r.matched += matching.length;

    for (const c of matching) {
      const replyBody = await generateInboxReply(
        {
          workspaceId,
          platform: platform ?? "twitter",
          authorHandle,
          body,
          campaignName: c.name,
          template: c.template,
        },
        apiKey,
      );
      const results = await deliverInboxReply(workspaceId, {
        workspaceId,
        platform: platform ?? "twitter",
        type: "dm-reply",
        originalExternalId: externalId,
        authorHandle,
        replyBody,
        campaignId: c.id,
      });
      const ok = results.some((res) => res.success);
      if (ok) {
        await lastMsg.ref.update({ autoRepliedByCampaignId: c.id });
        r.sent++;
      } else {
        r.skipped++;
      }
      await recordAutoDmTrigger(workspaceId, c.id, ok);
    }
  }

  return r;
}

/**
 * Decide whether a comment matches a campaign trigger.
 * - comment-keyword: case-insensitive contains/exact/starts-with on body
 * - first-comment: postId must match (or be undefined → any post)
 * - follow: only matches if metadata.kind === "follow" (not currently produced)
 */
export function campaignMatchesComment(
  campaign: AutoDmCampaignItem,
  data: Record<string, unknown>,
): boolean {
  const p = data.platform ? toInternalPlatform(data.platform as string) as PlatformId : undefined;
  if (!p || !campaign.platforms.includes(p)) return false;
  const trig: AutoDmTrigger = campaign.trigger;
  if (trig.kind === "comment-keyword") {
    const body = typeof data.body === "string" ? data.body : "";
    const kw = trig.keyword.toLowerCase();
    const hay = body.toLowerCase();
    if (trig.match === "exact") return hay.trim() === kw;
    if (trig.match === "starts-with") return hay.trimStart().startsWith(kw);
    return hay.includes(kw);
  }
  if (trig.kind === "first-comment") {
    if (!trig.postId) return true;
    return data.postId === trig.postId;
  }
  if (trig.kind === "follow") {
    return (data.metadata as { kind?: string } | undefined)?.kind === "follow";
  }
  return false;
}

export function campaignMatchesDm(
  campaign: AutoDmCampaignItem,
  conv: Record<string, unknown>,
): boolean {
  const cp = conv.platform ? toInternalPlatform(conv.platform as string) as PlatformId : undefined;
  if (!cp || !campaign.platforms.includes(cp)) return false;
  const trig = campaign.trigger;
  if (trig.kind === "first-comment") {
    if (!trig.postId) return true;
    return conv.postId === trig.postId;
  }
  return false;
}

async function countOutboundToAuthor(
  workspaceId: string,
  campaignId: string,
  authorHandle: string,
  windowHours: number,
): Promise<number> {
  if (!adminDb) return 0;
  const since = Date.now() - windowHours * 3600_000;
  const snap = await adminDb
    .collection(`workspaces/${workspaceId}/comments`)
    .where("autoRepliedByCampaignId", "==", campaignId)
    .where("authorHandle", "==", authorHandle)
    .get();
  let n = 0;
  for (const d of snap.docs) {
    const sentAt = (d.data() as { sentAt?: { seconds?: number } | string | Date }).sentAt;
    const ms = sentAt instanceof Date
      ? sentAt.getTime()
      : typeof sentAt === "string"
        ? new Date(sentAt).getTime()
        : sentAt && typeof sentAt === "object" && "seconds" in sentAt
          ? (sentAt.seconds as number) * 1000
          : 0;
    if (ms >= since) n++;
  }
  return n;
}

export function startAutomationWorker(intervalMs = DEFAULT_INTERVAL_MS): void {
  if (interval) return;
  interval = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      lastTickAt = new Date();
      lastResult = await runAutomationTick();
    } catch (err) {
      log.error(err, { step: "tick" });
      lastResult = { scanned: 0, analyzed: 0, matched: 0, sent: 0, skipped: 0, error: (err as Error).message };
    } finally {
      running = false;
    }
  }, intervalMs);
  interval.unref?.();
  log.info(`started (interval=${intervalMs}ms)`);
}

export function stopAutomationWorker(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

export function getAutomationWorkerStatus(): {
  running: boolean;
  lastTickAt: string | null;
  lastResult: AutomationTickResult | null;
} {
  return {
    running,
    lastTickAt: lastTickAt?.toISOString() ?? null,
    lastResult,
  };
}