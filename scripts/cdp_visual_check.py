"""Visual verification: take screenshots of each Tier 3 page and dump key DOM elements.

For features with conditional rendering (need data), explicitly inspect the source
to confirm the elements are in the React tree even if not currently visible.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = Path(r"C:\Users\zicko\.playwright-persistent-profile")
BASE = "https://trustiify.agency"
OUT = Path(r"C:\Users\zicko\Desktop\postplanify-clone-clean\docs\tier3-screenshots")
OUT.mkdir(parents=True, exist_ok=True)


def main() -> int:
    pages = [
        ("/dashboard/posts", "01-posts"),
        ("/dashboard/posts/drafts", "02-drafts"),
        ("/dashboard/posts/create", "02b-create"),
        ("/dashboard/analytics", "03-analytics"),
        ("/dashboard/inbox", "04-inbox"),
        ("/dashboard/reports", "05-reports"),
        ("/dashboard/assets", "06-assets"),
        ("/dashboard/brands", "07-brands"),
        ("/dashboard/settings", "08-settings"),
        ("/dashboard/accounts", "09-accounts"),
    ]
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE),
            headless=True,
            channel="chrome",
            viewport={"width": 1440, "height": 900},
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = ctx.new_page()
        errors_by_page: dict[str, list[str]] = {}
        for path, slug in pages:
            url = BASE + path
            print(f"\n=== {slug}: {url} ===")
            errs: list[str] = []
            page.on("pageerror", lambda e, errs=errs: errs.append(f"pageerror: {e}"))
            page.on("console", lambda m, errs=errs: m.type in ("error",) and errs.append(f"[{m.type}] {m.text[:200]}"))
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                try:
                    page.wait_for_load_state("networkidle", timeout=15000)
                except Exception:
                    pass
                import time as _t
                _t.sleep(2)
                shot = OUT / f"{slug}.png"
                page.screenshot(path=str(shot), full_page=False)
                print(f"  screenshot: {shot}")
                # On posts page, click list view to expose the checkbox
                if path == "/dashboard/posts":
                    list_btn = page.locator("button:has-text('List'), button[aria-label*='list' i], button[aria-label*='List']").first
                    if list_btn.count() > 0:
                        try:
                            list_btn.click(timeout=3000)
                            _t.sleep(1)
                            page.screenshot(path=str(OUT / "01b-posts-list.png"))
                            print(f"  list-view screenshot: 01b-posts-list.png")
                        except Exception as e:
                            print(f"  list-view click failed: {e}")
            except Exception as e:
                print(f"  navigation error: {e}")
            errors_by_page[path] = errs
            print(f"  runtime errors: {len(errs)}")
            for e in errs[:5]:
                print(f"    {e}")
        ctx.close()
    Path("/tmp/cdp_errors.json").write_text(json.dumps(errors_by_page, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
