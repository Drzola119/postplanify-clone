"""CDP verification for Tier 3 polish deploy.

Specifically tests:
  1. Workspace switcher persists across reload (sessionStorage)
  2. CSV upload button appears on bulk-schedule page
  3. Posts page renders without errors in list view
"""

from __future__ import annotations

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
        console_errors: list[str] = []
        page.on("console", lambda m: m.type == "error" and console_errors.append(m.text[:200]))
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        print("=== Workspace switcher persistence ===")
        page.goto(f"{BASE}/dashboard/posts", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_load_state("networkidle", timeout=15000)
        # Wait up to 8s for the workspace dropdown to populate past "Loading..."
        import time as _t
        deadline = _t.time() + 8
        while _t.time() < deadline:
            opts_now = page.locator("select[aria-label='Switch workspace'] option").all_text_contents()
            non_loading = [o for o in opts_now if o.strip().lower() != "loading…"]
            if non_loading:
                break
            _t.sleep(0.5)
        # Select a workspace from dropdown
        ws_select = page.locator("select[aria-label='Switch workspace']")
        if ws_select.count() > 0:
            opts = page.locator("select[aria-label='Switch workspace'] option").all_text_contents()
            print(f"  workspace options: {opts}")
            # Pick second workspace if available, else first
            if len(opts) > 2:
                ws_select.select_option(index=1)
                # Read what was selected
                selected_value = ws_select.evaluate("el => el.value")
                print(f"  selected: {selected_value}")
                # Reload and check if it persists
                page.reload(wait_until="domcontentloaded")
                page.wait_for_load_state("networkidle", timeout=15000)
                new_value = ws_select.evaluate("el => el.value")
                print(f"  after reload: {new_value}")
                if new_value == selected_value and selected_value:
                    print(f"  PERSISTENCE: OK (workspace {selected_value} survives reload)")
                else:
                    print(f"  PERSISTENCE: FAIL (was {selected_value}, now {new_value})")
            else:
                print(f"  only {len(opts)} workspace options — skipping persistence test")
        else:
            print(f"  workspace selector not found")

        print("\n=== Bulk-schedule CSV upload button ===")
        page.goto(f"{BASE}/dashboard/posts/bulk-schedule", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_load_state("networkidle", timeout=15000)
        csv_btn = page.locator("button:has-text('Upload CSV')")
        if csv_btn.count() > 0:
            print(f"  CSV button: FOUND ({csv_btn.count()} instance(s))")
        else:
            print(f"  CSV button: NOT FOUND")
        # Check the hidden file input
        csv_input = page.locator("input[type='file'][accept*='csv']")
        print(f"  hidden CSV file input: {'FOUND' if csv_input.count() > 0 else 'NOT FOUND'}")

        print("\n=== Posts list view bulk-delete (no JS errors) ===")
        page.goto(f"{BASE}/dashboard/posts", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_load_state("networkidle", timeout=15000)
        # Click the list view toggle
        list_btn = page.locator("button[aria-label*='list' i], button[aria-label*='List']").first
        if list_btn.count() > 0:
            list_btn.click(timeout=5000)
            import time as _t
            _t.sleep(2)
        checkboxes = page.locator("input[type='checkbox'][aria-label*='post' i], input[type='checkbox'][aria-label='Select all']")
        print(f"  bulk checkboxes: {checkboxes.count()} visible")
        page_errors = [e for e in console_errors if "Failed to load" not in e and "401" not in e]
        print(f"\n=== Console errors ===")
        print(f"  total: {len(console_errors)}")
        print(f"  non-401/pageerror: {len(page_errors)}")
        for e in page_errors[:10]:
            print(f"    {e}")

        # Take a screenshot of bulk-schedule page to verify CSV button visually
        page.goto(f"{BASE}/dashboard/posts/bulk-schedule", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_load_state("networkidle", timeout=15000)
        shot = Path(r"C:\Users\zicko\Desktop\postplanify-clone-clean\docs\polish-bulk-schedule.png")
        page.screenshot(path=str(shot), full_page=False)
        print(f"\n  screenshot: {shot}")

        ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
