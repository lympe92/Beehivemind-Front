/* Deleting a beehive asks what happens to its queen — the API refuses without
   it, and a plain confirm made every delete fail with "Validation failed".
   Checks the dialog offers the two fates, that "moved" needs a target, and what
   the DELETE actually carries.
   Usage: dev server on PORT (default 4321), then `node beehive-delete-check.mjs`. */
import puppeteer from 'puppeteer-core';
import { mock, TEAM_SUMMARY } from './mocks.mjs';

const BASE = `http://localhost:${process.env.PORT || 4321}`;
const API = 'http://localhost:8000/api/';
const USER = { id: 10, name: 'N', surname: 'L', email: 'n@x.tech', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true, team: TEAM_SUMMARY };
const SEED = {
  auth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null, user: USER },
  employeeAuth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null, employee: null },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let deleteBody = null;

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
      if (req.method() === 'DELETE' && path.startsWith('beehives/')) {
        deleteBody = req.postData();
        return req.respond({ status: 200, headers: cors, body: JSON.stringify({ success: true }) });
      }
      return req.respond({ status: 200, headers: cors, body: JSON.stringify(mock(req.method(), path)) });
    }
    if (url === BASE + '/cdn-cgi/trace') return req.respond({ status: 200, body: 'loc=US\n' });
    if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')) return req.continue();
    return req.abort();
  });
  await page.evaluateOnNewDocument((seed) => localStorage.setItem('bhm_auth', JSON.stringify(seed)), SEED);

  await page.goto(BASE + '/user/beehives', { waitUntil: 'networkidle0' });
  await page.evaluate(() => [...document.querySelectorAll('tbody tr')][0].querySelectorAll('button').forEach((b) => { if (b.textContent.trim() === 'Delete') b.click(); }));
  await page.waitForSelector('app-delete-beehive-modal', { timeout: 10000 });
  await sleep(400);

  const dialog = await page.evaluate(() => {
    const d = document.querySelector('app-delete-beehive-modal');
    return {
      fates: [...d.querySelectorAll('.radio-group__option--label')].map((l) => l.textContent.trim()),
      targetShown: !!d.querySelector('#queen-target'),
      confirmDisabled: [...d.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Delete beehive').disabled,
    };
  });

  // Choosing "moved" asks where to, and holds the button until it is answered.
  await page.evaluate(() => {
    const d = document.querySelector('app-delete-beehive-modal');
    const moved = [...d.querySelectorAll('input[type=radio]')][1];
    moved.click();
  });
  await sleep(500);
  const moved = await page.evaluate(() => {
    const d = document.querySelector('app-delete-beehive-modal');
    return {
      targetShown: !!d.querySelector('#queen-target'),
      confirmDisabled: [...d.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Delete beehive').disabled,
      targets: [...(d.querySelector('#queen-target')?.options ?? [])].map((o) => o.textContent.trim()),
    };
  });

  await page.evaluate(() => {
    const select = document.querySelector('#queen-target');
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(500);
  await page.evaluate(() => [...document.querySelectorAll('app-delete-beehive-modal button')].find((b) => b.textContent.trim() === 'Delete beehive').click());
  await sleep(1500);

  const sent = deleteBody ? JSON.parse(deleteBody) : null;
  const ok = dialog.fates.length === 2 && !dialog.targetShown && !dialog.confirmDisabled
    && moved.targetShown && moved.confirmDisabled && moved.targets.length > 1
    && sent?.queen_fate === 'moved' && typeof sent?.target_beehive_id === 'number';

  console.log('dialog:', JSON.stringify(dialog), '\nafter choosing moved:', JSON.stringify(moved), '\nDELETE body:', JSON.stringify(sent));
  console.log(ok ? 'OK' : 'FAIL');
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
}
