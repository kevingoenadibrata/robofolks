/* The package as consumers load it: both entry points by name, from ESM and
   from CommonJS, with no browser around. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { BOT_TICK_MS } from 'bot-avatar';
import { mountBot, updateBot, setBotState, unmountBot, onBotTick, currentBotTick, prefersReducedMotion } from 'bot-avatar/dom';

const require = createRequire(import.meta.url);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Stands in for a DOM element. */
function fakeElement() {
  return { innerHTML: '', isConnected: true };
}

test('the core entry point works from CommonJS', () => {
  const { botTraits, botSvg } = require('bot-avatar');
  assert.match(botSvg(botTraits('ada'), 'waiting', 0), /^<svg /);
});

test('the dom entry point loads without a browser', () => {
  assert.equal(prefersReducedMotion(), false);
  assert.equal(typeof require('bot-avatar/dom').mountBot, 'function');
});

test('mounted robots draw, update and animate on one clock', async () => {
  const el = fakeElement();
  const bot = mountBot(el, 'ada', 'active');
  assert.match(el.innerHTML, /^<svg /);

  const before = el.innerHTML;
  updateBot(bot, { who: { ...bot.traits, build: bot.traits.build === 'tank' ? 'ball' : 'tank' } });
  assert.notEqual(el.innerHTML, before);

  updateBot(bot, { view: 'left' });
  assert.equal(bot.view, 'left');
  setBotState(bot, 'needs');
  assert.equal(bot.state, 'needs');

  const ticks = [];
  const stop = onBotTick((tick) => ticks.push(tick));
  await wait(BOT_TICK_MS * 2.5);
  assert.ok(ticks.length >= 2, `expected ticks, got ${ticks.length}`);
  assert.equal(ticks.at(-1), currentBotTick());

  // Once nothing's left the clock stops, so it can't keep a process alive:
  // this test finishing at all is the check.
  stop();
  unmountBot(bot);
});

test('robots whose element left the page stop animating', async () => {
  const el = fakeElement();
  mountBot(el, 'grace', 'active');
  el.isConnected = false;
  el.innerHTML = 'removed';
  await wait(BOT_TICK_MS * 2.5);
  assert.equal(el.innerHTML, 'removed');
});
