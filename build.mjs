#!/usr/bin/env node
// Builds the Floreon wiki: content/**/*.md (+ _section.json per folder) -> dist/ (static HTML, no runtime dependencies).
// WIKI_BASE sets the URL prefix (default "/"); WIKI_DRAFT=1 also builds pages marked "draft: true" (local preview only).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderMarkdown } from './lib/markdown.mjs';
import { esc, idMaker, parseFrontMatter, stripTags } from './lib/util.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const site = JSON.parse(fs.readFileSync(path.join(root, 'site.json'), 'utf8'));
const BASE = (process.env.WIKI_BASE || '/').replace(/\/?$/, '/');
const DRAFTS = process.env.WIKI_DRAFT === '1';
const contentDir = path.join(root, 'content');
const dist = path.join(root, 'dist');
const errors = [];
const skipped = new Set(); // draft pages left out of this build; links to them are dropped, not broken

const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; } };
const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);

// ------------------------------------------------------------ read the content tree
function readDir(dir, rel) {
  const meta = readJson(path.join(dir, '_section.json'));
  const node = { kind: 'section', rel, title: meta.title || rel.split('/').pop() || site.title, order: meta.order ?? 100, pages: [], sections: [], landing: null };
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      const sub = readDir(full, rel ? `${rel}/${name}` : name);
      if (sub.landing || sub.pages.length || sub.sections.length) node.sections.push(sub);
    } else if (name.endsWith('.md')) {
      const { data, body } = parseFrontMatter(fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n'));
      if (data.draft === 'true' && !DRAFTS) { skipped.add(path.relative(contentDir, full).replace(/\\/g, '/')); continue; }
      const slug = name === 'index.md' ? rel : rel ? `${rel}/${name.slice(0, -3)}` : name.slice(0, -3);
      if (!data.title) errors.push(`${path.relative(root, full)}: missing "title" in the front matter`);
      const page = { file: full, srcRel: path.relative(contentDir, full).replace(/\\/g, '/'), slug, title: data.title || slug, description: data.description || '', order: Number(data.order ?? 100), body, draft: data.draft === 'true' };
      if (name === 'index.md') node.landing = page; else node.pages.push(page);
    }
  }
  node.pages.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  node.sections.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return node;
}
const tree = readDir(contentDir, '');
if (tree.landing) tree.landing.title = tree.landing.title || site.title;

const urlOf = (page) => BASE + (page.slug ? page.slug + '/' : '');
const pages = [];
const bySrc = new Map();
(function walk(n) {
  if (n.landing) pages.push(n.landing);
  pages.push(...n.pages);
  n.sections.forEach(walk);
})(tree);
// reading order: home, loose pages, then each section (its landing first)
const ordered = [];
(function walk(n, top) {
  if (n.landing) ordered.push(n.landing);
  ordered.push(...n.pages);
  n.sections.forEach((s) => walk(s, false));
})(tree, true);
for (const p of pages) bySrc.set(p.srcRel, p);

// ------------------------------------------------------------ links and images
const assetDirs = [path.join(root, 'public')];
function makeContext(page) {
  return {
    uid: idMaker(),
    includePrivate: false,
    generate: () => ({ parts: [] }),
    resolveLink(href) {
      if (/^(https?:|mailto:)/i.test(href)) return { href, external: true };
      if (href.startsWith('#')) return { href };
      if (href.startsWith('/')) return { href: BASE + href.slice(1) };
      const [file, anchor] = href.split('#');
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(page.srcRel), file));
      const t = bySrc.get(target);
      if (!t && skipped.has(target)) return { href: null };
      if (!t) { errors.push(`${page.srcRel}: broken link "${href}"`); return { href: BASE }; }
      return { href: urlOf(t) + (anchor ? '#' + anchor : '') };
    },
    resolveAsset(src) {
      if (/^https:/i.test(src)) return src;
      const clean = src.replace(/^\/+/, '');
      if (!fs.existsSync(path.join(root, 'public', clean))) errors.push(`${page.srcRel}: missing image "${src}" (put it in public/)`);
      return BASE + clean;
    },
  };
}

// ------------------------------------------------------------ render pages
const searchIndex = [];
for (const p of pages) {
  const r = renderMarkdown(p.body, makeContext(p));
  p.html = r.html;
  p.headings = r.headings.filter((h) => h.level === 2);
  for (const s of r.sections) searchIndex.push({ u: urlOf(p) + (s.id ? '#' + s.id : ''), t: p.title, h: s.heading, x: s.text.slice(0, 3000) });
  if (!p.description) p.description = stripTags(r.html).replace(/\s+/g, ' ').slice(0, 155);
}

// ------------------------------------------------------------ templates
const ICON = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
};
const icon = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
const LOGO = `<img class="logo" src="${BASE}logo.webp" width="210" height="86" alt="Floreon">`;

function navHtml(current) {
  const link = (p, label) => `<a href="${urlOf(p)}"${p === current ? ' aria-current="page"' : ''}>${esc(label || p.title)}</a>`;
  const section = (s) => {
    const has = (n) => n.landing === current || n.pages.includes(current) || n.sections.some(has);
    const open = has(s);
    const head = s.landing ? link(s.landing, s.title) : `<span>${esc(s.title)}</span>`;
    const items = [...s.pages.map((p) => `<li>${link(p)}</li>`), ...s.sections.map((x) => `<li>${section(x)}</li>`)].join('');
    return `<details class="grp"${open ? ' open' : ''}><summary>${head}<span class="chev">${icon('chevron', 16)}</span></summary><ul>${items}</ul></details>`;
  };
  const loose = [tree.landing, ...tree.pages].filter(Boolean).map((p) => `<li>${link(p, p === tree.landing ? 'Home' : p.title)}</li>`).join('');
  return `<ul class="top">${loose}${tree.sections.map((s) => `<li>${section(s)}</li>`).join('')}</ul>`;
}

const themeScript = `try{var t=localStorage.getItem('floreon-wiki-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}`;
const css = fs.readFileSync(path.join(root, 'theme/style.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'theme/app.js'), 'utf8');
const ver = { css: hash(css), js: hash(js) };

function pageHtml(p) {
  const i = ordered.indexOf(p);
  const prev = i > 0 ? ordered[i - 1] : undefined, next = i >= 0 ? ordered[i + 1] : undefined;
  const toc = p.headings.length > 1 ? `<nav class="toc" aria-label="On this page"><p>On this page</p><ul>${p.headings.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ul></nav>` : '';
  const pn = (prev || next) ? `<nav class="pn" aria-label="Previous and next page">${prev ? `<a class="prev" href="${urlOf(prev)}">${icon('left')}<span><small>Previous</small>${esc(prev.title)}</span></a>` : '<span></span>'}${next ? `<a class="next" href="${urlOf(next)}"><span><small>Next</small>${esc(next.title)}</span>${icon('right')}</a>` : ''}</nav>` : '';
  const title = p === tree.landing ? `${site.title}` : `${p.title} | ${site.title}`;
  return `<!doctype html>
<html lang="en" data-base="${BASE}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${BASE}icon-48.png" type="image/png" sizes="48x48">
<link rel="apple-touch-icon" href="${BASE}icon-180.png">
<meta name="darkreader-lock">
<script>${themeScript}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@400;600;700&display=swap">
<link rel="stylesheet" href="${BASE}assets/style.css?v=${ver.css}">
</head>
<body>
<a class="skip" href="#page">Skip to content</a>
<aside class="side" id="side">
  <a class="brand" href="${BASE}">${LOGO}<span class="wikitag">Wiki</span></a>
  <button class="searchbtn" type="button" data-search-open>${icon('search')}<span>Search</span><kbd>/</kbd></button>
  <nav aria-label="Wiki pages">${navHtml(p)}</nav>
  <div class="side-foot">
    <a href="${site.mainSite}">floreon.garden</a>
    <button type="button" class="themebtn" data-theme-toggle aria-label="Switch theme"><span class="i-sun">${icon('sun')}</span><span class="i-moon">${icon('moon')}</span></button>
  </div>
</aside>
<header class="topbar"><button type="button" class="menubtn" data-menu aria-label="Open menu" aria-expanded="false" aria-controls="side">${icon('menu', 22)}</button><a class="brand" href="${BASE}">${LOGO}<span class="wikitag">Wiki</span></a><button class="searchbtn mini" type="button" data-search-open aria-label="Search">${icon('search', 20)}</button></header>
<div class="scrim" data-scrim></div>
<main id="page">
  <article class="doc">
    <h1>${esc(p.title)}</h1>
    ${p.html}
    ${pn}
  </article>
  ${toc}
</main>
<div class="search" id="search" hidden role="dialog" aria-modal="true" aria-label="Search the wiki">
  <div class="search-box"><input type="search" id="q" placeholder="Search the wiki..." autocomplete="off" aria-label="Search"><ul id="results" aria-live="polite"></ul></div>
</div>
<script src="${BASE}assets/app.js?v=${ver.js}" defer></script>
</body>
</html>
`;
}

// ------------------------------------------------------------ write
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
fs.cpSync(path.join(root, 'public'), dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'assets/style.css'), css);
fs.writeFileSync(path.join(dist, 'assets/app.js'), js);
fs.writeFileSync(path.join(dist, 'assets/search.json'), JSON.stringify(searchIndex));
for (const p of pages) {
  const out = path.join(dist, p.slug, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, pageHtml(p));
}
const notFound = { slug: '', title: 'Page not found', description: 'This page does not exist.', html: `<p>That page does not exist or has moved. Try the search, or go back to the <a href="${BASE}">start page</a>.</p>`, headings: [] };
fs.writeFileSync(path.join(dist, '404.html'), pageHtml(notFound));

if (errors.length) {
  console.error('\nBuild problems:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log(`Built ${pages.length} pages into dist/ (base ${BASE}${DRAFTS ? ', drafts included' : ''})`);
