#!/usr/bin/env node
/* Regenerates the README images in docs/. Run `npm run images` after changing
   how robots are drawn. Each robot keeps its own <svg> (and its own CSS class
   names), nested inside one wrapper, so a gallery animates as one file. */
import fs from 'node:fs';
import { folkTraits, folkAnimatedSvg } from '../src/index.js';
import { FOLK_VIEWBOX } from '../src/core.js';
import { folkSheetPng } from '../src/png.js';

const DOCS = new URL('../docs/', import.meta.url);
const [, , UNIT_W, UNIT_H] = FOLK_VIEWBOX;
const GAP = 2;

/** Lay robots out in a row, each in its own nested <svg>. */
function gallery(robots, { scale = 3 } = {}) {
  const width = robots.length * UNIT_W + (robots.length - 1) * GAP;
  const parts = robots.map(({ seed, overrides, state, view }, i) => {
    const svg = folkAnimatedSvg(folkTraits(seed, overrides), state, { view, scale });
    // Drop the outer sizing so the nested <svg> scales with the wrapper.
    const inner = svg.replace(/^<svg [^>]*?(viewBox=)/, '<svg $1');
    return inner.replace('<svg ', `<svg x="${i * (UNIT_W + GAP)}" y="0" width="${UNIT_W}" height="${UNIT_H}" `);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${UNIT_H * scale}"`
    + ` viewBox="0 0 ${width} ${UNIT_H}" shape-rendering="crispEdges">${parts.join('')}</svg>\n`;
}

fs.mkdirSync(DOCS, { recursive: true });

// A row of robots: the three builds, working, idle and needing you.
fs.writeFileSync(new URL('robots.svg', DOCS), gallery([
  { seed: 'nova', overrides: { build: 'walker', body: 'Orange' }, state: 'active' },
  { seed: 'grace', overrides: { build: 'tank', body: 'Blue' }, state: 'active' },
  { seed: 'linus', overrides: { build: 'ball', body: 'Pink' }, state: 'needs' },
  { seed: 'margaret', overrides: { build: 'walker', body: 'Lime' }, state: 'waiting' },
  { seed: 'alan', overrides: { build: 'tank', body: 'Cream' }, state: 'active', view: 'left' },
]));

// The same seed in each state, for the states section.
fs.writeFileSync(new URL('states.svg', DOCS), gallery([
  { seed: 'kevingo', state: 'active' },
  { seed: 'kevingo', state: 'needs' },
  { seed: 'kevingo', state: 'waiting' },
]));

fs.writeFileSync(new URL('sprite-sheet.png', DOCS), await folkSheetPng('grace', { scale: 3 }));

console.log('Wrote docs/robots.svg, docs/states.svg, docs/sprite-sheet.png');
