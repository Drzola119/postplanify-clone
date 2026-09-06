# Upload-Post and Social Inbox Research

Research date: 2026-09-06

## Executive conclusion

Upload-Post can provide real Inbox functionality, but its interaction API is narrower than its publishing-platform list. The official API explicitly documents comment operations for Instagram, Facebook, YouTube, LinkedIn, and TikTok; direct DMs and comment-triggered private replies are documented for Instagram. Upload-Post supports many more platforms for publishing and analytics, but that does not mean those platforms expose comments or DMs through the Upload-Post API.

The recommended architecture is hybrid:

1. Use Upload-Post directly for supported comment actions, Instagram DMs, and Instagram AutoDM monitors.
2. Use n8n as the orchestration layer for ingestion, normalization, retries, approvals, CRM actions, and platforms/features not exposed by Upload-Post.
3. Persist provider IDs and delivery states in PostPlanify so a local “sent” state is only shown after the provider confirms delivery.

## Official documentation findings

- Upload-Post lists 22 supported publishing/business platforms, but describes interaction support as narrower: comments for Instagram, Facebook, YouTube, LinkedIn, and TikTok; DMs currently Instagram-only.
- The API reference documents comment list/create/delete/action endpoints for Instagram, Facebook, YouTube, LinkedIn, and TikTok.
- Instagram has separate public comment replies, private comment-to-DM replies, direct DM send, conversation retrieval, and AutoDM monitor endpoints.
- Instagram private replies generally have a seven-day window; direct messaging requires the recipient's platform user ID and the recipient must have messaged the account first, subject to Instagram's messaging window.
- AutoDM monitors run as provider-managed background monitors. The documented limits include two new monitors per profile per day, automatic expiry after 15 days, and daily DM limits that vary by plan.
- Upload-Post analytics cover Instagram, TikTok, LinkedIn, Facebook, X, YouTube, Threads, Pinterest, and Reddit. Audience insights are currently documented for TikTok only.

## Capability matrix

| Platform | Upload-Post Inbox capability documented | Practical PostPlanify use |
|---|---|---|
| Instagram | Read comments, public replies, private comment replies, send/read DMs, AutoDM | Full Inbox integration through a server-side Upload-Post adapter |
| Facebook | Comment operations | Comment queue/reply; no Upload-Post DM endpoint documented |
| YouTube | Comment operations | Comment queue/reply; no Upload-Post DM endpoint documented |
| LinkedIn | Comment operations | Comment queue/reply; no Upload-Post DM endpoint documented |
| TikTok | Comment operations, subject to account capability/reconnect requirements | Comment queue/reply; no Upload-Post DM endpoint documented |
| X, Threads, Pinterest, Reddit, Bluesky | Publishing/analytics support; no Inbox comment/DM endpoint explicitly documented in the API reference | Use n8n/native APIs where available; mark Upload-Post Inbox actions unsupported |
| Discord, Telegram, Google Business and other publishing channels | Publishing/business integrations; no Upload-Post comment/DM Inbox endpoint explicitly documented | Use native APIs or n8n workflows and ingest normalized events into PostPlanify |

“First comment” on a publishing request is not the same feature as reading and replying to later comments. It should not be used as proof that a platform has a full Inbox integration.

## Current PostPlanify implementation findings

The current Inbox is not fully live end-to-end:

1. The page contains a hard-coded sample comment and keeps it when an API request returns no rows or fails. This can make an empty or unavailable Inbox look populated.
2. The UI reads and writes Firestore Inbox records, but there is no direct Upload-Post comment/DM adapter in `src/lib/uploadpost`.
3. Comment replies are persisted locally and a webhook is fired without waiting for provider confirmation. The manual reply event/payload does not match the richer `inbox.reply` contract expected by the documented n8n delivery path.
4. Message sending currently creates a local outbound message; it does not call Upload-Post or a platform API.
5. The Inbox platform list contains nine platforms and is not aligned with the broader platform list used elsewhere in the product.
6. Sentiment analysis updates local UI state but is not persisted.
7. The n8n/event route is a useful ingestion boundary: it accepts normalized comment/DM events and stores them in Firestore. It does not itself prove that Upload-Post is connected.
8. The visible Firestore quota warning is a real error path. Quota exhaustion can prevent reads and expose the seeded sample instead of live data.

The Inbox route and database tests pass, but those tests mock external providers and therefore do not prove live Upload-Post or n8n delivery.

## Recommended system design

### Provider adapter

Create a server-only Upload-Post Inbox adapter with methods such as:

- `listComments`
- `replyPublic`
- `replyPrivate`
- `listDmConversations`
- `sendDm`
- `startAutoDm`, `getAutoDmStatus`, `getAutoDmLogs`, `pauseAutoDm`, `resumeAutoDm`, `stopAutoDm`
- `getProviderHealthAndCapabilities`

Store `providerMessageId`, `providerCommentId`, `deliveryStatus`, `lastProviderError`, and `syncedAt` for every external operation.

### Inbound flow

Use direct Upload-Post polling or provider-supported callbacks for the five documented comment platforms and Instagram DMs. Use n8n for platforms requiring native APIs or scheduled polling. n8n should normalize events to `/api/inbox/events`, authenticate with a workspace-specific secret, and include an idempotent `externalId`.

### Outbound flow

The user action should create a `pending` operation. A provider adapter or n8n workflow performs the external send. Only a confirmed provider response changes it to `sent`; failures remain visible with retry information. This prevents the current local-only “reply sent” illusion.

### UI behavior

- Remove seeded sample data from production behavior; show an explicit empty/error state.
- Show a capability badge per connected account: comments, public reply, private reply, DMs, AutoDM, analytics.
- Disable unsupported controls instead of presenting them as if they work.
- Add a “last synchronized”, “source”, and “provider status” indicator.
- Persist sentiment and expose pagination/cursors.
- Add AutoDM lifecycle controls and display provider limits/expiry.

## Sources

- https://docs.upload-post.com/introduction/
- https://docs.upload-post.com/api/reference/
- https://docs.upload-post.com/api/instagram-comments/
- https://docs.upload-post.com/api/instagram-dms/
- https://docs.upload-post.com/api/autodms/
- https://docs.upload-post.com/api/audience/
- https://www.upload-post.com/platforms/
