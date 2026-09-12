# Spec-driven system design workflow from the Ghost AI video

## Purpose and conclusion

This note turns the supplied transcript of [How Senior Engineers Actually Build With AI in 2026](https://www.youtube.com/watch?v=14RP8liACqo) into an actionable workflow for PostPlanify.

The central idea is worth adopting: architecture and project state should live in version-controlled files, while implementation should proceed through small, verifiable feature specifications. The Ghost AI application and its vendor stack are only an example. PostPlanify is an existing (brownfield) Next.js/Firebase product, so it should **document and preserve its real architecture rather than replace it with Clerk, Prisma/Postgres, Liveblocks, Trigger.dev, or Vercel Blob**.

The creator's newer official workflow makes the same brownfield distinction explicitly: audit the existing repository first, then scope the next slice, then run an architecture/development/verification/test/review/documentation/sync loop. It also says state should live in files rather than a chat session. See the [JS Mastery skills repository](https://github.com/JavaScript-Mastery-Pro/skills#where-to-start) and its [feature loop](https://github.com/JavaScript-Mastery-Pro/skills#the-feature-loop).

## What the video means by “system design”

The video does not use “system design” to mean drawing a single diagram. It describes a chain of decisions:

1. Define the product, users, measurable goals, end-to-end flows, scope, and exclusions.
2. Select a technology for each responsibility and state why it owns that responsibility.
3. Define boundaries between UI, request handlers, domain/data code, background work, realtime state, and artifact storage.
4. Define the data/storage model and access-control model.
5. Write invariants the implementation must never violate.
6. Split the roadmap into independently deliverable feature units.
7. Give every unit a written specification and objective completion checks.
8. Keep a living progress/decision record so a new session can resume from disk.
9. Review and test each unit before merging it.

The important shift is from prompting for an outcome (“build a dashboard”) to communicating decisions and constraints (“add this route inside the existing auth and data boundaries; do not modify unrelated navigation”).

## The six-file context system

The six files live under `context/`. The video briefly shows a seventh file inside the downloaded bundle, but that is the wiring file and is moved to the repository root as `AGENTS.md` (or the tool-specific equivalent).

The normalized filenames below follow the names spoken/shown in the video. The supplied transcript is automatic speech recognition, so it sometimes renders `.md` as “mmd” and product names phonetically.

| Order | File | Stable responsibility | Recommended contents |
| --- | --- | --- | --- |
| 1 | `context/project-overview.md` | Product intent | One-paragraph summary; concrete numbered goals; personas; complete core user flows; capabilities; in-scope and explicitly out-of-scope work; measurable success criteria. |
| 2 | `context/architecture.md` | Technical blueprint | Actual stack and the job of each technology; system boundaries; data flow; storage model; identity and authorization; background processing; external integrations; invariants; deployment topology; known risks. |
| 3 | `context/ui-context.md` | Visual and interaction contract | Product aesthetic; design-token names and values; typography; spacing and radii; component-library rules; layout patterns; responsive behavior; accessibility conventions; iconography. Token values must agree with the actual CSS. |
| 4 | `context/code-standards.md` | Implementation consistency | TypeScript, Next.js, API, validation, testing, data-access, styling, file-placement, naming, error-handling, logging, and security conventions, derived from the repository rather than invented. |
| 5 | `context/ai-workflow-rules.md` | Agent execution discipline | One feature/subsystem per unit; do not infer missing decisions; protected files; when a task must be split; required checks; documentation synchronization; handling secrets; stopping conditions and escalation rules. |
| 6 | `context/progress-tracker.md` | Living project state | Current phase and goal; in progress; completed; next; blockers/open questions; architecture decisions with rationale; session notes. This is the only one of the six expected to change constantly. |

The load order matters: intent → architecture → UI contract → implementation conventions → execution rules → current state. The video instructs the agent to read all six before implementation and update the progress tracker after meaningful work.

### The seventh, wiring file

The root `AGENTS.md` is not a seventh context document. It is the entry point that tells a coding agent what to load and what global rules apply. For this repository, the existing [`AGENTS.md`](../../AGENTS.md) already contains the compile/commit/push policy. Adoption should **extend it**, not overwrite it, with a short ordered list pointing to the six context files and a rule to keep them synchronized.

The current JS Mastery workflow has evolved toward `AGENTS.md`, `docs/scope/`, and `docs/specs/`, but preserves the same principle: durable state and load-bearing decisions belong in repository files. Its official guidance specifically recommends an audit-first start for an existing codebase. [Source](https://github.com/JavaScript-Mastery-Pro/skills#what-gets-written-and-where)

## How to author the six files

The video’s process is conversation-first, but the output must be evidence-based:

1. Start with an architectural interview: What does the product do? Who uses it? What are the core flows? Where are the complex patterns? What can fail? What is deliberately excluded?
2. Pressure-test answers until boundaries and tradeoffs are explicit.
3. For a new product, choose technologies only after responsibilities are clear.
4. For an existing product such as PostPlanify, audit the code, tests, deployment files, and data rules first. Record what exists before proposing changes.
5. Populate the six files from those findings.
6. Reconcile contradictions with the code. A context file is not authoritative merely because it is Markdown; it must reflect the implementation.
7. Wire the files through the root `AGENTS.md`.
8. Treat architectural changes as deliberate changes to `architecture.md`, not silent drift during feature implementation.

## The per-feature specification

After the six files exist, create `context/feature-specs/` and put one numbered file per scoped unit in it:

```md
# Feature NN: Name

## Goal
One or two sentences describing the observable result when this unit is done.

## Design decisions
- Visual, structural, behavioral, security, and data decisions.
- Explicit references to architecture and UI rules.
- Dependencies and exclusions.

## Implementation
### Boundary or subsystem 1
- Concrete files/modules to create or modify.
- Named components, functions, routes, collections, and events.
- Expected behavior at each integration point.

### Boundary or subsystem 2
- Additional implementation detail, if still one cohesive unit.

## Verification checklist
- [ ] Observable acceptance criterion.
- [ ] Authorization and tenant-isolation criterion, where applicable.
- [ ] Failure/retry/idempotency criterion, where applicable.
- [ ] Relevant tests pass.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes when the risk warrants a production build.
- [ ] `context/progress-tracker.md` is updated.
```

The video’s repeated execution prompt is effectively:

> Read this feature spec and the project context, mark the unit in progress in the progress tracker, implement exactly what is specified without expanding scope, run the checks, then update the tracker with the result and decisions.

Use a fresh agent conversation for a new independent feature. Continue an existing conversation only for directly related correction/review work. The durable files, not chat history, are the handoff mechanism.

## The complete unit delivery loop

1. Select the smallest coherent unit whose prerequisites are complete.
2. Write its feature spec before editing code.
3. Resolve missing load-bearing decisions in the spec or `architecture.md`; do not make them accidentally during coding.
4. Start a focused session and load the feature spec plus the six context files.
5. Mark the feature `in progress`.
6. Implement only the stated unit.
7. Run the spec’s verification checklist.
8. Review the diff against both the spec and the repository’s standards/security invariants.
9. Apply focused corrections and add regression tests for defects.
10. Mark the unit complete and capture architectural decisions/session notes.
11. Commit a small, coherent diff and push the active branch according to the repository’s policy.
12. Prefer a pull request with required checks/review before merging production code. GitHub branch protection can enforce passing status checks and approving reviews. [GitHub documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
13. Repeat with a fresh unit/session.

## Debugging workflow from the video

For a nontrivial failure, the video introduces a temporary `context/current-issues.md`:

1. Record reproduction steps, expected behavior, actual behavior, exact error output, and relevant environment information.
2. Ask the agent to analyze and propose a root cause before changing code.
3. Approve or correct the diagnosis, then make a targeted fix.
4. Add a regression test and run the relevant checks.
5. Move lasting knowledge into the progress tracker, architecture, or standards file.
6. Delete or gitignore `current-issues.md` before committing if it contains request payloads, tokens, user data, or other secrets.

This last rule is not optional. In the video, a review catches a token copied into the issue file. “Temporary debugging context” must never become a credential archive.

## Ghost AI-specific stack: example, not prescription

The demo application uses this design:

| Responsibility | Ghost AI choice | Architectural rule illustrated |
| --- | --- | --- |
| Web application | Next.js 16, React 19, TypeScript, Tailwind | Make server/client boundaries explicit. |
| Authentication and users | Clerk | Reuse a dedicated identity provider; enforce ownership at mutations. |
| Metadata | Prisma + PostgreSQL | Keep structured relational metadata in the database. |
| Collaborative graph | React Flow + Liveblocks | Shared room state, presence, cursors, nodes, and edges. Verify project membership before issuing room access. |
| Long-running AI work | Trigger.dev | Do not hold ordinary request handlers open for durable work; use retries/status. |
| Large artifacts | Vercel Blob | Store snapshots/spec files separately from relational metadata. |
| LLM | Gemini through a background task | Generate structured canvas actions and later Markdown specs. |
| Review/deployment | Feature branch, PR review, Vercel | Verify every unit and deploy from reviewed source. |

These choices illustrate separation of responsibilities; they are not requirements of the six-file method.

### Ghost AI’s 29 demonstrated feature units

The following sequence is transcribed from the video. Hyphens are normalized from the spoken filenames:

1. `01-design-system.md`
2. `02-editor.md`
3. `03-auth.md`
4. `04-project-dialogues.md`
5. `05-prisma.md`
6. `06-project-apis.md`
7. `07-wire-editor-home.md`
8. `08-editor-workspace-shell.md`
9. `09-share-dialogue.md`
10. `10-liveblocks-setup.md`
11. `11-base-canvas.md`
12. `12-shape-panel.md`
13. `13-node-shape.md`
14. `14-node-editing.md`
15. `15-node-color-toolbar.md`
16. `16-edge-behavior.md`
17. `17-canvas-ergonomics.md`
18. `18-starter-template.md`
19. `19-presence-avatars-cursors.md`
20. `20-ai-sidebar-shell.md`
21. `21-canvas-autosave.md`
22. `22-design-agent-api.md`
23. `23-design-agent-logic.md`
24. `24-ai-presence-state.md`
25. `25-sidebar-chat-feed.md`
26. `26-design-agent-frontend.md`
27. `27-spec-generation-flow.md`
28. `28-spec-persistence-download.md`
29. `29-spec-ui-integration.md`

The ordering illustrates dependencies: visual foundation → authentication/project model → secure workspace access → realtime infrastructure → canvas behavior → presence/chat → background AI generation → artifact persistence → final UI integration. It should not be copied as PostPlanify’s backlog.

## PostPlanify’s actual starting architecture

Repository evidence shows a materially different, already mature platform:

- [`package.json`](../../package.json) defines Next.js 16.2, React 19.2, strict TypeScript, Tailwind 4, Firebase client/admin SDKs, next-intl, Stripe, Sentry, Zod, Vitest, and Playwright.
- [`README.md`](../../README.md) describes a large App Router product with marketing/tool routes and a multi-feature dashboard, deployed as a standalone Node application/Hostinger or Docker—not a fresh Vercel-only project.
- [`firestore.rules`](../../firestore.rules) defines workspace membership roles (`owner`, `admin`, `editor`, `viewer`) and collection-level permissions.
- [`src/lib/firebase/admin.ts`](../../src/lib/firebase/admin.ts) implements server-side Firebase session verification and deliberately fails closed when the Admin SDK is not configured.
- [`src/lib/auth/session-context.ts`](../../src/lib/auth/session-context.ts) resolves the active workspace and avoids a shared fallback that could break tenant isolation.
- [`src/lib/queue/worker.ts`](../../src/lib/queue/worker.ts), [`src/lib/queue/caption-worker.ts`](../../src/lib/queue/caption-worker.ts), and related modules already implement asynchronous job/tick patterns using Firestore-backed state.
- [`src/lib/bunny.ts`](../../src/lib/bunny.ts) shows that large generated assets are stored through Bunny storage/CDN rather than Vercel Blob.
- [`src/app/globals.css`](../../src/app/globals.css) already contains semantic Tailwind/CSS design tokens; `ui-context.md` should document these tokens rather than invent a new palette.

### Recommended PostPlanify responsibility map

| Layer | Existing PostPlanify responsibility | Context-file invariant to record |
| --- | --- | --- |
| UI | Next.js App Router pages/layouts and React components | Server Components by default; client entry points only for state, events, effects, or browser APIs. This matches current Next.js guidance. [Next.js documentation](https://nextjs.org/docs/app/getting-started/server-and-client-components) |
| HTTP boundary | `src/app/api/**/route.ts` | Validate input, resolve session/workspace, authorize, call domain/service code, and return consistent responses. Route Handlers use the Web Request/Response APIs. [Next.js documentation](https://nextjs.org/docs/app/getting-started/route-handlers) |
| Identity/tenant boundary | Firebase Auth/session cookie + workspace context | Every tenant-scoped server mutation must resolve and enforce `workspaceId`; never trust a client-provided workspace alone. |
| Client data authorization | Firestore Security Rules | Web/mobile SDK requests require Firebase Auth + rules. Rules are access-control contracts, not filters. [Firebase overview](https://firebase.google.com/docs/firestore/security/overview) |
| Server data authorization | Firebase Admin SDK + server helpers | Admin/server SDKs bypass Firestore Security Rules, so API/domain code and IAM must enforce access explicitly. [Firebase rules documentation](https://firebase.google.com/docs/firestore/security/get-started) |
| Persistence | Firestore | Use transactions when a write depends on current data; transaction functions may retry and must not mutate application state directly. [Firebase transactions](https://firebase.google.com/docs/firestore/manage-data/transactions) |
| Realtime | Firestore listeners where document/query synchronization is sufficient | Firestore `onSnapshot()` supplies an initial snapshot and subsequent updates; do not add Liveblocks merely to obtain ordinary data synchronization. [Firebase realtime listeners](https://firebase.google.com/docs/firestore/query-data/listen) |
| Durable work | Existing Firestore job records and worker ticks; external provider queues where already used | Request handlers enqueue/claim work and return; workers own retries, leases, idempotency, terminal states, and reconciliation. If a managed Firebase-native queue is later needed, Cloud Tasks supports async execution, rate limits, and retry configuration. [Firebase task queues](https://firebase.google.com/docs/functions/task-functions) |
| Artifacts | Bunny storage/CDN plus Firestore metadata | Keep binaries/large artifacts out of Firestore documents; store ownership and lifecycle metadata in Firestore. |
| External integrations | Upload-Post, n8n/webhooks, AI/media providers, Stripe | Put provider-specific behavior behind adapters; authenticate callbacks; make delivery idempotent; record provider IDs and lifecycle state. |
| Observability | Existing logger/Sentry and health endpoints | Structured logs must include safe identifiers and lifecycle state, never secrets or raw credentials. |

## What to adopt, adapt, and reject

### Adopt directly

- The six durable context responsibilities.
- Explicit in-scope/out-of-scope statements and measurable success criteria.
- Named architectural boundaries and invariants.
- One coherent feature per numbered spec.
- Acceptance checks before implementation.
- A living progress/decision record.
- Fresh sessions for independent units.
- Root-cause analysis before broad fixes.
- Small diffs, tests, review, and branch protections.

### Adapt to this repository

- **Auth:** document Firebase session cookies and workspace RBAC; do not introduce Clerk.
- **Database:** document Firestore collections, indexes, transactions, and server/client authorization; do not migrate to Prisma/Postgres merely to match the demo.
- **Realtime:** use Firestore listeners for synchronized product data. Evaluate a presence/CRDT service only if a future collaborative editor truly needs ephemeral cursors, presence, or conflict-free shared state that Firestore’s document model does not address cleanly.
- **Background work:** document and harden the current job/worker model first. Evaluate Cloud Tasks, Trigger.dev, or another queue only through a separate architecture decision with operational requirements.
- **Storage:** document Bunny + Firestore metadata rather than Vercel Blob.
- **Deployment:** document Hostinger/standalone Node and Docker realities, including how worker ticks are scheduled and kept alive.
- **UI context:** derive it from `src/app/globals.css`, existing primitives, accessibility patterns, and localized RTL/LTR behavior.
- **Checks:** use the repository’s actual commands: `npm run typecheck`, `npm run lint`, `npm run test:run`, targeted Playwright tests, and `npm run build` according to risk.
- **Git:** preserve the repository’s auto-push rule, but use a feature branch and protected-branch PR workflow for material changes if repository settings permit it.

### Reject as unsafe cargo-culting

- Reinitializing the project with `create-next-app` or deleting existing boilerplate.
- Copying the Ghost AI 29-feature roadmap into PostPlanify.
- Replacing proven providers without a problem statement and migration plan.
- Treating Markdown as more truthful than tests and production code.
- Putting access tokens, private keys, raw cookies, customer content, or provider payloads into context/debug files.
- Letting the agent change unrelated layers because a feature spec is vague.
- Calling a task “done” because code was generated; it is done only when its acceptance checks pass.

## Recommended implementation sequence for this repository

This is the safe first rollout—not an application rewrite:

### Phase 0 — repository audit and decision inventory

1. Inventory routes, domains, data collections, worker/job lifecycles, external providers, deployment processes, and tests.
2. Identify contradictions between README/docs and code.
3. Record unresolved decisions rather than guessing.
4. Establish a snapshot of required checks and their current pass/fail state.

### Phase 1 — create the six files from evidence

1. Write `project-overview.md` from the product’s current capabilities and intended users.
2. Write `architecture.md` from the actual Firebase/Next.js/worker/storage topology.
3. Write `ui-context.md` from CSS tokens, shared components, responsive patterns, and localization behavior.
4. Write `code-standards.md` by sampling representative, well-tested modules and existing lint/TypeScript configuration.
5. Write `ai-workflow-rules.md` with scope, security, test, review, and secret-handling requirements.
6. Initialize `progress-tracker.md` with the audit state, known debt, open questions, and the first planned unit.
7. Update root `AGENTS.md` to load the files in order while retaining its current auto-push instructions.

### Phase 2 — validate context against the repository

1. Ask a fresh reviewer to find context statements unsupported or contradicted by code.
2. Verify all named commands exist in `package.json`.
3. Verify authorization invariants against both server helpers and `firestore.rules`.
4. Verify background-job claims against job schemas, workers, health endpoints, and scheduler/deployment configuration.
5. Correct the documents before using them as implementation instructions.

### Phase 3 — pilot the feature loop

Choose one bounded, low-risk change with good test coverage. Create `context/feature-specs/01-<name>.md`, execute the complete delivery loop, and measure:

- Did the spec prevent unrelated edits?
- Did checks catch defects before review?
- Did the progress tracker contain enough information for a fresh session?
- Did the six files contain redundant or stale material?

Refine the context system from that pilot before using it across all product areas.

### Phase 4 — architecture hardening units

After the pilot, good candidates for separate specs are:

1. Tenant authorization invariant audit across API routes and Admin SDK data access.
2. Firestore collection/index/schema map and ownership rules.
3. Unified asynchronous-job state machine, claim/lease/retry/idempotency contract.
4. Provider adapter and webhook delivery boundaries.
5. Artifact storage lifecycle and orphan cleanup.
6. Observability, health checks, and operational runbooks.
7. UI token/component consistency and accessibility.
8. CI checks and protected-branch policy.

Each is an architecture unit first and an implementation unit only after its decision/spec is approved.

## Definition of success for adopting the method

The rollout is successful when:

- A fresh engineer or agent can explain the product, major data flows, boundaries, and current work from repository files without relying on chat history.
- Every new material feature has a written goal, explicit exclusions, implementation boundaries, and verifiable acceptance criteria.
- Tenant authorization and background-job invariants are visible and tested.
- The six files agree with the implementation and are updated when architecture changes.
- Independent units produce small, reviewable diffs and can be resumed after a fresh session.
- No secret or customer data is stored in context/debug documents.

## Sources

- Primary video and supplied transcript: [How Senior Engineers Actually Build With AI in 2026](https://www.youtube.com/watch?v=14RP8liACqo).
- Creator’s current first-party workflow: [JavaScript Mastery Pro agentic development skills](https://github.com/JavaScript-Mastery-Pro/skills) and [course workflow overview](https://jsmastery.com/waitlist/ai-course).
- Current repository evidence: [`package.json`](../../package.json), [`README.md`](../../README.md), [`AGENTS.md`](../../AGENTS.md), [`firestore.rules`](../../firestore.rules), [`src/lib/firebase/admin.ts`](../../src/lib/firebase/admin.ts), [`src/lib/auth/session-context.ts`](../../src/lib/auth/session-context.ts), [`src/app/globals.css`](../../src/app/globals.css), and [`src/lib/queue/`](../../src/lib/queue/).
- Framework/platform verification: [Next.js App Router](https://nextjs.org/docs/app), [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started), [Firestore realtime listeners](https://firebase.google.com/docs/firestore/query-data/listen), [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [Firebase task queues](https://firebase.google.com/docs/functions/task-functions), and [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches).
