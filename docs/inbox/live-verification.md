# Inbox verification log — automated vs live vs unavailable

**Docs verification date:** 2026-09-06 (all endpoints in `capability-matrix.md`
read directly from official Upload-Post docs).

## Automated verification (done, evidence in repo)

- `npx tsc --noEmit` — clean.
- `npx vitest run` — 91 files / 769 tests pass, incl. 42 new Inbox tests with
  sanitized fixtures: idempotency/double-send, claim races, timeout→delivery-unknown,
  429 backoff, scoped identity dedup, DM-window from inbound-only timestamps,
  scoped recipients, role gates, AutoDM validation floors, CSV injection guard.
- `npx eslint` on touched paths — 0 errors.

## Live verification (done)

- None against the provider. No credentials or test recipients were provided,
  so **zero live calls were made** (no reads, no writes). This is deliberate:
  the spec forbids touching real customers as a smoke test.

## Unavailable verification (explicit)

The following are implemented + fixture-tested but **NOT live-verified** and must
not be described as working until checked against a designated test account:

1. `GET /uploadposts/comments` (list + cursor pagination).
2. `POST /uploadposts/comments/public-reply`.
3. `POST /uploadposts/comments/reply` (incl. buttons + 7-day window behavior).
4. `POST /uploadposts/dms/send` + `GET /uploadposts/dms/conversations` (incl. 24h window).
5. `DELETE/POST /uploadposts/comments/delete`.
6. All `/uploadposts/autodms/*` endpoints (start/status/logs/pause/resume/stop/delete,
   2-per-day limit, 15-day expiry).
7. `GET /uploadposts/media` (post discovery for sync).
8. Reconnect flows: TikTok `comments` capability, YouTube `force-ssl` scope,
   Instagram business + Facebook Page linkage detection.

To verify: connect a test Instagram business account (FB Page linked) to a
workspace, run `POST /api/inbox/sync` (read-only), then exercise one public
reply + one DM to an explicitly designated test recipient. Record results here.
