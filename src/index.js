/* bot-avatar: seeded pixel-robot avatars.

   This module is pure: seeds and traits in, frames and SVG strings out. It
   touches no globals, so it runs in Node, workers and at build time. Mounting
   robots into a page and animating them is in ./dom.js.

   Each agent gets a robot drawn on a 32x16 grid of "terminal pixels": one
   pixel is half a character cell, so it's twice as tall as it is wide, like
   block-character art in a terminal. The project path seeds its paint,
   body type, antenna, ears and chest panel.

   On the dashboard a robot faces you and its state picks the animation:
     working   -- walks in place with arms swinging (a tank rolls its treads
                  and snaps its claws, a ball slides its markings along), looks
                  around, talks, chest lights chasing, antenna blinking aqua
     idle      -- eyes shut, slow breathing, z's drifting up
     needs you -- big yellow eyes, both arms up (a ball bounces), a blinking "!"

   Sprites: every robot can also be drawn facing front, back, left or right,
   in a 4-frame walk cycle (botWalkFrame), and painted onto a canvas for a
   sprite sheet (paintBotSheet).

   Animations advance one tick every BOT_TICK_MS. */
export const BOT_TICK_MS = 160;
export const BOT_W = 32;
export const BOT_H = 16;
// [highlight, base, shade] -- lit from the top left.
export const BOT_BODIES = [
  ['#ffa95e', '#fe8019', '#af3a03'], ['#e9b0c0', '#d3869b', '#8f3f71'],
  ['#a9c6ba', '#83a598', '#076678'], ['#fbf1c7', '#d5c4a1', '#7c6f64'],
  ['#ff8474', '#fb4934', '#9d0006'], ['#dcde5c', '#b8bb26', '#79740e'],
  ['#928374', '#7c6f64', '#504945'],
];
export const BOT_BODY_NAMES = ['Orange', 'Pink', 'Blue', 'Cream', 'Red', 'Lime', 'Dark gray'];
// Every part a robot can be built from; the seed picks one of each.
export const BOT_PARTS = {
  build: ['walker', 'tank', 'ball'],
  antenna: ['mast', 'twin', 'dome'],
  ears: ['bolt', 'fin', 'none'],
  chest: ['lights', 'core', 'grille'],
};
// What to call each part option in the UI.
export const BOT_PART_NAMES = {
  build: { walker: 'Walker', tank: 'Tank', ball: 'Ball' },
  antenna: { mast: 'Mast', twin: 'Twin stalks', dome: 'Dome light' },
  ears: { bolt: 'Bolt lights', fin: 'Fins', none: 'No ears' },
  chest: { lights: 'Three lights', core: 'Single light', grille: 'Grille' },
};
export const BOT_VIEWS = ['front', 'back', 'left', 'right'];
export const BOT_STATES = ['active', 'needs', 'waiting'];
// Pixel glyphs that float beside a robot, drawn in the same tall pixels as the
// robot and snapped to its grid ('#' = pixel).
const BOT_GLYPHS = {
  '!': ['##', '##', '##', '..', '##'],
  z: ['####', '..#.', '.#..', '####'],
  Z: ['#####', '..##.', '.##..', '#####'],
};
export const BOT_WALK_FRAMES = 4;
const LIGHT = { active: '#8ec07c', needs: '#fabd2f', waiting: '#665c54' };
const LIGHT_OFF = '#3c3836';

function seededRandom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The robot for `seed` (a project path). `overrides` holds any parts picked
 *  by hand -- { body: 'Blue', build: 'tank', ... } -- which win over the
 *  seed's picks; values it doesn't recognize are ignored. */
export function botTraits(seed, overrides = null) {
  const traits = seededTraits(seed);
  if (!overrides) return traits;
  const paint = BOT_BODY_NAMES.indexOf(overrides.body);
  if (paint >= 0) traits.body = BOT_BODIES[paint];
  for (const part of Object.keys(BOT_PARTS)) {
    if (BOT_PARTS[part].includes(overrides[part])) traits[part] = overrides[part];
  }
  return traits;
}

function seededTraits(seed) {
  const r = seededRandom(String(seed));
  const pick = (list) => list[Math.floor(r() * list.length)];
  const body = pick(BOT_BODIES);
  const antenna = pick(BOT_PARTS.antenna);
  const ears = pick(BOT_PARTS.ears);
  r(); // this draw used to pick the eye shape; kept so existing robots keep their chest
  const chest = pick(BOT_PARTS.chest);
  const phase = Math.floor(r() * 40); // so a row of bots doesn't move in lockstep
  const build = pick(BOT_PARTS.build); // drawn last so adding it didn't change the other parts
  return { body, build, antenna, ears, chest, phase };
}

/* Grid chars:
 *  h/#/d  body highlight, base, shade     v visor   g visor glare
 *  e eye  w eye glint  l shut eyelid  m mouth  a antenna/ear light
 *  1 2 3  chest lights   k tread   n tread gap / ball seam   o wheel hub */

/** A blank grid plus drawing helpers for every body part, from any side.
 *  "side" pieces are drawn facing right; a left view mirrors the whole grid. */
function botPieces(traits) {
  const g = Array.from({ length: BOT_H }, () => Array(BOT_W).fill('.'));
  const set = (y, x, c) => { if (y >= 0 && y < BOT_H && x >= 0 && x < BOT_W) g[y][x] = c; };
  const row = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) set(y, x, c); };
  const mirror = (x) => BOT_W - 1 - x;
  const both = (y, x, c) => { set(y, x, c); set(y, mirror(x), c); };
  const tank = traits.build === 'tank';
  const ballBody = traits.build === 'ball';

  // ---------- head ----------
  // Rounded box, highlight on the top and left edges, shade on the right and
  // bottom. Front: a dark screen for a face. Back: a vent plate. Side: a
  // narrower box with the screen wrapping round the front edge.
  const head = (view) => {
    if (view === 'side') {
      row(2, 11, 20, 'h');
      set(3, 10, 'h'); row(3, 11, 21, '#');
      for (let y = 4; y <= 7; y++) { set(y, 10, 'h'); row(y, 11, 16, '#'); row(y, 17, 20, 'v'); set(y, 21, 'd'); }
      set(4, 17, '#'); set(7, 17, '#');
      set(4, 18, 'g');
      set(8, 10, 'h'); row(8, 11, 20, '#'); set(8, 21, 'd');
      row(9, 11, 20, 'd');
      if (traits.ears === 'bolt') { set(5, 13, 'd'); set(6, 13, 'd'); set(5, 14, 'a'); set(6, 14, 'a'); set(5, 15, 'd'); set(6, 15, 'd'); }
      if (traits.ears === 'fin') { for (let y = 4; y <= 7; y++) row(y, 13, 14, 'd'); set(5, 12, 'd'); set(6, 12, 'd'); }
      if (traits.antenna === 'mast' || traits.antenna === 'twin') { set(0, 15, 'a'); set(1, 15, '#'); if (traits.antenna === 'mast') { set(0, 16, 'a'); set(1, 16, '#'); } }
      if (traits.antenna === 'dome') { row(0, 14, 17, 'a'); row(1, 12, 19, '#'); }
      return;
    }
    row(2, 8, 23, 'h');
    set(3, 7, 'h'); row(3, 8, 24, '#');
    for (let y = 4; y <= 7; y++) { set(y, 7, 'h'); set(y, 8, '#'); row(y, 9, 22, view === 'back' ? '#' : 'v'); set(y, 23, '#'); set(y, 24, 'd'); }
    if (view === 'back') {
      for (const [y, x] of [[4, 10], [4, 21], [7, 10], [7, 21]]) set(y, x, 'd'); // screws
      for (let x = 12; x <= 19; x++) if (x % 2 === 0) { set(5, x, 'd'); set(6, x, 'd'); } // vent
    } else {
      both(4, 9, '#'); both(7, 9, '#');
      set(4, 10, 'g'); set(4, 11, 'g');
    }
    set(8, 7, 'h'); row(8, 8, 23, '#'); set(8, 24, 'd');
    row(9, 8, 23, 'd');
    if (traits.ears === 'bolt') for (const y of [5, 6]) { both(y, 6, 'd'); both(y, 5, 'a'); }
    if (traits.ears === 'fin') { for (let y = 4; y <= 7; y++) both(y, 6, 'd'); both(5, 5, 'd'); both(6, 5, 'd'); }
    if (traits.antenna === 'mast') { row(0, 15, 16, 'a'); row(1, 15, 16, '#'); }
    if (traits.antenna === 'twin') { both(0, 10, 'a'); both(1, 10, '#'); }
    if (traits.antenna === 'dome') { row(0, 14, 17, 'a'); row(1, 12, 19, '#'); }
  };

  // Eyes: left eye columns, mirrored for the right one.
  const eyeCols = [11, 12, 13];
  const eyes = (rows, ch, dx = 0) => {
    for (const y of rows) for (const x of eyeCols) { set(y, x + dx, ch); set(y, mirror(x) + dx, ch); }
    if (ch === 'e') { set(rows[0], eyeCols[0] + dx, 'w'); set(rows[0], mirror(eyeCols[eyeCols.length - 1]) + dx, 'w'); }
  };
  // From the side only the near eye shows, at the front of the screen.
  const sideEye = () => { set(4, 19, 'w'); set(4, 20, 'e'); set(5, 19, 'e'); set(5, 20, 'e'); };

  // ---------- torso ----------
  // A walker is slim and hangs from a neck; a tank is broad and its body runs
  // straight up into the head. A ball has no torso -- see ball() below.
  const torso = (view) => {
    if (ballBody) return;
    if (view === 'side') {
      const [t0, t1] = tank ? [10, 21] : [11, 20];
      if (tank) { set(10, t0, 'h'); row(10, t0 + 1, t1, '#'); }
      else row(10, 14, 17, 'd');
      set(11, t0, 'h'); row(11, t0 + 1, t1, '#');
      set(12, t0, 'h'); row(12, t0 + 1, t1 - 1, '#'); set(12, t1, 'd');
      row(13, t0, t1, 'd');
      set(12, t1, 'v'); // edge of the chest panel
      return;
    }
    const [t0, t1] = tank ? [7, 24] : [9, 22];
    if (tank) { set(10, t0, 'h'); row(10, t0 + 1, t1, '#'); }
    else row(10, 13, 18, 'd');
    set(11, t0, 'h'); row(11, t0 + 1, t1, '#');
    set(12, t0, 'h'); row(12, t0 + 1, t1 - 1, '#'); set(12, t1, 'd');
    row(13, t0, t1, 'd');
    if (view === 'back') { row(12, 13, 18, 'd'); return; } // battery pack
    if (traits.chest === 'lights') { row(12, 12, 19, 'v'); set(12, 13, '1'); row(12, 15, 16, '2'); set(12, 18, '3'); }
    if (traits.chest === 'core') { row(12, 14, 17, 'v'); row(12, 15, 16, '2'); }
    if (traits.chest === 'grille') for (let x = 12; x <= 19; x++) set(12, x, x % 2 ? 'd' : 'v');
  };

  // ---------- walker limbs ----------
  // Front/back: drawn for the left side and mirrored for the right.
  const walkerArm = (side, pose) => {
    const S = (y, x, c) => set(y, side < 0 ? x : mirror(x), c);
    S(11, 8, '#');
    if (pose === 'down') { S(11, 7, '#'); S(12, 7, '#'); S(13, 7, 'd'); S(14, 6, 'd'); S(14, 7, 'd'); }
    if (pose === 'swing') { S(11, 7, '#'); S(12, 7, '#'); S(13, 6, 'd'); S(13, 5, 'd'); }
    if (pose === 'up-out') { S(11, 7, '#'); S(10, 6, '#'); S(9, 5, '#'); S(8, 4, '#'); S(7, 3, 'd'); S(7, 4, 'd'); }
    if (pose === 'up-in') { S(11, 7, '#'); S(10, 6, '#'); S(9, 5, '#'); S(8, 5, '#'); S(7, 5, 'd'); S(7, 6, 'd'); }
  };
  const walkerLeg = (side, lifted) => {
    const S = (y, x, c) => set(y, side < 0 ? x : mirror(x), c);
    if (lifted) { S(14, 11, '#'); S(14, 12, '#'); S(14, 13, '#'); return; }
    S(14, 12, 'd'); S(14, 13, 'd'); S(15, 11, '#'); S(15, 12, '#'); S(15, 13, '#');
  };
  // Side: the far leg is drawn in shade behind the near one, and the near arm
  // swings against the near leg, clear of the body so it reads.
  // stride: -1 near leg back, 0 passing, 1 near leg forward.
  const sideWalkerLimbs = (stride) => {
    const leg = (at, near) => {
      const x = { back: 12, mid: 15, front: 18 }[at];
      const c = near ? '#' : 'd';
      set(14, x, c); set(14, x + 1, c);
      row(15, x, x + 2, c);
    };
    if (stride === 0) leg('mid', true);
    else {
      leg(stride > 0 ? 'back' : 'front', false);
      leg(stride > 0 ? 'front' : 'back', true);
    }
    set(11, 15, 'd'); // shoulder
    if (stride === 0) { set(12, 15, 'd'); set(13, 15, 'h'); } // hanging straight down
    else if (stride > 0) { set(12, 10, 'd'); set(13, 9, 'h'); } // swung back
    else { set(12, 21, 'd'); set(13, 22, 'h'); } // swung forward
  };

  // ---------- tank limbs ----------
  // Front/back: stubby arms ending in pincer claws, and a tread instead of legs.
  const tankArm = (side, up, open) => {
    const S = (y, x, c) => set(y, side < 0 ? x : mirror(x), c);
    const claw = (y) => { S(y, 3, 'd'); S(y, 5, 'd'); if (!open) S(y, 4, 'd'); S(y + 1, 3, 'h'); S(y + 1, 5, 'h'); };
    S(11, 6, '#');
    if (up) { S(10, 5, '#'); S(9, 4, '#'); S(8, 4, '#'); claw(6); }
    else { S(11, 5, '#'); S(11, 4, '#'); claw(12); }
  };
  const tread = (roll, every = 3) => {
    row(14, 6, 25, 'k');
    for (const x of [8, 12, 19, 23]) set(14, x, 'o'); // wheel hubs
    row(15, 5, 26, 'k');
    for (let x = 5; x <= 26; x++) if ((x + roll) % every === 0) set(15, x, 'n'); // gaps between tread plates
  };
  // Side: one arm reaching forward with its claw, and the long side of the
  // tread, whose underside runs backward as the tank drives forward.
  const sideTankLimbs = (roll, open) => {
    row(14, 9, 22, 'k');
    for (const x of [10, 13, 16, 19, 22]) set(14, x, 'o');
    row(15, 8, 23, 'k');
    for (let x = 8; x <= 23; x++) if ((x + roll) % 4 === 0) set(15, x, 'n');
    row(11, 16, 22, 'd'); // arm
    set(10, 23, 'd'); set(12, 23, 'd'); set(10, 24, 'h'); set(12, 24, 'h');
    if (!open) set(11, 24, 'd');
  };

  // ---------- ball ----------
  // A big sphere with the head sitting in front of its top half, like BB-8.
  // It's 22 across by 11 down (pixels are twice as tall as wide, so it's
  // round); above row 10 it only fills cells the head and ears leave empty, so
  // its rim peeks out either side of the head. The shading stays put because
  // the light doesn't move; the chest part becomes markings round its waist
  // -- ring panels with one light, strips of three lights, or grille slits --
  // that slide sideways while it's moving.
  const BALL = { 5: [11, 20], 6: [8, 23], 7: [7, 24], 8: [6, 25], 9: [5, 26], 10: [5, 26],
    11: [5, 26], 12: [6, 25], 13: [7, 24], 14: [8, 23], 15: [11, 20] }; // row: [from, to]
  const BALL_CENTER = { x: 15.5, y: 10 };
  const onBall = (y, x) => { const span = BALL[y]; return y >= 11 && span && x >= span[0] && x <= span[1]; };
  const sphere = (seam) => {
    for (const [y, [x0, x1]] of Object.entries(BALL)) {
      for (let x = x0; x <= x1; x++) if (y >= 10 || g[y][x] === '.') set(+y, x, '#');
    }
    const shade = (y, x, c) => { if (y >= 10 || g[y][x] === '#') set(y, x, c); };
    shade(8, 6, 'h'); shade(9, 5, 'h'); shade(9, 6, 'h'); set(10, 5, 'h'); set(11, 5, 'h');
    shade(9, 26, 'd'); set(11, 26, 'd'); set(12, 25, 'd'); row(13, 23, 24, 'd'); row(14, 20, 23, 'd'); row(15, 15, 20, 'd');
    row(10, seam[0], seam[1], 'n'); // where the head sits on the ball
  };
  const MARKING = { core: ['ddddd', 'd222d', 'ddddd'], lights: ['d1d2d3d'] };
  const stamp = (rows, cx, cy) => {
    const top = Math.round(cy - (rows.length - 1) / 2);
    rows.forEach((cells, i) => {
      const left = Math.round(cx - (cells.length - 1) / 2);
      [...cells].forEach((c, dx) => { if (onBall(top + i, left + dx)) set(top + i, left + dx, c); });
    });
  };
  // Markings slide sideways across the waist: step `n` moves ring panels and
  // light strips `stride` columns (one every 12) and grille slits one column
  // (one every 4), so both patterns come back round in step with each other.
  const ballSlide = (n, seam = [8, 23], stride = 1) => {
    sphere(seam);
    const mod = (a, m) => ((a % m) + m) % m;
    if (traits.chest === 'grille') {
      const [x0, x1] = BALL[12];
      for (let x = x0 + 1; x < x1; x++) if (mod(x - n, 4) === 0) set(12, x, 'd');
      return;
    }
    const first = BALL_CENTER.x + mod(n * stride, 12) - 24;
    for (let cx = first; cx <= BOT_W + 6; cx += 12) stamp(MARKING[traits.chest] || MARKING.core, cx, 12);
  };

  const arms = (pose, flip) => {
    // flip swaps which side does what, so paired poses alternate.
    if (tank) {
      const up = pose === 'up-out' || pose === 'up-in';
      tankArm(-1, up, flip);
      tankArm(1, up, !flip);
    } else {
      const other = { swing: 'down', down: 'swing', 'up-out': 'up-in', 'up-in': 'up-out' }[pose];
      walkerArm(-1, flip ? other : pose);
      walkerArm(1, flip ? pose : other);
    }
  };

  return {
    g, set, row, tank, ballBody,
    head, eyes, sideEye, torso,
    walkerArm, walkerLeg, sideWalkerLimbs,
    tankArm, tread, sideTankLimbs,
    ballSlide, arms,
  };
}

/** Dashboard frame: facing you, animated by state. */
export function botFrame(traits, state, tick) {
  const t = tick + traits.phase;
  const p = botPieces(traits);
  p.head('front');
  p.torso('front');

  let dy = 0;
  let lit = -1; // which chest light is on; 3 = all
  const glyphs = [];

  if (state === 'active') {
    const step = Math.floor(t / 2) % 2;
    if (p.ballBody) {
      p.ballSlide(t);
      dy = t % 4 === 0 ? -1 : 0; // bumps along as it rolls
    } else if (p.tank) {
      p.arms('swing', step === 1);
      p.tread(t % 3); // grooves roll along
      dy = t % 4 === 0 ? -1 : 0; // engine rumble
    } else {
      p.arms('swing', step === 1);
      p.walkerLeg(-1, step === 1);
      p.walkerLeg(1, step === 0);
    }
    const look = [0, 0, 1, 0, 0, -1][Math.floor(t / 6) % 6];
    if (t % 26 === 0) p.eyes([5], 'l', look); // blink now and then
    else p.eyes([4, 5], 'e', look);
    if (t % 4 < 2) p.row(7, 14, 17, 'm'); else p.row(7, 15, 16, 'm');
    lit = Math.floor(t / 2) % 3;
  } else if (state === 'needs') {
    if (p.ballBody) {
      p.ballSlide(0);
      dy = t % 4 < 2 ? -3 : 0; // no arms to wave, so it bounces
    } else {
      p.arms('up-out', Math.floor(t / 2) % 2 === 0);
      if (p.tank) p.tread(0);
      else { p.walkerLeg(-1, false); p.walkerLeg(1, false); }
    }
    p.eyes([4, 5, 6], 'e');
    if (t % 2 === 0) lit = 3;
    if (t % 6 < 4) glyphs.push({ ch: '!', col: 27, row: -3, color: LIGHT.needs });
  } else {
    if (p.ballBody) p.ballSlide(0);
    else if (p.tank) { p.tankArm(-1, false, false); p.tankArm(1, false, false); p.tread(0); }
    else { p.walkerArm(-1, 'down'); p.walkerArm(1, 'down'); p.walkerLeg(-1, false); p.walkerLeg(1, false); }
    p.eyes([5], 'l');
    dy = Math.floor(t / 8) % 2; // slow breathing
    // Two z's take turns drifting up and to the right a pixel at a time: a
    // small one rising off the head, then a big one higher up, fading out.
    for (const offset of [0, 13]) {
      const q = (t + offset) % 26;
      const small = q < 13;
      glyphs.push({
        ch: small ? 'z' : 'Z',
        col: small ? 25 + Math.floor(q / 7) : 27 + Math.floor((q - 13) / 7),
        row: small ? -Math.floor(q / 7) : -5,
        color: '#a89984',
        opacity: small ? 1 : 1 - (q - 13) / 13,
      });
    }
  }

  // Antenna and ear lights: blink aqua while working, flash yellow when it needs you.
  let light = '#504945';
  if (state === 'active' && t % 6 < 3) light = LIGHT.active;
  if (state === 'needs' && t % 2 === 0) light = LIGHT.needs;
  return { grid: p.g, dy, glyphs, light, lit };
}

/** Sprite frame: one step of the walk cycle, facing `view`
 *  ('front' | 'back' | 'left' | 'right'). Frames 0 and 2 are the two
 *  strides, 1 and 3 the passing poses between them. */
export function botWalkFrame(traits, view, frame) {
  const f = ((frame % BOT_WALK_FRAMES) + BOT_WALK_FRAMES) % BOT_WALK_FRAMES;
  const p = botPieces(traits);
  const side = view === 'left' || view === 'right';
  const passing = f % 2 === 1;
  let dy = passing ? -1 : 0; // body rises as a leg passes under it

  p.head(side ? 'side' : view);
  p.torso(side ? 'side' : view);

  if (side) {
    if (p.ballBody) { p.ballSlide(f, [11, 20], 3); dy = 0; }
    else if (p.tank) { p.sideTankLimbs(f, f < 2); dy = f === 0 ? -1 : 0; }
    else p.sideWalkerLimbs(passing ? 0 : f === 0 ? 1 : -1);
    p.sideEye();
  } else {
    if (p.ballBody) {
      // Seen from behind, the markings slide the other way.
      p.ballSlide(view === 'front' ? f : -f, [8, 23], 3);
      dy = 0;
    } else if (p.tank) {
      p.arms('swing', f < 2);
      p.tread(f, 4); // gaps every 4 columns so the cycle loops in 4 frames
      dy = f === 0 ? -1 : 0;
    } else if (passing) {
      p.walkerArm(-1, 'down'); p.walkerArm(1, 'down');
      p.walkerLeg(-1, false); p.walkerLeg(1, false);
    } else {
      p.arms('swing', f === 2);
      p.walkerLeg(-1, f === 0);
      p.walkerLeg(1, f === 2);
    }
    if (view === 'front') p.eyes([4, 5], 'e');
  }

  if (view === 'left') for (const cells of p.g) cells.reverse();
  return { grid: p.g, dy, glyphs: [], light: f < 2 ? LIGHT.active : '#504945', lit: f % 3 };
}

export function botColors(traits, state, light, lit) {
  const on = state === 'needs' ? LIGHT.needs : LIGHT.active;
  const chest = (i) => (lit === 3 || lit === i ? on : LIGHT_OFF);
  return {
    h: traits.body[0], '#': traits.body[1], d: traits.body[2],
    v: '#1d2021', g: '#32302f', e: LIGHT[state], w: '#fbf1c7', l: '#7c6f64',
    m: state === 'needs' ? LIGHT.needs : state === 'active' ? LIGHT.active : '#504945',
    a: light, 1: chest(0), 2: chest(1), 3: chest(2), k: '#665c54', n: '#282828', o: '#a89984',
  };
}

/** Walk a frame's grid as merged horizontal runs: fn(x, y, width, height, color),
 *  in grid units (a pixel is 1 wide, 2 tall). */
export function eachBotRect(frame, colors, fn) {
  frame.grid.forEach((cells, y) => {
    for (let x = 0; x < cells.length; ) {
      const c = cells[x];
      let end = x;
      while (end + 1 < cells.length && cells[end + 1] === c) end++;
      // A shut eye is a thin slit at the bottom of the eye pixel.
      if (c === 'l') fn(x, y * 2 + frame.dy + 1.3, end - x + 1, 0.7, colors[c]);
      else if (c !== '.') fn(x, y * 2 + frame.dy, end - x + 1, 2, colors[c]);
      x = end + 1;
    }
  });
}

function frameSvg(traits, state, frame) {
  const colors = botColors(traits, state, frame.light, frame.lit);
  const rects = [];
  eachBotRect(frame, colors, (x, y, w, h, fill) => {
    const pad = h === 2 ? 0.02 : 0; // overlap runs slightly so no hairlines show between them
    rects.push(`<rect x="${x}" y="${y}" width="${w + pad}" height="${h + pad}" fill="${fill}"/>`);
  });
  // Glyphs sit on the grid (row -1 is just above the antenna) and don't bob with the robot.
  const glyphs = frame.glyphs.map((gl) => {
    const cells = [];
    BOT_GLYPHS[gl.ch].forEach((line, r) => [...line].forEach((c, dc) => {
      if (c === '#') cells.push(`<rect x="${gl.col + dc}" y="${(gl.row + r) * 2}" width="1.02" height="2.02"/>`);
    }));
    return `<g fill="${gl.color}" opacity="${(gl.opacity ?? 1).toFixed(2)}">${cells.join('')}</g>`;
  }).join('');
  return `<svg viewBox="-2 -10 36 44" shape-rendering="crispEdges">${rects.join('')}${glyphs}</svg>`;
}

export function botSvg(traits, state, tick) {
  return frameSvg(traits, state, botFrame(traits, state, tick));
}

export function botWalkSvg(traits, view, frame) {
  return frameSvg(traits, 'active', botWalkFrame(traits, view, frame));
}

/** Paint a sprite sheet onto a canvas: one row per view (front, back, left,
 *  right), one column per walk frame. Each cell is 34 x 34 grid units (the
 *  32-wide robot plus a unit of room on each side for the walk bob), and one
 *  grid unit is `scale` canvas pixels. Transparent background. */
export function paintBotSheet(canvas, traits, scale = 4) {
  const cell = 34;
  canvas.width = BOT_WALK_FRAMES * cell * scale;
  canvas.height = BOT_VIEWS.length * cell * scale;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  BOT_VIEWS.forEach((view, r) => {
    for (let f = 0; f < BOT_WALK_FRAMES; f++) {
      const frame = botWalkFrame(traits, view, f);
      const colors = botColors(traits, 'active', frame.light, frame.lit);
      const ox = f * cell + 1;
      const oy = r * cell + 1;
      eachBotRect(frame, colors, (x, y, w, h, fill) => {
        ctx.fillStyle = fill;
        ctx.fillRect(Math.round((ox + x) * scale), Math.round((oy + y) * scale), Math.round(w * scale), Math.round(h * scale));
      });
    }
  });
  return canvas;
}
