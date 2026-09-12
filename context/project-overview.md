# PostPlanify Project Overview

## Summary

PostPlanify is a multi-tenant social-media management platform for creators, agencies, and teams. It brings content creation, media management, scheduling, publishing, analytics, inbox operations, reporting, automation, and AI-assisted workflows into one workspace across thirteen social platforms.

## Product goals

1. Let a signed-in user create and manage content from draft through delivery.
2. Publish or schedule platform-correct content without hiding unsupported capabilities.
3. Keep every tenant's data, credentials, quotas, and operations isolated by workspace.
4. Give teams one coherent view of accounts, calendars, delivery status, analytics, and conversations.
5. Use AI to assist creative work while keeping validation, security, and delivery deterministic.
6. Remain operable in production: failures are observable, retryable where safe, and represented honestly.

## Primary users

- Creators and small businesses managing their own channels.
- Agencies managing multiple brands or client workspaces.
- Workspace owners and administrators managing access, billing, and settings.
- Editors preparing and scheduling content.
- Viewers and stakeholders reviewing content, analytics, and reports.
- Platform administrators monitoring system health and background work.

## Core flows

1. Authenticate with Firebase and resolve an authorized workspace.
2. Connect or discover social accounts through the publishing provider.
3. Create media and captions, or reuse assets from the library.
4. Validate content against the selected platforms' capabilities and limits.
5. Save a draft, publish immediately, or persist a scheduled post.
6. Let the queue claim due work, submit it to the publishing provider, and reconcile final delivery.
7. Notify users and emit webhooks from truthful persisted outcomes.
8. Sync inbox and analytics data into workspace-scoped views.
9. Generate and refine carousels, infographics, images, and videos through bounded creative workflows.

## Success criteria

- A user can only read or mutate data for a workspace they are authorized to access.
- All thirteen catalog platforms preserve their identity throughout UI, validation, persistence, and reporting.
- Unsupported provider features are shown as unsupported, never fabricated or silently mapped to another platform.
- Scheduled delivery is idempotent, claim-safe, recoverable after interruption, and does not equate provider acknowledgement with successful publication.
- Every external call has validation, bounded failure handling, and useful operational logging.
- New feature units pass their explicit acceptance checklist plus the repository verification gates.
- Light and dark themes, responsive layouts, accessibility, and English/French/Arabic directionality remain coherent.

## Deliberately out of scope for the architecture adoption phase

- Replacing Firebase/Firestore, UploadPost, Next.js, or the existing deployment model.
- Rewriting the application into microservices.
- Copying Ghost AI's Clerk, Prisma/Postgres, Liveblocks, React Flow, Trigger.dev, or Vercel Blob stack when the product does not need those tools.
- Broad visual redesigns or unrelated feature work.
- Claiming a social platform capability that the upstream provider does not support.

## Product source of truth

The repository and its tests describe the current product. This document describes product intent. If they conflict, record the discrepancy in `context/progress-tracker.md` and resolve it in a scoped feature spec instead of silently choosing one.
