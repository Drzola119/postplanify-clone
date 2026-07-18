"""Launch a persistent headed Chrome window that stays open indefinitely.

Reuses the user's persistent profile so existing logins (trustiify.agency,
etc.) are preserved. Lands on /dashboard by default. Waits forever until the
user asks Claude to close it or run more commands.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = Path(r"C:\Users\zicko\.playwright-persistent-profile")
START_URL = "https://trustiify.agency/dashboard"


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
        print(f"[open_browser] Navigating to {START_URL}", flush=True)
        try:
            page.goto(START_URL, wait_until="domcontentloaded", timeout=30000)
        except Exception as e:
            print(f"[open_browser] goto error: {e}", flush=True)
        print(f"[open_browser] Browser is OPEN. Current URL: {page.url}", flush=True)
        print(f"[open_browser] Stays open until you tell Claude to close it.", flush=True)

        # Heartbeat every 30s so it's obvious the script is still alive.
        tick = 0
        try:
            while True:
                time.sleep(30)
                tick += 1
                try:
                    url = page.url
                except Exception:
                    url = "(page detached)"
                print(f"[open_browser] tick={tick} url={url}", flush=True)
        except KeyboardInterrupt:
            pass
        finally:
            try:
                ctx.close()
            except Exception:
                pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
