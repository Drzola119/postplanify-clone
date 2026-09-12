# 01 — Canonical Platform Domain Contract

## Status

Proposed — review before implementation.

## Goal

Create one deep platform-domain module that provides canonical platform identity, display metadata, aliases, content limits, and capability support to callers. Eliminate silent platform coercion and reduce duplicated definitions without changing upstream provider support.

## Why this is first

Platform knowledge crosses composer UI, bulk scheduling, analytics, account health, validation, publishing, and reports. The repository already contains multiple platform unions, allowlists, colors, and capability matrices. Drift here produces misleading UI and invalid delivery behavior, so this seam has high leverage.

## Design decisions

- The external interface should answer caller questions such as “resolve this provider key”, “get display metadata”, and “is this capability supported”.
- Unknown identifiers remain unknown and produce an explicit neutral/unsupported result; they never become Bluesky or another valid platform.
- `x` may normalize to canonical `twitter`, but provider aliases are explicit data.
- Capability support distinguishes application support, provider support, and content-type constraints where those meanings differ.
- Platform brand presentation may be exposed as semantic metadata, but page-specific Tailwind fragments must not become the domain interface.
- Existing Firestore values must remain compatible; no data migration is included unless inspection proves one is required.

## Scope

1. Inventory platform identifiers and capability definitions in `src/lib/platforms.ts`, `src/lib/db/schema.ts`, validation modules, publishing modules, analytics, and bulk scheduling.
2. Define the smallest canonical interface and type source.
3. Migrate one coherent vertical slice first, prioritizing the analytics/platform identity bug recorded in the current repository task.
4. Add regression tests for Reddit identity, unsupported Discord/Telegram/Google Business analytics, `x` alias normalization, and unknown identifiers.
5. Record remaining consumers as follow-up specs rather than broadening this unit.

## Out of scope

- Adding new UploadPost capabilities.
- Changing social-account connection behavior.
- Rewriting all consumers in one pass.
- UI redesign.
- Firestore migration unless required for correctness and separately approved.

## Invariants

- All thirteen catalog platforms preserve their canonical identity.
- Unknown input is never presented as a known platform.
- Unsupported means unsupported; no fabricated metrics or delivery data.
- Workspace authorization and provider secrets are untouched.

## Verification checklist

- [ ] Canonical type/interface covers all thirteen platforms.
- [ ] `x` resolves explicitly to `twitter`.
- [ ] Reddit renders and reports as Reddit.
- [ ] Discord, Telegram, and Google Business retain identity and show honest unsupported analytics states.
- [ ] Unknown identifiers use an explicit neutral path.
- [ ] No new duplicated platform union is introduced.
- [ ] Focused tests cover alias, known, unsupported, and unknown cases.
- [ ] Changed-file ESLint passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run test:run` passes.
