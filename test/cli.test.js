/* The command line, run as a person would run it. */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { folkTraits, folkAnimatedSvg } from 'robofolks';

const CLI = new URL('../src/cli.js', import.meta.url).pathname;
const run = promisify(execFile);
const folk = (...args) => run(process.execPath, [CLI, ...args], { encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 });

/** Run it expecting a complaint, and hand back what it said. */
async function fails(...args) {
  const result = await folk(...args).then(() => null, (e) => e);
  assert.ok(result, `expected ${args.join(' ')} to fail`);
  assert.equal(result.code, 1, 'expected exit code 1');
  return String(result.stderr);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'robofolks-cli-'));
test.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));
const tempFile = (name) => path.join(tempDir, name);

test('svg writes the animated SVG, to stdout or a file', async () => {
  const { stdout } = await folk('svg', 'ada', '--state', 'active');
  assert.equal(String(stdout).trim(), folkAnimatedSvg(folkTraits('ada'), 'active'));

  const file = tempFile('ada.svg');
  await folk('svg', 'ada', '--state', 'active', '-o', file);
  assert.equal(fs.readFileSync(file, 'utf8').trim(), folkAnimatedSvg(folkTraits('ada'), 'active'));
});

test('svg --still writes one standalone frame', async () => {
  const { stdout } = await folk('svg', 'ada', '--still', '--scale', '2');
  const svg = String(stdout);
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="72" height="88"/);
  assert.doesNotMatch(svg, /@keyframes/);
});

test('png and sheet write real PNGs, with a layout file when asked', async () => {
  const png = tempFile('ada.png');
  await folk('png', 'ada', '--state', 'needs', '--scale', '2', '-o', png);
  const bytes = fs.readFileSync(png);
  assert.deepEqual([...bytes.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(bytes.readUInt32BE(16), 72, 'width');
  assert.equal(bytes.readUInt32BE(20), 88, 'height');

  const sheet = tempFile('sheet.png');
  const meta = tempFile('sheet.json');
  await folk('sheet', 'ada', '--scale', '2', '-o', sheet, '--meta', meta);
  const sheetBytes = fs.readFileSync(sheet);
  assert.equal(sheetBytes.readUInt32BE(16), 272, 'sheet width');
  const layout = JSON.parse(fs.readFileSync(meta, 'utf8'));
  assert.equal(layout.frames.length, 16);
  assert.deepEqual(layout.frames[0], { view: 'front', frame: 0, x: 0, y: 0, width: 68, height: 68 });
});

test('a piped PNG is the same bytes as the file', async () => {
  const file = tempFile('piped.png');
  await folk('png', 'grace', '-o', file);
  const { stdout } = await folk('png', 'grace');
  assert.deepEqual(new Uint8Array(stdout), new Uint8Array(fs.readFileSync(file)));
});

test('info describes the robot, as text or JSON', async () => {
  const { stdout } = await folk('info', 'ada');
  assert.match(String(stdout), /^seed {5}ada\nbody {5}Dark gray\nbuild {4}ball\n/);
  const robot = JSON.parse(String((await folk('info', 'ada', '--json')).stdout));
  assert.deepEqual(robot, { seed: 'ada', body: 'Dark gray', build: 'ball', antenna: 'dome', ears: 'fin', chest: 'lights', phase: 11 });
});

test('parts picked by hand override the seed', async () => {
  const robot = JSON.parse(String((await folk('info', 'ada', '--json', '--build', 'tank', '--body', 'Lime')).stdout));
  assert.equal(robot.build, 'tank');
  assert.equal(robot.body, 'Lime');
});

test('--help and --version say what they should', async () => {
  const help = String((await folk('--help')).stdout);
  assert.match(help, /Usage:\n {2}robofolks svg/);
  assert.equal(String((await folk()).stdout), help, 'no arguments should print help');
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(String((await folk('--version')).stdout).trim(), pkg.version);
});

test('bad usage explains itself and exits 1', async () => {
  assert.match(await fails('fly', 'ada'), /unknown command "fly"/);
  assert.match(await fails('png'), /needs a seed/);
  assert.match(await fails('svg', 'ada', 'extra'), /unexpected argument "extra"/);
  assert.match(await fails('svg', 'ada', '--state', 'sleeping'), /--state must be one of: active, needs, waiting/);
  assert.match(await fails('svg', 'ada', '--build', 'hover'), /--build must be one of: walker, tank, ball/);
  assert.match(await fails('png', 'ada', '--scale', '200'), /--scale must be a whole number from 1 to 64/);
  assert.match(await fails('png', 'ada', '--scale', '2.5'), /--scale must be a whole number/);
  assert.match(await fails('svg', 'ada', '--nope'), /Run robofolks --help/);
});
