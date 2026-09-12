# PostPlanify Code Standards

## TypeScript

- Keep strict TypeScript enabled and preserve `@/*` imports.
- Avoid `any`; validate `unknown` before use.
- Model domain states with explicit unions instead of booleans or arbitrary strings.
- Reuse canonical domain types. Do not create local platform, status, or role unions that can silently diverge.
- Return results from domain functions; keep HTTP response construction in route adapters.

## Next.js and React

- Use Server Components by default. Add `"use client"` only for browser state, effects, event handlers, or browser-only libraries.
- Keep route handlers thin: authenticate, validate, call a domain interface, translate the result.
- Keep server-only modules marked with `import "server-only"` where appropriate.
- Do not import Firebase Admin, secrets, Node-only libraries, or persistence adapters into client modules.
- Prefer existing layouts and shared UI primitives over duplicating page chrome.

## Modules and seams

- Put behavior behind a small interface at a clear seam.
- Accept dependencies when behavior genuinely varies; do not add hypothetical interfaces with only one foreseeable adapter.
- Keep vendor payload construction and normalization inside the vendor/domain adapter.
- Keep Firestore paths, timestamps, and transactions inside persistence adapters.
- Apply the deletion test: a module should hide complexity, not merely rename another call.

## Authentication and authorization

- Use `requireSession()` for workspace-owned route behavior unless the route has a documented service-to-service authentication contract.
- Use the returned `workspaceId`; never trust a client-provided workspace identifier without verifying membership.
- Enforce owner/admin/editor/viewer permissions server-side at the mutation seam.
- Fail closed on missing authentication, membership, database configuration, or workspace resolution.

## Validation and responses

- Define Zod schemas under `src/lib/validation/**` for non-trivial inputs.
- Use shared parsing/response helpers when they fit the existing route.
- Bound strings, arrays, files, and pagination at ingress.
- Return accurate HTTP status codes and stable error shapes; never expose provider secrets or raw credentials.

## Persistence and jobs

- Keep persisted document types synchronized with repository adapters, Firestore rules, indexes, fixtures, and tests.
- Store dates consistently at the persistence seam and normalize them when returning data.
- Scheduled/background work must have explicit states, atomic claims, idempotency identifiers, retry limits, and stuck-work recovery.
- Do not mark work successful before the external provider confirms the relevant outcome.

## Styling and UI

- Use semantic theme tokens from `src/app/globals.css` for product UI.
- Reuse components from `src/components/ui/**` and established feature patterns.
- Preserve theme, responsiveness, accessibility, localization, and RTL behavior.
- Keep platform colors limited to platform identity; pair color with text/icon status.

## Testing

- Add or update the narrowest test that demonstrates the behavior changed.
- Favor tests through a module's interface over tests of implementation details.
- Mock at external seams (Firebase, UploadPost, AI, Stripe), not internal helper chains.
- For bug fixes, add a regression test when practical.
- Run changed-file ESLint when repository-wide lint debt is unrelated.

## Required verification

Unless a scoped feature spec states a justified alternative:

```text
npm run typecheck
npm run test:run
npm run lint
```

Run `npm run build` for integration/deployment-sensitive changes when local constraints allow it. A feature spec may narrow lint/build commands only when it records why.

## Change discipline

- Preserve unrelated user changes and untracked files.
- Do not broaden a feature unit to clean up nearby code.
- Update context documentation when the product scope, architecture, UI rules, or standards actually change.
- Use clear commits and obey the repository auto-push rule after verified modifications.
