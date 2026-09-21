export type FolkBodyName = 'Orange' | 'Pink' | 'Blue' | 'Cream' | 'Red' | 'Lime' | 'Dark gray';
export type FolkBuild = 'walker' | 'tank' | 'ball';
export type FolkAntenna = 'mast' | 'twin' | 'dome';
export type FolkEars = 'bolt' | 'fin' | 'none';
export type FolkChest = 'lights' | 'core' | 'grille';
export type FolkView = 'front' | 'back' | 'left' | 'right';
/** active: working. needs: waiting on a person. waiting: idle. */
export type FolkState = 'active' | 'needs' | 'waiting';
/** [highlight, base, shade] colors. */
export type FolkPaint = readonly [string, string, string];

export interface FolkTraits {
  body: FolkPaint;
  build: FolkBuild;
  antenna: FolkAntenna;
  ears: FolkEars;
  chest: FolkChest;
  /** Offsets the animation so a row of robots doesn't move in lockstep. */
  phase: number;
}

/** Parts picked by hand. Values it doesn't recognize are ignored. */
export interface FolkOverrides {
  body?: FolkBodyName;
  build?: FolkBuild;
  antenna?: FolkAntenna;
  ears?: FolkEars;
  chest?: FolkChest;
}

export interface FolkGlyph {
  ch: '!' | 'z' | 'Z';
  col: number;
  row: number;
  color: string;
  opacity?: number;
}

export interface FolkFrame {
  /** FOLK_H rows of FOLK_W cells, one character per pixel ('.' is empty). */
  grid: string[][];
  /** Vertical offset in grid units. */
  dy: number;
  glyphs: FolkGlyph[];
  /** Antenna and ear light color. */
  light: string;
  /** Which chest light is on (0-2), 3 for all, -1 for none. */
  lit: number;
}

/** Anything with a 2D context: a canvas element, an OffscreenCanvas, node-canvas. */
export interface FolkCanvas {
  width: number;
  height: number;
  getContext(type: '2d'): {
    fillStyle: unknown;
    clearRect(x: number, y: number, w: number, h: number): void;
    fillRect(x: number, y: number, w: number, h: number): void;
  } | null;
}

export const FOLK_TICK_MS: number;
export const FOLK_W: number;
export const FOLK_H: number;
export const FOLK_BODIES: FolkPaint[];
export const FOLK_BODY_NAMES: FolkBodyName[];
export const FOLK_PARTS: {
  build: FolkBuild[];
  antenna: FolkAntenna[];
  ears: FolkEars[];
  chest: FolkChest[];
};
export const FOLK_PART_NAMES: {
  build: Record<FolkBuild, string>;
  antenna: Record<FolkAntenna, string>;
  ears: Record<FolkEars, string>;
  chest: Record<FolkChest, string>;
};
export const FOLK_VIEWS: FolkView[];
export const FOLK_STATES: FolkState[];
export const FOLK_WALK_FRAMES: number;

/** The robot for `seed`; `overrides` win over the seed's picks. */
export function folkTraits(seed: string, overrides?: FolkOverrides | null): FolkTraits;
/** One frame of a state's animation, facing front. */
export function folkFrame(traits: FolkTraits, state: FolkState, tick: number): FolkFrame;
/** One step of the walk cycle facing `view`. */
export function folkWalkFrame(traits: FolkTraits, view: FolkView, frame: number): FolkFrame;
/** The color for each grid character in a frame. */
export function folkColors(traits: FolkTraits, state: FolkState, light: string, lit: number): Record<string, string>;
/** Walk a frame as merged horizontal runs, in grid units (a pixel is 1 wide, 2 tall). */
export function eachFolkRect(
  frame: FolkFrame,
  colors: Record<string, string>,
  fn: (x: number, y: number, width: number, height: number, color: string) => void,
): void;
/** An SVG string of one animation frame. */
export function folkSvg(traits: FolkTraits, state: FolkState, tick: number): string;
/** An SVG string of one walk-cycle frame. */
export function folkWalkSvg(traits: FolkTraits, view: FolkView, frame: number): string;
/** Paint a 4x4 walk-cycle sprite sheet (rows: views, columns: frames). */
export function paintFolkSheet<C extends FolkCanvas>(canvas: C, traits: FolkTraits, scale?: number): C;

/** A seed string, or traits for a specific build. */
export type FolkWho = string | (Omit<FolkTraits, 'phase'> & { phase?: number });

/** How many ticks each animation takes to come back round exactly. */
export const FOLK_LOOP_TICKS: Record<FolkState | 'walk', number>;
/** The whole animation loop as one self-contained SVG that plays itself with
 *  CSS (no JavaScript) and holds its first frame under prefers-reduced-motion. */
export function folkAnimatedSvg(
  who: FolkWho,
  state?: FolkState,
  options?: {
    /** Show a walk cycle facing this way instead of a state. */
    view?: FolkView | null;
    /** Pixels per grid unit; the SVG is 36 x 44 units. Default 4. */
    scale?: number;
  },
): string;
