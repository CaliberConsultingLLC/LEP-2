// Where each owl's head actually is, measured rather than guessed.
//
// Every bubble in the product used to be placed by a table of hand-picked
// offsets — "0.62 out, 0.72 up" — which assumed the bird sits in the same
// place inside every PNG. It does not. Across the 42 portraits the top of the
// head ranges from 1% to 14% of the image box, and the head's horizontal
// centre from 28% to 66%. On a 580px owl that is a 76px vertical and a 216px
// horizontal swing, which is why a bubble tuned on one pose lands on another
// one's face.
//
// So the anchor is read off the art. This walks every file, decodes the alpha
// channel, and writes out three things per image as fractions of the (square)
// image box:
//
//   box   the opaque bounding box — where the bird is, ignoring the padding
//   face  the head box the bubble must never cover
//   speak the point a tail should aim at, just inside the top of the head
//
// Fractions, not pixels, so the same numbers hold at every rendered size. The
// consumer flips x for a mirrored owl; nothing here knows about mirroring.
//
//   node scripts/build-guide-anchors.mjs           write the generated module
//   node scripts/build-guide-anchors.mjs --sheet   also write a contact sheet
//
// The contact sheet draws every computed box back over its portrait, which is
// the only honest way to check a measurement like this: you look at all 42 at
// once and see whether the boxes are on the heads.

import { createRequire } from 'node:module';
import { inflateSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART_DIR = path.join(ROOT, 'public', 'Guide Images');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'guideAnchors.generated.js');
const SHEET_FILE = path.join(ROOT, 'reports', 'guide-anchors-sheet.html');

// Anything below this is padding, not bird. The art is cut out against
// transparency, so the edges carry a soft halo; 24 keeps the halo out of the
// bounding box without eating the feather tips.
const ALPHA_FLOOR = 24;

// ── PNG → alpha grid ────────────────────────────────────────────────────────
// Every guide portrait is 8-bit RGBA, non-interlaced (colour type 6), so this
// handles that one case and refuses anything else rather than quietly
// returning a wrong answer.
function decodeAlpha(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file}: not a PNG`);

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  const interlace = buf[28];
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(`${file}: expected 8-bit RGBA non-interlaced, got depth ${bitDepth} type ${colorType} interlace ${interlace}`);
  }

  // Collect every IDAT chunk — large PNGs split the stream across several.
  const parts = [];
  let at = 8;
  while (at < buf.length) {
    const len = buf.readUInt32BE(at);
    const type = buf.toString('ascii', at + 4, at + 8);
    if (type === 'IDAT') parts.push(buf.subarray(at + 8, at + 8 + len));
    if (type === 'IEND') break;
    at += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(parts));

  // Undo the per-scanline filters. bpp is 4 for RGBA8.
  const bpp = 4;
  const stride = width * bpp;
  const out = Buffer.allocUnsafe(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    const up = dst - stride;
    for (let i = 0; i < stride; i += 1) {
      const x = raw[src + i];
      const a = i >= bpp ? out[dst + i - bpp] : 0;
      const b = y > 0 ? out[up + i] : 0;
      const c = y > 0 && i >= bpp ? out[up + i - bpp] : 0;
      let v;
      switch (filter) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error(`${file}: bad filter ${filter} on row ${y}`);
      }
      out[dst + i] = v & 0xff;
    }
  }

  // Alpha only — one byte per pixel, which is all the geometry needs.
  const alpha = new Uint8Array(width * height);
  for (let i = 0, p = 3; i < alpha.length; i += 1, p += bpp) alpha[i] = out[p];
  return { width, height, alpha };
}

// ── geometry ────────────────────────────────────────────────────────────────

// The widest unbroken opaque run on a row. Reading the row's min and max
// instead would let an outstretched wing or a held lantern drag the head's
// centre sideways, which is how the old fractions ended up pointing at a
// shoulder.
function widestRun(alpha, width, y) {
  let best = null;
  let start = -1;
  for (let x = 0; x <= width; x += 1) {
    const solid = x < width && alpha[y * width + x] > ALPHA_FLOOR;
    if (solid && start < 0) start = x;
    if (!solid && start >= 0) {
      if (!best || x - start > best[1] - best[0]) best = [start, x - 1];
      start = -1;
    }
  }
  return best;
}

function measure(file) {
  const { width, height, alpha } = decodeAlpha(file);

  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alpha[y * width + x] > ALPHA_FLOOR) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error(`${file}: fully transparent`);

  const bodyH = y1 - y0 + 1;

  // The head is the top quarter of the bird. Sampling a band rather than one
  // row keeps a single stray row of ear-tuft from deciding the centre.
  const bandTop = y0;
  const bandBottom = Math.min(y1, y0 + Math.round(bodyH * 0.26));
  const runs = [];
  for (let y = bandTop; y <= bandBottom; y += 1) {
    const run = widestRun(alpha, width, y);
    if (run) runs.push(run);
  }

  // On the wings-spread poses a raised wing meets the head at head height, so
  // the widest run swallows both and the face box grows out to the wingtips.
  // The head is the narrow thing in this band: take the median run width and
  // drop the rows that are half again wider than it, which is the wing rows
  // and nothing else.
  let hx0 = width;
  let hx1 = -1;
  if (runs.length) {
    const widths = runs.map((r) => r[1] - r[0]).sort((a, b) => a - b);
    const median = widths[widths.length >> 1];
    const cap = median * 1.55;
    for (const r of runs) {
      if (r[1] - r[0] > cap) continue;
      if (r[0] < hx0) hx0 = r[0];
      if (r[1] > hx1) hx1 = r[1];
    }
  }
  if (hx1 < 0) { hx0 = x0; hx1 = x1; }

  // The tail aims a little inside the top of the head rather than at the very
  // crown: pointing at the outline leaves the tail hanging in the halo, and
  // pointing at the middle of the face buries it.
  const speakX = (hx0 + hx1) / 2;
  const speakY = bandTop + bodyH * 0.06;

  const f = (v, d) => Math.round((v / d) * 1000) / 1000;
  return {
    native: width,
    box: [f(x0, width), f(y0, height), f(x1 + 1, width), f(y1 + 1, height)],
    face: [f(hx0, width), f(bandTop, height), f(hx1 + 1, width), f(bandBottom + 1, height)],
    speak: [f(speakX, width), f(speakY, height)],
  };
}

// ── run ─────────────────────────────────────────────────────────────────────

const files = fs.readdirSync(ART_DIR).filter((f) => f.toLowerCase().endsWith('.png')).sort();
const anchors = {};
const rows = [];
for (const file of files) {
  const key = path.basename(file, path.extname(file));
  const m = measure(path.join(ART_DIR, file));
  anchors[key] = { box: m.box, face: m.face, speak: m.speak };
  rows.push({ key, file, ...m });
}

// The art is meant to be one set. Anything rendered above its native size is
// upscaled on screen, so it is worth saying out loud rather than discovering
// it as "that guide looks soft".
const sizes = [...new Set(rows.map((r) => r.native))].sort((a, b) => b - a);
const largest = sizes[0];
const undersized = rows.filter((r) => r.native < largest);

const banner = `// GENERATED by scripts/build-guide-anchors.mjs — do not edit by hand.
//
// Where the bird is inside each square portrait, as fractions of the image
// box, so the same numbers hold at every rendered size.
//
//   box    opaque bounding box [x0, y0, x1, y1] — the bird without its padding
//   face   the head box a bubble must never cover
//   speak  the point a speech tail aims at, just inside the top of the head
//
// A mirrored owl (transform: scaleX(-1)) flips x at the point of use; nothing
// in this file knows about mirroring.
//
// Measured from ${rows.length} files in public/Guide Images.
`;

const body = Object.entries(anchors)
  .map(([k, v]) => `  '${k}': { box: [${v.box.join(', ')}], face: [${v.face.join(', ')}], speak: [${v.speak.join(', ')}] },`)
  .join('\n');

const module = `${banner}
export const GUIDE_ANCHORS = {
${body}
};

// The fallback is the average of the set. It is only reached if a pose is
// asked for that has no art, in which case a roughly-right anchor beats a
// crash.
export const DEFAULT_ANCHOR = { box: [0.07, 0.05, 0.94, 0.96], face: [0.33, 0.05, 0.66, 0.3], speak: [0.5, 0.11] };

export function getGuideAnchor(src) {
  if (!src) return DEFAULT_ANCHOR;
  const name = decodeURIComponent(String(src)).split('/').pop().replace(/\\.[a-z]+$/i, '');
  return GUIDE_ANCHORS[name] || DEFAULT_ANCHOR;
}
`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, module, 'utf8');

console.log(`guide anchors: ${rows.length} portraits → ${path.relative(ROOT, OUT_FILE)}`);
const tops = rows.map((r) => r.face[1]);
const cxs = rows.map((r) => (r.speak[0]));
const rng = (a) => `${Math.min(...a).toFixed(3)} – ${Math.max(...a).toFixed(3)}`;
console.log(`  head top   ${rng(tops)}  (spread ${(Math.max(...tops) - Math.min(...tops)).toFixed(3)} of the box)`);
console.log(`  head centre ${rng(cxs)}  (spread ${(Math.max(...cxs) - Math.min(...cxs)).toFixed(3)} of the box)`);
if (undersized.length) {
  console.log(`  ! ${undersized.length} portraits are below the set's ${largest}px native size and will upscale on screen:`);
  for (const r of undersized) console.log(`      ${r.key} — ${r.native}px`);
}

if (process.argv.includes('--sheet')) {
  const cells = rows.map((r) => {
    const pct = (v) => `${(v * 100).toFixed(2)}%`;
    return `<figure>
      <div class="art">
        <img src="../public/Guide Images/${encodeURIComponent(r.file)}" alt="${r.key}">
        <b class="box" style="left:${pct(r.box[0])};top:${pct(r.box[1])};width:${pct(r.box[2] - r.box[0])};height:${pct(r.box[3] - r.box[1])}"></b>
        <b class="face" style="left:${pct(r.face[0])};top:${pct(r.face[1])};width:${pct(r.face[2] - r.face[0])};height:${pct(r.face[3] - r.face[1])}"></b>
        <b class="speak" style="left:${pct(r.speak[0])};top:${pct(r.speak[1])}"></b>
      </div>
      <figcaption>${r.key} <span>${r.native}px</span></figcaption>
    </figure>`;
  }).join('\n');

  const sheet = `<!doctype html><meta charset="utf-8"><title>Guide anchors</title>
<style>
 body{margin:0;background:#10223C;color:#F4ECDD;font:13px/1.5 "Manrope",system-ui,sans-serif;padding:24px}
 h1{font:500 26px/1.1 Georgia,serif;margin:0 0 4px}
 p{color:#8FB3CD;margin:0 0 22px}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:18px}
 figure{margin:0}
 .art{position:relative;background:#162A44;border-radius:8px;overflow:hidden;aspect-ratio:1}
 .art img{width:100%;height:100%;display:block}
 b{position:absolute;display:block}
 .box{border:1px dashed rgba(244,206,161,.45)}
 .face{border:2px solid #E07A3F;background:rgba(224,122,63,.16)}
 .speak{width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:#ECC94B;box-shadow:0 0 0 2px #10223C}
 figcaption{font:700 11px/1.6 "JetBrains Mono",monospace;letter-spacing:.06em;margin-top:6px}
 figcaption span{color:#8FB3CD;font-weight:400}
</style>
<h1>Guide anchors</h1>
<p>Dashed = opaque bounds · orange = face box the bubble must clear · dot = where the tail points.</p>
<div class="grid">
${cells}
</div>`;
  fs.mkdirSync(path.dirname(SHEET_FILE), { recursive: true });
  fs.writeFileSync(SHEET_FILE, sheet, 'utf8');
  console.log(`  contact sheet → ${path.relative(ROOT, SHEET_FILE)}`);
}
