#!/usr/bin/env node
/* robofolks command line: write a robot to a file (or stdout) as an animated
   SVG, a PNG, or a walk-cycle sprite sheet for a game engine. */
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import {
  FOLK_BODIES, FOLK_BODY_NAMES, FOLK_PARTS, FOLK_STATES, FOLK_VIEWS, FOLK_VIEWBOX,
  folkTraits, folkSvg, folkWalkSvg,
} from './core.js';
import { folkAnimatedSvg } from './animated.js';
import { folkPng, folkSheetPng, folkSheetLayout } from './png.js';

const PARTS = { body: FOLK_BODY_NAMES, ...FOLK_PARTS };
const COMMANDS = ['svg', 'png', 'sheet', 'info'];

const HELP = `robofolks - seeded pixel-robot avatars

Usage:
  robofolks svg   <seed> [options]   an animated SVG that plays itself
  robofolks png   <seed> [options]   one frame as a PNG
  robofolks sheet <seed> [options]   a 4x4 walk-cycle sprite sheet PNG
  robofolks info  <seed> [--json]    which robot a seed picks

Options:
  -o, --out <file>   write here instead of stdout
  -s, --state <s>    ${FOLK_STATES.join(' | ')} (default waiting)
  -v, --view <v>     ${FOLK_VIEWS.join(' | ')}: walk that way instead
      --scale <n>    pixels per grid unit, 1-64 (default 4, so 144x176)
      --tick <n>     which frame, for png (default 0)
      --still        svg: one frame instead of the animation
      --meta <file>  sheet: also write the frame layout as JSON
      --body <name>  ${FOLK_BODY_NAMES.join(' | ')}
      --build <b>    ${FOLK_PARTS.build.join(' | ')}
      --antenna <a>  ${FOLK_PARTS.antenna.join(' | ')}
      --ears <e>     ${FOLK_PARTS.ears.join(' | ')}
      --chest <c>    ${FOLK_PARTS.chest.join(' | ')}
  -h, --help         this text
      --version      the package version

Examples:
  robofolks svg kevingo --state active -o kevingo.svg
  robofolks sheet kevingo --scale 2 -o robot.png --meta robot.json
  robofolks png "$(pwd)" --state needs --scale 8 -o needs.png
`;

const OPTIONS = {
  out: { type: 'string', short: 'o' },
  state: { type: 'string', short: 's' },
  view: { type: 'string', short: 'v' },
  scale: { type: 'string' },
  tick: { type: 'string' },
  still: { type: 'boolean' },
  meta: { type: 'string' },
  json: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean' },
  ...Object.fromEntries(Object.keys(PARTS).map((part) => [part, { type: 'string' }])),
};

/** Something the person typed is wrong; reported without a stack trace. */
class BadUsage extends Error {}

function choice(values, name, allowed, fallback) {
  const value = values[name] ?? fallback;
  if (value !== undefined && !allowed.includes(value)) {
    throw new BadUsage(`--${name} must be one of: ${allowed.join(', ')} (got ${JSON.stringify(value)})`);
  }
  return value;
}

function whole(values, name, { min, max, fallback }) {
  if (values[name] === undefined) return fallback;
  const value = Number(values[name]);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new BadUsage(`--${name} must be a whole number from ${min} to ${max} (got ${JSON.stringify(values[name])})`);
  }
  return value;
}

const paintName = (traits) => FOLK_BODY_NAMES[FOLK_BODIES.findIndex((paint) => paint[1] === traits.body[1])];

/** A still robot as a standalone SVG: sized, with the namespace a file needs. */
function stillSvg(traits, state, view, scale) {
  const [, , w, h] = FOLK_VIEWBOX;
  const svg = view ? folkWalkSvg(traits, view, 0) : folkSvg(traits, state, 0);
  return svg.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" `);
}

/** What to write where: { body: string | bytes, out: path | null, extra? }. */
async function run(argv) {
  const { values, positionals } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true });
  if (values.help) return { body: HELP, out: values.out ?? null };
  if (values.version) {
    const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    return { body: `${pkg.version}\n`, out: null };
  }
  if (!positionals.length) return { body: HELP, out: null };

  const [command, seed, ...extra] = positionals;
  if (!COMMANDS.includes(command)) {
    throw new BadUsage(`unknown command ${JSON.stringify(command)}; try ${COMMANDS.join(', ')}`);
  }
  if (seed === undefined) throw new BadUsage(`${command} needs a seed, e.g. robofolks ${command} kevingo`);
  if (extra.length) throw new BadUsage(`unexpected argument ${JSON.stringify(extra[0])}`);

  const overrides = {};
  for (const [part, allowed] of Object.entries(PARTS)) {
    const value = choice(values, part, allowed);
    if (value !== undefined) overrides[part] = value;
  }
  const traits = folkTraits(seed, overrides);
  const state = choice(values, 'state', FOLK_STATES, 'waiting');
  const view = choice(values, 'view', FOLK_VIEWS);
  const scale = whole(values, 'scale', { min: 1, max: 64, fallback: 4 });
  const tick = whole(values, 'tick', { min: 0, max: 100_000, fallback: 0 });
  const out = values.out ?? null;

  if (command === 'info') {
    const robot = {
      seed,
      body: paintName(traits),
      build: traits.build,
      antenna: traits.antenna,
      ears: traits.ears,
      chest: traits.chest,
      phase: traits.phase,
    };
    const text = values.json
      ? `${JSON.stringify(robot, null, 2)}\n`
      : `${Object.entries(robot).map(([key, value]) => `${key.padEnd(8)} ${value}`).join('\n')}\n`;
    return { body: text, out };
  }

  if (command === 'svg') {
    const svg = values.still ? stillSvg(traits, state, view, scale) : folkAnimatedSvg(traits, state, { view, scale });
    return { body: `${svg}\n`, out };
  }

  if (command === 'png') return { body: await folkPng(traits, state, { view, tick, scale }), out };

  return {
    body: await folkSheetPng(traits, { scale }),
    out,
    extra: values.meta ? { file: values.meta, text: `${JSON.stringify(folkSheetLayout(scale), null, 2)}\n` } : null,
  };
}

try {
  const { body, out, extra } = await run(process.argv.slice(2));
  if (out) fs.writeFileSync(out, body);
  else if (typeof body === 'string') process.stdout.write(body);
  else if (process.stdout.isTTY) throw new BadUsage('not writing an image to the terminal; use --out <file> or pipe it');
  else process.stdout.write(body);
  if (extra) fs.writeFileSync(extra.file, extra.text);
} catch (e) {
  const usage = e instanceof BadUsage || e.code?.startsWith?.('ERR_PARSE_ARGS');
  process.stderr.write(`robofolks: ${usage ? e.message : (e.stack ?? e.message)}\n`);
  if (usage) process.stderr.write(`\nRun robofolks --help for usage.\n`);
  process.exitCode = 1;
}
