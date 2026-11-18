import puppeteer from 'puppeteer-core';
import { mock, TEAM_SUMMARY, ONBOARDING_SUMMARY } from './mocks.mjs';
const BASE = 'http://localhost:4301', API = 'http://localhost:8000/api/';
const USER = { id: 10, name: 'Nikos', surname: 'Lymperis', email: 'nikos@beehivemind.tech', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true, onboarding: 'active', onboarding_progress: { seen: ['wizard'], panel: 'open' }, team: TEAM_SUMMARY };
const SEED = { auth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null, user: USER },
  employeeAuth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null, employee: null } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const st = { onboarding: 'active', onboarding_progress: { seen: ['wizard', 'diagnosis', 'dashboard', 'calendar'], panel: 'open' } };
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const out = [];
for (const [width, height] of [[1568, 760], [1280, 720], [375, 740]]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith(API)) {
      const route = url.slice(API.length).split('?')[0];
      let res = route === 'user/onboarding/summary' ? { success: true, data: { ...ONBOARDING_SUMMARY, team_members: 0, pending_invitations: 0, ...st } }
        : route.startsWith('user/onboarding') ? { success: true, data: st } : mock(req.method(), url.slice(API.length));
      return req.respond({ status: 200, headers: { 'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*, content-type, authorization, x-requested-with, accept', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS', 'Content-Type': 'application/json' }, body: JSON.stringify(res) });
    }
    if (url === BASE + '/cdn-cgi/trace') return req.respond({ status: 200, body: 'loc=US\n' });
    if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')) return req.continue();
    return req.abort();
  });
  await page.evaluateOnNewDocument((seed) => { localStorage.setItem('bhm_auth', JSON.stringify(seed)); sessionStorage.setItem('bhm_guide_tutorial', 'around'); }, SEED);
  const covered = (sel, text) => page.evaluate((sel, text) => {
    const p = document.querySelector('.gs-panel, .gs-bar')?.getBoundingClientRect();
    const els = [...document.querySelectorAll(sel)].filter((e) => !text || e.textContent.trim() === text).filter((e) => !e.closest('app-getting-started'));
    const hit = (r) => p && r.right > p.left && r.left < p.right && r.bottom > p.top && r.top < p.bottom;
    return { n: els.length, under: els.filter((e) => hit(e.getBoundingClientRect())).length, panel: p && [Math.round(p.left), Math.round(p.top), Math.round(p.width), Math.round(p.height)], clear: getComputedStyle(document.documentElement).getPropertyValue('--gs-clear'), overflowX: document.documentElement.scrollWidth > innerWidth };
  }, sel, text);
  await page.goto(BASE + '/user/inspections', { waitUntil: 'networkidle0' }); await sleep(1000);
  out.push([width, 'inspections row buttons', JSON.stringify(await covered('.dt__table button'))]);
  await page.screenshot({ path: `${process.argv[2]}/clear-insp-${width}.png` });
  await page.evaluate(() => { const c = document.querySelector('.user-content'); c.scrollTop = c.scrollHeight; }); await sleep(300);
  out.push([width, 'inspections scrolled to end', JSON.stringify(await covered('.dt__table button'))]);
  await page.goto(BASE + '/user/profile?show=data', { waitUntil: 'networkidle0' }); await sleep(3500);
  const top = await page.evaluate(() => { const c = document.getElementById('your-data').getBoundingClientRect(); return [Math.round(c.top), Math.round(c.bottom), innerHeight]; });
  out.push([width, 'your-data top/bottom/vh', top.join(','), 'Export button', JSON.stringify(await covered('#your-data button', 'Export'))]);
  await page.screenshot({ path: `${process.argv[2]}/clear-profile-${width}.png` });
  // a toast: save the profile form is not needed; trigger the export (mock answers) and read the toast position
  await page.evaluate(() => [...document.querySelectorAll('#your-data button')].find((b) => b.textContent.trim() === 'Export')?.click()); await sleep(1200);
  out.push([width, 'toast', JSON.stringify(await page.evaluate(() => { const t = document.querySelector('.toast')?.getBoundingClientRect(); const p = document.querySelector('.gs-panel, .gs-bar')?.getBoundingClientRect(); return t ? { toast: [Math.round(t.left), Math.round(t.top), Math.round(t.right), Math.round(t.bottom)], overlapsPanel: !!p && t.right > p.left && t.left < p.right && t.bottom > p.top && t.top < p.bottom, text: document.querySelector('.toast').innerText.slice(0, 60) } : 'no toast'; }))]);
  await page.screenshot({ path: `${process.argv[2]}/clear-toast-${width}.png` });
  await page.close();
}
console.log(out.map((o) => o.join(' | ')).join('\n'));
await browser.close();
