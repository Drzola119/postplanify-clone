"""Drive the user's two pinned Custom GPTs to extract their conversation
state machines, then save transcripts + screenshots for the teardown report.

Two tabs:
  Tab A — "Instant Infographics Custom GPT" — single-pass flow
            topic -> scheme -> CTA -> style# -> image
  Tab B — "Instant Infographic Ads Custom GPT" — two-step handoff
            angle -> scheme -> CTA -> style# -> confirm -> paste offer -> image

Plus 3 runs of Tab B with varying params + edge cases (skip paste, paste early,
attach .txt). Uses the user's persistent profile so we land already logged in.

Run order:
  python custom_gpt_driver.py tab-a
  python custom_gpt_driver.py tab-b-runs   # runs B1, B2, B3
  python custom_gpt_driver.py edge-cases   # skip-paste, paste-early, attach

All screenshots, transcripts, and DOM dumps land in
./teardown/custom-gpt/<run-id>/. The browser stays HEAded so the user can watch.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, Page, TimeoutError as PWTimeout

PROFILE = Path(r"C:\Users\zicko\.playwright-persistent-profile")
OUT_ROOT = Path(r"C:\Users\zicko\Desktop\clone repo test\teardown\custom-gpt")

# GPT slugs to find in the sidebar.
# If pinned entry text doesn't match exactly, we fall back to GPT-store search.
TARGETS = {
    "tab-a": {
        "sidebar_match": "Instant Infographics Custom",
        "gpt_search": "Instant Infographics",
        "run_label": "tab-a-single-pass",
    },
    "tab-b": {
        "sidebar_match": "Instant Infographic Ads Custom",
        "gpt_search": "Instant Infographic Ads",
        "run_label": "tab-b-two-step",
    },
}


def log(msg: str) -> None:
    # Force UTF-8 stdout so emoji/arrows don't crash Windows cp1252 console
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    print(f"[gpt] {msg}", flush=True)


def react_click(page: Page, selector: str, idx: int = 0) -> bool:
    """Click an element via Runtime.evaluate (works for React 19 handlers)."""
    return page.evaluate(
        """({selector, idx}) => {
          const els = document.querySelectorAll(selector);
          const el = els[idx];
          if (!el) return false;
          el.click();
          return true;
        }""",
        {"selector": selector, "idx": idx},
    )


def safe_name(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", s)[:80]


def find_gpt_in_sidebar(page: Page, match: str) -> str | None:
    """Click a sidebar entry that contains `match` and return the resulting URL."""
    log(f"looking for sidebar entry containing: {match!r}")
    found = page.evaluate(
        """(match) => {
          const lower = match.toLowerCase();
          // Sidebar links: <a href="/c/..."> in ChatGPT
          const all = Array.from(document.querySelectorAll('a[href]'));
          for (const a of all) {
            const t = (a.textContent || '').trim();
            if (t.toLowerCase().includes(lower)) {
              return { href: a.href, text: t.slice(0, 80) };
            }
          }
          return null;
        }""",
        match,
    )
    if not found:
        return None
    log(f"  found: {found['text']} -> {found['href']}")
    # Navigate explicitly (don't rely on React click bubbling through router)
    page.goto(found["href"], wait_until="domcontentloaded", timeout=30000)
    time.sleep(2)
    return found["href"]


def start_new_chat(page: Page) -> None:
    """Click the 'New chat' sidebar button if present."""
    clicked = react_click(page, "a[href='/']", 0) or react_click(
        page, "button[aria-label*='New chat' i]", 0
    )
    if clicked:
        log("started a new chat")
    time.sleep(1)


def send_message(page: Page, text: str, attach_path: Path | None = None) -> None:
    """Type a message into ChatGPT's ProseMirror editor and submit.

    ChatGPT's prompt is a contenteditable ProseMirror div (#prompt-textarea),
    NOT a regular textarea. The hidden <textarea name="prompt-textarea"> is
    just a fallback that React doesn't read from. Setting `.value` on it does
    nothing visible.

    Strategy: focus the contenteditable, type via page.keyboard.type() (real
    keystrokes fire ProseMirror's InputEvents), then click the send button.
    The send button is dynamically rendered by React ONLY after text exists in
    the editor, so we can't pre-select it before typing.

    Safety: if the send button is in "Interrompre" (Stop) state, the GPT is
    still streaming — wait for it to flip back to "Envoyer" before proceeding,
    or we'd click Stop and interrupt the previous response.
    """
    log(f"send: {text[:120]!r}{' [+attach '+str(attach_path)+']' if attach_path else ''}")
    # Safety: wait for any in-flight response to finish before typing/clicking.
    # We only need a brief settle (≤ 30s) here; the longer wait happens
    # separately in wait_until_idle.
    deadline = time.time() + 30
    while time.time() < deadline:
        state = page.evaluate(
            """() => {
              const b = document.querySelector('button[data-testid="send-button"]');
              return {
                label: b ? (b.getAttribute('aria-label') || '') : '',
                disabled: b ? b.disabled : true,
              };
            }"""
        )
        if state["label"] and not re.search(r"interrompre|stop", state["label"], re.IGNORECASE):
            break
        time.sleep(1.0)
    else:
        log("  WARN: send button still in Stop state after 30s — proceeding anyway")
    # Optional attachment — paperclip button triggers hidden #upload-files
    if attach_path and attach_path.exists():
        file_inputs = page.locator("input[type='file']")
        n = file_inputs.count()
        log(f"  found {n} file inputs")
        if n > 0:
            file_inputs.first.set_input_files(str(attach_path))
            time.sleep(2)
    # Click the contenteditable to focus it, then clear any leftover text
    page.evaluate(
        """() => {
          const ed = document.querySelector('div#prompt-textarea[contenteditable="true"]');
          if (!ed) return false;
          ed.focus();
          // Clear existing content if any
          ed.innerHTML = '';
          return true;
        }"""
    )
    time.sleep(0.2)
    # Type real keystrokes — ProseMirror picks them up and updates React state
    if text:
        page.keyboard.type(text, delay=10)
    time.sleep(0.6)
    # Click the send button (now visible because editor has content OR
    # because a file is attached). Re-check label and enabled state — if
    # the button flipped back to "Interrompre" (Stop) or is still disabled
    # because React hasn't finished updating after the file attach, poll
    # for up to ~10s before giving up.
    submitted = None
    for attempt in range(20):
        submitted = page.evaluate(
            """() => {
              const btn = document.querySelector(
                'button[data-testid="send-button"], button#composer-submit-button'
              );
              if (!btn) return 'no-send-button';
              const label = btn.getAttribute('aria-label') || '';
              if (/interrompre|stop/i.test(label)) return 'button-still-stop:' + label;
              if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return 'send-button-disabled';
              btn.click();
              return 'send-button:' + label;
            }"""
        )
        if submitted.startswith("send-button:") or submitted.startswith("button-still-stop"):
            break
        time.sleep(0.5)
    log(f"  submitted via {submitted} (attempt {attempt + 1})")
    time.sleep(0.5)


def wait_until_idle(page: Page, timeout_ms: int = 180_000, long_poll: bool = False) -> None:
    """Wait until the GPT finishes generating.

    We poll DOM every 1.5s. We're idle when ALL of these hold for
    `settle_secs` consecutive seconds (default 4.5s = 3 consecutive polls):
      - No 'Stop generating' / 'Interrompre' state on the send button
      - No [data-is-streaming="true"] elements
      - No 'Création' / 'Generating' placeholder text visible
      - Last assistant message text length is stable (not increasing)

    The "settle for N seconds" guard is critical: ChatGPT toggles streaming
    flags in brief gaps between rendered chunks. Without the settle window,
    we exit on a false-negative mid-stream and the next send_message hits
    the "Interrompre" (Stop) button instead of "Envoyer" (Send), which
    INTERRUPTS the previous response instead of sending our new message.
    """
    label = "response" if not long_poll else "image generation"
    log(f"waiting for {label} to finish…")
    start = time.time()
    settle_secs = 6.0 if long_poll else 4.5
    idle_since = None  # wall-clock time when conditions first became idle
    last_text_len = -1
    last_log = None
    while True:
        elapsed = time.time() - start
        if elapsed * 1000 > timeout_ms:
            log(f"  timeout after {elapsed:.1f}s")
            break
        status = page.evaluate(
            """() => {
              const streaming = !!document.querySelector('[data-is-streaming="true"], .result-streaming');
              const submitBtn = document.querySelector('button[data-testid="send-button"]');
              const btnLabel = submitBtn?.getAttribute('aria-label') || '';
              const isStop = /interrompre|stop/i.test(btnLabel);
              const hasGeneratingText = Array.from(document.querySelectorAll('p, span, div, h1, h2'))
                .some(el => {
                  if (!(el.offsetParent !== null)) return false;
                  const t = (el.textContent || '').toLowerCase();
                  return /création|generation|génération|creating image|generating image/.test(t) && t.length < 200;
                });
              const msgs = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
              const last = msgs[msgs.length - 1];
              const lastHasImg = last ? !!last.querySelector('img[src]:not([src^="data:image/svg"])') : false;
              const lastTextLen = last ? (last.innerText || '').trim().length : 0;
              return { streaming, isStop, hasGeneratingText,
                       lastHasImg, lastTextLen, msgs: msgs.length };
            }"""
        )
        if last_log != (status["streaming"], status["isStop"], status["hasGeneratingText"], status["lastTextLen"]):
            log(f"  status: streaming={status['streaming']} stop={status['isStop']} "
                f"generating={status['hasGeneratingText']} last_text={status['lastTextLen']} "
                f"last_img={status['lastHasImg']} msgs={status['msgs']}")
            last_log = (status["streaming"], status["isStop"], status["hasGeneratingText"], status["lastTextLen"])
        text_stable = status["lastTextLen"] == last_text_len
        last_text_len = status["lastTextLen"]
        is_idle = (not status["streaming"] and not status["isStop"]
                   and not status["hasGeneratingText"] and text_stable)
        now = time.time()
        if is_idle:
            if idle_since is None:
                idle_since = now
            elif now - idle_since >= settle_secs:
                log(f"  idle for {settle_secs}s, done")
                break
        else:
            idle_since = None
        time.sleep(1.5)


def capture_state(page: Page, run_dir: Path, step_name: str) -> None:
    """Screenshot + DOM dump + structured transcript snippet."""
    run_dir.mkdir(parents=True, exist_ok=True)
    safe = safe_name(step_name)
    shot = run_dir / f"{safe}.png"
    page.screenshot(path=str(shot), full_page=True)
    log(f"  saved {shot.name}")
    html_path = run_dir / f"{safe}.html"
    html_path.write_text(page.content(), encoding="utf-8")


def get_last_assistant_text(page: Page) -> str:
    """Extract the visible text of the most recent assistant message."""
    return page.evaluate(
        """() => {
          const msgs = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
          if (msgs.length === 0) return '';
          const last = msgs[msgs.length - 1];
          return (last.innerText || last.textContent || '').trim();
        }"""
    )


def get_last_user_text(page: Page) -> str:
    return page.evaluate(
        """() => {
          const msgs = Array.from(document.querySelectorAll('[data-message-author-role="user"]'));
          if (msgs.length === 0) return '';
          const last = msgs[msgs.length - 1];
          return (last.innerText || last.textContent || '').trim();
        }"""
    )


def all_transcript(page: Page) -> list[dict]:
    return page.evaluate(
        """() => {
          const items = [];
          document.querySelectorAll('[data-message-author-role]').forEach(el => {
            const role = el.getAttribute('data-message-author-role');
            const txt = (el.innerText || '').trim();
            // Crude check for inline image
            const imgs = Array.from(el.querySelectorAll('img')).map(i => ({
              src: i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight,
            }));
            items.push({ role, text: txt.slice(0, 8000), images: imgs });
          });
          return items;
        }"""
    )


def scrape_page_text(page: Page, url: str) -> str:
    """Open `url` in a NEW tab, return `document.body.innerText` (plain text,
    reading order). Mirrors what a human does when they "select-all, copy,
    paste" a webpage into a text file — no HTML, just the rendered text.

    Collapses runs of blank lines; leaves everything else untouched so the
    GPT gets the full "from A to Z" page dump it expects.
    """
    log(f"scraping page text from: {url}")
    new_tab = page.context.new_page()
    try:
        new_tab.goto(url, wait_until="domcontentloaded", timeout=60000)
        time.sleep(3)  # let JS-rendered text settle
        # Try innerText first (visible text), fall back to textContent
        text = new_tab.evaluate(
            """() => {
              // Remove script/style/noscript from a clone before reading text
              const clone = document.body.cloneNode(true);
              clone.querySelectorAll('script, style, noscript, svg').forEach(el => el.remove());
              return (clone.innerText || clone.textContent || '').trim();
            }"""
        )
    finally:
        try:
            new_tab.close()
        except Exception:
            pass
    # Collapse 3+ blank lines down to 2
    import re as _re
    text = _re.sub(r"\n{3,}", "\n\n", text)
    log(f"  scraped {len(text)} chars of plain text")
    return text


def check_rate_limit(page: Page) -> dict:
    """Look for ChatGPT's 'Chats with attachments paused' quota banner.

    Returns {"paused": bool, "resume_at": str|None, "raw": str}.
    """
    return page.evaluate(
        """() => {
          const text = (document.body.innerText || '');
          const m = text.match(/Chats with attachments paused[\\s\\S]{0,300}/i);
          if (!m) return { paused: false, resume_at: null, raw: '' };
          const tm = m[0].match(/until ([0-9.:\\sAPMapm]+)/i);
          return { paused: true, resume_at: tm ? tm[1].trim() : null, raw: m[0].slice(0, 300) };
        }"""
    )


def looks_like_confirmation_prompt(text: str) -> bool:
    """Heuristic: does the assistant message look like a yes/no confirmation
    request that REQUIRES the user to reply yes/no?

    A bare "yes" or "ok" reply from the GPT is NOT a prompt — it's an
    acknowledgment that acts as the gate. Only flag if there's an actual
    question (with "?") asking us to confirm something.
    """
    if not text:
        return False
    t = text.strip().lower()
    # Bare acknowledgment — not a prompt
    if t in ("yes", "yes.", "y", "yep", "yep.", "sure", "ok", "ok.", "go ahead", "go ahead."):
        return False
    # Short prompt with a question mark asking for confirmation
    if len(t) < 200 and ("?" in t) and ("yes" in t or "confirm" in t or "proceed" in t or "ready" in t or "send" in t):
        return True
    return False


def asks_for_content_directly(text: str) -> bool:
    """Heuristic: does the assistant ask for the offer/page content directly?"""
    if not text:
        return False
    t = text.lower()
    return ("paste" in t or "send" in t or "share" in t or "provide" in t or "upload" in t or "copy" in t) and ("offer" in t or "page" in t or "content" in t or "url" in t or "details" in t or "information" in t)


def is_acknowledgment_gate(text: str) -> bool:
    """Detect the GPT's 'yes / ok / sure' gate after the style number is chosen.
    This is the moment to attach offer.txt (or skip)."""
    if not text:
        return False
    t = text.strip().lower()
    return t in ("yes", "yes.", "y", "yep", "yep.", "sure", "ok", "ok.", "go ahead", "go ahead.",
                 "y!", "yes!", "sure!", "ok!", "ready", "ready.")


def open_gpt(page: Page, target_key: str) -> str:
    """Navigate from chatgpt.com landing to the requested GPT's chat page."""
    info = TARGETS[target_key]
    log(f"opening GPT: {target_key} ({info['sidebar_match']})")
    # Always go to chatgpt.com first
    page.goto("https://chatgpt.com/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    if page.url.startswith("https://chatgpt.com/auth"):
        log("  not logged in — please log in (waiting up to 3 minutes)…")
        deadline = time.time() + 180
        while time.time() < deadline and page.url.startswith("https://chatgpt.com/auth"):
            time.sleep(2)
        if page.url.startswith("https://chatgpt.com/auth"):
            raise SystemExit("Login required and not completed in time.")
    # Start a NEW chat every time so we don't inherit history from a prior run.
    # The new-chat link is <a href="/"> in the sidebar.
    react_click(page, "a[href='/']", 0)
    time.sleep(2)
    # Try sidebar pin
    href = find_gpt_in_sidebar(page, info["sidebar_match"])
    if not href:
        log(f"  sidebar match failed, falling back to search")
        # Open GPT store search
        page.goto("https://chatgpt.com/?model=gpt-4o", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        # Search via the explore link
        page.goto("https://chatgpt.com/gpts", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        # Type into search and find
        ok = page.evaluate(
            """(q) => {
              const inp = document.querySelector('input[type="search"], input[placeholder*="search" i], input[name="search"]');
              if (!inp) return false;
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              setter.call(inp, q);
              inp.dispatchEvent(new Event('input', { bubbles: true }));
              return true;
            }""",
            info["gpt_search"],
        )
        time.sleep(3)
        # Click first GPT card
        react_click(page, "a[href^='/g/']", 0)
        time.sleep(3)
    return page.url


def run_tab_a(page: Page) -> None:
    run_dir = OUT_ROOT / "tab-a"
    run_dir.mkdir(parents=True, exist_ok=True)
    open_gpt(page, "tab-a")
    time.sleep(2)
    capture_state(page, run_dir, "01-initial")
    transcript = []

    # Each turn = 1 user msg + 1 assistant msg.
    # Step 1: send topic (matches the user's screenshot exactly)
    topic = "Growth mindset tips for overcoming challenges."
    send_message(page, topic)
    wait_until_idle(page)
    capture_state(page, run_dir, "02-after-topic")
    transcript.append({"step": "topic", "user": topic,
                       "assistant": get_last_assistant_text(page)[:1500]})

    # Step 2: send scheme
    send_message(page, "light")
    wait_until_idle(page)
    capture_state(page, run_dir, "03-after-scheme")
    transcript.append({"step": "scheme", "user": "light",
                       "assistant": get_last_assistant_text(page)[:1500]})

    # Step 3: send CTA
    send_message(page, "Comment mindset if you want the link.")
    wait_until_idle(page)
    capture_state(page, run_dir, "04-after-cta")
    transcript.append({"step": "cta", "user": "Comment mindset if you want the link.",
                       "assistant": get_last_assistant_text(page)[:1500]})

    # Step 4: send style number — pick 1
    send_message(page, "1")
    wait_until_idle(page)
    capture_state(page, run_dir, "05-after-style")
    transcript.append({"step": "style", "user": "1",
                       "assistant": get_last_assistant_text(page)[:1500]})

    # Per the user's screenshot Tab A is also two-step: GPT says "yes" and
    # the user pastes content. Step 5: send content for the AI to base the
    # infographic on. Use a generic fictional SaaS description (no real
    # copyrighted sales copy per constraints).
    offer = (
        "Compelling Content is an all-in-one social media management "
        "platform for agencies and growing teams. Schedule posts to every "
        "major network from one inbox, collaborate with your team, write "
        "captions with built-in AI, generate branded graphics, and review "
        "analytics across 125M+ tracked accounts. Growth Plan users get "
        "unlimited workspaces, white-label exports, and priority support."
    )
    send_message(page, offer)
    wait_until_idle(page, timeout_ms=240_000, long_poll=True)
    capture_state(page, run_dir, "06-after-content")
    transcript.append({"step": "content", "user": offer[:200] + "...",
                       "assistant": get_last_assistant_text(page)[:1500]})

    (run_dir / "transcript.json").write_text(json.dumps(transcript, indent=2), encoding="utf-8")
    (run_dir / "full-transcript.json").write_text(json.dumps(all_transcript(page), indent=2), encoding="utf-8")
    log(f"Tab A complete: {len(transcript)} turns, screenshots in {run_dir}")


def run_tab_b(page: Page, run_label: str, angle: str, scheme: str, cta: str,
              style_number: str,
              offer_url: str | None = None,
              offer_text_override: str | None = None,
              skip_offer: bool = False) -> None:
    """Drive the Instant Infographic Ads Custom GPT through the user's
    demonstrated flow: angle → scheme → CTA → style# → (yes-gate) → attach
    offer.txt (real scraped page content) → wait for final image.

    `offer_url` (preferred): scrape this real public page for the offer
        content. The Ads GPT expects the full plain-text dump of an entire
        webpage, exactly like a human select-all-copy-paste.
    `offer_text_override`: skip scraping, use this exact text instead
        (used for the "fictional short text vs scraped" comparison edge case).
    `skip_offer`: send "go ahead" with no content (edge case: does the GPT
        generate something anyway, or refuse?).
    """
    run_dir = OUT_ROOT / run_label
    run_dir.mkdir(parents=True, exist_ok=True)

    # --- Pre-step: scrape real page content if requested ---
    scraped_text = None
    if offer_url and not offer_text_override:
        scraped_text = scrape_page_text(page, offer_url)
        (run_dir / "offer.txt").write_text(scraped_text, encoding="utf-8")
        log(f"  saved scraped page text to {run_dir/'offer.txt'} ({len(scraped_text)} chars)")
    offer_text = offer_text_override or scraped_text or ""

    open_gpt(page, "tab-b")
    time.sleep(2)
    capture_state(page, run_dir, "01-initial")
    transcript = []
    rate_limit_retries = 0

    def guarded_send(text: str, attach_path: Path | None = None) -> None:
        nonlocal rate_limit_retries
        rl = check_rate_limit(page)
        if rl["paused"]:
            log(f"  RATE LIMIT HIT: {rl['raw'][:200]}")
            if rate_limit_retries < 1:
                log("  waiting 5 minutes before retry…")
                time.sleep(300)
                rate_limit_retries += 1
                rl = check_rate_limit(page)
                if rl["paused"]:
                    raise SystemExit(f"Rate limit still active after wait: {rl['raw'][:200]}")
            else:
                raise SystemExit(f"Rate limit hit, no retries left: {rl['raw'][:200]}")
        send_message(page, text, attach_path=attach_path)

    # Step 1: send angle
    guarded_send(angle)
    wait_until_idle(page)
    capture_state(page, run_dir, "02-after-angle")
    transcript.append({"step": "angle", "user": angle,
                       "assistant": get_last_assistant_text(page)[:1200]})

    # Step 2: send scheme
    guarded_send(scheme)
    wait_until_idle(page)
    capture_state(page, run_dir, "03-after-scheme")
    transcript.append({"step": "scheme", "user": scheme,
                       "assistant": get_last_assistant_text(page)[:1200]})

    # Step 3: send CTA
    guarded_send(cta)
    wait_until_idle(page)
    capture_state(page, run_dir, "04-after-cta")
    transcript.append({"step": "cta", "user": cta,
                       "assistant": get_last_assistant_text(page)[:1200]})

    # Step 4: send style number
    guarded_send(style_number)
    wait_until_idle(page)
    capture_state(page, run_dir, "05-after-style")
    transcript.append({"step": "style", "user": style_number,
                       "assistant": get_last_assistant_text(page)[:1200]})

    # Step 5: handle the "yes" gate.
    # The user's actual Tab B flow shows:
    #   Step 4 (send "1") → GPT replies "yes" → user immediately attaches offer.txt
    # So a bare "yes"/"ok"/"sure" is the GATE, not a question to reply to.
    # If the GPT instead asks a real question (e.g., "Want to use your own offer?"),
    # reply "yes" first, then proceed.
    last_text = get_last_assistant_text(page)
    log(f"  post-style assistant text (first 300): {last_text[:300]!r}")
    if is_acknowledgment_gate(last_text):
        log("  detected acknowledgment gate ('yes/ok/sure') → proceeding to attach offer")
    elif looks_like_confirmation_prompt(last_text):
        log("  detected confirmation prompt → sending 'yes'")
        guarded_send("yes")
        wait_until_idle(page)
        capture_state(page, run_dir, "06-after-yes")
        transcript.append({"step": "yes-gate", "user": "yes",
                           "assistant": get_last_assistant_text(page)[:1200]})
    elif asks_for_content_directly(last_text):
        log("  detected direct ask for content → skipping yes-gate")
    else:
        log("  no clear gate detected; proceeding straight to offer")

    # Step 6: attach the scraped offer.txt (the Ads GPT's expected format)
    if skip_offer:
        log("  skip_offer=True → sending 'go ahead'")
        guarded_send("go ahead")
    elif offer_text:
        # Write to file (always, so user can verify the scraped content)
        tmp = run_dir / "offer.txt"
        if scraped_text:
            tmp.write_text(scraped_text, encoding="utf-8")
        else:
            tmp.write_text(offer_text, encoding="utf-8")
        log(f"  attaching {tmp.name} ({tmp.stat().st_size} chars)")
        guarded_send("", attach_path=tmp)
    else:
        log("  no offer content available → sending 'go ahead' as fallback")
        guarded_send("go ahead")

    # Step 7: image generation can take 60-120s. Use long_poll=True.
    wait_until_idle(page, timeout_ms=240_000, long_poll=True)
    capture_state(page, run_dir, "07-after-image")
    transcript.append({"step": "offer-then-image",
                       "user": ("[attached offer.txt]" if (offer_text and not skip_offer) else "go ahead"),
                       "assistant": get_last_assistant_text(page)[:1200],
                       "has_image": True})

    (run_dir / "transcript.json").write_text(json.dumps(transcript, indent=2), encoding="utf-8")
    (run_dir / "full-transcript.json").write_text(json.dumps(all_transcript(page), indent=2), encoding="utf-8")
    log(f"{run_label} complete: {len(transcript)} turns, screenshots in {run_dir}")


def main(argv: list[str]) -> int:
    cmd = argv[1] if len(argv) > 1 else "tab-a"
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE),
            headless=False,
            channel="chrome",
            viewport={"width": 1280, "height": 1024},
            args=["--disable-blink-features=AutomationControlled", "--start-maximized"],
        )
        page = ctx.new_page()

        if cmd == "tab-a":
            run_tab_a(page)
        elif cmd == "tab-b-runs":
            # Run 1: real page scrape (trustiify.agency) — matches user's
            # first screenshot exactly: Objections crusher → dark → "dm me" → style 1.
            run_tab_b(
                page, "tab-b-run-1",
                angle="Objections crusher",
                scheme="dark",
                cta="dm me for more details",
                style_number="1",
                offer_url="https://trustiify.agency",
            )
            # Run 2: real page scrape of postplanify.com (our other public site),
            # different scheme/CTA/style to confirm pattern generalizes.
            run_tab_b(
                page, "tab-b-run-2",
                angle="Beginner onboarding checklist",
                scheme="light",
                cta="none",
                style_number="10",
                offer_url="https://postplanify.com",
            )
            # Run 3: skip paste entirely — send "go ahead" instead. Does the
            # GPT generate something usable without offer content, or refuse?
            run_tab_b(
                page, "tab-b-run-3",
                angle="5 reasons customers churn",
                scheme="light",
                cta="Visit launchpad.example",
                style_number="7",
                skip_offer=True,
            )
        elif cmd == "tab-b-edge-fictional":
            # Edge case: deliberately use a SHORT FICTIONAL offer blurb
            # (mimics the OLD broken behavior) so we can compare the output
            # against Run 1's real scraped-page version and document whether
            # the GPT still produces a usable image or something visibly worse.
            run_tab_b(
                page, "tab-b-edge-fictional",
                angle="Objections crusher",
                scheme="dark",
                cta="none",
                style_number="3",
                offer_text_override=(
                    "HabitKit is a habit-tracking desktop and mobile app with "
                    "streak analytics, smart reminders, and weekly review "
                    "summaries. Free tier covers 3 habits; Pro is $4/mo."
                ),
            )
        else:
            print(f"Unknown command: {cmd}")
            return 1

        ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
