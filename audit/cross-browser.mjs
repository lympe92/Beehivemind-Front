/* Cross-browser / cross-device pass with Playwright: every route from run.mjs on
   Chromium, Firefox and WebKit at desktop, tablet and phone sizes.

   Per page it records: navigation failures, where the page landed (a guard
   bouncing to login, the public 404), uncaught exceptions, console errors,
   failed or 4xx/5xx same-origin requests, the checks.js battery, and â€” on the
   signed-in zones â€” the dialog contract for the first openers. A screenshot of
   every page lands in audit/xb-shots/<device>/.

   Usage: node cross-browser.mjs [--only=/user,/admin] [--devices=webkit-ipad,firefox-desktop]
                                 [--dialogs=0] [--shots=0] [--parallel=3]
   PORT overrides the dev server port (default 4301). */
import { chromium, firefox, webkit, devices } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mock, TEAM_SUMMARY } from './mocks.mjs';

const BASE = `http://localhost:${process.env.PORT || 4301}`;
const API = 'http://localhost:8000/api/';
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v = '1'] = a.replace(/^--/, '').split('='); return [k, v]; }));
const DIALOGS = args.dialogs !== '0';
const SHOTS = args.shots !== '0';
const PARALLEL = Number(args.parallel || 3);
const ONLY = args.only || '';

const checksSrc = readFileSync(new URL('./checks.js', import.meta.url), 'utf8')
  .replace(/^export function/gm, 'function') +
  '\nwindow.__audit = { palette, run, dialogContract, openers };';

const USER = { id: 10, name: 'Nikos', surname: 'Lymperis', email: 'nikos@beehivemind.tech', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true, team: TEAM_SUMMARY };
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
  ['none', '/privacy'], ['none', '/terms'], ['none', '/delete-account'], ['none', '/blog'], ['none', '/blog/reading-closed-brood'], ['none', '/blog/category/inspections'],
  ['none', '/auth/login'], ['none', '/auth/register'], ['none', '/auth/reset-password'],
  ['none', '/auth/reset-password?token=x'], ['none', '/auth/confirmation'],
  ['none', '/auth/invite?token=x'], ['none', '/auth/login?notice=account-removed'],
  ['user', '/user/dashboard'], ['user', '/user/apiary'], ['user', '/user/apiary/details'],
  ['user', '/user/apiary/map'], ['user', '/user/apiary/1'], ['user', '/user/beehives'],
  ['user', '/user/inspections'], ['user', '/user/feeding'], ['user', '/user/harvest'],
  ['user', '/user/treatments'], ['user', '/user/treatments/details'], ['user', '/user/financial'],
  ['user', '/user/todo/list'], ['user', '/user/todo/calendar'], ['user', '/user/ai-chat'],
  ['user', '/user/ai-chat/1'], ['user', '/user/profile'],
  ['none', '/admin/login'],
  ['admin', '/admin/dashboard'], ['admin', '/admin/users'], ['admin', '/admin/moderation'],
  ['admin', '/admin/employees'], ['admin', '/admin/coupons'], ['admin', '/admin/ai-responses'], ['admin', '/admin/voice-quality'],
  ['admin', '/admin/blog'], ['admin', '/admin/blog/categories'],
  ['admin', '/admin/blog/new'], ['admin', '/admin/blog/1'],
  ['admin', '/admin/raw'], ['admin', '/admin/raw/users'], ['admin', '/admin/profile'],
  ['none', '/nonsense'],
].filter(([, p]) => !ONLY || ONLY.split(',').some(o => p === o || (o !== '/' && p.includes(o))));

/* Firefox has no mobile emulation (isMobile/hasTouch), so its small sizes are
   a plain narrow window â€” which is what Firefox on a resized desktop is. */
const strip = ({ defaultBrowserType, ...d }) => d;
const DEVICES = [
  { id: 'chromium-desktop', engine: chromium, opts: { viewport: { width: 1440, height: 900 } } },
  { id: 'firefox-desktop',  engine: firefox,  opts: { viewport: { width: 1440, height: 900 } } },
  { id: 'webkit-desktop',   engine: webkit,   opts: { viewport: { width: 1440, height: 900 } } },
  { id: 'chromium-1024',    engine: chromium, opts: { viewport: { width: 1024, height: 768 } } },
  { id: 'firefox-768',      engine: firefox,  opts: { viewport: { width: 768, height: 1024 } } },
  { id: 'firefox-375',      engine: firefox,  opts: { viewport: { width: 375, height: 812 } } },
  { id: 'webkit-ipad-pro-11',       engine: webkit, opts: strip(devices['iPad Pro 11']) },
  { id: 'webkit-ipad-pro-11-land',  engine: webkit, opts: strip(devices['iPad Pro 11 landscape']) },
  { id: 'webkit-ipad-mini',         engine: webkit, opts: strip(devices['iPad Mini']) },
  { id: 'webkit-iphone-14',         engine: webkit, opts: strip(devices['iPhone 14']) },
  { id: 'webkit-iphone-se',         engine: webkit, opts: strip(devices['iPhone SE']) },
  { id: 'chromium-pixel-7',         engine: chromium, opts: strip(devices['Pixel 7']) },
  { id: 'chromium-galaxy-s9',       engine: chromium, opts: strip(devices['Galaxy S9+']) },
  { id: 'chromium-galaxy-tab-s4',   engine: chromium, opts: strip(devices['Galaxy Tab S4']) },
].filter(d => !args.devices || args.devices.split(',').includes(d.id));

const NOT_FOUND = 'There is nothing at this address';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const CORS = {
  'Access-Control-Allow-Origin': BASE,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN, Accept',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

async function newContext(browser, device, seed) {
  const ctx = await browser.newContext({ ...device.opts, locale: 'en-GB', timezoneId: 'Europe/Athens' });
  await ctx.route('**/*', (route) => {
    const req = route.request();
    const url = req.url();
    if (url.startsWith(API)) {
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      const res = mock(req.method(), url.slice(API.length));
      if (res && res.status === 204) return route.fulfill({ status: 204, headers: CORS });
      if (res && typeof res.status === 'number' && 'body' in res) return route.fulfill({ status: res.status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(res.body) });
      return route.fulfill({ status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(res) });
    }
    // The dev server has no /cdn-cgi/trace; an EEA answer keeps the consent banner up.
    if (url === BASE + '/cdn-cgi/trace') return route.fulfill({ status: 200, contentType: 'text/plain', body: 'loc=GR\n' });
    if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    return route.abort();
  });
  await ctx.addInitScript((s) => {
    try { s ? localStorage.setItem('bhm_auth', JSON.stringify(s)) : localStorage.removeItem('bhm_auth'); } catch {}
  }, seed);
  return ctx;
}

async function battery(page, width) {
  await page.evaluate(checksSrc);
  return page.evaluate((width) => {
    const A = window.__audit;
    let cssText = '';
    for (const sheet of Array.from(document.styleSheets)) {
      try { cssText += Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); } catch {}
    }
    const allowed = A.palette(document, window, cssText);
    const findings = A.run(document, window, { width, allowed });
    const doc = document.documentElement;
    if (doc.scrollWidth > window.innerWidth + 1) {
      findings.push({ rule: 'page-h-scroll', severity: 'high', detail: `document ${doc.scrollWidth}px wide in a ${window.innerWidth}px viewport`, sel: 'html' });
    }
    return findings;
  }, width);
}

async function dialogs(page, width) {
  const out = [];
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
    await sleep(600);
    const r = await page.evaluate((width) => {
      const A = window.__audit;
      const panel = document.querySelector('.modal-panel');
      if (!panel) return null;
      let cssText = '';
      for (const sheet of Array.from(document.styleSheets)) {
        try { cssText += Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); } catch {}
      }
      const allowed = A.palette(document, window, cssText);
      const f = [...A.dialogContract(document, window, panel), ...A.run(document, window, { width, allowed, root: panel })];
      const b = panel.getBoundingClientRect();
      if (b.right > window.innerWidth + 1 || b.left < -1) f.push({ rule: 'h-overflow', severity: 'high', detail: `dialog panel leaves the viewport: ${Math.round(b.left)}..${Math.round(b.right)}`, sel: 'panel' });
      if (b.bottom > window.innerHeight + 1 && getComputedStyle(panel).overflowY === 'visible') f.push({ rule: 'v-overflow', severity: 'medium', detail: `dialog taller than the viewport and not scrollable (${Math.round(b.height)}px)`, sel: 'panel' });
      return f;
    }, width);
    if (r) out.push({ opener: label, findings: r });
    await page.keyboard.press('Escape');
    await sleep(450);
    if (await page.evaluate(() => !!document.querySelector('.modal-panel'))) {
      out.push({ opener: label, findings: [{ rule: 'dialog-escape', severity: 'high', detail: 'Escape did not close the dialog', sel: 'panel' }] });
      await page.evaluate(() => document.querySelector('.modal-backdrop')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      await sleep(300);
    }
  }
  return out;
}

async function runDevice(device) {
  const browser = await device.engine.launch({ headless: true });
  const width = device.opts.viewport.width;
  const results = [];
  if (SHOTS) mkdirSync(new URL(`./xb-shots/${device.id}/`, import.meta.url), { recursive: true });

  for (const seedName of ['none', 'user', 'admin']) {
    const pages = PAGES.filter(([s]) => s === seedName);
    if (!pages.length) continue;
    const ctx = await newContext(browser, device, SEEDS[seedName]);
    const page = await ctx.newPage();
    let errors = [], consoleErrors = [], badRequests = [];
    page.on('pageerror', (e) => errors.push(String(e.message || e).slice(0, 240)));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      // Requests to third parties are aborted on purpose (maps, GTM, fontsâ€¦).
      if (/net::ERR_FAILED|NS_ERROR_|Failed to load resource|blocked|aborted/i.test(t) && !t.includes('localhost:')) return;
      consoleErrors.push(t.slice(0, 240));
    });
    page.on('requestfailed', (r) => { if (r.url().startsWith(BASE)) badRequests.push(`${r.method()} ${r.url().slice(BASE.length)} â€” ${r.failure()?.errorText}`); });
    page.on('response', (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) badRequests.push(`${r.status()} ${r.url().slice(BASE.length)}`); });

    for (const [, path] of pages) {
      errors = []; consoleErrors = []; badRequests = [];
      const entry = { device: device.id, path, width, findings: [], dialogs: [] };
      try {
        await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
        await sleep(800);
        const landed = await page.evaluate(() => location.pathname + location.search);
        entry.landed = landed;
        const is404 = (await page.evaluate(() => document.body.innerText)).includes(NOT_FOUND);
        if (is404 !== (path === '/nonsense')) entry.findings.push({ rule: 'route', severity: 'high', detail: is404 ? 'rendered the public 404' : 'missing 404', sel: '' });
        if (landed.split('?')[0] !== path.split('?')[0]) entry.findings.push({ rule: 'redirect', severity: 'medium', detail: `landed on ${landed}`, sel: '' });
        entry.findings.push(...await battery(page, width));
        if (SHOTS) {
          const name = path.replace(/[\/?=]+/g, '_').replace(/^_|_$/g, '') || 'home';
          await page.screenshot({ path: fileURLToPath(new URL(`./xb-shots/${device.id}/${name}.png`, import.meta.url)), fullPage: false });
        }
        if (DIALOGS && (path.startsWith('/user') || path.startsWith('/admin/') && path !== '/admin/login')) entry.dialogs = await dialogs(page, width);
      } catch (e) {
        entry.findings.push({ rule: 'nav', severity: 'high', detail: String(e.message).split('\n')[0].slice(0, 200), sel: '' });
      }
      for (const e of errors) entry.findings.push({ rule: 'js-error', severity: 'high', detail: e, sel: '' });
      for (const e of [...new Set(consoleErrors)]) entry.findings.push({ rule: 'console-error', severity: 'medium', detail: e, sel: '' });
      for (const e of [...new Set(badRequests)]) entry.findings.push({ rule: 'request', severity: 'medium', detail: e, sel: '' });
      results.push(entry);
      const n = entry.findings.length + entry.dialogs.reduce((a, d) => a + d.findings.length, 0);
      console.log(`[${device.id}] ${path}: ${n}`);
    }
    await ctx.close();
  }
  await browser.close();
  return results;
}

async function main() {
  const r = await fetch(BASE + '/').catch(() => null);
  if (!r?.ok) throw new Error('dev server is not up on ' + BASE);
  const queue = [...DEVICES];
  const all = [];
  await Promise.all(Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
    while (queue.length) {
      const d = queue.shift();
      try { all.push(...await runDevice(d)); }
      catch (e) { all.push({ device: d.id, path: '*', findings: [{ rule: 'launch', severity: 'high', detail: String(e.message).slice(0, 300), sel: '' }], dialogs: [] }); }
    }
  }));
  writeFileSync(new URL('./xb-report.json', import.meta.url), JSON.stringify(all, null, 2));

  const byDevice = {};
  for (const e of all) {
    const n = e.findings.length + (e.dialogs || []).reduce((a, d) => a + d.findings.length, 0);
    byDevice[e.device] = (byDevice[e.device] || 0) + n;
  }
  console.log('\nFindings per device:');
  for (const [d, n] of Object.entries(byDevice)) console.log(`  ${d.padEnd(28)} ${n}`);
  console.log('\nTOTAL ' + Object.values(byDevice).reduce((a, b) => a + b, 0) + '  (details in audit/xb-report.json)');
}

main().catch((e) => { console.error(e); process.exit(1); });
