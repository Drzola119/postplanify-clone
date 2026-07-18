// Deep crawl: per-platform pages, AI agents page, n8n/Make integrations.
// Output: docs/research/upload-post/<slug>.{png,json}

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, '../docs/research/upload-post');
fs.mkdirSync(OUT_DIR, { recursive: true });

const URLS = [
  'https://www.upload-post.com/',
  'https://www.upload-post.com/platforms/tiktok',
  'https://www.upload-post.com/platforms/instagram',
  'https://www.upload-post.com/platforms/youtube',
  'https://www.upload-post.com/platforms/linkedin',
  'https://www.upload-post.com/platforms/facebook',
  'https://www.upload-post.com/platforms/x',
  'https://www.upload-post.com/platforms/threads',
  'https://www.upload-post.com/platforms/pinterest',
  'https://www.upload-post.com/platforms/reddit',
  'https://www.upload-post.com/platforms/bluesky',
  'https://www.upload-post.com/platforms/google-business',
  'https://www.upload-post.com/platforms/discord',
  'https://www.upload-post.com/platforms/telegram',
  'https://www.upload-post.com/ai-agents',
  'https://www.upload-post.com/mcp',
  'https://www.upload-post.com/whitelabel',
  'https://www.upload-post.com/n8n-integration-guide',
  'https://www.upload-post.com/make-integration-guide',
  'https://www.upload-post.com/zapier-integration-guide',
  'https://www.upload-post.com/ffmpeg-integration-guide',
  'https://docs.upload-post.com/',
];

function slug(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/-+$/, '')
    .toLowerCase()
    .slice(0, 120);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  });

  for (const url of URLS) {
    const s = slug(url);
    console.log(`\n[crawl] ${url} -> ${s}`);

    const page = await context.newPage();
    let resp;
    try {
      resp = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 25000,
      });
    } catch (err) {
      console.log(`  ! failed: ${err.message}`);
      await page.close();
      continue;
    }
    const status = resp ? resp.status() : 0;
    console.log(`  status=${status} title="${await page.title().catch(() => '')}"`);

    if (status >= 200 && status < 400) {
      await page.waitForTimeout(1200);
      // Dismiss cookie banners if present.
      try {
        await page.click(
          'button:has-text("Accept"), button:has-text("Got it"), button:has-text("OK")',
          { timeout: 800 }
        );
        await page.waitForTimeout(300);
      } catch {}

      await page.screenshot({
        path: path.join(OUT_DIR, `${s}.png`),
        fullPage: true,
      });

      const content = await page.evaluate(() => {
        const text = (sel) =>
          Array.from(document.querySelectorAll(sel))
            .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
            .filter(Boolean);
        return {
          h1: text('h1'),
          h2: text('h2'),
          h3: text('h3'),
          h4: text('h4'),
          features: text('li, .feature, [class*="feature" i]').slice(0, 80),
          buttons: text('button, a.button, [role="button"]').slice(0, 30),
          bodyText: (document.body.innerText || '')
            .replace(/\n{3,}/g, '\n\n')
            .slice(0, 25000),
        };
      });

      fs.writeFileSync(
        path.join(OUT_DIR, `${s}.json`),
        JSON.stringify({ url, status, ...content }, null, 2)
      );
      console.log(`  h1=${content.h1.length} h2=${content.h2.length} h3=${content.h3.length} li=${content.features.length} body=${content.bodyText.length}b`);
    }

    await page.close();
  }

  console.log('\n[crawl] done.');
  await browser.close();
})().catch((err) => {
  console.error('[crawl] fatal:', err);
  process.exit(1);
});
