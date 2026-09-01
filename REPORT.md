# REPORT — pilot-1: fix analytics section to all 13 platforms

## Status: DONE

## Summary
Extended the dashboard analytics section to represent all 13 platform-catalog
platforms with honest statuses and removed the silent "bluesky" relabeling of
unknown platforms.

## Root cause (grounded)
- `src/lib/platforms.ts` catalog has 13 platforms. The analytics page's local
  `Platform` type + `PLATFORM_ACCENT` covered only 9; `toPlatform()` coerced any
  key not in `PLATFORM_ACCENT` to `"bluesky"`. Reddit (analytics-supported
  upstream) plus Discord/Telegram/Google Business all rendered as Bluesky.

## Files changed (single file)
- src/app/dashboard/analytics/page.tsx

## Edits
1. `Platform` type: added `reddit | discord | telegram | google_business | unknown`
   → now covers all 13 catalog platforms + a neutral `unknown` identity.
2. `PLATFORM_ACCENT`: added brand colors for reddit (#FF4500/orange), discord
   (#5865F2/indigo), telegram (#229ED9/sky), google_business (#4285F4/blue), and
   `unknown` (zinc gray) so every platform renders with its own identity.
3. `toPlatform()`: fallback changed from coercing to `"bluesky"` → returns
   neutral `"unknown"` so unknown keys are rendered honestly (gray,
   "unsupported"), never mislabeled as an existing platform.
4. `PlatformAvatar` call sites (PlatformIcon + AccountAvatar pieces): targeted
   `as PlatformId` cast with an explanatory comment — `unknown` is the only non-
   catalog value and PlatformAvatar renders it neutrally (gray + initials).
5. Import: added `type PlatformId`.

## Verification (from worktree root)
- `npx tsc --noEmit` → exit 0
- `npx vitest run` → exit 0 — 84 files / 730 tests passed
- `npx eslint src/app/dashboard/analytics/page.tsx` → 5 problems (2 errors,
  3 warnings) — identical to the pre-change baseline (only line numbers shifted);
  **no new** lint problems introduced.
- `npm run build` **not run** — deferred per disk constraint (STATUS.md).

## Notes
- Implemented by the orchestrator on the emergency path after two native
  implementer subagents each stalled with zero edits (likely over-planning on a
  1,574-line file); the change is small and fully specified, so this was a
  trivial-orchestrator-edit case.
- No `npm ci`/`install` run (junction protection intact). No build artifacts.
- The 4 analytics-unsupported platforms (bluesky/discord/telegram/google_business)
  show the existing honest "unsupported" state; no numbers fabricated. Deep
  upstream data for them remains out of scope per TASK.md.
