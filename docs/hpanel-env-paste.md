# Hostinger hPanel env vars — paste guide

The deployed site at `trustiify.agency` is missing several env vars that the
local `.env.local` has. Until they're pasted into hPanel, every protected API
endpoint returns **401 Unauthorized** (because `getCurrentUser()` from
`src/lib/firebase/admin.ts` can't initialize the admin SDK without these
secrets).

## ⚠️ THE #1 BUG: placeholder text in `FIREBASE_PRIVATE_KEY`

If `.env.local` (and therefore hPanel) has the line:

```
FIREBASE_PRIVATE_KEY="[REDACTED PRIVATE KEY]\n"
```

…then `src/lib/firebase/admin.ts` falls back to using that literal placeholder
string as the admin SDK key. Every session-cookie verification fails, and the
diagnostic endpoint at `/api/diagnostics/firebase-envs` *used to lie about it*
(returned `ok: true`) because its PEM-validity check looked for the placeholder
text instead of real `-----BEGIN PRIVATE KEY-----` markers.

**Symptom:** every page shows "Loading…" or 401, log-out/log-in does **NOT** help.

**Fix:** paste the real PEM into hPanel — see steps 1–5 below.

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
5. Run `python scripts/diagnose-hpanel.py` from the project root. It should
   print "OK — all Firebase envs are set and the private key looks valid."
   If it still complains, jump to the troubleshooting section below.

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

## Troubleshooting

### `python scripts/diagnose-hpanel.py` says `privateKeyLooksLikePlaceholder: true`

That means `FIREBASE_PRIVATE_KEY` in hPanel is still the literal string
`[REDACTED PRIVATE KEY]`. You didn't paste the real PEM.

1. Find your Firebase service account JSON: Firebase Console → Project
   Settings → Service Accounts → "Generate new private key". This downloads
   a JSON file. Open it and copy the value of `private_key` — it looks
   like:
   ```
   -----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ...\n-----END PRIVATE KEY-----\n
   ```
2. In hPanel, delete the existing `FIREBASE_PRIVATE_KEY` row.
3. Paste the value **with the surrounding double-quotes** and **without
   removing the literal `\n` sequences**. hPanel treats `\n` as the two
   characters backslash + n, not a newline — that's correct, the Node app
   unescapes them at startup.
4. Save. Wait ~30s for hPanel to redeploy.
5. Re-run `python scripts/diagnose-hpanel.py`.

### Re-logging-in keeps returning 401

That means the env is OK but the **session cookie was signed with a
DIFFERENT Firebase project** than the one currently in hPanel. Two ways
this can happen:

- You rotated the Firebase service account (Firebase Console → Service
  Accounts → Generate new private key) and updated hPanel, but old
  cookies issued by the old key are now invalid.
- The `FIREBASE_PROJECT_ID` in hPanel doesn't match the project the user
  originally logged in with (rare; usually a typo).

Fix: log out (clears the cookie), then log in again. The next cookie will
be signed by the current key. If a fresh login still 401s, the env still
has the wrong key — run the diagnose script.

### `verifySessionCookie` is rejecting tokens with "session cookie has been revoked"

You're hitting the strict-revocation path. The Firebase Admin SDK was
configured with strict revocation checks, which require a network call
to Firebase on every verify. If Firebase is unreachable (network blip,
firewall, regional outage), every cookie fails.

The current code in `src/lib/firebase/admin.ts` passes `true` as the
second argument to `verifySessionCookie` only when the strict check
succeeds. If you see a spike of these errors during a Firebase outage,
temporarily disable strict checks by setting
`FIREBASE_AUTH_STRICT_REVOCATION=false` in hPanel (or just keep retrying
— they're usually transient).
