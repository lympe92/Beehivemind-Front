/* Real interactions (clicks, taps, typing, native selects) on Chromium, Firefox
   and WebKit — the things a static battery cannot see. Each flow fails loudly.

   Usage: dev server on PORT (default 4301), then `node cross-flows.mjs [--devices=…]`. */
import { chromium, firefox, webkit, devices } from 'playwright';
import { mock, TEAM_SUMMARY } from './mocks.mjs';

const BASE = `http://localhost:${process.env.PORT || 4301}`;
const API = 'http://localhost:8000/api/';
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v = '1'] = a.replace(/^--/, '').split('='); return [k, v]; }));
const USER = { id: 10, name: 'Nikos', surname: 'Lymperis', email: 'nikos@beehivemind.tech', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true, team: TEAM_SUMMARY };
const SEED_USER = {
  auth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null, user: USER },
  employeeAuth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null, employee: null },
};
const CORS = { 'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN, Accept', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
const strip = ({ defaultBrowserType, ...d }) => d;
const DEVICES = [
  { id: 'chromium-desktop', engine: chromium, opts: { viewport: { width: 1440, height: 900 } } },
  { id: 'firefox-desktop',  engine: firefox,  opts: { viewport: { width: 1440, height: 900 } } },
  { id: 'webkit-desktop',   engine: webkit,   opts: { viewport: { width: 1440, height: 900 } } },
  { id: 'firefox-375',      engine: firefox,  opts: { viewport: { width: 375, height: 812 } } },
  { id: 'webkit-ipad-pro-11', engine: webkit, opts: strip(devices['iPad Pro 11']) },
  { id: 'webkit-iphone-14',   engine: webkit, opts: strip(devices['iPhone 14']) },
  { id: 'chromium-pixel-7',   engine: chromium, opts: strip(devices['Pixel 7']) },
].filter(d => !args.devices || args.devices.split(',').includes(d.id));

async function open(browser, device, path, seed, sent, loc = 'US') {
  const ctx = await browser.newContext({ ...device.opts, locale: 'en-GB' });
  await ctx.route('**/*', (route) => {
    const req = route.request(); const url = req.url();
    if (url.startsWith(API)) {
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      if (req.method() !== 'GET') sent.push({ method: req.method(), path: url.slice(API.length), body: req.postData() });
      const res = mock(req.method(), url.slice(API.length));
      if (res && res.status === 204) return route.fulfill({ status: 204, headers: CORS });
      if (res && typeof res.status === 'number' && 'body' in res) return route.fulfill({ status: res.status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(res.body) });
      return route.fulfill({ status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(res ?? { success: true, data: [] }) });
    }
    if (url === BASE + '/cdn-cgi/trace') return route.fulfill({ status: 200, contentType: 'text/plain', body: `loc=${loc}\n` });
    if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    return route.abort();
  });
  await ctx.addInitScript((s) => { try { s ? localStorage.setItem('bhm_auth', JSON.stringify(s)) : localStorage.removeItem('bhm_auth'); } catch {} }, seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e).slice(0, 200)));
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(500);
  return { ctx, page, errors };
}

const isTouch = (d) => !!d.opts.hasTouch;
const press = (d, loc) => isTouch(d) ? loc.tap() : loc.click();

const FLOWS = {
  /* Add a record: the native selects list options, the beehive select follows
     the apiary, the form posts and the dialog closes with a toast. */
  async addRecord(browser, d, route) {
    const sent = [];
    const { ctx, page, errors } = await open(browser, d, route, SEED_USER, sent);
    try {
      await press(d, page.getByRole('button', { name: /^\+ Add/ }).first());
      const modal = page.locator('app-form-modal');
      await modal.locator('select').first().waitFor({ timeout: 10000 });
      const selects = modal.locator('select');
      const n = await selects.count();
      const firstOpts = await selects.nth(0).locator('option').allTextContents();
      await selects.nth(0).selectOption({ index: firstOpts.findIndex((t, i) => i > 0 && t.trim() && !t.trim().startsWith('—')) });
      await page.waitForTimeout(300);
      let secondOpts = [];
      if (n > 1) {
        secondOpts = await selects.nth(1).locator('option').allTextContents();
        const idx = secondOpts.findIndex((t, i) => i > 0 && t.trim() && !t.trim().startsWith('—'));
        if (idx > 0) await selects.nth(1).selectOption({ index: idx });
      }
      for (let i = 2; i < n; i++) {
        const s = selects.nth(i);
        if (await s.inputValue().catch(() => '')) continue;
        const o = await s.locator('option').count();
        if (o > 1) await s.selectOption({ index: 1 }).catch(() => {});
      }
      // Fill every empty visible text-like input with a valid value.
      const inputs = modal.locator('input:visible');
      for (let i = 0; i < await inputs.count(); i++) {
        const el = inputs.nth(i);
        const type = await el.getAttribute('type');
        if (['checkbox', 'radio', 'range', 'hidden'].includes(type)) continue;
        if (await el.inputValue()) continue;
        if (type === 'date') await el.fill('2026-11-01');
        else if (type === 'number') {
          const min = Number(await el.getAttribute('min'));
          const label = (await el.evaluate(e => (e.closest('label, .dform__field, .form-group')?.textContent || e.name || e.id || '').toLowerCase()));
          await el.fill(min > 3 ? String(min) : /year/.test(label) ? '2025' : '3');
        }
        else await el.fill('3');
      }
      await press(d, modal.locator('button[type=submit]'));
      await page.waitForTimeout(1500);
      const posted = sent.find(s => s.method === 'POST');
      const closed = !(await page.locator('.modal-panel').count());
      const toast = await page.locator('.toast').first().textContent().catch(() => null);
      const invalid = closed ? [] : await modal.locator('.form-error, .dform__error, [class*=error]:visible').allTextContents();
      const realFirst = firstOpts.filter(t => t.trim() && !t.trim().startsWith('—')).length;
      const realSecond = secondOpts.filter(t => t.trim() && !t.trim().startsWith('—')).length;
      const ok = realFirst > 0 && (n < 2 || realSecond > 0) && !!posted && closed && !errors.length;
      return { ok, detail: `selects ${n}; options ${realFirst}/${realSecond}; POST ${posted ? posted.path : 'none'}; closed ${closed}; toast ${JSON.stringify(toast?.trim())}${invalid.length ? '; errors ' + JSON.stringify(invalid.map(s => s.trim()).filter(Boolean)) : ''}${errors.length ? '; js ' + errors.join(' | ') : ''}` };
    } finally { await ctx.close(); }
  },

  /* Delete a beehive: two queen fates, "moved" needs a target, DELETE carries both. */
  async beehiveDelete(browser, d) {
    const sent = [];
    const { ctx, page, errors } = await open(browser, d, '/user/beehives', SEED_USER, sent);
    try {
      const del = page.locator('tbody tr').first().getByRole('button', { name: /^Delete/ });
      await del.scrollIntoViewIfNeeded();
      await press(d, del);
      const dlg = page.locator('app-delete-beehive-modal');
      await dlg.waitFor({ timeout: 10000 });
      await press(d, dlg.locator('input[type=radio]').nth(1));
      await page.waitForTimeout(400);
      const confirm = dlg.getByRole('button', { name: 'Delete beehive' });
      const heldBack = await confirm.isDisabled();
      await dlg.locator('#queen-target').selectOption({ index: 1 });
      await page.waitForTimeout(300);
      await press(d, confirm);
      await page.waitForTimeout(1500);
      const del2 = sent.find(s => s.method === 'DELETE');
      const body = del2?.body ? JSON.parse(del2.body) : null;
      const ok = heldBack && body?.queen_fate === 'moved' && typeof body?.target_beehive_id === 'number' && !errors.length;
      return { ok, detail: `confirm held until target chosen: ${heldBack}; DELETE ${del2?.path} ${JSON.stringify(body)}${errors.length ? '; js ' + errors.join(' | ') : ''}` };
    } finally { await ctx.close(); }
  },

  /* Below 992px the sidebar is an overlay: open it, follow a link, it closes. */
  async mobileNav(browser, d) {
    if (d.opts.viewport.width >= 992) return { ok: true, detail: 'skipped (sidebar is inline)' };
    const { ctx, page, errors } = await open(browser, d, '/user/dashboard', SEED_USER, []);
    try {
      await press(d, page.locator('.user-header__toggle'));
      await page.waitForTimeout(500);
      const link = page.locator('a.sidebar__link[href="/user/beehives"]');
      const visible = await link.isVisible();
      await press(d, link);
      await page.waitForURL('**/user/beehives', { timeout: 8000 });
      await page.waitForTimeout(600);
      const box = await page.locator('.sidebar').first().boundingBox().catch(() => null);
      const closed = !box || box.x + box.width <= 1;
      return { ok: visible && closed && !errors.length, detail: `link visible after toggle: ${visible}; url ${new URL(page.url()).pathname}; sidebar closed after navigation: ${closed}${errors.length ? '; js ' + errors.join(' | ') : ''}` };
    } finally { await ctx.close(); }
  },

  /* EEA visitor: the banner appears, Accept removes it and remembers. */
  async consent(browser, d) {
    const { ctx, page, errors } = await open(browser, d, '/', null, [], 'GR');
    try {
      const accept = page.getByRole('button', { name: 'Accept' });
      await accept.waitFor({ timeout: 8000 });
      await press(d, accept);
      await page.waitForTimeout(500);
      const gone = !(await accept.isVisible().catch(() => false));
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const stays = !(await page.getByRole('button', { name: 'Accept' }).isVisible().catch(() => false));
      return { ok: gone && stays && !errors.length, detail: `hidden after Accept: ${gone}; still hidden after reload: ${stays}${errors.length ? '; js ' + errors.join(' | ') : ''}` };
    } finally { await ctx.close(); }
  },

  /* Login: typing enables the button, submitting posts the credentials. */
  async login(browser, d) {
    const sent = [];
    const { ctx, page, errors } = await open(browser, d, '/auth/login', null, sent);
    try {
      const submit = page.locator('form.auth-form button[type=submit]');
      const disabledEmpty = await submit.isDisabled();
      await page.locator('#email').fill('nikos@beehivemind.tech');
      await page.locator('app-form-input input').first().fill('correct horse battery');
      await page.waitForTimeout(200);
      const enabled = !(await submit.isDisabled());
      await press(d, submit);
      await page.waitForTimeout(1200);
      const post = sent.find(s => s.method === 'POST');
      return { ok: disabledEmpty && enabled && !!post && !errors.length, detail: `disabled when empty: ${disabledEmpty}; enabled when filled: ${enabled}; POST ${post?.path ?? 'none'}${errors.length ? '; js ' + errors.join(' | ') : ''}` };
    } finally { await ctx.close(); }
  },
};

const PLAN = [
  ['add inspection', (b, d) => FLOWS.addRecord(b, d, '/user/inspections')],
  ['add feeding', (b, d) => FLOWS.addRecord(b, d, '/user/feeding')],
  ['add harvest', (b, d) => FLOWS.addRecord(b, d, '/user/harvest')],
  ['beehive delete', FLOWS.beehiveDelete],
  ['mobile nav', FLOWS.mobileNav],
  ['consent banner', FLOWS.consent],
  ['login', FLOWS.login],
];

let failures = 0;
await Promise.all(DEVICES.map(async (d) => {
  const browser = await d.engine.launch({ headless: true });
  try {
    for (const [name, fn] of PLAN) {
      let r;
      try { r = await fn(browser, d); } catch (e) { r = { ok: false, detail: 'threw: ' + String(e.message).split('\n')[0].slice(0, 200) }; }
      if (!r.ok) failures++;
      console.log(`${r.ok ? 'ok  ' : 'FAIL'} [${d.id}] ${name}: ${r.detail}`);
    }
  } finally { await browser.close(); }
}));
console.log(failures ? `\n${failures} failing flow(s)` : '\nall flows pass');
process.exitCode = failures ? 1 : 0;
