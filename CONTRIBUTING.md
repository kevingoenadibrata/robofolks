# Contributing to robofolks

Issues and pull requests are welcome. This file covers the parts that aren't
obvious from the code: the one promise the package makes, how to change the
drawing without breaking it, and where each kind of change belongs.

## Setup

Node 20.19+ (CI runs 20.19, 22 and 24).

```sh
git clone https://github.com/kevingoenadibrata/robofolks
cd robofolks
npm install   # dev dependencies only: React, for its tests
npm test      # 258 tests, no browser needed
```

There is no build step and no runtime dependency. `src/` is what ships; you
run it straight from the repo.

## The rule everything else follows

**A seed always gets the same robot within a major version.** Someone's avatar
is their identity in a dashboard; it changing under them is a breaking change,
not a refresh. [Stability](README.md#stability) states the promise, and
`npm test` enforces it — the seed snapshot fails loudly if any of 50 seeds
starts picking a different robot.

This shapes how new parts get added. The seed's picks come from a chain of
draws in `seededTraits` (`src/core.js`), so inserting a draw in the middle, or
growing an existing list, reshuffles everything after it. Two ways through:

- **Append at the end.** A new draw after the existing ones leaves every
  earlier pick alone. That's why `build` is drawn last, and why there's a
  spare `r()` where the eye-shape draw used to be — removing it would shift
  every chest panel.
- **Override sparingly.** To add an option to an existing list without
  reshuffling it, append a new draw and let it win only sometimes:
  `if (r() < 1 / n) traits.antenna = 'dish'`. Then roughly 1 in n seeds
  changes instead of all of them.

If a change really does need every seed to move, it's a major version. Say so
in the pull request rather than working around the snapshot.

## Changing how robots are drawn

1. Edit `src/core.js`.
2. `npm run test:update` to regenerate `test/snapshots.json`.
3. **Read the diff.** It's the record of how the robots look, in two layers
   (see `test/cases.js`):
   - `seeds` — which robot each seed picks. A change here is breaking. If you
     didn't mean it, you shifted the draw order.
   - `builds` — a hash per part combination, covering every frame of every
     state and walk direction. A change here means a robot is drawn
     differently. Expected for a redraw; check the scope matches what you
     touched.
4. `npm run images` if the README pictures should show the change, and commit
   the regenerated `docs/*.svg` and `docs/sprite-sheet.png`.
5. `npm run test:browser` if you touched animation timing — it checks the
   animated SVG the way a browser actually plays it.

`test/animated.test.js` is the one to watch when editing animations: it proves
the CSS keyframe plan in `folkAnimatedSvg` shows exactly what the
frame-by-frame `folkSvg` shows, at every tick, for every build and chest. The
two descriptions of the same animation have to stay in step.

## Where things live

| Path | What belongs there |
| --- | --- |
| `src/core.js` | The pixel grid, the seed, the drawing. Pure — no globals, no DOM, so it runs in Node, workers and at build time. |
| `src/animated.js` | The self-playing SVG: one animation loop as CSS keyframes. |
| `src/dom.js` | Mounting into a page, and the shared clock. |
| `src/element.js` | `<robo-folk>`. Must import without error in Node (server rendering). |
| `src/react.js` | `<RoboFolk />`, rendering the SVG itself so SSR needs no hydration. |
| `src/png.js` | Rasterizer and PNG encoder, on `CompressionStream`. |
| `src/cli.js` | `robofolks svg / png / sheet / info`. |
| `src/*.d.ts` | Hand-written types, one per entry point. |
| `test/` | Node's built-in test runner; `test/browser/` drives headless Chrome. |
| `docs/` | The GitHub Pages demo, plus the README images. |
| `blueprint/` | Design work for v2. Not published — `files` is `["src"]`. |
| `scripts/make-images.js` | Regenerates the README images. |

Keep `src/core.js` pure. Anything that needs a window, a timer or a document
goes in `dom.js` or above it.

## House rules

- **No runtime dependencies.** Not a preference — it's the package's pitch.
  Dev dependencies are React, for testing the React entry point.
- **Types are hand-written.** Adding or changing an export means editing the
  matching `.d.ts`; `test/package.test.js` loads every entry point the way
  consumers do, from ESM and CommonJS.
- **Match the surrounding code.** No linter, no formatter config. Two-space
  indent, semicolons, single quotes, and block comments at the top of a file
  or section explaining *why*, not what.
- **Reduced motion stays honoured.** Robots hold still under
  `prefers-reduced-motion`, in the animated SVG and on the shared clock.
- **The element stays accessible.** `<robo-folk>` is an image to assistive
  tech with a label naming the state.

## New API

Anything public needs, in the same pull request: the implementation, types in
the `.d.ts`, a test, a README entry, and a line in
[CHANGELOG.md](CHANGELOG.md) under an unreleased heading.

New parts, states or functions that leave existing robots alone are a minor
version. See [Stability](README.md#stability) for the rest.

## The demo page

`docs/index.html` is a single hand-written file served by GitHub Pages. It
loads the published package from unpkg (`robofolks@1`), not the local `src/`,
so a change to the library shows up there only after a release. Keep
`docs/llms.txt` in step when the page's description of the package changes.

## v2 work

`blueprint/v2/` settles what v2's robots look like before any drawing code
moves, because every such change is a major bump. Read `blueprint/v2/plan.md`
first — it holds the approved options, the rejected ones with reasons, and the
order the work should land in. `npm run blueprint` regenerates the prototype.
Nothing in that directory ships.

## Pull requests

- Branch off `main`.
- One subject line in the imperative, area-prefixed where it helps
  (`Demo: shorter descriptions`). Say in the body what the snapshot diff means
  if it changed.
- CI runs `npm test` on Node 20.19, 22 and 24, plus the browser suite with and
  without reduced motion. Green before review.

## Reporting a bug

Include the seed. Most drawing reports come down to one specific robot, and
`npx robofolks info <seed>` prints exactly which parts it picked — paste that,
plus the entry point you're using (`robofolks`, `/dom`, `/element`, `/react`,
`/png`, or the CLI) and the Node or browser version.

## License

MIT. Contributions are accepted under the same license; there's no CLA.
