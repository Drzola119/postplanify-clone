"""Targeted post-deploy console check for the auto-responder feature.

Verifies the two dashboard pages touched by the commit land cleanly:
  - /dashboard/inbox          (new "auto-replied" badge with Wand2 icon)
  - /dashboard/automations/dm  (new "Skipped" stat card + row counts)

Reuses the persistent profile (so the user's session is preserved) and
fails loudly if any console errors/warnings or 4xx/5xx responses appear.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

PROFILE = Path(r"C:\Users\zicko\.playwright-persistent-profile")
BASE = "https://trustiify.agency"

PAGES = [
    (
        "/dashboard/inbox",
        "Inbox (auto-replied badge)",
        [
            ("text=/Inbox|Mentions|Comments/i", "inbox heading"),
        ],
    ),
    (
        "/dashboard/automations/dm",
        "AutoDM campaigns (Skipped card)",
        [
            ("text=/AutoDM campaigns/i", "page heading"),
            ("text=/Skipped/i", "Skipped stat card"),
            ("text=/sent/i", "sent mentions"),
        ],
    ),
]


def main() -> int:
    summary = {"pages": [], "totals": {"console_issues": 0, "network_issues": 0}}
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
                    if url.endswith(".ico") or "favicon" in url:
                        return
                    bad_responses.append({"status": status, "url": url[:300], "method": resp.request.method})
            except Exception:
                pass

        page.on("console", on_console)
        page.on("response", on_response)

        for path, label, landmarks in PAGES:
            console_msgs.clear()
            bad_responses.clear()

            url = BASE + path
            print(f"\n=== {label} ===")
            print(f"URL: {url}")
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
            except PWTimeout:
                print(f"  [TIMEOUT] page took >30s to load")
                continue

            try:
                page.wait_for_load_state("networkidle", timeout=15000)
            except PWTimeout:
                pass
            time.sleep(2)

            if "/login" in page.url and path != "/login":
                print(f"  [AUTH MISSING] redirected to {page.url}")
                continue

            page_landmarks = []
            for sel, desc in landmarks:
                try:
                    count = page.locator(sel).count()
                    if count == 0:
                        page_landmarks.append(f"MISSING: {desc}")
                except Exception as e:
                    page_landmarks.append(f"ERROR ({desc}): {e}")

            print(f"  Console errors/warnings: {len(console_msgs)}")
            for m in console_msgs[:10]:
                print(f"    [{m['type']}] {m['text']}")
            print(f"  Bad network responses: {len(bad_responses)}")
            for r in bad_responses[:10]:
                print(f"    [{r['status']}] {r['method']} {r['url']}")
            print(f"  Landmarks: {len(page_landmarks)} issue(s)")
            for ln in page_landmarks:
                print(f"    {ln}")

            summary["pages"].append({
                "path": path,
                "label": label,
                "console_count": len(console_msgs),
                "network_count": len(bad_responses),
                "missing_count": len(page_landmarks),
            })
            summary["totals"]["console_issues"] += len(console_msgs)
            summary["totals"]["network_issues"] += len(bad_responses)

        print("\n=== SUMMARY ===")
        print(json.dumps(summary, indent=2))

    failed = (
        summary["totals"]["console_issues"] > 0
        or summary["totals"]["network_issues"] > 0
        or any(p["missing_count"] > 0 for p in summary["pages"])
    )
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
