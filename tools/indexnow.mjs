/* Tells Bing — and every other IndexNow engine: Yandex, Seznam, Naver — which
   URLs changed, straight after a deploy. Google ignores IndexNow and reads the
   sitemap instead; Bing matters because it is what ChatGPT search and Copilot
   answer from, and without a ping a site this new waits weeks for a crawl.

   The key is not a secret. The protocol publishes it at /<key>.txt so an
   engine can check that whoever pings for beehivemind.tech controls the host.
   Run by deploy.yml after the restart; by hand: node tools/indexnow.mjs */

const HOST = 'beehivemind.tech';
const KEY = 'ac998c067e17b4a3156d9cca9ed5b8b6';

const sitemapUrl = process.argv[2] ?? `https://${HOST}/sitemap.xml`;
const xml = await (await fetch(sitemapUrl)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (!urls.length) {
  console.error(`indexnow: no URLs in ${sitemapUrl}`);
  process.exit(1);
}

const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  }),
});

// 200 = accepted, 202 = accepted while the key is verified; both are done.
// 4xx = the key file is not being served, or the key does not match it.
console.log(`indexnow: ${urls.length} URLs -> HTTP ${res.status}`);
if (res.status >= 400) process.exit(1);
