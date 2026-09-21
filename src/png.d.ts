import type { FolkState, FolkView, FolkWho } from './index.js';

export interface FolkPixels {
  width: number;
  height: number;
  /** Straight-alpha RGBA, four bytes per pixel, row by row. */
  data: Uint8Array;
}

export interface FolkSheetFrame {
  view: FolkView;
  frame: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FolkSheetLayout {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  width: number;
  height: number;
  frames: FolkSheetFrame[];
}

/** One frame as PNG bytes, on a transparent background. */
export function folkPng(
  who: FolkWho,
  state?: FolkState,
  options?: {
    /** Walk this way instead of showing a state. */
    view?: FolkView | null;
    /** Which frame of the animation; default 0. */
    tick?: number;
    /** Device pixels per grid unit; the robot is 36 x 44 units. Default 4. */
    scale?: number;
  },
): Promise<Uint8Array>;

/** A walk-cycle sprite sheet as PNG bytes: a row per view, a column per frame. */
export function folkSheetPng(who: FolkWho, options?: { scale?: number }): Promise<Uint8Array>;

/** Where each frame sits in the sprite sheet, for a game engine's atlas. */
export function folkSheetLayout(scale?: number): FolkSheetLayout;

/** Encode RGBA pixels as PNG bytes. */
export function encodePng(pixels: FolkPixels): Promise<Uint8Array>;
