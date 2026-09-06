# PostPlanify Inbox — Verified Upload-Post Capability Matrix

**Verification date:** 2026-09-06
**Source:** official Upload-Post docs (read directly, following links to endpoint pages).
**Account used for doc verification:** docs only — no live calls were made during this pass.
Capabilities below marked **documented** come from the pages listed; capabilities marked
**live-verified** require a connected workspace account and are tracked separately in
`docs/inbox/live-verification.md`.

Base URL for all endpoints: `https://api.upload-post.com/api`
Auth for all endpoints: `Authorization: Apikey <UPLOAD_POST_API_KEY>` (server only).

---

## 1. Comments (shared endpoint, all platforms)

Source: https://docs.upload-post.com/api/comments/ (verified 2026-09-06)

| Operation | Endpoint + method | Platforms | Account type / perms | Required identifiers / fields | Pagination | Limits / policy | Notes |
|---|---|---|---|---|---|---|---|
| List comments (top-level) | `GET /api/uploadposts/comments` | instagram, facebook, youtube, linkedin, tiktok | Connected account; TikTok needs `comments` capability (reconnected account); YouTube needs `youtube.force-ssl` scope (reconnect older connections) | `user` (profile username) + exactly one of `post_id` / `post_url`. IDs: IG numeric media ID; TikTok video id; YouTube video ID; LinkedIn post URN (`urn:li:ugcPost:…`). Optional `platform` (defaults `instagram`), `limit`, `after`, `comment_id` | `limit` + `after` cursor; `pagination: {next_cursor, has_next}`. Comment fields vary by platform | Global API rate limits (plan-scaled); TikTok new comments take ~10s to index (empty list right after write ≠ failure) | Unsupported network answers `400 {error_code:"platform_not_supported"}` naming supporters. TikTok stale connection answers `400 {error_code:"tiktok_reconnect_required"}`; expired TikTok token answers `409 {reauth_required:true}` |
| List replies under a comment | `GET /api/uploadposts/comments` + `comment_id` | tiktok (documented) | Same as above | `post_id` still required + `comment_id` | Same as above | Same as above | Same endpoint narrowed to a parent — not a different URL |
| Create top-level comment | `POST /api/uploadposts/comments/create` | facebook, youtube, linkedin, tiktok | Connected account; same reconnect rules | `platform`, `user`, `message` + exactly one of `comment_id` / `post_id` / `post_url`. TikTok: `post_id` always required (reply = `post_id` + `comment_id`); only own videos | n/a (write) | Same reconnect/reauth errors; `403` when scope missing | **Instagram does NOT support top-level creation — `comment_id` required (reply-only).** TikTok response shape differs: `{success, platform:"tiktok", result:{comment_id}}`; others `{success, id}` |
| Reply publicly to a comment | `POST /api/uploadposts/comments/create` (with `comment_id`) | facebook, youtube, linkedin, tiktok (+ instagram via dedicated endpoint below) | Same as above | Same as above | n/a | Same as above | Instagram public replies use the dedicated `/comments/public-reply` endpoint instead |
| Delete own comment | `DELETE /api/uploadposts/comments/delete` (also accepts `POST`) | instagram, facebook, youtube, linkedin, tiktok | Must own comment or own the post; LinkedIn additionally requires `post_id` (post URN) | `platform`, `user`, `comment_id` (+ `post_id` for LinkedIn). TikTok deletes by `comment_id` alone, only comments written by the connected account | n/a | `403` when not owner / scope missing | Ownership restriction enforced upstream |
| Hide / unhide / like / unlike / pin / unpin | `POST /api/uploadposts/comments/action` | **tiktok only** — anything else answers `400 {error_code:"platform_not_supported"}` | Connected TikTok account with `comments` capability | `platform`, `user`, `comment_id`, `action` ∈ {hide,unhide,like,unlike,pin,unpin}. `post_id` required for hide/unhide/pin/unpin; must NOT send it for like/unlike | n/a | Only own posts; pin is exclusive (second pin moves it); hidden comment stays visible to its author (TikTok behaviour) | One verb per call, each carrying its own inverse — replaying never flips state |

## 2. Instagram comments (dedicated endpoints)

Source: https://docs.upload-post.com/api/instagram-comments/ (verified 2026-09-06)

| Operation | Endpoint + method | Account type / perms | Required identifiers / fields | Pagination | Limits / policy |
|---|---|---|---|---|---|
| List IG comments | `GET /api/uploadposts/comments?platform=instagram` | `instagram_business_manage_comments`; comment must be on own post | `user` + `post_id` (numeric media ID) or `post_url`. Optional `limit` 1–50 (Meta hard cap, default ~25), `after` cursor | Meta newest-first, fixed order; `pagination: {next_cursor, has_next}` | Global plan-scaled rate limits; `post_url` resolved by scanning own recent posts (cached); post must belong to the account |
| Private reply to commenter (DM) | `POST /api/uploadposts/comments/reply` | Same as above | `platform`, `user`, `comment_id`, `message`. Optional `buttons`: ≤3 `{title (≤20 chars), url (http/https)}` web_url buttons | n/a | **7-day window**: only comments <7 days old. Daily DM limit → `429`. Response `{success, recipient_id, message_id}` — keep `recipient_id` as the scoped DM recipient |
| Public reply to comment | `POST /api/uploadposts/comments/public-reply` | Same as above | `platform`, `user`, `comment_id`, `message` (no buttons documented) | n/a | No 7-day restriction documented for public replies. Daily limit → `429` (message text says "Daily DM limit exceeded"). Response `{success, id}` |
| Instagram login flow requiring a Facebook Page | Connect via hosted page / OAuth; Instagram business/creator accounts are linked through Facebook. Facebook Page listing: `GET /api/uploadposts/facebook/pages?profile=` (source: user-profiles docs). IG messaging/Private Replies require the business account + Page linkage — ineligible accounts surface as `permission-required`, never as silent empty lists | | | | |

## 3. Instagram DMs

Source: https://docs.upload-post.com/api/instagram-dms/ (verified 2026-09-06)

| Operation | Endpoint + method | Account type / perms | Required identifiers / fields | Pagination | Limits / policy |
|---|---|---|---|---|---|
| Send DM | `POST /api/uploadposts/dms/send` | `instagram_business_manage_messages` | `platform`, `user`, `recipient_id` (platform user ID — from conversations participants or comment `user.id`; **never a free-typed username**), `message`. Optional `buttons` (same shape as private reply) | n/a | **24-hour window**: recipient must have messaged the account first. Daily DM limit → `429`. Response `{success, recipient_id, message_id}` |
| List conversations | `GET /api/uploadposts/dms/conversations?platform=instagram&user=` | Same as above | `platform`, `user` | No pagination documented — treat as bounded snapshot (no cursor params) | Same window/limits; each conversation carries `participants.data[]` + recent `messages.data[]` |
| Private-reply vs DM distinction | `/comments/reply` takes `comment_id` (reply to engagement); `/dms/send` takes `recipient_id` (support/follow-up). A private reply does NOT authorize unrestricted follow-ups — follow-ups obey the 24h window | | | | |

## 4. AutoDM monitors (provider-managed, Instagram only)

Source: https://docs.upload-post.com/api/autodms/ (verified 2026-09-06)

| Operation | Endpoint + method | Required fields | Limits / policy |
|---|---|---|---|
| Start monitor | `POST /api/uploadposts/autodms/start` | `post_url`, `reply_message`, `profile_username` (IG connected). Optional `buttons`, `monitoring_interval` (min, default 15, minimum 15), `trigger_keywords` (string or string[], case-/accent-insensitive; omitted = all commenters) | **2 new monitors per profile per day** (creation rate, not simultaneous cap). No duplicate active monitor per post. **Auto-expires after 15 days.** Daily DM caps: Free 10/day, Paid 500/day (monitor pauses, resumes next day). Meta: 200 DMs/hour/account (built-in delays) |
| Status | `GET /api/uploadposts/autodms/status[?include_inactive=true]` | — (default active `running`/`paused`; `include_inactive=true` adds `stopped`/`expired`; deleted always excluded) | Statuses: `running`, `paused`, `resuming` (DB-active but thread restarted), `stopped`, `expired`. Response includes `stats {total_comments, new_comments, successful_replies, failed_replies}`, `created_at/last_check/paused_at/stopped_at/stop_reason`, `total_active` (running+paused+resuming) + `total` |
| Logs | `GET /api/uploadposts/autodms/logs?monitor_id=` | `monitor_id` | Returns `{logs[] {type, timestamp, message}, monitor_info}` |
| Pause / resume / stop / delete | `POST /api/uploadposts/autodms/{pause,resume,stop,delete}` | `{monitor_id}` | Stop preserves data; delete is permanent (`404` when not owned). **No auto-recreate on expiry** — renewal is an explicit new `start` |
| Guarantees | Instagram only (Meta Private Replies API). One DM per comment (duplicates prevented). 7-day comment window. Own-account comments ignored | | |

## 5. Media discovery (bounded, for post linkage)

Source: https://docs.upload-post.com/api/instagram-media/ (verified 2026-09-06)

`GET /api/uploadposts/media?platform=&user=[&limit][&cursor][&page_urn for LinkedIn]`.
Platforms: instagram, tiktok, youtube, linkedin, facebook, x, threads, pinterest, bluesky, reddit.
`limit` default 25, clamp 1–100, then per-platform caps (TikTok 20, YouTube 50).
Cursor supported everywhere **except LinkedIn, Discord, Telegram** (passing `cursor` there = `400`).
Use for bounded external-post discovery (post selectors, ID resolution). **Never match posts by caption/title.**

## 6. Profiles, capabilities, rauth

Source: https://docs.upload-post.com/api/user-profiles/ (verified 2026-09-06)

- Profile = `username` (we use workspaceId). `POST /users`, `GET /users`, `GET /users/{username}`, `DELETE /users`.
- `social_accounts.<platform>` objects may carry `capabilities[]` (open list; today TikTok reports `comments`, `trend_search`, …) and `reauth_required: true` when the token expired.
- **Check `capabilities` before showing a TikTok inbox; check `reauth_required` before counting a platform as connected.**
- JWT connect page (`POST /users/generate-jwt`) supports platform allow-lists; manual-credential connections exist for Discord (webhook URL) and Telegram (bot token) — inbox V1 does not use them.

## 7. Webhooks (inbound)

Source: https://docs.upload-post.com/api/reference/ → Webhooks section (verified 2026-09-06)

- Documented webhooks cover **upload results and social-account connection changes** (`GET/POST/DELETE /api/uploadposts/users/notifications`, profile webhooks, HMAC `X-Upload-Post-Signature`).
- **No inbound comment/DM webhook is documented.** Consequence: the Inbox MUST use adaptive polling for reads (spec §8). n8n remains optional for notifications/escalation only.

## 8. First-comment support

- First-comment publishing is an **upload-time** field (`first_comment` / per-platform `{platform}_first_comment`), already implemented in `src/lib/uploadpost/publisher.ts` and kept as a separate Create-Post feature. TikTok `first_comment` additionally needs the `comments` capability (otherwise the post succeeds with a `warnings[]` entry and the comment is skipped). Not part of the Inbox read/reply path.

## 9. Uncertainties (conservative choices taken)

1. Comment-list `limit` range for the shared endpoint is undocumented (only the IG page states 1–50) — adapter defaults to 25 and honours provider echoes.
2. DM conversation history depth / message pagination is undocumented — adapter treats the response as a bounded snapshot and notes coverage explicitly in the UI ("recent conversations").
3. Exact global rate-limit numbers are plan-scaled and undocumented — adapter classifies `429` uniformly, backs off with jitter, and the sync worker stays conservative.
4. YouTube `youtube.force-ssl` and TikTok `comments` capability are per-connection — effective support is computed per connected account at runtime, not assumed from docs.
