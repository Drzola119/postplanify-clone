# PostPlanify Architecture

## Architectural style

PostPlanify is a Next.js modular monolith organized around product capabilities. The preferred direction is a set of deep domain modules behind small interfaces, with Next.js routes, Firestore, and external vendors acting as adapters at explicit seams.

This is an architecture description of the existing platform and its intended evolution. It is not a migration to the Ghost AI tutorial's application stack.

## Runtime and technology map

| Concern | Current technology | Role |
| --- | --- | --- |
| Web runtime | Next.js 16 App Router, React 19, TypeScript | Pages, layouts, server rendering, and route handlers |
| Styling | Tailwind CSS 4, shadcn/Base UI, CSS custom properties | Reusable UI primitives and semantic theming |
| Authentication | Firebase Authentication | User identity and session establishment |
| Authorization | Server session context plus workspace membership/ownership | Tenant isolation at server mutation and read seams |
| Persistence | Firestore through Firebase Admin | Workspace-scoped operational data and job state |
| Social publishing | UploadPost adapter | Account discovery, submission, and delivery reconciliation |
| AI | Provider adapters under `src/lib/ai` and creative workflow modules | Caption, analysis, image, carousel, infographic, and video assistance |
| Billing | Stripe adapter plus quota modules | Subscription state and feature/quota enforcement |
| Localization | next-intl | English, French, Arabic, and RTL-aware rendering |
| Verification | TypeScript, ESLint, Vitest, Playwright | Static, unit/integration, and browser-level checks |

## Module map and seams

### 1. Presentation module

- `src/app/**` owns route composition, layouts, server/client rendering, and HTTP entry points.
- `src/components/**` owns reusable visual behavior.
- Route handlers are adapters. They authenticate, validate, invoke a domain interface, and translate results into HTTP responses.
- Presentation code must not become the source of truth for platform capabilities, authorization, or delivery state transitions.

### 2. Identity and workspace module

- `src/contexts/AuthContext.tsx` adapts Firebase Authentication for the client.
- `src/lib/firebase/admin.ts` verifies server identity.
- `src/lib/auth/session-context.ts` resolves `{ uid, email, workspaceId }` and fails closed if workspace resolution is unavailable.
- `src/lib/db/workspaces.ts` persists workspace ownership and membership.

Interface invariant: every tenant-owned server read and mutation receives an authenticated workspace context; client checks are never sufficient authorization.

### 3. Domain/application modules

Product behavior lives in focused modules under `src/lib/**`, including posts, publishing, queue, inbox, analytics, billing, media, reports, webhooks, alerts, automations, and creative generation.

Each module should expose a small interface that represents a meaningful use case. Callers should not need to know Firestore paths, vendor payload quirks, retry bookkeeping, or cross-provider normalization.

### 4. Persistence adapters

- `src/lib/db/index.ts` is the Firestore entry seam.
- `src/lib/db/schema.ts` defines persisted document shapes.
- Files under `src/lib/db/**` are per-capability Firestore adapters.
- `firestore.rules` and `firestore.indexes.json` are part of the persistence interface and must evolve with schema/query changes.

Metadata and state belong in Firestore. Large binary media belongs in the configured media/storage layer and is referenced by URL/path rather than embedded in documents.

### 5. External adapters

External vendors are isolated behind modules such as `src/lib/uploadpost/**`, `src/lib/ai/**`, `src/lib/stripe/**`, and media/image adapters. Vendor request/response shapes must not leak into unrelated UI or persistence callers.

Secrets are server-only and resolved through `src/lib/security/server-config.ts`; never expose them to client bundles or accept untrusted client values as server configuration.

### 6. Background execution module

`src/lib/queue/**` owns asynchronous caption work, scheduled delivery, reconciliation, inbox synchronization, and related operational ticks.

The lifecycle is:

```text
authenticated command
  -> validate and persist intent
  -> scheduled/queued state
  -> worker claims eligible record atomically
  -> build provider payload
  -> submit through external adapter
  -> reconcile provider result
  -> persist truthful terminal/intermediate state
  -> notify and emit webhook
```

Long-running or retryable work must not be performed as an unbounded request-handler operation. Request handlers enqueue/persist intent or trigger a bounded tick; workers own resumable execution.

## Canonical request flow

```text
React UI / external caller
  -> Next.js route adapter
  -> requireSession or service authentication
  -> Zod/parser validation
  -> domain/application module
  -> Firestore and/or external adapter
  -> typed result
  -> HTTP response
```

## Non-negotiable invariants

1. Authorization is enforced at every server-side read and mutation seam.
2. Workspace resolution fails closed; there is no shared fallback tenant.
3. All tenant-owned Firestore paths are scoped by the authorized `workspaceId`.
4. Platform identity is never silently coerced to another platform.
5. A central platform domain contract must drive names, limits, aliases, and feature support; local subsets may only narrow it explicitly.
6. Input is validated before persistence or vendor calls.
7. Secrets and Firebase Admin code remain server-only.
8. Provider acknowledgement is not publication success. Intermediate and per-platform outcomes remain explicit.
9. Background claims and retries are idempotent and recoverable; terminal state reflects actual results.
10. Webhook and notification side effects follow persisted state and have deduplication identifiers where applicable.
11. React client modules are used only for browser interactivity; data/security decisions stay server-side.
12. Accessibility, localization, and RTL behavior are preserved by feature work.

## Known architectural pressure points

- Platform identifiers and capability facts currently appear in multiple modules. This creates drift risk and should be addressed through a single deep platform-domain module, not another mapping layer.
- Some route handlers use different authentication helpers. Each feature spec must identify the correct authorization interface and converge on `requireSession` for workspace-owned data.
- The current worker runs several responsibilities in one orchestration path. Future changes should deepen individual job modules while keeping one small orchestration interface.
- The application is large; changes should follow vertical feature slices rather than directory-wide rewrites.

## Dependency direction

Preferred direction:

```text
presentation/HTTP adapters
  -> domain/application interfaces
    -> persistence and vendor interfaces
      -> concrete adapters
```

Do not make domain modules import React components or Next.js route objects. Do not make UI callers understand Firestore implementation details.

## Deployment and operations

- The repository supports Node.js production builds, Hostinger deployment, and Docker.
- Firebase configuration, provider keys, Stripe configuration, and ingestion secrets are environment-owned.
- Health views must use persisted heartbeats where process-local state is insufficient.
- Schema, indexes, rules, environment examples, and operational documentation are part of deployable behavior.
