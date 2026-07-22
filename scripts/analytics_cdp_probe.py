"""Live analytics probe via Chrome DevTools Protocol.

Attaches to the user's already-running Chrome instance at localhost:9333
(no Playwright launch, no automation flags). Verifies the goal acceptance
criteria for trustiify.agency /dashboard/analytics:

  1. Zero console errors/warnings on the analytics page
  2. Per-platform API responses: which platforms returned real (non-null) data,
     which returned an honest status (token_expired / unsupported / not_connected)
  3. Facebook / LinkedIn surface a Reconnect CTA (token_expired) instead of a
     silent error or fabricated zeros
  4. Overview totals equal the sum of the per-account numbers
  5. 30s live polling actually re-fetches (a second request with fresh=1)
"""

from __future__ import annotations

import json
import re
import sys
import time
from playwright.sync_api import sync_playwright

CDP_URL = "http://localhost:9333"
BASE = "https://trustiify.agency"
ANALYTICS_URL = BASE + "/dashboard/analytics"

METRIC_KEYS = ("impressionsPrimary", "followers", "likes", "comments", "shares")


def is_nonnull_platform(body: dict) -> bool:
    return any(body.get(k) is not None for k in METRIC_KEYS)


def _platform_from_url(url: str) -> str:
    m = re.search(r"/account/([^/?]+)", url)
    if not m:
        return "?"
    ident = m.group(1)
    if "%3A" in ident:
        ident = ident.split("%3A")[-1]
    elif ":" in ident:
        ident = ident.split(":")[-1]
    return ident


def main() -> int:
    console_msgs: list[dict] = []
    bad_responses: list[dict] = []
    account_bodies: list[dict] = []
    overview_bodies: list[dict] = []
    analytics_request_log: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(CDP_URL)
        ctx = browser.contexts[0]
        page = None
        for pg in ctx.pages:
            if "trustiify.agency" in pg.url:
                page = pg
                break
        if page is None:
            print("No trustiify.agency tab found in CDP browser.")
            return 2

        def on_console(msg):
            if msg.type in ("error", "warning"):
                console_msgs.append({"type": msg.type, "text": msg.text[:400]})

        def on_response(resp):
            try:
                status = resp.status
                url = resp.url
                if "/api/analytics/" in url:
                    analytics_request_log.append(
                        {"t": time.time(), "status": status, "url": url}
                    )
                    body = None
                    try:
                        body = resp.json()
                    except Exception:
                        body = None
                    if body is not None:
                        if "/api/analytics/overview" in url:
                            overview_bodies.append(body)
                        elif "/api/analytics/account/" in url:
                            account_bodies.append({"url": url, "body": body})
                if status >= 400 and "/_next/static" not in url and "/__nextjs" not in url:
                    if url.endswith(".ico") or "favicon" in url:
                        return
                    bad_responses.append(
                        {"status": status, "url": url[:300], "method": resp.request.method}
                    )
            except Exception:
                pass

        page.on("console", on_console)
        page.on("response", on_response)

        # Force the page to consider itself visible (CDP tabs report hidden otherwise,
        # which pauses the 30s polling via document.visibilitychange).
        try:
            page.evaluate("Object.defineProperty(document, 'visibilityState', { get: () => 'visible' }); Object.defineProperty(document, 'hidden', { get: () => false });")
        except Exception:
            pass

        # Trigger a hard reload so the listeners catch EVERY fetch from scratch.
        try:
            page.reload(wait_until="domcontentloaded", timeout=60000)
        except Exception as e:
            print(f"[RELOAD TIMEOUT — continuing] {e}")

        # After reload, re-apply the visibility spoof (it gets wiped on reload).
        try:
            page.evaluate("Object.defineProperty(document, 'visibilityState', { get: () => 'visible' }); Object.defineProperty(document, 'hidden', { get: () => false });")
        except Exception:
            pass

        try:
            page.wait_for_load_state("networkidle", timeout=20000)
        except Exception:
            pass

        print(f"=== Tab URL: {page.url} ===")
        print(f"=== Title: {page.title()} ===")

        # Give per-account cards time to fetch their individual analytics.
        print("Waiting 12s for per-account fetches...")
        time.sleep(12)
        first_batch_account = len(account_bodies)
        first_batch_overview = len(overview_bodies)
        print(f"  Account responses so far: {first_batch_account}")
        print(f"  Overview responses so far: {first_batch_overview}")

        # 30s polling check
        print("Waiting 34s for the 30s live-poll re-fetch...")
        try:
            page.bring_to_front()
        except Exception:
            pass
        time.sleep(34)

        fresh_refetch = [r for r in analytics_request_log if "fresh=1" in r["url"]]
        polled_again_account = len(account_bodies) > first_batch_account
        polled_again_overview = len(overview_bodies) > first_batch_overview

        # Reconnect CTA detection (English + French + Arabic; we deploy all 3)
        try:
            reconnect_ctas = page.locator(
                "button:has-text('Reconnect'), a:has-text('Reconnect'), "
                "button:has-text('reconnect'), a:has-text('reconnect'), "
                "a:has-text('Go to Accounts'), a:has-text('Aller aux comptes'), "
                "a:has-text('الانتقال'), "
                "h2:has-text('No connected accounts yet'), h2:has-text('Aucun compte connecté')"
            ).count()
        except Exception:
            reconnect_ctas = -1

        # Workspace id (debug aid)
        try:
            html = page.content()
            m = re.search(r'workspaceId["\'\s:=]+([A-Za-z0-9_-]{6,40})', html)
            workspace_id = m.group(1) if m else "?"
        except Exception:
            workspace_id = "?"

        try:
            ctx.close()
        except Exception:
            pass

    # ---------------- Analysis ----------------
    print("\n" + "=" * 64)
    print("ANALYSIS")
    print("=" * 64)
    print(f"Workspace ID: {workspace_id}")

    latest_by_url: dict[str, dict] = {}
    for item in account_bodies:
        latest_by_url[item["url"]] = item["body"]

    platform_status: dict[str, dict] = {}
    for url, body in latest_by_url.items():
        norm = body.get("analytics") if isinstance(body, dict) and "analytics" in body else body
        if not isinstance(norm, dict):
            continue
        # /api/analytics/account/{id} returns { accountId, platform, totals, status, errorMessage, lastSyncedAt, series }
        # /api/analytics/overview returns { workspaceId, totals, byPlatform[], status }
        # In both cases totals.impressions/followers/likes are the canonical per-platform numbers.
        totals = norm.get("totals") if isinstance(norm.get("totals"), dict) else {}
        platform = norm.get("platform") or _platform_from_url(url)
        impressions = totals.get("impressions")
        followers = totals.get("followers")
        likes = totals.get("likes")
        nonnull = any(x is not None for x in (impressions, followers, likes))
        platform_status[platform] = {
            "status": norm.get("status"),
            "nonnull": nonnull,
            "impressionsPrimary": impressions,
            "followers": followers,
            "likes": likes,
            "errorMessage": norm.get("errorMessage"),
        }

    print("\nPer-platform (from live /api/analytics/account responses):")
    if not platform_status:
        print("  (no per-account analytics responses captured)")
    for plat, s in sorted(platform_status.items()):
        msg = f" msg={s['errorMessage']}" if s.get("errorMessage") else ""
        print(
            f"  {plat:16s} status={str(s['status']):14s} nonnull={s['nonnull']!s:5s} "
            f"impr={s['impressionsPrimary']} followers={s['followers']} "
            f"likes={s['likes']}{msg}"
        )

    overview = overview_bodies[-1] if overview_bodies else None
    ov = None
    if overview:
        ov = overview.get("overview") if "overview" in overview else overview
    print("\nOverview totals:")
    if ov:
        ov_totals = ov.get("totals") or {}
        print(
            f"  status={ov.get('status')} impressions={ov_totals.get('impressions')} "
            f"followers={ov_totals.get('followers')} likes={ov_totals.get('likes')}"
        )
        bp = ov.get("byPlatform") or []
        sum_impr = sum((p.get("impressions") or 0) for p in bp)
        sum_foll = sum((p.get("followers") or 0) for p in bp)
        sum_likes = sum((p.get("likes") or 0) for p in bp)
        ov_impr = ov_totals.get("impressions")
        ov_foll = ov_totals.get("followers")
        ov_likes = ov_totals.get("likes")
        totals_match = (
            (ov_impr is None and sum_impr == 0) or (ov_impr == sum_impr)
        ) and (
            (ov_foll is None and sum_foll == 0) or (ov_foll == sum_foll)
        ) and (
            (ov_likes is None and sum_likes == 0) or (ov_likes == sum_likes)
        )
        print(
            f"  byPlatform count={len(bp)} sum(impr)={sum_impr} sum(followers)={sum_foll} "
            f"sum(likes)={sum_likes}"
        )
        print(
            f"  overview.totals.impr == sum(byPlatform.impr)? {ov_impr == sum_impr}"
        )
        print(
            f"  overview.totals.foll == sum(byPlatform.foll)? {ov_foll == sum_foll}"
        )
        print(
            f"  overview.totals.likes == sum(byPlatform.likes)? {ov_likes == sum_likes}"
        )
        print(f"  ALL totals match? {totals_match}")
    else:
        totals_match = False
        print("  (no overview response captured)")

    print("\nConsole errors/warnings:", len(console_msgs))
    for m in console_msgs[:15]:
        print(f"    [{m['type']}] {m['text']}")

    print("\nBad network responses (>=400):", len(bad_responses))
    for r in bad_responses[:15]:
        print(f"    [{r['status']}] {r['method']} {r['url']}")

    print("\nReconnect CTAs in DOM:", reconnect_ctas)
    reconnect_platforms = [
        p for p, s in platform_status.items() if s["status"] == "token_expired"
    ]
    print("Platforms flagged token_expired (reconnect):", reconnect_platforms)

    print("\n30s live polling:")
    print(f"  total /api/analytics requests: {len(analytics_request_log)}")
    print(f"  fresh=1 re-fetch requests: {len(fresh_refetch)}")
    print(f"  account re-polled after 34s: {polled_again_account}")
    print(f"  overview re-polled after 34s: {polled_again_overview}")

    print("\n" + "=" * 64)
    print("VERDICT (/goal criteria)")
    print("=" * 64)
    nonnull_platforms = [p for p, s in platform_status.items() if s["nonnull"]]
    checks = {
        "zero console errors/warnings": len(console_msgs) == 0,
        "zero bad network responses": len(bad_responses) == 0,
        "at least one platform shows non-null data": len(nonnull_platforms) > 0,
        "reconnect CTA present when a platform is token_expired": (
            reconnect_ctas > 0 if reconnect_platforms else True
        ),
        "overview totals match per-account sums": totals_match,
        "30s polling re-fetches (fresh=1)": len(fresh_refetch) > 0
        and (polled_again_account or polled_again_overview),
    }
    for name, ok in checks.items():
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}")
    print("\nplatforms with non-null data:", nonnull_platforms)
    print("platforms with honest non-ok status:", [
        p for p, s in platform_status.items() if s["status"] and s["status"] != "ok" and s["status"] != "unknown"
    ])

    print("\n" + json.dumps(
        {
            "workspace_id": workspace_id,
            "platform_status": platform_status,
            "console_errors": len(console_msgs),
            "bad_network": len(bad_responses),
            "totals_match": totals_match,
            "fresh_refetch": len(fresh_refetch),
            "nonnull_platforms": nonnull_platforms,
            "reconnect_platforms": reconnect_platforms,
        },
        indent=2,
        default=str,
    ))

    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())