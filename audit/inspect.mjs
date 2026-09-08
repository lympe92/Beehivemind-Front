/* Prints a few layout facts about one app page and one kit page at a width.
   Usage: node inspect.mjs <appPath> <kitUrl> <width> [seed] "<js expression>" */
import puppeteer from 'puppeteer-core';
import { mock } from './mocks.mjs';

const APP = 'http://localhost:4301';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [appPath, kitUrl, widthArg, seedName = 'user', expr = 'null'] = process.argv.slice(2);
const width = Number(widthArg);

const USER = { id: 10, name: 'Nikos', surname: 'Lymperis', email: 'nikos@beehivemind.org', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true };
const EMPLOYEE = { id: 1, name: 'Anna', surname: 'Ioannou', email: 'anna@beehivemind.org', role: 'superadmin' };
const AUTH_BASE = { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null };
const EMP_BASE = { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null };
const SEEDS = {
  none: null,
  user: { auth: { ...AUTH_BASE, user: USER }, employeeAuth: { ...EMP_BASE, employee: null } },
  admin: { auth: { ...AUTH_BASE, user: null }, employeeAuth: { ...EMP_BASE, employee: EMPLOYEE } },
};

const facts = (label) => `(() => {
  const s = document.querySelector('.user-shell'); const sb = document.querySelector('.sidebar');
  return { label: ${JSON.stringify(label)}, innerWidth: innerWidth, shell: s && s.className, sidebarWidth: sb && sb.getBoundingClientRect().width, extra: (${expr}) };
})()`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.createBrowserContext();
const app = await ctx.newPage();
await app.setRequestInterception(true);
app.on('request', (req) => {
  const url = req.url();
  if (url.startsWith('http://localhost:8000/api/')) {
    const res = mock(req.method(), url.slice('http://localhost:8000/api/'.length));
    const headers = { 'Access-Control-Allow-Origin': APP, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Content-Type': 'application/json' };
    if (res && res.status === 204) return req.respond({ status: 204, headers });
    return req.respond({ status: 200, headers, body: JSON.stringify(res) });
  }
  if (url.startsWith(APP) || url.startsWith('data:')) return req.continue();
  return req.abort();
});
await app.evaluateOnNewDocument((s) => { try { s ? localStorage.setItem('bhm_auth', JSON.stringify(s)) : localStorage.removeItem('bhm_auth'); } catch {} }, SEEDS[seedName]);
await app.setViewport({ width, height: 900 });
await app.goto(APP + appPath, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 900));
console.log(JSON.stringify(await app.evaluate(facts('app'))));

if (kitUrl && kitUrl !== '-') {
  const kit = await (await browser.createBrowserContext()).newPage();
  await kit.setViewport({ width, height: 900 });
  await kit.goto(kitUrl, { waitUntil: 'networkidle0', timeout: 90000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1400));
  console.log(JSON.stringify(await kit.evaluate(facts('kit'))));
}
await browser.close();
