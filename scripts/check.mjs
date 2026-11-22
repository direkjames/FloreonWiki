#!/usr/bin/env node
// Checks the built site in dist/: internal links and anchors resolve, images have alt text, every page has one h1 and a title.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const base = (process.env.WIKI_BASE || '/').replace(/\/?$/, '/');
const problems = [];
const files = [];
(function walk(d) { for (const n of fs.readdirSync(d)) { const f = path.join(d, n); fs.statSync(f).isDirectory() ? walk(f) : f.endsWith('.html') && files.push(f); } })(dist);
const ids = new Map();
const html = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));
for (const [f, h] of html) ids.set(f, new Set([...h.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])));
const target = (url) => {
  const p = decodeURIComponent(url.slice(base.length));
  const f = path.join(dist, p);
  return fs.existsSync(f) && fs.statSync(f).isDirectory() ? path.join(f, 'index.html') : f;
};
for (const [f, h] of html) {
  const rel = path.relative(dist, f);
  if (rel === '404.html') continue;
  if ((h.match(/<h1[ >]/g) || []).length !== 1) problems.push(`${rel}: needs exactly one h1`);
  for (const m of h.matchAll(/<img [^>]*>/g)) if (!/ alt="[^"]+"/.test(m[0])) problems.push(`${rel}: image without alt text`);
  for (const m of h.matchAll(/ href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:)/.test(href) || !href.startsWith(base) && !href.startsWith('#')) continue;
    const [u0, anchor] = href.split('#'); const u = u0.split('?')[0];
    const t = u ? target(u) : f;
    if (!fs.existsSync(t)) { problems.push(`${rel}: broken link ${href}`); continue; }
    if (anchor && t.endsWith('.html') && !ids.get(t)?.has(anchor)) problems.push(`${rel}: missing anchor ${href}`);
  }
}
if (problems.length) { console.error('Check failed:\n  ' + problems.join('\n  ')); process.exit(1); }
console.log(`Checked ${files.length} pages: links, anchors, headings and image text are fine.`);
