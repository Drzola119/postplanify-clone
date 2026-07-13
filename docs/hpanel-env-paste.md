# Hostinger hPanel env vars — paste guide

The deployed site at `trustiify.agency` is missing several env vars that the
local `.env.local` has. Until they're pasted into hPanel, every protected API
endpoint returns **401 Unauthorized** (because `getCurrentUser()` from
`src/lib/firebase/admin.ts` can't initialize the admin SDK without these
secrets).

This fixes:
- 401s on `/api/posts`, `/api/workspaces`, `/api/inbox/*`, `/api/reports`,
  `/api/media-assets`, `/api/social-accounts/list`, `/api/ai/sentiment`,
  `/api/settings/notifications`, `/api/api-keys`, etc.

## How to paste

1. Open your local `.env.local` (do NOT commit it — it's gitignored).
2. Open Hostinger hPanel → your domain → **Node.js** tab (or "Environment
   Variables" if your plan groups them differently).
3. Copy each value verbatim from `.env.local` into the matching hPanel field.
4. Save. hPanel restarts the Node process automatically (~30s).

## Required vars (server-side, no `NEXT_PUBLIC_` prefix)

| Key | Notes |
|---|---|
| `FIREBASE_PROJECT_ID` | Exact match. |
| `FIREBASE_CLIENT_EMAIL` | Looks like `firebase-adminsdk-…@your-project.iam.gserviceaccount.com`. |
| `FIREBASE_PRIVATE_KEY` | **Paste verbatim** — keep the `\n` escapes as-is. hPanel is fine with multi-line secrets; do NOT manually unwrap them. |
| `GROQ_API_KEY` | Powers `/api/ai/caption`, `/api/ai/hashtags`, `/api/ai/alt-text`, `/api/ai/sentiment`, and the new auto-classify-on-ingest path. |
| `N8N_WEBHOOK_URL` | Where `posts/publish` posts the publish job. |
| `UPLOAD_POST_API_KEY` | Upload-post.com JWT for cross-posting. |
| `BUNNY_STORAGE_ZONE` | Bunny.net storage zone name (e.g. `postplanify-prod`). |
| `BUNNY_STORAGE_PASSWORD` | Bunny.net storage API password (FTP/API access). |
| `BUNNY_CDN_HOSTNAME` | Public CDN hostname (e.g. `cdn.postplanify.b-cdn.net`). |
| `BUNNY_PULL_ZONE_PASSWORD` | Optional — only if you use signed URLs. |
| `WEBHOOK_INBOUND_SECRET` | Random string used by `X-Webhook-Secret` on inbound comment handlers. Generate one with `openssl rand -hex 32` if not set. |
| `API_KEY_ENCRYPTION_KEY` | 32-byte base64. Used to encrypt API keys at rest in Firestore. Generate with `openssl rand -base64 32`. |
| `ANALYTICS_INGEST_SECRET` | Random string for `X-Ingest-Secret` header on `/api/analytics/ingest`. Generate with `openssl rand -hex 32` if not set. |

## Required vars (client-side, `NEXT_PUBLIC_` prefix)

| Key | Notes |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web SDK key. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com`. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same value as the server-side one. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `<project>.appspot.com`. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Numeric. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:…:web:…`. |

## Optional / nice-to-have

| Key | Effect |
|---|---|
| `WORKER_INTERVAL_MS` | Default 30000 (30s). How often the queue worker polls for due posts. |
| `SENTRY_DSN` | Server-side Sentry DSN (for API route errors, queue-worker failures, etc.). Generated in your Sentry project settings. Optional — leave unset to disable server error reporting. |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side Sentry DSN (for browser errors). Often the same value as `SENTRY_DSN` since Sentry projects have one DSN that works both sides. Optional. |
| `SENTRY_TRACES_SAMPLE_RATE` | Default `0.1` (10%). Reduce to lower Sentry quota burn. Only relevant if Sentry DSN is set. |
| `NEXT_PUBLIC_APP_URL` | Defaults to `https://trustiify.agency`. Only override for staging. |

## Verification after pasting

```bash
# Should return 200 with { ok: true }
curl -s https://trustiify.agency/api/health

# Should return 200 with empty workspaces list (or your 1 default) once authed
curl -s https://trustiify.agency/api/workspaces -b "session=<your-cookie>"

# Should return 200 with summary
curl -s -X POST https://trustiify.agency/api/ai/sentiment \
  -H "Content-Type: application/json" \
  -b "session=<your-cookie>" \
  -d '{"text": "I love this product!"}'
```

If `/api/health` still returns 503, the `getCurrentUser()` call in
`src/lib/firebase/admin.ts` is still throwing `MissingServerSecretError` —
double-check that hPanel saved the key exactly (especially `FIREBASE_PRIVATE_KEY`,
which is the most common paste error).
