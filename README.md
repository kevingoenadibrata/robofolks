# bot-avatar

Seeded, animated pixel-robot avatars. Any string (a project path, a username)
always produces the same robot: paint, build (walker, tank, ball), antenna,
ears and chest panel. No dependencies.

## Install

```sh
npm install bot-avatar
```

ES modules with TypeScript types. CommonJS can `require()` it too, on
Node 20.19+ or 22.12+.

## Use

Pure functions, anywhere (Node, workers, build time, the browser):

```js
import { botTraits, botSvg } from 'bot-avatar';

const svg = botSvg(botTraits('kevingo'), 'waiting', 0); // SVG string
```

Mounted in a page and animating:

```js
import { mountBot, setBotState } from 'bot-avatar/dom';

const bot = mountBot(document.getElementById('me'), 'kevingo', 'active');
setBotState(bot, 'needs'); // 'active' | 'needs' | 'waiting'
```

Without a bundler, point an import map at the two modules:

```html
<script type="importmap">
  { "imports": { "bot-avatar": "/bot-avatar/index.js", "bot-avatar/dom": "/bot-avatar/dom.js" } }
</script>
<script type="module">
  import { mountBot } from 'bot-avatar/dom';
</script>
```

## API

### `bot-avatar`

- `botTraits(seed, overrides?)`: the robot for `seed`. `overrides` like
  `{ body: 'Blue', build: 'tank' }` win over the seed's picks; unknown values
  are ignored.
- `botSvg(traits, state, tick)`: one animation frame as an SVG string.
- `botWalkSvg(traits, view, frame)`: one walk-cycle frame (`front` | `back` |
  `left` | `right`).
- `paintBotSheet(canvas, traits, scale?)`: a 4×4 walk-cycle sprite sheet on
  any canvas with a 2D context.
- `botFrame`, `botWalkFrame`, `botColors`, `eachBotRect`: the raw pixel grid,
  for drawing robots some other way.
- `BOT_PARTS`, `BOT_PART_NAMES`, `BOT_BODY_NAMES`, `BOT_BODIES`, `BOT_STATES`,
  `BOT_VIEWS`: every option, for building an editor.
- `BOT_TICK_MS`: how long one animation tick lasts.

### `bot-avatar/dom`

- `mountBot(el, seedOrTraits, state?, { view? })`: draw into `el` and keep
  animating. Pass `view` to show a walk cycle instead of a state.
- `updateBot(bot, { who?, state?, view? })`: change a mounted robot and redraw.
- `setBotState(bot, state)`, `unmountBot(bot)`
- `onBotTick(fn)`: runs `fn(tick)` on the shared clock; returns an unsubscribe
  function.
- `currentBotTick()`, `prefersReducedMotion()`

All robots share one clock. It runs only while something is mounted or
listening, drops robots whose element has left the page, and holds still under
`prefers-reduced-motion`.

## Stability

A seed always gets the same robot within a major version.

- **Major:** a seed picks a different robot, or an existing robot looks
  different.
- **Minor:** new parts, states or functions that leave existing robots alone.
  New parts must not shift the seed's random draws: add new draws at the end
  of `seededTraits` in `src/index.js`, never in the middle.

## Tests

```sh
npm test             # snapshots plus the package entry points
npm run test:update  # regenerate snapshots after an intended change
```

The snapshots pin two things (see `test/cases.js`):

- **seeds:** which robot each of 50 seeds picks. A failure here is a breaking
  change.
- **builds:** every combination of parts, hashed across a full cycle of every
  animation state and every walk direction. A failure here means a robot is
  drawn differently; check it's intended, then update.
