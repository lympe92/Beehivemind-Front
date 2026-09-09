/* Drives audit/checks.js against the Angular dev server at four widths.
   Usage: node run.mjs [--only=<substring>] [--widths=375,768] [--dialogs=0|1] */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { mock } from './mocks.mjs';

const BASE = 'http://localhost:4301';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v = '1'] = a.replace(/^--/, '').split('='); return [k, v]; }));
const WIDTHS = (args.widths ? args.widths.split(',').map(Number) : [375, 768, 1024, 1440]);
const DIALOGS = args.dialogs !== '0';
const ONLY = args.only || '';

const checksSrc = readFileSync(new URL('./checks.js', import.meta.url), 'utf8')
  .replace(/^export function/gm, 'function') +
  '\nwindow.__audit = { palette, run, dialogContract, openers };';

const USER = { id: 10, name: 'Nikos', surname: 'Lymperis', email: 'nikos@beehivemind.tech', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true };
const EMPLOYEE = { id: 1, name: 'Anna', surname: 'Ioannou', email: 'anna@beehivemind.tech', role: 'superadmin' };
const AUTH_BASE = { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null };
const EMP_BASE = { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null };

const SEEDS = {
  none: null,
  user: { auth: { ...AUTH_BASE, user: USER }, employeeAuth: { ...EMP_BASE, employee: null } },
  admin: { auth: { ...AUTH_BASE, user: null }, employeeAuth: { ...EMP_BASE, employee: EMPLOYEE } },
};

const PAGES = [
  ['none', '/'], ['none', '/features'], ['none', '/app'], ['none', '/pricing'],
  ['none', '/apiariesandbeehives'], ['none', '/financial'], ['none', '/harvestandfeeding'],
  ['none', '/inspections'], ['none', '/help'], ['none', '/about'], ['none', '/contact'],
  ['none', '/privacy'], ['none', '/terms'], ['none', '/blog'], ['none', '/blog/reading-closed-brood'], ['none', '/blog/category/inspections'],
  ['none', '/auth/login'], ['none', '/auth/register'], ['none', '/auth/reset-password'],
  ['none', '/auth/reset-password?token=x'], ['none', '/auth/confirmation'],
  ['user', '/user/dashboard'], ['user', '/user/apiary'], ['user', '/user/apiary/details'],
  ['user', '/user/apiary/map'], ['user', '/user/apiary/1'], ['user', '/user/beehives'],
  ['user', '/user/inspections'], ['user', '/user/feeding'], ['user', '/user/harvest'],
  ['user', '/user/treatments'], ['user', '/user/treatments/details'], ['user', '/user/financial'],
  ['user', '/user/todo/list'], ['user', '/user/todo/calendar'], ['user', '/user/ai-chat'],
  ['user', '/user/ai-chat/1'], ['user', '/user/profile'],
  ['none', '/admin/login'],
  ['admin', '/admin/dashboard'], ['admin', '/admin/users'], ['admin', '/admin/moderation'],
  ['admin', '/admin/employees'], ['admin', '/admin/coupons'], ['admin', '/admin/ai-responses'],
  ['admin', '/admin/blog'], ['admin', '/admin/blog/categories'],
  ['admin', '/admin/blog/new'], ['admin', '/admin/blog/1'],
  ['admin', '/admin/raw'], ['admin', '/admin/raw/users'], ['admin', '/admin/profile'],
].filter(([, p]) => !ONLY || ONLY.split(',').some(o => p === o || (o !== '/' && p.includes(o))));

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitForServer() {
  for (let i = 0; i < 150; i++) {
    try { const r = await fetch(BASE + '/'); if (r.ok) return; } catch {}
    await sleep(2000);
  }
  throw new Error('dev server did not come up on ' + BASE);
}

async function setupPage(page, seed) {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith('http://localhost:8000/api/')) {
      const path = url.slice('http://localhost:8000/api/'.length);
      const res = mock(req.method(), path);
      const headers = {
        'Access-Control-Allow-Origin': BASE,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Content-Type': 'application/json',
      };
      if (res && res.status === 204) return req.respond({ status: 204, headers });
      return req.respond({ status: 200, headers, body: JSON.stringify(res) });
    }
    if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')) return req.continue();
    return req.abort();
  });
  await page.evaluateOnNewDocument((seedValue) => {
    try {
      if (seedValue) localStorage.setItem('bhm_auth', JSON.stringify(seedValue));
      else localStorage.removeItem('bhm_auth');
    } catch {}
  }, seed);
}

async function auditPage(page, width) {
  return page.evaluate(async (width) => {
    const A = window.__audit;
    let cssText = '';
    for (const sheet of Array.from(document.styleSheets)) {
      try { cssText += Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); } catch {}
    }
    const allowed = A.palette(document, window, cssText);
    const findings = A.run(document, window, { width, allowed });
    return { findings, url: location.pathname + location.search };
  }, width);
}

async function auditDialogs(page, width) {
  const results = [];
  const count = await page.evaluate(() => window.__audit.openers(document, window, 4).length);
  for (let i = 0; i < count; i++) {
    const label = await page.evaluate((i) => {
      const o = window.__audit.openers(document, window, 4)[i];
      if (!o) return null;
      o.el.scrollIntoView({ block: 'center' });
      o.el.click();
      return o.label;
    }, i);
    if (label === null) break;
    await sleep(500);
    const r = await page.evaluate((width) => {
      const A = window.__audit;
      const panel = document.querySelector('.modal-panel');
      if (!panel) return null;
      let cssText = '';
      for (const sheet of Array.from(document.styleSheets)) {
        try { cssText += Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); } catch {}
      }
      const allowed = A.palette(document, window, cssText);
      const findings = [
        ...A.dialogContract(document, window, panel),
        ...A.run(document, window, { width, allowed, root: panel }),
      ];
      const r = panel.getBoundingClientRect();
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        findings.push({ rule: 'h-overflow', severity: 'high', detail: 'dialog panel leaves the viewport: ' + Math.round(r.left) + '..' + Math.round(r.right), sel: 'panel' });
      }
      return findings;
    }, width);
    if (r) results.push({ opener: label, findings: r });
    await page.keyboard.press('Escape');
    await sleep(400);
    const still = await page.evaluate(() => !!document.querySelector('.modal-panel'));
    if (still) {
      results.push({ opener: label, findings: [{ rule: 'dialog-escape', severity: 'high', detail: 'Escape did not close the dialog', sel: 'panel' }] });
      await page.evaluate(() => document.querySelector('.modal-backdrop')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      await sleep(300);
    }
  }
  return results;
}

async function main() {
  await waitForServer();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const report = [];
  let total = 0;

  for (const seedName of ['none', 'user', 'admin']) {
    const pages = PAGES.filter(([s]) => s === seedName);
    if (!pages.length) continue;
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await setupPage(page, SEEDS[seedName]);
    page.on('pageerror', (e) => report.push({ url: 'pageerror', width: 0, findings: [{ rule: 'js-error', severity: 'high', detail: String(e.message || e).slice(0, 200), sel: '' }] }));

    for (const [, path] of pages) {
      for (const width of WIDTHS) {
        await page.setViewport({ width, height: 900 });
        try {
          await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 60000 });
        } catch (e) {
          report.push({ url: path, width, findings: [{ rule: 'nav', severity: 'high', detail: String(e.message).slice(0, 160), sel: '' }] });
          continue;
        }
        await sleep(700);
        await page.evaluate(checksSrc);
        const { findings, url } = await auditPage(page, width);
        const entry = { url: path, width, landed: url, findings };
        if (DIALOGS && (path.startsWith('/user') || path.startsWith('/admin'))) {
          entry.dialogs = await auditDialogs(page, width);
        }
        report.push(entry);
        const n = findings.length + (entry.dialogs || []).reduce((a, d) => a + d.findings.length, 0);
        total += n;
        const landedNote = url !== path ? ' -> ' + url : '';
        console.log(`${String(width).padStart(4)} ${path}${landedNote}: ${n} finding(s)`);
        for (const f of findings) console.log(`       [${f.severity}] ${f.rule} ${f.sel}: ${f.detail}`);
        for (const d of entry.dialogs || []) for (const f of d.findings) console.log(`       [${f.severity}] (dialog "${d.opener}") ${f.rule} ${f.sel}: ${f.detail}`);
      }
    }
    await context.close();
  }

  await browser.close();
  writeFileSync(new URL('./report.json', import.meta.url), JSON.stringify(report, null, 2));
  console.log('\nTOTAL findings: ' + total);
}

main().catch((e) => { console.error(e); process.exit(1); });
