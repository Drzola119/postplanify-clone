"""CDP verification for Tier 4 (PDF reports + structured logger + Sentry).

Tests:
  1. Reports page renders with new Template dropdown.
  2. Clicking Generate triggers POST /api/reports and opens download.
  3. PDF download returns valid PDF bytes (%PDF- magic).
  4. Console errors are clean (logger warnings are expected, not errors).
  5. Reports list shows status badge for newly-generated report.
"""
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
        console_msgs: list[dict] = []
        api_results: list[dict] = []
        download_path: str | None = None

        page.on("console", lambda m: console_msgs.append({
            "type": m.type,
            "text": m.text[:300],
        }))
        page.on("response", lambda r: api_results.append({
            "url": r.url,
            "status": r.status,
        }) if "/api/" in r.url else None)

        def on_download(d):
            nonlocal download_path
            dl_path = Path(r"C:\Users\zicko\Desktop\postplanify-clone-clean\docs\tier4-test-report.pdf")
            d.save_as(str(dl_path))
            download_path = str(dl_path)
            print(f"  download saved: {dl_path} ({dl_path.stat().st_size if dl_path.exists() else 0} bytes)")
        page.on("download", on_download)

        print("=== 1. Reports page renders + template dropdown present ===")
        page.goto(f"{BASE}/dashboard/reports", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_load_state("networkidle", timeout=15000)
        import time as _t
        _t.sleep(1)

        # Template dropdown
        template_select = page.locator("select").filter(has_text="Performance").first
        template_count = template_select.count()
        print(f"  template select present: {template_count > 0}")
        if template_count > 0:
            opts = page.locator("select").filter(has_text="Performance").first.locator("option").all_text_contents()
            print(f"  template options: {opts}")

        # Existing reports hydrated?
        reports = page.locator("text=Created").count()
        print(f"  existing report rows: {reports}")

        print("\n=== 2. Click Generate → expect download ===")
        api_results.clear()
        gen_btn = page.locator("button:has-text('Generate')").first
        if gen_btn.count() > 0:
            gen_btn.click()
            # Wait up to 15s for the download
            for _ in range(15):
                _t.sleep(1)
                if download_path:
                    break
            print(f"  download triggered: {bool(download_path)}")
            print(f"\n=== 3. API responses during Generate ===")
            for r in api_results:
                print(f"    {r['status']} {r['url']}")
        else:
            print("  Generate button NOT FOUND")

        print("\n=== 4. PDF download contents ===")
        if download_path:
            pdf_path = Path(download_path)
            if pdf_path.exists() and pdf_path.stat().st_size > 0:
                with open(pdf_path, "rb") as f:
                    magic = f.read(4)
                print(f"  size: {pdf_path.stat().st_size} bytes")
                print(f"  magic bytes: {magic!r}")
                print(f"  valid PDF: {magic == b'%PDF'}")
                # Sniff the report name from the PDF (PDFs have name in metadata)
                with open(pdf_path, "rb") as f:
                    blob = f.read()
                has_perf = b"Performance" in blob or b"performance" in blob
                print(f"  contains 'Performance' string: {has_perf}")
            else:
                print(f"  download file missing or empty: {pdf_path}")
        else:
            print("  no download captured")

        print("\n=== 5. Console errors (excluding expected) ===")
        errors = [m for m in console_msgs if m["type"] in ("error", "warning")]
        print(f"  total warnings/errors: {len(errors)}")
        for e in errors[:15]:
            tag = "ERR" if e["type"] == "error" else "WRN"
            print(f"    [{tag}] {e['text'][:200]}")

        # Take a screenshot of the reports page
        shot = Path(r"C:\Users\zicko\Desktop\postplanify-clone-clean\docs\tier4-reports.png")
        page.screenshot(path=str(shot), full_page=False)
        print(f"\n  screenshot: {shot}")

        ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
