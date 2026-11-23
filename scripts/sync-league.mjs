#!/usr/bin/env node
// Writes content/pokemon-league/regions/*.md from the dkLeague mod's data, so levels, requirements and rewards never drift.
// Run it after changing the league (node scripts/sync-league.mjs), then commit the generated pages.
// Needs the dkLeague project and the Cobblemon jar (trainer types are worked out from each team's species).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DK = process.env.DKLEAGUE || 'E:/Programming/Minecraft Mods/dkLeague';
const JAR = process.env.COBBLEMON_JAR || 'E:/Floreon/_SEASON 3/Cobblemon/Cobblemon-fabric-1.7.3+1.21.1.jar';
const league = JSON.parse(fs.readFileSync(`${DK}/src/main/resources/data/dkleague/league.json`, 'utf8'));
const trainerDir = `${DK}/src/main/resources/data/rctmod/trainers`;

// species data, for the trainer types
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cobbl-')).split('\\').join('/');
cp.execSync(`unzip -qo "${JAR}" "data/cobblemon/species/generation*/*.json" -d "${tmp}"`, { maxBuffer: 1 << 28 });
const species = {};
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f); else if (f.endsWith('.json')) species[path.basename(f, '.json')] = JSON.parse(fs.readFileSync(f, 'utf8'));
  }
})(tmp + '/data/cobblemon/species');
fs.rmSync(tmp, { recursive: true, force: true });

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const SIZE = { xs: 'XS', s: 'Small', m: 'Medium', l: 'Large', xl: 'XL' };
const pretty = (id) => id.split(':').pop().replace(/^exp_candy_(xs|s|m|l|xl)$/, (_, z) => `exp_candy_${SIZE[z]}`).split('_').map(cap).join(' ').replace('Exp Candy', 'Exp. Candy');

function typeOf(trainerId) {
  const team = JSON.parse(fs.readFileSync(`${trainerDir}/${trainerId}.json`, 'utf8')).team;
  const count = {};
  for (const m of team) {
    let s = species[m.species];
    if (!s) continue;
    let types = [s.primaryType, s.secondaryType];
    if (m.aspects?.length) {
      const form = (s.forms || []).find((f) => (f.aspects || []).some((a) => m.aspects.includes(a)));
      if (form) types = [form.primaryType ?? s.primaryType, form.secondaryType];
    }
    for (const t of new Set(types.filter(Boolean))) count[t] = (count[t] || 0) + 1;
  }
  const top = Object.entries(count).filter(([, n]) => n / team.length >= 0.5).sort((a, b) => b[1] - a[1]).map(([t]) => cap(t));
  return top.length ? top.slice(0, 2).join(' / ') : 'Mixed';
}

const names = new Map();
for (const r of league.regions) for (const t of r.trainers) names.set(t.id, t.name);

const outDir = path.join(root, 'content/pokemon-league/regions');
fs.mkdirSync(outDir, { recursive: true });
let n = 0;
league.regions.forEach((r, idx) => {
  let gymNo = 0;
  const rows = r.trainers.map((t) => {
    let role;
    if (t.kind === 'gym') { gymNo++; role = r.id === 'alola' ? (gymNo % 2 ? 'Captain' : 'Kahuna') : 'Gym leader'; }
    else if (t.kind === 'e4') role = 'Elite Four';
    else role = 'Champion';
    const needs = t.requires.length ? t.requires.map((id) => names.get(id) || id).join(', ') : 'Nothing';
    const rewards = [`${t.cd.toLocaleString('en-US')} CobbleDollars`];
    if (t.badge) rewards.push(pretty(t.badge));
    for (const [item, count] of t.items) rewards.push(count > 1 ? `${count} ${pretty(item)}` : pretty(item));
    for (const e of t.extras || []) rewards.push(e.label);
    return `| ${t.name} | ${role} | ${typeOf(t.id)} | ${t.level} | ${needs} | ${rewards.join(', ')} |`;
  });
  const levels = r.trainers.map((t) => t.level);
  const first = r.trainers[0].level, last = Math.max(...levels);
  const champ = r.trainers.at(-1);
  const next = r.nextWarp ? league.regions.find((x) => x.id === r.nextWarp) : null;
  const lines = [
    '---',
    `title: ${r.name} League`,
    `description: Every trainer in the ${r.name} League of the Floreon Pokémon League, with levels, requirements and rewards.`,
    `order: ${(idx + 1) * 10}`,
    'generated: true',
    '---',
    `The ${r.name} League has ${r.trainers.length} trainers, from level ${first} to level ${last}. Beat them in order: each trainer needs the ones listed before they open up.`,
    '',
    '| Trainer | Role | Type | Level | Needs first | Rewards |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
    '> [!NOTE] Rewards come once',
    '> Every reward is given once per player, the first time you win. Rematches give nothing.',
    '',
    '## After the Champion',
    '',
    `Beating ${champ.name} completes the ${r.name} League and gives you the ${r.name} Champion tag.` + (next ? ` It also unlocks the ${next.name} warp and starts the ${next.name} League, with a fresh level cap.` : ' This is the last region, so you have finished the whole Floreon Pokémon League.'),
    '',
  ];
  fs.writeFileSync(path.join(outDir, `${r.id}.md`), lines.join('\n'));
  n++;
});
console.log(`Wrote ${n} region pages to content/pokemon-league/regions/`);
