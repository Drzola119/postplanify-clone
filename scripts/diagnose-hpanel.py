"""
Diagnose the live Trustiify deployment (trustiify.agency) for missing env vars.

Hits /api/diagnostics/firebase-envs and reports exactly which secrets are
missing, with the specific reason (env var empty, private key lacks BEGIN
marker, private key is the placeholder text, etc.). Run from any shell —
no auth required unless DIAGNOSTICS_API_KEY is set on the server.

Usage:
    python scripts/diagnose-hpanel.py
    python scripts/diagnose-hpanel.py --base https://trustiify.agency
    python scripts/diagnose-hpanel.py --base http://localhost:3000
"""

import argparse
import json
import sys
import urllib.request
import urllib.error


def main() -> int:
    parser = argparse.ArgumentParser(description="Diagnose Trustiify hPanel env vars")
    parser.add_argument(
        "--base",
        default="https://trustiify.agency",
        help="Base URL to probe (default: https://trustiify.agency)",
    )
    args = parser.parse_args()

    url = f"{args.base.rstrip('/')}/api/diagnostics/firebase-envs"
    print(f"Probing {url}\n")

    try:
        req = urllib.request.Request(url, headers={"accept": "application/json"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        status = e.code
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = {"error": e.reason}
    except urllib.error.URLError as e:
        print(f"ERROR: could not reach {url}: {e.reason}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"ERROR: unexpected failure: {e}", file=sys.stderr)
        return 1

    print(f"HTTP {status}\n")

    # Body is whatever the endpoint returned. Pull every field we know about.
    def _b(name: str):
        return body.get(name) if isinstance(body, dict) else None

    is_ok = bool(_b("ok"))
    placeholder = bool(_b("privateKeyLooksLikePlaceholder"))
    private_key_valid = bool(_b("privateKeyLooksValid"))
    private_key_set = bool(_b("privateKeySet"))
    project_id_set = bool(_b("projectIdSet"))
    client_email_set = bool(_b("clientEmailSet"))
    fp = _b("privateKeyFingerprint")
    missing = _b("missing") or []
    docs_hint = _b("docsHint") or "docs/hpanel-env-paste.md"

    print(f"  - project_id set:           {project_id_set}")
    print(f"  - client_email set:         {client_email_set}")
    print(f"  - private_key set:          {private_key_set}")
    print(f"  - private_key is real PEM:  {private_key_valid}")
    if placeholder:
        print("  - private_key is PLACEHOLDER TEXT, not a real PEM  <-- THE BUG")
    if fp:
        print(f"  - key fingerprint:          {fp}…")
    print()

    if is_ok:
        print("OK — all Firebase envs are set and the private key looks valid.")
        print()
        print("If API routes still return 401, your session cookie may be stale. Re-login.")
        print("If a fresh login still 401s, run:")
        print("  curl -s https://trustiify.agency/api/diagnostics/firebase-envs | jq")
        print("and compare the fingerprint to the one in your local .env.local.")
        return 0

    # Failure path: render an actionable checklist.
    print("PROBLEM: Firebase env vars are not correctly configured on the server.\n")

    if missing:
        print("Missing or invalid env vars:")
        for name in missing:
            print(f"  - {name}")
        print()

    if placeholder:
        print("THE PRIVATE KEY IS THE PLACEHOLDER TEXT, NOT A REAL PEM.")
        print("This is the #1 reason every API route returns 401.")
        print()
        print("Symptom: every page shows 'Loading...' or 401, log-out/log-in does NOT help,")
        print("and /api/diagnostics/firebase-envs used to return 'ok: true' (it was lying —")
        print("the old check looked for the placeholder string instead of a real PEM).")
        print()
        print("Fix:")
        print("  1. Open your local .env.local and find the line:")
        print('     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"')
        print("  2. Copy the WHOLE line including the surrounding double-quotes.")
        print("  3. Log in to hPanel -> Advanced -> Environment variables.")
        print("  4. Paste the value EXACTLY (preserve the \\n sequences, don't replace them).")
        print(f"  5. Save, then re-run: python scripts/diagnose-hpanel.py")
        print(f"     See {docs_hint} for screenshots and the exact paste procedure.")
        print()
        return 2

    if private_key_set and not private_key_valid:
        print("FIREBASE_PRIVATE_KEY is set but does not look like a valid PEM.")
        print("Common causes:")
        print("  - The literal \\n is missing (paste from .env.local preserves \\\\n)")
        print("  - The BEGIN/END markers got trimmed by hPanel")
        print("  - Whitespace at the start/end of the value")
        print("  - You rotated the key in Firebase console but didn't update hPanel")
        print()
        print("Fix: paste the value exactly as it appears in .env.local, including")
        print("the surrounding double-quotes if present. After editing, redeploy.")
        print()

    print("How to fix:")
    print("  1. Log in to hPanel -> Advanced -> Environment variables")
    print("  2. Copy the 3 Firebase vars (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)")
    print(f"     from .env.local. See {docs_hint}.")
    print("  3. Save. Hostinger should auto-redeploy; if not, click 'Restart'.")
    print("  4. Re-run this script.")
    print()
    print("Until then, all API routes requiring a session will return 401,")
    print("which is why the dashboard shows 'Loading...' / 'Unauthorized'.")

    return 2


if __name__ == "__main__":
    sys.exit(main())