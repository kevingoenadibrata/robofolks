# robofolks v2.0.0 — blueprint

A design blueprint for the next major version. **Nothing here ships.** The
package is `src/`, which is untouched; `files` in `package.json` is `["src"]`,
so this directory is not published to npm.

The point of the blueprint is to settle what v2's robots look like *before*
anyone edits the drawing code, because a change to `src/core.js` changes every
existing seed's robot and is a major version bump.

## Files

| File | What it is |
| --- | --- |
| `plan.md` | The decisions: every approved option, every rejected one with the reason, the combination counts, and the versioning constraint. **Read this first.** |
| `prototype.mjs` | Draws all of it, by patching real frames from `src/core.js`. The prototype, not the implementation. |
| `prototype.html` | Generated. Open it in a browser to see every variation. |
| `prototype.png` | Generated. A contact sheet of the same sections, for a quick look. |

## Running it

```sh
npm run blueprint      # regenerates prototype.html and prototype.png
```

It prints a fidelity check first:

```
fidelity: defaults match core exactly (dome antenna rework aside)
```

That check renders the prototype with every default (`box` head, `wide` eyes,
`line` mouth, `green` eyes) and compares it against `folkFrame` from the real
package — 6 trait sets × 3 states × 30 ticks, grid and `dy`. If it reports
mismatching frames, a patch in `prototype.mjs` has drifted from the package.
**Fix the patch, not the check.** It caught three real bugs during design
(eyes dropped where they overlapped the head's glare pixels, the look-around
offset mirrored the wrong way so the eyes crossed, and the head repaint wiping
arms raised into rows 7–8).

The only intentional difference is the reworked `dome` antenna, which is why
rows 0–1 are excluded for that one case.

## What's approved

| Axis | Options | Status |
| --- | --- | --- |
| build | walker, tank, ball, **float** | `float` is new |
| head | box, round, cone, taper | new axis |
| eyes | wide, dot, slant, visor | new axis |
| mouth | line, zigzag, grin, none | new axis |
| eye colour | green, aqua, sand | new axis |
| antenna | +none, dish, bulb, horns, propeller | **not prototyped yet** |
| ears | +cup, plug, ring | **not prototyped yet** |
| chest | +none, two, slot, screen, stripe | **not prototyped yet** |

Total if all of it lands: **2,064,384** robots, against 567 today.

## How the prototype works

It never redraws a robot from scratch. It calls `folkFrame` from the package,
then patches the returned grid. Four mechanisms are worth knowing, because
they are what an implementation in `src/core.js` would need to reproduce:

- **Head shape is a per-row span table** for rows 2–9 (`HEADS`). The screen is
  inset 2 from the outline and clamped to x 9–22, so it follows a tapering
  head instead of being fixed. Ears re-anchor to the outline at their row.
  `paintHead` clears exactly the cells today's head and ears occupy — not a
  blanket band — so raised arms and the ball's rim survive.
- **Mouths use half-height pixels.** Two new grid chars, `T` (top half of the
  cell) and `U` (bottom half), the same trick `eachFolkRect` already uses for
  the shut eyelid `l`. This keeps every mouth on row 7, clear of the eyes,
  which share the mouth's colour. Implementing this means one new case in
  `eachFolkRect`, which every output path (SVG, animated SVG, PNG, sprite
  sheet) then gets for free.
- **The ball needs help.** A narrower head exposes sphere that `sphere()` only
  fills where cells are empty, and the seam under the head (row 10) has to
  follow the head's bottom span. `ballSlide` already takes a `seam` argument.
- **`float` is a new build**: pod rows 10–12 at x 11–20 flush to the head (no
  neck), skirt row 13, plume rows 14–15, arms at x 10 / x 21, and a constant
  bob instead of a walk cycle.

## If you are picking this up

**Do not start editing `src/core.js` without reading `plan.md`'s Versioning
section.** Growing an existing part's list reshuffles which option almost
every seed gets, because `pick` is `floor(r() * list.length)`. There is a
documented trick for adding options while keeping most seeds pixel-identical.

Open work, roughly in order:

1. **Prototype section 1** — the antenna, ears and chest additions listed in
   `plan.md`. They are specified but have never been drawn, so they are the
   least certain part of the plan.
2. **Side and back views.** Everything approved so far has only been designed
   from the front, which was a deliberate constraint. But `head('side')` is a
   separate branch in `core.js`, so `round`, `cone` and `taper` need matching
   profiles or the left/right sprites quietly stay boxy. `float` needs a whole
   side/back body and a drift cycle instead of a stride. **This is the largest
   unscoped piece of work in the plan.**
3. **One open question:** on `float` the chest panel sits on the pod's last
   row rather than centred, because the pod is three rows. Moving it to row 11
   for that build is a one-line change if it reads better.
4. **Then implement**, in the order `plan.md` suggests: eyes first (the seed
   draw for it already exists in `seededTraits`), then head shape, then float.

Two rules constrained every decision here, and should constrain new ones:

1. A variation must work on **every** build. No hands — the ball has none.
2. A variation must be visible from the **front**. Nothing that only shows on
   the back sprite.
