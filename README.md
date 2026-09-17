# bot-avatar

Seeded, animated pixel-robot avatars. Any string (a project path, a username)
always produces the same robot: paint, build (walker, tank, ball), antenna,
ears and chest panel. No dependencies.

## Use

In a page, as a plain script (defines globals):

```html
<div id="me"></div>
<script src="bot.js"></script>
<script>
  const bot = mountBot(document.getElementById('me'), 'kevingo', 'active');
  setBotState(bot, 'needs'); // 'active' | 'needs' | 'waiting'
</script>
```

From a bundler or Node:

```js
const { botTraits, botSvg } = require('bot-avatar');
const svg = botSvg(botTraits('kevingo'), 'waiting', 0); // SVG string
```

## API

- `botTraits(seed, overrides?)` — the robot for `seed`; `overrides` like
  `{ body: 'Blue', build: 'tank' }` win over the seed's picks.
- `mountBot(el, seedOrTraits, state?, { view? })` — draw into `el` and keep
  animating. Pass `view` (`front` | `back` | `left` | `right`) for a walk cycle.
- `setBotState(bot, state)`, `onBotTick(fn)`
- `botSvg(traits, state, tick)`, `botWalkSvg(traits, view, frame)` — SVG strings.
- `paintBotSheet(canvas, traits, scale?)` — 4×4 walk-cycle sprite sheet.
- `BOT_PARTS`, `BOT_PART_NAMES`, `BOT_BODY_NAMES` — every option, for building
  an editor.

The animation ticker only runs in a browser, and not at all with
`prefers-reduced-motion`.

## Stability

A seed always gets the same robot within a major version.

- **Major:** a seed picks a different robot, or an existing robot looks
  different.
- **Minor:** new parts, states or functions that leave existing robots alone.
  New parts must not shift the seed's random draws: add new draws at the end
  of `seededTraits`, never in the middle.

## Tests

```sh
npm test             # compare against test/snapshots.json
npm run test:update  # regenerate after an intended change
```

The snapshots pin two things (see `test/cases.js`):

- **seeds:** which robot each of 50 seeds picks. A failure here is a breaking
  change.
- **builds:** every combination of parts, hashed across a full cycle of every
  animation state and every walk direction. A failure here means a robot is
  drawn differently; check it's intended, then update.
