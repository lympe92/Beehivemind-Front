/* Lists the elements that stick out past the viewport on one page at one width.
   Usage: node probe.mjs <path> <width> [seed: none|user|admin] */
import puppeteer from 'puppeteer-core';
import { mock } from './mocks.mjs';

const BASE = 'http://localhost:4301';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [path = '/', widthArg = '375', seedName = 'none'] = process.argv.slice(2);
const width = Number(widthArg);

const USER = { id: 10, name: 'Nikos', surname: 'Lymperis', email: 'nikos@beehivemind.tech', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true };
const EMPLOYEE = { id: 1, name: 'Anna', surname: 'Ioannou', email: 'anna@beehivemind.tech', role: 'superadmin' };
const AUTH_BASE = { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null };
const EMP_BASE = { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null };
const SEEDS = {
  none: null,
  user: { auth: { ...AUTH_BASE, user: USER }, employeeAuth: { ...EMP_BASE, employee: null } },
  admin: { auth: { ...AUTH_BASE, user: null }, employeeAuth: { ...EMP_BASE, employee: EMPLOYEE } },
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setRequestInterception(true);
page.on('request', (req) => {
  const url = req.url();
  if (url.startsWith('http://localhost:8000/api/')) {
    const res = mock(req.method(), url.slice('http://localhost:8000/api/'.length));
    const headers = { 'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Content-Type': 'application/json' };
    if (res && res.status === 204) return req.respond({ status: 204, headers });
    return req.respond({ status: 200, headers, body: JSON.stringify(res) });
  }
  if (url.startsWith(BASE) || url.startsWith('data:')) return req.continue();
  return req.abort();
});
await page.evaluateOnNewDocument((seed) => { try { seed ? localStorage.setItem('bhm_auth', JSON.stringify(seed)) : localStorage.removeItem('bhm_auth'); } catch {} }, SEEDS[seedName]);
await page.setViewport({ width, height: 900 });
await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 800));

const out = await page.evaluate((width) => {
  const rows = [];
  const sel = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > width + 1 || r.left < -1)) {
      const chain = [];
      let n = el;
      for (let i = 0; i < 5 && n && n !== document.body; i++) { chain.push(sel(n)); n = n.parentElement; }
      rows.push({ right: Math.round(r.right), left: Math.round(r.left), w: Math.round(r.width), chain: chain.join(' < '), text: (el.textContent || '').trim().slice(0, 50) });
    }
  });
  return { scrollWidth: document.documentElement.scrollWidth, rows: rows.sort((a, b) => b.right - a.right).slice(0, 25) };
}, width);

console.log('scrollWidth', out.scrollWidth);
for (const r of out.rows) console.log(`${r.left}..${r.right} (${r.w}px) ${r.chain} — "${r.text}"`);
await browser.close();
