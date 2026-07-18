// Opens a headed Chromium browser and navigates to upload-post.com so the
// user can log in themselves. Stays open until closed manually.
// Run: node scripts/open-upload-post-browser.js

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 0,
    args: ['--start-maximized'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('[browser] navigating to upload-post.com');
  await page.goto('https://upload-post.com', { waitUntil: 'domcontentloaded' });

  console.log('[browser] ready — log in to UploadPost manually');
  console.log('[browser] then tell Claude what you want to compare');

  // Stay open until the user closes the window or hits Ctrl+C in this terminal.
  // We poll the page state every 5s and exit when the URL contains /dashboard
  // or /login (after login, they may navigate around).
  page.on('close', () => {
    console.log('[browser] page closed by user');
    process.exit(0);
  });

  // Keep the script alive. Playwright keeps the browser alive as long as the
  // Node process holds the page handle.
  await new Promise(() => {});
})().catch((err) => {
  console.error('[browser] error:', err);
  process.exit(1);
});
