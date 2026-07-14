"""Probe postplanify.com help system for content parity scope.

Uses the persistent profile (which may have postplanify.com session if you've
logged in there before). Dumps every Help/Learn page reachable.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = Path(r"C:\Users\zicko\.playwright-persistent-profile")
OUT = Path(r"C:\Users\zicko\Desktop\postplanify-clone-clean\docs\research\help")
OUT.mkdir(parents=True, exist_ok=True)


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
        # Try multiple candidate URLs
        candidates = [
            "https://postplanify.com/help",
            "https://postplanify.com/learn",
            "https://postplanify.com/dashboard",
            "https://postplanify.com/dashboard/help",
            "https://postplanify.com/dashboard/learn",
            "https://help.postplanify.com",
            "https://postplanify.com/help-center",
            "https://postplanify.com/docs",
            "https://postplanify.com/resources",
        ]
        for url in candidates:
            try:
                resp = page.goto(url, wait_until="domcontentloaded", timeout=15000)
                time.sleep(2)
                final_url = page.url
                title = page.title()
                print(f"{url}")
                print(f"  → final URL: {final_url}")
                print(f"  → title: {title}")
                if final_url != url and "/login" not in final_url:
                    shot = OUT / f"probe-{Path(url).stem or 'root'}.png"
                    page.screenshot(path=str(shot), full_page=False)
                    print(f"  → screenshot: {shot}")
                    # Dump first 500 chars of body text
                    txt = page.evaluate("document.body.innerText.slice(0, 1500)")
                    print(f"  → text preview:\n{txt[:1500]}")
                    print("---")
            except Exception as e:
                print(f"{url}  ERROR: {e}")
        # Don't close — let the user see
        print("\nBrowser left open for manual exploration. Press Ctrl+C to exit.")
        try:
            time.sleep(300)
        except KeyboardInterrupt:
            pass
        ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
