import type { FolkAntenna, FolkBodyName, FolkBuild, FolkChest, FolkEars, FolkState, FolkTraits, FolkView } from './index.js';

/** css: animated SVG played by CSS. clock: the shared JavaScript clock.
 *  none: the first frame, held. */
export type FolkMotion = 'css' | 'clock' | 'none';

/** The element's attributes, for typing it in a framework's templates. */
export interface RoboFolkAttributes {
  seed?: string;
  state?: FolkState;
  view?: FolkView;
  motion?: FolkMotion;
  body?: FolkBodyName;
  build?: FolkBuild;
  antenna?: FolkAntenna;
  ears?: FolkEars;
  chest?: FolkChest;
}

export class RoboFolkElement extends HTMLElement {
  static observedAttributes: string[];
  seed: string;
  state: FolkState;
  view: FolkView | null;
  motion: FolkMotion;
  /** The robot being shown: the seed's traits with any parts picked by hand. */
  readonly traits: FolkTraits;
  connectedCallback(): void;
  disconnectedCallback(): void;
  attributeChangedCallback(): void;
}

/** Register the element under `name` (default robo-folk). Importing
 *  robofolks/element already registers <robo-folk>. */
export function defineRoboFolk(name?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    'robo-folk': RoboFolkElement;
  }
}
