'use strict';

/* Snapshot tests: see cases.js for what's pinned down and why.
   After an intended change, regenerate with `npm run test:update`. */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const bot = require('../bot.js');
const { SEEDS, computeSnapshots, seedTraits } = require('./cases.js');

const FILE = path.join(__dirname, 'snapshots.json');
const actual = computeSnapshots();

if (process.env.UPDATE_SNAPSHOTS) {
  fs.writeFileSync(FILE, `${JSON.stringify(actual, null, 2)}\n`);
  test('snapshots updated', () => {});
} else {
  let expected;
  try {
    expected = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    throw new Error(`Can't read ${FILE} (${e.message}); run \`npm run test:update\` to create it`);
  }

  test('seeds pick the same robots', async (t) => {
    const saved = new Map(expected.seeds.map((s) => [s.seed, s.traits]));
    for (const { seed, traits } of actual.seeds) {
      await t.test(JSON.stringify(seed).slice(0, 60), () => {
        assert.ok(saved.has(seed), 'new seed with no snapshot; run `npm run test:update`');
        assert.deepEqual(traits, saved.get(seed),
          'this seed now picks a different robot -- a breaking change for everyone using it');
      });
    }
  });

  test('every build draws the same frames', async (t) => {
    const saved = new Map(expected.builds.map((b) => [b.name, b.frames]));
    for (const { name, frames } of actual.builds) {
      await t.test(name, () => {
        assert.ok(saved.has(name), 'new build with no snapshot; run `npm run test:update`');
        assert.deepEqual(frames, saved.get(name),
          'the robot is drawn differently in the states/views listed above');
      });
    }
  });
}

test('the seeds cover every paint and part', () => {
  const picked = SEEDS.map(seedTraits);
  assert.deepEqual(new Set(picked.map((tr) => tr.body)), new Set(bot.BOT_BODY_NAMES));
  for (const [part, options] of Object.entries(bot.BOT_PARTS)) {
    assert.deepEqual(new Set(picked.map((tr) => tr[part])), new Set(options), `seeds don't cover every ${part}`);
  }
});

test('seeding is deterministic', () => {
  for (const seed of SEEDS) {
    assert.deepEqual(bot.botTraits(seed), bot.botTraits(seed));
    assert.equal(bot.botSvg(bot.botTraits(seed), 'active', 7), bot.botSvg(bot.botTraits(seed), 'active', 7));
  }
});

test('overrides win over the seed, and unknown values are ignored', () => {
  const seed = '/Users/kevingo/Projects/agenthub';
  const base = seedTraits(seed);
  const build = bot.BOT_PARTS.build.find((b) => b !== base.build);
  assert.deepEqual(seedTraits(seed, { body: 'Blue', build }), { ...base, body: 'Blue', build });
  assert.deepEqual(seedTraits(seed, { body: 'Chartreuse', ears: 'antlers', chest: 42, antenna: null }), base);
});
