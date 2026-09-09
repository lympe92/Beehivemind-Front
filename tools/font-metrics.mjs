/* Measures Peridot against the local fallback candidates and prints the
   @font-face descriptors for the "Peridot Fallback" face in
   src/styles/tokens/fonts.css.

   Run it when the typeface is rebuilt by tools/build-font.py, and paste the
   result in. The point of the fallback face is that the two fonts occupy
   identical space, so `font-display: swap` cannot reflow the page — if these
   numbers drift, the layout shift comes back.

   Usage: node tools/font-metrics.mjs
   Needs puppeteer-core and the system Chrome. */

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const FONT = fs
  .readFileSync(path.join(ROOT, 'src/assets/fonts/peridot-pe-variable.woff2'))
  .toString('base64');

const CANDIDATES = ['Arial', 'Helvetica', 'system-ui'];

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setContent(
  `<style>@font-face{font-family:"Peridot PE";` +
    `src:url(data:font/woff2;base64,${FONT}) format("woff2");` +
    `font-weight:400 700;font-display:block}</style>`,
);
await page.evaluate(() => document.fonts.ready);

const result = await page.evaluate((candidates) => {
  // A mixed string: the ratio should hold for real copy, not one glyph.
  const SAMPLE =
    'The quick brown fox jumps over the lazy dog 0123456789 Beehivemind apiaries inspections';

  const width = (family) => {
    const el = document.createElement('span');
    el.style.cssText = `position:absolute;white-space:nowrap;font-size:1000px;font-family:${family}`;
    el.textContent = SAMPLE;
    document.body.appendChild(el);
    const w = el.getBoundingClientRect().width;
    el.remove();
    return w;
  };

  const box = (family) => {
    const c = document.createElement('canvas').getContext('2d');
    c.font = `1000px ${family}`;
    const m = c.measureText('Hxg');
    return { ascent: m.fontBoundingBoxAscent / 1000, descent: m.fontBoundingBoxDescent / 1000 };
  };

  const peridot = { width: width('"Peridot PE"'), ...box('"Peridot PE"') };
  const others = candidates.map((f) => ({ name: f, width: width(f), ...box(f) }));
  return { peridot, others };
}, CANDIDATES);

await browser.close();

const pct = (v) => `${(v * 100).toFixed(2)}%`;
const { peridot, others } = result;

console.log('Peridot PE');
console.log(`  ascent ${pct(peridot.ascent)}  descent ${pct(peridot.descent)}` +
  `  line box ${pct(peridot.ascent + peridot.descent)}\n`);

console.log('Candidates, best line-box match first:');
const ranked = others
  .map((o) => ({
    ...o,
    sizeAdjust: peridot.width / o.width,
    boxDelta: Math.abs(o.ascent + o.descent - (peridot.ascent + peridot.descent)),
  }))
  .sort((a, b) => a.boxDelta - b.boxDelta);

for (const o of ranked) {
  console.log(
    `  ${o.name.padEnd(12)} size-adjust ${pct(o.sizeAdjust)}` +
      `  line box ${pct(o.ascent + o.descent)}  (Δ ${pct(o.boxDelta)})`,
  );
}

const best = ranked[0];
console.log(`\nDescriptors for "Peridot Fallback", based on ${best.name}:\n`);
console.log('  size-adjust: ' + pct(best.sizeAdjust) + ';');
console.log('  ascent-override: ' + pct(peridot.ascent / best.sizeAdjust) + ';');
console.log('  descent-override: ' + pct(peridot.descent / best.sizeAdjust) + ';');
console.log('  line-gap-override: 0%;');
