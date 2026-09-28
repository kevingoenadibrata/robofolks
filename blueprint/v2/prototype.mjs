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

/* ---------------- antenna (rows 0-1) ---------------- */
// Nothing else in a frame reaches rows 0-1, so the band is cleared and drawn
// from scratch. `dome` and `horns` follow the crown so they stay seated on a
// narrow head; the rest stay centred, which is what leaves `twin` standing
// clear of a cone's point -- a pair of feelers, kept deliberately. Nothing in
// here animates: the antenna light blinks, but the shape is the same on every
// tick, so `paintAntenna` needs no state.
const ANTENNAS = {
  mast: (g) => { for (let x = 15; x <= 16; x++) { g[0][x] = 'a'; g[1][x] = '#'; } },
  twin: (g) => { for (const x of [10, 21]) { g[0][x] = 'a'; g[1][x] = '#'; } },
  // reworked: no stem plate, the light sits straight on the crown
  dome: (g, spans) => { const [x0, x1] = spans[0]; for (let x = Math.max(14, x0 + 1); x <= Math.min(17, x1 - 1); x++) g[1][x] = 'a'; },
  none: () => {},
  bulb: (g) => { for (let x = 14; x <= 17; x++) g[0][x] = 'a'; for (let x = 15; x <= 16; x++) g[1][x] = '#'; },
  // a small triangle on each outer corner of the crown, tip outboard: two
  // cells of base on row 1, one on row 0 over the corner itself
  horns: (g, spans) => { const [x0, x1] = spans[0]; g[0][x0] = 'd'; g[0][x1] = 'd'; g[1][x0] = 'd'; g[1][x0 + 1] = 'd'; g[1][x1] = 'd'; g[1][x1 - 1] = 'd'; },
  // one light the whole width of the crown: `dome` unclamped, a light bar.
  // The end cells are half-height (`A`), so the bar's top corners come off
  // and the ends curve down onto the crown. It never goes narrower than
  // x 10-21: on a crown as small as `cone`'s it would otherwise collapse to
  // four cells, which is `dome`.
  bar: (g, spans) => {
    const [x0, x1] = spans[0], a = Math.min(x0, 10), b = Math.max(x1, 21);
    for (let x = a; x <= b; x++) g[1][x] = 'a';
    g[1][a] = 'A'; g[1][b] = 'A';
  },
};
const paintAntenna = (g, spans, name) => {
  for (let y = 0; y <= 1; y++) g[y].fill('.');
  ANTENNAS[name](g, spans);
};

/* ---------------- ears (rows 4-7, mirrored) ---------------- */
// `put(row, k, char)` is k columns outboard of the head outline at that row,
// on both sides, so an ear re-anchors on a narrower head instead of floating.
// It only fills an empty cell: core draws the ears right after the head and
// the arms after that, so a raised claw or hand covers the ear it overlaps,
// and patching a finished frame has to reproduce that.
const EARS = {
  bolt: (put) => { for (const y of [5, 6]) { put(y, 1, 'd'); put(y, 2, 'a'); } },
  fin: (put) => { for (let y = 4; y <= 7; y++) put(y, 1, 'd'); for (const y of [5, 6]) put(y, 2, 'd'); },
  none: () => {},
  // a T on its side: a short stem off the head, a flange standing on its end
  plug: (put) => { for (const y of [5, 6]) { put(y, 1, '#'); put(y, 2, '#'); } for (let y = 4; y <= 7; y++) put(y, 3, 'd'); },
  // A half-circle that never touches: k 1 is left empty, the flat side faces
  // the head at k 2, and k 3 curves away -- half cells top and bottom (`A`,
  // `B`) round it off. All of it is the light, so the pair glows and blinks
  // with the antenna rather than reading as body. A taper pointing the other
  // way was drawn first and dropped: it is `fin`'s silhouette exactly, one
  // column further out.
  floating: (put) => {
    for (let y = 4; y <= 7; y++) put(y, 2, 'a');
    put(4, 3, 'A'); put(5, 3, 'a'); put(6, 3, 'a'); put(7, 3, 'B');
  },
};
const paintEars = (g, spans, name) => {
  const put = (y, k, c) => {
    const [x0, x1] = spans[y - 2];
    for (const x of [x0 - k, x1 + k]) if (x >= 0 && x < 32 && g[y][x] === '.') g[y][x] = c;
  };
  EARS[name](put);
};

/* ---------------- chest panel (row 12, x 12-19) ---------------- */
// One table for all seven options, used by every build: the walker's and
// tank's panel, the float pod's last row, and -- as a marking that slides
// round the waist -- the ball's. The three the package already has go
// through it too, so the fidelity check pins the whole table down.
const CHESTS = {
  lights: (g) => { for (let x = 12; x <= 19; x++) g[12][x] = 'v'; g[12][13] = '1'; g[12][15] = '2'; g[12][16] = '2'; g[12][18] = '3'; },
  core: (g) => { for (let x = 14; x <= 17; x++) g[12][x] = 'v'; g[12][15] = '2'; g[12][16] = '2'; },
  grille: (g) => { for (let x = 12; x <= 19; x++) g[12][x] = x % 2 ? 'd' : 'v'; },
  none: () => {},
  // edge to edge, over the outline too, so it wraps round the body like the ball's ring
  stripe: (g, [x0, x1]) => { for (let x = x0; x <= x1; x++) g[12][x] = 'h'; },
  // stripe's full width, but a dark waveform: half-height shade cells, two a side
  zigzag: (g, [x0, x1]) => { for (let x = x0; x <= x1; x++) g[12][x] = Math.floor(x / 2) % 2 ? 'Q' : 'P'; },
  // a V-neck over rows 11-12: shade lapels closing a column every half row,
  // a highlight shirt front between them, and the body as the jacket
  tuxedo: (g) => { TUX.forEach((cells, i) => [...cells].forEach((c, dx) => { g[11 + i][12 + dx] = c; })); },
};
// x 12-19 is interior body on every build, so the panel is repainted by
// clearing back to the base colour. `span` is the body's row 12, outline
// included, for the one option that runs the full width.
const SPAN = { walker: [9, 22], tank: [7, 24], float: [11, 20] };
const TUX = ['PRhhhhRP', '##PRRP##'];
const paintFrontChest = (g, chest, span) => { for (let x = 12; x <= 19; x++) g[12][x] = '#'; CHESTS[chest](g, span); };

// The ball's waist. Rows 11-13 are repainted to bare sphere -- span, then the
// four shaded cells sphere() puts there -- and the marking stamped back on.
const WAIST = { 11: [5, 26], 12: [6, 25], 13: [7, 24] };
const MARKING = {
  lights: ['d1d2d3d'], core: ['ddddd', 'd222d', 'ddddd'], grille: null, none: null, stripe: null, zigzag: null, tuxedo: null,
};
const mod = (a, m) => ((a % m) + m) % m;
const stamp = (g, rows, cx, top = Math.round(12 - (rows.length - 1) / 2)) => {
  rows.forEach((cells, i) => {
    const left = Math.round(cx - (cells.length - 1) / 2);
    [...cells].forEach((c, dx) => {
      const y = top + i, x = left + dx, span = WAIST[y];
      if (span && x >= span[0] && x <= span[1]) g[y][x] = c;
    });
  });
};
const ballChest = (g, chest, n) => {
  for (const [y, [x0, x1]] of Object.entries(WAIST)) for (let x = x0; x <= x1; x++) g[y][x] = '#';
  g[11][5] = 'h'; g[11][26] = 'd'; g[12][25] = 'd'; g[13][23] = 'd'; g[13][24] = 'd';
  if (chest === 'stripe') { const [x0, x1] = WAIST[12]; for (let x = x0; x <= x1; x++) g[12][x] = 'h'; return; }
  // a ring like stripe's; the wave travels a column a tick
  if (chest === 'zigzag') { const [x0, x1] = WAIST[12]; for (let x = x0; x <= x1; x++) g[12][x] = mod(Math.floor((x - n) / 2), 2) ? 'Q' : 'P'; return; }
  if (chest === 'grille') { const [x0, x1] = WAIST[12]; for (let x = x0 + 1; x < x1; x++) if (mod(x - n, 4) === 0) g[12][x] = 'd'; return; }
  // The tuxedo is a shirt front, not a marking: it stays centred, as it is on
  // every other build, and hangs from row 11 rather than centring on 12.
  if (chest === 'tuxedo') { stamp(g, TUX, 15.5, 11); return; }
  if (!MARKING[chest]) return;
  // Panels and light strips slide a column a tick and repeat every 12, so the
  // pattern comes back round in step with the grille's.
  for (let cx = 15.5 + mod(n, 12) - 24; cx <= 38; cx += 12) stamp(g, MARKING[chest], cx);
};

const paintHead = (g, spans, o, build) => {
  // Clear exactly the cells today's head occupies -- not a blanket band -- so
  // arms raised into rows 7-8 and the ball's rim survive. The frame came from
  // core with no antenna and no ears (see robot()), so there is nothing else
  // to erase and every option is drawn here, at the outline it belongs to.
  BOX.forEach(([x0, x1], i) => { for (let x = x0; x <= x1; x++) g[i + 2][x] = '.'; });
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
  paintEars(g, spans, o.ears);
  paintAntenna(g, spans, o.antenna);
  // ball: refill the sphere the head no longer covers, re-seat the seam
  if (build === 'ball') {
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

/* ---------------- half-height pixels ---------------- */
// A char that fills half a cell: which colour it takes, and which half. They
// are what rounds a corner off, on a grid whose cells are twice as tall as
// they are wide. Implementing them means `eachFolkRect` grows a half-height
// case that reads its colour from a table like this one, rather than the
// single hard-wired eyelid case it has today.
const HALVES = {
  T: ['m', 0], U: ['m', 1], // mouth: top half, bottom half
  A: ['a', 1], B: ['a', 0], // the light: bottom half, top half
  // On the body a half can't leave the other half empty -- it would punch a
  // hole in the torso -- so these fill it with the body colour.
  P: ['d', 0, '#'], Q: ['d', 1, '#'], // zigzag chest: shade top, shade bottom
  R: ['h', 0, 'd'], // tuxedo: shirt above the lapel line
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
const floatBody = (g, o, state, t) => {
  for (let y = 10; y <= 15; y++) g[y].fill('.');
  for (const [y, [x0, x1]] of Object.entries(POD)) {
    g[y][x0] = 'h';
    for (let x = x0 + 1; x <= x1; x++) g[y][x] = '#';
    g[y][x1] = 'd';
  }
  paintFrontChest(g, o.chest, SPAN.float); // the pod's last row is the chest panel, unchanged
  for (let x = 13; x <= 18; x++) g[13][x] = 'd'; // skirt: bottom of the body
  // plume: wide at the skirt, narrowing to a point
  const n = Math.floor(t / 2), on = state !== 'waiting' || t % 4 < 2;
  if (on) {
    for (let x = 14 - (n % 2); x <= 17 + (n % 2); x++) g[14][x] = 'a';
    for (let x = 15; x <= 16; x++) g[15][x] = 'a';
  }
  // The arms are returned rather than drawn: `up` reaches row 8, inside the
  // band the head repaint clears, and core draws the arms after the head.
  const poses = state === 'active' ? (n % 2 ? ['out', 'down'] : ['down', 'out'])
    : state === 'needs' ? ['up', 'up'] : ['tuck', 'tuck'];
  return { dy: [0, -1, -2, -1][n % 4], poses }; // always airborne: a bob instead of a walk
};

/* ---------------- assemble ---------------- */
const DEFAULTS = { head: 'box', eyes: 'wide', mouth: 'line', eyeColor: 'green' };
/* `opts` overrides any axis for one drawing; the three the package already
   seeds -- antenna, ears, chest -- default to the trait. Core is asked for a
   robot with no antenna and no ears, and its chest panel is repainted, so all
   three lists go through this file's tables whatever the option is. */
function robot(traits, state = 'active', tick = 1, opts = {}) {
  const o = { ...DEFAULTS, antenna: traits.antenna, ears: traits.ears, chest: traits.chest, ...opts };
  const base = { ...traits, antenna: 'none', ears: 'none', build: traits.build === 'float' ? 'walker' : traits.build };
  const frame = folkFrame(base, state, tick);
  const g = frame.grid;
  const t = tick + (traits.phase ?? 0);
  let poses = null;
  if (traits.build === 'float') ({ dy: frame.dy, poses } = floatBody(g, o, state, t));
  else if (base.build === 'ball') ballChest(g, o.chest, state === 'active' ? t : 0);
  else paintFrontChest(g, o.chest, SPAN[base.build]);
  paintHead(g, HEADS[o.head], o, base.build);
  if (poses) { arm(g, -1, poses[0]); arm(g, 1, poses[1]); }
  const look = state === 'active' ? [0, 0, 1, 0, 0, -1][Math.floor(t / 6) % 6] : 0;
  const blink = state === 'active' && t % 26 === 0;
  drawEyes(g, o.eyes, blink ? 'waiting' : state, look, HEADS[o.head]);
  if (state === 'active') drawMouth(g, o.mouth, t % 4 < 2);
  const colors = folkColors(base, state, frame.light, frame.lit);
  if (state === 'active') { colors.e = EYE_COLORS[o.eyeColor]; colors.m = EYE_COLORS[o.eyeColor]; }
  return { frame, colors };
}


const eachRect = (frame, colors, fn) => {
  eachFolkRect({ ...frame, grid: frame.grid.map((r) => r.map((c) => (HALVES[c] ? '.' : c))) }, colors, fn);
  frame.grid.forEach((r, y) => r.forEach((c, x) => {
    const half = HALVES[c];
    if (!half) return;
    fn(x, y * 2 + frame.dy + half[1], 1, 1, colors[half[0]]);
    if (half[2]) fn(x, y * 2 + frame.dy + 1 - half[1], 1, 1, colors[half[2]]);
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
   state and tick. Anything else means a patch is drifting from the package.
   Every antenna, ear and chest option the package already has is in here,
   because this file now draws all three itself: these cases are what says its
   tables still agree with core, down to the ball's sliding markings and the
   pixels a raised claw takes off an ear. */
{
  let bad = 0;
  const T = (o) => W({ body: B(1), build: 'tank', ...o });
  const BA = (o) => W({ body: B(2), build: 'ball', ...o });
  const cases = [
    W(), W({ antenna: 'twin' }), W({ antenna: 'dome' }),
    W({ ears: 'fin' }), W({ ears: 'none', chest: 'core' }), W({ chest: 'grille' }),
    TANK, T({ antenna: 'mast', ears: 'bolt', chest: 'lights' }), T({ ears: 'fin', chest: 'grille' }),
    BALL, BA({ antenna: 'twin', ears: 'bolt', chest: 'lights' }), BA({ antenna: 'mast', ears: 'fin', chest: 'core' }),
  ];
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
      console.log(`MISMATCH build=${tr.build} antenna=${tr.antenna} ears=${tr.ears} chest=${tr.chest} state=${st} tick=${tick}`);
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
  { name: 'antenna', note: 'Four on top of the three the package has. <code>dome</code>, <code>horns</code> and <code>bar</code> follow the crown, so they stay seated when the head narrows; the rest stay centred, which is what leaves <code>twin</code> standing clear of a cone&rsquo;s point. <code>horns</code> is a triangle a side, tip outboard, in the body&rsquo;s shade colour; <code>bar</code> is one light the full width of the crown &mdash; floored at x&nbsp;10&ndash;21 so it stays a bar on <code>cone</code> rather than collapsing into a second <code>dome</code> &mdash; with half-height end cells, so its top corners come off and the ends curve onto the head.',
    cols: ['walker', 'tank', 'ball', 'float', 'on cone', 'on taper', 'idle'],
    rows: Object.keys(ANTENNAS).map((a) => [a, [
      robot(W(), 'active', 1, { antenna: a }), robot(TANK, 'active', 1, { antenna: a }),
      robot(BALL, 'active', 1, { antenna: a }), robot(FLOAT, 'active', 1, { antenna: a }),
      robot(W(), 'active', 1, { antenna: a, head: 'cone' }), robot(W(), 'active', 1, { antenna: a, head: 'taper' }),
      robot(W(), 'waiting', 0, { antenna: a })]]) },
  { name: 'ears', note: 'Drawn inward from the head outline at each row, so an ear re-anchors instead of drifting off when the head narrows &mdash; on <code>taper</code> they step in with the jaw. <code>floating</code> keeps the column next to the head empty, so it stays detached whatever shape the head is; it is all light, rounded off with half cells, so the pair blinks with the antenna. An ear fills only an empty cell, the order core draws in: the tank&rsquo;s raised claw and the walker&rsquo;s raised hand cut into the ones they overlap.',
    cols: ['walker', 'light off', 'tank', 'ball', 'float', 'on taper', 'needs', 'needs (tank)'],
    rows: Object.keys(EARS).map((e) => [e, [
      robot(W(), 'active', 1, { ears: e }), robot(W(), 'active', 4, { ears: e }),
      robot(TANK, 'active', 1, { ears: e }), robot(BALL, 'active', 1, { ears: e }),
      robot(FLOAT, 'active', 1, { ears: e }), robot(W(), 'active', 1, { ears: e, head: 'taper' }),
      robot(W(), 'needs', 0, { ears: e }), robot(TANK, 'needs', 0, { ears: e })]]) },
  { name: 'chest', note: 'Row 12, x&nbsp;12&ndash;19 on every build; on the ball it becomes a marking that slides round the waist (the two ball columns are ticks 1 and 7). <code>stripe</code> runs the full width of the body, outline included, so it wraps round like the ball&rsquo;s ring. <code>zigzag</code> takes the same span as a dark square wave in half-height cells. <code>tuxedo</code> is a V-neck over rows 11&ndash;12, and the one marking that stays centred on the ball. <code>none</code>, <code>stripe</code>, <code>zigzag</code> and <code>tuxedo</code> carry no lights, so they sit out the chase while working and the flash on <code>needs</code>.',
    cols: ['walker', 'chase, next', 'tank', 'ball', 'ball, slid', 'float', 'needs'],
    rows: Object.keys(CHESTS).map((c) => [c, [
      robot(W(), 'active', 1, { chest: c }), robot(W(), 'active', 3, { chest: c }), robot(TANK, 'active', 1, { chest: c }),
      robot(BALL, 'active', 1, { chest: c }), robot(BALL, 'active', 7, { chest: c }), robot(FLOAT, 'active', 1, { chest: c }),
      robot(W(), 'needs', 0, { chest: c })]]) },
];

// A gallery of combinations, to show the space rather than the axes.
const MIX = [];
const heads = Object.keys(HEADS), eyes = Object.keys(EYES), mouths = Object.keys(MOUTHS), cols = Object.keys(EYE_COLORS);
const antennas = Object.keys(ANTENNAS), ears = Object.keys(EARS), chests = Object.keys(CHESTS);
const builds = [W, () => TANK, () => BALL, () => FLOAT];
for (let i = 0; i < 32; i++) {
  const tr = { ...builds[i % 4](), body: B(i % 7), phase: i };
  MIX.push(robot(tr, 'active', 1 + (i % 4), { head: heads[i % 4], eyes: eyes[(i + 1) % 4], mouth: mouths[(i + 2) % 4], eyeColor: cols[i % 3],
    antenna: antennas[i % 7], ears: ears[(i + 3) % 5], chest: chests[(i + 5) % chests.length] }));
}

let html = `<!doctype html><meta charset="utf-8"><title>robofolks v2.0.0 — blueprint</title>
<style>body{background:#282828;color:#ebdbb2;font:14px/1.5 ui-monospace,monospace;padding:24px;max-width:1200px}
h1{font-size:19px;margin:0 0 4px}h2{margin:36px 0 2px;font-size:16px;color:#fabd2f}
p.note{color:#a89984;margin:0 0 10px;max-width:70em}code{color:#8ec07c}
table{border-collapse:collapse}td,th{padding:5px 8px;text-align:left;vertical-align:middle}
th{color:#a89984;font-weight:normal;font-size:12px}td:first-child{color:#fabd2f;width:74px}
svg{display:block}.mix{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}</style>
<h1>robofolks v2.0.0 &mdash; blueprint</h1>
<p class="note">All nine axes approved for v2, drawn by patching real frames from <code>src/core.js</code>; the package itself is untouched. Decisions and open work are in <code>blueprint/v2/plan.md</code>.
build 4 &times; body 7 &times; antenna 7 &times; ears 5 &times; chest 7 &times; head 4 &times; eyes 4 &times; mouth 4 &times; eye colour 3 = <b>1,317,120</b> robots.</p>`;
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
