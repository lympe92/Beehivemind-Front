/* Writes dist/beehivemind-Front/sitemap-pages.json after `ng build`.
   Run by the `build` script; run standalone with: node tools/build-sitemap.mjs

   This is HALF of the sitemap — the static marketing pages only. The XML itself
   is assembled per request by the /sitemap.xml route in server.ts, which adds
   the blog articles, because those come from the console and a build-time list
   could never include a post published after the deploy.

   Why the static half is still done here: a page is included only if its own
   rendered HTML does not say `noindex`, and `lastmod` is the last commit that
   touched the page's source folder. Neither fact survives into production — the
   deployed droplet has no git checkout and no source — so both are resolved now
   and handed to the server as data.

   Nothing here is a hand-kept list: the routes come from what Angular actually
   prerendered, so this file cannot disagree with the build or with
   seo.config.ts. */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const DIST = path.join(ROOT, 'dist/beehivemind-Front');
const BROWSER = path.join(DIST, 'browser');
const BASE = 'https://beehivemind.tech';

const read = (p) => fs.readFileSync(p, 'utf8');

const prerendered = Object.keys(
  JSON.parse(read(path.join(DIST, 'prerendered-routes.json'))).routes,
);

/* Route -> source folder, straight out of public.routes.ts, so a renamed
   folder cannot silently break lastmod. */
const routesSrc = read(path.join(ROOT, 'src/app/features/public/public.routes.ts'));
const folderFor = new Map();
for (const m of routesSrc.matchAll(/path:\s*'([^']*)'[\s\S]{0,200}?import\('\.\/([^/']+)\//g)) {
  folderFor.set('/' + m[1], m[2]);
}

const gitDate = (relDir) => {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', relDir], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
};

const htmlFor = (route) =>
  path.join(BROWSER, route === '/' ? 'index.html' : route.replace(/^\//, '') + '/index.html');

const pages = [];
const skipped = [];

for (const route of prerendered) {
  const file = htmlFor(route);
  if (!fs.existsSync(file)) continue;
  // The page's own robots directive decides. /privacy and /terms opt out here.
  if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(read(file))) {
    skipped.push(route);
    continue;
  }
  const folder = folderFor.get(route);
  pages.push({
    loc: BASE + (route === '/' ? '/' : route),
    lastmod: folder ? gitDate(`src/app/features/public/${folder}`) : null,
  });
}

const out = path.join(DIST, 'sitemap-pages.json');
fs.writeFileSync(out, JSON.stringify({ base: BASE, pages }, null, 2) + '\n');

console.log(`sitemap-pages.json: ${pages.length} static pages (articles are added at request time)`);
if (skipped.length) console.log(`  noindex, excluded: ${skipped.join(', ')}`);
const missing = pages.filter((p) => !p.lastmod).map((p) => p.loc);
if (missing.length) console.log(`  no lastmod: ${missing.join(', ')}`);
