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
import { FOLK_BODIES, FOLK_TICK_MS, FOLK_VIEWBOX, folkFrame, folkColors, eachFolkRect, eachGlyphRect } from '../../src/core.js';
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
  T: ['m', 0, 'v'], U: ['m', 1, 'v'], // mouth: top half, bottom half, on the visor
  A: ['a', 1], B: ['a', 0], // the light: bottom half, top half
  // On the body a half can't leave the other half empty -- it would punch a
  // hole in the torso -- so these fill it with the body colour.
  P: ['d', 0, '#'], Q: ['d', 1, '#'], // zigzag chest: shade top, shade bottom
  R: ['h', 0, 'd'], // tuxedo: shirt above the lapel line
  // The moods' eyes (see STATES): an eye half a cell tall, on the screen, so
  // the other half is the visor rather than a hole. E sits low, F high.
  E: ['e', 1, 'v'], F: ['e', 0, 'v'], W: ['w', 0, 'v'],
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
  if (pose === 'gone') { put(15, 8, '#'); put(15, 7, '#'); put(15, 6, 'd'); } // lying on the ground below
};
const floatBody = (g, o, state, t, mood = null) => {
  for (let y = 10; y <= 15; y++) g[y].fill('.');
  for (const [y, [x0, x1]] of Object.entries(POD)) {
    g[y][x0] = 'h';
    for (let x = x0 + 1; x <= x1; x++) g[y][x] = '#';
    g[y][x1] = 'd';
  }
  paintFrontChest(g, o.chest, SPAN.float); // the pod's last row is the chest panel, unchanged
  for (let x = 13; x <= 18; x++) g[13][x] = 'd'; // skirt: bottom of the body
  // plume: wide at the skirt, narrowing to a point
  const n = Math.floor(t / 2), on = mood ? mood.plume !== 'off' : state !== 'waiting' || t % 4 < 2;
  if (on) {
    const w = mood?.plume === 'wide' ? 1 : n % 2;
    for (let x = 14 - w; x <= 17 + w; x++) g[14][x] = 'a';
    for (let x = 15 - (mood?.plume === 'wide'); x <= 16 + (mood?.plume === 'wide'); x++) g[15][x] = 'a';
  }
  // The arms are returned rather than drawn: `up` reaches row 8, inside the
  // band the head repaint clears, and core draws the arms after the head.
  const poses = mood ? mood.poses : state === 'active' ? (n % 2 ? ['out', 'down'] : ['down', 'out'])
    : state === 'needs' ? ['up', 'up'] : ['tuck', 'tuck'];
  return { dy: mood?.dy ?? [0, -1, -2, -1][n % 4], poses }; // always airborne: a bob instead of a walk
};

/* ---------------- new states ---------------- */
// Four states beside core's three (active, needs, waiting): angry, confused,
// thinking, destroyed. A state is a face, a pose per build, lights and
// glyphs, and it has to read on every build -- the ball has no arms, so each
// one also says what the ball does instead -- and with every eye shape.
//
// These are drawn over core's `waiting` frame at tick 0: the limbs it drew
// are cleared and drawn again here, from copies of core's arm, leg and tread
// helpers, since the poses differ. Two things core frames don't have yet:
// `dx`, a sideways shake (angry), and glyphs beyond `!`, `z` and `Z`.
const pt = (g, y, x, c) => { if (y >= 0 && y < 16 && x >= 0 && x < 32) g[y][x] = c; };
const cellsOf = (y, x0, x1, c) => Array.from({ length: x1 - x0 + 1 }, (_, i) => [y, x0 + i, c]);
const pair = (cells) => [...cells, ...cells.map(([y, x, c]) => [y, mirror(x), c])];
const flipX = (cells) => cells.map(([y, x, c]) => [y, mirror(x), c]);

// Limbs, drawn for the left side and mirrored for side 1 -- core's shapes,
// plus `chin` (a hand up under the jaw) and `gone` (the arm lying on the
// ground beside the robot).
const WALKER_ARMS = {
  down: [[11,7,'#'],[12,7,'#'],[13,7,'d'],[14,6,'d'],[14,7,'d']],
  swing: [[11,7,'#'],[12,7,'#'],[13,6,'d'],[13,5,'d']],
  'up-out': [[11,7,'#'],[10,6,'#'],[9,5,'#'],[8,4,'#'],[7,3,'d'],[7,4,'d']],
  'up-in': [[11,7,'#'],[10,6,'#'],[9,5,'#'],[8,5,'#'],[7,5,'d'],[7,6,'d']],
  chin: [[11,7,'#'],[10,7,'#'],[9,7,'h'],[9,8,'h']],
};
const walkerArm = (g, side, pose) => {
  const S = (y, x, c) => pt(g, y, side < 0 ? x : mirror(x), c);
  if (pose === 'gone') { S(15, 3, 'd'); S(15, 4, '#'); S(15, 5, '#'); S(15, 6, 'd'); return; }
  S(11, 8, '#');
  for (const [y, x, c] of WALKER_ARMS[pose]) S(y, x, c);
};
const walkerLeg = (g, side, lifted) => {
  const S = (y, x, c) => pt(g, y, side < 0 ? x : mirror(x), c);
  if (lifted) { for (const x of [11, 12, 13]) S(14, x, '#'); return; }
  S(14, 12, 'd'); S(14, 13, 'd'); for (const x of [11, 12, 13]) S(15, x, '#');
};
// A tank arm is [up, open], or 'gone' (the claw lying past the end of the tread).
const tankArm = (g, side, pose) => {
  const S = (y, x, c) => pt(g, y, side < 0 ? x : mirror(x), c);
  if (pose === 'gone') { S(15, 0, 'h'); S(15, 1, 'd'); S(15, 2, '#'); S(15, 3, '#'); return; }
  const [up, open] = pose;
  const claw = (y) => { S(y, 3, 'd'); S(y, 5, 'd'); if (!open) S(y, 4, 'd'); S(y + 1, 3, 'h'); S(y + 1, 5, 'h'); };
  S(11, 6, '#');
  if (up) { S(10, 5, '#'); S(9, 4, '#'); S(8, 4, '#'); claw(6); }
  else { S(11, 5, '#'); S(11, 4, '#'); claw(12); }
};
const tread = (g, roll) => {
  for (let x = 6; x <= 25; x++) g[14][x] = 'k';
  for (const x of [8, 12, 19, 23]) g[14][x] = 'o';
  for (let x = 5; x <= 26; x++) g[15][x] = (x + roll) % 3 === 0 ? 'n' : 'k';
};
// Everything core drew outside the head and torso: arms, legs, tread.
const clearLimbs = (g, build) => {
  const tank = build === 'tank';
  for (let y = 6; y <= 15; y++) for (let x = 0; x < 32; x++) {
    const [a, b] = tank || y < 10 ? [6, 25] : [8, 23];
    if (y >= 14 || x <= a || x >= b) g[y][x] = '.';
  }
};

// Glyphs beside the robot, in its tall pixels, on top of core's three.
const GLYPHS = {
  '?': ['###.', '...#', '.##.', '....', '.#..'],
  // four brackets, corners toward the centre: the cartoon anger mark
  vein: ['.#.#.', '##.##', '.....', '##.##', '.#.#.'],
  dot: ['##'],
  burstL: ['#.', '.#'], burstR: ['.#', '#.'], // shock lines off the top corners
  puff: ['##'],
  cloud: ['.##.', '####', '.##.'],
  spark: ['#.#', '.#.', '#.#'],
};
export const glyphRects = (gl, fn) => {
  if (!GLYPHS[gl.ch]) return eachGlyphRect(gl, fn);
  GLYPHS[gl.ch].forEach((line, r) => [...line].forEach((c, dc) => { if (c === '#') fn(gl.col + dc, (gl.row + r) * 2, 1, 2); }));
};

const LIGHT_NEEDS = '#fabd2f';
const RED = '#fb4934', PURPLE = '#d3869b', AQUA = '#83a598', SPARK = '#fabd2f', DIM = '#504945';
const SMOKE = '#a89984', STEAM = '#ebdbb2';

// Each eye shape's face for a state: [row, column, char] cells, both eyes
// already placed, before the look offset. E/F are half-height eye cells.
const FACES = {
  // Brows down toward the middle: the inner top corner comes off each eye,
  // stepped with a half cell. The visor bends into a V.
  angry: (shape) => shape === 'visor'
    ? [...cellsOf(4, 11, 12, 'e'), [4, 13, 'E'], ...cellsOf(5, 13, 18, 'e'), [4, 18, 'E'], ...cellsOf(4, 19, 20, 'e')]
    : shape === 'dot' ? pair([[4, 11, 'E'], [5, 11, 'e'], [5, 12, 'e']])
    : pair([[4, 11, 'e'], [4, 12, 'E'], [5, 11, 'e'], [5, 12, 'e'], [5, 13, 'e']]),
  // Normal eyes glancing from side to side, fast and unsure, with a double
  // blink every 24 ticks. The visor's bar jumps with them. (Drawn against
  // four others -- see plan.md.)
  confused: (shape, t) => {
    const bar = shape === 'visor';
    if (t % 24 === 20 || t % 24 === 22) return bar ? cellsOf(5, 11, 20, 'E') : pair(EYES[shape].open.filter(([y]) => y === 5).map(([y, x]) => [y, x, 'E']));
    const d = [-1, -1, 1, 1, 0, 0, 1, -1, -1, 0, 1, 1][Math.floor(t / 2) % 12];
    return (bar ? cellsOf(5, 11, 20, 'e') : pair(EYES[shape].open.map(([y, x]) => [y, x, 'e']))).map(([y, x, c]) => [y, x + d, c]);
  },
  // Eyes rolled up: half a cell comes off the bottom (or the dot lifts half
  // a cell), and the look holds to one side. The visor runs a scanner.
  thinking: (shape, t) => {
    if (shape === 'visor') {
      const p = [0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1][Math.floor(t / 2) % 16];
      return [...cellsOf(5, 11, 20, 'F'), [5, 11 + p, 'W'], [5, 12 + p, 'W']];
    }
    if (shape === 'dot') return pair([...cellsOf(4, 11, 12, 'E'), ...cellsOf(5, 11, 12, 'F')]);
    const e = EYES[shape];
    return pair(e.open.map(([y, x]) => [y, x, y === 5 ? 'F' : 'e']));
  },
  // Eyes gone round: each a ring (the `needs` 3x3 with its centre left dark),
  // so it reads as an O rather than `needs`' solid block. Dot eyes, too
  // narrow for a ring, stretch three rows tall; the visor becomes one wide
  // ring.
  surprised: (shape) => shape === 'visor'
    ? [...cellsOf(4, 11, 20, 'e'), [5, 11, 'e'], [5, 20, 'e'], ...cellsOf(6, 11, 20, 'e')]
    : shape === 'dot' ? pair([...cellsOf(4, 11, 12, 'e'), ...cellsOf(5, 11, 12, 'e'), ...cellsOf(6, 11, 12, 'e')])
    : pair([...cellsOf(4, 11, 13, 'e'), [5, 11, 'e'], [5, 13, 'e'], ...cellsOf(6, 11, 13, 'e')]),
  // `needs`' eyes, as core draws them.
  needs: (shape) => {
    const e = EYES[shape];
    const cells = e.needs.map(([y, x]) => [y, x, 'e']);
    return e.single ? cells : pair(cells);
  },
  // Happy: each eye a ^ of half cells, the middle half a cell higher than its
  // sides. Every two-eye shape shares it; the visor bows into one arch.
  celebrate: (shape) => shape === 'visor'
    ? [[5, 11, 'F'], ...cellsOf(4, 12, 19, 'E'), [5, 20, 'F']]
    : pair([[5, 11, 'F'], [4, 12, 'E'], [5, 13, 'F']]),
  // X eyes. The visor breaks into pieces, one fallen a row.
  destroyed: (shape) => shape === 'visor'
    ? [...cellsOf(5, 11, 13, 'e'), ...cellsOf(5, 15, 16, 'e'), [6, 18, 'e'], ...cellsOf(5, 19, 20, 'e')]
    : pair([[4, 11, 'e'], [4, 13, 'e'], [5, 12, 'e'], [6, 11, 'e'], [6, 13, 'e']]),
};

// Per state and tick: the pose each build takes, the face, lights and glyphs.
const STATES = {
  angry: (t) => {
    const fist = t % 2 ? 'up-in' : 'up-out', stomp = t % 8 >= 4 && t % 8 < 6;
    const glyphs = [];
    if (t % 4 < 3) glyphs.push({ ch: 'vein', col: 26, row: -3, color: RED });
    // steam off both sides of the crown, a puff every 3 ticks
    for (const [col, dir] of [[5, -1], [26, 1]]) {
      const q = t % 6;
      glyphs.push({ ch: q < 3 ? 'puff' : 'cloud', col: col + dir * Math.floor(q / 2) - (q < 3 ? 0 : 1), row: 1 - q, color: STEAM, opacity: 1 - q / 6 });
    }
    return {
      dx: t % 8 < 4 ? [0, 1, 0, -1][t % 4] : 0, // trembles, then a beat of stillness
      dy: stomp ? -1 : 0,
      walker: { arms: [fist, 'down'], legs: [false, stomp] },
      tank: { arms: [[true, t % 2 === 0], [false, t % 2 === 1]], roll: t % 3 }, // one claw raised, both snapping, tread revving
      ball: { slide: t % 2 ? 1 : -1 }, // rocks on the spot
      float: { poses: [t % 2 ? 'up' : 'out', 'down'], plume: 'wide', dy: 0 },
      eye: RED, light: t % 2 ? RED : DIM, chest: { lit: t % 2 ? 3 : -1, on: RED },
      mouth: [[7, 13, 'U'], ...cellsOf(7, 14, 17, 'T'), [7, 18, 'U']], // a frown
      glyphs,
    };
  },
  confused: (t) => {
    const scratch = Math.floor(t / 2) % 2 ? 'up-in' : 'up-out';
    const drift = [0, 1, 2, 3, 3, 2, 1, 0, -1, -2, -3, -3, -2, -1][t % 14];
    return {
      dy: 0,
      walker: { arms: [scratch, 'down'], legs: [false, false] }, // scratches its head
      tank: { arms: [[true, Math.floor(t / 2) % 2 === 0], [false, false]], roll: 0 },
      ball: { slide: drift }, // rolls one way, thinks better of it, rolls back
      float: { poses: ['up', 'tuck'], dy: [0, -1, -1, 0, 0, -1][Math.floor(t / 3) % 6] },
      light: [1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0][t % 12] ? PURPLE : DIM,
      chest: { lit: [0, 2, -1, 1, 2, 0][Math.floor(t / 2) % 6], on: PURPLE }, // lights out of order
      mouth: cellsOf(7, 14, 18, 'T').map(([y, x], i) => [y, x, (i + Math.floor(t / 4)) % 2 ? 'U' : 'T']), // a squiggle
      glyphs: [{ ch: '?', col: 26, row: Math.floor(t / 4) % 2 ? -5 : -4, color: PURPLE }],
    };
  },
  thinking: (t) => ({
    dy: 0,
    look: t % 32 < 24 ? 1 : -1, // gazes up and to one side, glancing back now and then
    walker: { arms: ['chin', 'down'], legs: [false, false] },
    tank: { arms: [[true, false], [false, false]], roll: 0 },
    ball: { slide: Math.floor(t / 3) }, // the markings creep round, a column every 3 ticks
    float: { poses: ['up', 'tuck'], dy: Math.floor(t / 8) % 2 ? -1 : 0 },
    light: t % 8 < 4 ? AQUA : DIM, chest: { lit: Math.floor(t / 4) % 3, on: AQUA },
    mouth: cellsOf(7, 16, 18, 'U'), // pursed, off to one side
    // a typing indicator: three dots in turn, then a beat empty
    glyphs: [0, 1, 2].filter((i) => Math.floor(t / 3) % 4 > i).map((i) => ({ ch: 'dot', col: 25 + i * 3, row: -2, color: STEAM })),
  }),
  // A jump, then frozen staring. Told from `needs` by the ring eyes in the
  // robot's own colour, the o mouth, no `!`, and holding still after the
  // start rather than waving.
  surprised: (t) => {
    const q = t % 24, jump = q < 2, startled = q < 6;
    const glyphs = startled ? [
      { ch: 'burstL', col: 3, row: 0, color: STEAM }, { ch: 'dot', col: 1, row: 4, color: STEAM },
      { ch: 'burstR', col: 27, row: 0, color: STEAM }, { ch: 'dot', col: 29, row: 4, color: STEAM },
    ] : [];
    return {
      dy: [-4, -2][q] ?? 0,
      walker: { arms: startled ? ['up-out', 'up-out'] : ['swing', 'swing'], legs: [jump, jump] }, // thrown up, then hands out, frozen
      tank: { arms: startled ? [[true, true], [true, true]] : [[false, true], [false, true]], roll: 0 },
      ball: { slide: 0 },
      float: { poses: startled ? ['up', 'up'] : ['out', 'out'], dy: [-4, -2][q] ?? 0 },
      light: startled ? STEAM : DIM, chest: { lit: jump ? 3 : -1, on: STEAM },
      mouth: [...cellsOf(7, 15, 16, 'm')], // an o
      glyphs,
    };
  },
  destroyed: (t) => {
    const glyphs = [];
    // smoke off the crack, two puffs taking turns, grey and thinning out
    for (const off of [0, 8]) {
      const q = (t + off) % 16;
      glyphs.push({ ch: q < 6 ? 'puff' : 'cloud', col: 18 + Math.floor(q / 4), row: 1 - Math.floor(q / 2), color: SMOKE, opacity: 1 - q / 16 });
    }
    if (t % 7 === 3) glyphs.push({ ch: 'spark', col: 25, row: 3, color: SPARK });
    if (t % 11 === 8) glyphs.push({ ch: 'spark', col: 4, row: 9, color: SPARK });
    const twitch = t % 20 === 0;
    return {
      dy: twitch ? 0 : 1, // slumped, but it twitches
      walker: { arms: ['down', 'gone'], legs: [false, false] },
      tank: { arms: [[false, true], 'gone'], roll: 0 },
      ball: { slide: 0 },
      float: { poses: ['down', 'gone'], plume: t % 9 === 4 ? 'on' : 'off', dy: 2 }, // grounded; the plume coughs
      eye: twitch ? RED : t % 13 === 5 ? '#1d2021' : '#bdae93', // grey X eyes that flicker
      light: t % 9 === 4 ? SPARK : '#3c3836', chest: { lit: -1, on: SPARK },
      mouth: [], glyphs, broken: true,
    };
  },
};
/* A hop with a wind-up, shared by the attention hop and `celebrate`: rest,
   crouch, take-off, two ticks in the air, falling, a squashed landing, rest.
   The crouch and the landing squash the robot a row: everything above the
   feet (or the ball's lower half) drops a row onto them. `arms` is generic --
   down, back, up, out -- and each build maps it to its own poses. */
const HOP = [
  { dy: 0, arms: 'down' },
  { dy: 0, arms: 'back', squash: true },
  { dy: -3, arms: 'up' },
  { dy: -6, arms: 'up', tuck: true },
  { dy: -7, arms: 'up', tuck: true },
  { dy: -4, arms: 'up' },
  { dy: 0, arms: 'out', squash: true },
  { dy: 0, arms: 'down' },
];
const HOP_ARMS = {
  walker: { down: 'down', back: 'swing', up: 'up-out', out: 'swing', cheer: 'up-in' },
  tank: { down: [false, false], back: [false, true], up: [true, true], out: [false, true], cheer: [true, false] },
  float: { down: 'down', back: 'tuck', up: 'up', out: 'out', cheer: 'up' },
};
// Everything a build's hop pose needs, as the STATES entries expect it.
const hopPose = (p, extra = {}) => ({
  dy: p.dy, squash: p.squash, ...extra,
  walker: { arms: [HOP_ARMS.walker[p.arms], HOP_ARMS.walker[p.arms]], legs: [!!p.tuck, !!p.tuck] },
  tank: { arms: [HOP_ARMS.tank[p.arms], HOP_ARMS.tank[p.arms]], roll: 0 },
  ball: { slide: 0 },
  float: { poses: [HOP_ARMS.float[p.arms], HOP_ARMS.float[p.arms]], plume: p.dy < 0 && p.dy > -5 ? 'wide' : p.squash ? 'off' : 'on', dy: p.dy },
});
const squash = (g, build) => {
  const last = build === 'ball' ? 10 : 13;
  for (let y = last; y >= 1; y--) g[y] = g[y - 1];
  g[0] = Array(32).fill('.');
};

// Confetti: a burst of single-pixel glyphs from above the crown at tick
// `t0` -- where the crown is at the top of a hop -- thrown mostly outward
// (the frame ends five rows above the antenna, so not far up) and
// falling back past the robot. It shows from two ticks on, once it has
// spread, so it never clumps on the head, and is gone 12 ticks after. Each
// piece flips between a tall and a wide pixel as it tumbles.
const CONFETTI = ['#8ec07c', '#fabd2f', '#fe8019', '#d3869b', '#83a598', '#fb4934'];
const confetti = (t, t0, seed = 0) => {
  const k = t - t0;
  if (k < 2 || k > 12) return [];
  return Array.from({ length: 12 }, (_, i) => {
    const vx = (i - 5.5) * 0.5, vy = -0.3 - ((i + seed) % 3) * 0.3;
    const col = Math.round(15.5 + vx * k), row = Math.round(-3 + vy * k + 0.18 * k * k);
    return { ch: (i + k) % 2 ? 'bit' : 'bitw', col, row, color: CONFETTI[(i + seed) % 6], opacity: k > 8 ? 1 - (k - 8) / 5 : 1 };
  }).filter((p) => p.row <= 16 && p.col >= -2 && p.col <= 33);
};
Object.assign(GLYPHS, { bit: ['#'], bitw: ['##'] });

// `needs` (alert), reworked: the same yellow eyes, flashing lights and `!`,
// but every build hops with a wind-up every 12 ticks instead of waving in
// place (or, for the ball, bouncing without one). Arms wave between hops.
// This replaces core's `needs`, so the fidelity check leaves it out.
STATES.needs = (t) => {
  const k = t % 12, p = HOP[Math.min(k, 7)];
  const pose = hopPose(p, {
    eye: LIGHT_NEEDS, light: t % 2 ? DIM : LIGHT_NEEDS, chest: { lit: t % 2 ? -1 : 3, on: LIGHT_NEEDS }, mouth: [],
    glyphs: t % 6 < 4 ? [{ ch: '!', col: 27, row: -3, color: LIGHT_NEEDS }] : [],
  });
  if (k >= 8) pose.walker.arms = t % 2 ? ['up-out', 'up-in'] : ['up-in', 'up-out'];
  return pose;
};

// Done: happy eyes, hopping on a loop -- a hop with a burst of confetti at
// each take-off, then a cheer, every 12 ticks. The last burst is still
// falling when the next one goes up.
STATES.celebrate = (t) => {
  const k = t % 12, n = Math.floor(t / 12), at = t - k + 2;
  const glyphs = [...confetti(t, at - 12, (n + 2) % 3), ...confetti(t, at, n % 3)];
  const base = { light: t % 2 ? '#8ec07c' : DIM, chest: { lit: t % 3, on: '#8ec07c' }, mouth: [[7, 13, 'T'], ...cellsOf(7, 14, 17, 'm'), [7, 18, 'T']], glyphs };
  if (k < 8) return hopPose(HOP[k], base);
  const p = hopPose(HOP[0], base); // cheer: arms alternating overhead, claws snapping
  p.walker.arms = t % 2 ? ['up-out', 'up-in'] : ['up-in', 'up-out'];
  p.tank.arms = [[true, t % 2 === 0], [true, t % 2 === 1]];
  p.float.poses = ['up', 'up'];
  return p;
};

// The states that are new, rather than reworked from core's.
export const MOOD_STATES = Object.keys(STATES).filter((s) => s !== 'needs');

// A dent in the shell and a crack down the screen, the head knocked a column
// off the body, and the antenna bent over. Only cells that are already head
// crack, so it follows any head shape.
const breakHead = (g) => {
  for (const [y, x, c] of [[2, 18, 'd'], [3, 17, 'd'], [4, 17, 'c'], [5, 16, 'c'], [6, 16, 'c'], [7, 15, 'c']]) if (g[y][x] !== '.') g[y][x] = c;
  for (let y = 0; y <= 9; y++) { g[y].unshift('.'); g[y].pop(); }
  g[0].unshift('.'); g[0].pop();
};

function moodRobot(traits, state, tick, opts) {
  const o = { ...DEFAULTS, antenna: traits.antenna, ears: traits.ears, chest: traits.chest, ...opts };
  const build = traits.build;
  const base = { ...traits, antenna: 'none', ears: 'none', build: build === 'float' ? 'walker' : build };
  const frame = folkFrame(base, 'waiting', 0);
  const g = frame.grid;
  const t = tick + (traits.phase ?? 0);
  const s = STATES[state](t);
  frame.dy = s.dy;
  frame.glyphs = s.glyphs;
  let poses = null;
  if (build === 'float') ({ dy: frame.dy, poses } = floatBody(g, o, state, t, s.float));
  else if (build === 'ball') ballChest(g, o.chest, s.ball.slide);
  else {
    clearLimbs(g, build);
    paintFrontChest(g, o.chest, SPAN[build]);
    if (build === 'tank') tread(g, s.tank.roll);
    else { walkerLeg(g, -1, s.walker.legs[0]); walkerLeg(g, 1, s.walker.legs[1]); }
  }
  paintHead(g, HEADS[o.head], o, base.build);
  // arms after the head, as core does, so a raised one covers the ear
  if (poses) { arm(g, -1, poses[0]); arm(g, 1, poses[1]); }
  if (build === 'walker') { walkerArm(g, -1, s.walker.arms[0]); walkerArm(g, 1, s.walker.arms[1]); }
  if (build === 'tank') { tankArm(g, -1, s.tank.arms[0]); tankArm(g, 1, s.tank.arms[1]); }

  const spans = HEADS[o.head];
  const onScreen = (y, x) => { const [a, b] = screenAt(spans, y); return y >= SCREEN_ROWS[0] && y <= SCREEN_ROWS[1] && x >= a && x <= b; };
  for (let y = 4; y <= 7; y++) for (let x = 0; x < 32; x++) if ('ewlmTU'.includes(g[y][x])) g[y][x] = 'v';
  const look = s.look ?? 0;
  for (const [y, x, c] of FACES[state](o.eyes, t)) if (onScreen(y, x + look)) g[y][x + look] = c;
  for (const [y, x, c] of s.mouth) if (onScreen(y, x)) g[y][x] = c;
  if (s.broken) breakHead(g);
  if (s.squash) squash(g, build);
  if (s.dx) for (const cells of g) { if (s.dx > 0) { cells.unshift('.'); cells.pop(); } else { cells.shift(); cells.push('.'); } }

  const colors = folkColors(base, 'waiting', s.light, -1);
  colors.e = colors.m = s.eye ?? EYE_COLORS[o.eyeColor];
  colors.a = s.light;
  for (const i of [0, 1, 2]) colors[i + 1] = s.chest.lit === 3 || s.chest.lit === i ? s.chest.on : '#3c3836';
  colors.c = '#665c54';
  if (s.broken) colors.h = traits.body[1]; // scorched: the shine is gone
  return { frame, colors };
}

/* ---------------- assemble ---------------- */
const DEFAULTS = { head: 'box', eyes: 'wide', mouth: 'line', eyeColor: 'green' };
/* `opts` overrides any axis for one drawing; the three the package already
   seeds -- antenna, ears, chest -- default to the trait. Core is asked for a
   robot with no antenna and no ears, and its chest panel is repainted, so all
   three lists go through this file's tables whatever the option is. */
export function robot(traits, state = 'active', tick = 1, opts = {}) {
  if (STATES[state]) return moodRobot(traits, state, tick, opts);
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


export const eachRect = (frame, colors, fn) => {
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
  for (const gl of frame.glyphs) glyphRects(gl, (x, y, w, h) => rects.push(`<rect x="${x}" y="${y}" width="${w + 0.02}" height="${h + 0.02}" fill="${gl.color}" opacity="${(gl.opacity ?? 1).toFixed(2)}"/>`));
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
  // `needs` is reworked (it hops), so only `active` and `waiting` are held to core.
  for (const tr of cases) for (const st of ['active', 'waiting']) for (let tick = 0; tick < 30; tick++) {
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
  console.log(bad === 0 ? 'fidelity: defaults match core exactly (the dome antenna and the alert hop are reworked)' : `fidelity: ${bad} mismatching frames`);
}

const SECTIONS = [
  { name: 'builds', note: 'walker, tank, ball &mdash; and <b>float</b>: a small pod flush to the head, arms, no legs, a plume beneath, and a constant bob instead of a walk cycle.',
    cols: ['active', 'active (next tick)', 'needs', 'idle'],
    rows: [['walker', W()], ['tank', TANK], ['ball', BALL], ['float', FLOAT]].map(([n, tr]) => [n, [
      robot(tr, 'active', 1), robot(tr, 'active', 3), robot(tr, 'needs', 4), robot(tr, 'waiting', 0)]]) },
  { name: 'head shape', note: 'The screen is inset 2 from the outline and clamped to x&nbsp;9&ndash;22, so it follows a tapering head. <code>box</code> renders exactly as today.',
    cols: ['walker', 'tank', 'ball', 'float', 'dome antenna', 'idle'],
    rows: Object.keys(HEADS).map((h) => [h, [
      robot(W(), 'active', 1, { head: h }), robot(TANK, 'active', 1, { head: h }), robot(BALL, 'active', 1, { head: h }),
      robot(FLOAT, 'active', 1, { head: h }), robot(W({ antenna: 'dome' }), 'active', 1, { head: h }), robot(W(), 'waiting', 0, { head: h })]]) },
  { name: 'eyes', note: 'All four fit inside the screen, so they work on every build and every head shape.',
    cols: ['active', 'looking', 'needs', 'idle', 'on cone', 'on float'],
    rows: Object.keys(EYES).map((e) => [e, [
      robot(W(), 'active', 1, { eyes: e }), robot(W(), 'active', 13, { eyes: e }), robot(W(), 'needs', 4, { eyes: e }),
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
      robot(FLOAT, 'active', 1, { eyeColor: c }), robot(W(), 'needs', 4, { eyeColor: c })]]) },
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
      robot(W(), 'needs', 4, { ears: e }), robot(TANK, 'needs', 4, { ears: e })]]) },
  { name: 'chest', note: 'Row 12, x&nbsp;12&ndash;19 on every build; on the ball it becomes a marking that slides round the waist (the two ball columns are ticks 1 and 7). <code>stripe</code> runs the full width of the body, outline included, so it wraps round like the ball&rsquo;s ring. <code>zigzag</code> takes the same span as a dark square wave in half-height cells. <code>tuxedo</code> is a V-neck over rows 11&ndash;12, and the one marking that stays centred on the ball. <code>none</code>, <code>stripe</code>, <code>zigzag</code> and <code>tuxedo</code> carry no lights, so they sit out the chase while working and the flash on <code>needs</code>.',
    cols: ['walker', 'chase, next', 'tank', 'ball', 'ball, slid', 'float', 'needs'],
    rows: Object.keys(CHESTS).map((c) => [c, [
      robot(W(), 'active', 1, { chest: c }), robot(W(), 'active', 3, { chest: c }), robot(TANK, 'active', 1, { chest: c }),
      robot(BALL, 'active', 1, { chest: c }), robot(BALL, 'active', 7, { chest: c }), robot(FLOAT, 'active', 1, { chest: c }),
      robot(W(), 'needs', 4, { chest: c })]]) },
  { name: 'states', note: 'Core&rsquo;s three (alert reworked to hop), then six new ones. Every state has to read on every build and with every eye shape: the ball has no arms, so each says what the ball does instead. The live versions are at the top of the page.',
    cols: ['walker', 'next beat', 'tank', 'ball', 'float', 'dot eyes', 'slant eyes', 'visor', 'on cone'],
    rows: [['working', 'active', 1, 3], ['alert', 'needs', 1, 4], ['idle', 'waiting', 0, 8], ['angry', 'angry', 0, 1], ['confused', 'confused', 0, 14], ['thinking', 'thinking', 6, 12], ['surprised', 'surprised', 0, 8], ['destroyed', 'destroyed', 1, 3], ['celebrate', 'celebrate', 4, 15]]
      .map(([label, st, a, b]) => [label, [
        robot(W(), st, a), robot(W(), st, b), robot(TANK, st, a), robot(BALL, st, a), robot(FLOAT, st, a),
        robot(W({ body: B(3) }), st, a, { eyes: 'dot' }), robot(W({ body: B(6) }), st, a, { eyes: 'slant' }),
        robot(W({ body: B(2) }), st, a, { eyes: 'visor' }), robot(W({ body: B(4), antenna: 'twin' }), st, a, { head: 'cone' })]]) },
  { name: 'hop, tick by tick', note: 'The hop with a wind-up, as alert (<code>needs</code>) and <code>celebrate</code> both use it every 12 ticks. The crouch and the landing squash the robot a row onto its feet (the ball onto its lower half); the take-off and the fall are the frames either side of the apex. Arms follow a generic pose each build maps to its own.',
    cols: ['rest', 'crouch', 'take-off', 'air', 'apex', 'falling', 'landing', 'rest'],
    rows: [['walker', W()], ['tank', TANK], ['ball', BALL], ['float', FLOAT]].map(([n, tr]) => [n, HOP.map((_, k) => robot(tr, 'needs', k))]) },
  { name: 'celebrate, tick by tick', note: 'One 12-tick loop: a hop with a burst of confetti at take-off, then a cheer with arms alternating overhead. The previous burst is still falling as the next goes up.',
    cols: ['0 rest', '1 crouch', '2 take-off', '4 apex', '6 land', '8 cheer', '9', '11', '14 (next)'],
    rows: [['walker', W()], ['tank', TANK], ['ball', BALL], ['float', FLOAT]].map(([n, tr]) => [n, [0, 1, 2, 4, 6, 8, 9, 11, 14].map((k) => robot(tr, 'celebrate', k))]) },
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

// States, playing. Every live cell is 24 ticks of rects -- "x y w h colour
// opacity" per rect, colours indexed into one palette -- which a few lines
// of script at the bottom of the page step through at core's tick rate.
const livePalette = [], liveFrames = [];
const liveTable = (name, note, cols, rows) => {
  const ix = (c) => { let i = livePalette.indexOf(c); if (i < 0) { i = livePalette.length; livePalette.push(c); } return i; };
  html += `<h2>${name}</h2><p class="note">${note}</p><table><tr><th></th>${cols.map(([n]) => `<th>${n}</th>`).join('')}</tr>`;
  for (const [n, st, ro, frames = 24] of rows) {
    html += `<tr><td>${n}</td>`;
    for (const [, tr, co] of cols) {
      liveFrames.push(Array.from({ length: frames }, (_, tick) => {
        const { frame, colors } = robot(tr, st, tick, { ...co, ...ro });
        const out = [];
        eachRect(frame, colors, (x, y, w, h, fill) => out.push(`${x} ${y} ${w} ${h} ${ix(fill)} 1`));
        for (const gl of frame.glyphs) glyphRects(gl, (x, y, w, h) => out.push(`${x} ${y} ${w} ${h} ${ix(gl.color)} ${+(gl.opacity ?? 1).toFixed(2)}`));
        return out.join(',');
      }));
      html += `<td><svg class="live" data-i="${liveFrames.length - 1}" viewBox="${FOLK_VIEWBOX.join(' ')}" width="104" shape-rendering="crispEdges"></svg></td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
};
liveTable('states, live', 'Core&rsquo;s three, with alert reworked to hop, then the six new ones, on every build and two other faces. Stills and the reasoning are in the <b>states</b> section below and in <code>plan.md</code>.',
  [['walker', W()], ['tank', TANK], ['ball', BALL], ['float', FLOAT], ['visor', W({ body: B(2) }), { eyes: 'visor' }], ['dot, cone', W({ body: B(4), antenna: 'twin' }), { eyes: 'dot', head: 'cone' }]],
  [['working', 'active'], ['alert', 'needs'], ['idle', 'waiting'], ...MOOD_STATES.map((s) => [s, s])]);
html += `<script>
const P=${JSON.stringify(livePalette)},F=${JSON.stringify(liveFrames)};
const draw=(s,f)=>{s.innerHTML=f.split(',').map((q)=>{const[x,y,w,h,c,o]=q.split(' ');return '<rect x="'+x+'" y="'+y+'" width="'+(+w+0.02)+'" height="'+(+h+0.02)+'" fill="'+P[c]+'" opacity="'+o+'"/>';}).join('');};
const svgs=[...document.querySelectorAll('svg.live')];let t=0;
const step=()=>{for(const s of svgs)draw(s,F[s.dataset.i][t%F[s.dataset.i].length]);t++;};
step();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(step,${FOLK_TICK_MS});
</script>`;
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
      eachRect(frame, colors, (x, y, w, h, fill) => { if (y >= -10 && y < 34) paint(ox + x, oy + y, w, h, fill); }); // clipped to the cell
      for (const gl of frame.glyphs) glyphRects(gl, (x, y, w, h) => { if (y >= -10 && y < 34 && x >= -2 && x < 34) paint(ox + x, oy + y, w, h, gl.color, gl.opacity ?? 1); });
    });
    row++;
  }
  gi++;
}
writeFileSync(`${OUT}/prototype.png`, await encodePng({ width, height, data }));
console.log('ok', SECTIONS.length, 'sections,', rowsAll.length, 'rows');
