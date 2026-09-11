# Carousel Studio Production-Ready Implementation Checklist

This checklist tracks the end-to-end upgrade of Carousel Studio into a production-ready workspace for creating, editing, reviewing, organizing, exporting, and publishing social media carousels.

---

## Phase 1: Canonical Document Model, Persistence & Stable Editor Route
- [x] Establish canonical `CarouselDocument` & `CarouselSlideItem` types with stable slide IDs.
- [x] Implement `document-service.ts` for Firestore CRUD with optimistic concurrency control and revisions.
- [x] Implement debounced autosave API `/api/carousels/save` and document fetch `/api/carousels/[id]`.
- [x] Build stable editor route `/dashboard/carousels/[id]/edit`.
- [x] Ensure backward compatibility with existing legacy flattened/image-only carousels.
- [x] Verification & Tests: Verified draft creation, autosave, recovery after refresh, and revision creation.

---

## Phase 2: Professional Carousel Library Redesign
- [x] Redesign `carousels-hub.tsx` with header, search, and status tabs (All, Drafts, In review, Scheduled, Published, Archived).
- [x] Implement brand, campaign, and platform filters with real total counts.
- [x] Replace fixed 60-item limit with cursor-based pagination / incremental loading.
- [x] Upgrade carousel cards: Aspect-ratio cover preview, title, slide count, status badge, platform badges, last edited time.
- [x] Implement card action menu: Rename, Duplicate as draft, Move to folder/campaign, Tags, History, Preflight, Export, Archive/Delete.
- [x] Implement batch action bar: Multi-select, Batch Move, Batch Tag, Batch Archive, Batch ZIP export.
- [x] Verification & Tests: Verified search, pagination, card actions, and batch operations.

---

## Phase 3: Structured Visual Editor & Slide Canvas
- [x] Implement 3-column responsive layout (`studio-container.tsx`): Left slide navigator, Center slide canvas, Right inspector.
- [x] Build high-fidelity rendering engine (`slide-canvas.tsx`) supporting 1:1 (Square), 4:5 (Portrait), 9:16 (Story) aspect ratios.
- [x] Implement slide operations: Add, duplicate, reorder (drag & keyboard accessible), delete, lock elements with stable IDs.
- [x] Implement full in-session Undo/Redo stack.
- [x] Slide Inspector: Typography (font family, weight, size, alignment, line height), colors, background media/crop/opacity, layout presets.
- [x] Deck Inspector: Global theme styling, brand kit applicator, safe zone guides toggle, slide numbering toggle.
- [x] Studio Toolbar: Inline title editing, save status pill (Saved/Saving/Unsaved/Failed), Preflight check, Review, Export, Schedule actions.
- [x] Verification & Tests: Tested slide reordering, text edits, undo/redo, and responsive panel views.

---

## Phase 4: Visual Template Gallery & Workspace Brand Kits
- [x] Upgrade templates (`carousel-templates.ts`) with structured slide definitions for 10 curated use cases.
- [x] Upgrade `carousel-templates-grid.tsx` with multi-slide visual previews, category filters, and "Use Template" action.
- [x] Build workspace Brand Kit manager (`brand-kits.ts`, `/api/carousels/brand-kits`) supporting palettes, fonts, logos, handles, and WCAG AA contrast validation.
- [x] Support saving any deck as a custom workspace template.
- [x] Verification & Tests: Applied brand kits to templates and verified dynamic re-skinning and WCAG contrast feedback.

---

## Phase 5: Preflight Validation, Dimension-Exact Export & Scheduling Handoff
- [x] Build Preflight engine (`preflight.ts`, `preflight-modal.tsx`) checking contrast ratio, mobile font size, text overflow, safe zones, missing assets, and unrendered edits.
- [x] Build Export Service (`export-service.ts`, `export-modal.tsx`):
  - Multi-page PDF generation with exact canvas dimensions (1:1, 4:5, 9:16).
  - High-res PNG ZIP export with ordered filenames (`01-hook.png`, etc.).
  - Single-slide PNG download.
- [x] Repair and enhance scheduling handoff to `/dashboard/posts/create`:
  - Transfer entire ordered deck of image URLs, aspect ratio, caption, and schedule timestamp.
  - Bidirectional link updating carousel status to `scheduled` or `published` once confirmed.
- [x] Verification & Tests: Verified PDF/PNG ZIP export dimensions and scheduler handoff payload.

---

## Phase 6: Revision-Based Client Review & Approvals
- [x] Build public tokenized review portal (`/review/carousel/[token]`):
  - Read-only slide deck viewer.
  - Slide-specific pinned comments and deck-level comments.
  - Guest display name entry or authenticated reviewer.
  - Approve Revision / Request Changes actions.
- [x] Review API (`/api/carousels/review`):
  - Generate/revoke unguessable review links.
  - Invalidate approval when material changes are made in a new revision.
- [x] Verification & Tests: Tested token generation, comment creation, approval submission, and edit invalidation.

---

## Phase 7: Content Repurposing & Surgical AI Refinements
- [x] Build Repurpose Service (`repurpose.ts`, `/api/carousels/repurpose`):
  - Ingest pasted text, public URL (with SSRF protection), or uploaded documents.
  - Generate an editable Outline step (Hook, Progression, Body, CTA) before slide creation.
- [x] Per-slide surgical AI actions: Rewrite slide, Shorten text, Punch up hook, Suggest CTAs, Translate (with Arabic RTL safe zone adjustment).
- [x] Automatic social caption generator.
- [x] Verification & Tests: Verified URL safety, outline generation, and surgical single-slide replacement.

---

## Phase 8: Campaigns, Folders, Bulk Operations & Analytics Rigor
- [x] Implement Campaign & Folder service (`campaign-service.ts`, `/api/carousels/folders`): Create, rename, delete folders without losing carousels.
- [x] Upgrade Carousel Analytics (`carousel-analytics-view.tsx`):
  - Honest data states (Not Synced, Zero, Sync Failed, Stale timestamp).
  - Platform-specific breakdowns.
- [x] Upgrade A/B Variant Comparison (`carousel-ab-compare-view.tsx`, `/api/carousels/duplicate`):
  - Duplicate carousel into variant B.
  - Statistical significance indicators with sample size warnings.
- [x] Verification & Tests: Verified folder filtering, analytics error handling, and A/B comparison calculations.

---

## Phase 9: Full Verification, Polish & Git Auto-Push
- [x] Run full typecheck (`npx tsc --noEmit` -> 0 errors).
- [x] Run test suite (`npm run test:run` -> 95 test files passed, 807/807 tests passed).
- [x] Stage and commit all task-related changes.
- [x] Push commits to `origin/main`.
