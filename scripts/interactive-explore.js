// Interactive exploration of upload-post.com dashboard:
//   1. Open dashboard (Manual mode)
//   2. Upload a test image (user-authorized)
//   3. Check ALL 13 platform boxes
//   4. Capture every per-platform option that reveals itself
//   5. Expand scheduling section and capture options
//   6. LEAVE BROWSER OPEN at the end
//
// Uses the persistent profile so login survives.
//
// Run: node scripts/interactive-explore.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PROFILE_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local'),
  'playwright-upload-post-profile'
);

const TEST_IMAGE = path.resolve(
  __dirname,
  '../public/hasan-cagli-profile-picture.png'
);

const OUT_DIR = path.resolve(
  __dirname,
  '../docs/research/upload-post/interactive'
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
    // Capture every visible form field with its surrounding label.
    for (const el of document.querySelectorAll(
      'input, textarea, select, button, label, [role="button"]'
    )) {
      if (!visible(el)) continue;
      const labelEl = el.closest('label') ||
        document.querySelector(`label[for="${el.id}"]`);
      const labelText = labelEl ? clean(labelEl.textContent) : '';
      // Try to find nearby descriptive text.
      let contextText = '';
      const parent = el.parentElement;
      if (parent) {
        contextText = clean(parent.textContent).slice(0, 300);
      }
      fields.push({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        name: el.getAttribute('name'),
        placeholder: el.getAttribute('placeholder'),
        value: el.value || '',
        checked: el.checked || false,
        text: clean(el.textContent).slice(0, 200),
        labelText,
        contextText: contextText.slice(0, 400),
        ariaLabel: el.getAttribute('aria-label'),
        options: el.tagName === 'SELECT'
          ? Array.from(el.querySelectorAll('option')).map(
              (o) => o.value + ':' + clean(o.textContent)
            )
          : undefined,
      });
    }
    return {
      url: location.href,
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1')).map((h) =>
        clean(h.textContent)
      ),
      h2: Array.from(document.querySelectorAll('h2')).map((h) =>
        clean(h.textContent)
      ),
      h3: Array.from(document.querySelectorAll('h3')).map((h) =>
        clean(h.textContent)
      ),
      bodyText: clean(document.body.innerText).slice(0, 30000),
      fields: fields.slice(0, 500),
    };
  });
  fs.writeFileSync(
    path.join(OUT_DIR, `${name}.json`),
    JSON.stringify(data, null, 2)
  );
  return data;
}

(async () => {
  log(`opening persistent browser (profile=${PROFILE_DIR})`);
  log(`test image: ${TEST_IMAGE}`);

  if (!fs.existsSync(TEST_IMAGE)) {
    log(`FATAL: test image not found at ${TEST_IMAGE}`);
    process.exit(1);
  }

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || (await context.newPage());

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      log(`navigated -> ${frame.url()}`);
    }
  });

  log('STEP 1: navigate to dashboard (Manual mode)');
  await page.goto('https://app.upload-post.com/dashboard', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(2500);
  await shoot(page, '01-dashboard-initial');
  await snap(page, '01-dashboard-initial');

  // Click "Manual" tab to be sure.
  try {
    await page.click('a[href="/dashboard"]:has-text("Manual")', {
      timeout: 2000,
    });
    await page.waitForTimeout(800);
    log('  clicked Manual tab');
  } catch (e) {
    log(`  Manual tab already active or not clickable: ${e.message}`);
  }

  log('STEP 2: expand "Set up core content" section');
  try {
    await page.click('button:has-text("Set up core content")', {
      timeout: 3000,
    });
    await page.waitForTimeout(800);
    log('  expanded');
  } catch (e) {
    log(`  expand failed: ${e.message}`);
  }

  log('STEP 3: upload test image');
  try {
    const fileInputs = await page.$$('input[type="file"]');
    log(`  found ${fileInputs.length} file inputs`);
    if (fileInputs.length > 0) {
      await fileInputs[0].setInputFiles(TEST_IMAGE);
      log(`  uploaded: ${TEST_IMAGE}`);
      await page.waitForTimeout(2500);
      await shoot(page, '02-after-upload');
      await snap(page, '02-after-upload');
    } else {
      log('  no file input — taking screenshot of current state');
      await shoot(page, '02-no-file-input');
    }
  } catch (e) {
    log(`  upload failed: ${e.message}`);
    await shoot(page, '02-upload-error');
  }

  log('STEP 4: fill title (placeholder="Enter title for your post")');
  try {
    await page.fill(
      'textarea[placeholder="Enter title for your post"]',
      'Test post from Trustiify gap-analysis — please ignore'
    );
    await page.waitForTimeout(400);
    log('  title filled');
  } catch (e) {
    log(`  title fill skipped: ${e.message}`);
  }

  log('STEP 5: expand "Platform-specific settings" section');
  try {
    await page.click('button:has-text("Platform-specific settings")', {
      timeout: 3000,
    });
    await page.waitForTimeout(800);
    await shoot(page, '03-platform-section-open');
    await snap(page, '03-platform-section-open');
  } catch (e) {
    log(`  expand failed: ${e.message}`);
  }

  log('STEP 6: enumerate all platform checkboxes');
  const platforms = await page.evaluate(() => {
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
    const out = [];
    // Look for checkboxes with associated label text mentioning platforms.
    for (const cb of document.querySelectorAll('input[type="checkbox"]')) {
      if (!visible(cb)) continue;
      // Find the closest platform label by walking up to a parent that has
      // a TikTok/Instagram/YouTube/etc. word in its text.
      let parent = cb.parentElement;
      let labelText = '';
      for (let i = 0; i < 6 && parent; i++, parent = parent.parentElement) {
        const t = clean(parent.textContent);
        if (
          /\b(TikTok|Instagram|YouTube|LinkedIn|Facebook|X|Threads|Pinterest|Reddit|Bluesky|Telegram|Discord|Google Business)\b/i.test(
            t
          )
        ) {
          labelText = t.slice(0, 200);
          break;
        }
      }
      out.push({
        checked: cb.checked,
        labelText,
        id: cb.id,
        name: cb.name,
      });
    }
    return out;
  });
  log(`  found ${platforms.length} visible platform checkboxes`);
  fs.writeFileSync(
    path.join(OUT_DIR, 'platform-checkboxes.json'),
    JSON.stringify(platforms, null, 2)
  );

  log('STEP 7: check ALL platform checkboxes');
  const checkboxes = await page.$$('input[type="checkbox"]');
  let checkedCount = 0;
  for (let i = 0; i < checkboxes.length; i++) {
    try {
      const cb = checkboxes[i];
      const isVisible = await cb.isVisible();
      const isChecked = await cb.isChecked();
      if (!isVisible) continue;
      if (isChecked) {
        checkedCount++;
        continue;
      }
      await cb.click();
      checkedCount++;
      await page.waitForTimeout(450);
      log(`  checked #${i} (count=${checkedCount})`);
    } catch (e) {
      log(`  skip #${i}: ${e.message}`);
    }
  }
  log(`  total checked: ${checkedCount}`);
  await page.waitForTimeout(1500);

  log('STEP 8: capture full state with ALL platforms enabled');
  await shoot(page, '04-all-platforms-checked');
  const fullState = await snap(page, '04-all-platforms-checked');

  log('STEP 9: extract every per-platform field by section');
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
    // Find every visible input/textarea/select whose surrounding text contains
    // a platform name. Group fields by their containing platform section.
    const groups = new Map();
    for (const el of document.querySelectorAll(
      'input, textarea, select, button, [role="button"]'
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
        name: el.getAttribute('name'),
        placeholder: el.getAttribute('placeholder'),
        value: el.value || '',
        checked: el.checked || false,
        text: clean(el.textContent).slice(0, 200),
        options: el.tagName === 'SELECT'
          ? Array.from(el.querySelectorAll('option')).map(
              (o) => o.value + ':' + clean(o.textContent)
            )
          : undefined,
      });
    }
    return Object.fromEntries(groups);
  });
  fs.writeFileSync(
    path.join(OUT_DIR, 'per-platform-fields.json'),
    JSON.stringify(perPlatform, null, 2)
  );
  log('  platforms with custom fields:');
  for (const [plat, fields] of Object.entries(perPlatform)) {
    log(`    ${plat}: ${fields.length} fields`);
  }

  log('STEP 10: expand "Scheduling & submission"');
  try {
    await page.click('button:has-text("Scheduling & submission")', {
      timeout: 3000,
    });
    await page.waitForTimeout(800);
    await shoot(page, '05-scheduling-open');
    await snap(page, '05-scheduling-open');
  } catch (e) {
    log(`  expand failed: ${e.message}`);
  }

  log('STEP 11: capture scheduling fields');
  const schedFields = await page.evaluate(() => {
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
    const out = [];
    for (const el of document.querySelectorAll(
      'input, textarea, select, button, [role="button"]'
    )) {
      if (!visible(el)) continue;
      const t = clean(el.textContent);
      if (
        /schedule|queue|timezone|async|submit|publish/i.test(
          el.getAttribute('aria-label') || el.getAttribute('placeholder') || t
        )
      ) {
        out.push({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type'),
          text: t.slice(0, 200),
          options: el.tagName === 'SELECT'
            ? Array.from(el.querySelectorAll('option')).map(
                (o) => o.value + ':' + clean(o.textContent)
              )
            : undefined,
        });
      }
    }
    return out;
  });
  fs.writeFileSync(
    path.join(OUT_DIR, 'scheduling-fields.json'),
    JSON.stringify(schedFields, null, 2)
  );
  log(`  scheduling fields: ${schedFields.length}`);

  log('STEP 12: dump full body text of current state');
  const finalText = await page.evaluate(() =>
    document.body.innerText.replace(/\n{3,}/g, '\n\n')
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'final-body-text.txt'),
    finalText.slice(0, 60000)
  );

  log('=== INTERACTIVE EXPLORATION COMPLETE ===');
  log(`artifacts: ${OUT_DIR}`);
  log('browser remains OPEN. You can scroll/click/test more yourself.');
  log('to close: just close the window.');

  page.on('close', () => process.exit(0));
  context.on('close', () => process.exit(0));
  await new Promise(() => {});
})().catch((err) => {
  log(`fatal: ${err.message}`);
  console.error(err);
  setInterval(() => {}, 1 << 30);
});
