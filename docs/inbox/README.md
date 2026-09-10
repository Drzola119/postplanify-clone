# PostPlanify Social Inbox V1 — Architecture + Handoff

**Scope (grilled + locked):** Instagram-only · full durable outbound lifecycle ·
conservative adaptive sync · AutoDM deferred-prepared · AI drafts-only ·
Insights removed · live provider verification still pending.

## Architecture

```
Browser (manual refresh only; no background Firestore polling)
   │  GET comments/messages/capabilities/sync   POST reply / dm-send / sync / draft
   ▼
API routes (role-gated: viewer read · editor send · admin monitors/export)
   ├── /api/inbox/reply            durable public/private reply via op
   ├── /api/inbox/messages/send    durable DM via op (scoped recipient)
   ├── /api/inbox/comments/[id]    persist labels/sentiment/resolution (manual provenance)
   ├── /api/inbox/comments/[id]/delete  provider-confirmed own-comment delete
   ├── /api/inbox/sync             throttled bounded provider scan + last-sync state
   ├── /api/inbox/capabilities     effective per-operation support matrix
   ├── /api/inbox/draft            human-reviewed AI drafts (capped, untrusted input quoted)
   └── /api/inbox/autodm[ /[id] ]  provider monitors (admin, explicit opt-in)
   ▼
Server libs
   ├── src/lib/uploadpost/inbox.ts  typed adapter, verified endpoints only, 20s reads / 30s writes
   ├── src/lib/inbox/capabilities.ts  provider docs × account × role × resource eligibility
   ├── src/lib/inbox/sync.ts        bounded scan (≤12 provider calls/run/account)
   ├── src/lib/db/inbox-ops.ts      pending→processing→sent (+failed/cancelled/delivery-unknown)
   ├── src/lib/db/inbox-sync.ts     hot/warm/cold tiers, claimDue, backoff
   └── src/lib/auth/workspace-role.ts  server-side viewer<editor<admin
   ▼
Firestore (existing collections preserved, never deleted)
   workspaces/{ws}/comments · conversations/{id}/messages (extended, identityKey-scoped)
   + outboundOps (idempotencyKey) · inboxSync (nextRunAt) · inboxAutodm · aiUsage/{month}
```

**One authoritative send path:** manual sends go DIRECTLY through the Upload-Post
adapter. n8n receives signed `inbox.comment` / `inbox.message` notifications for
escalation only (see `events-v1.md`). No double-send via automation workers.

**Key files:** capability matrix `capability-matrix.md` · event contract `events-v1.md` ·
verification log `live-verification.md`.

## Required configuration + migration (safe, additive)

1. Env (existing, no new secrets): `UPLOAD_POST_API_KEY`, Firebase Admin, `GROQ_API_KEY` (drafts only).
2. Deploy Firestore rules + indexes: `firebase deploy --only firestore` (new: `outboundOps`,
   `inboxSync`, `inboxAutodm`, `aiUsage` rules; 10 new composite indexes incl.
   `comments(identityKey)`, `outboundOps(idempotencyKey)`, `inboxSync(nextRunAt)`).
3. Existing `comments`/`conversations` docs are adopted lazily: identityKey/accountKey
   backfilled on next ingest/sync; no deletion, no downtime.
4. AutoDM stays disabled until an admin sets `workspaces/{ws}.settings.inboxAutodmEnabled=true`.
5. No cron/vendor additions. The existing queue worker now runs a capped,
   error-isolated `runInboxSyncTick()`; manual `POST /api/inbox/sync` coalesces
   against the same durable `inboxSync` claim.

## Ecosystem links (spec §14)

Connections (health/reconnect via existing `social-accounts/list` cache) ·
Create Post first-comment untouched (separate upload-time feature) ·
Queue/Calendar: only published platform results are eligible sync sources ·
History: threads link via stable `externalPostId` + `postPermalink` (never captions) ·
Analytics: provider counts stay separate from local Inbox records ·
Reports: export covers loaded authorized records only ·
Command Center: sync failures surface via `inboxSync.lastError`; delivery failures via
`outboundOps(error)` · Notifications: throttled digest only.

## Tests (42 new + 10 rewritten/updated)

`tests/inbox/{capabilities,outbound-ops,sync-state,adapter,roles-and-validation,reply-route}.test.ts`,
updated `tests/api/inbox-{routes,messages-send,comment-id}.test.ts`.
Full suite: **91 files / 772 tests pass** · `tsc --noEmit` clean · Inbox-touched
paths lint clean. Repository-wide lint still contains pre-existing errors outside
Inbox and is not a valid release gate until separately remediated.

## Remaining provider limitations (honest)

- No inbound comment/DM webhooks exist upstream → polling only (see matrix §7).
- IG top-level comment creation is API-impossible (reply-only).
- Hide/like/pin is TikTok-only upstream → no V1 buttons.
- DM history has no documented pagination → bounded snapshot, coverage labeled.
- Global rate limits are plan-scaled and undocumented → 429 backoff + conservative defaults.
- TikTok/YouTube/LinkedIn/FB comment APIs are documented but out of V1 scope → shown as
  `not-yet-verified`, never with send buttons.
