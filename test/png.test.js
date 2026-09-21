/* PNG output: a real PNG container, with the robot's pixels where the grid
   says they should be. */

import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { FOLK_PARTS, folkTraits, folkFrame, folkWalkFrame, folkColors } from 'robofolks';
import { FOLK_VIEWBOX } from '../src/core.js';
import { folkPng, folkSheetPng, folkSheetLayout, encodePng } from 'robofolks/png';

const [VIEW_X, VIEW_Y] = FOLK_VIEWBOX;
const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Decode a PNG the way any reader would: check the chunks, then inflate. */
function decodePng(bytes) {
  assert.deepEqual([...bytes.subarray(0, 8)], SIGNATURE, 'not a PNG');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks = [];
  const parts = [];
  let header;
  let at = 8;
  while (at < bytes.length) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    const data = bytes.subarray(at + 8, at + 8 + length);
    assert.equal(view.getUint32(at + 8 + length), zlib.crc32(bytes.subarray(at + 4, at + 8 + length)), `bad CRC on ${type}`);
    chunks.push(type);
    if (type === 'IDAT') parts.push(data);
    if (type === 'IHDR') {
      const [width, height] = [view.getUint32(at + 8), view.getUint32(at + 12)];
      header = { width, height, depth: data[8], colorType: data[9] };
    }
    at += 12 + length;
  }
  assert.deepEqual(chunks, ['IHDR', 'IDAT', 'IEND'], 'unexpected chunks');
  const { width, height, depth, colorType } = header;
  assert.equal(depth, 8);
  assert.equal(colorType, 6, 'expected truecolor with alpha');
  const raw = zlib.inflateSync(Buffer.concat(parts));
  assert.equal(raw.length, height * (1 + width * 4), 'wrong pixel data length');
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    assert.equal(raw[y * (1 + width * 4)], 0, 'expected unfiltered rows');
    pixels.set(raw.subarray(y * (1 + width * 4) + 1, (y + 1) * (1 + width * 4)), y * width * 4);
  }
  return {
    width,
    height,
    at(x, y) {
      const i = (y * width + x) * 4;
      return [...pixels.subarray(i, i + 4)];
    },
  };
}

const rgba = (hex, alpha = 255) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)).concat(alpha);

/** Check every pixel of the grid against the middle of its block. */
function checkFrame(image, traits, state, frame, scale, ox, oy) {
  const colors = folkColors(traits, state, frame.light, frame.lit);
  frame.grid.forEach((cells, row) => {
    cells.forEach((cell, column) => {
      if (cell === '.' || cell === 'l') return; // a shut eye is a thin slit; skip it
      const x = Math.round((ox + column + 0.5) * scale);
      const y = Math.round((oy + row * 2 + frame.dy + 1) * scale);
      assert.deepEqual(image.at(x, y), rgba(colors[cell]), `pixel ${column},${row} (${cell})`);
    });
  });
}

test('one frame as a PNG holds the robot', async () => {
  for (const build of FOLK_PARTS.build) {
    const traits = folkTraits('ada', { build });
    for (const state of ['active', 'waiting', 'needs']) {
      const scale = 4;
      const image = decodePng(await folkPng(traits, state, { scale }));
      assert.equal(image.width, 36 * scale);
      assert.equal(image.height, 44 * scale);
      checkFrame(image, traits, state, folkFrame(traits, state, 0), scale, -VIEW_X, -VIEW_Y);
      assert.deepEqual(image.at(0, 0), [0, 0, 0, 0], 'corner should be transparent');
    }
  }
});

test('a later tick and a walk view draw that frame', async () => {
  const traits = folkTraits('grace');
  const image = decodePng(await folkPng(traits, 'active', { tick: 7, scale: 3 }));
  checkFrame(image, traits, 'active', folkFrame(traits, 'active', 7), 3, -VIEW_X, -VIEW_Y);
  const walking = decodePng(await folkPng(traits, 'active', { view: 'left', tick: 2, scale: 3 }));
  checkFrame(walking, traits, 'active', folkWalkFrame(traits, 'left', 2), 3, -VIEW_X, -VIEW_Y);
});

test('glyphs blend, so a fading z is half transparent', async () => {
  const traits = folkTraits('ada');
  const scale = 4;
  const image = decodePng(await folkPng(traits, 'waiting', { tick: 20, scale }));
  const frame = folkFrame(traits, 'waiting', 20);
  const faded = frame.glyphs.find((glyph) => (glyph.opacity ?? 1) < 1);
  assert.ok(faded, 'expected a fading glyph');
  const [x, y] = [Math.round((faded.col - VIEW_X + 0.5) * scale), Math.round((faded.row * 2 - VIEW_Y + 1) * scale)];
  const pixel = image.at(x, y);
  assert.deepEqual(pixel.slice(0, 3), rgba(faded.color).slice(0, 3), 'glyph color');
  assert.equal(pixel[3], Math.round(faded.opacity * 255), 'glyph alpha');
});

test('the sprite sheet lays every view and frame out where the layout says', async () => {
  const traits = folkTraits('ada');
  const scale = 2;
  const layout = folkSheetLayout(scale);
  const image = decodePng(await folkSheetPng(traits, { scale }));
  assert.equal(image.width, layout.width);
  assert.equal(image.height, layout.height);
  assert.equal(layout.frames.length, 16);
  for (const cell of layout.frames) {
    const frame = folkWalkFrame(traits, cell.view, cell.frame);
    checkFrame(image, traits, 'active', frame, scale, cell.x / scale + 1, cell.y / scale + 1);
  }
});

test('encodePng handles an empty image and odd sizes', async () => {
  const image = decodePng(await encodePng({ width: 3, height: 2, data: new Uint8Array(3 * 2 * 4) }));
  assert.equal(image.width, 3);
  assert.equal(image.height, 2);
  assert.deepEqual(image.at(2, 1), [0, 0, 0, 0]);
});
