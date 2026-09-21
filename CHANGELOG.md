# Changelog

All notable changes are listed here. The rule the versions follow is in
[Stability](README.md#stability): a seed keeps its robot for the life of a
major version.

## 1.0.0 — 2026-09-21

The API and the seed-to-robot mapping are settled. Nothing about the robots
changed from 0.1.0; this release makes the promise binding.

- Any change to which robot a seed picks, or to how an existing robot is
  drawn, now means a major version.
- [Demo page](https://kevingoenadibrata.github.io/robofolks/): type a seed and
  watch the robot, switch states, send it walking.

## 0.1.0 — 2026-09-21

First release, extracted from the agenthub dashboard.

- `robofolks`: `folkTraits`, `folkSvg`, `folkWalkSvg`, `folkAnimatedSvg`,
  `paintFolkSheet` and the part lists. Pure functions — seeds and traits in,
  SVG out — so they run in Node, workers, at build time and in the browser.
- `folkAnimatedSvg` puts a whole animation loop in one self-contained SVG
  played by CSS keyframes: no JavaScript needed, 1–3 kB gzipped, and it holds
  its first frame under `prefers-reduced-motion`.
- `robofolks/dom`: `mountFolk`, `updateFolk`, `setFolkState`, `unmountFolk`
  and `onFolkTick`, sharing one clock that runs only while something is
  mounted.
- `robofolks/element`: the `<robo-folk>` custom element, with `motion="css"`
  (the animated SVG), `"clock"` (the shared clock) or `"none"`. Shadow DOM,
  labeled for assistive tech, safe to import while server rendering.
- `robofolks/react`: `<RoboFolk />`, which renders the SVG itself, so server
  rendering needs no hydration. React 18 and 19.
- `robofolks/png`: `folkPng`, `folkSheetPng`, `folkSheetLayout` and
  `encodePng` — a rasterizer and PNG encoder with no dependencies.
- `robofolks` on the command line: `svg`, `png`, `sheet` and `info`.
- TypeScript types for every entry point. No runtime dependencies.
