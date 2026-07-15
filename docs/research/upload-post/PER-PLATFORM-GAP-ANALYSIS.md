# Per-Platform Gap Analysis — Trustiify vs Upload-Post.com

**Date:** 2026-07-15
**Source:** upload-post.com dashboard screenshot (after uploading test image + checking all platforms) compared against `src/lib/publishing/advanced-options.ts`

## TikTok Options

| Upload-post field | Trustiify field | Status |
|---|---|---|
| Title | (global title field) | ✅ via composer |
| Duet (toggle) | `tiktok_disable_duet` | ✅ present (inverted — upload-post is "enable duet", trustiify is "disable duet") |
| Stitch (toggle) | `tiktok_disable_stitch` | ✅ present (same inverted polarity) |
| Comments (toggle) | `tiktok_disable_comment` | ✅ present (inverted polarity) |
| AI Generated Content | `tiktok_ai_generated_content` | ✅ present |
| Branded Content | `tiktok_brand_organic_toggle` | ⚠️ name differs ("Paid promotion" in trustiify) |
| Photo cover (radio) | `tiktok_photo_cover_index` | ⚠️ trustiify is a number index, upload-post is a radio |
| Commercial content | — | ❌ MISSING |
| Promote your own content | `tiktok_brand_content_toggle` | ⚠️ swapped names vs upload-post |
| Audience Control (Public/Friends/Followers) | `tiktok_privacy_level` | ✅ present |
| Promotional content (Paid) | — | ❌ MISSING (separate from branded) |
| TikTok Shop Promotion (radio) | — | ❌ MISSING |
| Branding Content License (radio) | — | ❌ MISSING |
| Spotify Link | — | ❌ MISSING |

**TikTok: 5 fields missing, 4 fields renamed/polarity-flipped.**

## Instagram Options

| Upload-post field | Trustiify field | Status |
|---|---|---|
| Post as Reel | `instagram_media_type` | ✅ present (via media_type=REELS) |
| Cover image URL | `instagram_cover_url` | ✅ present |
| Location ID | `instagram_location_id` | ✅ present |
| Instagram Shop Tag | — | ❌ MISSING |
| Trial Content Tag | — | ❌ MISSING |
| Collab poster (with Instagram) | — | ❌ MISSING |
| Instagram Partners Tag (paid partnership) | — | ❌ MISSING |
| Trial Reels - Trial | — | ❌ MISSING (trustiify only handles post-trial share behavior, not the "is this a trial reel" toggle) |
| Trial Reel Eligible Audience | — | ❌ MISSING |

**Instagram: 6 fields missing.** This is your biggest gap — Instagram's commercial features (shop, collab, paid partnership, trial reels) are entirely absent.

## Pinterest Options

| Upload-post field | Trustiify field | Status |
|---|---|---|
| Pinterest Board (Required) | `pinterest_board_id` | ✅ present |
| Pin link | `pinterest_link` | ✅ present |
| Pinterest Content Type (Standard/Idea Pin/Video Standard) | — | ❌ MISSING |
| Title (Required) | (global title) | ✅ via composer |
| Description (Optional) | (no per-platform description) | ⚠️ uses global title only |

**Pinterest: 1 critical field missing (content type).** Without `pinterest_content_type`, all uploads go as Standard pins — no Idea Pins, no Video Standard distinction.

## Facebook Options

| Upload-post field | Trustiify field | Status |
|---|---|---|
| Facebook Page (Required) | `facebook_page_id` | ✅ present |
| Facebook Page Album ID | — | ❌ MISSING |
| Facebook Page Form Type | — | ❌ MISSING (lead-gen forms) |
| Title | (global) | ✅ via composer |
| Description | — | ❌ MISSING (per-platform description override) |
| Media type (FEED/REELS/STORIES/VIDEO) | `facebook_media_type` | ✅ present |

**Facebook: 3 fields missing** (album, form type, per-platform description).

## X (Twitter) — likely similar gaps

Per trustiify existing fields (`twitter_*`), they cover:
- Long text as post
- Reply settings (everyone/following/mentioned)
- Community posting
- Location
- Nullcast
- Tagged users

Likely missing from upload-post (X has many options):
- X Articles
- X Polls
- Reply exclusions
- Quote tweet settings

## LinkedIn

Trustiify has minimal LinkedIn: only `linkedin_page_id` + `linkedin_visibility`. Likely missing:
- LinkedIn Articles
- LinkedIn Newsletters
- Company page targeting
- Industry restrictions

## Bluesky

Trustiify has only `bluesky_link_url`. Bluesky is simple — likely OK.

## Threads

Trustiify has only `threads_topic_tag`. Likely missing:
- Reply controls
- Quote post settings

---

## Top missing fields to add (ranked by impact)

1. **Instagram: 6 fields** — Shop Tag, Trial Content Tag, Collab poster, Partners Tag, Trial Reels toggle, Eligible Audience. Commercial/creator features.
2. **TikTok: 5 fields** — Commercial content, Promotional (Paid), TikTok Shop, Branding License, Spotify Link. Same commercial angle.
3. **Facebook: 3 fields** — Album ID, Form Type, per-platform description.
4. **Pinterest: 1 critical** — Content Type (Standard/Idea Pin/Video Standard).

Plus name/polarity alignment for the 4 existing TikTok fields so the UI matches what users see on upload-post.

---

## File locations to edit

- `src/lib/publishing/advanced-options.ts` — add the new `FieldSpec` entries per platform
- `src/lib/publishing/capability-matrix.ts` — possibly add new constraints
- `src/lib/validation/posts.ts` — ensure new fields pass through publish payload
- `src/components/dashboard/advanced-options-panel.tsx` — verify renderer handles all `FieldKind` types (text, switch, segmented, select, list, number, multiselect)
- `src/app/api/posts/publish/route.ts` — verify the n8n publish payload includes new fields
