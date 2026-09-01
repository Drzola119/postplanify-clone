# Task: fix-analytics-13-platforms
## Difficulty
medium
## Objective
Fix the dashboard analytics section (`/dashboard/analytics`) so it represents ALL 13
platforms in the app's platform catalog instead of only 9, and so no platform is
silently mislabeled as "bluesky". Today the client `Platform` type in
`src/app/dashboard/analytics/page.tsx` (lines ~22-24) only lists 9 platforms
(youtube, instagram, twitter, tiktok, facebook, threads, linkedin, pinterest,
bluesky), while the app catalog `src/lib/platforms.ts` (PlatformId +
PLATFORMS) has 13 (bluesky, instagram, tiktok, youtube, pinterest, twitter,
linkedin, threads, facebook, discord, telegram, reddit, google_business). The
`toPlatform()` helper (page.tsx ~line 59) coerces any key not in
`PLATFORM_ACCENT` to `"bluesky"` — so Reddit (which IS analytics-supported
upstream, see `src/lib/uploadpost/analytics.ts` SUPPORTED_ANALYTICS_PLATFORMS),
Discord, Telegram, and Google Business accounts all render as Bluesky. Unsupported
platforms (discord, telegram, google_business, bluesky per
`UNSUPPORTED_ANALYTICS_PLATFORMS`) must show the honest "unsupported" state the
existing StatusBadge/status enum already supports (page.tsx lines ~122-136, 820-823).

## Acceptance criteria
- [ ] `Platform` type in `src/app/dashboard/analytics/page.tsx` includes all 13
      catalog platforms: youtube, instagram, twitter, tiktok, facebook, threads,
      linkedin, pinterest, bluesky, reddit, discord, telegram, google_business.
- [ ] `PLATFORM_ACCENT` (page.tsx ~lines 93-103) covers all 13 platforms with a
      distinct color per platform (add sensible brand colors for reddit, discord,
      telegram, google_business).
- [ ] `toPlatform()` no longer coerces unknown/valid-but-missing keys to
      "bluesky"; a platform present in `src/lib/platforms.ts` must map to itself,
      and truly unknown keys must not be silently rendered as bluesky (either
      kept as-is or a neutral fallback that is visibly not a platform).
- [ ] A Reddit account renders as Reddit (its own color/name), not bluesky.
- [ ] Discord, Telegram, and Google Business accounts render with their own
      platform identity; when analytics are not supported for the platform, the
      honest "unsupported" status is shown (not "ok"/fabricated numbers, not
      bluesky).
- [ ] No new lint errors are introduced by this change (`npx eslint` on the
      changed files only — the repo already has pre-existing lint debt elsewhere;
      do not attempt to fix unrelated files).
- [ ] `npx tsc --noEmit` passes.
- [ ] `npx vitest run` passes.
- [ ] REPORT.md written per the Report section.

## Touched files (planned)
- src/app/dashboard/analytics/page.tsx (Primary)
- Possibly src/lib/platforms.ts or a shared platforms helper if the page should
  consume the catalog's 13 instead of a local enum (allowed, but keep the change
  minimal and local to the analytics section)
- Tests for any new helper (e.g. toPlatform mapping) if feasible

## Constraints
- Do NOT touch: src/lib/uploadpost/analytics.ts backend logic (no new upstream
  API support for discord/telegram/google_business/bluesky — out of scope),
  src/app/api/analytics/overview/route.ts behavior, marketing pages/copy, admin
  analytics, other app sections.
- Do NOT run `npm run build` — deferred (disk constraint, see STATUS.md). Gates
  are eslint (changed files), tsc --noEmit, vitest run.
- Do NOT run `npm ci`/`npm install` inside the worktree (node_modules is a
  junction to the main checkout; mutating it breaks other worktrees).
- Keep style consistent with the surrounding file (plain React/Next, minimal
  refactor).

## Verification (must pass before reporting DONE)
- ``npx eslint`` on the changed files only (no NEW errors/warnings vs baseline)
- ``npx tsc --noEmit``
- ``npx vitest run``

## Report
Write your result to REPORT.md in this directory: summary of changes, files
touched, verification output, and status: DONE | BLOCKED | NEEDS_DECISION.