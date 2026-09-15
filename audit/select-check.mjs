/* Opens Add Inspection / Add Feeding / Add Harvest against the mocks and checks
   the dialog's selects actually list their options, and that the beehive select
   follows the apiary. Zoneless change detection once left them empty.
   Usage: dev server on 4301, then `node select-check.mjs`. */
import puppeteer from 'puppeteer-core';
import { mock, TEAM_SUMMARY } from './mocks.mjs';

const BASE = 'http://localhost:4301';
const API = 'http://localhost:8000/api/';
const USER = { id: 10, name: 'Nikos', surname: 'Lymperis', email: 'nikos@beehivemind.tech', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true, team: TEAM_SUMMARY };
const SEED = {
  auth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null, user: USER },
  employeeAuth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null, employee: null },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let failed = false;

try {
  for (const route of ['/user/inspections', '/user/feeding', '/user/harvest']) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.startsWith(API)) {
        const res = mock(req.method(), url.slice(API.length));
        return req.respond({
          status: 200,
          headers: { 'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Content-Type': 'application/json' },
          body: JSON.stringify(res),
        });
      }
      if (url === BASE + '/cdn-cgi/trace') return req.respond({ status: 200, body: 'loc=US\n' });
      if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')) return req.continue();
      return req.abort();
    });
    await page.evaluateOnNewDocument((seed) => localStorage.setItem('bhm_auth', JSON.stringify(seed)), SEED);

    await page.goto(BASE + route, { waitUntil: 'networkidle0' });
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('+ Add'))?.click());
    await page.waitForSelector('app-form-modal select', { timeout: 10000 });
    await sleep(300);

    const selects = await page.$$('app-form-modal select');
    const first = await selects[0].evaluate((s) => [...s.options].map((o) => o.textContent.trim()));
    let second = [];
    if (selects[1]) {
      await selects[0].evaluate((s) => {
        const option = [...s.options].find((o) => o.textContent.trim() && o.value !== '0: null');
        if (option) { s.value = option.value; s.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      await sleep(300);
      second = await selects[1].evaluate((s) => [...s.options].map((o) => o.textContent.trim()));
    }

    const real = (list) => list.filter((t) => t && !t.startsWith('—'));
    const ok = real(first).length > 0 && (!selects[1] || real(second).length > 0);
    if (!ok) failed = true;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${route}: first select [${first.join(', ')}] · after choosing, second [${second.join(', ')}]`);
    await page.close();
  }
} finally {
  await browser.close();
}
process.exitCode = failed ? 1 : 0;
