# Carousel Studio implementation and verification

Updated 11 September 2026. This replaces the earlier checklist, whose checked boxes overstated the implementation and verification.

## Implemented

- Canonical structured drafts, stable slide IDs, legacy image preservation, Firestore-safe serialization, transactional revision checks, automatic immutable content snapshots, and approval invalidation on material edits.
- Serialized debounced saves, visible failures, retry, local recovery, unload protection, and safeguards against overwriting edits with late AI responses.
- Responsive Studio with slide navigation, drag and keyboard-accessible movement, add/duplicate/delete/lock, undo/redo, text editing, typography, colors, layouts, image fit/opacity, safe-zone guides, and platform captions.
- Shared server renderer for previews, export, review, thumbnails and publishing assets; bundled fonts; actual text measurements; overflow reporting; 1080-pixel-wide 1:1, 3:4, 4:5 and 9:16 outputs.
- Ordered PNG ZIP, individual PNG and multipage PDF export, caption metadata, incomplete-export rejection, visible export failures and partial batch-export error manifests.
- Library search across all records, status/date/brand/folder/platform filters, counts, pagination, previews, rename, duplicate, variant creation, archive/restore, batch tags/folders/archive/export, and delivery state from linked posts.
- Visual template previews and independent editable drafts; save/use/delete workspace templates; brand-kit and campaign-folder management.
- Revision history with pagination and restoration as a new revision. Legacy restore now changes the actual slide document.
- Cryptographic expiring and revocable review tokens; revision-pinned guest review, slide/deck comments, resolve/reopen, approval and change requests; stale revisions cannot be approved. Guest names are explicitly self-reported.
- Real AI outline generation, per-slide rewrite/shorten/hook/CTA/translation and caption generation; validated model output; request coalescing and a workspace request limit. Removed the unused fake AI implementations and their misleading tests.
- Text/Markdown file import, pasted text and public article ingestion. URL requests validate all DNS addresses, pin the destination and revalidate redirects; byte/time limits apply.
- Full ordered publishing handoff with revision identity, captions and media metadata; composer draft persistence retains the linkage; one durable post per handoff; failed persistence blocks delivery. Existing account selection, schedule/date/timezone and publishing infrastructure remain the delivery path.
- Editing submitted work creates a draft revision and does not replace the already-submitted post. Earlier delivery is distinguished from the current revision.
- Workspace membership and read/write role checks on carousel routes. Brand snapshots keep saved designs independent of later kit changes.
- Analytics pagination cap removed; missing metrics reported as unavailable; selected-platform snapshots retained; A/B comparisons are directional and do not declare statistically established winners.

## Verified locally

- Full Vitest suite: **99 files, 839 tests passed**, using one worker to fit available memory.
- Regression coverage includes stale saves, undefined Firestore values, immutable snapshots, legacy images, approval invalidation, viewer permissions, expired/revoked review links, stale-review rejection, actual translated model output, locked-slide AI rejection, and failure-before-publishing behavior.
- Real renderer/export tests verify exact PNG dimensions for all four ratios, byte-identical ordered ZIP images, caption inclusion, two-page PDF geometry, overflow detection, and incomplete asset rejection.
- Inspected a generated portrait PNG visually: bundled typography, padding, body text and numbering render correctly.
- TypeScript checks passed. Final `npm run build` completed successfully, including TypeScript, page-data collection and prerendering.
- Scoped ESLint: **0 errors**, four image-element advisories for renderer-generated previews.
- The successful build reports existing middleware deprecation and broad file-tracing warnings involving `next.config.ts` / the chunks route.

## Verification limits and operational notes

- Authenticated browser testing could not run: the local browser automation runtime failed with `failed to write kernel assets` (Windows path error). Automated tests are not a substitute for that remaining browser smoke test.
- No real customer post was published, no client message was sent, and no paid AI request was made as a test. Connected-provider delivery, configured AI credentials and live client-review flows require an authenticated environment.
- The initial build compiled successfully but was interrupted when concurrent test workers exhausted host memory. Final build runs without test workers.
- Document import currently supports plain `.txt` and `.md`, not PDF or Word extraction. The editor is a structured slide editor, not an arbitrary freeform object canvas.
- Color contrast checks on backgrounds containing images require visual review. Supplied external image URLs must remain available; render/export failures are surfaced.
- Library substring search scans lightweight metadata in bounded batches; large workspaces should eventually use a dedicated search index. No silent 60/100-record cap remains.
- AI caption/outline content supports the configured language choices; a complete translation of every Studio interface label is not claimed.
- Git changes are limited to this task. Unrelated video workflow edits and existing scripts are excluded from the commit.
