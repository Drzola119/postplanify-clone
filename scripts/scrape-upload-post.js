// Crawls public upload-post.com pages to inventory their feature set and
// supported-platform options. Captures full-page screenshots + extracts
// visible text/links/headings so Claude can do a gap analysis vs trustiify.
//
// Output: docs/research/upload-post/<page-slug>.{png,txt}
//
// Run: node scripts/scrape-upload-post.js

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, '../docs/research/upload-post');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SEEDS = [
  { url: 'https://upload-post.com', slug: 'home' },
  { url: 'https://upload-post.com/features', slug: 'features' },
  { url: 'https://upload-post.com/pricing', slug: 'pricing' },
  { url: 'https://upload-post.com/platforms', slug: 'platforms' },
  { url: 'https://upload-post.com/networks', slug: 'networks' },
  { url: 'https://upload-post.com/integrations', slug: 'integrations' },
  { url: 'https://upload-post.com/api', slug: 'api' },
  { url: 'https://upload-post.com/docs', slug: 'docs' },
  { url: 'https://upload-post.com/help', slug: 'help' },
  { url: 'https://upload-post.com/blog', slug: 'blog' },
  { url: 'https://www.upload-post.com', slug: 'home-www' },
  { url: 'https://app.upload-post.com', slug: 'app-root' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  });

  const visited = new Set();
  const results = [];

  for (const seed of SEEDS) {
    if (visited.has(seed.url)) continue;
    visited.add(seed.url);
    console.log(`\n[scrape] ${seed.url}`);

    const page = await context.newPage();
    let resp;
    try {
      resp = await page.goto(seed.url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
    } catch (err) {
      console.log(`  ! navigation failed: ${err.message}`);
      await page.close();
      continue;
    }

    const status = resp ? resp.status() : 0;
    const finalUrl = page.url();
    const title = await page.title().catch(() => '');
    console.log(`  status=${status} final=${finalUrl}`);
    console.log(`  title=${title}`);

    if (status >= 200 && status < 400) {
      // Wait briefly for lazy content.
      await page.waitForTimeout(1500);

      // Try to dismiss cookie banners.
      try {
        await page.click(
          'button:has-text("Accept"), button:has-text("Got it"), button:has-text("OK")',
          { timeout: 1000 }
        );
        await page.waitForTimeout(500);
      } catch {}

      const screenshotPath = path.join(OUT_DIR, `${seed.slug}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Extract structured content.
      const content = await page.evaluate(() => {
        const text = (sel) =>
          Array.from(document.querySelectorAll(sel))
            .map((el) => el.textContent.trim())
            .filter(Boolean);
        return {
          h1: text('h1'),
          h2: text('h2'),
          h3: text('h3'),
          navLinks: Array.from(document.querySelectorAll('a'))
            .map((a) => ({
              text: (a.textContent || '').trim().slice(0, 80),
              href: a.href,
            }))
            .filter((a) => a.text && a.href.startsWith('http')),
          bodyText: (document.body.innerText || '').slice(0, 20000),
        };
      });

      const txtPath = path.join(OUT_DIR, `${seed.slug}.json`);
      fs.writeFileSync(txtPath, JSON.stringify(content, null, 2));
      console.log(`  saved ${screenshotPath}`);
      console.log(`  saved ${txtPath} (h1=${content.h1.length}, h2=${content.h2.length}, links=${content.navLinks.length})`);

      // Discover more links to follow (same-host only).
      const sameHostLinks = content.navLinks
        .filter((l) => {
          try {
            const u = new URL(l.href);
            return (
              (u.hostname === 'upload-post.com' ||
                u.hostname === 'www.upload-post.com' ||
                u.hostname === 'app.upload-post.com' ||
                u.hostname === 'api.upload-post.com') &&
              !l.href.includes('#') &&
              !visited.has(l.href)
            );
          } catch {
            return false;
          }
        })
        .slice(0, 25);

      results.push({ seed, status, finalUrl, title });
    }

    await page.close();
  }

  // Also write a manifest.
  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ visited: Array.from(visited), results }, null, 2)
  );

  console.log('\n[scrape] done. output:', OUT_DIR);
  await browser.close();
})().catch((err) => {
  console.error('[scrape] fatal:', err);
  process.exit(1);
});
