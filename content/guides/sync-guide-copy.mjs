import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FILL } from './fill-voices.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, '3-guide-copy.csv');
const outJs = path.join(__dirname, '../../src/data/guideCopy.generated.js');

const PERSONAS = ['mentor', 'catalyst', 'challenger', 'bestFriend', 'mother', 'roaster'];
const PERSONA_COLS = PERSONAS.map((p) => `${p}_text`);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell.replace(/\r$/, ''));
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ''));
    if (row.some((c) => c !== '')) rows.push(row);
  }
  return rows;
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const raw = fs.readFileSync(csvPath, 'utf8');
const table = parseCsv(raw);
const headers = table[0];
const col = Object.fromEntries(headers.map((h, i) => [h, i]));

const steps = {};
const outRows = [headers];

for (const cells of table.slice(1)) {
  const next = [...cells];
  while (next.length < headers.length) next.push('');
  const routeKey = String(next[col.routeKey] || '').trim();
  const stepKey = String(next[col.stepKey] || 'default').trim() || 'default';
  const fill = FILL[`${routeKey}::${stepKey}`] || {};
  const pose = String(next[col.suggestedPose] || 'idle').trim() || 'idle';
  const title = String(next[col.pageLabel] || routeKey).trim();

  const entry = { title, pose };
  for (const persona of PERSONAS) {
    const idx = col[`${persona}_text`];
    let text = String(next[idx] || '').trim();
    if (!text && fill[persona]) {
      text = String(fill[persona]).trim();
      next[idx] = text;
    }
    if (text) entry[persona] = { text, pose };
  }
  steps[`${routeKey}::${stepKey}`] = entry;
  outRows.push(next);
}

fs.writeFileSync(
  csvPath,
  `${outRows.map((r) => r.map(csvEscape).join(',')).join('\n')}\n`,
  'utf8',
);

const js = `// Generated from content/guides/3-guide-copy.csv — do not edit by hand.
// Reimport: node content/guides/sync-guide-copy.mjs

export const GUIDE_STEPS = ${JSON.stringify(steps, null, 2)};
`;
fs.writeFileSync(outJs, js, 'utf8');

const filled = Object.values(FILL).length;
console.log(`Synced ${Object.keys(steps).length} steps (${filled} fill keys). Wrote CSV + src/data/guideCopy.generated.js`);
