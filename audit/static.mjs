/* Minimal static server for the design-system handoff folder, so the React
   ui_kits can fetch their .jsx sources (file:// blocks fetch). */
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const ROOT = process.argv[2];
const PORT = Number(process.argv[3] || 4302);
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jsx': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.otf': 'font/otf', '.woff2': 'font/woff2', '.md': 'text/plain' };

http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = normalize(join(ROOT, url));
  if (!file.startsWith(normalize(ROOT))) { res.writeHead(403); return res.end(); }
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    statSync(file);
  } catch { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('serving', ROOT, 'on', PORT));
