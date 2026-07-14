"""
Diagnose the live Trustiify deployment (trustiify.agency) for missing env vars.

Hits /api/diagnostics/firebase-envs and reports exactly which secrets are
missing, with the specific reason (env var empty, private key lacks BEGIN
marker, etc.). Run from any shell — no auth required unless
DIAGNOSTICS_API_KEY is set on the server.

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

    if isinstance(body, dict) and body.get("ok"):
        print("OK — all Firebase envs are set and the private key looks valid.")
        print(f"  - project_id set:    {body.get('projectIdSet')}")
        print(f"  - client_email set:  {body.get('clientEmailSet')}")
        print(f"  - private_key set:   {body.get('privateKeySet')}")
        print(f"  - key valid PEM:     {body.get('privateKeyLooksValid')}")
        fp = body.get("privateKeyFingerprint")
        if fp:
            print(f"  - key fingerprint:   {fp}…")
        print(f"\nIf API routes still return 401, your session cookie may be stale. Re-login.")
        return 0

    # Failure path: render an actionable checklist.
    print("PROBLEM: Firebase env vars are not correctly configured on the server.\n")

    missing = body.get("missing", []) if isinstance(body, dict) else []
    if missing:
        print("Missing or empty env vars:")
        for name in missing:
            print(f"  - {name}")
        print()

    if isinstance(body, dict):
        if body.get("privateKeySet") and not body.get("privateKeyLooksValid"):
            print("FIREBASE_PRIVATE_KEY is set but does not look like a valid PEM.")
            print("Common causes:")
            print("  - The literal \\n is missing (paste from .env.local preserves \\\\n)")
            print("  - The BEGIN/END markers got trimmed by hPanel")
            print("  - Whitespace at the start/end of the value")
            print()
            print("Fix: paste the value exactly as it appears in .env.local, including")
            print("the surrounding double-quotes if present. After editing, redeploy.")
            print()

    print("How to fix:")
    print("  1. Log in to hPanel → Advanced → Environment variables")
    print("  2. Copy the 3 Firebase vars (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)")
    print(f"     from .env.local. See {body.get('docsHint', 'docs/hpanel-env-paste.md')}.")
    print("  3. Save. Hostinger should auto-redeploy; if not, click 'Restart'.")
    print("  4. Re-run this script.")
    print()
    print("Until then, all API routes requiring a session will return 401,")
    print("which is why the dashboard shows 'Loading...' / 'Unauthorized'.")

    return 2


if __name__ == "__main__":
    sys.exit(main())