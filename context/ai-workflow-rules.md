# AI Workflow Rules

## Before implementation

1. Read `AGENTS.md` and all six context files in their prescribed order.
2. Read the selected file in `context/feature-specs/` completely.
3. Inspect the current implementation, tests, and git status; documentation is not proof of current code behavior.
4. Mark only that unit as in progress in `context/progress-tracker.md`.
5. If the spec conflicts with code or an invariant, record the issue and ask for a decision when it materially changes the result.

## Scope

- Work on one feature unit or one tightly coupled subsystem at a time.
- Do not combine unrelated module seams in one implementation step.
- Implement exactly the selected spec and its acceptance criteria.
- Do not add “helpful” features, migrations, dependencies, or redesigns outside the spec.
- Preserve unrelated working-tree changes.

## Decision rules

- Make local, reversible implementation choices when they do not alter scope or invariants.
- Do not invent product behavior, platform support, permission rules, billing behavior, or data migration policy.
- Put unresolved product/architecture choices under Open questions in the progress tracker.
- When diagnosing a difficult failure, write `context/current-issues.md` with reproduction, evidence, hypotheses, and proposed fix; analyze before editing. Delete or ignore the temporary file before delivery unless its contents are intentionally retained.

## Implementation rules

- Prefer a deep domain module behind a small interface.
- Keep HTTP, persistence, and vendor details in their adapters.
- Verify authentication and workspace access at every server mutation/read seam.
- Reuse canonical types and capability definitions.
- Keep jobs resumable and state transitions truthful.
- Add tests at the changed interface.

## Completion loop

1. Review the diff against the feature spec and architectural invariants.
2. Run every verification command named by the spec.
3. If verification fails, fix only failures caused by the unit; report unrelated baseline failures explicitly.
4. Mark the unit complete only when its checklist passes.
5. Update Completed, Next up, Architecture decisions, and Session notes in `context/progress-tracker.md`.
6. Commit only intended files with a clear message and push the current branch according to `AGENTS.md`.
7. Start the next independent feature in a fresh task/chat so stale implementation context does not override the repository context.

## Context synchronization

- `project-overview.md` changes when product goals, users, core flows, success criteria, or scope change.
- `architecture.md` changes when a module seam, dependency direction, storage contract, or invariant changes.
- `ui-context.md` changes when the design system or reusable interaction conventions change.
- `code-standards.md` changes when repository-wide implementation conventions change.
- `ai-workflow-rules.md` changes when the delivery process changes.
- `progress-tracker.md` changes after every meaningful feature implementation.

The context is a compact operating contract, not a chronological dump. Put detailed historical research under `docs/` and keep these files concise enough to read every session.
