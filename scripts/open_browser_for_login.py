"""Launch a persistent Chrome window for the user to log in.

Stays open for ~5 minutes so the user can log in. After that, Playwright
auto-detects when auth is ready by polling for a dashboard URL.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = Path(r"C:\Users\zicko\.playwright-persistent-profile")
TARGET = "https://trustiify.agency/login"
AUTH_MARKER = "/dashboard"


def main() -> int:
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE),
            headless=False,
            channel="chrome",
            viewport={"width": 1440, "height": 900},
            args=["--disable-blink-features=AutomationControlled", "--start-maximized"],
        )
        page = ctx.new_page()
        print(f"[open_browser] Opening {TARGET}")
        page.goto(TARGET, wait_until="domcontentloaded")
        print(f"[open_browser] Browser is OPEN. Log in to trustiify.agency.")
        print(f"[open_browser] This window will stay open up to 5 minutes.")
        print(f"[open_browser] Polling every 5s for auth-success (URL contains /dashboard)...")

        start = time.time()
        deadline = start + 300  # 5 min
        authed = False
        while time.time() < deadline:
            try:
                url = page.url
            except Exception:
                url = ""
            if AUTH_MARKER in url and "/login" not in url:
                print(f"[open_browser] AUTH DETECTED — URL={url}")
                authed = True
                # Give them a few more seconds to land fully on the dashboard
                time.sleep(5)
                break
            time.sleep(5)

        # Persist cookies so headless re-run picks up the session
        cookies = ctx.cookies()
        Path("/tmp/playwright_cookies.json").write_text(json.dumps(cookies, indent=2))
        Path("/tmp/playwright_authed.txt").write_text("yes" if authed else "no")
        print(f"[open_browser] cookies saved: {len(cookies)} entries")
        print(f"[open_browser] authed: {authed}")
        print(f"[open_browser] Closing browser.")
        ctx.close()
    return 0 if authed else 1


if __name__ == "__main__":
    sys.exit(main())
