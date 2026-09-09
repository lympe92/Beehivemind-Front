/* Every zone resolves to the component it should, and only genuinely missing
   URLs reach the 404. Guards the route order in app.routes.ts, which is easy
   to get wrong and fails silently — a mis-ordered `path: ''` renders the
   public 404 for the whole signed-in app without a single console error. */
import puppeteer from 'puppeteer-core';
import { mock } from './mocks.mjs';

/* Defaults to the dev server; TARGET=https://beehivemind.tech checks a deploy. */
const BASE = process.env.TARGET || 'http://localhost:4301';
const USER = { id: 10, name: 'Nikos', surname: 'Lymperis', email: 'nikos@beehivemind.org', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true };
const EMPLOYEE = { id: 1, name: 'Anna', surname: 'Ioannou', email: 'anna@beehivemind.org', role: 'superadmin' };
const AUTH_BASE = { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null };
const EMP_BASE = { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null };
const SEEDS = {
  none: null,
  user: { auth: { ...AUTH_BASE, user: USER }, employeeAuth: { ...EMP_BASE, employee: null } },
  admin: { auth: { ...AUTH_BASE, user: null }, employeeAuth: { ...EMP_BASE, employee: EMPLOYEE } },
};

/* [seed, path, the layout element that must be present] */
const CASES = [
  ['none',  '/',                          'app-public-layout'],
  ['none',  '/blog',                      'app-public-layout'],
  ['none',  '/blog/reading-closed-brood', 'app-public-layout'],
  ['none',  '/blog/category/inspections', 'app-public-layout'],
  ['none',  '/auth/login',                'app-auth-card'],
  ['none',  '/admin/login',               'app-admin-login'],
  ['user',  '/user/dashboard',            'app-user-layout'],
  ['user',  '/user/beehives',             'app-user-layout'],
  ['admin', '/admin/dashboard',           'app-admin-layout'],
  ['admin', '/admin/users',               'app-admin-layout'],
  ['admin', '/admin/blog',                'app-admin-layout'],
  ['admin', '/admin/blog/new',            'app-admin-layout'],
  ['admin', '/admin/blog/categories',     'app-admin-layout'],
  ['none',  '/nonsense',                  'app-public-layout'],
];

const NOT_FOUND = 'There is nothing at this address';

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
let failures = 0;

for (const [seed, path, expected] of CASES) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    const headers = { 'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Content-Type': 'application/json' };
    if (url.startsWith('http://localhost:8000/api/')) {
      const res = mock(req.method(), url.slice('http://localhost:8000/api/'.length));
      if (res && res.status === 204) return req.respond({ status: 204, headers });
      return req.respond({ status: 200, headers, body: JSON.stringify(res) });
    }
    if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')) return req.continue();
    return req.abort();
  });
  await page.evaluateOnNewDocument((s) => { try { s ? localStorage.setItem('bhm_auth', JSON.stringify(s)) : localStorage.removeItem('bhm_auth'); } catch {} }, SEEDS[seed]);

  await page.goto(BASE + path, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 900));

  const found = await page.$(expected).then(Boolean);
  const is404 = (await page.evaluate(() => document.body.innerText)).includes(NOT_FOUND);
  const want404 = path === '/nonsense';
  const pass = found && is404 === want404;
  if (!pass) failures++;
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${seed.padEnd(5)} ${path.padEnd(28)} ${expected}${is404 ? '  [404 page]' : ''}`);

  await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} failing route(s)` : '\nall routes resolve');
process.exit(failures ? 1 : 0);
