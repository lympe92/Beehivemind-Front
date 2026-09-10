import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import compression from 'compression';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { environment } from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

/* ----------------------------------------------------- blog API cache (SSR) */

/**
 * Every blog page is rendered by asking the API, and every render comes from
 * this one process, so the API's per-address limit was shared by every visitor
 * and crawler at once: a burst of twenty page views in a minute was enough to
 * turn the whole blog into "Temporarily unavailable" for the next sixty seconds
 * (the crawler that ignores `<base href>` did it single-handedly, asking for
 * `/blog/chunk-….js` and the like).
 *
 * So the API's answers are kept here for a minute — `HttpClient` runs on
 * `fetch` (`withFetch()` in app.config.ts) and this wraps the global one — and
 * when the API refuses or fails, a copy up to a day old is served instead of
 * the error. Only the public blog reads pass through here: nothing signed-in
 * is ever rendered on the server.
 *
 * Below `HttpClient` on purpose. The transfer cache still sees an ordinary
 * response, so the browser hydrates from the HTML and never asks again.
 */
const BLOG_API_PREFIX = `${environment.apiUrl}blog/`;
const BLOG_CACHE_TTL_MS = 60 * 1000;
const BLOG_CACHE_STALE_MS = 24 * 60 * 60 * 1000;
const BLOG_CACHE_MAX_ENTRIES = 500;
// Set for the wire, meaningless once the body has been read and decoded.
const HOP_HEADERS = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection']);

interface CachedAnswer {
  status: number;
  headers: [string, string][];
  body: string;
  storedAt: number;
}

const blogCache = new Map<string, CachedAnswer>();

const answerFrom = (entry: CachedAnswer): Response =>
  new Response(entry.body, { status: entry.status, headers: entry.headers });

const originalFetch = globalThis.fetch;

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (method !== 'GET' || !url.startsWith(BLOG_API_PREFIX)) {
    return originalFetch(input, init);
  }

  const now = Date.now();
  const known = blogCache.get(url);
  if (known && now - known.storedAt < BLOG_CACHE_TTL_MS) {
    return answerFrom(known);
  }

  const stale = known && now - known.storedAt < BLOG_CACHE_STALE_MS ? known : undefined;

  try {
    const response = await originalFetch(input, init);
    // A 404 is an answer too: an invented slug stays invented for a minute
    // rather than costing a request per crawler retry.
    if (response.status !== 200 && response.status !== 404) {
      return stale ? answerFrom(stale) : response;
    }
    const entry: CachedAnswer = {
      status: response.status,
      headers: [...response.headers.entries()].filter(([name]) => !HOP_HEADERS.has(name.toLowerCase())),
      body: await response.text(),
      storedAt: now,
    };
    blogCache.set(url, entry);
    if (blogCache.size > BLOG_CACHE_MAX_ENTRIES) {
      blogCache.delete(blogCache.keys().next().value as string);
    }
    return answerFrom(entry);
  } catch (error) {
    if (stale) {
      return answerFrom(stale);
    }
    throw error;
  }
};

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(compression());

/* ---------------------------------------------------------- canonical URLs */

/**
 * One address per page. nginx answers for both hostnames and the router
 * accepts a route with or without a trailing slash, so without this the home
 * page lives at four URLs (`/`, `/index.html`, and both again under `www`).
 * The canonical tag only *asks* Google to consolidate them; a 301 settles it,
 * and moves whatever links point at the variants onto the one that counts.
 *
 * Only GET and HEAD, only the host and the path — the query string travels
 * with the visitor. `www` is always sent to https: nothing behind this proxy
 * speaks plain http.
 */
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const host = req.headers.host ?? '';
  const apex = host.startsWith('www.') ? host.slice(4) : null;

  let path = req.path;
  if (path === '/index.html') path = '/';
  else if (path.length > 1 && path.endsWith('/')) path = path.replace(/\/+$/, '');

  if (apex === null && path === req.path) return next();

  const query = req.originalUrl.slice(req.path.length);
  res.redirect(301, `${apex ? `https://${apex}` : ''}${path}${query}`);
});

/* ------------------------------------------------------------ crawl control */

/**
 * The auth screens and the signed-in zones are client-rendered: a crawler gets
 * the empty shell. Every page links to /auth/register and /auth/login, though,
 * and a URL that many links point at gets indexed even when robots.txt blocks
 * it — listed as a bare address with no title. This header is the directive a
 * crawler can act on. robots.txt therefore lets /auth through so the header is
 * seen and the page is dropped, rather than listed empty; /user and /admin stay
 * disallowed as well, since nothing links to them.
 */
app.use(['/auth', '/user', '/admin'], (_req, res, next) => {
  res.set('X-Robots-Tag', 'noindex');
  next();
});

/* ------------------------------------------------------------------ sitemap */

interface SitemapEntry {
  loc: string;
  lastmod: string | null;
}

/**
 * The static half, resolved at build time by tools/build-sitemap.mjs: which
 * pages are indexable, and when each was last changed. Neither can be worked
 * out in production — there is no git checkout and no source on the droplet.
 */
const staticPages = (): { base: string; pages: SitemapEntry[] } => {
  try {
    return JSON.parse(readFileSync(join(import.meta.dirname, '../sitemap-pages.json'), 'utf8'));
  } catch {
    // A dev server run straight from source has no manifest. The blog half
    // below still works, so serve what we have rather than a 500.
    return { base: 'https://beehivemind.tech', pages: [] };
  }
};

/**
 * The dynamic half: everything the console has published. Fetched rather than
 * bundled, because a post that goes up between deploys has to appear here
 * without one.
 *
 * A failure returns nothing rather than throwing. A sitemap missing its
 * articles for an hour is a small problem; a 500 on /sitemap.xml is the kind a
 * crawler remembers.
 */
interface BlogIndex {
  posts: { slug: string; updated_at: string; published_at: string | null }[];
  categories: { slug: string; updated_at: string; post_count?: number }[];
}

/**
 * An archive with fewer posts than this is served `noindex` (blog-category.ts
 * draws the same line, and cannot be imported from here), so it is left out of
 * the sitemap rather than offered to a crawler that will then be told not to
 * keep it. An API that predates the count is trusted.
 */
const INDEXABLE_CATEGORY_MIN_POSTS = 3;

const blogIndex = async (): Promise<BlogIndex> => {
  try {
    const response = await fetch(`${environment.apiUrl}blog/sitemap`);
    if (!response.ok) return { posts: [], categories: [] };

    const body = (await response.json()) as { data?: Partial<BlogIndex> };
    return { posts: body.data?.posts ?? [], categories: body.data?.categories ?? [] };
  } catch {
    return { posts: [], categories: [] };
  }
};

const articleEntries = async (base: string): Promise<SitemapEntry[]> => {
  const { posts, categories } = await blogIndex();

  return [
    // /blog itself belongs here rather than in the static half: it stopped
    // being prerendered when its content moved to the console, so it is no
    // longer in prerendered-routes.json. Its lastmod is the newest post on it.
    { loc: `${base}/blog`, lastmod: posts[0]?.updated_at ?? null },
    ...categories
      .filter((c) => (c.post_count ?? INDEXABLE_CATEGORY_MIN_POSTS) >= INDEXABLE_CATEGORY_MIN_POSTS)
      .map((c) => ({ loc: `${base}/blog/category/${c.slug}`, lastmod: c.updated_at })),
    ...posts.map((p) => ({ loc: `${base}/blog/${p.slug}`, lastmod: p.updated_at })),
  ];
};

const SITEMAP_TTL_MS = 60 * 60 * 1000;
let sitemapCache: { xml: string; builtAt: number } | null = null;

const buildSitemap = async (): Promise<string> => {
  const { base, pages } = staticPages();
  const entries = [...pages, ...(await articleEntries(base))];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (e) =>
        '  <url>\n' +
        `    <loc>${e.loc}</loc>\n` +
        (e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : '') +
        '  </url>',
    ),
    '</urlset>',
    '',
  ].join('\n');
};

/* Before express.static, so it wins even if a stale sitemap.xml is ever
   left in the browser folder. */
app.get('/sitemap.xml', async (_req, res, next) => {
  try {
    if (!sitemapCache || Date.now() - sitemapCache.builtAt > SITEMAP_TTL_MS) {
      sitemapCache = { xml: await buildSitemap(), builtAt: Date.now() };
    }
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(sitemapCache.xml);
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------------- rss */

/**
 * A feed of the last twenty posts. Cheap to serve, and it is how readers,
 * aggregators and several answer engines subscribe to a blog without polling
 * the index. Cached like the sitemap.
 */
const FEED_SIZE = 20;
let feedCache: { xml: string; builtAt: number } | null = null;

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

interface FeedPost {
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
}

const buildFeed = async (): Promise<string> => {
  const base = staticPages().base;
  let posts: FeedPost[] = [];

  try {
    const response = await fetch(`${environment.apiUrl}blog/posts?per_page=${FEED_SIZE}`);
    if (response.ok) {
      const body = (await response.json()) as { data?: FeedPost[] };
      posts = body.data ?? [];
    }
  } catch {
    // An empty feed is a valid feed; a 500 is not.
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `  <title>${escapeXml(environment.appName)} blog</title>`,
    `  <link>${base}/blog</link>`,
    '  <description>Notes on keeping bees with better records.</description>',
    '  <language>en</language>',
    `  <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>`,
    ...posts.flatMap((post) => [
      '  <item>',
      `    <title>${escapeXml(post.title)}</title>`,
      `    <link>${base}/blog/${post.slug}</link>`,
      `    <guid isPermaLink="true">${base}/blog/${post.slug}</guid>`,
      `    <description>${escapeXml(post.excerpt)}</description>`,
      `    <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>`,
      '  </item>',
    ]),
    '</channel>',
    '</rss>',
    '',
  ].join('\n');
};

app.get('/rss.xml', async (_req, res, next) => {
  try {
    if (!feedCache || Date.now() - feedCache.builtAt > SITEMAP_TTL_MS) {
      feedCache = { xml: await buildFeed(), builtAt: Date.now() };
    }
    res.type('application/rss+xml').set('Cache-Control', 'public, max-age=3600').send(feedCache.xml);
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------- llms.txt */

/**
 * What the product is, for answer engines, in the llms.txt convention: a
 * fixed description, then every published article with its summary — the
 * half that cannot be a static file, because posts go up between deploys.
 * Cached like the sitemap and the feed.
 */
const LLMS_TXT_HEAD = `# BeehiveMind

> Beehive management software for working beekeepers. Hive inspections are recorded by voice, offline, from the apiary; harvests, feedings, treatment schedules, weather and costs per hive live on the web dashboard. Built in Greece. Free for one apiary; Pro plan for unlimited apiaries.

BeehiveMind is one account across two clients: an Android app that records inspections and harvests by voice (works with no signal, syncs later) and a web dashboard at https://beehivemind.tech/user that turns those records into tables, charts, treatment reminders, a diagnosis per inspection and an AI assistant grounded in the beekeeper's own data.

## Product

- [Home](https://beehivemind.tech/): what BeehiveMind is and who it is for
- [Features](https://beehivemind.tech/features): inspections, treatments, harvest and feeding, finances, weather, QR labels
- [The app](https://beehivemind.tech/app): the voice-driven Android field app
- [Hive inspections](https://beehivemind.tech/inspections): the fourteen readings recorded per visit
- [Apiaries and beehives](https://beehivemind.tech/apiariesandbeehives): apiaries on a map, hives in bulk, queen records
- [Harvest and feeding](https://beehivemind.tech/harvestandfeeding): honey, pollen, propolis, royal jelly; syrup, fondant, patties
- [Financial](https://beehivemind.tech/financial): costs and income by category, cost per hive
- [Plans](https://beehivemind.tech/pricing): Free (one apiary, ten hives) and Pro (€9 a month)
- [Help](https://beehivemind.tech/help): the ten voice phrases and troubleshooting
- [About](https://beehivemind.tech/about)
- [Contact](https://beehivemind.tech/contact)

## Blog

- [Beekeeping blog](https://beehivemind.tech/blog): practical articles on inspections, treatments, records and the cost per hive
- [RSS feed](https://beehivemind.tech/rss.xml)
- [Sitemap](https://beehivemind.tech/sitemap.xml)
`;

const LLMS_TXT_TAIL = `
## Facts

- Voice commands are in English; the platform's diagnoses are available in English and Greek.
- Inspection readings: date, frames, population, pollen, honey, eggs, closed brood, varroa, American foulbrood, European foulbrood, nosema, queen seen, queen cells, queen year.
- Records are the beekeeper's and exportable on every plan.

## Contact

- info@beehivemind.tech
`;

let llmsCache: { text: string; builtAt: number } | null = null;

const buildLlmsTxt = async (): Promise<string> => {
  const base = staticPages().base;
  let posts: FeedPost[] = [];

  try {
    const response = await fetch(`${environment.apiUrl}blog/posts?per_page=100`);
    if (response.ok) {
      const body = (await response.json()) as { data?: FeedPost[] };
      posts = body.data ?? [];
    }
  } catch {
    // The description alone is still a valid file.
  }

  const articles = posts.length
    ? [
        '',
        '## Articles',
        '',
        ...posts.map((post) => `- [${post.title}](${base}/blog/${post.slug}): ${post.excerpt}`),
        '',
      ].join('\n')
    : '';

  return `${LLMS_TXT_HEAD}${articles}${LLMS_TXT_TAIL}`;
};

app.get('/llms.txt', async (_req, res, next) => {
  try {
    if (!llmsCache || Date.now() - llmsCache.builtAt > SITEMAP_TTL_MS) {
      llmsCache = { text: await buildLlmsTxt(), builtAt: Date.now() };
    }
    res.type('text/plain; charset=utf-8').set('Cache-Control', 'public, max-age=3600').send(llmsCache.text);
  } catch (error) {
    next(error);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * What is left with a file extension is a file that does not exist: the static
 * middleware above has already answered for everything the build shipped, and
 * the feeds above for theirs. Without this the request would fall through to
 * Angular, and `/blog/chunk-….js` — what a crawler that ignores `<base href>`
 * asks for — would render as a blog article, API call included. A bare 404
 * costs nothing and is what that crawler needs to hear.
 */
const FILE_LIKE_PATH =
  /\.(?:m?js|css|map|json|xml|txt|ico|png|jpe?g|gif|webp|avif|svg|woff2?|ttf|otf|eot|pdf|zip|gz|br|html?|php|aspx?|env|sql|bak|ya?ml|md|webmanifest)$/i;

app.use((req, res, next) => {
  if (FILE_LIKE_PATH.test(req.path)) {
    res.status(404).type('text/plain').set('Cache-Control', 'no-store').send('Not found');
    return;
  }
  next();
});

/**
 * A page that only discovers while rendering how its request went says so with
 * this meta tag, because `ServerRoute.status` is fixed per route and cannot
 * tell a real blog slug from an invented one — nor either of those from a slug
 * the API failed to answer for.
 *
 * `404` the record is gone; drop it from the index.
 * `503` the lookup failed; come back later and change nothing.
 *
 * See `SeoService.markNotFound()` and `markUnavailable()`.
 */
const RENDER_STATUS_MARKER = /<meta\s+name="x-render-status"\s+content="(404|503)"/;

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then(async (response) => {
      if (!response) {
        return next();
      }

      const isHtml = (response.headers.get('content-type') ?? '').includes('text/html');
      if (isHtml) {
        const body = await response.text();
        // Only a 200 can be demoted; a route that already declared its status
        // (the catch-all 404, the /pages/contact-us 301) keeps it.
        const marked = response.status === 200 ? RENDER_STATUS_MARKER.exec(body) : null;
        const status = marked ? Number(marked[1]) : response.status;
        const headers = new Headers(response.headers);
        if (status === 503) {
          // Without this a crawler decides for itself when to come back. Two
          // minutes is longer than a restart and shorter than a recrawl cycle.
          headers.set('Retry-After', '120');
        }
        // Rendered HTML carried no Cache-Control at all, which leaves caches to
        // guess — and a wrong guess serves a stale page. Five minutes is short
        // enough that a deploy propagates on its own, long enough to be worth a
        // CDN. Set here rather than in nginx, where a location-level add_header
        // would also overwrite the year-long cache on the static assets.
        headers.set(
          'Cache-Control',
          status === 200 ? 'public, max-age=300, must-revalidate' : 'no-store',
        );
        return writeResponseToNodeResponse(new Response(body, { status, headers }), res);
      }

      return writeResponseToNodeResponse(response, res);
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
