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

Prototyped; both kept. Three things the drawing settled:

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
| `two` | `v1vvvv3v`. | Same stamp as `lights` with the middle light dropped. |
| `slot` | Disk-drive slit: `dvvvvvvd`. | A dark band `dddddd`. |
| `screen` | A second little display: x 13–18 `v`, `g` glare at x 13. | Same stamp as `core` but `v` inside. |
| `stripe` | A highlight band: x 12–19 `h`. | A full `h` ring round the waist (slides nicely). |

Prototyped; all five kept. The panel is the same row on every build, so each
option needed no per-build case — the ball is the only one that needs its own
form, and `stripe` is a ring there rather than a stamp because a uniform band
has nothing to slide.

The one cost is the chest lights, which carry the working chase and the
`needs` flash. `none`, `slot`, `screen` and `stripe` have none, so those
robots sit both out, and `two` goes dark on the middle beat of the three-step
chase. The `needs` state still has yellow eyes and the `!`, so nothing is
lost there. Working is the case to watch: paired with `mouth: none`, which
talks with the chest lights only, the robot has no talking cue at all. Five
of the eight panels have no lights — `grille` already doesn't today — so that
is 5 in 32 of the space. If it should never happen, the cheapest fix is for
`mouth` to fall back to `line` when the chest has no lights.
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
and the `floating` ear add the light's two halves, so the case is one table of
char → colour and half — four chars — rather than one hard-wired case per
part.

- `line` — today: x 14–17, narrowing to 15–16 while talking.
- `zigzag` — x 12–19 alternating `T`/`U`; talking flips the parity so the
  waveform wobbles.
- `grin` — full pixels x 14–17 with `T` at x 13 and x 18 lifting the ends
  into a smile; talking shrinks it to x 15–16 with `T` at 14 and 17.
- `none` — talks with the chest lights only.

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
| chest | 8 | 3 + `none`, `two`, `slot`, `screen`, `stripe` |
| eyes | 4 | new |
| eyeColor | 3 | new |
| head | 4 | new |
| mouth | 4 | new |
| **Total** | **1,505,280** | |

That's about **2,650×** today's count.

Each section on its own, on top of today's 567:

| Only doing… | Total |
| --- | ---: |
| Section 1 (expanded lists) | 7 × 3 × 7 × 5 × 8 = 5,880 |
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
4. Chest `none`/`stripe`/`slot`, antenna `none`/`bulb`/`bar` — the easy list
   additions.
5. Antenna `horns`, ears `plug`/`floating`, chest `two`/`screen`.
