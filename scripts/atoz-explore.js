// A-to-Z exploration: capture every interactive state of every page
// on upload-post.com with real-time data. Captures multiple states
// (different periods, view modes, expanded sections, etc.) per page.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const SOURCE_PROFILE = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local'),
  'playwright-upload-post-profile'
);
const COPY_PROFILE = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local'),
  'playwright-upload-post-profile-atoz'
);

const OUT_DIR = path.resolve(__dirname, '../docs/research/upload-post/atoz');
fs.mkdirSync(OUT_DIR, { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(path.join(OUT_DIR, 'actions.log'), line + '\n');
}

async function shoot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function snap(page, name) {
  const data = await page.evaluate(() => {
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
    const fields = [];
    for (const el of document.querySelectorAll(
      'input, textarea, select, button, label, [role="button"], [role="tab"]'
    )) {
      if (!visible(el)) continue;
      const labelEl =
        el.closest('label') || document.querySelector(`label[for="${el.id}"]`);
      const labelText = labelEl ? clean(labelEl.textContent) : '';
      let contextText = '';
      const parent = el.parentElement;
      if (parent) contextText = clean(parent.textContent).slice(0, 400);
      fields.push({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        name: el.getAttribute('name'),
        placeholder: el.getAttribute('placeholder'),
        value: el.value || '',
        checked: el.checked || false,
        text: clean(el.textContent).slice(0, 200),
        labelText,
        contextText,
        ariaLabel: el.getAttribute('aria-label'),
        href: el.getAttribute('href'),
        options:
          el.tagName === 'SELECT'
            ? Array.from(el.querySelectorAll('option')).map(
                (o) => o.value + ':' + clean(o.textContent)
              )
            : undefined,
      });
    }
    return {
      url: location.href,
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1')).map((h) => clean(h.textContent)),
      h2: Array.from(document.querySelectorAll('h2')).map((h) => clean(h.textContent)),
      h3: Array.from(document.querySelectorAll('h3')).map((h) => clean(h.textContent)),
      bodyText: clean(document.body.innerText).slice(0, 30000),
      fields: fields.slice(0, 500),
    };
  });
  fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(data, null, 2));
  return data;
}

function copyProfileSync(src, dest) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.mkdirSync(path.join(dest, 'Default'), { recursive: true });
  const filesToCopy = [
    'Default/Cookies',
    'Default/Cookies-journal',
    'Default/Login Data',
    'Default/Login Data-journal',
    'Default/Preferences',
    'Default/Secure Preferences',
    'Default/Local Storage',
    'Default/Session Storage',
  ];
  for (const rel of filesToCopy) {
    const s = path.join(src, rel);
    const d = path.join(dest, rel);
    if (fs.existsSync(s)) {
      try {
        fs.cpSync(s, d, { recursive: true });
      } catch (e) {
        log(`copy ${rel}: ${e.message}`);
      }
    }
  }
}

(async () => {
  copyProfileSync(SOURCE_PROFILE, COPY_PROFILE);
  log(`opening persistent browser (profile=${COPY_PROFILE})`);

  const context = await chromium.launchPersistentContext(COPY_PROFILE, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || (await context.newPage());
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) log(`navigated -> ${frame.url()}`);
  });
  page.on('pageerror', (err) => log(`PAGE ERROR: ${err.message}`));

  // ============================================================
  // ANALYTICS — capture all periods
  // ============================================================
  log('\n=== ANALYTICS: all periods ===');
  await page.goto('https://app.upload-post.com/analytics', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(4000);
  await shoot(page, 'analytics-initial');
  await snap(page, 'analytics-initial');

  // Try each period
  const periods = ['last_week', 'last_month', 'last_3months', 'last_year', 'custom'];
  for (const p of periods) {
    try {
      await page.selectOption('select', p);
      await page.waitForTimeout(2500);
      const safe = p.replace(/_/g, '-');
      await shoot(page, `analytics-${safe}`);
      await snap(page, `analytics-${safe}`);
      log(`  period ${p} captured`);
    } catch (e) {
      log(`  period ${p}: ${e.message}`);
    }
  }

  // ============================================================
  // CALENDAR — capture all view modes
  // ============================================================
  log('\n=== CALENDAR: all view modes ===');
  await page.goto('https://app.upload-post.com/calendar', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(4000);
  await shoot(page, 'calendar-week');
  await snap(page, 'calendar-week');

  for (const view of ['Mois', 'Semaine', 'Jour']) {
    try {
      const buttons = await page.$$('button');
      for (const b of buttons) {
        const t = (await b.textContent()) || '';
        if (t.trim() === view) {
          await b.click();
          await page.waitForTimeout(2500);
          const safe = view.toLowerCase().replace(/[^a-z0-9]/g, '-');
          await shoot(page, `calendar-${safe}`);
          await snap(page, `calendar-${safe}`);
          log(`  view ${view} captured`);
          break;
        }
      }
    } catch (e) {
      log(`  view ${view}: ${e.message}`);
    }
  }

  // ============================================================
  // DASHBOARD — check ALL platforms + expand per-platform settings
  // ============================================================
  log('\n=== DASHBOARD: full configuration ===');
  await page.goto('https://app.upload-post.com/dashboard', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(4000);
  await shoot(page, 'dashboard-initial');
  await snap(page, 'dashboard-initial');

  // Expand platform-specific settings
  try {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const t = (await b.textContent()) || '';
      if (t.includes('Platform-specific settings')) {
        await b.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
  } catch (e) {
    log(`  expand platform: ${e.message}`);
  }

  // Check ALL platform checkboxes
  try {
    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const cb of checkboxes) {
      try {
        const visible = await cb.isVisible();
        const checked = await cb.isChecked();
        if (!visible) continue;
        if (!checked) await cb.click();
        await page.waitForTimeout(150);
      } catch {}
    }
    await page.waitForTimeout(2000);
    await shoot(page, 'dashboard-all-platforms-checked');
    await snap(page, 'dashboard-all-platforms-checked');
    log('  all platforms checked');
  } catch (e) {
    log(`  check platforms: ${e.message}`);
  }

  // Capture per-platform settings
  try {
    const perPlatform = await page.evaluate(() => {
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
      const PLATFORM_RE =
        /\b(TikTok|Instagram|YouTube|LinkedIn|Facebook|X|Threads|Pinterest|Reddit|Bluesky|Telegram|Discord|Google Business)\b/i;
      const groups = new Map();
      for (const el of document.querySelectorAll(
        'input, textarea, select, button, label, [role="button"]'
      )) {
        if (!visible(el)) continue;
        let parent = el.parentElement;
        let platform = '';
        for (let i = 0; i < 8 && parent; i++, parent = parent.parentElement) {
          const t = clean(parent.textContent);
          const m = t.match(PLATFORM_RE);
          if (m) {
            platform = m[1];
            break;
          }
        }
        if (!platform) continue;
        if (!groups.has(platform)) groups.set(platform, []);
        groups.get(platform).push({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type'),
          label: clean(el.textContent).slice(0, 150),
          value: el.value || '',
          checked: el.checked || false,
          options:
            el.tagName === 'SELECT'
              ? Array.from(el.querySelectorAll('option')).map(
                  (o) => o.value + ':' + clean(o.textContent)
                )
              : undefined,
        });
      }
      return Object.fromEntries(groups);
    });
    fs.writeFileSync(
      path.join(OUT_DIR, 'dashboard-per-platform.json'),
      JSON.stringify(perPlatform, null, 2)
    );
    log('  per-platform captured');
    for (const [plat, fields] of Object.entries(perPlatform)) {
      log(`    ${plat}: ${fields.length} fields`);
    }
  } catch (e) {
    log(`  per-platform capture: ${e.message}`);
  }

  // Upload a file to trigger preview + cURL
  try {
    const testImage = path.resolve(
      __dirname,
      '../public/hasan-cagli-profile-picture.png'
    );
    if (fs.existsSync(testImage)) {
      const fileInputs = await page.$$('input[type="file"]');
      if (fileInputs.length > 0) {
        await fileInputs[0].setInputFiles(testImage);
        await page.waitForTimeout(3000);
        await shoot(page, 'dashboard-with-media');
        await snap(page, 'dashboard-with-media');
        log('  media uploaded');
      }
    }
  } catch (e) {
    log(`  upload media: ${e.message}`);
  }

  // ============================================================
  // SHORTS — full uploader flow
  // ============================================================
  log('\n=== SHORTS UPLOADER ===');
  await page.goto('https://app.upload-post.com/shorts', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(3000);
  await shoot(page, 'shorts-initial');
  await snap(page, 'shorts-initial');

  // Try uploading a video
  try {
    const testImage = path.resolve(
      __dirname,
      '../public/hasan-cagli-profile-picture.png'
    );
    if (fs.existsSync(testImage)) {
      const fileInputs = await page.$$('input[type="file"]');
      if (fileInputs.length > 0) {
        await fileInputs[0].setInputFiles(testImage);
        await page.waitForTimeout(3000);
        await shoot(page, 'shorts-after-upload');
        await snap(page, 'shorts-after-upload');
        log('  shorts: media uploaded');
      }
    }
  } catch (e) {
    log(`  shorts upload: ${e.message}`);
  }

  // ============================================================
  // MANAGE PROFILES (managed users)
  // ============================================================
  log('\n=== MANAGE PROFILES (Users) ===');
  await page.goto('https://app.upload-post.com/users', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);
  await shoot(page, 'users-initial');
  await snap(page, 'users-initial');

  // ============================================================
  // API KEYS
  // ============================================================
  log('\n=== API KEYS ===');
  await page.goto('https://app.upload-post.com/apikeys', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);
  await shoot(page, 'apikeys-initial');
  await snap(page, 'apikeys-initial');

  // ============================================================
  // DOCS — public docs site
  // ============================================================
  log('\n=== DOCS ===');
  for (const docPath of ['/docs', '/docs/api', '/n8n-templates']) {
    const url = `https://app.upload-post.com${docPath}`;
    try {
      const resp = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      log(`  ${docPath}: HTTP ${resp ? resp.status() : 'no-response'}`);
      await page.waitForTimeout(4000);
      const safe = docPath.replace(/\//g, '_');
      await shoot(page, `docs${safe}`);
      await snap(page, `docs${safe}`);
    } catch (e) {
      log(`  ${docPath}: ${e.message}`);
    }
  }

  // ============================================================
  // Mobile viewport — dashboard, calendar, analytics
  // ============================================================
  log('\n=== MOBILE VIEWS ===');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/dashboard', '/calendar', '/analytics', '/shorts']) {
    await page.goto(`https://app.upload-post.com${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3500);
    const safe = path.replace(/\//g, '_');
    await shoot(page, `mobile${safe}`);
    await snap(page, `mobile${safe}`);
  }

  log('\n=== A-TO-Z EXPLORATION COMPLETE ===');
  log(`artifacts: ${OUT_DIR}`);
  log('browser remains OPEN. You can continue exploring yourself.');

  page.on('close', () => process.exit(0));
  context.on('close', () => process.exit(0));
  await new Promise(() => {});
})().catch((err) => {
  log(`fatal: ${err.message}`);
  console.error(err);
  setInterval(() => {}, 1 << 30);
});