# Trustiify — Real-Time & Functional Audit

**Date:** 2026-07-15
**Source:** direct read of `C:\Users\zicko\Desktop\postplanify-clone-clean`
**Goal:** make every dashboard page render real-time data and every action perform a real backend call.

---

## Tier 1 — Analytics (broken in 6 places)

| # | File:line | Issue | Fix |
|---|---|---|---|
| 1 | [src/lib/db/analytics.ts:64](src/lib/db/analytics.ts#L64) | `followers: Math.max(acc.followers, p.followers)` — picks the largest platform's followers instead of summing. | Change to `acc.followers + p.followers`. |
| 2 | [src/lib/db/analytics.ts:67-71](src/lib/db/analytics.ts#L67-L71) | `totals.likes/comments/shares/clicks` always 0 — never aggregated. | Sum from each platform's series. |
| 3 | [src/lib/db/analytics.ts:84](src/lib/db/analytics.ts#L84) | `totals.engagementRate` divides by `byPlatform.length` even when series is empty. | Guard `byPlatform.length > 0`. |
| 4 | [src/app/dashboard/analytics/page.tsx:55-78](src/app/dashboard/analytics/page.tsx#L55-L78) | `MOCK_ACCOUNTS` fallback ships 9 hardcoded accounts. | Keep only as last-ditch fallback; prefer real API. (Already done — accounts state replaced when API responds.) |
| 5 | [src/app/dashboard/analytics/page.tsx:574-841](src/app/dashboard/analytics/page.tsx#L574-L841) | `PLATFORM_ANALYTICS` hardcoded config — 267 lines of fake numbers used in `PerAccountView`. | Replace with real API call to new `/api/analytics/account/[id]`. |
| 6 | [src/app/dashboard/analytics/page.tsx:1140-1147](src/app/dashboard/analytics/page.tsx#L1140-L1147) | "Sync Now" button has no `onClick`. | Wire to refetch the current account's data. |

---

## Tier 2 — Queue & worker

| # | File:line | Issue | Fix |
|---|---|---|---|
| 7 | [src/lib/queue/worker.ts:60](src/lib/queue/worker.ts#L60) | `uploadPostUsername: process.env.UPLOAD_POST_DEFAULT_USERNAME ?? "trustiify_test"` — uses one shared username for all workspaces. | Resolve per-workspace via `ensureProfile(workspaceId, apiKey)`. |

---

## Tier 3 — Social-accounts list

| # | File:line | Issue | Fix |
|---|---|---|---|
| 8 | [src/app/api/social-accounts/list/route.ts:65-75](src/app/api/social-accounts/list/route.ts#L65-L75) | `SUPPORTED` array only contains 9 platforms; missing `google_business`, `reddit`, `discord`, `telegram`. | Add the 4 missing platforms. |

---

## Tier 4 — History page retry

| # | File:line | Issue | Fix |
|---|---|---|---|
| 9 | [src/app/dashboard/posts/history/page.tsx:195](src/app/dashboard/posts/history/page.tsx#L195) | `window.alert("Retry from history is wiring up next. Use the Posting Queue for now.")` | Call new `POST /api/posts/[id]/retry` that re-claims the post. |

---

## Tier 5 — Accounts page delete

| # | File:line | Issue | Fix |
|---|---|---|---|
| 10 | [src/app/dashboard/accounts/page.tsx:649](src/app/dashboard/accounts/page.tsx#L649) | `handleDeleteConfirm` only removes from local state. | Call `DELETE /api/social-accounts/[id]`. |

---

## Tier 6 — Settings/brands/reports setTimeout simulations

| # | File:line | Issue | Fix |
|---|---|---|---|
| 11 | [src/app/dashboard/settings/page.tsx:120-739](src/app/dashboard/settings/page.tsx#L120) | handleSave/Upload/RemovePhoto/Password all `setTimeout(800)` | Wire to real API endpoints (already in place; just need real `onClick` handlers). |
| 12 | [src/app/dashboard/brands/page.tsx:592](src/app/dashboard/brands/page.tsx#L592) | DeleteWorkspaceModal `setTimeout(600)` | Call `DELETE /api/brands/[id]`. |
| 13 | [src/app/dashboard/brands/page.tsx:WorkspaceFormModal](src/app/dashboard/brands/page.tsx) | Invite `e.preventDefault()` without send | Call `POST /api/brands/invites`. |
| 14 | [src/app/dashboard/reports/page.tsx:68,100,113](src/app/dashboard/reports/page.tsx#L68) | `SAMPLE_ACCOUNTS/REPORTS/SCHEDULES` | Already had real flow in handleGenerate; remove sample fallbacks once API returns 0 rows. |

---

## Tier 7 — UI/UX issues

| # | File:line | Issue | Fix |
|---|---|---|---|
| 15 | [src/app/dashboard/analytics/page.tsx:905](src/app/dashboard/analytics/page.tsx#L905) | `const dates = ["Jul 7", "Jul 7", "Jul 7", "Jul 8", "Jul 8"]` | Replace with dynamic dates from period. |
| 16 | [src/app/dashboard/analytics/page.tsx:114-119](src/app/dashboard/analytics/page.tsx#L114-L119) | `adaptAccount` hardcodes LinkedIn `isError` and Threads `contentTypes` | Derive from real data. |
| 17 | [src/app/dashboard/posts/page.tsx:167](src/app/dashboard/posts/page.tsx#L167) | `SAMPLE_POSTS` fallback | Real API only. |

---

## Out of scope (already done or non-blocking)

- Per-platform caption cards (composer) — already real.
- Queue worker (replaced from the 15s setInterval that lost claims) — already real.
- `writeCache` and `readCache` for accounts — already real.
- Most `console.*` in `src/lib/log.ts` — already migrated to logger.

---

## Repair order (dependency-sorted)

1. Fix `getOverview` Math.max + missing aggregates.
2. Add `/api/analytics/account/[id]` endpoint.
3. Update `PerAccountView` to consume that endpoint.
4. Wire Sync Now button.
5. Fix queue worker per-workspace profile.
6. Add missing platforms to SUPPORTED.
7. Add retry endpoint + wire history.
8. Wire accounts delete.
9. Wire settings/brands/reports actions.
10. Replace SAMPLE_* / MOCK_* with real fallbacks.
11. Build & typecheck.
