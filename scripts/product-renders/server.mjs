// Serves the product renderer and saves the PNGs it posts. Local, temporary tool.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(root, 'out');
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/save') {
    const name = url.searchParams.get('name').replace(/[^a-z0-9-]/g, '');
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      fs.writeFileSync(path.join(out, `${name}.png`), Buffer.concat(chunks));
      res.end('ok');
    });
    return;
  }
  const file = url.pathname === '/' ? '/render.html' : url.pathname;
  const full = path.join(root, file);
  if (!full.startsWith(root) || !fs.existsSync(full)) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', types[path.extname(full)] ?? 'application/octet-stream');
  res.end(fs.readFileSync(full));
}).listen(8093, () => console.log('render server on 8093'));
