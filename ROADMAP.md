# bot-avatar roadmap

How to get the avatars to people: one npm package that turns a seed into an
SVG string, with every other way of using them built on top of it.

`bot.js` already splits most of the way there. `botTraits` and `botSvg` are
pure functions (data in, SVG out); only `mountBot` and the animation ticker
need a browser.

## Phase 0: Lock down which seed makes which robot

Do this before publishing. Once people use the package, a seed must keep
producing the same robot.

- [x] Snapshot tests: traits for 50 seeds, plus frame hashes for every part
      combination across every state and view (`npm test`).
- [x] Treat any change to which robot a seed produces as a breaking change
      (major version bump). Add new parts without shifting existing draws, as
      `seededTraits` already does. Written up under Stability in the README.

## Phase 1: Core npm package

- [ ] Convert `bot.js` to ES modules; ship ESM and CommonJS builds plus
      TypeScript types.
- [ ] Two entry points:
  - `bot-avatar`: pure functions (`botTraits`, `botSvg`, `botWalkSvg`, part
    lists). Works in Node, at build time, on edge servers and in the browser.
  - `bot-avatar/dom`: `mountBot`, `setBotState`, `onBotTick` and the ticker.
- [ ] Drop the globals, or keep a small browser build so a plain `<script>`
      tag still works.
- [ ] Switch the agenthub dashboard to import the package, and remove the
      relative-path lookup in its `server.js`.

## Phase 2: Animated SVG with no JavaScript

The biggest win. Render an animation's frames into one SVG and cycle them with
CSS keyframes.

- [ ] `botAnimatedSvg(seed, state)`: one self-contained, animating file.
- [ ] Respect `prefers-reduced-motion` with a CSS media query inside the SVG.
- [ ] Works in `<img src>`, GitHub READMEs, Notion, any framework, on a CDN.

## Phase 3: Web component

- [ ] `<bot-avatar seed="…" state="active" view="left">`
- [ ] One implementation for React 19, Vue, Svelte and plain HTML.
- [ ] Shows the Phase 2 SVG, or uses `bot-avatar/dom` when state changes live.

## Phase 4: Image URL service

- [ ] `GET /avatar/<seed>.svg?state=waiting&build=tank`
- [ ] `.png` for places without SVG support (email, Slack, Open Graph images).
- [ ] Small serverless function on the core package, with long cache headers
      (output never changes for a given seed and version).

## Phase 5: Only if people ask

- [ ] `@bot-avatar/react`: thin typed wrapper, for older React or flicker-free
      server rendering.
- [ ] Sprite sheet CLI using `paintBotSheet`, for Phaser, Godot, Unity.
- [ ] The agenthub part picker (`edit.html`) as a reusable avatar builder.

## Order

1. **0 → 1 → 2**: a solid package whose SVG output works almost everywhere.
2. **3**: cheap, covers most frameworks.
3. **4**: if you want use without installing anything.
4. **5**: on demand.
