/* robofolks v2.0.0 blueprint — the master prototype.

   This is a DESIGN ARTEFACT, not part of the package. It draws every
   variation approved for v2 by taking real frames from ../../src/core.js and
   patching them, so nothing in src/ has to change while the design is still
   being decided. `npm run blueprint` regenerates prototype.html next to this
   file; open it to see every option.

   The decisions, the options that were rejected and why, and the work still
   outstanding are all in ./plan.md. Read that first.

   A fidelity check runs on every regeneration: with all defaults (box head,
   wide eyes, line mouth, green) this file must reproduce core's output
   exactly, for every build, state and tick. If it prints a mismatch, a patch
   here has drifted from the package -- fix the patch, not the check. */
import { writeFileSync } from 'node:fs';
import { FOLK_BODIES, FOLK_VIEWBOX, folkFrame, folkColors, eachFolkRect, eachGlyphRect } from '../../src/core.js';
import { encodePng } from '../../src/png.js';
const OUT = new URL('.', import.meta.url).pathname;
const mirror = (x) => 31 - x;

/* ---------------- head shape ---------------- */
const HEADS = {
  box:   [[8,23],[7,24],[7,24],[7,24],[7,24],[7,24],[7,24],[8,23]], // today
  round: [[10,21],[8,23],[7,24],[7,24],[7,24],[7,24],[8,23],[10,21]],
  cone:  [[13,18],[10,21],[8,23],[7,24],[7,24],[7,24],[7,24],[7,24]],
  taper: [[5,26],[6,25],[7,24],[7,24],[8,23],[9,22],[10,21],[12,19]],
};
const BOX = HEADS.box;
const SCREEN_ROWS = [4, 7], SCREEN_X = [9, 22];
const screenAt = (spans, y) => { const [x0, x1] = spans[y - 2]; return [Math.max(x0 + 2, SCREEN_X[0]), Math.min(x1 - 2, SCREEN_X[1])]; };

const paintHead = (g, spans, traits) => {
  // Clear exactly the cells today's head and ears occupy -- not a blanket
  // band -- so arms raised into rows 7-8 and the ball's rim survive.
  BOX.forEach(([x0, x1], i) => { for (let x = x0; x <= x1; x++) g[i + 2][x] = '.'; });
  const clearEar = (y, x) => { g[y][x] = '.'; g[y][mirror(x)] = '.'; };
  if (traits.ears === 'bolt') for (const y of [5, 6]) { clearEar(y, 6); clearEar(y, 5); }
  if (traits.ears === 'fin') { for (let y = 4; y <= 7; y++) clearEar(y, 6); clearEar(5, 5); clearEar(6, 5); }
  spans.forEach(([x0, x1], i) => {
    const y = i + 2;
    if (y === 2) { for (let x = x0; x <= x1; x++) g[y][x] = 'h'; return; }
    if (y === 9) { for (let x = x0; x <= x1; x++) g[y][x] = 'd'; return; }
    g[y][x0] = 'h';
    for (let x = x0 + 1; x <= x1; x++) g[y][x] = '#';
    if (y !== 3) g[y][x1] = 'd'; // row 3's top-right corner catches the light
  });
  for (let y = SCREEN_ROWS[0]; y <= SCREEN_ROWS[1]; y++) { const [a, b] = screenAt(spans, y); for (let x = a; x <= b; x++) g[y][x] = 'v'; }
  for (const y of [4, 7]) { const [a, b] = screenAt(spans, y); g[y][a] = '#'; g[y][b] = '#'; }
  g[4][10] = 'g'; g[4][11] = 'g';
  const edge = (y) => spans[y - 2];
  if (traits.ears === 'bolt') for (const y of [5, 6]) { const [x0, x1] = edge(y); g[y][x0 - 1] = 'd'; g[y][x1 + 1] = 'd'; g[y][x0 - 2] = 'a'; g[y][x1 + 2] = 'a'; }
  if (traits.ears === 'fin') for (let y = 4; y <= 7; y++) { const [x0, x1] = edge(y); g[y][x0 - 1] = 'd'; g[y][x1 + 1] = 'd'; if (y === 5 || y === 6) { g[y][x0 - 2] = 'd'; g[y][x1 + 2] = 'd'; } }
  // dome antenna, reworked: no stem plate, light straight on the crown
  if (traits.antenna === 'dome') {
    for (let y = 0; y <= 1; y++) g[y].fill('.');
    const [x0, x1] = spans[0];
    for (let x = Math.max(14, x0 + 1); x <= Math.min(17, x1 - 1); x++) g[1][x] = 'a';
  }
  // ball: refill the sphere the head no longer covers, re-seat the seam
  if (traits.build === 'ball') {
    const SPHERE = { 5: [11,20], 6: [8,23], 7: [7,24], 8: [6,25], 9: [5,26], 10: [5,26] };
    for (let y = 5; y <= 9; y++) for (let x = SPHERE[y][0]; x <= SPHERE[y][1]; x++) if (g[y][x] === '.') g[y][x] = '#';
    g[8][6] = 'h'; g[9][5] = 'h'; g[9][6] = 'h';
    for (let x = SPHERE[10][0]; x <= SPHERE[10][1]; x++) g[10][x] = '#';
    g[10][5] = 'h';
    const [b0, b1] = spans[7];
    for (let x = b0; x <= b1; x++) g[10][x] = 'n';
  }
};

/* ---------------- eyes ---------------- */
const EYES = {
  wide:  { open: [[4,11],[4,12],[4,13],[5,11],[5,12],[5,13]], needs: [[4,11],[4,12],[4,13],[5,11],[5,12],[5,13],[6,11],[6,12],[6,13]], glint: [4,11], shutRow: 5, shutCols: [11,12,13] },
  dot:   { open: [[5,11],[5,12]], needs: [[4,11],[4,12],[5,11],[5,12]], glint: null, shutRow: 5, shutCols: [11,12] },
  slant: { open: [[4,12],[4,13],[5,11],[5,12],[5,13]], needs: [[4,12],[4,13],[5,11],[5,12],[5,13],[6,11],[6,12],[6,13]], glint: [4,12], shutRow: 5, shutCols: [11,12,13] },
  visor: { single: true, open: Array.from({ length: 10 }, (_, i) => [5, 11 + i]), needs: Array.from({ length: 20 }, (_, i) => [4 + Math.floor(i / 10), 11 + (i % 10)]), glint: [5,12], shutRow: 5, shutCols: Array.from({ length: 10 }, (_, i) => 11 + i) },
};
const drawEyes = (g, shape, state, look = 0, spans = BOX) => {
  for (let y = 2; y <= 9; y++) for (let x = 0; x < 32; x++) if ('ewl'.includes(g[y][x])) g[y][x] = 'v';
  const e = EYES[shape];
  // Writable = anywhere on the screen, including the glare pixels, which the
  // eyes are drawn over. `mirror` is applied to the column, then the look
  // offset, so both eyes shift the same way across the screen.
  const onScreen = (y, x) => { const [a, b] = screenAt(spans, y); return y >= SCREEN_ROWS[0] && y <= SCREEN_ROWS[1] && x >= a && x <= b; };
  const put = (y, x, c) => {
    if (onScreen(y, x + look)) g[y][x + look] = c;
    if (!e.single && onScreen(y, mirror(x) + look)) g[y][mirror(x) + look] = c;
  };
  if (state === 'waiting') { for (const x of e.shutCols) put(e.shutRow, x, 'l'); return; }
  for (const [y, x] of (state === 'needs' ? e.needs : e.open)) put(y, x, 'e');
  // The glint sits on the top row of the eye, which `needs` keeps too.
  if (e.glint) {
    const [gy, gx] = e.glint;
    // Lit from the top left: the glint sits on each eye's left edge.
    const widest = Math.max(...e.open.filter(([y]) => y === gy).map(([, x]) => x));
    if (onScreen(gy, gx + look)) g[gy][gx + look] = 'w';
    if (!e.single && onScreen(gy, mirror(widest) + look)) g[gy][mirror(widest) + look] = 'w';
  }
};

/* ---------------- mouth (half-height pixels T/U) ---------------- */
const strip = (g, x0, x1) => { for (let x = x0; x <= x1; x++) g[7][x] = 'm'; };
const MOUTHS = {
  line: (g, open) => strip(g, open ? 14 : 15, open ? 17 : 16),
  zigzag: (g, open) => { for (let x = 12; x <= 19; x++) g[7][x] = (x + (open ? 0 : 1)) % 2 ? 'U' : 'T'; },
  grin: (g, open) => { if (open) { g[7][13] = 'T'; strip(g, 14, 17); g[7][18] = 'T'; } else { g[7][14] = 'T'; strip(g, 15, 16); g[7][17] = 'T'; } },
  none: () => {},
};
const drawMouth = (g, shape, open) => {
  for (let x = 0; x < 32; x++) if ('mTU'.includes(g[7][x])) g[7][x] = 'v';
  MOUTHS[shape](g, open);
};

/* ---------------- eye colour ---------------- */
const EYE_COLORS = { green: '#8ec07c', aqua: '#83a598', sand: '#d5c4a1' };

/* ---------------- build: float ---------------- */
const POD = { 10: [11, 20], 11: [11, 20], 12: [11, 20] }; // flush to the head, no neck
const arm = (g, side, pose) => {
  const put = (y, x, c) => { const xx = side < 0 ? x : mirror(x); if (y >= 0 && y < 16 && xx >= 0 && xx < 32) g[y][xx] = c; };
  if (pose === 'down') { put(11, 10, '#'); put(12, 10, '#'); put(13, 10, 'd'); }
  if (pose === 'out') { put(11, 10, '#'); put(12, 9, '#'); put(13, 8, 'd'); put(13, 9, 'd'); }
  if (pose === 'up') { put(11, 10, '#'); put(10, 9, '#'); put(9, 9, '#'); put(8, 9, 'd'); }
  if (pose === 'tuck') { put(11, 10, '#'); put(12, 10, 'd'); }
};
const floatBody = (g, traits, state, t) => {
  for (let y = 10; y <= 15; y++) g[y].fill('.');
  for (const [y, [x0, x1]] of Object.entries(POD)) {
    g[y][x0] = 'h';
    for (let x = x0 + 1; x <= x1; x++) g[y][x] = '#';
    g[y][x1] = 'd';
  }
  if (traits.chest === 'lights') { for (let x = 12; x <= 19; x++) g[12][x] = 'v'; g[12][13] = '1'; g[12][15] = '2'; g[12][16] = '2'; g[12][18] = '3'; }
  if (traits.chest === 'core') { for (let x = 14; x <= 17; x++) g[12][x] = 'v'; g[12][15] = '2'; g[12][16] = '2'; }
  if (traits.chest === 'grille') for (let x = 12; x <= 19; x++) g[12][x] = x % 2 ? 'd' : 'v';
  for (let x = 13; x <= 18; x++) g[13][x] = 'd'; // skirt: bottom of the body
  // plume: wide at the skirt, narrowing to a point
  const n = Math.floor(t / 2), on = state !== 'waiting' || t % 4 < 2;
  if (on) {
    for (let x = 14 - (n % 2); x <= 17 + (n % 2); x++) g[14][x] = 'a';
    for (let x = 15; x <= 16; x++) g[15][x] = 'a';
  }
  if (state === 'active') { const step = n % 2; arm(g, -1, step ? 'out' : 'down'); arm(g, 1, step ? 'down' : 'out'); }
  else if (state === 'needs') { arm(g, -1, 'up'); arm(g, 1, 'up'); }
  else { arm(g, -1, 'tuck'); arm(g, 1, 'tuck'); }
  return [0, -1, -2, -1][n % 4]; // always airborne: a bob instead of a walk
};

/* ---------------- assemble ---------------- */
const DEFAULTS = { head: 'box', eyes: 'wide', mouth: 'line', eyeColor: 'green' };
function robot(traits, state = 'active', tick = 1, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const base = traits.build === 'float' ? { ...traits, build: 'walker' } : traits;
  const frame = folkFrame(base, state, tick);
  const g = frame.grid;
  const t = tick + (traits.phase ?? 0);
  if (traits.build === 'float') frame.dy = floatBody(g, traits, state, t);
  paintHead(g, HEADS[o.head], traits);
  const look = state === 'active' ? [0, 0, 1, 0, 0, -1][Math.floor(t / 6) % 6] : 0;
  const blink = state === 'active' && t % 26 === 0;
  drawEyes(g, o.eyes, blink ? 'waiting' : state, look, HEADS[o.head]);
  if (state === 'active') drawMouth(g, o.mouth, t % 4 < 2);
  const colors = folkColors(base, state, frame.light, frame.lit);
  if (state === 'active') { colors.e = EYE_COLORS[o.eyeColor]; colors.m = EYE_COLORS[o.eyeColor]; }
  return { frame, colors };
}


const eachRect = (frame, colors, fn) => {
  eachFolkRect({ ...frame, grid: frame.grid.map((r) => r.map((c) => ('TU'.includes(c) ? '.' : c))) }, colors, fn);
  frame.grid.forEach((r, y) => r.forEach((c, x) => {
    if (c === 'T') fn(x, y * 2 + frame.dy, 1, 1, colors.m);
    if (c === 'U') fn(x, y * 2 + frame.dy + 1, 1, 1, colors.m);
  }));
};
const svgOf = ({ frame, colors }) => {
  const rects = [];
  eachRect(frame, colors, (x, y, w, h, fill) => rects.push(`<rect x="${x}" y="${y}" width="${w + 0.02}" height="${h + 0.02}" fill="${fill}"/>`));
  for (const gl of frame.glyphs) eachGlyphRect(gl, (x, y, w, h) => rects.push(`<rect x="${x}" y="${y}" width="${w + 0.02}" height="${h + 0.02}" fill="${gl.color}" opacity="${(gl.opacity ?? 1).toFixed(2)}"/>`));
  return `<svg viewBox="${FOLK_VIEWBOX.join(' ')}" width="104" shape-rendering="crispEdges">${rects.join('')}</svg>`;
};

const B = (i) => FOLK_BODIES[i];
const W = (o) => ({ body: B(0), build: 'walker', antenna: 'mast', ears: 'bolt', chest: 'lights', phase: 0, ...o });
const TANK = W({ body: B(1), build: 'tank', antenna: 'twin', ears: 'fin', chest: 'core' });
const BALL = W({ body: B(2), build: 'ball', antenna: 'dome', ears: 'none', chest: 'grille' });
const FLOAT = W({ body: B(5), build: 'float', antenna: 'dome', ears: 'bolt', chest: 'core' });

/* Fidelity check: with every default (box head, wide eyes, line mouth, green
   eyes) the master must reproduce core's frame exactly, for every build,
   state and tick. Anything else means a patch is drifting from the package. */
{
  let bad = 0;
  const cases = [W(), W({ antenna: 'twin' }), W({ ears: 'fin' }), W({ ears: 'none', chest: 'core' }), TANK, BALL];
  for (const tr of cases) for (const st of ['active', 'needs', 'waiting']) for (let tick = 0; tick < 30; tick++) {
    const a = folkFrame(tr, st, tick);
    const b = robot(tr, st, tick).frame;
    // The dome antenna is deliberately reworked (no stem plate), so rows 0-1
    // are expected to differ for it; everything else must match.
    const from = tr.antenna === 'dome' ? 2 : 0;
    const as = a.grid.slice(from).map((r) => r.join('')).join('|') + ` dy=${a.dy}`;
    const bs = b.grid.slice(from).map((r) => r.join('')).join('|') + ` dy=${b.dy}`;
    if (as !== bs && bad < 4) {
      bad++;
      console.log(`MISMATCH build=${tr.build} ears=${tr.ears} state=${st} tick=${tick}`);
      a.grid.forEach((row, i) => { if (i < from) return; const o = b.grid[i].join(''); if (row.join('') !== o) console.log(`  ${String(i).padStart(2)} core ${row.join('')}\n     mine ${o}`); });
    } else if (as !== bs) bad++;
  }
  console.log(bad === 0 ? 'fidelity: defaults match core exactly (dome antenna rework aside)' : `fidelity: ${bad} mismatching frames`);
}

const SECTIONS = [
  { name: 'builds', note: 'walker, tank, ball &mdash; and <b>float</b>: a small pod flush to the head, arms, no legs, a plume beneath, and a constant bob instead of a walk cycle.',
    cols: ['active', 'active (next tick)', 'needs', 'idle'],
    rows: [['walker', W()], ['tank', TANK], ['ball', BALL], ['float', FLOAT]].map(([n, tr]) => [n, [
      robot(tr, 'active', 1), robot(tr, 'active', 3), robot(tr, 'needs', 0), robot(tr, 'waiting', 0)]]) },
  { name: 'head shape', note: 'The screen is inset 2 from the outline and clamped to x&nbsp;9&ndash;22, so it follows a tapering head. <code>box</code> renders exactly as today.',
    cols: ['walker', 'tank', 'ball', 'float', 'dome antenna', 'idle'],
    rows: Object.keys(HEADS).map((h) => [h, [
      robot(W(), 'active', 1, { head: h }), robot(TANK, 'active', 1, { head: h }), robot(BALL, 'active', 1, { head: h }),
      robot(FLOAT, 'active', 1, { head: h }), robot(W({ antenna: 'dome' }), 'active', 1, { head: h }), robot(W(), 'waiting', 0, { head: h })]]) },
  { name: 'eyes', note: 'All four fit inside the screen, so they work on every build and every head shape.',
    cols: ['active', 'looking', 'needs', 'idle', 'on cone', 'on float'],
    rows: Object.keys(EYES).map((e) => [e, [
      robot(W(), 'active', 1, { eyes: e }), robot(W(), 'active', 13, { eyes: e }), robot(W(), 'needs', 0, { eyes: e }),
      robot(W(), 'waiting', 0, { eyes: e }), robot(W(), 'active', 1, { eyes: e, head: 'cone' }), robot(FLOAT, 'active', 1, { eyes: e })]]) },
  { name: 'mouth', note: 'Half-height pixels (<code>T</code>/<code>U</code>) keep every shape on row 7, clear of the eyes &mdash; the same trick the shut eyelid already uses.',
    cols: ['open', 'closed', 'with dot eyes', 'with visor', 'on taper', 'on float'],
    rows: Object.keys(MOUTHS).map((m) => [m, [
      robot(W(), 'active', 1, { mouth: m }), robot(W(), 'active', 3, { mouth: m }), robot(W(), 'active', 1, { mouth: m, eyes: 'dot' }),
      robot(W(), 'active', 1, { mouth: m, eyes: 'visor' }), robot(W(), 'active', 1, { mouth: m, head: 'taper' }), robot(FLOAT, 'active', 1, { mouth: m })]]) },
  { name: 'eye colour', note: 'Applies while <code>active</code> only; <code>needs</code> stays yellow and <code>waiting</code> is shut, so the dashboard language survives. The mouth follows the eyes.',
    cols: ['orange', 'pink', 'blue', 'cream', 'float', 'needs'],
    rows: Object.keys(EYE_COLORS).map((c) => [c, [
      ...[0, 1, 2, 3].map((i) => robot(W({ body: B(i) }), 'active', 1, { eyeColor: c })),
      robot(FLOAT, 'active', 1, { eyeColor: c }), robot(W(), 'needs', 0, { eyeColor: c })]]) },
];

// A gallery of combinations, to show the space rather than the axes.
const MIX = [];
const heads = Object.keys(HEADS), eyes = Object.keys(EYES), mouths = Object.keys(MOUTHS), cols = Object.keys(EYE_COLORS);
const builds = [W, () => TANK, () => BALL, () => FLOAT];
for (let i = 0; i < 24; i++) {
  const tr = { ...builds[i % 4](), body: B(i % 7), antenna: ['mast', 'twin', 'dome'][i % 3], ears: ['bolt', 'fin', 'none'][(i + 1) % 3], chest: ['lights', 'core', 'grille'][(i + 2) % 3], phase: i };
  MIX.push(robot(tr, 'active', 1 + (i % 4), { head: heads[i % 4], eyes: eyes[(i + 1) % 4], mouth: mouths[(i + 2) % 4], eyeColor: cols[i % 3] }));
}

let html = `<!doctype html><meta charset="utf-8"><title>robofolks v2.0.0 — blueprint</title>
<style>body{background:#282828;color:#ebdbb2;font:14px/1.5 ui-monospace,monospace;padding:24px;max-width:1200px}
h1{font-size:19px;margin:0 0 4px}h2{margin:36px 0 2px;font-size:16px;color:#fabd2f}
p.note{color:#a89984;margin:0 0 10px;max-width:70em}code{color:#8ec07c}
table{border-collapse:collapse}td,th{padding:5px 8px;text-align:left;vertical-align:middle}
th{color:#a89984;font-weight:normal;font-size:12px}td:first-child{color:#fabd2f;width:74px}
svg{display:block}.mix{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}</style>
<h1>robofolks v2.0.0 &mdash; blueprint</h1>
<p class="note">Every variation approved for v2, drawn by patching real frames from <code>src/core.js</code>; the package itself is untouched. Decisions and open work are in <code>blueprint/v2/plan.md</code>.
build 4 &times; body 7 &times; antenna 8 &times; ears 6 &times; chest 8 &times; head 4 &times; eyes 4 &times; mouth 4 &times; eye colour 3 = <b>2,064,384</b> robots.</p>`;
for (const s of SECTIONS) {
  html += `<h2>${s.name}</h2><p class="note">${s.note}</p><table><tr><th></th>${s.cols.map((c) => `<th>${c}</th>`).join('')}</tr>`;
  for (const [n, cells] of s.rows) html += `<tr><td>${n}</td>${cells.map((c) => `<td>${svgOf(c)}</td>`).join('')}</tr>`;
  html += '</table>';
}
html += `<h2>combinations</h2><p class="note">Two dozen robots mixing every axis at once.</p><div class="mix">${MIX.map(svgOf).join('')}</div>`;
writeFileSync(`${OUT}/prototype.html`, html);

// PNG contact sheet of the same sections
const SCALE = 5, CW = 38, CH = 42;
const rowsAll = SECTIONS.flatMap((s) => s.rows);
const widest = Math.max(...SECTIONS.map((s) => s.cols.length));
const width = (widest * CW + 2) * SCALE, height = (rowsAll.length * CH + SECTIONS.length * 6 + 2) * SCALE;
const data = new Uint8Array(width * height * 4);
const paint = (x, y, w, h, color, alpha = 1) => {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16));
  for (let py = Math.round(y * SCALE); py < Math.round((y + h) * SCALE); py++)
    for (let px = Math.round(x * SCALE); px < Math.round((x + w) * SCALE); px++) {
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const i = (py * width + px) * 4;
      data.set([Math.round(r * alpha + data[i] * (1 - alpha)), Math.round(g * alpha + data[i + 1] * (1 - alpha)), Math.round(b * alpha + data[i + 2] * (1 - alpha)), 255], i);
    }
};
paint(0, 0, width / SCALE, height / SCALE, '#282828');
let row = 0, gi = 0;
for (const s of SECTIONS) {
  for (const [, cells] of s.rows) {
    cells.forEach(({ frame, colors }, ci) => {
      const ox = 2 + ci * CW, oy = 2 + row * CH + gi * 6 + 5;
      eachRect(frame, colors, (x, y, w, h, fill) => paint(ox + x, oy + y, w, h, fill));
      for (const gl of frame.glyphs) eachGlyphRect(gl, (x, y, w, h) => paint(ox + x, oy + y, w, h, gl.color, gl.opacity ?? 1));
    });
    row++;
  }
  gi++;
}
writeFileSync(`${OUT}/prototype.png`, await encodePng({ width, height, data }));
console.log('ok', SECTIONS.length, 'sections,', rowsAll.length, 'rows');
