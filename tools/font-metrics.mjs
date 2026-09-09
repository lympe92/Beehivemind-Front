/* Measures Peridot against the local fallback candidates and prints the
   @font-face descriptors for the "Peridot Fallback" face in
   src/styles/tokens/fonts.css.

   Run it when the typeface is rebuilt by tools/build-font.py, and paste the
   result in. The point of the fallback face is that the two fonts occupy
   identical space, so `font-display: swap` cannot reflow the page — if these
   numbers drift, the layout shift comes back.

   The font is loaded through the FontFace API and then proved to be in use
   before anything is measured. An earlier version of this script trusted
   `document.fonts.ready` and silently measured Chrome's default serif when the
   face failed to apply, which produced a size-adjust that was wrong in the
   wrong direction and made the shift worse. Hence assertFontApplied().

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

/* Long and mixed: the ratio has to hold for real copy, not for one word. */
const SAMPLE =
  'The quick brown fox jumps over the lazy dog 0123456789 Beehivemind apiaries ' +
  'inspections harvest feeding treatments and costs, recorded by voice from the ' +
  'apiary, on a phone that works without a signal.';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setContent('<body></body>');

const result = await page.evaluate(
  async (font, candidates, sample) => {
    const face = new FontFace('Peridot PE', `url(data:font/woff2;base64,${font}) format("woff2")`, {
      weight: '400 700',
    });
    // Rejects on a bad file rather than quietly leaving us on the default font.
    await face.load();
    document.fonts.add(face);

    const width = (family, weight = 400) => {
      const el = document.createElement('span');
      el.style.cssText =
        'position:absolute;white-space:nowrap;letter-spacing:normal;' +
        `font-size:1000px;font-weight:${weight};font-family:${family}`;
      el.textContent = sample;
      document.body.appendChild(el);
      const w = el.getBoundingClientRect().width;
      el.remove();
      return w;
    };

    // A family that cannot exist renders in Chrome's default font. If Peridot
    // measures the same, it is not applying and every number below is fiction.
    const fallbackWidth = width('"__no_such_family__"');
    const peridotWidth = width('"Peridot PE"');
    if (Math.abs(peridotWidth - fallbackWidth) < 1) {
      throw new Error('"Peridot PE" is not being applied — measurements would be meaningless.');
    }

    const box = (family) => {
      const c = document.createElement('canvas').getContext('2d');
      c.font = `1000px ${family}`;
      const m = c.measureText('Hxg');
      return { ascent: m.fontBoundingBoxAscent / 1000, descent: m.fontBoundingBoxDescent / 1000 };
    };

    return {
      peridot: { width: peridotWidth, ...box('"Peridot PE"') },
      others: candidates.map((f) => ({ name: f, width: width(f), ...box(f) })),
    };
  },
  FONT,
  CANDIDATES,
  SAMPLE,
);

await browser.close();

const pct = (v) => `${(v * 100).toFixed(2)}%`;
const { peridot, others } = result;

console.log('Peridot PE');
console.log(
  `  ascent ${pct(peridot.ascent)}  descent ${pct(peridot.descent)}` +
    `  line box ${pct(peridot.ascent + peridot.descent)}\n`,
);

const ranked = others
  .map((o) => ({
    ...o,
    sizeAdjust: peridot.width / o.width,
    boxDelta: Math.abs(o.ascent + o.descent - (peridot.ascent + peridot.descent)),
  }))
  .sort((a, b) => a.boxDelta - b.boxDelta);

console.log('Candidates, best line-box match first:');
for (const o of ranked) {
  console.log(
    `  ${o.name.padEnd(12)} size-adjust ${pct(o.sizeAdjust)}` +
      `  line box ${pct(o.ascent + o.descent)}  (Δ ${pct(o.boxDelta)})`,
  );
}

/* The line box is forced by the overrides either way, so the base is chosen on
   width fidelity instead — and there `system-ui` is a trap: it resolves to
   Segoe UI, SF or Roboto depending on the machine, so one size-adjust cannot be
   right for all of them. Arial has fixed metrics everywhere and metric-clones
   (Helvetica, Liberation Sans) to fall back to. */
const RECOMMENDED = 'Arial';

for (const o of ranked) {
  const note =
    o.name === RECOMMENDED
      ? '  ← use this: fixed metrics on every platform'
      : o.name === 'system-ui'
        ? '  (platform-dependent — one ratio cannot fit Segoe UI, SF and Roboto)'
        : '';
  console.log(`\nDescriptors based on ${o.name}:${note}`);
  console.log('  size-adjust: ' + pct(o.sizeAdjust) + ';');
  console.log('  ascent-override: ' + pct(peridot.ascent / o.sizeAdjust) + ';');
  console.log('  descent-override: ' + pct(peridot.descent / o.sizeAdjust) + ';');
  console.log('  line-gap-override: 0%;');
}
