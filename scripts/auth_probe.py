"""Quick auth probe to verify hPanel Firebase env vars are working."""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = Path(r"C:\Users\zicko\.playwright-persistent-profile")
BASE = "https://trustiify.agency"


def main() -> int:
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE),
            headless=True,
            channel="chrome",
            viewport={"width": 1440, "height": 900},
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = ctx.new_page()
        api_results: list[dict] = []

        def on_response(resp):
            if "/api/" in resp.url:
                try:
                    api_results.append({"url": resp.url, "status": resp.status})
                except Exception:
                    pass

        page.on("response", on_response)

        page.goto(f"{BASE}/dashboard", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_load_state("networkidle", timeout=15000)
        import time as _t
        _t.sleep(2)

        # Read session cookie presence
        cookies = ctx.cookies()
        session_cookie = next((c for c in cookies if c["name"] in ("__session", "session")), None)

        print(f"=== Auth probe ===")
        print(f"  final URL: {page.url}")
        print(f"  session cookie present: {bool(session_cookie)}")
        if session_cookie:
            print(f"    name={session_cookie['name']} domain={session_cookie.get('domain')} expires={session_cookie.get('expires')}")

        # Categorize API results
        auth_apis = [r for r in api_results if r["status"] == 401]
        ok_apis = [r for r in api_results if r["status"] == 200]
        other_apis = [r for r in api_results if r["status"] not in (200, 401)]
        print(f"\n  API calls captured: {len(api_results)}")
        print(f"    200 OK: {len(ok_apis)}")
        print(f"    401 Unauthorized: {len(auth_apis)}")
        print(f"    other: {len(other_apis)}")
        print(f"\n  Sample 200s:")
        for r in ok_apis[:5]:
            print(f"    {r['status']} {r['url']}")
        print(f"\n  Sample 401s:")
        for r in auth_apis[:5]:
            print(f"    {r['status']} {r['url']}")
        if other_apis:
            print(f"\n  Sample others:")
            for r in other_apis[:5]:
                print(f"    {r['status']} {r['url']}")

        ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
