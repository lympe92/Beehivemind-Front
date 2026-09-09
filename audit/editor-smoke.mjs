/* One-off: drives the post editor the way a person would, to prove the parts a
   static audit cannot see — TipTap booting in the browser, the toolbar acting
   on a selection, and the OG card being drawn on a canvas.
   Usage: node editor-smoke.mjs   (needs `ng serve --port 4301`) */
import puppeteer from 'puppeteer-core';
import { mock } from './mocks.mjs';

const BASE = 'http://localhost:4301';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const EMPLOYEE = { id: 1, name: 'Anna', surname: 'Ioannou', email: 'anna@beehivemind.tech', role: 'superadmin' };
const SEED = {
  auth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null, user: null },
  employeeAuth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null, employee: EMPLOYEE },
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = [];
const say = (label, value) => { log.push(`${label}: ${value}`); console.log(`${label}: ${value}`); };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });

/* The upload endpoint is the one call this exercises for real, so it is
   answered here rather than in mocks.mjs — it needs the request body. */
let uploaded = null;
await page.setRequestInterception(true);
page.on('request', (req) => {
  const url = req.url();
  const headers = { 'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Content-Type': 'application/json' };

  if (url === 'http://localhost:8000/api/admin/media' && req.method() === 'POST') {
    uploaded = (req.postData() ?? '').length;
    return req.respond({ status: 200, headers, body: JSON.stringify({ success: true, code: 200, message: 'OK', data: { id: 99, url: `${BASE}/assets/images/og-blog.jpg`, alt: 'card', width: 1200, height: 630, mime: 'image/jpeg', size: uploaded } }) });
  }
  if (url.startsWith('http://localhost:8000/api/')) {
    const res = mock(req.method(), url.slice('http://localhost:8000/api/'.length));
    if (res && res.status === 204) return req.respond({ status: 204, headers });
    return req.respond({ status: 200, headers, body: JSON.stringify(res) });
  }
  if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')) return req.continue();
  return req.abort();
});
await page.evaluateOnNewDocument((s) => { try { localStorage.setItem('bhm_auth', JSON.stringify(s)); } catch {} }, SEED);

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

/* ---------------------------------------------------- an existing post opens */
await page.goto(`${BASE}/admin/blog/1`, { waitUntil: 'networkidle0' });
await sleep(1500);

say('url', page.url());
say('h1', await page.$eval('h1', el => el.textContent.trim()).catch(() => 'none'));
say('inputs', await page.$$eval('input', els => els.map(e => e.type + ':' + (e.name || e.getAttribute('formcontrolname') || '?')).join(', ')).catch(() => 'none'));
say('early errors', errors.slice(0, 3).join(' | ') || 'none');
say('title field', await page.$eval('input[type=text]', el => el.value));
say('editor mounted', await page.$eval('.rte__body', el => !!el.querySelector('.ProseMirror')));
say('body round-tripped', (await page.$eval('.rte__body', el => el.textContent)).includes('Reading the pair together'));
say('h2 preserved', await page.$eval('.rte__body', el => el.querySelectorAll('h2').length));
say('list preserved', await page.$eval('.rte__body', el => el.querySelectorAll('ul li').length));
say('takeaways loaded', await page.$$eval('[formarrayname="key_takeaways"] input', els => els.length));
say('faq loaded', await page.$$eval('[formarrayname="faq"] input', els => els.length));
say('serp preview', await page.$eval('.pe__serp-title', el => el.textContent.trim()));

/* ------------------------------------------------------------- the toolbar */
await page.click('.rte__body .ProseMirror');
await page.keyboard.down('Control'); await page.keyboard.press('End'); await page.keyboard.up('Control');
await page.keyboard.press('Enter');
await page.keyboard.type('A line typed by the smoke test.');
// Select the sentence with the keyboard: ProseMirror owns the selection, and
// Shift+Home does not reach it reliably in a headless run.
for (let i = 0; i < 'A line typed by the smoke test.'.length; i++) {
  await page.keyboard.down('Shift'); await page.keyboard.press('ArrowLeft'); await page.keyboard.up('Shift');
}
await page.click('.rte__btn--bold');
await sleep(400);
say('bold applied', await page.$eval('.rte__body', el => el.innerHTML.includes('<strong>A line typed by the smoke test.</strong>')));
say('bold button active', await page.$eval('.rte__btn--bold', el => el.classList.contains('is-active')));
await page.click('.rte__btn--bold');
await sleep(300);
say('bold removed again', await page.$eval('.rte__body', el => !el.innerHTML.includes('<strong>')));

const h2Button = await page.$$('.rte__btn');
await h2Button[0].click();
await sleep(300);
say('h2 applied to that line', await page.$eval('.rte__body', el => /<h2>[^<]*smoke test/.test(el.innerHTML)));

/* --------------------------------------------------------------- the card */
const generate = await page.$$eval('.app-btn', els => els.findIndex(e => e.textContent.trim() === 'Generate card'));
say('generate button found', generate >= 0);
await page.evaluate((i) => [...document.querySelectorAll('.app-btn')][i].click(), generate);
await sleep(3000);
say('card uploaded (bytes)', uploaded ?? 'none');
say('card preview shown', await page.$$eval('.pe__thumb', els => els.length) > 0);

/* ------------------------------------------------------------- a new post */
await page.goto(`${BASE}/admin/blog/new`, { waitUntil: 'networkidle0' });
await sleep(1200);
await page.type('input[type=text]', 'How to read a queenless colony');
await sleep(600);
say('slug derived', await page.$$eval('input[type=text]', els => els[1].value));

say('page errors', errors.length ? errors.slice(0, 4).join(' | ') : 'none');

await browser.close();
