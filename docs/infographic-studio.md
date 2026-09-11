# Infographic studio

## Entry points

- `/dashboard/infographics`: visual template discovery and manually refreshed projects (20 per page).
- `/dashboard/infographics/studio`: brief, reviewed content, structured editing, version history and export.
- Existing `/dashboard/infographics/instant` and `/dashboard/infographics/ads`: explicitly flattened AI-image mode, with manually refreshed image history.

## Implementation

The schema and deterministic SVG layout live in `src/lib/infographic-studio`. Text and numeric data remain separate from branding and optional raster artwork. Preview and export use bundled Noto fonts; PNG rendering uses resvg. Numeric blocks require labels, units and confirmation. Known overflow and unavailable assets block final export.

All studio database operations are server-side and verify workspace membership. Viewers can read; owners/admins/editors can create and save; only owners/admins manage shared brand presets. No client Firestore subscriptions or periodic refresh timers are added. Local edits stay in memory until Save; URL import and paid revisions require explicit actions.

Structured projects are stored under `workspaces/{workspaceId}/infographicProjects`. Saves check the expected revision in a transaction. The last 20 immutable saved versions are retained. Restoring historical content creates a new current version; saving an unchanged document is a no-op. Pruning never deletes media. Creative presets are workspace settings, copied into each document as a snapshot; they never alter dashboard white-label appearance.

Image-mode output history is separate, per workspace/user/tool, and keeps 20 flattened outputs. It does not migrate old images or reconstruct layers. Generation operation records suppress repeated application submissions. Ambiguous paid requests are not automatically retried. Explicit status refresh reads the original operation; it does not launch generation.

PNG exports can be saved through the existing Bunny/media-library service. Matching saved exports are reused. Composer handoff resolves a workspace-authorized asset ID and offers an explicit add/separate-draft choice. Scheduling still requires the existing composer confirmation flow.

## Setup and boundaries

- Reuse the existing Firebase Admin, Bunny storage/CDN, image-provider and Groq credentials. No new prices, credits or billing allowances are introduced.
- The bundled fonts and native renderer are declared in Next's standalone tracing configuration. Install dependencies on the deployment platform; do not copy Windows native binaries to Linux.
- New collections use server-only access. No new client rules or custom composite indexes were needed for the selected queries; standard Firestore single-field indexes must remain enabled.
- Existing workspace logos are automatically reused when their URL resolves to a supported image in that workspace's media library. Otherwise select/upload the actual logo through the media library.
- Imported claims are not verified. Source text remains editable and must be organized into supported section lengths; this is not an automatic research or fact-checking service.
- PDF, arbitrary custom fonts, freeform canvas editing and recovering layers from flattened images are outside this version.
- Live paid-provider calls, production Firebase writes and production publishing were not exercised during local verification.

## Verification (2026-09-11)

- `npx tsc --noEmit`: passed.
- Complete Vitest suite: 94 files, 796 tests passed; no failing files excluded.
- `npm run build`: passed, including TypeScript and 316 static pages. Existing middleware deprecation and dynamic tracing warnings remain.
- Focused studio ESLint: passed. Full repository ESLint: 129 errors and 285 warnings; all 129 offending source lines were also present in the pre-change HEAD. Do not interpret focused lint as a clean repository-wide lint run.
- Browser workflow passed against the local production build: idea and offer entry points, manual refresh, backward step navigation, undo/redo, saving, downloads, desktop and mobile. Checks use an isolated Chrome profile with mocked authentication/product APIs, against actual dashboard components. Real font loading and separately rendered English/French/Arabic PNG/SVG exports were inspected locally; these checks are not live deployment verification.

Reproduce with `npx vitest run`, then start the application on port 3100 and run `npx playwright test --config playwright.studio.config.ts`. Set `STUDIO_REVIEW_DIR=test-results/export-review` when running `tests/infographic-studio.test.ts` to save English, French and Arabic PNG/SVG review artifacts. Browser screenshots and validation logs are ignored under `test-results/`.
