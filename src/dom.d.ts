import type { FolkState, FolkTraits, FolkView, FolkWho } from './index.js';

export type { FolkWho };

/** Anything robots can be drawn into; a DOM element in practice. */
export interface FolkElement {
  innerHTML: string;
  readonly isConnected: boolean;
}

export interface MountedFolk {
  el: FolkElement;
  traits: FolkTraits;
  state: FolkState;
  view: FolkView | null;
}

export function mountFolk(
  el: FolkElement,
  who: FolkWho,
  state?: FolkState,
  options?: { view?: FolkView | null },
): MountedFolk;
export function updateFolk(
  folk: MountedFolk,
  changes?: { who?: FolkWho; state?: FolkState; view?: FolkView | null },
): void;
export function setFolkState(folk: MountedFolk, state: FolkState): void;
export function unmountFolk(folk: MountedFolk): void;
/** Returns a function that removes the listener. */
export function onFolkTick(fn: (tick: number) => void): () => void;
export function currentFolkTick(): number;
export function prefersReducedMotion(): boolean;
