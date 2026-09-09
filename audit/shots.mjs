/* Side-by-side screenshots: the Angular app (left) against the design-system
   kit (right) for every page at every width. Writes shots/<n>-<slug>-<w>.png.
   Usage: node shots.mjs [--only=<substring,…>] [--widths=375,1440] */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { mock } from './mocks.mjs';

const APP = 'http://localhost:4301';
const KIT = 'http://localhost:4302/ui_kits';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = new URL('./shots/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v = '1'] = a.replace(/^--/, '').split('='); return [k, v]; }));
const WIDTHS = args.widths ? args.widths.split(',').map(Number) : [375, 768, 1024, 1440];
const ONLY = args.only ? args.only.split(',') : null;

const USER = { id: 10, name: 'Nikos', surname: 'Lymperis', email: 'nikos@beehivemind.tech', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true };
const EMPLOYEE = { id: 1, name: 'Anna', surname: 'Ioannou', email: 'anna@beehivemind.tech', role: 'superadmin' };
const AUTH_BASE = { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null };
const EMP_BASE = { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null };
const SEEDS = {
  none: null,
  user: { auth: { ...AUTH_BASE, user: USER }, employeeAuth: { ...EMP_BASE, employee: null } },
  admin: { auth: { ...AUTH_BASE, user: null }, employeeAuth: { ...EMP_BASE, employee: EMPLOYEE } },
};

/* [seed, app path, kit url, slug] */
const PAGES = [
  ['none', '/', `${KIT}/website/index.html#/`, 'home'],
  ['none', '/features', `${KIT}/website/index.html#/features`, 'features'],
  ['none', '/app', `${KIT}/website/index.html#/app`, 'app'],
  ['none', '/pricing', `${KIT}/website/index.html#/pricing`, 'pricing'],
  ['none', '/apiariesandbeehives', `${KIT}/website/index.html#/apiariesandbeehives`, 'apiaries'],
  ['none', '/financial', `${KIT}/website/index.html#/financial`, 'financial'],
  ['none', '/harvestandfeeding', `${KIT}/website/index.html#/harvestandfeeding`, 'harvest'],
  ['none', '/inspections', `${KIT}/website/index.html#/inspections`, 'inspections'],
  ['none', '/help', `${KIT}/website/index.html#/help`, 'help'],
  ['none', '/about', `${KIT}/website/index.html#/about`, 'about'],
  ['none', '/contact', `${KIT}/website/index.html#/contact`, 'contact'],
  ['none', '/privacy', `${KIT}/website/index.html#/privacy`, 'privacy'],
  ['none', '/terms', `${KIT}/website/index.html#/terms`, 'terms'],
  ['none', '/blog', `${KIT}/website/index.html#/blog`, 'blog'],
  ['none', '/blog/reading-closed-brood', `${KIT}/website/index.html#/blog/reading-closed-brood`, 'blog-article'],
  ['none', '/auth/login', `${KIT}/auth/index.html#/login`, 'auth-login'],
  ['none', '/auth/register', `${KIT}/auth/index.html#/register`, 'auth-register'],
  ['none', '/auth/reset-password', `${KIT}/auth/index.html#/request`, 'auth-request'],
  ['none', '/auth/reset-password?token=x', `${KIT}/auth/index.html#/reset`, 'auth-reset'],
  ['none', '/auth/confirmation', `${KIT}/auth/index.html#/confirm-fail`, 'auth-confirm-fail'],
  ['user', '/user/dashboard', `${KIT}/webapp/index.html#/user/dashboard`, 'u-dashboard'],
  ['user', '/user/apiary', `${KIT}/webapp/index.html#/user/apiary`, 'u-apiary'],
  ['user', '/user/apiary/details', `${KIT}/webapp/index.html#/user/apiary/details`, 'u-apiary-details'],
  ['user', '/user/apiary/map', `${KIT}/webapp/index.html#/user/apiary/map`, 'u-apiary-map'],
  ['user', '/user/apiary/1', `${KIT}/webapp/index.html#/user/apiary/view`, 'u-apiary-view'],
  ['user', '/user/beehives', `${KIT}/webapp/index.html#/user/beehives`, 'u-beehives'],
  ['user', '/user/inspections', `${KIT}/webapp/index.html#/user/inspections`, 'u-inspections'],
  ['user', '/user/feeding', `${KIT}/webapp/index.html#/user/feeding`, 'u-feeding'],
  ['user', '/user/harvest', `${KIT}/webapp/index.html#/user/harvest`, 'u-harvest'],
  ['user', '/user/treatments', `${KIT}/webapp/index.html#/user/treatments`, 'u-treatments'],
  ['user', '/user/treatments/details', `${KIT}/webapp/index.html#/user/treatments/details`, 'u-treatments-details'],
  ['user', '/user/financial', `${KIT}/webapp/index.html#/user/financial`, 'u-financial'],
  ['user', '/user/todo/list', `${KIT}/webapp/index.html#/user/todo/list`, 'u-todo'],
  ['user', '/user/todo/calendar', `${KIT}/webapp/index.html#/user/todo/calendar`, 'u-calendar'],
  ['user', '/user/ai-chat/1', `${KIT}/webapp/index.html#/user/ai-chat`, 'u-ai-chat'],
  ['user', '/user/profile', `${KIT}/webapp/index.html#/user/profile`, 'u-profile'],
  ['admin', '/admin/dashboard', `${KIT}/admin/index.html#/admin/dashboard`, 'a-dashboard'],
  ['admin', '/admin/users', `${KIT}/admin/index.html#/admin/users`, 'a-users'],
  ['admin', '/admin/moderation', `${KIT}/admin/index.html#/admin/moderation`, 'a-moderation'],
  ['admin', '/admin/employees', `${KIT}/admin/index.html#/admin/employees`, 'a-employees'],
  ['admin', '/admin/coupons', `${KIT}/admin/index.html#/admin/coupons`, 'a-coupons'],
  ['admin', '/admin/raw', `${KIT}/admin/index.html#/admin/raw`, 'a-raw'],
  ['admin', '/admin/profile', `${KIT}/admin/index.html#/admin/profile`, 'a-profile'],
].filter(([, p, , slug]) => !ONLY || ONLY.some(o => p === o || slug.includes(o)));

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function appPage(context, seed) {
  const page = await context.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith('http://localhost:8000/api/')) {
      const res = mock(req.method(), url.slice('http://localhost:8000/api/'.length));
      const headers = { 'Access-Control-Allow-Origin': APP, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Content-Type': 'application/json' };
      if (res && res.status === 204) return req.respond({ status: 204, headers });
      return req.respond({ status: 200, headers, body: JSON.stringify(res) });
    }
    if (url.startsWith(APP) || url.startsWith('data:') || url.startsWith('blob:')) return req.continue();
    return req.abort();
  });
  await page.evaluateOnNewDocument((s) => { try { s ? localStorage.setItem('bhm_auth', JSON.stringify(s)) : localStorage.removeItem('bhm_auth'); } catch {} }, seed);
  return page;
}

async function shoot(page, url, width, isKit, height, fullPage) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  /* A hash-only change keeps the kit's React state (the sidebar's open flag
     from the previous width); leave the document first so it mounts afresh. */
  if (isKit) await page.goto('about:blank').catch(() => {});
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 }).catch(() => {});
  if (isKit) {
    /* Hash routing: force the route after load, then let React settle. */
    const hash = url.split('#')[1];
    if (hash) await page.evaluate((h) => { window.location.hash = h; }, hash);
    await sleep(1400);
  } else {
    await sleep(900);
  }
  if (fullPage) {
    /* Lazy images (ngSrc / loading=lazy) only load near the viewport: walk the
       page to the bottom so every band has its artwork, then return to top. */
    await page.evaluate(async () => {
      const step = Math.max(400, window.innerHeight - 100);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 120));
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise(r => setTimeout(r, 500));
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 400));
    });
  }
  return page.screenshot({ fullPage, type: 'png', encoding: 'base64' });
}

async function compose(page, left, right, label) {
  await page.setViewport({ width: 100, height: 100 });
  await page.setContent(`<html><body style="margin:0;background:#888"><canvas id=c></canvas><script>
    window.done = (async () => {
      const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
      const a = await load('data:image/png;base64,${left}');
      const b = await load('data:image/png;base64,${right}');
      const gap = 24, top = 36;
      const c = document.getElementById('c');
      c.width = a.width + b.width + gap; c.height = Math.max(a.height, b.height) + top;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#888'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText('APP  ' + ${JSON.stringify(label)}, 8, 24);
      ctx.fillText('DESIGN SYSTEM', a.width + gap + 8, 24);
      ctx.drawImage(a, 0, top); ctx.drawImage(b, a.width + gap, top);
      return [c.width, c.height];
    })();
  </script></body></html>`);
  const [w, h] = await page.evaluate(() => window.done);
  await page.setViewport({ width: w, height: Math.min(h, 16000) });
  const el = await page.$('#c');
  return el.screenshot({ type: 'png' });
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const kitContext = await browser.createBrowserContext();
  const kitPage = await kitContext.newPage();
  const canvasPage = await (await browser.createBrowserContext()).newPage();
  let n = 0;
  for (const seedName of ['none', 'user', 'admin']) {
    const pages = PAGES.filter(([s]) => s === seedName);
    if (!pages.length) continue;
    const context = await browser.createBrowserContext();
    const app = await appPage(context, SEEDS[seedName]);
    for (const [, path, kitUrl, slug] of pages) {
      for (const width of WIDTHS) {
        n++;
        /* The app shells scroll inside their own content pane, and a full-page
           capture re-lays them out (the sidebar collapses mid-capture), so they
           get a tall plain viewport instead. The website is captured full-page. */
        const website = seedName === 'none';
        const height = website ? 900 : 1500;
        const left = await shoot(app, APP + path, width, false, height, website);
        const right = await shoot(kitPage, kitUrl, width, true, height, website);
        const png = await compose(canvasPage, left, right, `${path} @ ${width}`);
        const file = `${String(n).padStart(3, '0')}-${slug}-${width}.png`;
        writeFileSync(new URL(file, OUT), png);
        console.log(file);
      }
    }
    await context.close();
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
