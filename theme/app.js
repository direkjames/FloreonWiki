/* Floreon wiki: theme switch, mobile menu, search and copy-on-click. No dependencies; the pages read fine if this fails to load. */
(() => {
  'use strict';
  const root = document.documentElement;
  const base = root.dataset.base || '/';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  // theme
  $$('[data-theme-toggle]').forEach((b) => b.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('floreon-wiki-theme', next); } catch (e) { /* private mode: only for this visit */ }
  }));

  // mobile menu
  const side = $('#side'), scrim = $('[data-scrim]'), menuBtn = $('[data-menu]');
  const setMenu = (open) => { side.classList.toggle('open', open); scrim.classList.toggle('show', open); menuBtn?.setAttribute('aria-expanded', String(open)); };
  menuBtn?.addEventListener('click', () => setMenu(!side.classList.contains('open')));
  scrim?.addEventListener('click', () => setMenu(false));

  // toast + copy
  const toast = document.createElement('div');
  toast.id = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  let tt;
  const say = (m) => { toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 1500); };
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); say('Copied'); } catch (e) { say('Could not copy'); } };
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-copy]');
    if (c) copy(c.textContent);
    const b = e.target.closest('[data-copy-code]');
    if (b) copy(b.closest('figure').querySelector('pre').textContent);
  });

  // search
  const box = $('#search'), q = $('#q'), list = $('#results');
  let index = null, sel = -1;
  const load = async () => {
    if (index) return;
    try { index = await (await fetch(base + 'assets/search.json')).json(); } catch (e) { index = []; }
  };
  const open = async () => { box.hidden = false; q.value = ''; list.innerHTML = ''; q.focus(); await load(); if (q.value) q.dispatchEvent(new Event('input')); };
  const close = () => { box.hidden = true; };
  $$('[data-search-open]').forEach((b) => b.addEventListener('click', open));
  box?.addEventListener('click', (e) => { if (e.target === box) close(); });
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const score = (item, words) => {
    const t = (item.t + ' ' + item.h).toLowerCase(), x = item.x.toLowerCase();
    let s = 0;
    for (const w of words) {
      if (t.includes(w)) s += 5; else if (x.includes(w)) s += 1; else return 0;
    }
    return s;
  };
  q?.addEventListener('input', () => {
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    sel = -1;
    if (!words.length || !index) { list.innerHTML = ''; return; }
    const hits = index.map((i) => [score(i, words), i]).filter((h) => h[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, 8);
    list.innerHTML = hits.length
      ? hits.map(([, i]) => `<li><a href="${esc(i.u)}"><b>${esc(i.h && i.h !== i.t ? i.t + ': ' + i.h : i.t)}</b><span>${esc(i.x.slice(0, 110))}</span></a></li>`).join('')
      : '<li class="none">Nothing found. Try fewer or different words.</li>';
  });
  q?.addEventListener('keydown', (e) => {
    const links = $$('a', list);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % (links.length || 1);
      links.forEach((l, i) => l.classList.toggle('sel', i === sel));
    } else if (e.key === 'Enter' && links.length) { location.href = (links[Math.max(sel, 0)]).href; }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); setMenu(false); }
    else if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) { e.preventDefault(); open(); }
  });

  // highlight the section being read in "On this page"
  const tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { tocLinks.forEach((a) => a.classList.remove('on')); map.get(en.target.id)?.classList.add('on'); }
    }, { rootMargin: '-10% 0px -80% 0px' });
    map.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
  }
})();
