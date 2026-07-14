"""CDP console check for Tier 3.7-3.16 dashboard pages.

Uses Playwright with the existing persistent profile so the user's auth
session is preserved. For each page:
  - Captures console messages (warnings + errors only)
  - Captures failed/4xx/5xx network responses
  - Verifies expected DOM landmarks for the Tier 3.7-3.16 features

Outputs a per-page report to stdout.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

PROFILE = Path(r"C:\Users\zicko\.playwright-persistent-profile")
BASE = "https://trustiify.agency"

# (path, label, list-of-(selector,description) that MUST be present)
PAGES = [
    (
        "/dashboard/posts",
        "Posts (CSV export + bulk-select)",
        [
            ("button:has-text('Export CSV')", "CSV export button"),
            ("input[type='checkbox']", "bulk-select checkbox"),
            ("button:has-text('Archive selected')", "bulk-archive button"),
        ],
    ),
    (
        "/dashboard/posts/drafts",
        "Drafts (search + sort)",
        [
            ("input[placeholder*='Search' i], input[placeholder*='search' i]", "search input"),
            ("button:has-text('Newest'), button:has-text('Sort')", "sort control"),
        ],
    ),
    (
        "/dashboard/analytics",
        "Analytics (Export CSV per account)",
        [
            ("button:has-text('Export CSV')", "Export CSV button"),
        ],
    ),
    (
        "/dashboard/inbox",
        "Inbox (CSV export + Analyze sentiment)",
        [
            ("button:has-text('Export CSV')", "CSV export"),
            ("button:has-text('Analyze')", "Analyze sentiment"),
        ],
    ),
    (
        "/dashboard/reports",
        "Reports (date presets + CSV)",
        [
            ("button:has-text('Last 7 days'), button:has-text('7 days')", "7-day preset"),
            ("button:has-text('Last 30 days'), button:has-text('30 days')", "30-day preset"),
            ("button:has-text('Export CSV')", "Export CSV"),
        ],
    ),
    (
        "/dashboard/assets",
        "Media Library (Used in N)",
        [
            ("text=/Used in \\d+/", "usage count text"),
        ],
    ),
    (
        "/dashboard/brands",
        "Workspaces (Team invite)",
        [
            ("button:has-text('Invite')", "Invite button"),
        ],
    ),
    (
        "/dashboard/settings",
        "Settings (Notifications tab)",
        [
            ("button:has-text('Notifications')", "Notifications tab"),
        ],
    ),
    (
        "/dashboard/accounts",
        "Accounts (Reconnect CTA)",
        [
            ("button:has-text('Reconnect'), button:has-text('Refresh')", "Reconnect/Refresh"),
        ],
    ),
]


def main() -> int:
    summary = {"pages": [], "totals": {"console_errors": 0, "network_errors": 0, "missing_features": 0}}
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE),
            headless=True,
            channel="chrome",
            viewport={"width": 1440, "height": 900},
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = ctx.new_page()
        console_msgs: list[dict] = []
        bad_responses: list[dict] = []

        def on_console(msg):
            if msg.type in ("error", "warning"):
                console_msgs.append({"type": msg.type, "text": msg.text[:500]})

        def on_response(resp):
            try:
                status = resp.status
                url = resp.url
                if status >= 400 and "/_next/static" not in url and "/__nextjs" not in url:
                    # ignore favicon noise
                    if url.endswith(".ico") or "favicon" in url:
                        return
                    bad_responses.append({"status": status, "url": url[:300], "method": resp.request.method})
            except Exception:
                pass

        page.on("console", on_console)
        page.on("response", on_response)

        for path, label, landmarks in PAGES:
            page_console = []
            page_network = []
            page_missing = []

            # reset for this page
            console_msgs.clear()
            bad_responses.clear()

            url = BASE + path
            print(f"\n=== {label} ===")
            print(f"URL: {url}")
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
            except PWTimeout:
                print(f"  [TIMEOUT] page took >30s to load")
                summary["pages"].append({"path": path, "label": label, "status": "timeout"})
                continue

            # Wait a bit for client-side hydration + auth bootstrap
            try:
                page.wait_for_load_state("networkidle", timeout=15000)
            except PWTimeout:
                pass
            time.sleep(2)

            # If we got bounced to /login, auth session is missing
            if "/login" in page.url and path != "/login":
                print(f"  [AUTH MISSING] redirected to {page.url}")
                print(f"    The persistent profile may not have a valid session.")
                summary["pages"].append({"path": path, "label": label, "status": "no_session"})
                continue

            # Check landmarks
            for sel, desc in landmarks:
                try:
                    count = page.locator(sel).count()
                    if count == 0:
                        page_missing.append(desc)
                except Exception as e:
                    page_missing.append(f"{desc} (error: {e})")

            page_console = list(console_msgs)
            page_network = list(bad_responses)

            print(f"  Console errors/warnings: {len(page_console)}")
            for m in page_console[:10]:
                print(f"    [{m['type']}] {m['text']}")
            print(f"  Bad network responses: {len(page_network)}")
            for r in page_network[:10]:
                print(f"    [{r['status']}] {r['method']} {r['url']}")
            print(f"  Missing landmarks: {len(page_missing)}")
            for m in page_missing:
                print(f"    MISSING: {m}")

            summary["pages"].append({
                "path": path,
                "label": label,
                "status": "ok",
                "console_count": len(page_console),
                "network_count": len(page_network),
                "missing_count": len(page_missing),
            })
            summary["totals"]["console_errors"] += len(page_console)
            summary["totals"]["network_errors"] += len(page_network)
            summary["totals"]["missing_features"] += len(page_missing)

        # Sidebar Learn button check on /dashboard (any dashboard page)
        print(f"\n=== Sidebar Learn button (open LearnPanel) ===")
        try:
            page.goto(BASE + "/dashboard/posts", wait_until="domcontentloaded", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=15000)
            time.sleep(2)
            learn_btn = page.locator("button[aria-label='Open Learn panel']")
            if learn_btn.count() > 0:
                learn_btn.first.click()
                time.sleep(1)
                # Look for any panel that opened (generic check)
                panel_visible = page.locator("[role='dialog'], aside").count() > 0
                print(f"  Learn button found: yes")
                print(f"  Panel opened: {'yes' if panel_visible else 'no'}")
            else:
                print(f"  Learn button: NOT FOUND")
                summary["totals"]["missing_features"] += 1
        except Exception as e:
            print(f"  Error: {e}")

        ctx.close()

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(json.dumps(summary, indent=2))

    # Exit code: 1 if any console errors or network >=400 or missing features
    has_problems = (
        summary["totals"]["console_errors"] > 0
        or summary["totals"]["network_errors"] > 0
        or summary["totals"]["missing_features"] > 0
    )
    return 1 if has_problems else 0


if __name__ == "__main__":
    sys.exit(main())
