/* The React component, rendered on the server the way a framework would.
   React is a dev dependency here and an optional peer dependency of the
   package, so these tests skip when it isn't installed. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { folkTraits, folkSvg, folkWalkSvg, folkAnimatedSvg } from 'robofolks';

const react = await import('react').then((m) => m, () => null);
const server = await import('react-dom/server').then((m) => m, () => null);
const { RoboFolk } = await import('robofolks/react');

const skip = react && server ? false : 'react and react-dom are not installed';
const render = (props) => server.renderToStaticMarkup(react.createElement(RoboFolk, props));
const inside = (markup) => markup.replace(/^<span[^>]*>/, '').replace(/<\/span>$/, '');

test('renders the animated SVG on the server, ready to use unhydrated', { skip }, () => {
  const markup = render({ seed: 'ada', state: 'active' });
  assert.match(markup, /^<span role="img" aria-label="Robot avatar, working"/);
  assert.equal(inside(markup), folkAnimatedSvg(folkTraits('ada'), 'active'));
  assert.match(markup, /aspect-ratio:36 \/ 44/);
  assert.match(markup, /width:72px/);
});

test('motion="none" and a walk view render a still frame', { skip }, () => {
  const still = render({ seed: 'ada', state: 'needs', motion: 'none' });
  assert.equal(inside(still), folkSvg(folkTraits('ada'), 'needs', 0));
  const walking = render({ seed: 'ada', view: 'left', motion: 'none' });
  assert.equal(inside(walking), folkWalkSvg(folkTraits('ada'), 'left', 0));
  assert.match(walking, /aria-label="Robot avatar, walking"/);
});

test('motion="clock" renders the first frame for the client to take over', { skip }, () => {
  assert.equal(inside(render({ seed: 'ada', state: 'active', motion: 'clock' })), folkSvg(folkTraits('ada'), 'active', 0));
});

test('traits, size and extra props come through', { skip }, () => {
  const traits = folkTraits('grace', { build: 'tank' });
  const markup = render({ traits, state: 'waiting', size: 120, className: 'avatar', 'data-id': '7', title: 'Grace' });
  assert.equal(inside(markup), folkAnimatedSvg(traits, 'waiting'));
  assert.match(markup, /class="avatar"/);
  assert.match(markup, /data-id="7"/);
  assert.match(markup, /title="Grace"/);
  assert.match(markup, /width:120px/);
});

test('a page of avatars renders, each with its own CSS class names', { skip }, () => {
  const seeds = ['ada', 'grace', 'linus', 'margaret'];
  const markup = seeds.map((seed) => render({ seed, state: 'active' })).join('');
  const prefixes = [...markup.matchAll(/<svg [^>]*class="(f[0-9a-z]+)"/g)].map((m) => m[1]);
  assert.equal(prefixes.length, seeds.length);
  assert.equal(new Set(prefixes).size, seeds.length, 'class names collided');
});

test('aria-label can be overridden', { skip }, () => {
  assert.match(render({ seed: 'ada', 'aria-label': "Ada's agent" }), /aria-label="Ada&#x27;s agent"/);
});
