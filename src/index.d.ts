export type BotBodyName = 'Orange' | 'Pink' | 'Blue' | 'Cream' | 'Red' | 'Lime' | 'Dark gray';
export type BotBuild = 'walker' | 'tank' | 'ball';
export type BotAntenna = 'mast' | 'twin' | 'dome';
export type BotEars = 'bolt' | 'fin' | 'none';
export type BotChest = 'lights' | 'core' | 'grille';
export type BotView = 'front' | 'back' | 'left' | 'right';
/** active: working. needs: waiting on a person. waiting: idle. */
export type BotState = 'active' | 'needs' | 'waiting';
/** [highlight, base, shade] colors. */
export type BotPaint = readonly [string, string, string];

export interface BotTraits {
  body: BotPaint;
  build: BotBuild;
  antenna: BotAntenna;
  ears: BotEars;
  chest: BotChest;
  /** Offsets the animation so a row of robots doesn't move in lockstep. */
  phase: number;
}

/** Parts picked by hand. Values it doesn't recognize are ignored. */
export interface BotOverrides {
  body?: BotBodyName;
  build?: BotBuild;
  antenna?: BotAntenna;
  ears?: BotEars;
  chest?: BotChest;
}

export interface BotGlyph {
  ch: '!' | 'z' | 'Z';
  col: number;
  row: number;
  color: string;
  opacity?: number;
}

export interface BotFrame {
  /** BOT_H rows of BOT_W cells, one character per pixel ('.' is empty). */
  grid: string[][];
  /** Vertical offset in grid units. */
  dy: number;
  glyphs: BotGlyph[];
  /** Antenna and ear light color. */
  light: string;
  /** Which chest light is on (0-2), 3 for all, -1 for none. */
  lit: number;
}

/** Anything with a 2D context: a canvas element, an OffscreenCanvas, node-canvas. */
export interface BotCanvas {
  width: number;
  height: number;
  getContext(type: '2d'): {
    fillStyle: unknown;
    clearRect(x: number, y: number, w: number, h: number): void;
    fillRect(x: number, y: number, w: number, h: number): void;
  } | null;
}

export const BOT_TICK_MS: number;
export const BOT_W: number;
export const BOT_H: number;
export const BOT_BODIES: BotPaint[];
export const BOT_BODY_NAMES: BotBodyName[];
export const BOT_PARTS: {
  build: BotBuild[];
  antenna: BotAntenna[];
  ears: BotEars[];
  chest: BotChest[];
};
export const BOT_PART_NAMES: {
  build: Record<BotBuild, string>;
  antenna: Record<BotAntenna, string>;
  ears: Record<BotEars, string>;
  chest: Record<BotChest, string>;
};
export const BOT_VIEWS: BotView[];
export const BOT_STATES: BotState[];
export const BOT_WALK_FRAMES: number;

/** The robot for `seed`; `overrides` win over the seed's picks. */
export function botTraits(seed: string, overrides?: BotOverrides | null): BotTraits;
/** One frame of a state's animation, facing front. */
export function botFrame(traits: BotTraits, state: BotState, tick: number): BotFrame;
/** One step of the walk cycle facing `view`. */
export function botWalkFrame(traits: BotTraits, view: BotView, frame: number): BotFrame;
/** The color for each grid character in a frame. */
export function botColors(traits: BotTraits, state: BotState, light: string, lit: number): Record<string, string>;
/** Walk a frame as merged horizontal runs, in grid units (a pixel is 1 wide, 2 tall). */
export function eachBotRect(
  frame: BotFrame,
  colors: Record<string, string>,
  fn: (x: number, y: number, width: number, height: number, color: string) => void,
): void;
/** An SVG string of one animation frame. */
export function botSvg(traits: BotTraits, state: BotState, tick: number): string;
/** An SVG string of one walk-cycle frame. */
export function botWalkSvg(traits: BotTraits, view: BotView, frame: number): string;
/** Paint a 4x4 walk-cycle sprite sheet (rows: views, columns: frames). */
export function paintBotSheet<C extends BotCanvas>(canvas: C, traits: BotTraits, scale?: number): C;
