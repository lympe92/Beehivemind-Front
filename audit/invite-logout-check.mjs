/* The invite page opened in a browser whose stored session is dead (the
   account was deleted elsewhere): it says "signed in as …, log out to
   continue", and Log out answers 401. That once looped — dozens of logout
   requests and a toast that never went away — and dropped the visitor on
   /auth/login. Asserts one logout request, no toast, and the invitation form.
   Usage: dev server on PORT (default 4321), then `node invite-logout-check.mjs`. */
import puppeteer from 'puppeteer-core';
import { mock } from './mocks.mjs';

const BASE = `http://localhost:${process.env.PORT || 4321}`;
const API = 'http://localhost:8000/api/';
const DEAD_USER = { id: 99, name: 'Gone', surname: 'User', email: 'gone@example.com', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true };
const SEED = {
  auth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null, user: DEAD_USER },
  employeeAuth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null, employee: null },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let logoutCalls = 0;

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    const cors = { 'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Content-Type': 'application/json' };
    if (url.startsWith(API)) {
      const path = url.slice(API.length);
      if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: { ...cors, 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' } });
      if (path === 'user/logout') {
        logoutCalls++;
        return req.respond({ status: 401, headers: cors, body: JSON.stringify({ success: false, message: 'Unauthenticated' }) });
      }
      return req.respond({ status: 200, headers: cors, body: JSON.stringify(mock(req.method(), path)) });
    }
    if (url === BASE + '/cdn-cgi/trace') return req.respond({ status: 200, body: 'loc=US\n' });
    if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')) return req.continue();
    return req.abort();
  });
  await page.evaluateOnNewDocument((seed) => localStorage.setItem('bhm_auth', JSON.stringify(seed)), SEED);

  await page.goto(BASE + '/auth/invite?token=x', { waitUntil: 'networkidle0' });
  const before = await page.evaluate(() => document.querySelector('.auth-form__error')?.textContent.trim());
  console.log('before:', before);

  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Log out')?.click());
  await sleep(4000);

  const after = await page.evaluate(() => ({
    path: location.pathname,
    toasts: document.querySelectorAll('.toast').length,
    formShown: !!document.querySelector('#inv-name'),
    stored: JSON.parse(localStorage.getItem('bhm_auth') || '{}')?.auth?.user?.email ?? null,
  }));
  console.log('logout requests:', logoutCalls, '· after:', JSON.stringify(after));

  const ok = logoutCalls === 1 && after.toasts === 0 && after.path === '/auth/invite' && after.formShown && after.stored === null;
  console.log(ok ? 'OK' : 'FAIL');
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
}
