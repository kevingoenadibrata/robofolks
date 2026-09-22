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
| `dish` | Shallow bowl on a stem: row 0 x 13–18 `h`, row 1 x 15–16 `#`. |
| `bulb` | One fat light: row 0 x 14–17 `a`, row 1 x 15–16 `#`. `dome` is the wide version, this is the tall one. |
| `horns` | Two `d` nubs on the head's outer corners: row 1 x 8 and x 23. Reads differently from `twin` because it's on the corners, not inboard. |
| `propeller` | Row 0 x 12–19 `h` on a `#` stem. In `active`, alternate x 12–19 and x 14–17 so it looks like it spins. |

### Ears (rows 4–7 at x 5–6, mirrored via `both`)

| Option | Drawing |
| --- | --- |
| `cup` | Headphones: rows 4–7 x 5–6 `d`, `a` at rows 5–6 x 6. Bigger than `bolt`, lights up the same way. |
| `plug` | A peg straight out: rows 5–6 x 4–6 `#`, x 3 `d`. |
| `ring` | Hollow handle: rows 4 and 7 x 5–6 `d`, rows 5–6 x 4 `d`. |

### Chest (row 12, x 12–19; the ball gets a `MARKING` entry or a special case like `grille`)

| Option | Front | Ball marking |
| --- | --- | --- |
| `none` | Plain panel. | Bare sphere. |
| `two` | `v1vvvv3v`. | Same stamp as `lights` with the middle light dropped. |
| `slot` | Disk-drive slit: `dvvvvvvd`. | A dark band `dddddd`. |
| `screen` | A second little display: x 13–18 `v`, `g` glare at x 13. | Same stamp as `core` but `v` inside. |
| `stripe` | A highlight band: x 12–19 `h`. | A full `h` ring round the waist (slides nicely). |

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
`eachFolkRect` the same way the shut eyelid `l` already is.

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
| antenna | 8 | 3 + `none`, `dish`, `bulb`, `horns`, `propeller` (`dome` reworked) |
| ears | 6 | 3 + `cup`, `plug`, `ring` |
| chest | 8 | 3 + `none`, `two`, `slot`, `screen`, `stripe` |
| eyes | 4 | new |
| eyeColor | 3 | new |
| head | 4 | new |
| mouth | 4 | new |
| **Total** | **2,064,384** | |

That's about **3,640×** today's count.

Each section on its own, on top of today's 567:

| Only doing… | Total |
| --- | ---: |
| Section 1 (expanded lists) | 7 × 3 × 8 × 6 × 8 = 8,064 |
| The `float` build alone | 567 × 4 / 3 = 756 |
| Section 2 (new parts) | 567 × 4 × 3 × 4 × 4 = 108,864 |

## Versioning

Per [Stability](README.md#stability), both routes are a major bump:

- Growing a list reshuffles almost every seed's pick for that part, since
  `pick` is `floor(r() * list.length)`.
- A new trait changes how existing robots draw.

To keep *most* seeds pixel-for-pixel identical when adding an option, append
a **new** draw at the end of `seededTraits` and only override when it lands
(e.g. `if (r() < 1 / n) traits.antenna = 'dish'`) — the same trick the
`build` comment describes. Then only ~1/n of seeds change.

## Suggested order

1. Eyes — seed plumbing exists, biggest visual payoff.
1. Head shape — biggest silhouette change; do it before the parts that
   attach to the head outline.
1. The `float` build — new geometry, and it needs its own side/back views
   and drift cycle, so it is the largest single piece of work here.
2. Eye colour — a few lines in `folkColors`.
3. Mouth.
4. Chest `none`/`stripe`/`slot`, antenna `none`/`dish`/`bulb`, ears `cup` —
   the easy list additions.
5. Antenna `propeller`/`horns`, ears `plug`/`ring`, chest `two`/`screen`.
