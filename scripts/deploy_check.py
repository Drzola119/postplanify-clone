"""Check whether the deployed site is on the latest build (commit 4b297a1)."""
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
        chunks: list[dict] = []
        page.on("response", lambda r: "/_next/static/" in r.url and chunks.append({
            "url": r.url,
            "status": r.status,
            "type": r.headers.get("content-type", ""),
        }))

        # Hit a few pages to load many chunks
        for path in ("/dashboard", "/dashboard/posts", "/dashboard/reports"):
            try:
                page.goto(f"{BASE}{path}", wait_until="domcontentloaded", timeout=30000)
                page.wait_for_load_state("networkidle", timeout=10000)
                import time as _t; _t.sleep(1)
            except Exception as e:
                print(f"  {path}: ERROR {e}")

        # Newest chunk timestamp
        latest = max(
            chunks,
            key=lambda c: c["url"],
        ) if chunks else None
        print(f"=== Deployed chunk survey ===")
        print(f"  total chunks loaded: {len(chunks)}")
        print(f"  status distribution:")
        from collections import Counter
        for s, n in Counter(c["status"] for c in chunks).most_common():
            print(f"    {s}: {n}")

        # Check for any JS chunks with .js extension and fetch one to get its Last-Modified
        if chunks:
            sample = next((c for c in chunks if c["url"].endswith(".js")), None)
            if sample:
                print(f"\n  sample chunk URL: {sample['url']}")
                # Check via HEAD request
                import urllib.request
                req = urllib.request.Request(sample["url"], method="HEAD")
                with urllib.request.urlopen(req, timeout=10) as resp:
                    lm = resp.headers.get("Last-Modified", "n/a")
                    print(f"  Last-Modified: {lm}")

        ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
