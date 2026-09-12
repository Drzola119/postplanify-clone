# PostPlanify Progress Tracker

Last updated: 2026-09-12

## Current phase

Architecture baseline and spec-driven workflow adoption for an existing production-scale application.

## Current goal

Review and approve the first bounded architecture-hardening unit without replacing the existing stack.

## In progress

- No implementation unit is active. `01-platform-domain-contract.md` is proposed for review.

## Completed

- Existing platform is implemented as a Next.js 16/React 19 modular monolith.
- Firebase authentication, Firestore persistence, workspace scoping, publishing, scheduling, analytics, inbox, billing, reporting, and creative modules exist.
- A broad Vitest/Playwright test suite and TypeScript/ESLint verification commands exist.
- Light/dark semantic theme tokens and localization infrastructure exist.
- The reusable portion of the six-file method has been separated from Ghost AI-specific technology choices.
- The six context files are established and wired into root `AGENTS.md`.
- The source video workflow, all 29 Ghost AI demo units, and the PostPlanify adaptation are documented in `docs/research/spec-driven-system-design-workflow.md`.

## Next up

1. Review and approve `context/feature-specs/01-platform-domain-contract.md`.
2. Implement the canonical platform domain contract as one scoped unit.
3. Audit workspace-owned route handlers against the authorization invariant and write a separate numbered spec for any gaps.
4. Map background job responsibilities and choose one deepening unit without rewriting the entire worker.
5. Continue one numbered spec at a time.

## Open questions

- Which customer segment is the near-term priority: individual creators, agencies, or internal/enterprise teams?
- Is UploadPost the permanent publishing interface, or should future specs require a second adapter?
- Which deployment process is authoritative today: Hostinger Node, Docker, or another production environment?
- Which repository task document (`TASK.md`) is currently authoritative for feature delivery, if any?

## Architecture decisions

### AD-001 — Adapt the method; do not copy the tutorial stack

PostPlanify keeps Next.js, Firebase Authentication, Firestore, UploadPost, Stripe, and its existing creative adapters. The video demonstrates a delivery method through Ghost AI; its Clerk/Prisma/Liveblocks/Trigger.dev choices solve a different product.

### AD-002 — Retain a modular monolith

The current system benefits from locality and shared types. New seams should deepen domain modules rather than split deployment units prematurely.

### AD-003 — Workspace authorization is an invariant

Workspace resolution must fail closed, and every tenant-owned server read/mutation must derive scope from an authorized server session.

### AD-004 — Canonicalize platform capability knowledge

Platform identity, aliases, limits, and support facts must converge behind one interface. Silent fallbacks to another platform are forbidden.

### AD-005 — Keep delivery state truthful

Queued, scheduled, publishing, published, partially published, failed, paused, and unsupported states are semantically distinct. Provider acknowledgement alone is not success.

## Session notes

- The source video uses one `context/` folder containing six files, plus root `AGENTS.md` and a `context/feature-specs/` subfolder; it does not prescribe six folders.
- The existing graph report covers only a bulk-scheduling subset, but it independently identifies weak cohesion and duplicated platform-capability knowledge as architecture risks.
- Untracked files under `scripts/` predate this work and must remain untouched.
