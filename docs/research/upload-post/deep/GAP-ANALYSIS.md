# Trustiify vs Upload-Post.com — Full-Platform Gap Analysis

**Date:** 2026-07-15
**Source:** Playwright deep exploration (`scripts/deep-explore.js`, persistent profile copied)
**Pages visited:** /dashboard, /shorts, /calendar, /analytics, /users, /apikeys, /pricing, /docs, /docs/api, /n8n-templates, /welcome
**Artifacts:** `docs/research/upload-post/deep/01-*.json` + `01-*.png`

---

## Top-level: page parity

| Upload-post page | Trustiify equivalent | Status |
|---|---|---|
| `/dashboard` (composer wizard) | `/dashboard/posts/create` | ✅ exists, but **missing cURL generator, AI copy, 3 upload methods, LinkedIn Documents** |
| `/shorts` (Shorts Uploader with AI captions) | — | ❌ **MISSING — no page exists** |
| `/calendar` (Month/Week/Day + platform filter) | — | ❌ **MISSING — no calendar page; trustiify has queue + history but no visual calendar grid** |
| `/analytics` (Global + per-profile, multi-platform) | `/dashboard/analytics` | ✅ exists; **missing "Reset Order" custom widget layout** |
| `/users` (managed users / profiles) | `/dashboard/accounts` | ✅ exists |
| `/apikeys` (API key management) | `/dashboard/api-keys` | ✅ exists |
| `/pricing` (4-tier with profile add-ons) | — | ❌ **MISSING — no public pricing page** |
| `/docs` + `/docs/api` | — | ❌ **MISSING — no public docs site** |
| `/n8n-templates` (workflow templates) | — | ❌ **MISSING — no templates library** |
| `/welcome` (onboarding quick-start) | — | ❌ **MISSING — no first-run onboarding** |

**Verdict:** Trustiify has solid composer + analytics + accounts + api-keys + queue + history + reports + inbox + automations + assets. The 5 missing top-level pages (Shorts, Calendar, Pricing, Docs, Welcome) are the structural gaps.

---

## Dashboard (composer) — feature parity

| Upload-post feature | Trustiify equivalent | Status |
|---|---|---|
| Profile picker with "Connected: tiktok, facebook, instagram, …" inline | Profile picker | ✅ exists |
| 3 upload methods: **Media File / Media URL(s) / Text-Only Post** | Single upload method | ❌ **MISSING — only Media URL supported** |
| **AI copy: Generate now** button with two modes (Generate now / Generate on upload) | — | ❌ **MISSING — no AI caption generator** |
| Title field with platform-override hint ("You can override per platform via fields like instagram_title, instagram_description, …") | Title field | ⚠️ exists, **no per-platform override hint** |
| First Comment field (works on IG/FB/Threads/Bluesky/Reddit/X/YT/LinkedIn) | First Comment field | ✅ exists (just shipped in earlier session per memory) |
| 13-platform checkbox list with per-platform handle | Platform selector | ⚠️ exists, **only 9 platforms; missing Reddit, Discord, Telegram, Google Business** |
| **cURL generator** (live preview of equivalent API call) | — | ❌ **MISSING — no cURL preview** |
| **LinkedIn Documents** upload method | — | ❌ **MISSING — only media URLs** |
| 50+ timezone selector (Africa/Lagos set as user's TZ) | Single timezone from profile | ⚠️ exists in different shape |
| "Add to Queue" with **Configure queue** link | Queue submission | ✅ exists |
| Post preview pane (live render per platform card) | Per-platform caption cards | ✅ exists (this is what we just upgraded) |
| Live character counter per platform card | Per-platform caption cards | ✅ exists |
| **AI content disclosure** toggle per platform (TikTok AI-generated, YouTube synthetic media) | TikTok `tiktok_ai_generated_content`, YouTube `youtube_synthetic_media` | ✅ added in this session |

---

## Shorts Uploader — entire page missing

| Feature | Trustiify equivalent | Status |
|---|---|---|
| Dedicated `/shorts` page | — | ❌ |
| **AI caption generator** with 12 languages (Auto-detect / English / Spanish / Portuguese / French / German / Italian / Japanese / Chinese / Korean / Arabic / Hindi / Russian) | — | ❌ |
| One-click multi-platform short-form publish (YouTube Shorts / IG Reels / TikTok / FB Reels) | Composer (manual caption) | ⚠️ functional but no AI caption |
| File picker (MP4 / MOV / WebM, max 100 MB) | Media URL only | ❌ no file picker |

**This is a clear product gap.** AI-generated multilingual captions is a premium feature on upload-post. Trustiify could win here with a Groq-backed AI caption generator (Groq is already in the stack — see [inbound webhook handler](src/app/api/webhooks/inbound/[source]/route.ts) using Groq per memory).

---

## Calendar — entire page missing

| Feature | Trustiify equivalent | Status |
|---|---|---|
| Dedicated `/calendar` page | — | ❌ (trustiify has `/dashboard/posts/history` and `/dashboard/queue` but no visual calendar grid) |
| View modes: **Month / Week / Day** (Fr: Mois/Semaine/Jour) | — | ❌ |
| Platform filter (all 13 platforms with badges) | — | ❌ |
| Profile filter dropdown | — | ❌ |
| "Create" button to drop a new post on a time slot | Queue form (modal) | ⚠️ modal-based, not inline |
| 12am-11pm hourly grid | — | ❌ |
| Per-post preview card on calendar slot | — | ❌ |
| Drag-and-drop reschedule | — | ❌ |

**This is a big visible gap.** Most social schedulers have a calendar view — Hootsuite, Buffer, Later all do. trustiify users have to use the queue list, which is harder to reason about.

---

## Analytics — 95% there

| Upload-post feature | Trustiify equivalent | Status |
|---|---|---|
| Period selector: Last 7 days / 30 / 90 / 365 / Custom | Custom date range picker | ⚠️ less granular |
| Global Analytics (aggregated across selected profiles) | Workspace-level overview | ✅ |
| Per-profile analytics cards | Per-platform analytics | ✅ |
| Per-platform filtering with checkboxes (IG / FB / LinkedIn / YT / Threads / Pinterest / TikTok / X) | Platform filter | ✅ |
| KPI tiles: Followers / Reach / Impressions / Views / Accounts Engaged | Followers / Engagement rate / Impressions / Likes / Comments / Shares / Clicks / Posts Published | ⚠️ different metrics, but similar coverage |
| **Reset Order** — drag-and-drop widget reordering | — | ❌ no widget reordering |
| Daily reach / impressions line chart | Time-series charts | ✅ (per [analytics page parity task](project-analytics-parity-task.md)) |
| "Having trouble with analytics?" troubleshooting banner that links to User Management | Error state only | ⚠️ has error state but no proactive reconnect CTA |
| Historical data limitations note | — | ⚠️ |

---

## Shorts Uploader — concrete spec for adding

If we want to add this, here's the minimum:

### Pages to add
- `src/app/dashboard/shorts/page.tsx` — page shell
- `src/components/dashboard/shorts-uploader.tsx` — main component

### API to add
- `POST /api/ai/caption` — takes `{ mediaUrl, language, profileContext }`, returns `{ title, description }`. Uses Groq (`groq-sdk`) — Groq is already configured per env vars in memory.

### Behavior
1. User uploads video file (or provides URL)
2. Selects profile + target language (12 options from upload-post)
3. Server fetches the video/audio, transcribes via Groq Whisper, generates title + description via Llama
4. Returns to client for review/edit
5. User confirms → publish to selected short-form platforms (YT Shorts / IG Reels / TikTok / FB Reels)

### Cost
- Groq Whisper: ~$0.04/hr of audio
- Groq Llama 3.3 70B for caption: ~$0.50 per 1M tokens
- One caption generation: ~$0.001–0.005 per video

This is a feature that could justify a paid tier lift ($5-10/mo on top of basic).

---

## Calendar — concrete spec for adding

### Pages to add
- `src/app/dashboard/calendar/page.tsx` — page shell
- `src/components/dashboard/calendar/month-view.tsx`
- `src/components/dashboard/calendar/week-view.tsx`
- `src/components/dashboard/calendar/day-view.tsx`
- `src/components/dashboard/calendar/post-card.tsx` — the chip on the grid

### Library options
- **FullCalendar React** (`@fullcalendar/react`) — has Month/Week/Day built-in, drag-drop extension, ~150KB gzipped
- **React Big Calendar** — lighter, custom rendering, drag-drop via `react-dnd`
- **Custom (CSS grid)** — lightest, but most work

My recommendation: **FullCalendar** — pre-built interactions, themeable, well-maintained.

### Behavior
1. View modes: Month / Week / Day toggles (default Week)
2. Platform filter (all 13)
3. Profile filter
4. Click empty slot → opens composer with prefilled scheduledAt
5. Click post card → opens post editor
6. Drag post card → reschedule (PATCH /api/posts/[id])
7. Click "Create" button → opens composer in modal

### Data source
- Query `posts` collection filtered by `workspaceId` + `scheduledAt >= rangeStart` + `scheduledAt < rangeEnd`
- Already supported by the existing `getPosts` function (need to verify range filter)

---

## Pricing — entire public page missing

| Upload-post tier | Trustiify equivalent | Status |
|---|---|---|
| **Free** (1 profile, 10 uploads/mo) | — | ❌ |
| **Basic** ($24/mo, 5 profiles) | — | ❌ |
| **Professional** ($50/mo, 25 profiles, white-label) | — | ❌ |
| **Advanced** ($147/mo, 75 profiles, 5 seats, priority support) | — | ❌ |
| **Business** ($438/mo, 225 profiles, scalable) | — | ❌ |
| **Add-on profiles** ($15-25/mo for 5-10 extra) | — | ❌ |
| **X (Twitter) links add-on** ($19/mo) | — | ❌ |
| **FFmpeg video editor API** (300-10000 min/mo) | — | ❌ |
| **AI Shorts Uploader analyses** (100-1000/mo) | — | ❌ |
| **Seats** (1-10 per tier) | Workspace members (unlimited) | ⚠️ different model |
| Monthly/Yearly toggle (40% savings) | — | ❌ |
| Stripe integration | — | ❌ (per memory: Stripe is in the **live** PostPlanify stack, not in this clone) |

**Verdict:** trustiify has no monetizable pricing tier model. This is more of a "post-MVP" gap but worth flagging.

---

## Docs — entire public site missing

| Upload-post section | Trustiify equivalent | Status |
|---|---|---|
| `/docs` (general docs) | — | ❌ |
| `/docs/api` (API reference with parameters) | — | ❌ |
| `/n8n-templates` (workflow templates) | — | ❌ |
| LLM-friendly docs (.txt) for AI tool ingestion | — | ❌ |
| cURL / JavaScript / Python code samples per endpoint | — | ❌ |
| Official libraries (Python pip + Node.js npm) | — | ❌ |
| MCP server ("New" badge on upload-post) | — | ❌ |

**This is a massive gap for developer adoption.** Upload-post positions itself as "API-first, no scraping" — trustiify doesn't yet have a public-facing developer story.

---

## Welcome / Onboarding — missing

| Upload-post feature | Trustiify equivalent | Status |
|---|---|---|
| First-run welcome page | — | ❌ (trustiify redirects logged-in users straight to dashboard) |
| "Top content" performance summary in first 10 days | — | ❌ |
| Quick-start integrations (Code / Whitelabel / n8n / Make / Zapier / Airtable / MCP) | — | ❌ |
| Inline cURL / JS / Python samples in onboarding | — | ❌ |
| "Connect your accounts, generate an API key" checklist | — | ❌ |

---

## Concrete action list (prioritized)

### Tier 1 — Quick wins (1-3 days each)
1. **Calendar page** — biggest visible gap users notice. Use FullCalendar. Affects retention.
2. **3 upload methods in composer** — currently only media URL. Add file upload + text-only post.
3. **Per-platform title/description override hints** — small UI touch, big UX win.
4. **AI copy generator (Groq)** — huge differentiator vs Hootsuite/Buffer.

### Tier 2 — Feature pages (1-2 weeks each)
5. **Shorts Uploader page** — AI captions + 12 languages. Premium feature.
6. **Pricing page** — 4 tiers + add-ons + Stripe. Monetization enabler.
7. **Public docs site** — `/docs`, `/docs/api`, code samples, LLM-friendly txt. Developer adoption.

### Tier 3 — Polish (varies)
8. **Welcome onboarding** — first-run quick-start.
9. **Analytics widget reordering** — drag-and-drop. Small QoL.
10. **n8n-templates library** — workflow marketplace.

---

## What's NOT a gap (trustiify already wins here)

- **Composer per-platform caption cards** — trustiify is now EQUAL to upload-post after this session's 16-field addition.
- **Per-platform advanced options panel** — trustiify's `AdvancedOptionsPanel` is more developer-friendly than upload-post's (categorized core/advanced, showWhen conditions).
- **Reports page** — trustiify has reports with template selector + PDF (per plan). Upload-post doesn't surface this.
- **Inbox** — trustiify has inbox. Upload-post doesn't have one.
- **DM Automations** — trustiify has this. Upload-post doesn't.
- **Link in Bio** — trustiify has this. Upload-post doesn't.
- **Brands, Labels, Hashtags** — trustiify has these organized assets. Upload-post doesn't.
- **Bulk Schedule** — trustiify has bulk-schedule page. Upload-post has queue add but no bulk.

**Net assessment:** Trustiify has STRONGER post-publish workflow (reports, inbox, automations, brand management) but WEAKER pre-publish UX (no calendar, no AI, no Shorts Uploader, no public docs/pricing).

---

## File locations to edit if implementing

- `src/app/dashboard/calendar/page.tsx` — new
- `src/app/dashboard/shorts/page.tsx` — new
- `src/app/(public)/pricing/page.tsx` — new
- `src/app/(public)/docs/page.tsx` — new
- `src/app/(public)/docs/api/page.tsx` — new
- `src/app/(public)/welcome/page.tsx` — new (first-run only)
- `src/components/dashboard/calendar/*` — new components
- `src/components/dashboard/shorts-uploader.tsx` — new
- `src/app/api/ai/caption/route.ts` — new (Groq)
- `src/components/dashboard/post-composer.tsx` — add 3 upload methods (file/url/text)
- `src/app/dashboard/analytics/page.tsx` — add "Reset Order" drag-drop