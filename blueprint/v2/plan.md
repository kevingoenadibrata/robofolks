# v2.0.0 plan — more ways for a robot to look

Every idea here obeys two rules:

1. It applies to **every build** (walker, tank, ball). Nothing on hands,
   legs, treads or necks — the ball has none of them.
2. It is **visible from the front**. Nothing on the back plate.

The head (rows 2–9), antenna (rows 0–1), ears (x 5–6, mirrored) and chest
row 12 are the only things all three builds share and that face the camera,
so everything below lives there. Grid coordinates refer to the 32×16 grid in
`src/core.js`; chars are the ones `folkPieces` uses (`h`/`#`/`d` body,
`v` screen, `g` glare, `a` light, `1 2 3` chest lights, `m` mouth).

## 1. Expand existing variations

### Antenna (rows 0–1; has a side-view branch already)

| Option | Drawing |
| --- | --- |
| `none` | Bare head. `ears` already has `none`; this fills the gap. |
| `bulb` | One fat light: row 0 x 14–17 `a`, row 1 x 15–16 `#`. `dome` is the wide version, this is the tall one. |
| `horns` | A small `d` triangle on each outer corner of the crown, tip outboard: row 1 on the corner and the cell inboard of it, row 0 on the corner alone. On a box head that's x 8–9 and x 22–23. Reads differently from `twin` because it's on the corners, not inboard. |
| `bar` | One `a` light the full width of the crown, row 1 — x 8–23 on a box head. `dome` unclamped: a light bar rather than a lamp, and the only option as wide as the head. Its two end cells are half-height (`A`, see Mouth), so the top corners come off and the ends curve down onto the crown. It never goes narrower than x 10–21, so it stays a bar on a crown as small as `cone`'s. |

Prototyped; all four kept. `dome`, `horns` and `bar` follow the crown so they
stay seated when the head narrows, while the centred ones don't — which is
what leaves `twin` standing clear of `cone`'s point, and what sets `horns`
flanking it. `bulb` and `mast` are the same silhouette and differ only in the
light's width, 4 against 2; they read apart on a robot, but don't narrow
either of them. `horns` is the only antenna with no light in it, so it is the
one that stays quiet while the others blink.

Three things `bar` brings with it. Its chamfer needs a half-height pixel in
the antenna light's colour, so it shares the mechanism the mouths need and
pushes `eachFolkRect`'s new case to read its colour from a table rather than
assume the mouth's. It is the largest lit surface on a robot, so it is also
the most conspicuous when the light is off — a dull slab across the crown
while idle, which reads as switched off and is worth keeping. And it follows the
crown only down to a floor of x 10–21. Without the floor, `cone`'s six-cell
crown gave x 13–18 against `dome`'s x 14–17 — a pixel apart each side, the
same lamp twice. At the floor it overhangs the point instead, cantilevered
over the cone's shoulders: `cone` is the one head where the bar doesn't sit
flush, and the one where it has to be wider than what it stands on.

Prototyped and dropped:

- **`dish`** — a shallow bowl on a stem, row 0 x 13–18 `h` over row 1 x 15–16
  `#`. Cut on review.
- **`propeller`** — row 0 x 12–19 `h` on the same stem, alternating to
  x 14–17 every tick while working. Cut on review. It was the only part in
  this plan whose *shape* moved tick to tick, so dropping it leaves every
  antenna a still and `paintAntenna` needs no state.

### Ears (rows 4–7 at x 4–6, mirrored via `both`)

| Option | Drawing |
| --- | --- |
| `plug` | A T on its side: a stem at rows 5–6 x 5–6 `#`, and a flange standing on its end at rows 4–7 x 4 `d`. |
| `floating` | A half-circle that doesn't touch, and all of it the light `a`: the flat side at rows 4–7 x 5, the curve at x 4 — rows 5–6 full, plus row 4's bottom half and row 7's top half — and x 6, the column against the head, deliberately left empty. |

Prototyped; all four kept. Three things the drawing settled:

- Ears are placed *k* columns outboard of the head outline at their row, not
  at fixed columns, so they step in with `taper`'s jaw instead of drifting
  off. `floating` leaves *k* 1 empty, so its gap survives every head shape.
- The ears go on before the arms, so a raised limb covers the ear it overlaps:
  a tank's claw (rows 6–7, x 3–5) cuts into both of these while it waves.
  That reads as the arm passing in front and needs no special case, but it
  does mean the new ears are at their clearest on a walker.
- `floating` is the only part in the plan not attached to the body, and the
  only ear that needs half-height pixels: its curve is two half cells of the
  light. It costs nothing to draw from the front, but the side and back views
  have to keep the gap or it collapses into another fin. A tapered version was
  drawn first and dropped — pointing outward it is `fin`'s silhouette exactly,
  one column further out.
- Being all light, `floating` is the largest lit area on a robot after the
  `bar` antenna, and it blinks on the same cycle: a pair of pods that glow
  aqua working, flash yellow on `needs`, and go dark grey on the off beat.
  `bolt` is the same signal at two cells; this is the loud version of it.

Prototyped and dropped:

- **`cup`** — headphones: rows 4–7 x 5–6 `d` with an `a` light at rows 5–6
  x 6. Cut on review. Drawn, it read as `bolt` inverted and twice as tall,
  because the light sits on the inboard column.
- **`ring`** — a hollow handle: rows 4 and 7 x 5–6 `d`, rows 5–6 x 4 `d`.
  Cut on review.
### Chest (row 12, x 12–19; the ball gets a `MARKING` entry or a special case like `grille`)

| Option | Front | Ball marking |
| --- | --- | --- |
| `none` | Plain panel. | Bare sphere. |
| `stripe` | A highlight band the full width of the body, outline included: x 9–22 on a walker, 7–24 on a tank, 11–20 on `float`. | A full `h` ring round the waist (slides nicely). |
| `zigzag` | `stripe`'s span, as a square wave in the shade `d`: half-height cells, two on the top half then two on the bottom (`PPQQ…`). | A ring whose wave slides a column a tick. |
| `tuxedo` | A V-neck over rows 11–12: `d` lapels from x 12 and 19, a column inward every half row, meeting at x 15–16 on row 12's bottom half, with an `h` shirt front between them and the body as the jacket. | The same V, centred and still. |

Prototyped; all four kept. The panel is the same row on every build, so each
option needed no per-build case — the ball is the only one that needs its own
form, and `stripe` is a ring there rather than a stamp because a uniform band
has nothing to slide. `stripe` is the one panel not held to x 12–19: it runs
edge to edge, over the outline, so it wraps round the body the way it does
round the ball, and needs the build's row-12 span. It is also the only panel
lighter than the body; every other one is darker, which is what keeps it
apart at a glance.

`zigzag` shares `stripe`'s span but is dark, so the two don't compete. Its
cells are half-height like the mouths', but the other half can't be left
empty on the body — it would punch a hole in the torso — so its two chars
(`P` shade on top, `Q` shade below) fill the other half with the body
colour, and the half-height table grows an optional second colour. A wave
that flips every column was drawn first: at 32px it read as a checkerboard,
so the wave flips every two. It is drawn in the shade rather than the
highlight on review; lighter, it read as a textured `stripe`. It echoes the
`zigzag` mouth, so a robot with both wears two waves.

`tuxedo` is the only panel with height or a diagonal, so nothing else is near
it. It is the one option that reaches row 11 — interior body on every build,
and right under the walker's neck, which then reads as a collar. On the ball
it is the one marking that doesn't slide: sliding, it spent frames as two
half-Vs at the edges, and a shirt front has to face you. It needs one more
two-colour half cell, `R` (highlight above, shade below), where the shirt
meets a lapel.

The one cost is the chest lights, which carry the working chase and the
`needs` flash. `none`, `stripe`, `zigzag` and `tuxedo` have none, so those
robots sit both out.
The `needs` state still has yellow eyes and the `!`, so nothing is lost
there. Working is the case to watch: paired with `mouth: none`, which talks
with the chest lights only, the robot has no talking cue at all. Five of the
seven panels have no lights — `grille` already doesn't today — so that is 5
in 28 of the space. If it should never happen, the cheapest fix is for `mouth`
to fall back to `line` when the chest has no lights.

Prototyped and dropped. A panel is one row of eight cells, which has room
for lights, a texture, a bare body or a light band — and these three were all
a dark bar differing only at the ends:

- **`two`** — `v1vvvv3v`: `lights` with the middle light dropped. It read as
  `lights`, and went dark on the middle beat of the chase.
- **`slot`** — a disk-drive slit, `dvvvvvvd`. The `d` caps barely separate
  from `v` at this size, so it read as a plain dark bar.
- **`screen`** — a second little display, x 13–18 `v` with `g` glare at
  x 13. One glare pixel was all that told it from `slot`, or from `lights`
  whenever its lights were off.

If the chest needs more range than this, the way to get it is a taller panel
rather than more patterns in row 12; that hasn't been checked against every
build's torso.
## 2. New variations

### Eyes — do this one first

`seededTraits` already has `r(); // this draw used to pick the eye shape`.
That reserved draw means every existing seed has a deterministic eye value
waiting; reintroducing `eyes: pick(FOLK_PARTS.eyes)` in that slot changes
no other part for any seed.

The `eyes(rows, ch, dx)` helper already takes rows, a char and a look
offset, so shapes are just different column/row sets. Each needs its blink
(`l` on one row), its look (`dx ±1`) and its `needs` tall form.

| Option | Drawing |
| --- | --- |
| `wide` | Today's 3×2. |
| `dot` | One column, two rows (x 12); `needs` → three rows. |
| `slant` | Row 4 x 12–13, row 5 x 11–13. A determined look. |
| `visor` | One Cylon bar x 11–20 row 5. Look becomes a scanning pixel; blink a flat `l` line. |

### A fourth build: `float`

`build: ['walker', 'tank', 'ball', 'float']`. A small hovering pod with arms
and no legs, so it stays inside the rule that a part must work on every
build: it has a head, a chest panel, antenna and ears like the others.

| Part | Rows | Spans |
| --- | --- | --- |
| pod | 10&ndash;12 | x&nbsp;11&ndash;20, flush to the head &mdash; no neck |
| skirt | 13 | x&nbsp;13&ndash;18, the bottom of the body |
| plume | 14&ndash;15 | x&nbsp;14&ndash;17 (&plusmn;1 per tick), narrowing to x&nbsp;15&ndash;16 |

- **Chest** stays at row 12, x&nbsp;12&ndash;19, so every chest option works
  unchanged. It now sits on the pod's last row rather than centred; moving it
  to row 11 for this build is a one-line change if that reads better.
- **Arms** hang at x&nbsp;10 / x&nbsp;21: `down` and `out` alternating while
  working, both `up` for `needs`, `tuck` while idle. They are shorter than
  the walker's because there is no torso to balance them.
- **No walk cycle.** The body bobs `[0,-1,-2,-1]` continuously, so it is
  visibly airborne even in a still frame. The sprite views need a drift
  cycle rather than a stride.
- **The plume uses the state light**, so it is green working, yellow when it
  needs you, and idles down while resting.

Hover treatments prototyped and dropped: `jets`, `nozzles` and `beams` put
two or more separate glows under a legless robot, which read as legs;
`cushion` reads as a platform the robot rests on rather than thrust;
`sparks` is too noisy at 32px; `vortex` and `pool` work but read as ground
effect rather than lift. `pool` is the best alternative if the robots should
feel like they hover just above a surface.

### Head shape

The outline of rows 2&ndash;9, as a per-row span table. The screen is inset
2 from the outline and clamped to today's x&nbsp;9&ndash;22, so it follows a
tapering head instead of being fixed &mdash; `box` still renders
pixel-for-pixel as it does today. Ears re-anchor to whatever the outline is
at their row, so they never float.

`head: ['box', 'round', 'cone', 'taper']`:

| Option | Rows 2&ndash;9 spans | Look |
| --- | --- | --- |
| `box` | `[8,23] [7,24]x6 [8,23]` | today: a 1px chamfer top and bottom |
| `round` | `[10,21] [8,23] [7,24]x4 [8,23] [10,21]` | 2px chamfer both ends; a capsule |
| `cone` | `[13,18] [10,21] [8,23] [7,24]x5` | pointed crown over a square jaw; a bullet |
| `taper` | `[5,26] [6,25] [7,24]x2 [8,23] [9,22] [10,21] [12,19]` | inverted triangle: wide brow, narrow chin |

On `cone` the `twin` antenna's stalks stand just clear of the crown, which
reads as a pair of feelers &mdash; kept deliberately.

`taper` keeps a full-width eye row, so `wide` eyes and the `visor` still sit
properly; the mouth row narrows to x&nbsp;10&ndash;21, which `zigzag`
(x&nbsp;12&ndash;19) and `grin` both still fit inside.

Prototyped and dropped:

- `slab` (no chamfer) is one pixel per corner from `box`.
- `dome` (rounded top, square bottom) &mdash; `cone` is the same silhouette
  with a sharper crown, so it replaced it.
- `crt` and `helmet` (overhanging brow) crowd the ears.
- `wedge` and `triangle` are weaker/stronger tapers than `taper`;
  `triangle` squeezes the mouth row to x&nbsp;11&ndash;20 and makes the ball
  read as a head sunk into the sphere.
- `spire` and `point` (sharper than `cone`) clip the screen's top corners
  into a peak and leave the `twin` antenna standing on empty space.
- `cinch`, `hourglass` and `spool` (pinched at the eye rows) put the flares
  above and below the face instead of framing it; the ears end up in a
  recess and the ball reads as a vase. x&nbsp;9&ndash;22 is a hard floor for
  the pinch, so there is no room to tune it.

### Dome antenna, reworked

The `dome` antenna loses its row-1 stem plate; the light sits straight on the
head's top row, and its width follows the crown (clamped to x&nbsp;14&ndash;17)
so it caps `cone`'s point exactly. This applies on every head shape, not just
`cone` &mdash; the old plate always read as a separate slab. It makes `dome`
a one-row antenna where `mast` and `twin` are two, which is a deliberate
low-profile distinction.

Two things to handle when implementing:

- **The ball.** A narrower head exposes sphere that `sphere()` only fills
  where cells are empty, and the seam under the head (row 10) must follow the
  head's bottom span. `ballSlide` already takes a `seam` argument, so this is
  small, but it is not automatic.
- **The side view.** `head('side')` is a separate branch, so each shape needs
  a matching profile or the left/right sprites quietly stay boxy.

### Eye colour

Eye colour is the state signal today — `e` and `m` both map to
`LIGHT[state]` — so the trait only applies while `active`. `needs` stays
yellow everywhere and `waiting` is shut, so the dashboard language survives.
The mouth follows the eyes; chest lights and antenna keep their own greens.

`eyeColor: ['green', 'aqua', 'sand']`:

| Option | Hex | Note |
| --- | --- | --- |
| `green` | `#8ec07c` | today's; stays the default |
| `aqua` | `#83a598` | cool, clearly not green, still inside the palette |
| `sand` | `#d5c4a1` | the Cream body's base; a warm off-white CRT |

Prototyped and dropped, with the reason each time:

- **Pink, cream, orange, red** — too flashy against the body colours; orange
  and red also read as attention or error states.
- **Teal `#689d6a`** — only 15 (CIELAB) from `green`; not a separate option.
- **Lime `#b8bb26`** — 29 from the `needs` yellow; confusable with an alert.
- **Pale yellows** (`lemon ice`, `butter`, `straw`, `vanilla`) — a light
  yellow has to clear both `sand` (already a warm beige) and the `needs`
  yellow; nothing did both convincingly.
- **Greys** — a dark grey (`#767d80`, `#928374`) lands 8–16 from the shut
  eyelid `#7c6f64` and the `waiting` eye `#665c54`, so a working robot reads
  as asleep. The one that works is a light `mist` `#c8ccc8`, but it sits 21
  from `aqua`, which is itself a desaturated grey-teal — two near-neutrals in
  a three-colour set wasn't worth it.

Implementation: `folkColors` picks `e`/`m` from the trait when
`state === 'active'`; nothing else changes.

### Mouth

Today the mouth is only the `active` talking strip on row 7.
`mouth: ['line', 'zigzag', 'grin', 'none']`.

Mouth and eyes share a colour, so anything on row 6 reads as attached to the
eyes. All shapes therefore stay on row 7 and use **half-height pixels**: two
new grid chars, `T` (top half of the cell) and `U` (bottom half), drawn by
`eachFolkRect` the same way the shut eyelid `l` already is. The `bar` antenna
and the `floating` ear add the light's two halves, and the `zigzag` and
`tuxedo` chests three more that fill their other half with a second colour,
so the case is one table of char → colour, half and an optional second
colour — seven chars —
rather than one hard-wired case per part.

- `line` — today: x 14–17, narrowing to 15–16 while talking.
- `zigzag` — x 12–19 alternating `T`/`U`; talking flips the parity so the
  waveform wobbles.
- `grin` — full pixels x 14–17 with `T` at x 13 and x 18 lifting the ends
  into a smile; talking shrinks it to x 15–16 with `T` at 14 and 17.
- `none` — talks with the chest lights only.

## 3. New states — proposed, not yet reviewed

Core has three: `active` (working), `needs` (alert) and `waiting` (idle).
Five more are prototyped, drawn over core's `waiting` frame by
`moodRobot` in `prototype.mjs`; the top of `prototype.html` plays all seven
on every build. The same two rules hold — each must read on every build
(so each says what the armless ball does), and with every eye shape — plus
a third: **each is told apart by more than colour**, so it survives
colour-blindness and the Dark gray body.

| State | Face | Body | Lights and glyphs |
| --- | --- | --- | --- |
| `angry` | Red eyes with the inner top corner cut, stepped by a half cell: brows down. The visor bends into a V. A frown on row 7. | Trembles a column side to side for 4 ticks in 8. Walker shakes a fist overhead and stomps; tank raises one claw, both snap, tread revs in place; ball rocks; float shakes a fist, plume flared wide. | Antenna and chest flash red every tick. A red anger mark top right, steam puffs off both sides of the crown. |
| `confused` | Eyes darting side to side, a column either way every 2 ticks, with a double blink every 24. The visor's bar darts with them. A squiggle mouth. | Walker scratches its head (hand alternating `up-in`/`up-out` beside the ear); tank the same with a claw; ball rolls three columns one way, then back; float raises a hand. | Purple `?` bobbing top right. Antenna blinks out of rhythm, chest lights light out of order. |
| `thinking` | Eyes rolled up (half a cell off the bottom), looking to one side, glancing back every 32 ticks. The visor runs a scanner. A small pursed mouth off-centre. | Still. Walker's hand to its chin; tank a claw raised; ball's markings creep a column every 3 ticks; float's hand to its chin, a slow bob. | A typing indicator: three dots appear in turn, then a beat empty. Slow aqua chest chase and antenna pulse. |
| `surprised` | Ring eyes — `needs`' 3×3 with the centre left dark, an O — in the robot's own eye colour. Dot eyes stretch to three rows; the visor becomes one wide ring. A small o mouth. | Jumps (2 ticks up), arms thrown up for 6 ticks, then freezes with hands out for the rest of the 24. Tank: claws up, then held open low; ball jumps; float jumps, arms up then out. | Shock lines off both top corners during the startle, chest lights and antenna flash cream on the jump, then dark. |
| `destroyed` | X eyes in grey that flicker (dark for a tick, red on the twitch). The visor breaks into pieces, one dropped a row. No mouth. A crack down the screen from a dent in the shell. | Slumped half a row, twitching every 20 ticks. The head is knocked a column off the body and the antenna bent further. One arm lies on the ground; the float is grounded and its plume coughs every 9 ticks. Highlights go, like scorching. | Lights dead. Smoke puffs off the crack, sparks at the head and the socket now and then. |

What the states need that core doesn't have yet:

- **`dx`** on a frame, for `angry`'s shake. Every renderer takes `dy`
  already; `dx` is the same offset sideways, and in the animated SVG the
  same translate.
- **Glyphs**: `?`, the anger mark, a dot, two puff sizes, a spark and two
  shock lines join
  `!`, `z` and `Z`. Glyphs already carry colour and opacity.
- **Eye half cells** `E` (low), `F` (high) and `W` (a glint, high): the
  half-cell table again, with the visor as the other half. The mouth's `T`
  and `U` now fill their other half with the visor too; they left it empty,
  which only didn't show because the page background is nearly the visor's.
- **Per-state colours** for the eyes, chest lights and antenna, where
  `folkColors` switches on `needs` today; and a crack colour `c`.
- **Two arm poses** per build, `chin` and `gone`, and the walker's fist
  (`up-in`/`up-out` alternating every tick on one side).
- **Periods.** Each loops in 24 ticks or divides into it, except
  `destroyed`'s sparks (7, 11) and twitch (20). The animated SVG compiles
  one loop to CSS keyframes, so those want rounding to divisors of 24
  before it's built, or the file grows to the LCM.
- **Reduced motion**: each needs one still that reads on its own. The
  stills in the `states` section of the prototype are the candidates.
- **The element's label** (`STATE_LABELS`) and the `.d.ts` `FolkState`.

New states don't move any seed's robot, so unlike everything above they are
a minor version on their own — they only ride on v2 because the face is
drawn from the new eye table.

`confused`'s eyes were drawn five ways; `dart` was kept. Dropped:

- **`squint`** — one eye wide (its `needs` form), the other half-shut,
  swapping every 12 ticks; the visor tilted. The first draft; didn't land on
  review.
- **`uneven`** — both open, one half a cell lower. The visor tilted.
- **`cross`** — eyes drifting to the nose and apart every 6 ticks.
- **`wavy`** — squiggle eyes in half cells, flipping every 3 ticks; with the
  squiggle mouth, the whole face was one texture.

`dart`'s still frame is just open eyes looking aside, so under reduced
motion `confused` reads by the `?` and the head-scratching arm.

Choices worth a second look on review:

- `surprised` sits closest to `needs` of anything here: both jump or throw
  their arms up. What separates them is the eyes (a ring in the trait
  colour against a solid yellow block), the missing `!`, and that
  `surprised` freezes after its start while `needs` keeps waving. If that
  isn't enough on a busy dashboard, the next lever is to make its jump a
  one-shot that settles into a still stare, rather than a 24-tick loop.

- `angry` and `destroyed` both override the trait eye colour, the way
  `needs` does; `confused` and `thinking` keep it. `angry`'s red is the
  colour rejected as an eye colour trait for reading as error — here that's
  the point.
- The states draw their own mouth whatever the `mouth` trait is, including
  `none`. The alternative is to keep `none` mouthless, which loses
  `angry`'s frown.
- `destroyed`'s head shift moves rows 0–9 on the ball too, which includes
  the sphere's rim beside the head. It reads as the head knocked loose; if
  it reads as a smeared ball, shift the head spans only.

### Celebrate and the hop

Two more, from how robofolks gets used: a todo marked done has no reward
(the robot just goes away), and the attention hops start from standing, with
no wind-up.

**The hop** is one primitive, 8 ticks: rest, **crouch**, **take-off**, air,
apex, falling, **squashed landing**, rest. The crouch and the landing squash
the robot a row — everything above the feet drops onto them (on the ball,
everything above its lower half), so the walker's legs vanish into a squat,
the tank sinks into its tread and the ball's head sinks into the sphere.
Take-off and falling sit either side of the apex at 3 and 4 units up, the
apex at 7. Arms take a generic pose — down, back, up, out — that each build
maps to its own: the walker swings its arms back in the crouch and throws
them up on take-off, the tank raises its claws, the float flares its plume
on take-off and cuts it in the squash.

- **Alert (`needs`) is reworked to use it.** The same yellow eyes, `!` and
  flashing lights, but every build hops with a wind-up every 12 ticks, arms
  waving in the 4 ticks between, where today the walker, tank and float wave
  in place and only the ball bounces (with no wind-up). This changes how an
  existing state looks, so it rides on the major version. It was first
  prototyped as a separate `alert, hopping` state beside the old one; on
  review it replaced it. The prototype's fidelity check now holds only
  `active` and `waiting` to core.

**`celebrate`** loops every 12 ticks: a hop with a burst of confetti at
take-off (ticks 0–7), then a cheer — arms alternating overhead, claws
snapping, the float's hands up (ticks 8–11). The previous burst is still
falling as the next goes up. It keeps hopping for as long as the host shows
it; the host decides when the robot goes. A first draft played once and
launched the robot off the top of the frame; cut on review in favour of just
hopping.

- **Face:** `^ ^` eyes, each a ^ of half cells (the middle half a cell higher
  than its sides), in the trait eye colour; the visor bows into one arch.
  Every two-eye shape shares it. The `grin` mouth.
- **Confetti:** twelve single-pixel glyphs per burst in six palette colours,
  thrown mostly outward from above the crown — the frame ends five rows above
  the antenna, so there isn't room to throw them high — falling under
  gravity, each flipping between a tall and a wide pixel as it tumbles.
  Hidden for the first two ticks so a burst doesn't clump on the antenna,
  faded out by 12.
- **Lights:** a fast green chase and a blinking antenna.

What these add to the implementation list above:

- **Squash**: a whole-frame row shift above a per-build line, like `dx` but
  vertical and partial.
- **Clipping**: confetti reaches the edges of the frame, so the canvas and
  PNG renderers should clip to the cell, as the prototype's contact sheet
  now does. The SVG clips on its own.
- **Confetti glyphs** `bit` and `bitw`, placed by a formula per tick rather
  than a fixed table.

### More states to consider

Not drawn yet. Grouped by what a dashboard would use them for, since that's
what the package is for.

**Outcomes of a task**

- `failed` / `sad` — eyes drooping at the outer corners (`angry` mirrored),
  a tear glyph running down the screen, antenna drooped, arms hanging. A
  gentler error than `angry`.
- `proud` — eyes closed in arcs, chest out (torso up a row), a star glyph.

**Waiting on something that isn't you**

- `loading` / `booting` — screen fills in scanlines top to bottom, eyes
  flicker on, lights test in sequence. Could be a one-shot intro.
- `queued` — taps a foot, eyes flick to the side and back, a small clock
  glyph.
- `rate-limited` / `throttled` — an hourglass glyph, the chase slowed right
  down, sluggish half-speed walk.
- `syncing` — up/down arrow glyphs trading places, the antenna pulsing.
- `offline` — static noise on the screen, a disconnected-plug glyph.
- `low-battery` — chest panel drains column by column, then a red blink.

**Talking to you**

- `listening` — ears and antenna glow and pulse in time, eyes wide and
  steady, head tilt (rows 2–9 up a half row on one side?).
- `speaking` — `working`'s mouth without the walk.
- `greeting` — one arm waves; the ball spins its markings a full turn.
- `love` — heart eyes, a heart glyph floating up.
- `shy` / `blushing` — pink cheek cells on the visor corners, eyes down.

**Just character**

- `dizzy` — spiral eyes, stars orbiting the head, a lean left and right.
- `scared` / `nervous` — tiny dot eyes, a sweat-drop glyph, trembling
  faster and smaller than `angry`.
- `sleeping` — `waiting` today; a deeper version with the screen off.
- `dancing` — the walk cycle out of phase with a bounce; the ball spins.
- `glitching` — rows of the grid shifted a column at random for a tick,
  colours swapped. Could be `destroyed`'s milder cousin.

## Combinations

`phase` is excluded — it offsets the animation, it doesn't change the look.

### Today (1.x)

| Part | Options |
| --- | ---: |
| body (paint) | 7 |
| build | 3 |
| antenna | 3 |
| ears | 3 |
| chest | 3 |
| **Total** | **567** |

### After this plan (2.0.0)

| Part | Options | Note |
| --- | ---: | --- |
| body | 7 | |
| build | 4 | new: `float` |
| antenna | 7 | 3 + `none`, `bulb`, `horns`, `bar` (`dome` reworked) |
| ears | 5 | 3 + `plug`, `floating` |
| chest | 7 | 3 + `none`, `stripe`, `zigzag`, `tuxedo` |
| eyes | 4 | new |
| eyeColor | 3 | new |
| head | 4 | new |
| mouth | 4 | new |
| **Total** | **1,317,120** | |

That's about **2,320×** today's count.

Each section on its own, on top of today's 567:

| Only doing… | Total |
| --- | ---: |
| Section 1 (expanded lists) | 7 × 3 × 7 × 5 × 7 = 5,145 |
| The `float` build alone | 567 × 4 / 3 = 756 |
| Section 2 (new parts) | 567 × 4 × 3 × 4 × 4 = 108,864 |

## Versioning

Per [Stability](README.md#stability), both routes are a major bump:

- Growing a list reshuffles almost every seed's pick for that part, since
  `pick` is `floor(r() * list.length)`.
- A new trait changes how existing robots draw.

To keep *most* seeds pixel-for-pixel identical when adding an option, append
a **new** draw at the end of `seededTraits` and only override when it lands
(e.g. `if (r() < 1 / n) traits.antenna = 'bulb'`) — the same trick the
`build` comment describes. Then only ~1/n of seeds change.

## Suggested order

1. Eyes — seed plumbing exists, biggest visual payoff.
1. Head shape — biggest silhouette change; do it before the parts that
   attach to the head outline.
1. The `float` build — new geometry, and it needs its own side/back views
   and drift cycle, so it is the largest single piece of work here.
2. Eye colour — a few lines in `folkColors`.
3. Mouth.
4. Chest `none`/`stripe`, antenna `none`/`bulb`/`bar` — the easy list
   additions.
5. Antenna `horns`, ears `plug`/`floating`, chests `zigzag` and
   `tuxedo` (both need the two-colour half cells).
