/* robofolks/png: robots as PNG bytes, with no dependencies.

   The robots are flat blocks of color, so rasterizing them is just filling
   rectangles; the only real work is the PNG container. Compression uses
   CompressionStream, so this runs in Node, Deno, Bun, workers and browsers. */
import {
  FOLK_VIEWBOX, FOLK_VIEWS, FOLK_WALK_FRAMES,
  folkTraits, folkFrame, folkWalkFrame, folkColors, eachFolkRect, eachGlyphRect,
} from './core.js';

const [VIEW_X, VIEW_Y, VIEW_W, VIEW_H] = FOLK_VIEWBOX;
/** A sprite sheet cell: the 32-wide robot plus a unit of room for the walk bob. */
const CELL = 34;

const toTraits = (who) => (typeof who === 'string' ? folkTraits(who) : { phase: 0, ...who });

/** Straight-alpha RGBA pixels, painted in grid units (a robot pixel is 1 unit
 *  wide and 2 tall) at `scale` device pixels per unit. */
function surface(width, height, scale) {
  const data = new Uint8Array(width * height * 4);
  const paint = (x, y, w, h, color, alpha) => {
    const [r, g, b] = [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16));
    const x0 = Math.max(0, Math.round(x * scale));
    const x1 = Math.min(width, Math.round((x + w) * scale));
    const y0 = Math.max(0, Math.round(y * scale));
    const y1 = Math.min(height, Math.round((y + h) * scale));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const i = (py * width + px) * 4;
        if (alpha >= 1) {
          data.set([r, g, b, 255], i);
          continue;
        }
        // Straight-alpha source-over, so faded glyphs blend as the SVG does.
        const under = data[i + 3] / 255;
        const out = alpha + under * (1 - alpha);
        const mix = (was, now) => Math.round((now * alpha + was * under * (1 - alpha)) / out);
        data.set([mix(data[i], r), mix(data[i + 1], g), mix(data[i + 2], b), Math.round(out * 255)], i);
      }
    }
  };
  return { width, height, data, paint };
}

/** Draw one frame onto a surface, with the frame's origin at (ox, oy) grid units. */
function paintFrame(target, traits, state, frame, ox, oy) {
  const colors = folkColors(traits, state, frame.light, frame.lit);
  eachFolkRect(frame, colors, (x, y, w, h, color) => target.paint(ox + x, oy + y, w, h, color, 1));
  for (const glyph of frame.glyphs) {
    eachGlyphRect(glyph, (x, y, w, h) => target.paint(ox + x, oy + y, w, h, glyph.color, glyph.opacity ?? 1));
  }
}

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = new Uint8Array(data.length + 12);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(out.length - 4, crc32(out.subarray(4, out.length - 4)));
  return out;
}

async function deflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Encode RGBA pixels as PNG bytes. */
export async function encodePng({ width, height, data }) {
  // One filter byte (0: no filter) in front of each row of pixels.
  const raw = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw.set(data.subarray(y * width * 4, (y + 1) * width * 4), y * (1 + width * 4) + 1);
  }
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 6, 0, 0, 0], 8); // 8 bits per channel, truecolor with alpha
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', await deflate(raw)),
    chunk('IEND', new Uint8Array(0)),
  ];
  const png = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let at = 0;
  for (const part of parts) {
    png.set(part, at);
    at += part.length;
  }
  return png;
}

/** One frame as PNG bytes: `scale` device pixels per grid unit (default 4, so
 *  144 x 176). `who` is a seed or traits, as for mountFolk. */
export async function folkPng(who, state = 'waiting', { view = null, tick = 0, scale = 4 } = {}) {
  const traits = toTraits(who);
  const frame = view ? folkWalkFrame(traits, view, tick) : folkFrame(traits, state, tick);
  const target = surface(VIEW_W * scale, VIEW_H * scale, scale);
  paintFrame(target, traits, view ? 'active' : state, frame, -VIEW_X, -VIEW_Y);
  return encodePng(target);
}

/** Where each frame sits in a sprite sheet, for a game engine's atlas. */
export function folkSheetLayout(scale = 4) {
  return {
    frameWidth: CELL * scale,
    frameHeight: CELL * scale,
    columns: FOLK_WALK_FRAMES,
    rows: FOLK_VIEWS.length,
    width: FOLK_WALK_FRAMES * CELL * scale,
    height: FOLK_VIEWS.length * CELL * scale,
    frames: FOLK_VIEWS.flatMap((view, row) => Array.from({ length: FOLK_WALK_FRAMES }, (_, column) => ({
      view,
      frame: column,
      x: column * CELL * scale,
      y: row * CELL * scale,
      width: CELL * scale,
      height: CELL * scale,
    }))),
  };
}

/** A walk-cycle sprite sheet as PNG bytes: one row per view (front, back,
 *  left, right), one column per frame, on a transparent background. */
export async function folkSheetPng(who, { scale = 4 } = {}) {
  const traits = toTraits(who);
  const layout = folkSheetLayout(scale);
  const target = surface(layout.width, layout.height, scale);
  FOLK_VIEWS.forEach((view, row) => {
    for (let frame = 0; frame < FOLK_WALK_FRAMES; frame++) {
      paintFrame(target, traits, 'active', folkWalkFrame(traits, view, frame), frame * CELL + 1, row * CELL + 1);
    }
  });
  return encodePng(target);
}
