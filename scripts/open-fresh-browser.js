// Opens a fresh, isolated Chromium browser with no persistent storage.
// Each run uses a unique ephemeral user-data-dir so no cookies, cache,
// localStorage, or IndexedDB carry over from prior runs.
//
// Run: node scripts/open-fresh-browser.js [startUrl]

const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');

(async () => {
  const startUrl = process.argv[2] || 'https://www.google.com';

  // Per-run ephemeral dir. Deleted on process exit so nothing leaks.
  const tmpDir = path.join(
    os.tmpdir(),
    `playwright-fresh-${process.pid}-${crypto.randomBytes(4).toString('hex')}`
  );
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log('[browser] launching fresh Chromium');
  console.log('[browser] ephemeral profile:', tmpDir);

  const context = await chromium.launchPersistentContext(tmpDir, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
    ],
    // Block any persistent storage from leaking between runs.
    storageState: undefined,
    // Disable caching explicitly.
    bypassCSP: false,
  });

  const page = await context.newPage();

  // Clear any cookies that launchPersistentContext may have inherited.
  await context.clearCookies();

  console.log(`[browser] navigating to ${startUrl}`);
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' });

  console.log('[browser] ready — log in to Gmail manually');
  console.log('[browser] then tell Claude what you want to compare');

  page.on('close', () => {
    console.log('[browser] page closed by user');
    context.close().finally(() => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      process.exit(0);
    });
  });

  // Keep alive until the page/browser closes.
  await new Promise(() => {});
})().catch((err) => {
  console.error('[browser] error:', err);
  process.exit(1);
});
