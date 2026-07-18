// Audit trustiify.agency — visits every page on the live site,
// captures console errors, network failures, broken UI, missing data.
// Writes one JSON per page + a master summary.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PROFILE_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local'),
  'playwright-trustiify-profile'
);

const OUT_DIR = path.resolve(__dirname, '../docs/research/trustiify-audit');
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

async function audit(page, name) {
  const errors = [];
  const failedRequests = [];
  const slowRequests = [];
  const apiCalls = [];

  // Capture console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location(),
      });
    }
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  // Capture network failures
  page.on('response', async (resp) => {
    const url = resp.url();
    const status = resp.status();
    const timing = resp.request().timing();

    if (url.includes('/api/') || url.includes('firestore') || url.includes('firebase')) {
      let body = '';
      try {
        body = (await resp.text()).slice(0, 500);
      } catch {}
      apiCalls.push({
        url: url.replace(/^https?:\/\/[^/]+/, ''),
        method: resp.request().method(),
        status,
        duration: timing ? Math.round(timing.responseEnd - timing.requestStart) : 0,
        body: body.slice(0, 300),
      });
    }

    if (status >= 400) {
      failedRequests.push({
        url: url.replace(/^https?:\/\/[^/]+/, ''),
        method: resp.request().method(),
        status,
      });
    }
    if (timing && timing.responseEnd - timing.requestStart > 5000) {
      slowRequests.push({
        url: url.replace(/^https?:\/\/[^/]+/, ''),
        duration: Math.round(timing.responseEnd - timing.requestStart),
      });
    }
  });

  // Capture page state
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
      fields.push({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        placeholder: el.getAttribute('placeholder'),
        value: el.value || '',
        text: clean(el.textContent).slice(0, 150),
      });
    }
    return {
      url: location.href,
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1')).map((h) => clean(h.textContent)),
      h2: Array.from(document.querySelectorAll('h2')).map((h) => clean(h.textContent)),
      bodyText: clean(document.body.innerText).slice(0, 20000),
      fields: fields.slice(0, 300),
    };
  });

  return {
    page: name,
    timestamp: new Date().toISOString(),
    ...data,
    consoleErrors,
    pageErrors,
    failedRequests,
    slowRequests,
    apiCalls,
  };
}

// Pages to audit — covers full trustiify surface
const PAGES = [
  // Public
  { slug: 'home', path: '/' },
  { slug: 'pricing', path: '/pricing' },
  { slug: 'features', path: '/features' },
  { slug: 'login', path: '/login' },
  { slug: 'signup', path: '/signup' },
  // Dashboard
  { slug: 'dashboard', path: '/dashboard' },
  { slug: 'dashboard-posts', path: '/dashboard/posts' },
  { slug: 'dashboard-posts-create', path: '/dashboard/posts/create' },
  { slug: 'dashboard-posts-drafts', path: '/dashboard/posts/drafts' },
  { slug: 'dashboard-posts-history', path: '/dashboard/posts/history' },
  { slug: 'dashboard-posts-bulk', path: '/dashboard/posts/bulk-schedule' },
  { slug: 'dashboard-queue', path: '/dashboard/queue' },
  { slug: 'dashboard-analytics', path: '/dashboard/analytics' },
  { slug: 'dashboard-reports', path: '/dashboard/reports' },
  { slug: 'dashboard-accounts', path: '/dashboard/accounts' },
  { slug: 'dashboard-destinations', path: '/dashboard/destinations' },
  { slug: 'dashboard-inbox', path: '/dashboard/inbox' },
  { slug: 'dashboard-assets', path: '/dashboard/assets' },
  { slug: 'dashboard-hashtags', path: '/dashboard/hashtags' },
  { slug: 'dashboard-labels', path: '/dashboard/labels' },
  { slug: 'dashboard-link-in-bio', path: '/dashboard/link-in-bio' },
  { slug: 'dashboard-brands', path: '/dashboard/brands' },
  { slug: 'dashboard-command-center', path: '/dashboard/command-center' },
  { slug: 'dashboard-automations', path: '/dashboard/automations/dm' },
  { slug: 'dashboard-api-keys', path: '/dashboard/api-keys' },
  { slug: 'dashboard-settings', path: '/dashboard/settings' },
  { slug: 'dashboard-settings-branding', path: '/dashboard/settings/branding' },
];

(async () => {
  log(`opening persistent browser (profile=${PROFILE_DIR})`);
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || (await context.newPage());

  const allResults = [];
  const masterSummary = {
    auditDate: new Date().toISOString(),
    pagesAudited: 0,
    pagesWithConsoleErrors: 0,
    pagesWithPageErrors: 0,
    pagesWithFailedRequests: 0,
    pagesWithApiCalls401: 0,
    pagesWithApiCalls500: 0,
    apiEndpointsCalled: new Set(),
    brokenFeatures: [],
  };

  for (const p of PAGES) {
    const url = `https://trustiify.agency${p.path}`;
    log(`\n=== ${p.slug.toUpperCase()} -> ${url} ===`);
    try {
      const resp = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 25000,
      });
      const status = resp ? resp.status() : 0;
      log(`  HTTP ${status}`);
      await page.waitForTimeout(3500);

      const auditResult = await audit(page, p.slug);
      auditResult.httpStatus = status;
      fs.writeFileSync(
        path.join(OUT_DIR, `${p.slug}.json`),
        JSON.stringify(auditResult, null, 2)
      );
      await shoot(page, p.slug);

      // Summary
      const ce = auditResult.consoleErrors.length;
      const pe = auditResult.pageErrors.length;
      const fr = auditResult.failedRequests.length;
      const api401 = auditResult.apiCalls.filter((a) => a.status === 401).length;
      const api500 = auditResult.apiCalls.filter((a) => a.status >= 500).length;
      log(`  console errors: ${ce} | page errors: ${pe} | failed requests: ${fr} | 401s: ${api401} | 5xx: ${api500}`);
      if (auditResult.h1.length) log(`  h1: ${auditResult.h1.join(' | ')}`);

      if (ce) masterSummary.pagesWithConsoleErrors++;
      if (pe) masterSummary.pagesWithPageErrors++;
      if (fr) masterSummary.pagesWithFailedRequests++;
      if (api401) masterSummary.pagesWithApiCalls401++;
      if (api500) masterSummary.pagesWithApiCalls500++;

      // Track API endpoints
      auditResult.apiCalls.forEach((a) => masterSummary.apiEndpointsCalled.add(a.url));

      // Detect broken features
      if (auditResult.bodyText.match(/not available|error loading|failed to load|something went wrong/i)) {
        masterSummary.brokenFeatures.push({
          page: p.slug,
          type: 'error_message_in_ui',
          url,
        });
      }
      if (api401 > 0) {
        masterSummary.brokenFeatures.push({
          page: p.slug,
          type: 'api_401',
          url,
          count: api401,
        });
      }
      if (pe > 0) {
        masterSummary.brokenFeatures.push({
          page: p.slug,
          type: 'page_error',
          url,
          errors: auditResult.pageErrors.slice(0, 3),
        });
      }

      allResults.push({
        slug: p.slug,
        url,
        status,
        consoleErrors: ce,
        pageErrors: pe,
        failedRequests: fr,
        api401,
        api500,
        apiCallCount: auditResult.apiCalls.length,
      });
    } catch (e) {
      log(`  ERROR: ${e.message}`);
      masterSummary.brokenFeatures.push({ page: p.slug, type: 'navigation_failed', error: e.message });
    }
  }

  masterSummary.pagesAudited = PAGES.length;
  masterSummary.apiEndpointsCalled = Array.from(masterSummary.apiEndpointsCalled);
  masterSummary.perPageResults = allResults;

  fs.writeFileSync(
    path.join(OUT_DIR, '_SUMMARY.json'),
    JSON.stringify(masterSummary, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, '_SUMMARY.md'),
    generateMarkdownSummary(masterSummary)
  );

  log('\n=== AUDIT COMPLETE ===');
  log(`artifacts: ${OUT_DIR}`);
  log(`pages audited: ${masterSummary.pagesAudited}`);
  log(`pages with errors: ${masterSummary.pagesWithConsoleErrors + masterSummary.pagesWithPageErrors}`);
  log(`broken features found: ${masterSummary.brokenFeatures.length}`);

  page.on('close', () => process.exit(0));
  context.on('close', () => process.exit(0));
  await new Promise(() => {});
})().catch((err) => {
  log(`fatal: ${err.message}`);
  console.error(err);
  setInterval(() => {}, 1 << 30);
});

function generateMarkdownSummary(s) {
  let md = `# Trustiify.agency — A-to-Z Audit\n\n`;
  md += `**Date:** ${s.auditDate}\n`;
  md += `**Pages audited:** ${s.pagesAudited}\n\n`;
  md += `## Summary\n\n`;
  md += `| Metric | Count |\n|---|---|\n`;
  md += `| Pages with console errors | ${s.pagesWithConsoleErrors} |\n`;
  md += `| Pages with page errors | ${s.pagesWithPageErrors} |\n`;
  md += `| Pages with failed requests (4xx/5xx) | ${s.pagesWithFailedRequests} |\n`;
  md += `| Pages with 401 API responses | ${s.pagesWithApiCalls401} |\n`;
  md += `| Pages with 5xx API responses | ${s.pagesWithApiCalls500} |\n`;
  md += `| Broken features detected | ${s.brokenFeatures.length} |\n\n`;

  md += `## Per-page results\n\n`;
  md += `| Page | HTTP | Console | Page | Failed | 401 | 5xx | API calls |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  for (const r of s.perPageResults) {
    md += `| ${r.slug} | ${r.status} | ${r.consoleErrors} | ${r.pageErrors} | ${r.failedRequests} | ${r.api401} | ${r.api500} | ${r.apiCallCount} |\n`;
  }

  md += `\n## Broken features\n\n`;
  if (s.brokenFeatures.length === 0) {
    md += `_None detected_\n`;
  } else {
    for (const b of s.brokenFeatures) {
      md += `- **${b.page}** (${b.type}): ${b.error || ''}\n`;
    }
  }

  md += `\n## API endpoints called\n\n`;
  for (const url of s.apiEndpointsCalled) {
    md += `- ${url}\n`;
  }

  return md;
}