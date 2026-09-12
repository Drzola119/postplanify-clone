# Project Guidelines & Rules

## Project Context

Before implementing a feature or fix, read these files in order:

1. `context/project-overview.md` — product definition and scope
2. `context/architecture.md` — modules, seams, storage, and invariants
3. `context/ui-context.md` — design and interaction conventions
4. `context/code-standards.md` — implementation and verification rules
5. `context/ai-workflow-rules.md` — scoping and delivery process
6. `context/progress-tracker.md` — current state, decisions, and next work

Implement one numbered file from `context/feature-specs/` at a time. Mark it in progress before implementation and update `context/progress-tracker.md` after every meaningful implementation change. If implementation changes product scope, architecture, UI rules, or code standards, update the corresponding context file before continuing.

## Auto-Push Rule
Whenever you finish writing code, updating components, fixing bugs, or modifying files in this project:
1. Verify that changes compile cleanly (e.g. `npx tsc --noEmit`).
2. Stage and commit the modified files with a clear commit message.
3. Automatically push the commits to `origin/main` (or the current active branch) so the repository is kept updated.
