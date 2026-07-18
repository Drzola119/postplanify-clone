// Deep exploration of upload-post.com — visits every major page
// (not just /dashboard) and captures screenshots + key features.
//
// Uses a COPY of the persistent profile (so the user's live browser keeps
// its lockfile intact). Login survives via the cookie/Local Storage copy.
// Browser stays open at end.
//
// Run: node scripts/deep-explore.js

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
  'playwright-upload-post-profile-copy'
);

const OUT_DIR = path.resolve(
  __dirname,
  '../docs/research/upload-post/deep'
);
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
      'input, textarea, select, button, label, [role="button"]'
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
  fs.writeFileSync(
    path.join(OUT_DIR, `${name}.json`),
    JSON.stringify(data, null, 2)
  );
  return data;
}

function copyProfileSync(src, dest) {
  if (fs.existsSync(dest)) {
    log(`removing old copy at ${dest}`);
    fs.rmSync(dest, { recursive: true, force: true });
  }
  log(`copying profile: ${src} -> ${dest}`);
  // Copy synchronously — only the essential auth state files.
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
    'Default/Network',
  ];
  for (const rel of filesToCopy) {
    const s = path.join(src, rel);
    const d = path.join(dest, rel);
    if (fs.existsSync(s)) {
      try {
        fs.cpSync(s, d, { recursive: true });
        log(`  copied ${rel}`);
      } catch (e) {
        log(`  failed ${rel}: ${e.message}`);
      }
    }
  }
}

const PAGES = [
  { slug: 'dashboard', path: '/dashboard', wait: 4000 },
  { slug: 'shorts', path: '/shorts', wait: 3000 },
  { slug: 'calendar', path: '/calendar', wait: 3000 },
  { slug: 'analytics', path: '/analytics', wait: 3000 },
  { slug: 'users', path: '/users', wait: 3000 },
  { slug: 'apikeys', path: '/apikeys', wait: 3000 },
  { slug: 'pricing', path: '/pricing', wait: 3000 },
  { slug: 'docs', path: '/docs', wait: 3000 },
  { slug: 'docs-api', path: '/docs/api', wait: 3000 },
  { slug: 'n8n-templates', path: '/n8n-templates', wait: 3000 },
  { slug: 'home', path: '/', wait: 2000 },
];

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
    if (frame === page.mainFrame()) {
      log(`navigated -> ${frame.url()}`);
    }
  });
  page.on('pageerror', (err) => log(`PAGE ERROR: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') log(`CONSOLE ERROR: ${msg.text()}`);
  });

  for (const p of PAGES) {
    const url = `https://app.upload-post.com${p.path}`;
    log(`\n=== ${p.slug.toUpperCase()} -> ${url} ===`);
    try {
      const resp = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      log(`  HTTP ${resp ? resp.status() : 'no-response'}`);
      await page.waitForTimeout(p.wait);
      await shoot(page, `01-${p.slug}`);
      const data = await snap(page, `01-${p.slug}`);
      log(`  h1: ${data.h1.join(' | ')}`);
      log(`  h2: ${data.h2.join(' | ')}`);
      log(`  fields: ${data.fields.length}`);
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a, button')).map((el) =>
          (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
        )
      );
      log(`  unique buttons/links (top 30):`);
      const uniqueLinks = Array.from(new Set(links.filter((s) => s && s.length > 2)));
      uniqueLinks.slice(0, 30).forEach((l) => log(`    - ${l}`));
    } catch (e) {
      log(`  ERROR: ${e.message}`);
    }
  }

  log('\n=== DEEP EXPLORATION COMPLETE ===');
  log(`artifacts: ${OUT_DIR}`);
  log('browser remains OPEN. You can continue exploring yourself.');
  log('to close: just close the window.');

  page.on('close', () => process.exit(0));
  context.on('close', () => process.exit(0));
  await new Promise(() => {});
})().catch((err) => {
  log(`fatal: ${err.message}`);
  console.error(err);
  setInterval(() => {}, 1 << 30);
});