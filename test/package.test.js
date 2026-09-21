/* The package as consumers load it: both entry points by name, from ESM and
   from CommonJS, with no browser around. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { FOLK_TICK_MS } from 'robofolks';
import { mountFolk, updateFolk, setFolkState, unmountFolk, onFolkTick, currentFolkTick, prefersReducedMotion } from 'robofolks/dom';

const require = createRequire(import.meta.url);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Stands in for a DOM element. */
function fakeElement() {
  return { innerHTML: '', isConnected: true };
}

test('the core entry point works from CommonJS', () => {
  const { folkTraits, folkSvg } = require('robofolks');
  assert.match(folkSvg(folkTraits('ada'), 'waiting', 0), /^<svg /);
});

test('the dom entry point loads without a browser', () => {
  assert.equal(prefersReducedMotion(), false);
  assert.equal(typeof require('robofolks/dom').mountFolk, 'function');
});

test('the element entry point imports without a browser, for server rendering', async () => {
  const { RoboFolkElement, defineRoboFolk } = await import('robofolks/element');
  assert.equal(typeof RoboFolkElement, 'function');
  assert.doesNotThrow(() => defineRoboFolk());
});

test('mounted robots draw, update and animate on one clock', async () => {
  const el = fakeElement();
  const folk = mountFolk(el, 'ada', 'active');
  assert.match(el.innerHTML, /^<svg /);

  const before = el.innerHTML;
  updateFolk(folk, { who: { ...folk.traits, build: folk.traits.build === 'tank' ? 'ball' : 'tank' } });
  assert.notEqual(el.innerHTML, before);

  updateFolk(folk, { view: 'left' });
  assert.equal(folk.view, 'left');
  setFolkState(folk, 'needs');
  assert.equal(folk.state, 'needs');

  const ticks = [];
  const stop = onFolkTick((tick) => ticks.push(tick));
  await wait(FOLK_TICK_MS * 2.5);
  assert.ok(ticks.length >= 2, `expected ticks, got ${ticks.length}`);
  assert.equal(ticks.at(-1), currentFolkTick());

  // Once nothing's left the clock stops, so it can't keep a process alive:
  // this test finishing at all is the check.
  stop();
  unmountFolk(folk);
});

test('robots whose element left the page stop animating', async () => {
  const el = fakeElement();
  mountFolk(el, 'grace', 'active');
  el.isConnected = false;
  el.innerHTML = 'removed';
  await wait(FOLK_TICK_MS * 2.5);
  assert.equal(el.innerHTML, 'removed');
});
