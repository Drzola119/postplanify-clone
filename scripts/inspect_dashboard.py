"""Inspect current dashboard state via the persistent profile.

Logs in silently (cookies carry over from open_browser_persistent.py) and
captures: full HTML, any 'Loading…' text, broken/blocked links, and a
screenshot. Diagnostic only — does not modify state.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

PROFILE = Path(r"C:\Users\zicko\.playwright-persistent-profile")
TARGET = "https://trustiify.agency/dashboard"
OUT = Path(r"C:\Users\zicko\Desktop\clone repo test\teardown\debug")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE),
            headless=True,
            channel="chrome",
            viewport={"width": 1440, "height": 900},
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = ctx.new_page()

        console_msgs = []
        bad_responses = []
        page.on("console", lambda m: console_msgs.append({"type": m.type, "text": m.text[:300]}) if m.type in ("error", "warning") else None)
        page.on("response", lambda r: bad_responses.append({"status": r.status, "url": r.url}) if r.status >= 400 and "/_next/" not in r.url else None)

        print(f"[inspect] goto {TARGET}", flush=True)
        try:
            page.goto(TARGET, wait_until="domcontentloaded", timeout=30000)
        except Exception as e:
            print(f"[inspect] goto error: {e}", flush=True)
            return 1
        print(f"[inspect] after domcontentloaded url={page.url}", flush=True)

        # Wait briefly for client hydration
        time.sleep(3)
        page.screenshot(path=str(OUT / "01-dashboard-initial.png"), full_page=True)

        # Look for stuck loading indicators
        stuck = page.evaluate(
            """() => {
              const txt = (document.body.innerText || '').toLowerCase();
              const findAll = (sel) => Array.from(document.querySelectorAll(sel))
                .map(e => ({tag: e.tagName, text: (e.textContent||'').trim().slice(0,200), classes: e.className||''}));
              return {
                has_loading_text: txt.includes('loading…') || txt.includes('loading...'),
                loading_elements: findAll('[class*=loading], [class*=spinner], [class*=Loader]').slice(0, 30),
                loading_options: findAll('option').filter(o => /loading/i.test(o.text || '')),
                select_state: Array.from(document.querySelectorAll('select')).map(s => ({
                  value: s.value, options: Array.from(s.options).map(o => o.text.slice(0,40))
                })),
                nav_links: findAll('nav a').map(a => ({text: (a.textContent||'').trim().slice(0,40), href: a.href})),
                sidebar_text: (document.querySelector('aside')?.innerText || '').slice(0, 500),
              };
            }"""
        )
        (OUT / "01-state.json").write_text(json.dumps(stuck, indent=2), encoding="utf-8")
        print("[inspect] STATE:", json.dumps(stuck, indent=2)[:2000], flush=True)

        # Try clicking a nav link
        print("[inspect] trying to click first nav link", flush=True)
        try:
            nav_links = page.locator("nav a")
            count = nav_links.count()
            print(f"[inspect] found {count} nav links", flush=True)
            if count > 0:
                first = nav_links.first
                href = first.get_attribute("href")
                print(f"[inspect] clicking first nav link: {href}", flush=True)
                first.click()
                time.sleep(2)
                print(f"[inspect] after click url={page.url}", flush=True)
                page.screenshot(path=str(OUT / "02-after-nav-click.png"), full_page=True)
        except Exception as e:
            print(f"[inspect] nav click error: {e}", flush=True)

        # Dump current DOM
        (OUT / "03-dom.html").write_text(page.content(), encoding="utf-8")
        (OUT / "04-console.json").write_text(json.dumps(console_msgs, indent=2), encoding="utf-8")
        (OUT / "05-network-4xx.json").write_text(json.dumps(bad_responses, indent=2), encoding="utf-8")

        print(f"[inspect] console msgs: {len(console_msgs)}, bad responses: {len(bad_responses)}", flush=True)
        ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
