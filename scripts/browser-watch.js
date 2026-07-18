// Persistent headed browser for inspecting upload-post.com (your reference).
// Uses a persistent profile so your Gmail login survives across runs.
// NEVER auto-closes. You control when it closes.
//
// Usage:
//   node scripts/browser-watch.js
//   node scripts/browser-watch.js https://app.upload-post.com/dashboard
//   node scripts/browser-watch.js https://app.upload-post.com/upload
//
// Pass a URL on the command line to land on that page. With no arg, lands
// on the dashboard (where the upload section lives).

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Fixed persistent profile dir so logins survive between runs.
const PROFILE_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local'),
  'playwright-upload-post-profile'
);
fs.mkdirSync(PROFILE_DIR, { recursive: true });

// Action log so you can see what the browser is doing.
const LOG_DIR = path.join(__dirname, '../docs/research/upload-post/session-log');
fs.mkdirSync(LOG_DIR, { recursive: true });

function logAction(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(path.join(LOG_DIR, 'actions.log'), line + '\n');
}

(async () => {
  logAction(`launching persistent Chromium (profile=${PROFILE_DIR})`);

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || (await context.newPage());

  // Log every navigation so you can track.
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      logAction(`navigated -> ${frame.url()}`);
    }
  });

  // Target URL: command-line arg overrides defaults.
  const argUrl = process.argv[2];
  const targets = argUrl
    ? [argUrl]
    : [
        'https://app.upload-post.com/dashboard',
        'https://app.upload-post.com/upload',
      ];

  let navigated = false;
  for (const url of targets) {
    try {
      logAction(`navigating to ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      navigated = true;
      break;
    } catch (err) {
      logAction(`failed ${url}: ${err.message}`);
    }
  }

  if (!navigated) {
    logAction('all targets failed — opening upload-post.com root');
    await page.goto('https://app.upload-post.com', { waitUntil: 'domcontentloaded' });
  }

  logAction(`READY — current URL: ${page.url()}`);
  logAction('Browser is yours. Do not close it manually unless you want to stop.');
  logAction('To navigate somewhere else, run: node scripts/browser-watch.js <url>');

  // Take an initial screenshot so user can verify what page we're on.
  await page.screenshot({
    path: path.join(LOG_DIR, 'initial.png'),
    fullPage: false,
  });

  // NEVER close. Process exits when user closes the browser window.
  page.on('close', () => {
    logAction('browser closed by user — exiting');
    process.exit(0);
  });
  context.on('close', () => {
    logAction('browser context closed — exiting');
    process.exit(0);
  });

  // Keep process alive forever.
  await new Promise(() => {});
})().catch((err) => {
  logAction(`fatal: ${err.message}`);
  // Don't exit on error — leave browser open if it launched.
  setInterval(() => {}, 1 << 30);
});
