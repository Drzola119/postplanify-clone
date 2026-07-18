// Comprehensive exploration of upload-post.com dashboard.
// Opens the persistent profile (your login), navigates to /dashboard,
// scrolls through the entire page taking screenshots at each viewport,
// extracts all interactive elements, clicks through key features,
// captures modal/form state. At the END leaves the browser open — you
// take over.
//
// Run: node scripts/explore-upload-post.js [url]
//      defaults to https://app.upload-post.com/dashboard

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PROFILE_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local'),
  'playwright-upload-post-profile'
);

const START_URL = process.argv[2] || 'https://app.upload-post.com/dashboard';
const OUT_DIR = path.resolve(
  __dirname,
  '../docs/research/upload-post/dashboard-exploration'
);
fs.mkdirSync(OUT_DIR, { recursive: true });

function ts() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(path.join(OUT_DIR, 'actions.log'), line + '\n');
}

async function captureSnapshot(page, name) {
  const file = path.join(OUT_DIR, `${String(name).padStart(3, '0')}-${ts()}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function extractContent(page) {
  return await page.evaluate(() => {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const text = (sel) =>
      Array.from(document.querySelectorAll(sel))
        .map((el) => clean(el.textContent))
        .filter(Boolean);
    const attrs = (sel, attr) =>
      Array.from(document.querySelectorAll(sel))
        .map((el) => el.getAttribute(attr))
        .filter(Boolean);
    const visible = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (
        cs.display !== 'none' &&
        cs.visibility !== 'hidden' &&
        r.width > 0 &&
        r.height > 0
      );
    };
    const interactive = Array.from(
      document.querySelectorAll(
        'button, a, input, textarea, select, [role="button"], [role="tab"], [contenteditable="true"]'
      )
    )
      .filter(visible)
      .slice(0, 200)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        text: clean(el.textContent).slice(0, 80),
        placeholder: el.getAttribute('placeholder'),
        href: el.getAttribute('href'),
        aria: el.getAttribute('aria-label'),
        name: el.getAttribute('name'),
      }));
    return {
      title: document.title,
      url: location.href,
      h1: text('h1'),
      h2: text('h2'),
      h3: text('h3'),
      navText: text('nav, header').slice(0, 30),
      buttons: text('button').slice(0, 60),
      inputs: text('input').slice(0, 30),
      placeholders: attrs('input, textarea', 'placeholder').slice(0, 30),
      interactive,
      bodyText: clean(document.body.innerText).slice(0, 30000),
    };
  });
}

(async () => {
  log(`opening persistent browser (profile=${PROFILE_DIR})`);
  log(`target URL: ${START_URL}`);

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = context.pages()[0] || (await context.newPage());

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      log(`navigated -> ${frame.url()}`);
    }
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      log(`console.error: ${msg.text()}`);
    }
  });

  log('step 1: navigating to dashboard');
  await page.goto(START_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  log('step 2: capture initial viewport + content');
  await captureSnapshot(page, 0);
  let snap = await extractContent(page);
  fs.writeFileSync(
    path.join(OUT_DIR, `00-initial.json`),
    JSON.stringify(snap, null, 2)
  );
  log(`  title=${snap.title} h1=${snap.h1.length} buttons=${snap.buttons.length} interactive=${snap.interactive.length}`);

  log('step 3: scroll incrementally through entire page');
  const scrollPositions = await page.evaluate(() => {
    const totalH = document.body.scrollHeight;
    const stepH = Math.max(window.innerHeight * 0.8, 600);
    const positions = [];
    for (let y = 0; y < totalH; y += stepH) positions.push(y);
    positions.push(totalH);
    return positions;
  });
  log(`  total scroll height = ${scrollPositions[scrollPositions.length - 1]}px, ${scrollPositions.length} positions`);

  let idx = 1;
  for (const y of scrollPositions) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(900);
    await captureSnapshot(page, idx);
    snap = await extractContent(page);
    fs.writeFileSync(
      path.join(OUT_DIR, `${String(idx).padStart(3, '0')}-scroll-${y}.json`),
      JSON.stringify(snap, null, 2)
    );
    log(`  scroll y=${y}  buttons=${snap.buttons.length} h2=${snap.h2.length} interactive=${snap.interactive.length}`);
    idx++;
  }

  // Scroll back to top so user sees the start of the dashboard.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  log('step 4: enumerate ALL interactive elements across whole page');
  await page.evaluate(() => window.scrollTo(0, 0));
  const allInteractive = await page.evaluate(() => {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const visible = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (
        cs.display !== 'none' &&
        cs.visibility !== 'hidden' &&
        r.width > 0 &&
        r.height > 0
      );
    };
    const seen = new Set();
    const out = [];
    for (const el of document.querySelectorAll(
      'button, a, input, textarea, select, [role="button"], [role="tab"], [contenteditable="true"], label'
    )) {
      if (!visible(el)) continue;
      const key =
        el.tagName +
        '|' +
        clean(el.textContent).slice(0, 60) +
        '|' +
        (el.getAttribute('href') || '') +
        '|' +
        (el.getAttribute('placeholder') || '');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        tag: el.tagName.toLowerCase(),
        text: clean(el.textContent).slice(0, 120),
        href: el.getAttribute('href'),
        placeholder: el.getAttribute('placeholder'),
        type: el.getAttribute('type'),
        aria: el.getAttribute('aria-label'),
        name: el.getAttribute('name'),
      });
      if (out.length >= 500) break;
    }
    return out;
  });
  fs.writeFileSync(
    path.join(OUT_DIR, 'all-interactive-elements.json'),
    JSON.stringify(allInteractive, null, 2)
  );
  log(`  enumerated ${allInteractive.length} interactive elements`);

  log('step 5: try clicking obvious upload/composer buttons to surface modals');
  const candidates = await page.evaluate(() => {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const lower = (s) => (s || '').toLowerCase();
    const visible = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (
        cs.display !== 'none' &&
        cs.visibility !== 'hidden' &&
        r.width > 0 &&
        r.height > 0
      );
    };
    const keywords = [
      'upload',
      'new post',
      'create',
      'compose',
      'add',
      'schedule',
      'bulk',
      'media',
      'library',
      'connect',
      'settings',
      'analytics',
      'inbox',
      'campaign',
    ];
    const out = [];
    for (const el of document.querySelectorAll(
      'button, a, [role="button"]'
    )) {
      if (!visible(el)) continue;
      const text = lower(clean(el.textContent));
      if (keywords.some((k) => text.includes(k))) {
        out.push({
          tag: el.tagName.toLowerCase(),
          text: clean(el.textContent).slice(0, 80),
          href: el.getAttribute('href'),
        });
      }
    }
    return out;
  });
  fs.writeFileSync(
    path.join(OUT_DIR, 'feature-candidates.json'),
    JSON.stringify(candidates, null, 2)
  );
  log(`  found ${candidates.length} feature-candidate buttons/links`);

  // Click up to 8 of them (safely) and capture what opens.
  let clickIdx = idx;
  for (const c of candidates.slice(0, 8)) {
    try {
      log(`  clicking "${c.text}"`);
      const sel =
        c.tag === 'a' && c.href
          ? `a[href="${c.href}"]`
          : `${c.tag}:has-text("${c.text.replace(/"/g, '\\"').slice(0, 30)}")`;
      await page.click(sel, { timeout: 3000 });
      await page.waitForTimeout(1500);
      await captureSnapshot(page, clickIdx);
      const cs = await extractContent(page);
      fs.writeFileSync(
        path.join(
          OUT_DIR,
          `${String(clickIdx).padStart(3, '0')}-click-${c.text
            .replace(/[^a-z0-9]+/gi, '-')
            .slice(0, 40)}.json`
        ),
        JSON.stringify(
          {
            clicked: c,
            url: cs.url,
            title: cs.title,
            h1: cs.h1,
            h2: cs.h2,
            buttons: cs.buttons,
            inputs: cs.inputs,
            bodyText: cs.bodyText.slice(0, 6000),
          },
          null,
          2
        )
      );
      clickIdx++;
      // Try to close any modal/dialog that opened.
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
      // Go back if it was a navigation.
      if (page.url() !== START_URL) {
        await page.goto(START_URL, { waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(1000);
      }
    } catch (err) {
      log(`    click failed: ${err.message}`);
    }
  }

  log('=== EXPLORATION COMPLETE ===');
  log(`artifacts: ${OUT_DIR}`);
  log('browser remains OPEN. Scroll/click yourself from here.');
  log('to close: just close the window.');

  // Do NOT close. Keep alive.
  page.on('close', () => process.exit(0));
  context.on('close', () => process.exit(0));
  await new Promise(() => {});
})().catch((err) => {
  log(`fatal: ${err.message}`);
  console.error(err);
  setInterval(() => {}, 1 << 30);
});
