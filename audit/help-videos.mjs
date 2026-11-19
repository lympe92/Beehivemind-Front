/* Records the "How this page works" videos (core/help/page-help.ts → video):
   one short screen recording per page, with a caption for every step, against
   the mocked API. Nothing here is a check; it produces src/assets/help/<id>.mp4
   and <id>.jpg (the poster).

   Usage: dev server on 4201 (`npm start`: the Google Maps key allows that port,
   not 4301), ffmpeg on the PATH, then
     node help-videos.mjs                 every page
     node help-videos.mjs --only=feeding,harvest
     node help-videos.mjs --explore       no recording: a screenshot and the buttons of every page
   The scenes are in help-video-scenes.mjs. */
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { mock, TEAM_SUMMARY } from './mocks.mjs';
import { SCENES } from './help-video-scenes.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.OUT || path.join(HERE, '..', 'src', 'assets', 'help');
const TMP = path.join(tmpdir(), 'bhm-help-videos');
// Recorded here and copied to OUT at the end: a file landing in src/assets mid-run makes the dev server reload the page being recorded.
const STAGE = path.join(TMP, 'out');
const BASE = `http://localhost:${process.env.PORT || 4201}`;
const API = 'http://localhost:8000/api/';
const W = 1536, H = 864;

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const only = typeof args.only === 'string' ? args.only.split(',') : null;

const USER = { id: 10, name: 'Daniel', surname: 'Hart', email: 'daniel@example.com', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true, onboarding: null, onboarding_progress: { seen: [], panel: 'open' }, team: TEAM_SUMMARY };
const SEED = {
  auth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorPending: null, pendingUser: null, pendingToken: null, retryAfterMinutes: null, user: USER },
  employeeAuth: { token: null, loading: false, error: null, twoFactorToken: null, twoFactorStep: null, employee: null },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (data) => ({ success: true, code: 200, message: 'OK', data });

// The videos show one invented beekeeper everywhere.
Object.assign(mock('GET', 'user/profile').data, { name: USER.name, surname: USER.surname, email: USER.email });
Object.assign(mock('GET', 'team').data.owner ?? {}, { name: USER.name, surname: USER.surname, email: USER.email });

/** The list a GET answers with. mocks.mjs hands out its own arrays, so a scene that adds a row to one sees it listed. */
const list = (route) => mock('GET', route).data;

const CORS = {
  'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'content-type, authorization, accept, x-requested-with, x-xsrf-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

async function open(browser, scene) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  if (args.debug) {
    page.on('console', (m) => m.type() === 'error' && console.log('   console:', m.text().slice(0, 160)));
    page.on('pageerror', (e) => console.log('   page error:', e.message.slice(0, 160)));
  }
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url();
    try {
      if (url.startsWith(API)) {
        const method = req.method();
        const route = url.slice(API.length);
        let res;
        if (method === 'OPTIONS') res = { status: 204, body: null };
        else if (method === 'GET') res = mock(method, route);
        else {
          const raw = req.postData() ?? (await req.fetchPostData());
          let body = {};
          try { body = raw ? JSON.parse(raw) : {}; } catch { /* a form upload */ }
          // A scene's `write(method, route, body, list)` puts the new row where the page will read it back.
          res = ok(scene.write?.(method, route.split('?')[0], body, list) ?? {});
          if (args.debug) console.log('   write:', method, route, JSON.stringify(body).slice(0, 200));
        }
        const wrapped = res && res.status;
        return await req.respond({ status: wrapped ? res.status : 200, headers: CORS, body: (wrapped ? res.body : res) == null ? '' : JSON.stringify(wrapped ? res.body : res) });
      }
      if (url === BASE + '/cdn-cgi/trace') return await req.respond({ status: 200, body: 'loc=US\n' });
      if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:') || /maps\.googleapis\.com|maps\.gstatic\.com|khms|googleusercontent/.test(url)) return await req.continue();
      return await req.abort();
    } catch { /* the page moved on */ }
  });
  await page.evaluateOnNewDocument((seed) => localStorage.setItem('bhm_auth', JSON.stringify(seed)), SEED);
  await page.goto(BASE + scene.path, { waitUntil: 'networkidle0' });
  await sleep(600);
  return page;
}

/** What a scene is written with: say a caption, point, press, type, wait. */
async function director(page) {
  // The caption and the pointer are popovers: CDK dialogs open in the top layer,
  // and only something shown after them sits over them. Headless Chrome draws no cursor.
  await page.evaluate(() => {
    const cap = document.createElement('div');
    const cur = document.createElement('div');
    cap.popover = 'manual';
    cur.popover = 'manual';
    cap.style.cssText = 'position:fixed;inset:auto auto 16px 50%;margin:0;border:0;overflow:visible;transform:translateX(-50%);width:max-content;max-width:1300px;padding:12px 28px;border-radius:12px;background:#212121;color:#fff;font-size:24px;font-weight:500;line-height:1.3;font-family:inherit;text-align:center;box-shadow:0 8px 28px rgba(0,0,0,.28);opacity:0;transition:opacity .25s;pointer-events:none';
    cur.style.cssText = 'position:fixed;inset:auto;left:0;top:0;width:24px;height:24px;margin:-12px 0 0 -12px;padding:0;overflow:visible;border-radius:50%;background:rgba(246,149,32,.55);border:2px solid #f69520;pointer-events:none;transition:transform .12s';
    document.body.append(cap, cur);
    window.__vid = {
      raise() { for (const e of [cap, cur]) { try { e.hidePopover(); } catch { /* not shown yet */ } e.showPopover(); } },
      say(t, top) { cap.textContent = t; cap.style.opacity = t ? '1' : '0'; cap.style.inset = top ? '64px auto auto 50%' : 'auto auto 16px 50%'; this.raise(); },
    };
    addEventListener('mousemove', (e) => { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => { cur.style.transform = 'scale(.6)'; }, true);
    addEventListener('mouseup', () => { cur.style.transform = 'scale(1)'; }, true);
    window.__vid.raise();
  });

  const v = {
    page,
    wait: sleep,
    /** A caption, held for `ms` when given; `{ top: true }` when what it describes is at the foot of the page. */
    async say(text, ms = 0, { top = false } = {}) { await page.evaluate((t, up) => window.__vid.say(t, up), text, top); if (ms) await sleep(ms); },
    /** The first visible element matching `selector` whose text is (or with `{ has: true }` contains) `text`, optionally the n-th. */
    async el(selector, text, { has = false, nth = 0, timeout = 10000 } = {}) {
      const handle = await page.waitForFunction((s, t, h, n) => {
        const all = [...document.querySelectorAll(s)].filter((e) => {
          const r = e.getBoundingClientRect();
          if (!r.width || !r.height) return false;
          if (t == null) return true;
          const own = e.textContent.replace(/\s+/g, ' ').trim();
          return h ? own.includes(t) : own === t;
        });
        return all[n] ?? false;
      }, { timeout }, selector, text ?? null, has, nth).catch(() => { throw new Error(`not found: ${selector} ${text ?? ''}`); });
      return handle.asElement();
    },
    /** A control by its name: its `aria-label`, or else its text. */
    async named(name, { scope = 'body', nth = 0 } = {}) {
      const handle = await page.waitForFunction((s, t, n) => [...document.querySelectorAll(`${s} button, ${s} a, ${s} [role="button"]`)].filter((e) => e.getBoundingClientRect().width && (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim() === t)[n] ?? false, { timeout: 10000 }, scope, name, nth).catch(() => { throw new Error(`no control named ${name}`); });
      return handle.asElement();
    },
    async point(target, { dx = 0.5, dy = 0.5 } = {}) {
      const handle = typeof target === 'string' ? await v.el(target) : target;
      const moved = await handle.evaluate((e) => {
        const r = e.getBoundingClientRect();
        if (r.top >= 70 && r.bottom <= innerHeight - 110) return false;
        e.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return true;
      });
      if (moved) await sleep(900);
      const b = await handle.boundingBox();
      const p = { x: b.x + b.width * dx, y: b.y + b.height * dy };
      await page.mouse.move(p.x, p.y, { steps: 30 });
      await sleep(300);
      return p;
    },
    async click(target, at) {
      await v.point(target, at);
      await page.mouse.down();
      await sleep(90);
      await page.mouse.up();
      await sleep(350);
      await page.evaluate(() => window.__vid.raise());
    },
    async type(target, text) {
      await v.click(target);
      await page.keyboard.type(text, { delay: 65 });
      await sleep(250);
    },
    /** Chooses a `<select>` option by its text, as a person would see it change. */
    async choose(target, optionText) {
      const handle = typeof target === 'string' ? await v.el(target) : target;
      await v.point(handle);
      await handle.evaluate((s, t) => {
        const o = [...s.options].find((x) => x.textContent.trim().includes(t));
        if (!o) throw new Error('no option ' + t);
        s.value = o.value;
        s.dispatchEvent(new Event('input', { bubbles: true }));
        s.dispatchEvent(new Event('change', { bubbles: true }));
      }, optionText);
      await sleep(500);
    },
    /** A date input, set as a value (the native picker is not drawn in a recording). */
    async date(target, iso) {
      const handle = typeof target === 'string' ? await v.el(target) : target;
      await v.point(handle);
      await handle.evaluate((i, d) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, d);
        i.dispatchEvent(new Event('input', { bubbles: true }));
        i.dispatchEvent(new Event('change', { bubbles: true }));
      }, iso);
      await sleep(400);
    },
    /** Scrolls the page's own scroller to `y`. */
    async scroll(y) {
      await page.evaluate((top) => {
        const scrollers = [document.scrollingElement, ...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 4 && (e === document.scrollingElement || /auto|scroll/.test(getComputedStyle(e).overflowY)));
        scrollers.sort((a, b) => b.clientHeight * b.clientWidth - a.clientHeight * a.clientWidth)[0]?.scrollTo({ top, behavior: 'smooth' });
      }, y);
      await sleep(1000);
    },
    /** An element inside another: the first matching `selector` whose text is `text`. */
    async inside(parent, selector, text) {
      const h = await parent.evaluateHandle((p, s, t) => [...p.querySelectorAll(s)].find((e) => t == null || (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim() === t), selector, text ?? null);
      if (!h.asElement()) throw new Error(`not found inside: ${selector} ${text ?? ''}`);
      return h.asElement();
    },
    /** The field of a dialog or page by its label's words. */
    field(label, scope = 'body') {
      return page.evaluateHandle((l, s) => {
        const root = document.querySelector(s);
        const lab = [...root.querySelectorAll('label, .form-label')].find((e) => e.textContent.replace(/\s+/g, ' ').trim().replace(/\s*\*$/, '').toLowerCase() === l.toLowerCase());
        if (!lab) throw new Error(`no field "${l}" among: ` + [...root.querySelectorAll('label, .form-label')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
        const wrap = lab.closest('.form-group, .form-field, app-form-input, app-form-select, app-form-textarea') ?? lab.parentElement;
        return wrap.querySelector('input, select, textarea');
      }, label, scope).then((h) => h.asElement());
    },
  };
  return v;
}

async function explore(browser, id, scene) {
  const page = await open(browser, scene);
  await page.screenshot({ path: path.join(TMP, `${id}.png`) });
  const words = await page.evaluate(() => {
    const root = document.querySelector('.user-content') ?? document.body;
    const text = (e) => (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim().slice(0, 40);
    const uniq = (a) => [...new Set(a)].filter(Boolean);
    return {
      buttons: uniq([...root.querySelectorAll('button, a.app-btn, [role=button]')].map((b) => `${text(b)}${b.className.includes('primary') ? '*' : ''}`)),
      selects: uniq([...root.querySelectorAll('select')].map((s) => s.closest('label, .form-group, .fb__group')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 50) ?? s.name)),
      heads: uniq([...root.querySelectorAll('h1, h2, h3, .card__title, th')].map(text)),
    };
  });
  console.log(`${id} ${scene.path}\n  buttons: ${words.buttons.join(' | ')}\n  selects: ${words.selects.join(' | ')}\n  heads: ${words.heads.join(' | ')}`);
  // --dialog="+ Add|Edit": press each button in turn and list what its dialog asks for.
  if (typeof args.dialog === 'string') {
    for (const name of args.dialog.split('|')) {
      await page.evaluate((t) => [...document.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || b.textContent).replace(/\s+/g, ' ').trim() === t)?.click(), name);
      await sleep(1200);
      const d = await page.evaluate(() => {
        const root = document.querySelector('.cdk-overlay-container');
        const t = (e) => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 60);
        if (!root) return null;
        return {
          fields: [...root.querySelectorAll('label, .form-label')].map((l) => {
            const w = l.closest('.form-group, app-form-input, app-form-select, app-form-textarea') ?? l.parentElement;
            const c = w.querySelector('input, select, textarea');
            const options = c && c.tagName === 'SELECT' ? ' [' + [...c.options].map((o) => o.textContent.trim()).join(',').slice(0, 120) + ']' : '';
            return `${t(l)} <${c ? c.tagName.toLowerCase() + (c.type ? ':' + c.type : '') : '?'}>${options}`;
          }),
          buttons: [...root.querySelectorAll('button')].map(t),
        };
      });
      console.log(`  dialog "${name}":`, JSON.stringify(d));
      await page.screenshot({ path: path.join(TMP, `${id}-${name.replace(/\W+/g, '')}.png`) });
      await page.keyboard.press('Escape');
      await sleep(500);
    }
  }
  await page.close();
}

async function record(browser, id, scene) {
  const page = await open(browser, scene);
  const v = await director(page);
  await page.mouse.move(W / 2, H / 2 - 40);
  const webm = path.join(TMP, `${id}.webm`);
  const rec = await page.screencast({ path: webm });
  try {
    let timer;
    await Promise.race([scene.run(v), new Promise((_, no) => { timer = setTimeout(() => no(new Error('the scene ran over two minutes')), 120000); })]).finally(() => clearTimeout(timer));
    await v.say('');
    await sleep(500);
  } finally {
    await rec.stop();
    await page.close();
  }
  const mp4 = path.join(STAGE, `${id}.mp4`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-r', '20', '-movflags', '+faststart', '-an', mp4]);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', '1.5', '-i', mp4, '-frames:v', '1', '-vf', 'scale=960:-1', '-q:v', '5', path.join(STAGE, `${id}.jpg`)]);
  const seconds = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString());
  console.log(`OK   ${id}: ${seconds.toFixed(0)} s`);
}

mkdirSync(STAGE, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: [`--window-size=${W},${H}`, '--hide-scrollbars'],
});
let failed = false;
try {
  for (const [id, scene] of Object.entries(SCENES)) {
    if (only && !only.includes(id)) continue;
    // A scene that saves something changes the mock's lists, so each one is recorded by a process of its own.
    if (!args.explore && !args.child) {
      const flags = process.argv.slice(2).filter((a) => !a.startsWith('--only'));
      const child = () => execFileSync(process.execPath, [fileURLToPath(import.meta.url), `--only=${id}`, '--child', ...flags], { stdio: 'inherit', timeout: 200000 });
      try { child(); } catch {
        // Headless Chrome now and then stops sending frames; a second take is the cure.
        console.log(`     ${id}: second take`);
        try { child(); } catch { failed = true; console.log(`FAIL ${id}: no take finished`); }
      }
      continue;
    }
    try {
      await (args.explore ? explore(browser, id, scene) : record(browser, id, scene));
    } catch (e) {
      failed = true;
      console.log(`FAIL ${id}: ${e.message}`);
      if (args.debug) await (await browser.pages()).at(-1)?.screenshot({ path: path.join(TMP, `${id}-fail.png`) }).catch(() => {});
    }
  }
} finally {
  await browser.close();
  if (!args.explore && !args.child) {
    mkdirSync(OUT, { recursive: true });
    for (const file of readdirSync(STAGE)) copyFileSync(path.join(STAGE, file), path.join(OUT, file));
    if (!args.keep) rmSync(TMP, { recursive: true, force: true });
  }
}
process.exitCode = failed ? 1 : 0;
