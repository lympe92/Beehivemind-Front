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
  categories: { slug: string; updated_at: string }[];
}

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
    ...categories.map((c) => ({ loc: `${base}/blog/category/${c.slug}`, lastmod: c.updated_at })),
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

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

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
