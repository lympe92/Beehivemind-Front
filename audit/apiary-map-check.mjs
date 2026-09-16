/* The apiary map, with no nudge: it must paint on its own. It has failed three
   times — coordinates arriving as strings threw "not a LatLng" and left the
   page blank, a map built before the frame had a height stayed a grey box until
   a window resize, and the requestAnimationFrame that waited for that height
   never fired in a background tab, so the map was never built at all. This
   check covers the first two: a hidden document paints nothing by design, so
   the third one cannot be reproduced here — it is guarded by the
   visibilitychange retry in apiary-map.ts. Loads the page, waits, and looks for
   painted tiles.
   Usage: dev server on PORT (default 4321), then `node apiary-map-check.mjs`.
   The Google Maps key is restricted by referrer, so a port it does not allow
   answers RefererNotAllowedMapError and the check cannot run there — use a host
   listed on the key (the dev origin), or check the deployed page. */
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
const errors = [];

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith(API)) {
      return req.respond({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Content-Type': 'application/json' },
        // The API sends decimal columns as strings; the map must cope.
        body: JSON.stringify(withStringCoordinates(mock(req.method(), url.slice(API.length)))),
      });
    }
    if (url === BASE + '/cdn-cgi/trace') return req.respond({ status: 200, body: 'loc=US\n' });
    if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:') || url.includes('maps.googleapis.com') || url.includes('maps.gstatic.com') || url.includes('khms') || url.includes('googleusercontent')) return req.continue();
    return req.abort();
  });
  await page.evaluateOnNewDocument((seed) => localStorage.setItem('bhm_auth', JSON.stringify(seed)), SEED);

  await page.goto(BASE + '/user/apiary/map', { waitUntil: 'networkidle2' });
  await sleep(6000);

  const painted = await page.evaluate(() => {
    const frame = document.querySelector('.app-map');
    return {
      frame: !!frame,
      height: frame ? Math.round(frame.getBoundingClientRect().height) : 0,
      tiles: frame ? frame.querySelectorAll('.gm-style').length : 0,
      images: frame ? frame.querySelectorAll('img').length : 0,
    };
  });

  const ok = painted.frame && painted.height > 100 && painted.tiles > 0 && painted.images > 0 && errors.length === 0;
  console.log('map:', JSON.stringify(painted), errors.length ? `\nerrors: ${errors.slice(0, 2).join(' | ')}` : '');
  console.log(ok ? 'OK' : 'FAIL');
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
}

/** Mirrors the API's `decimal:7` casts, which JSON carries as strings. */
function withStringCoordinates(payload) {
  const asString = (a) => (a && typeof a === 'object' && 'latitude' in a
    ? { ...a, latitude: String(a.latitude), longitude: String(a.longitude) }
    : a);

  if (Array.isArray(payload?.data)) return { ...payload, data: payload.data.map(asString) };
  if (payload?.data) return { ...payload, data: asString(payload.data) };
  return payload;
}
