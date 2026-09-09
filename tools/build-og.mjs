/* Builds the three Open Graph cards in src/assets/images/ (1200x630 JPEG),
   the sizes seo.config.ts points at. Run it when the wording or the brand
   changes:  node tools/build-og.mjs
   Needs puppeteer-core and the system Chrome; the cards use the real Peridot
   PE file and the logo mark, both inlined, so they never depend on a network. */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const OUT = path.join(ROOT, 'src/assets/images');
fs.mkdirSync(OUT, { recursive: true });

const b64 = (p) => fs.readFileSync(path.join(ROOT, p)).toString('base64');
const FONT = b64('src/assets/fonts/peridot-pe-variable.woff2');
const MARK = b64('src/assets/img/logotr.webp');

// A honeycomb lattice, drawn rather than photographed: the comb photo went to
// mud on the ink ground. One hexagon tiled by SVG pattern, amber at 8%.
const HEX = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="112" height="97">
<path d="M28 0.5 84 0.5 112 48.5 84 96.5 28 96.5 0 48.5Z" fill="none" stroke="#f69520" stroke-width="2"/>
</svg>`).toString('base64');

// The brand tokens, read off src/styles/tokens: accent #f69520, ink #212121.
const card = (title, kicker) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"Peridot PE";src:url(data:font/woff2;base64,${FONT}) format("woff2");font-weight:100 900;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px}
body{
  background:#212121;
  font-family:"Peridot PE",-apple-system,"Segoe UI",sans-serif;
  color:#fff;position:relative;overflow:hidden;
}
.comb{
  position:absolute;right:-140px;top:-120px;width:900px;height:900px;
  background:url(data:image/svg+xml;base64,${HEX}) repeat;
  opacity:.09;
  -webkit-mask-image:radial-gradient(closest-side,#000 30%,transparent 78%);
          mask-image:radial-gradient(closest-side,#000 30%,transparent 78%);
}
.inner{position:relative;height:100%;padding:74px 80px;display:flex;flex-direction:column}
/* align-self, or the flex column stretches the mark to the full card width. */
.lockup{display:flex;align-items:center;gap:16px;align-self:flex-start}
/* The mark ships as black on transparent; force it white for the ink ground. */
.mark{width:54px;height:54px;filter:brightness(0) invert(1)}
.wordmark{font-size:30px;font-weight:700;letter-spacing:.03em;color:#fff}
.rule{width:74px;height:5px;background:#f69520;margin:44px 0 30px;border-radius:2px}
.kicker{
  font-size:21px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;
  color:#f69520;margin-bottom:22px;
}
h1{
  font-size:${title.length > 46 ? 62 : 72}px;font-weight:700;line-height:1.06;
  letter-spacing:-.02em;max-width:19ch;text-wrap:balance;
}
.foot{
  margin-top:auto;display:flex;align-items:center;gap:14px;
  font-size:23px;font-weight:400;color:#c9c4bd;letter-spacing:.01em;
}
.dot{width:7px;height:7px;border-radius:50%;background:#f69520;flex:none}
</style></head><body>
<div class="comb"></div>
<div class="inner">
  <div class="lockup">
    <img class="mark" src="data:image/webp;base64,${MARK}" alt="">
    <span class="wordmark">BEEHIVEMIND</span>
  </div>
  <div class="rule"></div>
  <div class="kicker">${kicker}</div>
  <h1>${title}</h1>
  <div class="foot"><span class="dot"></span>beehivemind.tech</div>
</div>
</body></html>`;

const CARDS = [
  ['og-home.jpg',     'Beehive management for working beekeepers', 'Beekeeping software'],
  ['og-features.jpg', 'Inspections, harvest, treatments and costs', 'Features'],
  ['og-blog.jpg',     'Notes on keeping bees with better records',  'Blog'],
];

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

for (const [file, title, kicker] of CARDS) {
  await page.setContent(card(title, kicker), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 250));
  const dest = path.join(OUT, file);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 88 });
  console.log(file.padEnd(18), (fs.statSync(dest).size / 1024).toFixed(1) + ' KB');
}
await browser.close();
