'use strict';

/* What the snapshot tests pin down, in two layers:

   seeds  -- which robot each seed picks (its traits). This is the public
             contract: change it and everyone's avatar changes, so it's a
             major version bump.
   builds -- what every combination of parts looks like, in every animation
             state and walk direction, independent of any seed. A change here
             is a redraw: check it's intended before updating. */

const crypto = require('node:crypto');
const bot = require('../bot.js');

const SEEDS = [
  // Project paths, the way agenthub seeds its robots.
  ...['agenthub', 'cellar', 'alasmas', 'bggen', 'curator', 'firejack', 'huhwhut', 'kmbook', 'paragraf',
    'ticketscan', 'youtube', '100reasons', 'dotfiles', 'api', 'web', 'mobile', 'infra', 'docs', 'blog', 'scratch']
    .map((name) => `/Users/kevingo/Projects/${name}`),
  // Usernames and other ids.
  'kevingo', 'ada', 'grace', 'linus', 'margaret', 'alan', 'octocat', 'claude', 'root', 'guest',
  'user@example.com', 'team-alpha', 'team-beta', 'agent-1', 'agent-2', 'agent-3',
  'C:\\code\\app', '/home/dev/work/monorepo/packages/ui', 'https://github.com/acme/widgets',
  // Edge cases.
  'a', '', '0', '🤖', 'ロボット', 'seed with spaces', 'x'.repeat(300),
  'null', 'undefined', 'constructor', '__proto__',
];

// Long enough to hold a full cycle of every dashboard animation: the working
// look-around repeats every 36 ticks and the blink every 26 (lcm with the rest
// is 468); dozing repeats every 208.
const TICKS = 468;
const STATES = ['active', 'needs', 'waiting'];

const hash = (svgs) => crypto.createHash('sha256').update(svgs.join('\n')).digest('hex').slice(0, 16);

/** A seed's traits with the paint as its name, so the snapshot reads. */
function seedTraits(seed, overrides = null) {
  const { body, ...parts } = bot.botTraits(seed, overrides);
  return { body: bot.BOT_BODY_NAMES[bot.BOT_BODIES.indexOf(body)], ...parts };
}

/** One hash per animation state and per walk direction, each covering every frame. */
function frameHashes(traits) {
  const out = {};
  for (const state of STATES) {
    out[state] = hash(Array.from({ length: TICKS }, (_, t) => bot.botSvg(traits, state, t)));
  }
  for (const view of bot.BOT_VIEWS) {
    out[view] = hash(Array.from({ length: bot.BOT_WALK_FRAMES }, (_, f) => bot.botWalkSvg(traits, view, f)));
  }
  return out;
}

/** Every combination of build, antenna, ears and chest. Paint only swaps
 *  colors, so it's covered once per paint on a single build instead. */
function buildCases() {
  const cases = [];
  const { build, antenna, ears, chest } = bot.BOT_PARTS;
  for (const b of build) for (const a of antenna) for (const e of ears) for (const c of chest) {
    cases.push({ name: `Orange ${b} ${a} ${e} ${c}`, parts: { body: 'Orange', build: b, antenna: a, ears: e, chest: c } });
  }
  for (const body of bot.BOT_BODY_NAMES.slice(1)) {
    cases.push({ name: `${body} walker mast bolt lights`, parts: { body, build: 'walker', antenna: 'mast', ears: 'bolt', chest: 'lights' } });
  }
  return cases;
}

/** Everything the snapshot file holds, freshly computed. */
function computeSnapshots() {
  return {
    seeds: SEEDS.map((seed) => ({ seed, traits: seedTraits(seed) })),
    builds: buildCases().map(({ name, parts }) => {
      // phase 0 so frames line up with ticks; the seed's own phase is covered by `seeds`.
      const traits = { ...bot.botTraits('', parts), phase: 0 };
      return { name, frames: frameHashes(traits) };
    }),
  };
}

module.exports = { SEEDS, computeSnapshots, seedTraits };
