# Inbox n8n Event Contract — v1 (optional integration)

**Status:** canonical. The basic Inbox works with Upload-Post + app backend only;
n8n is optional (notifications, escalation, classification, future client integrations).

## Canonical event names

| Event | Direction | Meaning |
|---|---|---|
| `inbox.comment` | inbound + outbound | New comment / comment reply. Supersedes legacy `inbox.reply` (which never matched the destinations filter and was silently dropped — fixed 2026-09-06) |
| `inbox.message` | inbound + outbound | New DM / DM reply. Supersedes legacy `inbox.dm-reply` (same fix) |

Legacy `inbox.event` webhook subscriptions are still honoured on the inbound
secret lookup for existing installs, but new integrations must subscribe to
`inbox.comment` / `inbox.message`.

## Inbound: n8n → `POST /api/inbox/events`

Auth: `X-Workspace-Webhook-Key` (fallback `X-Webhook-Secret`) vs the workspace's
active webhook secret (timing-safe compare). 64 KB body cap. Workspace must exist —
a typo'd `workspaceId` can never create orphaned docs. An inbound event NEVER
authorizes cross-workspace writes (workspaceId is in the signed body AND the path).

Body (validated by `inboxEventSchema`):

```json
{
  "workspaceId": "ws_123",
  "platform": "instagram",
  "type": "comment",
  "postId": "local-post-id (optional)",
  "conversationId": "local-convo-id (optional, DMs)",
  "externalId": "provider-side id (required, dedup key)",
  "authorHandle": "@user",
  "authorName": "User (optional)",
  "body": "text",
  "sentAt": "2026-09-06T10:00:00+00:00",
  "inReplyToId": "parent id (optional)",
  "direction": "in",
  "metadata": {}
}
```

Dedup: comments upsert by workspace-scoped `identityKey`
(`account:platform:externalId`); messages dedup by `externalId` per conversation.
Replays are safe.

## Outbound: app → n8n destinations (notify/escalate only)

Manual sends go DIRECTLY through the Upload-Post adapter (`/api/inbox/reply`,
`/api/inbox/messages/send`) — never through n8n — so one user action produces
exactly one provider call. n8n receives HMAC-signed notifications
(`X-PostPlanify-Signature`, `X-PostPlanify-Event`, `X-Webhook-Id`, 3 retries)
for escalation/classification workflows only.

No paid n8n features. No embedded customer workflow editor.

## Polling defaults + cost model (spec §8)

Tiers: hot (activity ≤7d) every ~15min · warm (8–30d) every ~2h · cold (>30d) every ~24h.
Per run, per account: 1 media page (≤5 posts) + ≤2 comment pages × 25 per post + 1
conversation snapshot ≈ **≤12 provider calls**.

| Workspace size | Runs/day (≈20% hot, 30% warm, 50% cold) | Provider calls/day | Firestore writes/day (≈ sync-state + upserts) |
|---|---|---|---|
| 10 active posts | ~35 | ~150 | ~300 |
| 100 active posts | ~200 | ~1,200 | ~3,000 |
| 1,000 active posts | ~1,500 | ~9,000 | ~25,000 |

Assumptions: single IG account per workspace; ~5 new comments/day/post; backoff on
429; paused/disconnected accounts cost zero. Browser refresh is manual only.
reads Firestore — zero provider cost per viewer.
